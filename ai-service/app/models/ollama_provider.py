import os
import json
import httpx
from typing import Dict, Any, List, Optional
from app.models.provider import ModelProvider

class OllamaProvider(ModelProvider):
    """
    Ollama Model Provider for local LLM inference and tool calling.
    Communicates with the local Ollama daemon over HTTP (/api/chat and /api/tags).
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None
    ):
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3")
        self.timeout = timeout or float(os.getenv("OLLAMA_TIMEOUT", "30.0"))

    @property
    def name(self) -> str:
        return "ollama"

    async def get_health_status(self) -> Dict[str, Any]:
        """
        Inspects the local Ollama server via GET /api/tags.
        Returns reachability, installed models, and whether the configured model is installed.
        """
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    raw_models = data.get("models", [])
                    installed_models = [m.get("name") for m in raw_models if m.get("name")]
                    
                    # Check if configured model or tagged variant (e.g. llama3:latest) exists
                    model_found = any(
                        m == self.model or m.startswith(f"{self.model}:") or self.model.startswith(f"{m}:")
                        for m in installed_models
                    )
                    
                    return {
                        "reachable": True,
                        "base_url": self.base_url,
                        "model": self.model,
                        "installed_models": installed_models,
                        "model_installed": model_found,
                        "error": None
                    }
                else:
                    return {
                        "reachable": False,
                        "base_url": self.base_url,
                        "model": self.model,
                        "installed_models": [],
                        "model_installed": False,
                        "error": f"Ollama HTTP {res.status_code}: {res.text}"
                    }
        except httpx.ConnectError:
            return {
                "reachable": False,
                "base_url": self.base_url,
                "model": self.model,
                "installed_models": [],
                "model_installed": False,
                "error": f"Connection refused at {self.base_url}. Ollama is not running."
            }
        except httpx.TimeoutException:
            return {
                "reachable": False,
                "base_url": self.base_url,
                "model": self.model,
                "installed_models": [],
                "model_installed": False,
                "error": f"Connection timed out connecting to {self.base_url}."
            }
        except Exception as e:
            return {
                "reachable": False,
                "base_url": self.base_url,
                "model": self.model,
                "installed_models": [],
                "model_installed": False,
                "error": str(e)
            }

    async def is_available(self) -> bool:
        """
        Pings Ollama's /api/tags endpoint to verify if the daemon is running.
        """
        health = await self.get_health_status()
        return health["reachable"]

    async def chat(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Executes a chat completion call to Ollama POST /api/chat.
        Supports native tool calling via the 'tools' parameter.
        Returns the assistant message dict: {"role": "assistant", "content": "...", "tool_calls": [...]}
        """
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False
        }
        if tools and len(tools) > 0:
            payload["tools"] = tools

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(f"{self.base_url}/api/chat", json=payload)
        except httpx.ConnectError:
            raise RuntimeError(
                f"Ollama is unreachable at {self.base_url}. "
                "Ensure Ollama is installed and running (`ollama serve`), or switch provider mode to 'demo'."
            )
        except httpx.TimeoutException:
            raise TimeoutError(
                f"Ollama request to {self.base_url} timed out after {self.timeout}s."
            )
        except Exception as e:
            raise RuntimeError(f"Failed to communicate with Ollama: {str(e)}")

        if res.status_code == 404:
            raise RuntimeError(
                f"Model '{self.model}' not found in Ollama. "
                f"Run `ollama pull {self.model}` in your terminal, or configure an installed model."
            )
        elif res.status_code != 200:
            raise RuntimeError(f"Ollama API returned HTTP {res.status_code}: {res.text}")

        try:
            data = res.json()
            message = data.get("message", {})
            return message
        except Exception as e:
            raise RuntimeError(f"Failed to parse Ollama response JSON: {str(e)}")

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Calls Ollama chat endpoint for standard text completion.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        message = await self.chat(messages)
        return message.get("content", "")

    async def answer_question(self, question: str, passages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Grounds the answer strictly on retrieved source passages.
        Explicitly warns the model to refuse unsupported questions.
        """
        if not passages:
            return {
                "answer": "No relevant source passages were found in the uploaded documents to answer this question.",
                "supported": False,
                "citations": [],
                "provider": "ollama",
                "model": self.model
            }

        # Build context from passages
        context_blocks = []
        citations = []
        for idx, p in enumerate(passages, 1):
            doc_id = p.get("document_id")
            page_no = p.get("page_number", 1)
            content = p.get("content", "").strip()
            context_blocks.append(f"Passage [{idx}] (Document ID: {doc_id}, Page: {page_no}):\n{content}")
            citations.append({
                "passage_index": idx,
                "document_id": doc_id,
                "page_number": page_no,
                "chunk_id": p.get("id") or p.get("chunk_index")
            })

        context_str = "\n\n".join(context_blocks)

        system_prompt = (
            "You are ORBIT AI, an accurate knowledge assistant. "
            "You must answer questions strictly and solely using the provided retrieved passages. "
            "If the answer cannot be determined from the passages, state clearly: "
            "'I cannot answer this question based on the provided documents.' "
            "Cite passages using [1], [2], etc. Do not assume or invent facts outside the text."
        )

        user_prompt = (
            f"Question: {question}\n\n"
            f"Retrieved Passages:\n{context_str}\n\n"
            f"Provide a concise, grounded answer citing relevant passages."
        )

        answer_text = await self.generate_text(user_prompt, system_prompt=system_prompt)

        return {
            "answer": answer_text,
            "supported": True,
            "citations": citations,
            "provider": "ollama",
            "model": self.model
        }

    async def execute_task(self, task_type: str, input_text: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        params = parameters or {}
        system_prompt = f"You are an AI task worker executing a '{task_type}' task."
        user_prompt = f"Task: {task_type}\nParameters: {json.dumps(params)}\nInput Content:\n{input_text}"

        result_text = await self.generate_text(user_prompt, system_prompt=system_prompt)
        return {
            "task": task_type,
            "result": result_text,
            "provider": "ollama",
            "model": self.model
        }

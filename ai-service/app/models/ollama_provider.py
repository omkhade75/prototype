import os
import json
import httpx
from typing import Dict, Any, List, Optional
from app.models.provider import ModelProvider

class OllamaProvider(ModelProvider):
    """
    Ollama Model Provider for local LLM inference (e.g. llama3, mistral, phi3).
    Communicates with the local Ollama daemon over HTTP.
    """

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3")

    @property
    def name(self) -> str:
        return "ollama"

    async def is_available(self) -> bool:
        """
        Pings Ollama's /api/tags endpoint to verify if the daemon is running.
        """
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Calls Ollama generate endpoint.
        """
        if not await self.is_available():
            raise RuntimeError(
                f"Ollama is unreachable at {self.base_url}. "
                f"Please ensure Ollama is installed and running (`ollama serve`), or switch provider mode to 'demo'."
            )

        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(f"{self.base_url}/api/generate", json=payload)
            if res.status_code != 200:
                raise RuntimeError(f"Ollama API returned HTTP {res.status_code}: {res.text}")
            data = res.json()
            return data.get("response", "")

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
                "provider": "ollama"
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

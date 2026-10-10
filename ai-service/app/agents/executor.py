import time
import json
import re
from typing import Dict, Any, List, Optional
from app.tools.registry import tool_registry
from app.models.factory import get_provider

class AgentExecutor:
    """
    Bounded Agent Execution Loop for ORBIT AI.
    Executes reasoning and tool calls step-by-step with strict limits,
    recording every tool execution for full student observability.
    """

    MAX_TOOL_CALLS = 5

    def __init__(self, provider_name: Optional[str] = None, model: Optional[str] = None):
        self.provider = get_provider(provider_name)
        if model and hasattr(self.provider, "model"):
            self.provider.model = model

    async def run(
        self,
        user_message: str,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
        max_steps: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Executes a bounded conversational agent session.
        """
        if not user_message or not user_message.strip():
            raise ValueError("Agent user prompt message cannot be empty or blank.")

        start_time = time.perf_counter()
        limit = min(max_steps or self.MAX_TOOL_CALLS, self.MAX_TOOL_CALLS)
        chunks = context_chunks or []
        
        steps: List[Dict[str, Any]] = []
        status = "successful"
        error_message = None
        final_response = ""

        try:
            if self.provider.name == "demo":
                final_response = await self._run_demo_loop(user_message, chunks, steps, limit)
            else:
                final_response = await self._run_llm_loop(user_message, chunks, steps, limit)

        except Exception as e:
            status = "failed"
            error_message = str(e)
            final_response = f"Agent execution encountered an error: {error_message}"

        total_duration = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "status": status,
            "provider": self.provider.name,
            "model": getattr(self.provider, "model", "deterministic-engine"),
            "total_steps": len(steps),
            "duration_ms": total_duration,
            "steps": steps,
            "final_response": final_response,
            "error_message": error_message
        }

    async def _run_demo_loop(
        self,
        message: str,
        chunks: List[Dict[str, Any]],
        steps: List[Dict[str, Any]],
        max_steps: int
    ) -> str:
        """
        Deterministic agent loop for Demo mode.
        Determines appropriate tool based on intent, executes safely, and formulates response.
        """
        msg_lower = message.lower()

        # Step 1: Decide tool to use
        if any(w in msg_lower for w in ["quiz", "questions", "test me"]):
            from app.agents.quiz_generator import extract_quiz_parameters
            topic, num_q = extract_quiz_parameters(message)
            thought = f"Identified quiz request on concise topic '{topic}' ({num_q} question(s)). Retrieving knowledge base for grounding."
            tool_name = "generate_quiz"
            args = {"topic": topic, "num_questions": num_q}
            tool_res = tool_registry.execute_tool(tool_name, args, context_chunks=chunks)
            steps.append({
                "step_number": len(steps) + 1,
                "thought": thought,
                "tool_name": tool_name,
                "tool_args": args,
                "tool_result": tool_res["result"],
                "status": tool_res["status"],
                "duration_ms": tool_res["duration_ms"]
            })

            res_data = tool_res["result"]
            if not res_data.get("supported", True) or not res_data.get("questions"):
                err_msg = res_data.get("message") or f"Could not generate a grounded quiz for topic '{topic}'."
                return (
                    f"[Demo Agent] {err_msg}\n\n"
                    "Note: Demo mode only generates quizzes supported by verifiable facts in the uploaded knowledge base."
                )

            header = f"[Demo Agent] Grounded Quiz on '{topic}' ({res_data.get('questions_count')} question(s)):\n"
            if res_data.get("notes"):
                header += f"Note: {res_data['notes']}\n"
            header += "\n"

            formatted_q = []
            for q in res_data["questions"]:
                q_text = (
                    f"Q{q['question_number']}: {q['question']}\n"
                    + "\n".join(q['options'])
                    + f"\nCorrect Answer: {q['correct_answer']}"
                    + f"\nExplanation: {q['explanation']} ({q.get('citation', 'Verifiable Source')})"
                )
                formatted_q.append(q_text)

            return header + "\n\n".join(formatted_q)

        elif any(w in msg_lower for w in ["summarize", "summary", "overview"]):
            thought = "User requested a summary. I will invoke the `summarize_document` tool."
            tool_name = "summarize_document"
            args = {"document_id": 1, "focus": "general"}
            tool_res = tool_registry.execute_tool(tool_name, args, context_chunks=chunks)
            steps.append({
                "step_number": len(steps) + 1,
                "thought": thought,
                "tool_name": tool_name,
                "tool_args": args,
                "tool_result": tool_res["result"],
                "status": tool_res["status"],
                "duration_ms": tool_res["duration_ms"]
            })
            return f"[Demo Agent] Document Summary:\n{tool_res['result'].get('summary', 'No summary available.')}"

        elif any(w in msg_lower for w in ["structure", "json", "key takeaways", "extract"]):
            thought = "User asked for structured analysis. I will call `structured_result` tool."
            tool_name = "structured_result"
            args = {
                "title": "Analysis of Query",
                "summary": f"Executive summary based on: {message[:60]}",
                "key_takeaways": ["Deterministic tool execution", "Validated parameter schema", "Full observability"],
                "tags": ["agent", "demo-mode", "orbit-ai"]
            }
            tool_res = tool_registry.execute_tool(tool_name, args, context_chunks=chunks)
            steps.append({
                "step_number": len(steps) + 1,
                "thought": thought,
                "tool_name": tool_name,
                "tool_args": args,
                "tool_result": tool_res["result"],
                "status": tool_res["status"],
                "duration_ms": tool_res["duration_ms"]
            })
            return f"[Demo Agent] Structured Result Formatted:\n" + json.dumps(tool_res["result"], indent=2)

        else:
            # Default: Search knowledge base first
            thought = f"Searching uploaded knowledge base for query: '{message}'"
            tool_name = "search_knowledge_base"
            args = {"query": message, "top_k": 3}
            tool_res = tool_registry.execute_tool(tool_name, args, context_chunks=chunks)
            steps.append({
                "step_number": len(steps) + 1,
                "thought": thought,
                "tool_name": tool_name,
                "tool_args": args,
                "tool_result": tool_res["result"],
                "status": tool_res["status"],
                "duration_ms": tool_res["duration_ms"]
            })

            matched = tool_res["result"].get("matched_count", 0)
            if matched > 0:
                passages = tool_res["result"].get("passages", [])
                top_p = passages[0]
                return (
                    f"[Demo Agent] Found {matched} relevant passage(s) in knowledge base.\n\n"
                    f"Top passage from Document #{top_p.get('document_id')} (Page {top_p.get('page_number')}):\n"
                    f"\"{top_p.get('content')}\"\n\n"
                    f"Score: {top_p.get('score')}"
                )
            else:
                return f"[Demo Agent] Searched knowledge base for '{message}', but no passages matched the query terms."

    async def _run_llm_loop(
        self,
        message: str,
        chunks: List[Dict[str, Any]],
        steps: List[Dict[str, Any]],
        max_steps: int
    ) -> str:
        """
        Real Ollama native tool-calling agent loop.
        Uses POST /api/chat with tool definitions and conversational tool-return turns.
        Strictly limits tool execution to 5 calls and validates all arguments against schema.
        """
        # 1. Health check to ensure Ollama is accessible
        if hasattr(self.provider, "get_health_status"):
            health = await self.provider.get_health_status()
            if not health.get("reachable"):
                raise RuntimeError(
                    f"Ollama is unreachable at {self.provider.base_url}. "
                    "Please ensure the Ollama service is running (`ollama serve`), or switch provider mode to 'demo'."
                )

        # 2. Prepare conversation messages
        system_prompt = (
            "You are ORBIT AI, an autonomous local AI engineering assistant with access to verified tools. "
            "When the user asks a question or gives an instruction, you MUST use the provided tools to "
            "search the knowledge base, summarize documents, generate grounded quizzes, or format structured data. "
            "Do not guess or fabricate information. Ground your final response in the actual tool results."
        )

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]

        # 3. Obtain tool definitions formatted for Ollama /api/chat
        ollama_tools = tool_registry.get_ollama_tools()
        executed_tool_calls = 0

        for step_idx in range(max_steps):
            # Call Ollama /api/chat with current conversation and tools
            assistant_msg = await self.provider.chat(messages, tools=ollama_tools)
            tool_calls = assistant_msg.get("tool_calls", [])

            # Case A: Model provided a final text response without tool calls
            if not tool_calls:
                final_text = assistant_msg.get("content", "").strip()
                if not final_text:
                    return "[Ollama Agent] Completed execution without additional text output."
                return final_text

            # Case B: Model requested one or more tool calls
            # Append assistant's tool-call message to conversation history
            messages.append(assistant_msg)

            for t_call in tool_calls:
                if executed_tool_calls >= self.MAX_TOOL_CALLS:
                    return f"[Ollama Agent] Terminated: Reached maximum execution limit of {self.MAX_TOOL_CALLS} tool calls."

                func = t_call.get("function", {})
                tool_name = func.get("name", "")
                raw_args = func.get("arguments", {})

                # Parse arguments if serialized as string
                if isinstance(raw_args, str):
                    try:
                        parsed_args = json.loads(raw_args)
                    except Exception as e:
                        tool_err = f"Malformed argument JSON for tool '{tool_name}': {str(e)}"
                        steps.append({
                            "step_number": len(steps) + 1,
                            "thought": f"Ollama requested tool '{tool_name}' with malformed JSON arguments.",
                            "tool_name": tool_name,
                            "tool_args": {"raw": raw_args},
                            "tool_result": {"error": tool_err},
                            "status": "failed",
                            "duration_ms": 0
                        })
                        messages.append({
                            "role": "tool",
                            "content": json.dumps({"error": tool_err})
                        })
                        executed_tool_calls += 1
                        continue
                else:
                    parsed_args = raw_args or {}

                # Security & Schema Validation: Check against permitted tool allowlist
                if tool_name not in tool_registry.tools:
                    tool_err = f"Tool '{tool_name}' is not in the permitted tool allowlist."
                    steps.append({
                        "step_number": len(steps) + 1,
                        "thought": f"Model requested unauthorized tool '{tool_name}'. Denying execution.",
                        "tool_name": tool_name,
                        "tool_args": parsed_args,
                        "tool_result": {"error": tool_err},
                        "status": "failed",
                        "duration_ms": 0
                    })
                    messages.append({
                        "role": "tool",
                        "content": json.dumps({"error": tool_err})
                    })
                    executed_tool_calls += 1
                    continue

                # Validate argument schema
                try:
                    tool_registry.validate_args(tool_name, parsed_args)
                except ValueError as ve:
                    tool_err = f"Schema validation failed for '{tool_name}': {str(ve)}"
                    steps.append({
                        "step_number": len(steps) + 1,
                        "thought": f"Tool argument validation failed for '{tool_name}'.",
                        "tool_name": tool_name,
                        "tool_args": parsed_args,
                        "tool_result": {"error": tool_err},
                        "status": "failed",
                        "duration_ms": 0
                    })
                    messages.append({
                        "role": "tool",
                        "content": json.dumps({"error": tool_err})
                    })
                    executed_tool_calls += 1
                    continue

                # Execute permitted tool safely
                thought = f"Model requested tool `{tool_name}` with validated parameters."
                tool_res = tool_registry.execute_tool(tool_name, parsed_args, context_chunks=chunks)
                executed_tool_calls += 1

                steps.append({
                    "step_number": len(steps) + 1,
                    "thought": thought,
                    "tool_name": tool_name,
                    "tool_args": parsed_args,
                    "tool_result": tool_res["result"],
                    "status": tool_res["status"],
                    "duration_ms": tool_res["duration_ms"]
                })

                # Append tool result turn for Ollama
                messages.append({
                    "role": "tool",
                    "content": json.dumps(tool_res["result"])
                })

        return f"[Ollama Agent] Reached maximum allowed tool execution limit of {self.MAX_TOOL_CALLS} steps."

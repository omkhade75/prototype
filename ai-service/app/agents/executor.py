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

    def __init__(self, provider_name: Optional[str] = None):
        self.provider = get_provider(provider_name)

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
            thought = "User wants a quiz. I will invoke the `generate_quiz` tool."
            tool_name = "generate_quiz"
            args = {"topic": message[:40].strip(), "num_questions": 3}
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
            return (
                f"[Demo Agent] Generated a 3-question quiz for topic '{args['topic']}':\n"
                + "\n\n".join([
                    f"Q{q['question_number']}: {q['question']}\n" + "\n".join(q['options']) + f"\nCorrect: {q['correct_answer']} ({q['explanation']})"
                    for q in tool_res["result"]["questions"]
                ])
            )

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
        LLM agent loop with tool-calling prompt and argument validation.
        """
        tool_defs = tool_registry.get_tool_definitions()
        system_prompt = (
            "You are an AI assistant in ORBIT AI with access to the following tools:\n"
            f"{json.dumps(tool_defs, indent=2)}\n\n"
            "To use a tool, reply ONLY with a JSON object in this format:\n"
            '{"action": "tool_call", "thought": "Why you are using this tool", "tool_name": "...", "arguments": {...}}\n'
            "If you have enough information to answer the user directly without tools, reply with:\n"
            '{"action": "final_response", "thought": "Final explanation", "response": "Your answer here"}'
        )

        current_prompt = f"User Request: {message}"

        for step_idx in range(max_steps):
            llm_text = await self.provider.generate_text(current_prompt, system_prompt=system_prompt)
            
            # Parse JSON action
            parsed_action = self._parse_json_action(llm_text)
            if not parsed_action:
                # Model did not return structured action, return as final response
                return llm_text

            action_type = parsed_action.get("action")
            thought = parsed_action.get("thought", "Analyzing step")

            if action_type == "final_response":
                return parsed_action.get("response", llm_text)

            elif action_type == "tool_call":
                t_name = parsed_action.get("tool_name")
                t_args = parsed_action.get("arguments", {})
                
                # Execute bounded tool safely
                t_res = tool_registry.execute_tool(t_name, t_args, context_chunks=chunks)
                
                steps.append({
                    "step_number": step_idx + 1,
                    "thought": thought,
                    "tool_name": t_name,
                    "tool_args": t_args,
                    "tool_result": t_res["result"],
                    "status": t_res["status"],
                    "duration_ms": t_res["duration_ms"]
                })

                if t_res["status"] == "failed":
                    current_prompt += f"\nTool '{t_name}' failed: {t_res['error']}. Provide final response."
                else:
                    current_prompt += f"\nTool '{t_name}' returned: {json.dumps(t_res['result'])}. What next?"
            else:
                return llm_text

        return "Agent reached maximum tool call limit of 5 steps."

    def _parse_json_action(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Attempts to extract JSON block from model response.
        """
        try:
            # Look for JSON between curly braces
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception:
            pass
        return None

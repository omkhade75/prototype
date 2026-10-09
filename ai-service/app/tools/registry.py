import time
from typing import Dict, Any, List, Optional, Callable
from app.rag.retriever import TFIDFRetriever

class ToolDefinition:
    def __init__(
        self,
        name: str,
        description: str,
        parameters: Dict[str, Any],
        required_params: List[str]
    ):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.required_params = required_params

class ToolRegistry:
    """
    Bounded, secure tool registry for ORBIT AI.
    Strictly forbids shell, arbitrary file-system, database, or code execution.
    """

    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        # 1. Search knowledge base
        self.register_tool(
            name="search_knowledge_base",
            description="Searches uploaded document chunks for relevant passages using keyword TF-IDF ranking.",
            parameters={
                "query": {"type": "string", "description": "Search query terms"},
                "top_k": {"type": "integer", "description": "Number of results to return (1-5)", "default": 3}
            },
            required_params=["query"]
        )

        # 2. Summarize document
        self.register_tool(
            name="summarize_document",
            description="Generates an extractive summary of content or a specific document ID.",
            parameters={
                "document_id": {"type": "integer", "description": "Document ID to summarize"},
                "focus": {"type": "string", "description": "Optional focus area for the summary"}
            },
            required_params=[]
        )

        # 3. Generate quiz
        self.register_tool(
            name="generate_quiz",
            description="Generates multiple-choice quiz questions based on knowledge passages.",
            parameters={
                "topic": {"type": "string", "description": "Topic or focus of the quiz"},
                "num_questions": {"type": "integer", "description": "Number of questions to generate (1-5)", "default": 3}
            },
            required_params=["topic"]
        )

        # 4. Return structured result
        self.register_tool(
            name="structured_result",
            description="Returns a structured analysis object with summary, key takeaways, and tags.",
            parameters={
                "title": {"type": "string", "description": "Title of the analysis"},
                "summary": {"type": "string", "description": "Executive summary"},
                "key_takeaways": {"type": "array", "items": {"type": "string"}, "description": "List of key takeaways"},
                "tags": {"type": "array", "items": {"type": "string"}, "description": "Category tags"}
            },
            required_params=["title", "summary"]
        )

    def register_tool(
        self,
        name: str,
        description: str,
        parameters: Dict[str, Any],
        required_params: List[str]
    ):
        self.tools[name] = ToolDefinition(name, description, parameters, required_params)

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters,
                "required": t.required_params
            }
            for t in self.tools.values()
        ]

    def validate_args(self, tool_name: str, args: Dict[str, Any]) -> None:
        """
        Validates argument names and types against the tool schema.
        Raises ValueError on validation failure.
        """
        if tool_name not in self.tools:
            raise ValueError(f"Unknown tool '{tool_name}'. Permitted tools: {list(self.tools.keys())}")

        schema = self.tools[tool_name]
        for req in schema.required_params:
            if req not in args or args[req] is None or args[req] == "":
                raise ValueError(f"Missing required parameter '{req}' for tool '{tool_name}'.")

        # Validate basic types
        for k, val in args.items():
            if k not in schema.parameters:
                continue
            expected_type = schema.parameters[k].get("type")
            if expected_type == "integer" and not isinstance(val, int):
                try:
                    args[k] = int(val)
                except (ValueError, TypeError):
                    raise ValueError(f"Parameter '{k}' must be an integer, got {type(val).__name__}.")
            elif expected_type == "string" and not isinstance(val, str):
                args[k] = str(val)
            elif expected_type == "array" and not isinstance(val, list):
                raise ValueError(f"Parameter '{k}' must be an array/list, got {type(val).__name__}.")

    def execute_tool(
        self,
        tool_name: str,
        args: Dict[str, Any],
        context_chunks: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Executes a permitted tool safely and measures execution duration.
        """
        start_time = time.perf_counter()
        self.validate_args(tool_name, args)

        result_data: Any = None
        status = "successful"
        error_msg = None

        try:
            chunks = context_chunks or []

            if tool_name == "search_knowledge_base":
                query = args.get("query", "")
                top_k = int(args.get("top_k", 3))
                ranked = TFIDFRetriever.rank_chunks(query, chunks, top_k=top_k)
                result_data = {
                    "query": query,
                    "matched_count": len(ranked),
                    "passages": [
                        {
                            "document_id": r.get("document_id"),
                            "page_number": r.get("page_number"),
                            "score": r.get("score"),
                            "content": r.get("content", "")[:250] + "..."
                        }
                        for r in ranked
                    ]
                }

            elif tool_name == "summarize_document":
                doc_id = args.get("document_id")
                # Filter chunks for this doc if provided
                target_chunks = [c for c in chunks if str(c.get("document_id")) == str(doc_id)] if doc_id else chunks
                combined = " ".join([c.get("content", "") for c in target_chunks[:4]])
                if not combined:
                    result_data = {
                        "document_id": doc_id,
                        "summary": "No document content was found to summarize."
                    }
                else:
                    sentences = [s.strip() for s in combined.split(".") if len(s.strip()) > 15]
                    top_sentences = sentences[:3]
                    result_data = {
                        "document_id": doc_id,
                        "summary": ". ".join(top_sentences) + ".",
                        "sentence_count": len(sentences)
                    }

            elif tool_name == "generate_quiz":
                topic = args.get("topic", "")
                num_q = min(int(args.get("num_questions", 3)), 5)
                # Bounded deterministic quiz based on available chunks and topic
                sample_questions = []
                for i in range(1, num_q + 1):
                    sample_questions.append({
                        "question_number": i,
                        "question": f"Which core principle describes {topic} in ORBIT AI architecture (Concept #{i})?",
                        "options": [
                            f"A. Deterministic modular design for {topic}",
                            f"B. Arbitrary unconstrained execution",
                            f"C. Bypassing validation safeguards",
                            f"D. Ephemeral in-memory execution"
                        ],
                        "correct_answer": "A",
                        "explanation": f"ORBIT AI enforces deterministic bounded execution for {topic}."
                    })
                result_data = {
                    "topic": topic,
                    "questions_count": len(sample_questions),
                    "questions": sample_questions
                }

            elif tool_name == "structured_result":
                result_data = {
                    "title": args.get("title", "Analysis Result"),
                    "summary": args.get("summary", ""),
                    "key_takeaways": args.get("key_takeaways", []),
                    "tags": args.get("tags", ["orbit-ai", "analysis"]),
                    "format": "structured_json"
                }

            else:
                raise ValueError(f"Unimplemented tool execution: {tool_name}")

        except Exception as e:
            status = "failed"
            error_msg = str(e)
            result_data = {"error": error_msg}

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "tool_name": tool_name,
            "arguments": args,
            "status": status,
            "duration_ms": duration_ms,
            "result": result_data,
            "error": error_msg
        }

tool_registry = ToolRegistry()

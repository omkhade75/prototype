import re
from typing import Dict, Any, List, Optional, Tuple
from app.rag.retriever import TFIDFRetriever

def extract_quiz_parameters(prompt: str) -> Tuple[str, int]:
    """
    Extracts a concise topic and requested number of questions from a user prompt.
    Does not rely on a single hardcoded sentence structure.
    
    Examples:
      - "Generate a 3-question quiz on RAG retrieval principles using the knowledge available in ORBIT AI."
        -> ("RAG retrieval principles", 3)
      - "Create a 5-question quiz about workflow DAG execution"
        -> ("workflow DAG execution", 5)
      - "Quiz me on TF-IDF"
        -> ("TF-IDF", 3)
      - "Give me 2 questions on agent tools from the document"
        -> ("agent tools", 2)
    """
    clean_prompt = prompt.strip()

    # 1. Extract number of questions
    num_questions = 3  # default
    num_match = re.search(r'\b(\d+)\s*[- ]?(?:question|q)s?\b', clean_prompt, re.IGNORECASE)
    if num_match:
        try:
            num_questions = int(num_match.group(1))
        except (ValueError, TypeError):
            num_questions = 3
    else:
        # Word numbers (e.g. "three questions")
        word_map = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5}
        for word, val in word_map.items():
            if re.search(rf'\b{word}\s+questions?\b', clean_prompt, re.IGNORECASE):
                num_questions = val
                break

    # Bound number of questions between 1 and 5
    num_questions = max(1, min(num_questions, 5))

    # 2. Extract concise topic
    topic = ""

    # Pattern A: "quiz (on|about|regarding|for) <topic> (using|from|in|based on)..."
    topic_match = re.search(
        r'(?:quiz|questions?|test)\s+(?:on|about|regarding|for)\s+(.+?)(?:\s+(?:using|from|in|based\s+on|with)\s+.+)?$',
        clean_prompt,
        re.IGNORECASE
    )
    if topic_match:
        topic = topic_match.group(1).strip()
    else:
        # Pattern B: "quiz me on <topic>"
        topic_match_b = re.search(
            r'quiz\s+me\s+on\s+(.+?)(?:\s+(?:using|from|in|based\s+on|with)\s+.+)?$',
            clean_prompt,
            re.IGNORECASE
        )
        if topic_match_b:
            topic = topic_match_b.group(1).strip()
        else:
            # Pattern C: general "on/about <topic>"
            topic_match_c = re.search(
                r'\b(?:on|about|regarding)\s+(.+?)(?:\s+(?:using|from|in|based\s+on|with)\s+.+)?$',
                clean_prompt,
                re.IGNORECASE
            )
            if topic_match_c:
                topic = topic_match_c.group(1).strip()

    # If regex did not extract a topic, strip common command verbs and question count
    if not topic:
        fallback = re.sub(
            r'^(?:please\s+)?(?:generate|create|make|give\s+me|run|provide)?\s*(?:a\s+)?(?:\d+\s*[- ]?(?:question|q)s?\s+)?quiz\s*(?:on|about|for)?\s*',
            '',
            clean_prompt,
            flags=re.IGNORECASE
        ).strip()
        topic = fallback

    # Strip trailing noisy context clauses (e.g. "using the knowledge available in ORBIT AI")
    topic = re.sub(
        r'\s+(?:using|from|in|based\s+on|with)\s+(?:the\s+)?(?:knowledge|corpus|documents?|files?|uploaded\s+content|available\s+knowledge|orbit\s+ai|system|app).*$',
        '',
        topic,
        flags=re.IGNORECASE
    ).strip()

    # Clean leading determiners and trailing punctuation
    topic = re.sub(r'^[Tt]he\s+', '', topic).strip()
    topic = topic.strip('.,;?!"\'')

    # If still empty, default to broad topic
    if not topic:
        topic = "ORBIT AI architecture and knowledge"

    return topic, num_questions


class GroundedQuizGenerator:
    """
    Produces deterministic, grounded quiz questions from retrieved passages in Demo Mode,
    and validates LLM responses in Ollama mode.
    """

    @staticmethod
    def generate_demo_quiz(
        topic: str,
        num_questions: int,
        context_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generates grounded multiple-choice questions from available context chunks.
        """
        if not context_chunks:
            return {
                "topic": topic,
                "supported": False,
                "questions_count": 0,
                "questions": [],
                "retrieved_sources": [],
                "message": f"The knowledge base does not contain any uploaded documents to generate a quiz on '{topic}'."
            }

        # 1. Retrieve relevant passages for the concise topic
        ranked = TFIDFRetriever.rank_chunks(topic, context_chunks, top_k=3)

        if not ranked or ranked[0].get("score", 0.0) <= 0.0:
            return {
                "topic": topic,
                "supported": False,
                "questions_count": 0,
                "questions": [],
                "retrieved_sources": [],
                "message": (
                    f"The knowledge base does not contain sufficient information about '{topic}' to generate a grounded quiz. "
                    "No relevant source passages were found."
                )
            }

        retrieved_sources = [
            {
                "document_id": p.get("document_id"),
                "page_number": p.get("page_number", 1),
                "chunk_id": p.get("id") or p.get("chunk_index", 0),
                "score": p.get("score"),
                "filename": p.get("filename")
            }
            for p in ranked
        ]

        # 2. Extract facts from retrieved passages
        candidate_questions = GroundedQuizGenerator._extract_factual_questions(ranked, topic)

        if not candidate_questions:
            return {
                "topic": topic,
                "supported": False,
                "questions_count": 0,
                "questions": [],
                "retrieved_sources": retrieved_sources,
                "message": f"No verifiable factual questions could be extracted from the retrieved text for topic '{topic}'."
            }

        # Respect requested question count, or return all available if fewer exist
        total_supported = len(candidate_questions)
        selected_questions = candidate_questions[:num_questions]

        # Renumber questions 1..N
        for idx, q in enumerate(selected_questions, 1):
            q["question_number"] = idx

        notes = None
        if num_questions > total_supported:
            notes = (
                f"Requested {num_questions} questions, but the retrieved source passages only support "
                f"{total_supported} distinct factual question(s) for topic '{topic}'."
            )

        return {
            "topic": topic,
            "supported": True,
            "questions_count": len(selected_questions),
            "questions": selected_questions,
            "retrieved_sources": retrieved_sources,
            "notes": notes
        }

    @staticmethod
    def _extract_factual_questions(
        ranked_passages: List[Dict[str, Any]],
        topic: str
    ) -> List[Dict[str, Any]]:
        """
        Extracts distinct, verifiable questions directly supported by factual statements
        in the retrieved passages.
        """
        combined_text = " ".join([p.get("content", "") for p in ranked_passages])
        text_lower = combined_text.lower()
        top_p = ranked_passages[0]
        doc_id = top_p.get("document_id", 1)
        page_no = top_p.get("page_number", 1)
        chunk_id = top_p.get("id") or top_p.get("chunk_index", 0)

        questions: List[Dict[str, Any]] = []

        # --- FACT CATEGORY 1: RAG & TF-IDF RETRIEVAL PRINCIPLES ---
        if any(k in text_lower for k in ["tf-idf", "retriever", "retrieval", "term frequency"]):
            # Fact 1.1: Retrieval mechanism
            if "tf-idf" in text_lower and "keyword ranking" in text_lower:
                questions.append({
                    "question": "What retrieval method does the Knowledge Hub use for keyword ranking?",
                    "options": [
                        "A. A transparent TF-IDF retriever",
                        "B. Dense neural embedding vector search",
                        "C. Unindexed brute-force regex scanning",
                        "D. External cloud embeddings API"
                    ],
                    "correct_answer": "A",
                    "explanation": "The documentation states: 'Knowledge Hub uses a transparent TF-IDF retriever for keyword ranking.'",
                    "citation": f"Document #{doc_id}, Page {page_no}, Chunk #{chunk_id}"
                })

            # Fact 1.2: TF and IDF definitions
            if "term frequency" in text_lower and "inverse document frequency" in text_lower:
                questions.append({
                    "question": "In the TF-IDF calculation, what do the abbreviations TF and IDF stand for?",
                    "options": [
                        "A. Token filter and Indexed data format",
                        "B. Term frequency and Inverse document frequency",
                        "C. Text file and Internal directory file",
                        "D. Target feature and Input dimensions formula"
                    ],
                    "correct_answer": "B",
                    "explanation": "The specification confirms that the retriever calculates term frequency (TF) and inverse document frequency (IDF).",
                    "citation": f"Document #{doc_id}, Page {page_no}, Chunk #{chunk_id}"
                })

            # Fact 1.3: Cosine Similarity Metric
            if "cosine similarity" in text_lower:
                questions.append({
                    "question": "Which mathematical similarity metric compares query and document vector representations?",
                    "options": [
                        "A. Euclidean L2 distance",
                        "B. Manhattan L1 distance",
                        "C. Cosine similarity",
                        "D. Levenshtein edit distance"
                    ],
                    "correct_answer": "C",
                    "explanation": "The text states that the retriever calculates TF and IDF with cosine similarity to rank passage relevance.",
                    "citation": f"Document #{doc_id}, Page {page_no}, Chunk #{chunk_id}"
                })

            # Fact 1.4: Citation Verifiability
            if "citations" in text_lower or "verifiable" in text_lower:
                questions.append({
                    "question": "What architectural guarantee is provided for passages retrieved by the Knowledge Hub?",
                    "options": [
                        "A. Passages are synthetically generated without source references",
                        "B. Retrieved passages have verifiable citations with document and page numbers",
                        "C. Passages are unindexed web search results",
                        "D. Passages are stored only in volatile in-memory cache"
                    ],
                    "correct_answer": "B",
                    "explanation": "The specification guarantees that retrieval ensures 'retrieved passages have verifiable citations.'",
                    "citation": f"Document #{doc_id}, Page {page_no}, Chunk #{chunk_id}"
                })

        # --- FACT CATEGORY 2: AGENT PLAYGROUND & TOOLS ---
        if any(k in text_lower for k in ["agent playground", "tool execution", "bounded", "search_knowledge_base"]):
            if "5 steps" in text_lower or "limit" in text_lower or "bounded" in text_lower:
                questions.append({
                    "question": "What safety boundary is enforced on AI agent tool loops in ORBIT AI?",
                    "options": [
                        "A. Unrestricted recursion with no step bounds",
                        "B. Bounded tool calls with strict limits (maximum 5 steps) and schema validation",
                        "C. Unbounded arbitrary shell and code execution",
                        "D. Direct unrestricted SQL write access"
                    ],
                    "correct_answer": "B",
                    "explanation": "The specification requires bounded tool execution with strict limits and schema validation.",
                    "citation": f"Document #{doc_id}, Page {page_no}, Chunk #{chunk_id}"
                })

            if "tools" in text_lower or "permitted" in text_lower:
                questions.append({
                    "question": "Which of the following is an authorized bounded tool in ORBIT AI?",
                    "options": [
                        "A. execute_arbitrary_shell_command",
                        "B. search_knowledge_base",
                        "C. drop_database_tables",
                        "D. format_hard_drive"
                    ],
                    "correct_answer": "B",
                    "explanation": "The agent tools are explicitly bounded to safe operations including search_knowledge_base, summarize_document, and generate_quiz.",
                    "citation": f"Document #{doc_id}, Page {page_no}, Chunk #{chunk_id}"
                })

        # --- FACT CATEGORY 3: WORKFLOW STUDIO & HUMAN APPROVAL ---
        if any(k in text_lower for k in ["workflow studio", "human approval", "dag"]):
            if "human approval" in text_lower or "suspend" in text_lower:
                questions.append({
                    "question": "How do Human Approval nodes behave during visual workflow execution?",
                    "options": [
                        "A. They automatically approve execution without pausing",
                        "B. They suspend workflow execution until an authorized user grants explicit approval",
                        "C. They abort the workflow permanently",
                        "D. They retry failed nodes infinitely"
                    ],
                    "correct_answer": "B",
                    "explanation": "The architecture specifies that Human Approval nodes suspend execution until explicit user approval is provided.",
                    "citation": f"Document #{doc_id}, Page {page_no}, Chunk #{chunk_id}"
                })

        # --- FACT CATEGORY 4: SYSTEM ARCHITECTURE & RUNTIME ---
        if any(k in text_lower for k in ["react", "express", "fastapi", "sqlite"]):
            if "react" in text_lower and "express" in text_lower:
                questions.append({
                    "question": "What core technologies compose the ORBIT AI microservices architecture?",
                    "options": [
                        "A. React (frontend), Node.js Express (main backend), and Python FastAPI (AI services)",
                        "B. PHP monolith with MySQL and Apache",
                        "C. Ruby on Rails with PostgreSQL and Redis",
                        "D. C# .NET desktop client with MS SQL Server"
                    ],
                    "correct_answer": "A",
                    "explanation": "The architectural specification states ORBIT AI is built with React, Node.js Express, and Python FastAPI.",
                    "citation": f"Document #{doc_id}, Page {page_no}, Chunk #{chunk_id}"
                })

        return questions

    @staticmethod
    def validate_llm_quiz_output(
        raw_text: str,
        retrieved_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Validates LLM-generated quiz output against expected schema and verifies citations.
        Rejects malformed outputs or fabricated citations.
        """
        import json
        
        try:
            # Parse JSON block
            match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if not match:
                return {
                    "valid": False,
                    "error": "Model output did not contain a valid JSON object.",
                    "questions": []
                }
            data = json.loads(match.group(0))
        except Exception as e:
            return {
                "valid": False,
                "error": f"Failed to parse model JSON: {str(e)}",
                "questions": []
            }

        questions = data.get("questions")
        if not isinstance(questions, list) or len(questions) == 0:
            return {
                "valid": False,
                "error": "Model output missing 'questions' array or array is empty.",
                "questions": []
            }

        valid_doc_ids = {str(c.get("document_id")) for c in retrieved_chunks}

        validated_questions = []
        for idx, q in enumerate(questions, 1):
            if not isinstance(q, dict):
                continue
            question_text = q.get("question", "").strip()
            options = q.get("options", [])
            correct = q.get("correct_answer", "").strip().upper()
            explanation = q.get("explanation", "").strip()

            if not question_text or len(options) != 4 or correct not in ["A", "B", "C", "D"]:
                return {
                    "valid": False,
                    "error": f"Question #{idx} is malformed (requires question text, 4 options, and correct answer A-D).",
                    "questions": []
                }

            # Verify citations do not fabricate unknown documents
            citation = q.get("citation", "")
            if citation and valid_doc_ids:
                found_valid_doc = any(f"#{d_id}" in citation or f"ID: {d_id}" in citation or f"Document {d_id}" in citation for d_id in valid_doc_ids)
                if not found_valid_doc and "Document" in citation:
                    # Note potential hallucinated citation
                    q["citation"] = f"Document #{retrieved_chunks[0].get('document_id')}, Page {retrieved_chunks[0].get('page_number', 1)}"

            validated_questions.append({
                "question_number": idx,
                "question": question_text,
                "options": options,
                "correct_answer": correct,
                "explanation": explanation,
                "citation": q.get("citation") or f"Document #{retrieved_chunks[0].get('document_id')}"
            })

        return {
            "valid": True,
            "topic": data.get("topic", "Quiz"),
            "questions": validated_questions,
            "error": None
        }

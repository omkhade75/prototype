import re
from typing import Dict, Any, List, Optional
from app.models.provider import ModelProvider

class DemoProvider(ModelProvider):
    """
    Demo AI Provider for ORBIT AI.
    Provides deterministic, extractive responses without requiring any GPU or local LLM installation.
    Every response is clearly identified as Demo/Extractive.
    """

    @property
    def name(self) -> str:
        return "demo"

    async def is_available(self) -> bool:
        return True

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        # Bounded demo text generation
        clean = prompt.strip()
        return f"[Demo Provider Output]\nProcessed prompt: {clean[:200]}..."

    async def answer_question(self, question: str, passages: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Extractive Q&A: Analyzes retrieved passages, identifies key sentences matching
        terms in the question, and returns grounded answer with exact passage citations.
        """
        if not passages:
            return {
                "answer": "No relevant source passages were found in the uploaded documents to answer this question.",
                "supported": False,
                "citations": [],
                "provider": "demo"
            }

        from app.rag.retriever import TFIDFRetriever

        # Tokenize question words using normalized stemmer and stop-word filtering
        q_tokens = set(TFIDFRetriever.tokenize(question, is_query=True))
        
        extracted_sentences = []
        citations = []

        for p in passages:
            content = p.get("content", "")
            doc_id = p.get("document_id")
            page_no = p.get("page_number", 1)
            chunk_id = p.get("id") or p.get("chunk_index", 0)

            # Split into candidate sentences
            sentences = [s.strip() for s in re.split(r'[.!?\n]+', content) if len(s.strip()) > 15]
            for s in sentences:
                s_tokens = set(TFIDFRetriever.tokenize(s, is_query=False))
                overlap = len(q_tokens.intersection(s_tokens))
                if overlap > 0:
                    extracted_sentences.append((overlap, s, p))

        # Sort sentences by keyword overlap
        extracted_sentences.sort(key=lambda x: x[0], reverse=True)

        if not extracted_sentences:
            # Fallback to the top passage content if general terms match
            top_p = passages[0]
            first_sentence = top_p.get("content", "").strip()[:200]
            return {
                "answer": (
                    f"[Demo Mode - Extractive Answer]\n"
                    f"Based on the top retrieved passage from document #{top_p.get('document_id')}:\n"
                    f"\"{first_sentence}...\""
                ),
                "supported": True,
                "citations": [{
                    "document_id": top_p.get("document_id"),
                    "page_number": top_p.get("page_number"),
                    "chunk_id": top_p.get("id") or top_p.get("chunk_index")
                }],
                "provider": "demo"
            }

        # Select top 2-3 matching sentences
        top_sentences = extracted_sentences[:3]
        combined_text = " ".join([item[1] for item in top_sentences])
        
        seen_chunks = set()
        for item in top_sentences:
            p = item[2]
            c_key = (p.get("document_id"), p.get("page_number"))
            if c_key not in seen_chunks:
                seen_chunks.add(c_key)
                citations.append({
                    "document_id": p.get("document_id"),
                    "page_number": p.get("page_number"),
                    "chunk_id": p.get("id") or p.get("chunk_index")
                })

        return {
            "answer": f"[Demo Mode - Extractive Answer]\n{combined_text}",
            "supported": True,
            "citations": citations,
            "provider": "demo"
        }

    async def execute_task(self, task_type: str, input_text: str, parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Executes bounded deterministic AI tasks for workflows and agents.
        """
        params = parameters or {}
        task = task_type.lower()

        if task == "summarize":
            # Extractive summary of top sentences
            sentences = [s.strip() for s in re.split(r'[.!?\n]+', input_text) if len(s.strip()) > 10]
            summary_sentences = sentences[:3] if len(sentences) >= 3 else sentences
            summary = " ".join(summary_sentences)
            return {
                "task": "summarize",
                "result": f"[Demo Extractive Summary] {summary}",
                "original_length": len(input_text),
                "summary_length": len(summary),
                "mode": "demo"
            }

        elif task == "extract":
            # Extract emails, numbers, URLs, or key capitalized terms
            emails = re.findall(r'[\w\.-]+@[\w\.-]+', input_text)
            numbers = re.findall(r'\b\d+(?:\.\d+)?\b', input_text)
            key_terms = list(set(re.findall(r'\b[A-Z][a-zA-Z0-9_-]{2,}\b', input_text)))
            return {
                "task": "extract",
                "result": {
                    "emails": emails,
                    "numeric_values": numbers[:10],
                    "named_entities": key_terms[:10]
                },
                "mode": "demo"
            }

        elif task == "transform":
            # Transform text based on target format
            target_format = params.get("format", "uppercase")
            if target_format == "uppercase":
                transformed = input_text.upper()
            elif target_format == "bullet_points":
                lines = [line.strip() for line in input_text.splitlines() if line.strip()]
                transformed = "\n".join([f"- {line}" for line in lines])
            else:
                transformed = input_text.strip()
            return {
                "task": "transform",
                "result": transformed,
                "mode": "demo"
            }

        else:
            return {
                "task": task,
                "result": f"[Demo Processed] {input_text[:150]}",
                "mode": "demo"
            }

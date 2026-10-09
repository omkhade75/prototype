from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.rag.retriever import TFIDFRetriever
from app.models.factory import get_provider

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    chunks: List[Dict[str, Any]]
    top_k: Optional[int] = 3
    min_score: Optional[float] = 0.05

class AnswerRequest(BaseModel):
    question: str
    passages: List[Dict[str, Any]]
    provider: Optional[str] = None

@router.post("/query")
async def query_retrieval(req: QueryRequest):
    """
    Ranks chunks using transparent TF-IDF keyword ranking.
    Returns matched chunks with document ID, page number, and similarity score.
    """
    try:
        ranked = TFIDFRetriever.rank_chunks(
            query=req.query,
            chunks=req.chunks,
            top_k=req.top_k or 3,
            min_score=req.min_score or 0.05
        )
        return {
            "success": True,
            "query": req.query,
            "total_chunks_searched": len(req.chunks),
            "matched_count": len(ranked),
            "results": ranked
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval query failed: {str(e)}")

@router.post("/answer")
async def generate_answer(req: AnswerRequest):
    """
    Generates a truthful, grounded answer using the provided retrieved passages.
    Returns citations and flags unsupported questions.
    """
    try:
        provider = get_provider(req.provider)
        answer_data = await provider.answer_question(req.question, req.passages)
        return {
            "success": True,
            **answer_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer generation failed: {str(e)}")

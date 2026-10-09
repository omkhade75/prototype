from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.rag.extractor import DocumentExtractor
from app.rag.chunker import DocumentChunker

router = APIRouter()
chunker = DocumentChunker(chunk_size=500, chunk_overlap=100)

class TextChunkRequest(BaseModel):
    filename: str
    content: str
    document_id: Optional[Any] = None
    chunk_size: Optional[int] = 500
    chunk_overlap: Optional[int] = 100

@router.post("/extract-and-chunk")
async def extract_and_chunk_file(
    file: Optional[UploadFile] = File(None),
    filename: Optional[str] = Form(None),
    document_id: Optional[str] = Form(None)
):
    """
    Extracts text pages and creates bounded overlapping chunks from uploaded file bytes.
    Preserves document ID and page numbers.
    """
    if file is None:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    fname = filename or file.filename or "document.txt"
    try:
        content_bytes = await file.read()
        pages = DocumentExtractor.extract_from_bytes(content_bytes, fname)
        chunks = chunker.chunk_pages(pages, document_id=document_id)

        total_chars = sum(len(p.get("text", "")) for p in pages)

        return {
            "success": True,
            "filename": fname,
            "document_id": document_id,
            "page_count": len(pages),
            "char_count": total_chars,
            "chunk_count": len(chunks),
            "pages": pages,
            "chunks": chunks
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.post("/chunk-text")
async def chunk_raw_text(req: TextChunkRequest):
    """
    Directly chunks provided text string for quick testing or markdown snippets.
    """
    try:
        pages = [{"page_number": 1, "text": req.content}]
        custom_chunker = DocumentChunker(
            chunk_size=req.chunk_size or 500,
            chunk_overlap=req.chunk_overlap or 100
        )
        chunks = custom_chunker.chunk_pages(pages, document_id=req.document_id)
        return {
            "success": True,
            "filename": req.filename,
            "document_id": req.document_id,
            "char_count": len(req.content),
            "chunk_count": len(chunks),
            "chunks": chunks
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

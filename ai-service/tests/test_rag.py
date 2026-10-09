import pytest
from app.rag.chunker import DocumentChunker
from app.rag.retriever import TFIDFRetriever
from app.rag.extractor import DocumentExtractor

def test_document_extractor_txt():
    content = b"Line one of document.\nLine two of document.\nLine three."
    pages = DocumentExtractor.extract_from_bytes(content, "sample.txt")
    assert len(pages) == 1
    assert pages[0]["page_number"] == 1
    assert "Line one" in pages[0]["text"]

def test_document_extractor_empty_fails():
    with pytest.raises(ValueError) as exc:
        DocumentExtractor.extract_from_bytes(b"", "empty.txt")
    assert "empty" in str(exc.value)

def test_document_extractor_unsupported_ext():
    with pytest.raises(ValueError) as exc:
        DocumentExtractor.extract_from_bytes(b"data", "file.exe")
    assert "Unsupported file format" in str(exc.value)

def test_document_chunker_sliding_window():
    chunker = DocumentChunker(chunk_size=100, chunk_overlap=20)
    pages = [
        {"page_number": 1, "text": "This is a long sentence meant to test the chunker sliding window logic properly with overlap."}
    ]
    chunks = chunker.chunk_pages(pages, document_id="doc_1")
    assert len(chunks) >= 1
    assert chunks[0]["page_number"] == 1
    assert chunks[0]["document_id"] == "doc_1"

def test_tfidf_retrieval_ranking():
    chunks = [
        {"id": 1, "document_id": 10, "page_number": 1, "content": "Orbit AI features visual workflow automation with React Flow and DAG execution."},
        {"id": 2, "document_id": 10, "page_number": 2, "content": "Knowledge retrieval uses a transparent TF-IDF keyword baseline without hidden embeddings."},
        {"id": 3, "document_id": 11, "page_number": 1, "content": "Python FastAPI microservice coordinates model providers and bounded agent tools."}
    ]

    results = TFIDFRetriever.rank_chunks("TF-IDF retrieval keyword", chunks, top_k=2)
    assert len(results) > 0
    # Top result must be chunk #2
    assert results[0]["id"] == 2
    assert results[0]["score"] > 0
    assert "document_id" in results[0]
    assert "page_number" in results[0]

def test_tfidf_retrieval_no_match():
    chunks = [
        {"id": 1, "document_id": 10, "page_number": 1, "content": "Database storage is implemented using SQLite with WAL mode."}
    ]
    results = TFIDFRetriever.rank_chunks("quantum astrophysics interstellar spaceship", chunks, top_k=2)
    assert len(results) == 0

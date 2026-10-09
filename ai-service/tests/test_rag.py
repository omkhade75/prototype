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

# --- NEW EXTENSIVE RETRIEVAL TESTS FOR ACCURACY, RANKING, AND EDGE CASES ---

def test_tfidf_retrieval_test1_retrieval_method_question():
    """
    Test 1: 'What retrieval method does ORBIT AI use?'
    Verifies that the passage specifically discussing the TF-IDF retriever ranks #1
    and is not overshadowed by generic 'ORBIT AI' mentions in the architecture chunk.
    """
    seeded_chunks = [
        {
            "id": 1,
            "document_id": 1,
            "page_number": 1,
            "content": "ORBIT AI is a local AI engineering workspace built with React (frontend), Node.js Express (main backend), and Python FastAPI (AI services). It runs completely local and supports both Ollama local models and an extractive Demo Mode."
        },
        {
            "id": 2,
            "document_id": 1,
            "page_number": 1,
            "content": "Knowledge Hub uses a transparent TF-IDF retriever for keyword ranking. The retriever calculates term frequency (TF) and inverse document frequency (IDF) with cosine similarity, ensuring that retrieved passages have verifiable citations."
        },
        {
            "id": 3,
            "document_id": 1,
            "page_number": 2,
            "content": "The Agent Playground features bounded execution with strict schema validation. The agent can search knowledge, summarize documents, generate quizzes, and return structured JSON results without allowing shell or arbitrary code execution."
        },
        {
            "id": 4,
            "document_id": 1,
            "page_number": 2,
            "content": "Workflow Studio enables visual DAG execution. Node types include Input, Knowledge Search, AI Task, Condition, Human Approval, and Output. Human Approval nodes suspend execution until explicit user approval is granted."
        }
    ]

    results = TFIDFRetriever.rank_chunks("What retrieval method does ORBIT AI use?", seeded_chunks, top_k=3)
    assert len(results) > 0
    # Highest-ranked passage MUST be chunk #2 describing the TF-IDF retriever
    top_result = results[0]
    assert top_result["id"] == 2
    assert "retriever" in top_result["content"].lower()
    assert top_result["score"] > 0.15
    assert top_result["document_id"] == 1
    assert top_result["page_number"] == 1
    # Verify matched terms contain the stem/surface keyword for retriever
    matched_lower = [m.lower() for m in top_result["matched_terms"]]
    assert any("retriev" in m for m in matched_lower)

def test_tfidf_retrieval_test2_mars_population_missing_information():
    """
    Test 2: 'What is the current population of Mars?'
    Verifies that completely out-of-domain questions return 0 passages.
    """
    seeded_chunks = [
        {"id": 1, "document_id": 1, "page_number": 1, "content": "ORBIT AI is a local AI engineering workspace built with React and Node.js."},
        {"id": 2, "document_id": 1, "page_number": 1, "content": "Knowledge Hub uses a transparent TF-IDF retriever for keyword ranking."}
    ]
    results = TFIDFRetriever.rank_chunks("What is the current population of Mars?", seeded_chunks)
    assert len(results) == 0

def test_tfidf_retrieval_empty_and_punctuation_queries():
    """
    Verifies that empty strings, whitespace, and punctuation-only inputs
    safely return an empty list without raising exceptions.
    """
    chunks = [
        {"id": 1, "document_id": 1, "page_number": 1, "content": "Knowledge Hub uses a transparent TF-IDF retriever."}
    ]
    assert TFIDFRetriever.rank_chunks("", chunks) == []
    assert TFIDFRetriever.rank_chunks("   ", chunks) == []
    assert TFIDFRetriever.rank_chunks("???!!!...", chunks) == []
    assert TFIDFRetriever.rank_chunks("what is", chunks) == []  # pure stopwords

def test_tfidf_retrieval_morphological_stemming():
    """
    Verifies that inflectional variants correctly map to stems and match:
    'retrieval' matches 'retriever' and 'retrieved'.
    """
    chunks = [
        {"id": 1, "document_id": 1, "page_number": 1, "content": "The system features an automated document retriever."},
        {"id": 2, "document_id": 1, "page_number": 2, "content": "Workflows manage database transactions."}
    ]
    results = TFIDFRetriever.rank_chunks("document retrieval", chunks)
    assert len(results) > 0
    assert results[0]["id"] == 1

def test_tfidf_retrieval_domain_generic_terms_stand_alone():
    """
    Verifies that when a query specifically asks about the platform alone
    ('What is ORBIT AI?'), the platform definition chunk is properly retrieved.
    """
    chunks = [
        {"id": 1, "document_id": 1, "page_number": 1, "content": "ORBIT AI is a local AI engineering workspace built with React and Python."},
        {"id": 2, "document_id": 1, "page_number": 2, "content": "Workflow Studio enables visual DAG execution."}
    ]
    results = TFIDFRetriever.rank_chunks("What is ORBIT AI?", chunks)
    assert len(results) > 0
    assert results[0]["id"] == 1

# ORBIT AI — API Guide & Endpoint Reference

All client requests communicate with the Express API gateway (`http://localhost:5000/api`).

---

## 1. System Health & Status

### `GET /api/system/status`
Returns runtime metrics for Express, SQLite database statistics, and Python AI service connectivity.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "backend": {
      "status": "healthy",
      "runtime": "Node.js v22.23.3",
      "uptime_seconds": 128,
      "port": 5000
    },
    "database": {
      "engine": "SQLite 3 (better-sqlite3)",
      "mode": "WAL",
      "statistics": {
        "documents": 1,
        "document_chunks": 4,
        "workflow_definitions": 2,
        "workflow_runs": 1,
        "agent_runs": 1
      }
    },
    "ai_service": {
      "status": "healthy",
      "active_provider": "demo",
      "is_demo_mode": true,
      "configured_model": "llama3",
      "ollama_base_url": "http://localhost:11434",
      "ollama_reachable": true,
      "ollama_installed_models": ["llama3:latest", "phi3:latest"],
      "ollama_model_installed": true,
      "ollama_error": null
    }
  }
}
```

---

## 2. Documents & Knowledge Hub

### `GET /api/documents`
Lists all uploaded documents with chunk counts.

### `POST /api/documents/upload`
Uploads a document (`multipart/form-data` with field `file`). Supports PDF, TXT, MD up to 10MB.

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "filename": "machine_learning_notes.txt",
    "file_type": "txt",
    "file_size": 1420,
    "char_count": 1420,
    "chunk_count": 3,
    "status": "processed"
  }
}
```

### `DELETE /api/documents/:id`
Deletes a document and cascades deletion to all associated chunks.

### `POST /api/knowledge/ask`
Performs TF-IDF retrieval across chunks and generates a grounded answer with citations.

**Request Body:**
```json
{
  "question": "What retrieval baseline does Knowledge Hub use?",
  "documentId": null,
  "topK": 3,
  "provider": "demo"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "question": "What retrieval baseline does Knowledge Hub use?",
    "answer": "[Demo Mode - Extractive Answer]\nKnowledge Hub uses a transparent TF-IDF retriever for keyword ranking. The retriever calculates term frequency (TF) and inverse document frequency (IDF) with cosine similarity...",
    "supported": true,
    "citations": [
      {
        "document_id": 1,
        "page_number": 1,
        "chunk_id": 2
      }
    ],
    "retrieved_passages": [
      {
        "document_id": 1,
        "page_number": 1,
        "score": 0.4281,
        "filename": "Orbit AI Architectural Specification.md",
        "content": "Knowledge Hub uses a transparent TF-IDF retriever for keyword ranking...",
        "matched_terms": ["retrieval", "tf-idf", "baseline"]
      }
    ],
    "provider": "demo"
  }
}
```

---

## 3. Agent Playground

### `GET /api/agent/tools`
Returns permitted tools and their schema definitions.

### `POST /api/agent/run`
Executes a bounded reasoning and tool invocation loop. Supports `demo` (deterministic) and `ollama` (local model) providers.

**Request Body:**
```json
{
  "message": "Explain TF-IDF retrieval based on the uploaded documents",
  "provider": "ollama",
  "maxSteps": 5
}
```

**Response (201 Created — Successful Ollama Run):**
```json
{
  "success": true,
  "data": {
    "id": "agent-7cb2-4019-91ec-52467d1c1a2f",
    "user_prompt": "Explain TF-IDF retrieval based on the uploaded documents",
    "status": "successful",
    "provider": "ollama",
    "model": "llama3",
    "duration_ms": 1420.5,
    "total_steps": 1,
    "final_response": "Based on the retrieved specification passages, TF-IDF measures term frequency against inverse document frequency...",
    "steps": [
      {
        "step_number": 1,
        "thought": "Model requested tool `search_knowledge_base` with validated parameters.",
        "tool_name": "search_knowledge_base",
        "tool_args": { "query": "TF-IDF retrieval", "top_k": 3 },
        "tool_result": { "query": "TF-IDF retrieval", "matched_count": 2, "passages": [...] },
        "status": "successful",
        "duration_ms": 1.2
      }
    ]
  }
}
```

**Response (201 Created — Ollama Unreachable / Error State):**
> **Note**: Unlike cloud wrappers that silently fake or fall back, ORBIT AI records the actual error in the execution trace:
```json
{
  "success": true,
  "data": {
    "id": "agent-8e11-4091-a20c-71e19bc82e10",
    "user_prompt": "Explain TF-IDF retrieval",
    "status": "failed",
    "provider": "ollama",
    "model": "llama3",
    "duration_ms": 12.4,
    "total_steps": 0,
    "final_response": "Agent execution encountered an error: Ollama is unreachable at http://localhost:11434. Please ensure the Ollama service is running (`ollama serve`), or switch provider mode to 'demo'.",
    "error_message": "Ollama is unreachable at http://localhost:11434...",
    "steps": []
  }
}
```

---

## 4. Visual Workflow Studio

### `GET /api/workflows`
Returns saved visual workflow graphs.

### `POST /api/workflows`
Saves or updates a workflow definition. Validates that the graph is an acyclic DAG.

### `POST /api/workflows/:id/execute`
Executes the workflow graph node by node.

**Response when encountering Human Approval (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "wfrun-f472-4638-9cb1-3a7a934bd081",
    "workflow_id": "wf-sample-2",
    "workflow_name": "Structured Extraction with Human Approval",
    "status": "waiting_for_approval",
    "paused_step_id": "node-12",
    "steps": [
      { "node_name": "Data Input", "status": "successful", "duration_ms": 1 },
      { "node_name": "Extract Entities", "status": "successful", "duration_ms": 3 },
      { "node_name": "Reviewer Approval", "status": "waiting_for_approval", "duration_ms": 0 }
    ]
  }
}
```

### `POST /api/workflows/approvals/:id/approve`
Resumes a paused workflow run upon human review.

**Request Body:**
```json
{
  "approved": true,
  "reviewerNotes": "Authorized by student lead"
}
```

---

## 5. Evaluations Dashboard

### `POST /api/evaluations/run`
Executes the deterministic benchmark suite.

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "eval-8cf2-4b21-a53b-e85d992d9d1b",
    "suite_name": "ORBIT AI Core Integrity Suite",
    "total_tests": 4,
    "passed_tests": 4,
    "failed_tests": 0,
    "duration_ms": 28,
    "results": [
      {
        "id": "eval-1",
        "name": "Knowledge Retrieval Grounding",
        "status": "PASSED",
        "duration_ms": 4
      },
      {
        "id": "eval-2",
        "name": "Missing Information Detection",
        "status": "PASSED",
        "duration_ms": 2
      },
      {
        "id": "eval-3",
        "name": "Tool & Prompt Argument Validation",
        "status": "PASSED",
        "duration_ms": 1
      },
      {
        "id": "eval-4",
        "name": "Human Approval State Transition & Idempotency",
        "status": "PASSED",
        "duration_ms": 19
      }
    ]
  }
}
```

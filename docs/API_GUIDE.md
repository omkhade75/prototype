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
      "configured_model": "extractive-demo-engine",
      "ollama_reachable": false
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
Executes a bounded reasoning and tool invocation loop.

**Request Body:**
```json
{
  "message": "Generate a 3-question quiz on RAG retrieval principles",
  "provider": "demo",
  "maxSteps": 5
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "agent-7cb2-4019-91ec-52467d1c1a2f",
    "user_prompt": "Generate a 3-question quiz on RAG retrieval principles",
    "status": "successful",
    "provider": "demo",
    "duration_ms": 14.8,
    "total_steps": 1,
    "final_response": "[Demo Agent] Generated a 3-question quiz for topic 'Generate a 3-question quiz on RAG retr'...",
    "steps": [
      {
        "step_number": 1,
        "thought": "User wants a quiz. I will invoke the `generate_quiz` tool.",
        "tool_name": "generate_quiz",
        "tool_args": { "topic": "Generate a 3-question quiz...", "num_questions": 3 },
        "tool_result": { "questions_count": 3, "questions": [...] },
        "status": "successful",
        "duration_ms": 0.4
      }
    ]
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

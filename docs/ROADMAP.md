# ORBIT AI — Engineering Learning Roadmap

This roadmap outlines structured milestones for transitioning from the **ORBIT AI learning prototype** to an **advanced enterprise-grade production AI workspace**.

---

## ✅ Completed Milestones

### Phase 1: Foundation & Observability
- ✅ Pure JavaScript (ES Modules) Express backend + SQLite (WAL mode).
- ✅ React 18 + Vite frontend with glassmorphism UI.
- ✅ Transparent pure-Python TF-IDF document chunking and retrieval engine with mathematical scoring and citations.
- ✅ Visual Workflow Studio with DAG validation (Kahn's topological sort) and human-in-the-loop approval pause/resume.
- ✅ Bounded tool registry (`search_knowledge_base`, `summarize_document`, `generate_quiz`, `structured_result`).

### Phase 2: Real Local AI Agent Runtime (Ollama)
- ✅ Implemented native tool calling via Ollama's local chat interface (`POST /api/chat` with `tools` parameter).
- ✅ Added OpenAI/Ollama function-calling schema generator (`tool_registry.get_ollama_tools()`).
- ✅ Strict bounding: hard-capped at 5 tool calls per run.
- ✅ Argument validation: parameters validated against JSON schemas before execution.
- ✅ Dual-mode runtime: explicit Demo Mode vs. Ollama Mode toggle with no silent fallbacks.
- ✅ Comprehensive mock-based automated test suite (32 unit & integration tests).

---

## 🚀 Future Milestones

## Stage 1: Dense Semantic Embeddings & Qdrant Vector Store
- **Current Baseline**: Transparent local TF-IDF keyword retrieval.
- **Future Learning Goal**:
  - Implement Dense Vector Embeddings using local models (e.g., `BAAI/bge-small-en-v1.5` or `sentence-transformers/all-MiniLM-L6-v2`).
  - Deploy **Qdrant** via local Docker container.
  - Implement Hybrid Search (combining BM25/TF-IDF sparse keyword scores with dense vector cosine similarity using Reciprocal Rank Fusion - RRF).

---

## Stage 2: Stateful Agent Orchestration with LangGraph
- **Current Baseline**: Clean, readable 5-step bounded agent loop in pure Python.
- **Future Learning Goal**:
  - Migrate agent execution to **LangGraph**.
  - Define stateful graphs with human-in-the-loop checkpoints, cyclical reasoning, reflection steps, and multi-agent debate topologies.
  - Persist intermediate agent checkpoints in SQLite/PostgreSQL for instant resumption.

---

## Stage 3: Rigorous AI Evaluation with Promptfoo
- **Current Baseline**: Deterministic 4-test integrity suite in JavaScript.
- **Future Learning Goal**:
  - Integrate **Promptfoo** for automated prompt regression testing.
  - Measure Answer Relevance, Faithfulness, and Context Precision across prompt iterations.
  - Establish red-teaming benchmarks to detect prompt injection attempts.

---

## Stage 4: External Workflow Automation via n8n Webhooks
- **Current Baseline**: Internal visual React Flow DAG engine.
- **Future Learning Goal**:
  - Expose inbound and outbound Webhooks.
  - Integrate with **n8n** to trigger external Slack notifications, Google Sheets updates, or email alerts upon workflow completion or human approval request.

---

## Stage 5: Read-Only GitHub Repository Analysis Tool
- **Current Baseline**: Document RAG for PDF, TXT, and Markdown files.
- **Future Learning Goal**:
  - Implement a bounded GitHub tool that clones or queries public repositories using GitHub REST API.
  - Extract AST (Abstract Syntax Tree) symbols, function signatures, and docstrings for code-grounded Q&A.

---

## Stage 6: Model Context Protocol (MCP) Standardized Tools
- **Current Baseline**: Internal tool registry in `app/tools/registry.py`.
- **Future Learning Goal**:
  - Implement Anthropic's **Model Context Protocol (MCP)** client.
  - Connect to standard community MCP servers (e.g., SQLite MCP, Filesystem MCP, Fetch MCP) via JSON-RPC over stdio/SSE.

---

## Stage 7: Enterprise Productionization & Deployment
- **Database**: Migrate from single-user SQLite to **PostgreSQL** with connection pooling (PgBouncer).
- **Authentication**: Add JWT authentication, Argon2 password hashing, and role-based access control (RBAC).
- **Background Workers**: Introduce **BullMQ** with Redis for asynchronous long-running document processing and chunking jobs.
- **Containerization**: Create multi-stage `Dockerfile` and `docker-compose.yml` orchestrating Frontend, Express, FastAPI, PostgreSQL, and Ollama.
- **CI/CD**: GitHub Actions workflows for automated linting, pytest, and node test pipelines.

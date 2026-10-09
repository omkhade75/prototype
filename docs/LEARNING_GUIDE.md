# ORBIT AI — Engineering Learning Guide for AI & Data Science Students

Welcome to the engineering walkthrough for **ORBIT AI**. As a B.Tech AI & Data Science student, your goal is to master **how real-world AI systems work under the hood**, rather than treating LLMs and frameworks as magical black boxes.

This guide explains:
1. **The Life of a Request**: From React button click -> Express routing -> SQLite -> Python RAG/AI inference -> Back to the browser.
2. **Directory & Module Architecture**: Why each folder exists and what responsibility it owns.
3. **The Math & Logic of the TF-IDF Retriever**: Why TF-IDF was chosen as the transparent baseline.
4. **Bounded Agent Mechanics**: How reasoning loops, tool registries, and schema validators prevent runaway AI execution.
5. **How to Trace and Debug a Failed Run**: Step-by-step diagnostic strategies.

---

## 1. The Life of a Request (Step-by-Step)

Let's trace what happens when you type *"What is WAL mode?"* in the **Knowledge Hub** and press **Ask**:

```
[Browser: React Component]
   │  1. KnowledgeHub.jsx calls api.askQuestion({ question, topK: 3 })
   │  2. Vite Dev Server proxies /api/knowledge/ask -> http://localhost:5000/api/knowledge/ask
   ▼
[Backend: Node.js Express]
   │  3. knowledgeRoutes.js routes the request to knowledgeController.js
   │  4. knowledgeController invokes KnowledgeService.askQuestion()
   │  5. DocumentService queries SQLite for all stored document chunks:
   │     `SELECT id, document_id, content, page_number FROM document_chunks`
   │  6. AIService.retrieve() makes an internal HTTP POST to Python FastAPI (:8000/retrieval/query)
   ▼
[AI Microservice: Python FastAPI]
   │  7. rag.py receives the query string and list of chunk dictionaries.
   │  8. TFIDFRetriever computes Term Frequency (TF), Inverse Document Frequency (IDF),
   │     and Cosine Similarity between the query vector and chunk vectors.
   │  9. Ranks passages descending by score, filters below threshold, and returns Top-K chunks.
   ▼
[Back to Express Backend]
   │ 10. Express receives ranked passages and sends them back to Python:
   │     POST :8000/retrieval/answer with retrieved passages and selected provider.
   ▼
[Python AI Service: Grounded Answer Generation]
   │ 11. In Demo Mode: DemoProvider extracts sentences directly matching query tokens,
   │     constructs an extractive answer, and builds an authentic citation array.
   │ 12. In Ollama Mode: Formats system instructions forcing the LLM to ground its response
   │     solely on Passages [1], [2] and refuse to hallucinate unseen facts.
   ▼
[Return to Client]
   │ 13. Express wraps the result in `{ success: true, data: { answer, citations, passages } }`.
   │ 14. React state updates: Renders the answer card alongside source passage badges with exact TF-IDF scores.
```

---

## 2. Directory Structure & Engineering Responsibilities

```
orbit-ai/
├── frontend/             # React application (Vite, JavaScript JSX, CSS)
│   ├── src/
│   │   ├── pages/        # 5 distinct views (KnowledgeHub, AgentPlayground, WorkflowStudio, Runs, Settings)
│   │   ├── components/   # Reusable UI elements (Sidebar, Modal)
│   │   ├── services/api.js # Centralized HTTP client wrapping all /api endpoints
│   │   └── styles/       # Dark navy modern developer workspace CSS variables & layout
├── backend/              # Node.js Express backend (ES Modules)
│   ├── src/
│   │   ├── database/     # SQLite connection (WAL mode), schema definitions, and seed scripts
│   │   ├── controllers/  # HTTP request parsing, status codes, and error forwarding
│   │   ├── services/     # Core business logic (Workflow DAG engine, Document processing, Evals)
│   │   ├── routes/       # Express route mappings
│   │   └── middleware/   # Global JSON error handling
│   ├── data/             # Persistent SQLite database file (orbit_ai.db)
│   └── storage/uploads/  # Physical uploaded documents (PDFs, TXT, MD)
├── ai-service/           # Python 3.11+ FastAPI service
│   ├── app/
│   │   ├── rag/          # Text extraction (pypdf), overlapping chunking, and TF-IDF retriever
│   │   ├── tools/        # Tool registry, argument schemas, and execution boundaries
│   │   ├── agents/       # Bounded agent loop with step tracking
│   │   ├── models/       # Provider abstraction (DemoProvider vs OllamaProvider)
│   │   └── api/          # FastAPI routers (health, documents, retrieval, agent, tasks)
│   └── tests/            # Automated pytest unit test suite
├── docs/                 # Architectural specifications, API guides, and learning roadmap
└── tests/                # Automated cross-service integration test runners
```

### Why two separate backends (Express and FastAPI)?
In modern production AI systems, Node.js excels at I/O-intensive web traffic, persistent relational databases, websockets, and fast async concurrency. Python is the unmatched king of the AI ecosystem (NumPy, PyTorch, PyPDF, HuggingFace, LangChain). 

Keeping Express as the **Application Gateway** and FastAPI as a private **AI Microservice** cleanly isolates AI compute from user database transactions.

---

## 3. The Math & Logic of the TF-IDF Retriever

Instead of starting with opaque high-dimensional vector embeddings, ORBIT AI begins with **TF-IDF (Term Frequency - Inverse Document Frequency)**.

### Term Frequency (TF)
Measures how frequently term $t$ appears in document chunk $d$:
$$\text{TF}(t, d) = \frac{\text{Count of } t \text{ in } d}{\text{Total terms in } d}$$

### Inverse Document Frequency (IDF)
Measures how unique or informative term $t$ is across all $N$ chunks in your knowledge base:
$$\text{IDF}(t) = \ln\left(1 + \frac{N}{\text{DF}(t)}\right)$$
*If a word appears in every single document (like "the" or "ai"), its IDF approaches 0. If a word appears in only one specific document (like "WAL"), its IDF is high.*

### Cosine Similarity
$$\text{Cosine Similarity}(\vec{q}, \vec{d}) = \frac{\vec{q} \cdot \vec{d}}{\|\vec{q}\| \|\vec{d}\|}$$

Because you can inspect the exact token lists and dot-product calculations in [`retriever.py`](file:///d:/om%20information/prototye/ai-service/app/rag/retriever.py), you can explain exactly why a passage was retrieved. Later in your roadmap, you can easily swap in dense semantic vector embeddings (like BGE-small or MiniLM) into this exact interface!

---

## 4. Bounded Agent Mechanics & Guardrails

Why do uncontrolled AI agents fail or hallucinate?
1. They enter infinite recursive loops trying to solve impossible tasks.
2. They generate hallucinated arguments that crash functions.
3. They attempt unsafe operating system operations (shell access, deleting files).

### How ORBIT AI Solves This:
1. **Tool Registry Schema Validation**:
   In [`registry.py`](file:///d:/om%20information/prototye/ai-service/app/tools/registry.py), every tool defines required arguments and strict types (e.g. `query` must be a string, `top_k` must be an integer). If an LLM sends `{ "query": 123 }`, `validate_args()` catches it immediately before execution.
2. **Bounded Loop Cap**:
   The agent loop in [`executor.py`](file:///d:/om%20information/prototye/ai-service/app/agents/executor.py) enforces `MAX_TOOL_CALLS = 5`. It will never loop infinitely.
3. **No Shell or Arbitrary Code**:
   Permitted tools are strictly limited to `search_knowledge_base`, `summarize_document`, `generate_quiz`, and `structured_result`.

---

## 5. How to Trace and Debug a Failed Run

When an agent or workflow run fails, ORBIT AI records full observability.

### Diagnostic Steps:
1. Navigate to **Runs & Evaluations** in the sidebar.
2. Locate the run row displaying the red `FAILED` badge.
3. Click the **Trace** button.
4. Inspect the step list:
   - Identify the exact step where failure occurred.
   - Look at **Validated Arguments**: Did a tool receive an unexpected `null` or wrong data type?
   - Look at **Observed Tool Result**: Check the `error` field.
   - For workflows: Did a DAG contain a circular dependency or unsupported node type? Check `WorkflowService.validateGraph()`.
5. Check backend logs in your terminal: The Express global error handler logs structured error stacks with status codes.

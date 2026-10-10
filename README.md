<div align="center">

# 🪐 ORBIT AI
### Local AI Engineering, Coding Tutor, Software Engineer Agent, Model Library & Course-to-Code Lab

[![Node.js](https://img.shields.io/badge/Node.js-v22_LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Docker](https://img.shields.io/badge/Docker-Sandboxed_Runtime-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <strong>A 100% free, local-first AI engineering workstation built for computer science students and developers.</strong><br>
  Explore genuine RAG retrieval, bounded local agents, interactive C++/Python DSA tutoring, an autonomous AI Software Engineer that builds real full-stack web applications with genuine SQLite databases, a local AI Model Library, and an integrated Course-to-Code Lab generating validated Jupyter notebooks.
</p>

[Quick Start](#-quick-start-in-1-click) •
[Architecture](#-system-architecture) •
[Core Modules](#-core-modules) •
[HP Victus Setup Guide](#-hp-victus-laptop-setup--hardware-profile) •
[Offline-First Matrix](#-offline-first-capabilities--dependency-matrix) •
[Testing](#-automated-testing)

---

</div>

## 📑 Table of Contents
- [✨ Core Capabilities](#-core-capabilities)
- [🚀 Quick Start in 1-Click](#-quick-start-in-1-click)
- [🧩 Core Modules](#-core-modules)
  - [1. Knowledge Hub (Document RAG)](#1-knowledge-hub-document-rag)
  - [2. Agent Playground (Bounded Tool Calling)](#2-agent-playground-bounded-tool-calling)
  - [3. Visual Workflow Studio (React Flow)](#3-visual-workflow-studio-react-flow)
  - [4. Coding Playground & DSA Tutor (C++ & Python)](#4-coding-playground--dsa-tutor-c--python)
  - [5. PDF-Based DSA Tutor & Personalized Learning Dashboard](#5-pdf-based-dsa-tutor--personalized-learning-dashboard)
  - [6. ORBIT AI Software Engineer Agent](#6-orbit-ai-software-engineer-agent)
  - [7. AI Model Library & Learning Center](#7-ai-model-library--learning-center)
  - [8. Course-to-Code Lab (Jupyter & Colab)](#8-course-to-code-lab-jupyter--colab)
  - [9. Runs, Evaluations & System Health](#9-runs-evaluations--system-health)
- [🏗️ System Architecture](#-system-architecture)
- [💻 HP Victus Laptop Setup & Hardware Profile](#-hp-victus-laptop-setup--hardware-profile)
- [📶 Offline-First Capabilities & Dependency Matrix](#-offline-first-capabilities--dependency-matrix)
- [💡 Two-Tier Execution: Demo vs. Ollama](#-two-tier-execution-demo-vs-ollama)
- [🛡️ Docker Sandboxing & Security](#-docker-sandboxing--security)
- [🧪 Automated Testing](#-automated-testing)
- [📂 Project Directory Tree](#-project-directory-tree)
- [📄 License](#-license)

---

## ✨ Core Capabilities

- 🔒 **Zero Paid Cloud APIs**: 100% functional out-of-the-box in **Demo Mode** without an OpenAI API key, cloud credits, or paid subscriptions.
- 🦙 **Native Ollama Local AI Integration**: Seamless connection to local LLMs (`llama3`, `mistral`, `qwen2.5`, `phi3`) with real function calling and strictly **zero silent fallback**.
- 🛠️ **Autonomous AI Software Engineer**: Translates natural-language project specifications into runnable full-stack web applications with genuine SQLite databases, automated test suites, and live development previews.
- 🎓 **Interactive C++ & Python DSA Tutor**: Learn, debug, and practice LeetCode and Data Structures & Algorithms with structured explanations, pseudocode, line-by-line walk-throughs, and dry-run traces.
- 📚 **Course-to-Code Lab**: Turn university course slides, syllabus PDFs, and code snippets into interactive lessons and valid, executable Jupyter Notebooks (`.ipynb` v4) with Google Colab compatibility.
- 🧠 **AI Model Library & Learning Center**: Curated catalog of open-weights models tailored to specific hardware profiles (like HP Victus laptops), test benchmarking, and side-by-side comparison rubrics.
- 📄 **PDF-Grounded Learning**: Ingest DSA textbooks and university lecture notes; learn directly from specific sections with page-aware citations.
- 🐳 **Secure Container Sandboxing**: Enforces Docker container execution with `--network=none`, `-m 512m`, `--cpus 1.0`, `--pids-limit 64`, and dropped capabilities.
- 📐 **Transparent Mathematical RAG**: Pure-Python **TF-IDF + Cosine Similarity** keyword retrieval with verifiable scoring and citations.
- 🔀 **Visual Workflow DAGs**: Drag, connect, and execute node-based workflows using React Flow with Kahn's topological sort and genuine human-in-the-loop approvals.
- 🚫 **Strictly No TypeScript**: Implemented purely in clean JavaScript (React JSX, Node.js ES Modules) and Python 3.11+.

---

## 🚀 Quick Start in 1-Click

### System Prerequisites
- **Node.js** (v18+ or v22 LTS recommended)
- **Python** (v3.11+)
- *(Optional)* [Ollama](https://ollama.com/) for local model inference (`ollama serve`)
- *(Optional)* [Docker Desktop](https://www.docker.com/) for container-isolated test runs

### Step 1: Clone Repository
```powershell
git clone https://github.com/omkhade75/prototype.git
cd prototype
```

### Step 2: One-Click Launch (Recommended)
Launch all 3 services (Python AI service, Express backend, and Vite frontend) with port conflict detection and live health monitoring:
```powershell
.\launch-orbit.ps1
```
> The script automatically verifies Python/Node runtimes, checks Ollama and Docker status, verifies ports 8000, 5000, and 3000, launches services in titled PowerShell windows, verifies health endpoints, and opens **[http://localhost:3000](http://localhost:3000)** in your default browser!

### Step 3: Clean Shutdown
To stop all ORBIT AI services cleanly without leaving orphan processes:
```powershell
.\stop-orbit.ps1
```

<details>
<summary><strong>Manual 3-Terminal Startup Option</strong></summary>

If you prefer launching each component manually:

<table>
<tr>
<th>Terminal 1: Python AI Service (:8000)</th>
<th>Terminal 2: Express Backend (:5000)</th>
<th>Terminal 3: Vite Frontend (:3000)</th>
</tr>
<tr>
<td>

```powershell
.\start-ai-service.ps1
```

</td>
<td>

```powershell
.\start-backend.ps1
```

</td>
<td>

```powershell
.\start-frontend.ps1
```

</td>
</tr>
</table>
</details>

---

## 🧩 Core Modules

<details open>
<summary><h3>1. Knowledge Hub (Document RAG)</h3></summary>

- **Ingestion**: Upload `.pdf`, `.txt`, and `.md` files up to 10MB.
- **Authentic Page Preservation**: Preserves true page numbers from PDFs without fabrication.
- **Chunking**: Overlapping sliding-window chunker (500-char window, 100-char overlap).
- **Retrieval**: Pure Python TF-IDF with inverted term index and cosine similarity vector matching.
- **Grounded Q&A**: Answers are strictly grounded in retrieved passages with verifiable citations (Document ID, Page Number, Chunk ID, TF-IDF Score).

```
Query: "What is WAL mode in SQLite?"
 ├── TF-IDF Vectorization & Inverted Index Matching
 ├── Matched Chunk #2 (Page 1) — Score: 0.4422 [Matched: "sqlite", "wal", "mode"]
 └── Grounded Answer + Source Passage Badges
```
</details>

<details open>
<summary><h3>2. Agent Playground (Bounded Tool Calling)</h3></summary>

Interact with an autonomous agent with complete visibility into its step-by-step reasoning trace:

- **Strict Tool Registry**:
  - `search_knowledge_base`: Queries uploaded document corpus using TF-IDF.
  - `summarize_document`: Produces an extractive summary of specified document IDs.
  - `generate_quiz`: Generates multi-choice quizzes based on retrieved topics.
  - `structured_result`: Formats structured JSON analysis with key takeaways.
- **Guardrails**: Hard limit of 5 steps per run; validated argument schemas; no arbitrary shell/code execution.
- **Observability**: Inspect timing, raw model inputs, tool parameters, observations, and citations.

</details>

<details open>
<summary><h3>3. Visual Workflow Studio (React Flow)</h3></summary>

Build and execute node-based DAG pipelines:

| Node Type | Function |
| :--- | :--- |
| **Input** | Accepts user text or structured parameters |
| **Knowledge Search** | Queries the knowledge base and fetches top-K passages |
| **AI Task** | Executes `summarize`, `extract`, or `transform` |
| **Condition** | Evaluates comparisons (`equals`, `contains`, `is_not_empty`) |
| **Human Approval** | **Pauses execution** with status `waiting_for_approval` until explicit sign-off |
| **Output** | Stores and displays the final executed pipeline payload |

> 💡 **Includes DAG Cycle Detection** using Kahn's topological sort algorithm and persistent SQLite state.

</details>

<details open>
<summary><h3>4. Coding Playground & DSA Tutor (C++ & Python)</h3></summary>

An IDE-style programming and algorithmic learning environment:

- **Bilingual Support**: Toggle between **C++17** and **Python 3.11** with preloaded idiomatic templates.
- **4 Tutor Pedagogical Modes**:
  1. **Learn**: Deep concept exploration, memory layout diagrams, edge cases, and visual mental models.
  2. **Build With Me**: Interactive scaffolded problem solving with hints and approach selection.
  3. **Debug**: Automated diagnostic analysis identifying syntax bugs, off-by-one errors, and segmentation faults.
  4. **Practice**: Real LeetCode problem prompts with verified official links, constraints, and test cases.
- **Structured Explanations**:
  - Problem Understanding & Invariants
  - Approach Comparison (Brute Force vs. Optimal)
  - Pseudocode
  - Formatted Solution Code
  - Line-by-Line Code Walkthrough
  - Step-by-Step Dry Run Table
  - Time & Space Complexity ($O(N)$, $O(1)$)
- **DSA Topic Browser**: Arrays, Strings, Hashing, Linked Lists, Stacks, Queues, Binary Search, Trees, Graphs, and Dynamic Programming.

</details>

<details open>
<summary><h3>5. PDF-Based DSA Tutor & Personalized Learning Dashboard</h3></summary>

Learn Data Structures and Algorithms directly from your uploaded university textbooks or PDFs:

- **Document Grounding**: Select any uploaded textbook (e.g. *CLRS*, *Grokking Algorithms*, lecture notes) to index chapters and topics.
- **Personalized Mastery Dashboard**:
  - Live mastery percentage calculation based on independent problem solves.
  - Active topic tracker with difficulty readiness metrics.
  - Socratic hint counter and quiz performance history.
  - Targeted revision alerts triggered when diagnostic quiz scores fall below threshold.

</details>

<details open>
<summary><h3>6. ORBIT AI Software Engineer Agent</h3></summary>

An autonomous local development agent that creates real, runnable full-stack web applications:

```mermaid
flowchart LR
    A[Natural Language Prompt] --> B[Architecture Plan]
    B --> C[Scaffold Full-Stack Files]
    C --> D[Universal SQLite Database Engine]
    D --> E[Sandboxed Automated Tests]
    E -->|Pass| F[Live Development Preview]
    E -->|Fail| G[AI-Assisted Diagnostic Repair]
    G --> E
    F --> H[Git Secret Screening & Commit Gate]
```

- **Authentic Dual-Engine Planning**:
  - **Ollama Mode**: Local model inference generates custom architectures, database schemas, and REST endpoints for arbitrary domains.
  - **Demo Mode**: Dynamic NLP entity extraction parses arbitrary prompts into database tables and Express routes.
  - **Clarification Gate**: Halts and prompts the user if the initial specification is ambiguous or underspecified.
- **Real SQLite Database Persistence**:
  - Generates actual binary `.db` files on disk (`SQLite format 3\0`) using Node 22+ native `node:sqlite` or `better-sqlite3`.
  - Implements real SQL DDL (`CREATE TABLE`), foreign keys, and parameterized queries (`SELECT`, `INSERT`, `DELETE`).
- **Container Isolation & Sandboxed Command Runner**:
  - Enforces Docker container isolation (`node:20-alpine`, `-m 512m`, `--cpus 1.0`, `--pids-limit 64`, `--cap-drop=ALL`, `--network=none`).
  - Refuses untrusted host execution if Docker is offline, unless explicit development host override is authorized with visible audit warnings.
- **Live Preview Management**: Starts and monitors child development servers on dynamic ports with real-time streaming logs.
- **Safe Git Operations**:
  - Pre-commit secret screening scans for API keys, private keys, `.env` files, and database binaries.
  - Requires explicit human approval for commits and remote pushes.
  - Confined strictly to `workspaces/<project_id>/`—never touches ORBIT AI's root repository.

</details>

<details open>
<summary><h3>7. AI Model Library & Learning Center</h3></summary>

An integrated workstation to discover, evaluate, and manage local AI models without leaving ORBIT:

- **Hardware Profile Matching**: Pre-configured profiles for developer machines, including the user's **HP Victus** laptop (RTX 3050 6GB VRAM, 16GB RAM), indicating VRAM head-room, quantization fit (Q4 vs Q8), and tokens-per-second expectations.
- **Curated Offline Catalog**: 10 open-weights models categorized by domain: Coding Specialists (`qwen2.5-coder:7b`, `codellama:7b`, `deepseek-coder:6.7b`), General Reasoning (`llama3.2:3b`, `mistral:7b`), and Compact/Fast (`phi3:mini`).
- **Local Ollama Daemon Inspection**: Real-time status reporting against `http://localhost:11434`, distinguishing downloaded weights from unpulled catalog entries.
- **Live Interactive Model Testing**: Test prompts against active models across Coding, Reasoning, and Extraction tasks with rubric ratings (Correctness, Code Quality, Speed) persisted to SQLite.
- **Side-by-Side Model Comparison**: Compare responses, execution times, and rubric scores between two models.
- **Shared Active Model Propagation**: Changing the active model in the Model Library automatically updates the default model across the Agent Playground, DSA Tutor, Software Engineer, and Course-to-Code Lab.

</details>

<details open>
<summary><h3>8. Course-to-Code Lab (Jupyter & Colab)</h3></summary>

Bridge academic study and practical programming:

- **Multi-Format Course Ingestion**: Supports `.pdf`, `.txt`, `.md`, `.py`, `.cpp`, `.js`, and `.ipynb` files with automatic code snippet harvesting.
- **Honest Scanned Page Detection**: Detects scanned or image-only PDF pages without text, flagging them honestly with actionable guidance instead of simulating extracted text.
- **Knowledge Hub Bridge**: Re-use documents already indexed in the Knowledge Hub without redundant file storage.
- **4 Pedagogical Learning Modes**:
  - **Learn**: Plain-English concept explanations with verifiable source citations (`[Source: filename, Page X]`).
  - **Explain Code**: Line-by-line walk-throughs, input/output contracts, algorithmic dry-run trace tables, and time/space complexity analysis.
  - **Debug**: Error diagnosis, root-cause identification, and smallest minimal fix with clear distinction between static linting and containerized execution.
  - **Practise**: Dynamic exercise generator with 3 progressive hints, reference solution, and tracking of independent solves.
- **Jupyter Notebook Generator**: Assembles snippets into compliant Jupyter Notebook v4 (`.ipynb`) files with deduplicated import cells, markdown explanations, and assertion verification cells.
- **AST Correctness & Dependency Checking**: Validates Python syntax using `ast.parse`, flags out-of-order cell execution, and screens for hardcoded credentials.
- **Google Colab Workflow**: Generates notebooks with official `Open in Colab` badges and secure `google.colab.userdata` credential handling.

</details>

<details>
<summary><h3>9. Runs, Evaluations & System Health</h3></summary>

- **Execution Trace Viewer**: Inspect run latency, timestamps, status (`running`, `successful`, `failed`, `waiting_for_approval`), and step-by-step inputs/outputs.
- **Deterministic Evaluation Suite**: Measures real performance against automated benchmarks:
  1. *Knowledge Retrieval Grounding*
  2. *Missing Information Rejection (Zero-Match Fallback)*
  3. *Tool Argument Schema Validation*
  4. *Human Approval State Transition & Idempotency*
- **Real-Time Health Monitor**: Live connectivity status for the Express API gateway, SQLite database, Python AI microservice, and local Ollama daemon.

</details>

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Frontend["React Frontend (Vite :3000)"]
        UI["Glassy Dark Design System (Pure JavaScript JSX)"]
        KH["Knowledge Hub (RAG)"]
        AP["Agent Playground"]
        WS["Workflow Studio (React Flow)"]
        CP["Coding Playground & Tutor"]
        SWE["Software Engineer Workspace"]
        ML["AI Model Library & Testing"]
        CC["Course-to-Code Lab"]
        RE["Runs & Evaluations"]
        SH["Settings & Health"]
    end

    subgraph Backend["Express.js API Gateway (:5000)"]
        Router["Express Controllers & Routes"]
        WFE["Workflow DAG Engine (Kahn's Sort)"]
        EVAL["Evaluation Runner"]
        SE_SVC["Engineer Service (Workspaces, Previews, Git)"]
        MOD_SVC["Model Service (Catalog, Ratings, Settings)"]
        CRS_SVC["Course Lab Service (Notebooks, Snippets)"]
        DB[(SQLite 3 WAL Mode)]
    end

    subgraph AIService["Python FastAPI Microservice (:8000)"]
        Ext["Document Extractor (PDF/TXT/MD/Code)"]
        TFIDF["TF-IDF Keyword Retriever"]
        Agent["Bounded Agent Loop"]
        CodingTutor["DSA Tutor Engine (C++ / Python)"]
        CodeRunner["Sandboxed Code Execution Engine"]
        SweAgent["Software Engineer Orchestrator"]
        NbBuilder["Jupyter Notebook Builder & AST Validator"]
        OllamaMgr["Ollama Daemon Manager & Catalog"]
        DemoProv["Demo Provider (Extractive / Deterministic)"]
        OllamaProv["Ollama Provider (Local LLM Native API)"]
    end

    subgraph Sandbox["Execution Boundary"]
        DockerBox["Docker Container Isolation (--network=none, 512MB RAM, 1 CPU)"]
        Workspaces["Sandboxed Workspaces (workspaces/<project-id>)"]
    end

    UI --> Router
    Router --> WFE
    Router --> EVAL
    Router --> SE_SVC
    Router --> MOD_SVC
    Router --> CRS_SVC
    Router --> DB
    SE_SVC --> Workspaces
    Router --> Ext
    Router --> TFIDF
    Router --> Agent
    Router --> CodingTutor
    Router --> CodeRunner
    Router --> SweAgent
    Router --> NbBuilder
    Router --> OllamaMgr
    CodeRunner --> DockerBox
    SweAgent --> DockerBox
    Agent --> DemoProv
    Agent --> OllamaProv
    OllamaMgr --> OllamaProv
```

---

## 💻 HP Victus Laptop Setup & Hardware Profile

ORBIT AI includes a dedicated hardware profile calibrated for the **HP Victus Laptop**:

| Specification | Hardware Detail | ORBIT AI Capability Profile |
| :--- | :--- | :--- |
| **Processor** | Intel Core i7 (12th/13th Gen, 14 Cores / 20 Threads) | High-speed multi-threaded TF-IDF indexing & AST parsing |
| **Graphics** | NVIDIA GeForce RTX 3050 Laptop GPU (**6 GB GDDR6 VRAM**) | GPU acceleration for models up to **7B/8B parameters (Q4)** |
| **System RAM** | **16 GB DDR4/DDR5** | Smooth multitasking across Frontend + Backend + AI Service + Ollama |
| **Storage** | NVMe PCIe M.2 SSD | Instant SQLite WAL read/writes and rapid notebook generation |

### Recommended Models for HP Victus (6 GB VRAM)
To ensure smooth GPU offloading without swapping to system RAM:
1. **`llama3.2:3b`** (~2.0 GB VRAM) — *Lightning fast (45+ tok/sec), ideal for explanations and agent tool calling.*
2. **`qwen2.5-coder:7b`** (~4.7 GB VRAM) — *Exceptional coding accuracy, fits within 6 GB VRAM.*
3. **`mistral:7b-instruct-q4_K_M`** (~4.1 GB VRAM) — *Balanced reasoning and concise tutorial walk-throughs.*
4. **`deepseek-r1:8b`** (~4.9 GB VRAM) — *Chain-of-thought mathematical and algorithmic problem solving.*

---

## 📶 Offline-First Capabilities & Dependency Matrix

ORBIT AI operates primarily offline. The table below details what functions offline versus external dependencies:

| Feature / Workflow | Offline Capability | Requirements |
| :--- | :--- | :--- |
| **Demo Mode (All Modules)** | 🟢 **100% Offline** | Zero GPU, zero external models. Pure Python & Node runtime. |
| **Knowledge Hub (RAG)** | 🟢 **100% Offline** | Pure Python TF-IDF and cosine similarity. No cloud embeddings. |
| **SQLite Persistence** | 🟢 **100% Offline** | Local SQLite 3 WAL database in `backend/data/orbit_ai.db`. |
| **Notebook Generation & AST Check** | 🟢 **100% Offline** | Local `.ipynb` v4 synthesis and `ast.parse` syntax validation. |
| **Model Catalog & Hardware Profiles** | 🟢 **100% Offline** | Curated offline database in `catalog_data.py`. |
| **Local LLM Inference (Ollama)** | 🟡 **Local Offline** *(Once pulled)* | Requires Ollama running and model pulled (`ollama pull <model>`). |
| **Docker Isolated Code Runner** | 🟡 **Local Offline** *(Once pulled)* | Requires Docker Desktop running with `node:20-alpine` / `python:3.11`. |
| **Software Engineer Full-Stack Builds** | 🟡 **Local Offline** *(If cached)* | Full template scaffolding works offline. `npm install` uses local cache if offline. |
| **Model Weight Downloads** | 🔴 **Online Only** | Requires internet to pull model weights from ollama.com. |
| **Google Colab Direct Opening** | 🔴 **Online Only** | Requires internet to navigate to Google Colab in browser. |
| **GitHub Git Push** | 🔴 **Online Only** | Requires internet to push to remote GitHub repository. |

---

## 💡 Two-Tier Execution: Demo vs. Ollama

| Feature | Demo Mode (Default) | Ollama Mode (Native Local AI) |
| :--- | :--- | :--- |
| **Hardware Required** | Standard laptop / low-spec CPU | GPU or modern CPU for local inference |
| **Dependencies** | Pure Python 3.11+ | Local Ollama daemon (`ollama serve`) |
| **Active Model** | Deterministic Grounded Engine | `llama3`, `mistral`, `qwen2.5`, `phi3` |
| **Cost** | **$0.00 (100% Free)** | **$0.00 (100% Free Local)** |
| **Offline Handling** | Always available | Clear failure reporting with diagnostics (**No silent fallback**) |
| **Response Label** | Explicitly tagged `demo` | Tagged with real model name (`llama3`) |

---

## 🛡️ Docker Sandboxing & Security

Untrusted user code and generated full-stack applications run with strict isolation:

* **Container Isolation**:
  ```bash
  docker run --rm \
    --network=none \
    -m 512m \
    --cpus 1.0 \
    --pids-limit 64 \
    --cap-drop=ALL \
    -v "/path/to/workspace:/workspace:rw" \
    -w /workspace \
    node:20-alpine npm test
  ```
* **Resource Quotas**: Hard-capped at 512MB RAM, 1.0 CPU core, 64 processes/threads, and 30-second execution timeouts.
* **Network Isolation**: Complete network disconnection (`--network=none`) prevents data exfiltration.
* **Volume Isolation**: Only the active project directory is mounted. Host operating system files and Docker sockets are never exposed.
* **Dockerless Environments**: If Docker is not present, untrusted execution is refused with clear setup instructions. An explicit development override flag (`allow_host_override=true`) is available for local testing, recording visible security warnings.

---

## 🧪 Automated Testing

ORBIT AI includes automated test suites across the Python AI service, Node.js backend, and generated workspaces:

```powershell
.\run-tests.ps1
```

### Test Suite Metrics

1. **Python FastAPI Service (97 Tests)**:
   ```powershell
   python -m pytest ai-service/tests -v
   ```
   * RAG extraction, chunking, and TF-IDF mathematical retrieval (11 tests)
   * Agent tool registry and bounded step enforcement (6 tests)
   * C++ and Python code runner sandbox and test harness (15 tests)
   * DSA tutor pedagogy and PDF topic identification (17 tests)
   * Ollama native function calling and offline refusal (8 tests)
   * Software Engineer path canonicalization, command allowlisting, and secret screening (13 tests)
   * AI Model Library catalog, Ollama manager, and comparison rubrics (10 tests)
   * Course-to-Code Lab extraction, AST syntax validation, and notebook synthesis (10 tests)
   * **Total: 97 passed, 0 failed (100% pass rate)**

2. **Node.js Express Backend (51 Tests)**:
   ```powershell
   node --test backend/tests/*.test.js
   ```
   * SQLite WAL database schema and non-destructive seeding (3 tests)
   * Workflow DAG validation and Kahn's topological cycle detection (3 tests)
   * Evaluation runner and human-in-the-loop approval transitions (1 test)
   * Coding service proxying and runner status (4 tests)
   * Learning progress tracking, hints, and quiz attempts (6 tests)
   * Software engineer workspace lifecycle, path traversal denial, and git secret screening (12 tests)
   * AI Model Library persistence, rubric ratings, and comparison sessions (5 tests)
   * Course-to-Code Lab CRUD, snippets, and notebook persistence (6 tests)
   * Agent service runs and step recording (1 test)
   * **Total: 51 passed, 0 failed (100% pass rate)**

3. **Generated Project Integration Test (4 Tests)**:
   ```powershell
   cd workspaces/restaurant-management
   node --test tests/api.test.js
   ```
   * Real binary SQLite `.db` file existence (`SQLite format 3\0`)
   * SQL DDL schema initialization
   * SQL queries, inserts, deletes, and aggregate functions (`SUM`, `COUNT`)
   * **Total: 4 passed, 0 failed (100% pass rate)**

4. **Frontend Production Build**:
   ```powershell
   cd frontend
   npm run build
   ```
   * Clean production build via Vite: **0 errors, 1.95s build time**.

---

## 📂 Project Directory Tree

```
orbit-ai/
├── frontend/             # React application (Vite, JavaScript JSX, Glassy CSS)
│   ├── src/pages/        # KnowledgeHub, AgentPlayground, WorkflowStudio,
│   │                     # CodingPlayground, SoftwareEngineer, ModelLibrary,
│   │                     # CourseLab, Evaluations, Settings
│   └── src/components/   # Navigation Sidebar, Glassy Cards, Test Result Viewers
├── backend/              # Node.js Express API Gateway (ES Modules)
│   ├── src/database/     # SQLite schema (WAL mode) and non-destructive seed data
│   ├── src/services/     # Workflow DAG, engineerService, modelService, courseLabService
│   ├── src/controllers/  # Express REST API controllers
│   ├── src/routes/       # Express API routes (/api/*)
│   └── tests/            # Automated Node.js unit and integration tests (51 tests)
├── ai-service/           # Python 3.11+ FastAPI microservice
│   ├── app/rag/          # PDF/TXT extractor, text chunker, TF-IDF retriever
│   ├── app/tools/        # Bounded tool registry with JSON argument validation
│   ├── app/agents/       # Bounded agent loop with trace logging
│   ├── app/coding/       # DSA topic catalog, tutor pedagogy, C++/Python runner
│   ├── app/engineer/     # Software Engineer agent, planner, scaffolder, command runner
│   ├── app/models/       # OllamaProvider, DemoProvider, OllamaManager, ModelCatalog
│   ├── app/course/       # Course extractor, assistant, notebook builder, AST validator
│   └── tests/            # Automated pytest test suites (97 tests)
├── workspaces/           # Isolated project workspaces generated by the AI Engineer
│   └── restaurant-management/ # Reference generated project with real SQLite
├── docs/                 # Architectural specifications, API guides, Docker setup
│   └── DOCKER_SANDBOX_SETUP.md
├── launch-orbit.ps1      # 1-Click launcher with port detection and health verification
├── stop-orbit.ps1        # 1-Click clean shutdown script
├── run-tests.ps1         # Comprehensive test suite runner
├── start-ai-service.ps1  # Launch script for FastAPI microservice (:8000)
├── start-backend.ps1     # Launch script for Express API gateway (:5000)
├── start-frontend.ps1    # Launch script for React Vite frontend (:3000)
├── .env.example          # Environment variables template
└── .gitignore            # Excludes node_modules, *.db, .venv, dist, caches
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for learning, experimentation, and local AI engineering.

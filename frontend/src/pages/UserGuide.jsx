import React, { useState } from 'react';
import { 
  Compass, 
  BookOpen, 
  Code2, 
  Terminal, 
  Boxes, 
  GraduationCap, 
  Workflow, 
  Bot, 
  Activity, 
  Settings, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Laptop, 
  Play, 
  Sparkles,
  ChevronDown,
  ChevronRight,
  FileCode,
  FileText,
  Home as HomeIcon
} from 'lucide-react';

export function UserGuide({ setCurrentTab }) {
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'tabs' | 'goals' | 'tutorials' | 'offline' | 'troubleshooting'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCmd, setCopiedCmd] = useState(null);
  const [expandedTabId, setExpandedTabId] = useState('engineer');
  const [expandedGoalId, setExpandedGoalId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Section B: Detailed Tab Guides
  const tabGuides = [
    {
      id: 'home',
      name: 'Home',
      icon: HomeIcon,
      color: 'var(--accent-violet)',
      summary: 'Welcome dashboard, local readiness checklist, and fast feature launcher.',
      whatItIs: 'The central entry point of ORBIT AI. It displays live local service status, HP Victus hardware calibration, and recommended next steps.',
      whyUse: 'To quickly check if all services (Express, Python AI, SQLite, Ollama, Docker) are healthy and pick an activity.',
      whenToUse: 'When launching ORBIT, checking system readiness, or returning to a high-level overview.',
      prerequisites: 'None. Always available offline.',
      steps: [
        'Inspect the Local System Readiness Checklist for healthy green badges.',
        'Review the HP Victus Calibration card for model recommendations.',
        'Click any capability card or quick-action button to jump directly into your workflow.'
      ],
      example: 'Check that Port 5000 and Port 8000 are ready before launching the Software Engineer.',
      successState: 'All mandatory checklist items show green "Ready" indicators.',
      commonErrors: 'Port conflict warning: Another process is using Port 3000, 5000, or 8000. Run ./stop-orbit.ps1 to clear.',
      requirements: 'Mandatory: None. Optional: Ollama on Port 11434 for local model inference.'
    },
    {
      id: 'user-guide',
      name: 'Start Here / User Guide',
      icon: Compass,
      color: 'var(--accent-blue)',
      summary: 'Comprehensive interactive documentation, beginner tutorials, and troubleshooting.',
      whatItIs: 'The complete offline handbook for ORBIT AI explaining every tab, goal-based routes, tutorials, and system troubleshooting.',
      whyUse: 'To understand how ORBIT operates without needing outside guidance or guessing button actions.',
      whenToUse: 'When you are new to ORBIT, unsure which tab to pick, or need step-by-step tutorial instructions.',
      prerequisites: 'None. Operates 100% offline.',
      steps: [
        'Browse Section B for in-depth tab-by-tab walkthroughs.',
        'Use Section C "Which Feature Should I Use?" to match your immediate goal to a tab.',
        'Follow Section D for numbered beginner tutorials with real UI actions.'
      ],
      example: 'Look up "How to build a full-stack project" to see exact steps before using the Software Engineer tab.',
      successState: 'Clear understanding of the correct tab and first action for your task.',
      commonErrors: 'None.',
      requirements: 'Mandatory: None. Optional: None.'
    },
    {
      id: 'knowledge',
      name: 'Knowledge Hub',
      icon: BookOpen,
      color: 'var(--accent-blue)',
      summary: 'RAG Document Management & Verifiable TF-IDF Q&A.',
      whatItIs: 'A local document ingestion and question-answering workspace powered by pure-Python TF-IDF and cosine similarity.',
      whyUse: 'To upload textbooks, PDFs, and lecture notes, and get answers grounded directly in the text with exact page citations.',
      whenToUse: 'When you have study notes or textbooks and want to ask conceptual questions with verifiable proof.',
      prerequisites: 'Supported document format (.pdf, .txt, .md) up to 10MB.',
      steps: [
        'Click "Upload Document" and select a PDF, TXT, or Markdown file.',
        'Wait for the sliding-window chunker to extract text and compute token counts.',
        'Type a question into the query box and click "Search & Answer".',
        'Inspect the retrieved source chunks, similarity scores, and page numbers.'
      ],
      example: 'Upload "Operating Systems Notes.pdf" and ask "What is the difference between mutex and semaphore?".',
      successState: 'An extractive answer accompanied by matched chunk badges showing Document ID, Page Number, and TF-IDF Score.',
      commonErrors: 'No matching passages found: The query terms were not present in the document. Try broadening your keywords.',
      requirements: 'Mandatory: Python AI service (:8000). Optional: Ollama for neural generation.'
    },
    {
      id: 'agent',
      name: 'Agent Playground',
      icon: Bot,
      color: 'var(--accent-magenta)',
      summary: 'Bounded Autonomous Agent & Observable Execution Trace.',
      whatItIs: 'An interactive testbed for an autonomous tool-calling AI agent. You submit prompts and watch the agent execute up to 5 bounded steps.',
      whyUse: 'To understand how AI agents reason, select tools, handle parameters, and produce structured results with full execution trace visibility.',
      whenToUse: 'When testing agent behavior, observing tool arguments, or evaluating Demo Mode vs Ollama function calling.',
      prerequisites: 'Ingested documents in Knowledge Hub if testing document search tools.',
      steps: [
        'Select AI Provider: "Demo Mode" (deterministic) or "Ollama Local" (neural).',
        'Choose a prebuilt prompt or type your own instruction.',
        'Click "Run Agent Loop" and observe step-by-step thoughts, tool selections, and observations.',
        'Inspect the persisted execution steps in SQLite.'
      ],
      example: 'Prompt: "Search knowledge base for WAL mode and generate a 3-question quiz with answers."',
      successState: 'Completed run showing 2–4 execution steps, tool argument badges, observation results, and a final structured response.',
      commonErrors: 'Ollama model offline: Run "ollama run llama3.2" or switch to Demo Mode.',
      requirements: 'Mandatory: Python AI (:8000), Backend (:5000). Optional: Ollama (:11434).'
    },
    {
      id: 'coding',
      name: 'Coding Playground & DSA Tutor',
      icon: Code2,
      color: 'var(--accent-amber)',
      summary: 'Structured C++ & Python Learning, Intuition Building & LeetCode Prep.',
      whatItIs: 'A bilingual IDE and algorithm tutor supporting C++17 and Python 3.11 with 4 pedagogical modes and a comprehensive LeetCode problem catalogue.',
      whyUse: 'To transition from understanding concepts to writing correct code with guided hints, dry-run tables, and automated test cases.',
      whenToUse: 'When practicing DSA topics (Arrays, Trees, DP), solving LeetCode problems, or debugging code failures.',
      prerequisites: 'None for Learn/Build With Me/Debug/Practise modes. Docker Desktop required for container-isolated test execution.',
      steps: [
        'Browse DSA Topics (e.g., Two Pointers, Dynamic Programming) or select a LeetCode problem.',
        'Choose your language: C++17 or Python 3.11.',
        'Select a Tutor Mode: "Learn" for concept intuition, "Build With Me" for guided scaffolding, "Debug" for bug analysis, or "Practise" for exercises.',
        'Write your code in the editor and click "Run Tests" to evaluate test cases.'
      ],
      example: 'Select "Two Sum", switch to Python, and click "Build With Me" to learn the hash map complement strategy.',
      successState: 'Passing test cases with runtime metrics or a line-by-line explanation with an algorithmic dry-run trace table.',
      commonErrors: 'Docker Offline: Code execution is safely refused without container isolation. Use static tutor modes or start Docker Desktop.',
      requirements: 'Mandatory: Python AI (:8000). Optional: Docker Desktop for isolated compilation/execution.'
    },
    {
      id: 'engineer',
      name: 'Software Engineer',
      icon: Terminal,
      color: 'var(--accent-indigo)',
      summary: 'Autonomous Full-Stack Local Agent & Workspace Sandbox.',
      whatItIs: 'An autonomous local software development agent that transforms natural-language prompts into real, runnable React + Express + SQLite applications.',
      whyUse: 'To generate working full-stack applications with real binary databases, automated tests, safe file tools, and live preview servers.',
      whenToUse: 'When you want to build a complete project (e.g., bakery portal, fitness tracker) from a prompt without manual scaffolding.',
      prerequisites: 'None. Scaffolding and template engines work 100% offline.',
      steps: [
        'Select an existing project or click "New Project" and describe your application.',
        'Click "Plan Project" to generate architecture, database tables, and implementation tasks.',
        'Click "Generate & Run" to scaffold files, initialize the SQLite database, and run automated tests.',
        'Inspect the File Explorer on the left, click files to view code in the center editor.',
        'Click "Start Preview" to launch a live child server and preview your app in browser.'
      ],
      example: 'Prompt: "Build a bookstore inventory and order management system with React, Express, and SQLite."',
      successState: 'A full directory in workspaces/ containing package.json, server.js, a real SQLite .db file, React UI, passing tests, and live preview.',
      commonErrors: 'Preview fails to start: Ensure port is not occupied. Check logs in the Activity & Results panel.',
      requirements: 'Mandatory: Backend (:5000), Python AI (:8000). Optional: Ollama for custom prompt planning, Docker for isolated tests.'
    },
    {
      id: 'models',
      name: 'AI Model Library',
      icon: Boxes,
      color: 'var(--accent-violet)',
      summary: 'Discover, Install, Benchmark, and Compare Local & Open-Weight AI Architectures.',
      whatItIs: 'A hardware-aware local AI model management center calibrated for your machine (HP Victus 6GB VRAM), featuring 10 curated open-weights models.',
      whyUse: 'To find the best local model for your hardware, test model responses side-by-side, score accuracy rubrics, and set the default model across ORBIT.',
      whenToUse: 'When choosing an LLM for coding vs general reasoning, checking Ollama status, or benchmarking model quality.',
      prerequisites: 'Ollama installed locally if you want to pull and run neural weights.',
      steps: [
        'Review the HP Victus Hardware Fit recommendations (e.g., Llama 3.2 3B, Qwen 2.5 Coder 7B).',
        'Browse the Catalog tab to see model sizes, quantization types (Q4/Q8), and memory requirements.',
        'Copy the pull command (e.g., "ollama run qwen2.5-coder:7b") and run it in PowerShell.',
        'Use the Test Bench to test prompts across Coding, Reasoning, and Extraction tasks.',
        'Click "Set as Active Model" to propagate your selection across all other ORBIT tabs.'
      ],
      example: 'Compare Qwen 2.5 Coder 7B against Llama 3 on a binary search implementation task.',
      successState: 'Side-by-side response comparison with latency, tokens/sec, and rubric ratings saved to SQLite.',
      commonErrors: 'Model not installed: The catalog lists available models; run the copyable command in your terminal to download weights.',
      requirements: 'Mandatory: Backend (:5000), Python AI (:8000). Optional: Ollama daemon on Port 11434.'
    },
    {
      id: 'course-lab',
      name: 'Course-to-Code Lab',
      icon: GraduationCap,
      color: 'var(--accent-teal)',
      summary: 'Course Materials, Structured Lesson Scaffolding & Jupyter Notebook Generator.',
      whatItIs: 'An academic workstation that converts syllabus materials, lecture PDFs, and code snippets into interactive lessons and valid Jupyter Notebooks (.ipynb v4).',
      whyUse: 'To bridge lecture theory and coding practice, harvest code snippets into a scratchpad, and export notebooks compatible with Google Colab.',
      whenToUse: 'When studying computer science courses, working through assignments, or turning lecture slides into runnable code.',
      prerequisites: 'Course file (.pdf, .py, .cpp, .js, .txt, .md, .ipynb).',
      steps: [
        'Select a course (e.g. CS106B) or upload new course materials.',
        'Choose a lesson from the syllabus tree.',
        'Use the Assistant modes: Learn (concept overview), Explain Code (line-by-line trace), Debug (minimal fix), or Practise (progressive hints).',
        'Save useful snippets into your code scratchpad drawer.',
        'Switch to "Notebook Builder", assemble your snippets, and click "Validate & Build Notebook".',
        'Click "Download .ipynb" to run locally or open directly in Google Colab.'
      ],
      example: 'Convert Lecture 7 on Dijkstra Algorithm into a Colab-ready notebook with hoisted imports and assertion verification.',
      successState: 'A valid .ipynb file that passes Python AST syntax checking, dependency order verification, and credential screening.',
      commonErrors: 'Scanned PDF page detected: The uploaded PDF page is an image without text. Use text-based PDFs or export slides as text.',
      requirements: 'Mandatory: Backend (:5000), Python AI (:8000). Optional: Google account for Colab.'
    },
    {
      id: 'workflows',
      name: 'Workflow Studio',
      icon: Workflow,
      color: 'var(--accent-cyan)',
      summary: 'Visual DAG Pipeline Automation & Human-in-the-Loop.',
      whatItIs: 'A visual drag-and-drop workflow builder using React Flow to construct directed acyclic graphs (DAGs) linking input, search, AI, and human approval nodes.',
      whyUse: 'To automate multi-step pipelines where sensitive AI actions require human sign-off before proceeding.',
      whenToUse: 'When chaining knowledge search into summarization and requiring manual review before output generation.',
      prerequisites: 'None. Pre-seeded workflows exist for instant testing.',
      steps: [
        'Select a workflow from the template dropdown or build a new DAG.',
        'Drag nodes (Input, Knowledge Search, AI Task, Condition, Human Approval, Output) onto the canvas.',
        'Connect node handles to establish execution order.',
        'Click "Execute Workflow" to run Kahn topological sorting.',
        'When execution hits a Human Approval node, inspect the payload and click "Approve" or "Reject".'
      ],
      example: 'Pipeline: Ingest Customer Issue -> Search KB -> Draft AI Response -> Human Approval -> Final Resolution.',
      successState: 'Execution state reaches "completed" with every node turning green and outputs logged to SQLite.',
      commonErrors: 'Cycle detected: The graph contains a loop. Remove cyclic connections so execution flows strictly forward.',
      requirements: 'Mandatory: Backend (:5000), Python AI (:8000).'
    },
    {
      id: 'runs',
      name: 'Runs & Evaluations',
      icon: Activity,
      color: 'var(--accent-emerald)',
      summary: 'System Execution Logs & Automated Regression Test Suites.',
      whatItIs: 'A central observability and quality assurance console tracking all agent runs, workflow executions, and automated benchmark evaluation suites.',
      whyUse: 'To audit execution latency, inspect step-by-step observations, verify RAG grounding, and ensure system reliability.',
      whenToUse: 'When debugging an agent failure, checking timing performance, or running automated evaluation benchmarks.',
      prerequisites: 'None. Reads from persistent SQLite tables.',
      steps: [
        'Switch between "Agent Runs", "Workflow Runs", and "System Evaluations" tabs.',
        'Click any run row to view detailed step inputs, outputs, timestamps, and error messages.',
        'Click "Run Benchmark Suite" to test Grounding, Missing Info Rejection, Schema Validation, and Approval Idempotency.'
      ],
      example: 'Inspect Agent Run #4 to see exact parameters passed to the search_knowledge_base tool.',
      successState: 'Benchmark suite reports 100% pass rate with zero silent regressions.',
      commonErrors: 'None.',
      requirements: 'Mandatory: Backend (:5000).'
    },
    {
      id: 'settings',
      name: 'Settings & Health',
      icon: Settings,
      color: 'var(--accent-magenta)',
      summary: 'Microservice Connectivity, SQLite WAL & AI Providers.',
      whatItIs: 'System administration console providing real-time port status, database metrics, provider toggles, and dependency audits.',
      whyUse: 'To verify system health, test connectivity to the Python AI service and Ollama daemon, and inspect database statistics.',
      whenToUse: 'When troubleshooting service connectivity or checking how many documents and chunks are stored in SQLite.',
      prerequisites: 'None.',
      steps: [
        'Review the Status Cards for Backend (Port 5000), Python AI (Port 8000), and SQLite Database.',
        'Check the Ollama Local LLM connectivity badge.',
        'Inspect SQLite Statistics: Documents, Chunks, Projects, Workflows, and Runs.',
        'Click "Refresh Health" to trigger a live ping across all microservices.'
      ],
      example: 'Verify that the SQLite WAL database has 4 seeded chunks and WAL journal mode enabled.',
      successState: 'All connected services show green "Connected" status.',
      commonErrors: 'Python AI service unreachable: Ensure "uvicorn app.main:app" is running on Port 8000.',
      requirements: 'Mandatory: Backend (:5000).'
    }
  ];

  // Section C: Goal-Based "Which Feature Should I Use?"
  const goalRoutes = [
    {
      id: 'goal-1',
      goal: 'I want to learn a programming concept (e.g. recursion, pointers, heaps).',
      recommend: 'Coding Playground & DSA Tutor',
      tabId: 'coding',
      firstAction: 'Open Coding Playground, choose your language (C++ or Python), and select the "Learn" tutor mode.'
    },
    {
      id: 'goal-2',
      goal: 'I have a university DSA lecture PDF and need help studying it.',
      recommend: 'Course-to-Code Lab',
      tabId: 'course-lab',
      firstAction: 'Upload the PDF in Course-to-Code Lab, select a lesson, and click "Learn" or "Explain Code" for page-grounded walk-throughs.'
    },
    {
      id: 'goal-3',
      goal: 'I want to solve a LeetCode problem step-by-step.',
      recommend: 'Coding Playground & DSA Tutor',
      tabId: 'coding',
      firstAction: 'Select a problem from the LeetCode catalog (e.g. Two Sum, Valid Parentheses) and switch to "Build With Me" mode.'
    },
    {
      id: 'goal-4',
      goal: 'My code is failing test cases and I do not know why.',
      recommend: 'Coding Playground (Debug Mode) or Course Lab',
      tabId: 'coding',
      firstAction: 'Paste your code into the editor, select "Debug" mode, and ask the tutor to find the root cause and provide the minimal fix.'
    },
    {
      id: 'goal-5',
      goal: 'I want to understand an existing code snippet line-by-line.',
      recommend: 'Course-to-Code Lab (Explain Code)',
      tabId: 'course-lab',
      firstAction: 'Add the snippet to the Course-to-Code scratchpad and click "Explain Code" for an algorithmic trace and dry-run table.'
    },
    {
      id: 'goal-6',
      goal: 'I want to upload my lecture notes and ask questions with citations.',
      recommend: 'Knowledge Hub',
      tabId: 'knowledge',
      firstAction: 'Upload your .pdf or .txt notes, wait for chunking, and type your question to get answers backed by TF-IDF citations.'
    },
    {
      id: 'goal-7',
      goal: 'I want to combine course code snippets into a runnable Jupyter Notebook.',
      recommend: 'Course-to-Code Lab (Notebook Builder)',
      tabId: 'course-lab',
      firstAction: 'Collect snippets in the scratchpad, switch to "Notebook Builder", and click "Validate & Build Notebook" to export a .ipynb file.'
    },
    {
      id: 'goal-8',
      goal: 'I want to build a complete full-stack website from a prompt.',
      recommend: 'AI Software Engineer',
      tabId: 'engineer',
      firstAction: 'Click "New Project", describe what you want to build, click "Plan Project", and then click "Generate & Run".'
    },
    {
      id: 'goal-9',
      goal: 'I want to discover, benchmark, and compare local AI models on my laptop.',
      recommend: 'AI Model Library',
      tabId: 'models',
      firstAction: 'Check the HP Victus hardware profile recommendations, browse the catalog, and test models in the Test Bench.'
    },
    {
      id: 'goal-10',
      goal: 'I want to create an automated workflow pipeline with human approval.',
      recommend: 'Workflow Studio',
      tabId: 'workflows',
      firstAction: 'Open Workflow Studio, select a sample pipeline or drag nodes onto the canvas, and click "Execute Workflow".'
    }
  ];

  // Section D: Beginner Tutorials
  const tutorials = [
    {
      id: 'tut-1',
      title: 'Tutorial 1: First-Time Local Startup & Verification',
      steps: [
        'Open a PowerShell terminal in the repository root (D:\\om information\\prototye).',
        'Run the one-click launcher: .\\launch-orbit.ps1',
        'The script automatically verifies Python 3.11, Node.js, and checks ports 8000, 5000, and 3000.',
        'Open your browser at http://localhost:3000 to access ORBIT AI.',
        'Check the Home tab checklist to verify that all core microservices are online.'
      ]
    },
    {
      id: 'tut-2',
      title: 'Tutorial 2: Connecting a Local Ollama Model on HP Victus',
      steps: [
        'Install Ollama from https://ollama.com if not already installed.',
        'Start the Ollama daemon: run "ollama serve" in a separate terminal.',
        'Pull a model calibrated for your HP Victus (6 GB VRAM): run "ollama pull llama3.2:3b" or "ollama pull qwen2.5-coder:7b".',
        'Open ORBIT AI -> AI Model Library, confirm the model is listed under "Installed Local Models".',
        'Click "Set as Active Model" to make it the default across the Agent, Coding Tutor, and Software Engineer.'
      ]
    },
    {
      id: 'tut-3',
      title: 'Tutorial 3: Uploading a PDF & Getting Grounded Answers',
      steps: [
        'Navigate to the Knowledge Hub tab from the sidebar.',
        'Click the upload area and select a study PDF (e.g. course lecture notes).',
        'The document will be chunked into 500-character overlapping passages with token counts.',
        'In the search box, enter a specific conceptual query.',
        'Review the generated answer and examine the source badges showing Document ID, Page Number, and similarity score.'
      ]
    },
    {
      id: 'tut-4',
      title: 'Tutorial 4: Learning a DSA Problem with Guided Tutor',
      steps: [
        'Navigate to the Coding Playground tab.',
        'Select a topic from the DSA browser (e.g. Arrays, Stacks, or Dynamic Programming).',
        'Select "Two Sum" from the problem list and choose your preferred language (Python 3.11 or C++17).',
        'Click "Build With Me" tutor mode to receive an intuitive conceptual breakdown.',
        'Read the step-by-step dry-run table to understand how the hash map stores complements.',
        'Click "Run Tests" to evaluate your solution against test cases.'
      ]
    },
    {
      id: 'tut-5',
      title: 'Tutorial 5: Building a Full-Stack Web App from a Prompt',
      steps: [
        'Navigate to the Software Engineer tab.',
        'Click "New Project" and enter a name (e.g. "Pastry Shop Orders") and prompt description.',
        'Click "Plan Project": review proposed architecture, database tables, and generated task list.',
        'Click "Generate & Run": the agent scaffolds files, creates a binary SQLite database on disk, and writes automated tests.',
        'Click "Start Preview" to launch the development server and open your live app in browser.'
      ]
    },
    {
      id: 'tut-6',
      title: 'Tutorial 6: Building a Colab-Ready Jupyter Notebook',
      steps: [
        'Navigate to the Course-to-Code Lab tab.',
        'Select the seeded course "CS106B: Programming Abstractions".',
        'Open Lesson 1 (Recursion) and view the seeded "Binary Exponentiation" code snippet.',
        'Click "Add to Notebook Builder".',
        'Switch to the "Notebook Builder" tab, verify the hoisted imports and assertion verification cell.',
        'Click "Validate & Build Notebook", then click "Download .ipynb" to open locally or in Google Colab.'
      ]
    },
    {
      id: 'tut-7',
      title: 'Tutorial 7: Executing a Workflow with Human Approval',
      steps: [
        'Navigate to the Workflow Studio tab.',
        'Select the sample "Knowledge Search & Summarization" workflow.',
        'Observe the canvas nodes: Input -> Knowledge Search -> AI Task -> Human Approval -> Output.',
        'Click "Execute Workflow": watch node statuses update in real time.',
        'When the pipeline pauses at the Human Approval node, inspect the generated summary.',
        'Click "Approve" to resume execution and deliver the final output.'
      ]
    },
    {
      id: 'tut-8',
      title: 'Tutorial 8: Comparing Local Models Side-by-Side',
      steps: [
        'Navigate to the AI Model Library tab.',
        'Select the "Model Comparison" tab.',
        'Choose Model A (e.g. Llama 3) and Model B (e.g. Qwen 2.5 Coder).',
        'Select a test prompt from the Coding or Reasoning presets.',
        'Click "Run Side-by-Side Comparison".',
        'Compare generated code, execution latency, and rate both models on the 5-point rubric.'
      ]
    }
  ];

  // Section E: Feature Availability Matrix
  const availabilityMatrix = [
    { feature: 'Knowledge Hub (TF-IDF RAG)', offline: 'Yes', modelNeeded: 'No', dockerNeeded: 'No', internet: 'No' },
    { feature: 'Coding Playground (Learn & Tutor)', offline: 'Yes', modelNeeded: 'No (Demo) / Yes (Ollama)', dockerNeeded: 'No', internet: 'No' },
    { feature: 'Coding Playground (Run Code Sandbox)', offline: 'Yes', modelNeeded: 'No', dockerNeeded: 'Yes (for isolated run)', internet: 'No' },
    { feature: 'Software Engineer (Scaffold & SQLite DB)', offline: 'Yes', modelNeeded: 'No (Demo) / Yes (Ollama)', dockerNeeded: 'No', internet: 'No' },
    { feature: 'Software Engineer (Containerized Tests)', offline: 'Yes', modelNeeded: 'No', dockerNeeded: 'Yes', internet: 'No' },
    { feature: 'Course-to-Code Lab (Extraction & Notebook)', offline: 'Yes', modelNeeded: 'No', dockerNeeded: 'No', internet: 'No' },
    { feature: 'AI Model Library (Catalog & Specs)', offline: 'Yes', modelNeeded: 'No', dockerNeeded: 'No', internet: 'No' },
    { feature: 'Workflow Studio (DAG Execution)', offline: 'Yes', modelNeeded: 'No (Demo) / Yes (Ollama)', dockerNeeded: 'No', internet: 'No' },
    { feature: 'Pulling New Ollama Model Weights', offline: 'No', modelNeeded: 'N/A', dockerNeeded: 'No', internet: 'Yes (ollama.com)' },
    { feature: 'Opening Notebook in Google Colab', offline: 'No', modelNeeded: 'No', dockerNeeded: 'No', internet: 'Yes (colab.google)' },
    { feature: 'Pushing Code to GitHub Repository', offline: 'No', modelNeeded: 'No', dockerNeeded: 'No', internet: 'Yes (github.com)' }
  ];

  // Section F: Troubleshooting Commands
  const troubleshootingItems = [
    {
      issue: 'A service failed to start or Port 3000 / 5000 / 8000 is occupied',
      explanation: 'A previous process is still holding the port. Use the clean shutdown script to release all ports.',
      command: '.\\stop-orbit.ps1'
    },
    {
      issue: 'Ollama is installed but shows "Offline" in ORBIT AI',
      explanation: 'The local Ollama background daemon is not running. Launch it in a separate terminal.',
      command: 'ollama serve'
    },
    {
      issue: 'No models are installed in Ollama (0 models available)',
      explanation: 'Pull a recommended model fitting the HP Victus 6GB VRAM profile.',
      command: 'ollama pull llama3.2:3b\nollama pull qwen2.5-coder:7b'
    },
    {
      issue: 'Code execution says "Docker Offline: execution refused"',
      explanation: 'ORBIT enforces Docker isolation to protect your machine from untrusted code. Start Docker Desktop, or use static tutor modes.',
      command: 'Start-Process "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"'
    },
    {
      issue: 'Clean full startup across all 3 services',
      explanation: 'Launches Python AI (8000), Express Backend (5000), and Vite Frontend (3000) with health monitoring.',
      command: '.\\launch-orbit.ps1'
    },
    {
      issue: 'Run complete automated test verification',
      explanation: 'Runs all 97 Python tests and 57 Node.js backend tests including sandboxed workspace and reference suites.',
      command: 'powershell -ExecutionPolicy Bypass -File .\\run-tests.ps1'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Header Banner */}
      <section className="panel-glass" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '16px', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.3)', color: 'var(--accent-blue-light)', fontSize: '0.76rem', fontWeight: 600, marginBottom: '0.65rem' }}>
              <Compass size={13} />
              <span>Complete User Guide & Onboarding Manual</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Start Here: How to Use ORBIT AI
            </h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '850px', lineHeight: 1.55 }}>
              Learn what each section of ORBIT does, choose the right tool for your specific learning or software engineering goal, and follow step-by-step beginner tutorials.
            </p>
          </div>

          <button 
            onClick={() => setCurrentTab('home')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.5rem 1rem' }}
          >
            <HomeIcon size={14} /> Back to Home
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '1rem' }}>
          {[
            { id: 'overview', label: 'A. System Overview' },
            { id: 'tabs', label: 'B. All Tabs Guide (10 Sections)' },
            { id: 'goals', label: 'C. Which Feature Should I Use?' },
            { id: 'tutorials', label: 'D. Beginner Tutorials' },
            { id: 'offline', label: 'E. Offline & Docker Matrix' },
            { id: 'troubleshooting', label: 'F. Troubleshooting' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: activeSection === tab.id ? 'var(--accent-violet)' : 'var(--bg-secondary)',
                color: activeSection === tab.id ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (activeSection === tab.id ? 'var(--accent-violet)' : 'var(--border-glass)'),
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION A: Overview */}
      {activeSection === 'overview' && (
        <section className="panel-glass" style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Section A: ORBIT AI Architecture & Integrated Workflows
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            ORBIT AI is engineered as a three-tier local architecture running entirely on your computer:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1.1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Laptop size={16} />
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>1. React + Vite Frontend</h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Listening on <strong>Port 3000</strong>. Built purely with React JSX and Glassy Dark CSS. Provides navigation, interactive editors, DAG workflows, and model benchmark comparisons.
              </p>
            </div>

            <div style={{ padding: '1.1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Database size={16} />
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>2. Node.js Express Gateway</h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Listening on <strong>Port 5000</strong>. Hosts REST APIs, manages sandboxed project workspaces, coordinates preview processes, and persists data to SQLite WAL mode.
              </p>
            </div>

            <div style={{ padding: '1.1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={16} />
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>3. Python FastAPI AI Service</h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Listening on <strong>Port 8000</strong>. Implements TF-IDF keyword retrieval, code parsing via ast.parse, DSA tutor pedagogy, and interfaces with local Ollama daemon on Port 11434.
              </p>
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.25)' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-violet-light)', marginBottom: '0.35rem' }}>
              How You Move Between Sections in ORBIT
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              • <strong>Learn $\rightarrow$ Code:</strong> Study a topic in <em>Course-to-Code Lab</em>, harvest code snippets, and send them directly to the <em>Coding Playground</em>.<br />
              • <strong>Model Selection $\rightarrow$ Generation:</strong> Set your active model in the <em>AI Model Library</em>, and it automatically powers the <em>Agent Playground</em> and <em>Software Engineer</em>.<br />
              • <strong>Observe $\rightarrow$ Audit:</strong> Run any agent task or workflow, and immediately inspect execution logs in <em>Runs & Evaluations</em>.
            </p>
          </div>
        </section>
      )}

      {/* SECTION B: Tab-by-Tab Guide */}
      {activeSection === 'tabs' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="panel-glass" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Section B: What Each Sidebar Tab Does
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Click any tab below to review its purpose, prerequisites, step-by-step instructions, and open it directly.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {tabGuides.map((tg) => (
                <button
                  key={tg.id}
                  onClick={() => setExpandedTabId(tg.id)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    background: expandedTabId === tg.id ? 'var(--accent-indigo)' : 'var(--bg-secondary)',
                    color: expandedTabId === tg.id ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid ' + (expandedTabId === tg.id ? 'var(--accent-indigo)' : 'var(--border-glass)'),
                    cursor: 'pointer'
                  }}
                >
                  {tg.name}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Tab Guide Card */}
          {tabGuides.filter((tg) => tg.id === expandedTabId).map((tg) => {
            const Icon = tg.icon;
            return (
              <div key={tg.id} className="panel-glass" style={{ padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tg.color }}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {tg.name}
                      </h3>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        {tg.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentTab(tg.id)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                  >
                    Open {tg.name} <ArrowRight size={14} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
                    <h5 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
                      What It Is & Why Use It
                    </h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      {tg.whatItIs}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Why use:</strong> {tg.whyUse}
                    </p>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
                    <h5 style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.35rem' }}>
                      When to Use & Prerequisites
                    </h5>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      <strong>When to use:</strong> {tg.whenToUse}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Prerequisites:</strong> {tg.prerequisites}
                    </p>
                  </div>
                </div>

                {/* Numbered Steps */}
                <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    How to Complete the Main Task (Step-by-Step)
                  </h4>
                  <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {tg.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>

                {/* Example, Success & Error Handling */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '0.85rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-blue-light)', marginBottom: '0.25rem' }}>
                      Realistic Example
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {tg.example}
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.25rem' }}>
                      What Success Looks Like
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {tg.successState}
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.25rem' }}>
                      Common Error & Resolution
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {tg.commonErrors}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '0.75rem' }}>
                  <strong>Requirements:</strong> {tg.requirements}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* SECTION C: Goal-Based "Which Feature Should I Use?" */}
      {activeSection === 'goals' && (
        <section className="panel-glass" style={{ padding: '1.75rem 2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Section C: Which Feature Should I Use? (Goal-Based Guide)
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Find the exact tab that solves what you want to do right now, with immediate one-click navigation.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
            {goalRoutes.map((gr) => (
              <div
                key={gr.id}
                style={{
                  padding: '1.1rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber-light)', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    <Sparkles size={13} />
                    Goal
                  </div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                    "{gr.goal}"
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    <strong>First Action:</strong> {gr.firstAction}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '0.65rem' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                    Recommended: <strong style={{ color: 'var(--text-main)' }}>{gr.recommend}</strong>
                  </span>
                  <button
                    onClick={() => setCurrentTab(gr.tabId)}
                    className="btn-secondary"
                    style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    Open Tab <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION D: Beginner Tutorials */}
      {activeSection === 'tutorials' && (
        <section className="panel-glass" style={{ padding: '1.75rem 2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Section D: Beginner Tutorials
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Numbered walk-throughs using the actual UI buttons and controls implemented in ORBIT AI.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {tutorials.map((tut) => (
              <div 
                key={tut.id}
                style={{
                  padding: '1.25rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  {tut.title}
                </h4>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {tut.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION E: Offline & Docker Matrix */}
      {activeSection === 'offline' && (
        <section className="panel-glass" style={{ padding: '1.75rem 2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Section E: Demo Mode, Ollama & Offline Feature Matrix
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Understand what runs 100% offline versus what requires local model weights, Docker containers, or internet.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.65rem' }}>Feature / Workflow</th>
                  <th style={{ padding: '0.65rem' }}>Offline Capable?</th>
                  <th style={{ padding: '0.65rem' }}>Local Model Required?</th>
                  <th style={{ padding: '0.65rem' }}>Docker Required?</th>
                  <th style={{ padding: '0.65rem' }}>Internet Required?</th>
                </tr>
              </thead>
              <tbody>
                {availabilityMatrix.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-glass-subtle)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: 600, color: 'var(--text-main)' }}>{row.feature}</td>
                    <td style={{ padding: '0.65rem' }}>
                      <span className={`badge ${row.offline === 'Yes' ? 'badge-emerald' : 'badge-amber'}`}>
                        {row.offline}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>{row.modelNeeded}</td>
                    <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>{row.dockerNeeded}</td>
                    <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>{row.internet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong>Honest Disclosure:</strong> Demo Mode uses deterministic, extractive algorithms and preloaded rule sets. It does not hallucinate and does not pretend to be a local neural LLM. Ollama Mode uses genuine open-weights neural inference when models are pulled on your machine.
          </div>
        </section>
      )}

      {/* SECTION F: Troubleshooting */}
      {activeSection === 'troubleshooting' && (
        <section className="panel-glass" style={{ padding: '1.75rem 2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Section F: Practical Troubleshooting & Solutions
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Direct solutions and copyable commands for common local development situations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {troubleshootingItems.map((item, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '1.1rem',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose-light)', fontSize: '0.86rem', fontWeight: 700 }}>
                  <AlertCircle size={15} />
                  {item.issue}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {item.explanation}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-glass-subtle)' }}>
                  <code style={{ fontSize: '0.78rem', color: 'var(--accent-amber-light)', fontFamily: 'monospace' }}>
                    {item.command}
                  </code>
                  <button
                    onClick={() => handleCopy(item.command, `cmd-${idx}`)}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {copiedCmd === `cmd-${idx}` ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    {copiedCmd === `cmd-${idx}` ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

export default UserGuide;

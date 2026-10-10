import { db } from './db.js';

export function seedDatabase() {
  // Check if sample document already exists
  const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;

  if (docCount === 0) {
    // 1. Seed Sample Document: "Orbit AI Architectural Specification.md"
    const insertDoc = db.prepare(`
      INSERT INTO documents (filename, file_type, file_size, char_count, chunk_count, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'processed', CURRENT_TIMESTAMP)
    `);

    const docResult = insertDoc.run(
      'Orbit AI Architectural Specification.md',
      'md',
      2450,
      2450,
      4
    );

    const docId = docResult.lastInsertRowid;

    // 2. Seed Document Chunks with realistic learning content
    const sampleChunks = [
      {
        index: 0,
        page: 1,
        content: "ORBIT AI is a local AI engineering workspace built with React (frontend), Node.js Express (main backend), and Python FastAPI (AI services). It runs completely local and supports both Ollama local models and an extractive Demo Mode."
      },
      {
        index: 1,
        page: 1,
        content: "Knowledge Hub uses a transparent TF-IDF retriever for keyword ranking. The retriever calculates term frequency (TF) and inverse document frequency (IDF) with cosine similarity, ensuring that retrieved passages have verifiable citations."
      },
      {
        index: 2,
        page: 2,
        content: "The Agent Playground features bounded execution with strict schema validation. The agent can search knowledge, summarize documents, generate quizzes, and return structured JSON results without allowing shell or arbitrary code execution."
      },
      {
        index: 3,
        page: 2,
        content: "Workflow Studio enables visual DAG execution. Node types include Input, Knowledge Search, AI Task, Condition, Human Approval, and Output. Human Approval nodes suspend execution until explicit user approval is granted."
      }
    ];

    const insertChunk = db.prepare(`
      INSERT INTO document_chunks (document_id, chunk_index, content, page_number, token_count, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    for (const chunk of sampleChunks) {
      insertChunk.run(
        docId,
        chunk.index,
        chunk.content,
        chunk.page,
        chunk.content.split(/\s+/).length
      );
    }
  }

  // Check if sample workflows exist
  const workflowCount = db.prepare('SELECT COUNT(*) as count FROM workflow_definitions').get().count;

  if (workflowCount === 0) {
    const insertWorkflow = db.prepare(`
      INSERT INTO workflow_definitions (id, name, description, graph_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    // Sample Workflow 1: Document -> Knowledge Search -> AI Summary -> Output
    const workflow1Graph = {
      nodes: [
        {
          id: 'node-1',
          type: 'input',
          position: { x: 50, y: 150 },
          data: { label: 'User Query Input', value: 'What is the Knowledge Hub retrieval mechanism?' }
        },
        {
          id: 'node-2',
          type: 'knowledge_search',
          position: { x: 300, y: 150 },
          data: { label: 'Knowledge Search', queryField: 'input', topK: 2 }
        },
        {
          id: 'node-3',
          type: 'ai_task',
          position: { x: 550, y: 150 },
          data: { label: 'AI Summary Task', taskType: 'summarize' }
        },
        {
          id: 'node-4',
          type: 'output',
          position: { x: 800, y: 150 },
          data: { label: 'Final Output', destination: 'console' }
        }
      ],
      edges: [
        { id: 'e1-2', source: 'node-1', target: 'node-2' },
        { id: 'e2-3', source: 'node-2', target: 'node-3' },
        { id: 'e3-4', source: 'node-3', target: 'node-4' }
      ]
    };

    insertWorkflow.run(
      'wf-sample-1',
      'Document Knowledge Search & Summary',
      'Accepts a query, searches the knowledge base via TF-IDF, generates an AI summary, and produces formatted output.',
      JSON.stringify(workflow1Graph)
    );

    // Sample Workflow 2: Input -> AI Extraction -> Human Approval -> Output
    const workflow2Graph = {
      nodes: [
        {
          id: 'node-10',
          type: 'input',
          position: { x: 50, y: 150 },
          data: {
            label: 'Data Input',
            value: 'Contact student lead at alex.student@university.edu with student ID 202688.'
          }
        },
        {
          id: 'node-11',
          type: 'ai_task',
          position: { x: 300, y: 150 },
          data: { label: 'Extract Entities', taskType: 'extract' }
        },
        {
          id: 'node-12',
          type: 'human_approval',
          position: { x: 550, y: 150 },
          data: {
            label: 'Reviewer Approval',
            promptMessage: 'Please review extracted email and student details before publication.'
          }
        },
        {
          id: 'node-13',
          type: 'output',
          position: { x: 800, y: 150 },
          data: { label: 'Approved Result', destination: 'database' }
        }
      ],
      edges: [
        { id: 'e10-11', source: 'node-10', target: 'node-11' },
        { id: 'e11-12', source: 'node-11', target: 'node-12' },
        { id: 'e12-13', source: 'node-12', target: 'node-13' }
      ]
    };

    insertWorkflow.run(
      'wf-sample-2',
      'Structured Extraction with Human Approval',
      'Extracts structured entities, suspends execution at Human Approval for authorization, and resumes upon approval.',
      JSON.stringify(workflow2Graph)
    );
  }

  // Seed sample initial completed run if runs are empty
  const runCount = db.prepare('SELECT COUNT(*) as count FROM workflow_runs').get().count;
  if (runCount === 0) {
    db.prepare(`
      INSERT INTO workflow_runs (id, workflow_id, workflow_name, status, duration_ms, input_data, output_data, created_at, updated_at)
      VALUES (?, ?, ?, 'successful', 12.4, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      'run-sample-init',
      'wf-sample-1',
      'Document Knowledge Search & Summary',
      JSON.stringify({ query: 'What is the Knowledge Hub retrieval mechanism?' }),
      JSON.stringify({ summary: 'Knowledge Hub uses a transparent TF-IDF retriever for keyword ranking with cosine similarity.' })
    );

    db.prepare(`
      INSERT INTO agent_runs (id, user_prompt, status, provider, duration_ms, total_steps, final_response, created_at)
      VALUES (?, ?, 'successful', 'demo', 8.2, 1, ?, CURRENT_TIMESTAMP)
    `).run(
      'agent-run-init',
      'Search knowledge base for workflow engine features',
      '[Demo Agent] Found 1 relevant passage in knowledge base: "Workflow Studio enables visual DAG execution. Node types include Input, Knowledge Search, AI Task, Condition, Human Approval, and Output."'
    );
  }

  // Seed sample initial Software Engineer project if table is empty
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM engineer_projects').get().count;
  if (projectCount === 0) {
    const projId = 'proj_sample_restaurant';
    const wsPath = 'restaurant-management';

    db.prepare(`
      INSERT INTO engineer_projects (
        id, name, description, workspace_path, stack, status, preview_port, preview_status, summary_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'react-express-sqlite', 'completed', 5173, 'stopped', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      projId,
      'Restaurant Management System',
      'Build a restaurant management system with React, Express, SQLite, authentication, billing, inventory, analytics and an admin dashboard.',
      wsPath,
      JSON.stringify({
        domain: 'Restaurant Management System',
        backend: { framework: 'Express.js', database: 'SQLite', port: 3001 },
        frontend: { framework: 'React JSX', styling: 'Glassy Dark Design System' },
        database_tables: ['menu_items', 'orders', 'tables', 'inventory']
      })
    );

    // Seed tasks
    const tasks = [
      { id: 'task_s_1', title: 'Design Database Schema & SQLite Data Layer', category: 'database', status: 'completed' },
      { id: 'task_s_2', title: 'Scaffold Backend REST API Server', category: 'backend', status: 'completed' },
      { id: 'task_s_3', title: 'Implement Menu & Order CRUD Endpoints', category: 'backend', status: 'completed' },
      { id: 'task_s_4', title: 'Build React UI Shell & Glassy Dashboard', category: 'frontend', status: 'completed' },
      { id: 'task_s_5', title: 'Implement Interactive Tables & Stock Alerts', category: 'frontend', status: 'completed' },
      { id: 'task_s_6', title: 'Write Automated Test Suite (tests/api.test.js)', category: 'test', status: 'completed' },
      { id: 'task_s_7', title: 'End-to-End Build & Run Verification', category: 'verification', status: 'completed' }
    ];

    const insertTask = db.prepare(`
      INSERT INTO engineer_tasks (id, project_id, title, category, status, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    tasks.forEach((t, idx) => {
      insertTask.run(t.id, projId, t.title, t.category, t.status, idx);
    });
  }
}


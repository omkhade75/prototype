import { db } from './db.js';

export function initializeSchema() {
  const schemaSql = `
    -- 1. Documents Table
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      char_count INTEGER DEFAULT 0,
      chunk_count INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('pending', 'processed', 'failed')) DEFAULT 'pending',
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Document Chunks Table
    CREATE TABLE IF NOT EXISTS document_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      page_number INTEGER DEFAULT 1,
      token_count INTEGER DEFAULT 0,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
    );

    -- 3. Agent Runs Table
    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      user_prompt TEXT NOT NULL,
      status TEXT CHECK(status IN ('running', 'successful', 'failed')) DEFAULT 'running',
      provider TEXT DEFAULT 'demo',
      model TEXT,
      duration_ms REAL DEFAULT 0,
      total_steps INTEGER DEFAULT 0,
      final_response TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Agent Execution Steps Table
    CREATE TABLE IF NOT EXISTS agent_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      thought TEXT,
      tool_name TEXT NOT NULL,
      tool_args TEXT,
      tool_result TEXT,
      status TEXT CHECK(status IN ('successful', 'failed')) DEFAULT 'successful',
      duration_ms REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES agent_runs (id) ON DELETE CASCADE
    );

    -- 5. Workflow Definitions Table
    CREATE TABLE IF NOT EXISTS workflow_definitions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      graph_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Workflow Runs Table
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      workflow_name TEXT NOT NULL,
      status TEXT CHECK(status IN ('running', 'successful', 'failed', 'waiting_for_approval')) DEFAULT 'running',
      duration_ms REAL DEFAULT 0,
      input_data TEXT,
      output_data TEXT,
      paused_step_id TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflow_definitions (id) ON DELETE CASCADE
    );

    -- 7. Workflow Steps Table
    CREATE TABLE IF NOT EXISTS workflow_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      node_type TEXT NOT NULL,
      node_name TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'running', 'successful', 'failed', 'waiting_for_approval', 'skipped')) DEFAULT 'pending',
      duration_ms REAL DEFAULT 0,
      input_data TEXT,
      output_data TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (run_id) REFERENCES workflow_runs (id) ON DELETE CASCADE
    );

    -- 8. Evaluations Table
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      suite_name TEXT NOT NULL,
      total_tests INTEGER NOT NULL,
      passed_tests INTEGER NOT NULL,
      failed_tests INTEGER NOT NULL,
      duration_ms REAL NOT NULL,
      results_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for efficient lookup
    CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_agent_steps_run_id ON agent_steps(run_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_run_id ON workflow_steps(run_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
  `;

  db.exec(schemaSql);

  // Safe migration for existing SQLite databases
  try {
    db.exec('ALTER TABLE agent_runs ADD COLUMN model TEXT;');
  } catch {
    // Column already exists
  }
}

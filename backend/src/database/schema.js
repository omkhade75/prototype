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

    -- 9. Learning Progress Table (Topic-level mastery and stats)
    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT NOT NULL UNIQUE,
      topic_name TEXT NOT NULL,
      status TEXT CHECK(status IN ('not_started', 'in_progress', 'practicing', 'mastered')) DEFAULT 'not_started',
      lessons_completed INTEGER DEFAULT 0,
      quiz_attempts INTEGER DEFAULT 0,
      quiz_passed INTEGER DEFAULT 0,
      last_quiz_score REAL DEFAULT 0.0,
      problems_attempted INTEGER DEFAULT 0,
      problems_solved_independently INTEGER DEFAULT 0,
      problems_solved_with_solution INTEGER DEFAULT 0,
      hints_requested_count INTEGER DEFAULT 0,
      mistakes_recorded TEXT DEFAULT '[]',
      needs_revision INTEGER DEFAULT 0,
      last_studied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 10. Learning Activity Logs (Granular trace of student actions)
    CREATE TABLE IF NOT EXISTS learning_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_type TEXT NOT NULL,
      topic_id TEXT,
      problem_id TEXT,
      document_id INTEGER,
      document_name TEXT,
      score REAL,
      passed INTEGER DEFAULT 0,
      details_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 11. Learning Quiz Attempts (History of quiz results)
    CREATE TABLE IF NOT EXISTS learning_quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT,
      document_id INTEGER,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      score_percent REAL NOT NULL,
      answers_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Software Engineer Projects Table
    CREATE TABLE IF NOT EXISTS engineer_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      workspace_path TEXT NOT NULL,
      stack TEXT NOT NULL DEFAULT 'react-express-sqlite',
      status TEXT CHECK(status IN ('created', 'planning', 'generating', 'building', 'testing', 'completed', 'failed')) DEFAULT 'created',
      preview_port INTEGER DEFAULT 5173,
      preview_pid INTEGER,
      preview_status TEXT CHECK(preview_status IN ('stopped', 'starting', 'running', 'error')) DEFAULT 'stopped',
      preview_url TEXT,
      git_status TEXT DEFAULT '{}',
      summary_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Software Engineer Tasks Table
    CREATE TABLE IF NOT EXISTS engineer_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT CHECK(category IN ('architecture', 'scaffold', 'backend', 'frontend', 'database', 'test', 'verification')) DEFAULT 'scaffold',
      status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')) DEFAULT 'pending',
      order_index INTEGER NOT NULL DEFAULT 0,
      files_affected TEXT DEFAULT '[]',
      commands_run TEXT DEFAULT '[]',
      error_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES engineer_projects (id) ON DELETE CASCADE
    );

    -- 14. Software Engineer Activities / Execution Trace
    CREATE TABLE IF NOT EXISTS engineer_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      task_id TEXT,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      command TEXT,
      exit_code INTEGER,
      stdout TEXT,
      stderr TEXT,
      duration_ms REAL DEFAULT 0,
      details_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES engineer_projects (id) ON DELETE CASCADE
    );

    -- 15. AI Model Catalog Cache (Offline-first metadata cache)
    CREATE TABLE IF NOT EXISTS model_catalog_cache (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      publisher TEXT,
      family TEXT,
      source TEXT DEFAULT 'ollama',
      ollama_tag TEXT,
      parameter_size TEXT,
      size_display TEXT,
      quantization TEXT,
      context_length INTEGER DEFAULT 32768,
      modalities_json TEXT DEFAULT '["text"]',
      tasks_json TEXT DEFAULT '[]',
      description TEXT,
      license TEXT,
      ram_min_gb REAL DEFAULT 8.0,
      vram_rec_gb REAL DEFAULT 6.0,
      benchmarks_json TEXT DEFAULT '{}',
      learning_guide_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. Hardware Profiles (HP Victus and custom configurations)
    CREATE TABLE IF NOT EXISTS model_hardware_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cpu_info TEXT,
      gpu_info TEXT,
      ram_gb REAL DEFAULT 16.0,
      vram_gb REAL DEFAULT 6.0,
      disk_free_gb REAL DEFAULT 100.0,
      description TEXT,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 17. Model Test Runs (Interactive test benchmark traces)
    CREATE TABLE IF NOT EXISTS model_test_runs (
      id TEXT PRIMARY KEY,
      model_name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'ollama',
      prompt TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      response_text TEXT,
      duration_ms REAL DEFAULT 0,
      tokens_per_second REAL DEFAULT 0,
      eval_rubric_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 18. Model Comparison Sessions
    CREATE TABLE IF NOT EXISTS model_comparisons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      models_json TEXT NOT NULL,
      prompt TEXT,
      comparison_data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 19. Application Settings (Active AI model & provider sync)
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 20. Course Materials Table
    CREATE TABLE IF NOT EXISTS course_materials (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 21. Course Modules Table
    CREATE TABLE IF NOT EXISTS course_modules (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES course_materials (id) ON DELETE CASCADE
    );

    -- 22. Course Lessons Table
    CREATE TABLE IF NOT EXISTS course_lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      content TEXT,
      source_doc_id INTEGER,
      source_filename TEXT,
      source_pages_json TEXT DEFAULT '[]',
      assignment_instructions TEXT,
      status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (module_id) REFERENCES course_modules (id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES course_materials (id) ON DELETE CASCADE
    );

    -- 23. Course Snippets (Snippet Scratchpad / Drawer)
    CREATE TABLE IF NOT EXISTS course_snippets (
      id TEXT PRIMARY KEY,
      lesson_id TEXT,
      course_id TEXT,
      title TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'python',
      code TEXT NOT NULL,
      explanation TEXT,
      tags_json TEXT DEFAULT '[]',
      source_section TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 24. Course Notebooks (Generated .ipynb projects)
    CREATE TABLE IF NOT EXISTS course_notebooks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      goal TEXT NOT NULL,
      language TEXT DEFAULT 'python',
      course_id TEXT,
      cells_json TEXT NOT NULL,
      ipynb_json TEXT NOT NULL,
      validation_result_json TEXT DEFAULT '{}',
      source_snippets_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 25. Course Progress & Student Actions
    CREATE TABLE IF NOT EXISTS course_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      action TEXT NOT NULL,
      score REAL,
      details_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for efficient lookup
    CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id);
    CREATE INDEX IF NOT EXISTS idx_agent_steps_run_id ON agent_steps(run_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_steps_run_id ON workflow_steps(run_id);
    CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_learning_progress_topic ON learning_progress(topic_id);
    CREATE INDEX IF NOT EXISTS idx_learning_logs_topic ON learning_activity_logs(topic_id);
    CREATE INDEX IF NOT EXISTS idx_learning_quiz_topic ON learning_quiz_attempts(topic_id);
    CREATE INDEX IF NOT EXISTS idx_engineer_tasks_project ON engineer_tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_engineer_activities_project ON engineer_activities(project_id);
    CREATE INDEX IF NOT EXISTS idx_model_test_runs_model ON model_test_runs(model_name);
    CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);
    CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id);
    CREATE INDEX IF NOT EXISTS idx_course_lessons_course ON course_lessons(course_id);
    CREATE INDEX IF NOT EXISTS idx_course_snippets_course ON course_snippets(course_id);
    CREATE INDEX IF NOT EXISTS idx_course_snippets_lesson ON course_snippets(lesson_id);
    CREATE INDEX IF NOT EXISTS idx_course_notebooks_course ON course_notebooks(course_id);
    CREATE INDEX IF NOT EXISTS idx_course_progress_item ON course_progress(item_type, item_id);
  `;

  db.exec(schemaSql);

  // Safe migration for existing SQLite databases
  try {
    db.exec('ALTER TABLE agent_runs ADD COLUMN model TEXT;');
  } catch {
    // Column already exists
  }
}

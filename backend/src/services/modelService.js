import { db } from '../database/db.js';
import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class ModelService {
  /**
   * Retrieves active model & provider configuration from SQLite app_settings.
   */
  static getActiveModelConfig() {
    const rows = db.prepare('SELECT key, value FROM app_settings').all();
    const config = {
      provider: 'ollama',
      model: 'llama3',
      task: 'coding'
    };
    for (const r of rows) {
      if (r.key === 'active_provider') config.provider = r.value;
      if (r.key === 'active_model') config.model = r.value;
      if (r.key === 'active_task') config.task = r.value;
    }
    return config;
  }

  /**
   * Updates active model & provider settings across ORBIT AI.
   */
  static setActiveModelConfig({ provider, model, task }) {
    const upsert = db.prepare(`
      INSERT INTO app_settings (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    if (provider) upsert.run('active_provider', provider);
    if (model) upsert.run('active_model', model);
    if (task) upsert.run('active_task', task);

    return this.getActiveModelConfig();
  }

  /**
   * Fetches models from AI Service catalog endpoint with search & filters.
   */
  static async getCatalog(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${AI_SERVICE_URL}/models/catalog?${query}`);
    if (!res.ok) {
      throw new Error(`AI Service catalog error (HTTP ${res.status})`);
    }
    return await res.json();
  }

  /**
   * Fetches individual model card metadata and educational guide.
   */
  static async getModelCard(modelId) {
    const res = await fetch(`${AI_SERVICE_URL}/models/catalog/${encodeURIComponent(modelId)}`);
    if (!res.ok) {
      throw new Error(`Model card for '${modelId}' not found (HTTP ${res.status})`);
    }
    return await res.json();
  }

  /**
   * Fetches hardware presets (HP Victus, etc.).
   */
  static async getHardwarePresets() {
    const res = await fetch(`${AI_SERVICE_URL}/models/presets`);
    if (!res.ok) {
      throw new Error(`Failed to load hardware presets (HTTP ${res.status})`);
    }
    return await res.json();
  }

  /**
   * Computes hardware-aware model recommendations.
   */
  static async recommendModels(payload) {
    const res = await fetch(`${AI_SERVICE_URL}/models/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error(`Failed to compute recommendations (HTTP ${res.status})`);
    }
    return await res.json();
  }

  /**
   * Queries real local Ollama models.
   */
  static async getLocalModels() {
    const res = await fetch(`${AI_SERVICE_URL}/models/local`);
    if (!res.ok) {
      throw new Error(`Failed to connect to Ollama local inventory (HTTP ${res.status})`);
    }
    const data = await res.json();
    const active = this.getActiveModelConfig();
    return {
      ...data,
      active_model: active.model,
      active_provider: active.provider
    };
  }

  /**
   * Inspects detailed architecture and modelfile of a local model.
   */
  static async inspectLocalModel(modelName) {
    const res = await fetch(`${AI_SERVICE_URL}/models/local/inspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_name: modelName })
    });
    if (!res.ok) {
      throw new Error(`Failed to inspect model '${modelName}' (HTTP ${res.status})`);
    }
    return await res.json();
  }

  /**
   * Initiates deletion of a local model with confirmation.
   */
  static async deleteLocalModel(modelName, confirmed = false) {
    if (!confirmed) {
      throw new Error("Deletion requires explicit confirmation flag.");
    }
    const res = await fetch(`${AI_SERVICE_URL}/models/local/${encodeURIComponent(modelName)}?confirmed=true`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to delete model '${modelName}'`);
    }
    return await res.json();
  }

  /**
   * Tests a local model with an evaluation prompt and stores trace in SQLite.
   */
  static async testModel({ modelName, prompt, systemPrompt, category = 'general' }) {
    const res = await fetch(`${AI_SERVICE_URL}/models/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_name: modelName,
        prompt,
        system_prompt: systemPrompt,
        category
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Model test failed (HTTP ${res.status})`);
    }

    const testResult = await res.json();
    const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Persist test run trace to SQLite
    db.prepare(`
      INSERT INTO model_test_runs (
        id, model_name, provider, prompt, category, response_text, duration_ms, tokens_per_second, eval_rubric_json, created_at
      ) VALUES (?, ?, 'ollama', ?, ?, ?, ?, ?, '{}', CURRENT_TIMESTAMP)
    `).run(
      testId,
      modelName,
      prompt,
      category,
      testResult.response || testResult.error || '',
      testResult.duration_ms || 0,
      testResult.tokens_per_second || 0
    );

    return {
      test_id: testId,
      ...testResult
    };
  }

  /**
   * Saves rubric evaluation (ratings 1-5, feedback notes) for a test run.
   */
  static saveRubricEvaluation(testId, rubricData) {
    const stmt = db.prepare(`
      UPDATE model_test_runs
      SET eval_rubric_json = ?
      WHERE id = ?
    `);
    const res = stmt.run(JSON.stringify(rubricData), testId);
    return res.changes > 0;
  }

  /**
   * Lists recent model test runs.
   */
  static listTestRuns(limit = 20) {
    const stmt = db.prepare(`
      SELECT * FROM model_test_runs
      ORDER BY created_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit);
    return rows.map(r => ({
      ...r,
      eval_rubric: r.eval_rubric_json ? JSON.parse(r.eval_rubric_json) : {}
    }));
  }

  /**
   * Saves a side-by-side comparison session to SQLite.
   */
  static saveComparison({ title, models, prompt, comparisonData }) {
    const compId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO model_comparisons (
        id, title, models_json, prompt, comparison_data_json, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      compId,
      title || 'Model Comparison',
      JSON.stringify(models || []),
      prompt || '',
      JSON.stringify(comparisonData || {})
    );

    return { id: compId, title };
  }

  /**
   * Lists saved model comparison sessions.
   */
  static listComparisons() {
    const rows = db.prepare('SELECT * FROM model_comparisons ORDER BY created_at DESC').all();
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      models: JSON.parse(r.models_json || '[]'),
      prompt: r.prompt,
      comparison_data: JSON.parse(r.comparison_data_json || '{}'),
      created_at: r.created_at
    }));
  }

  /**
   * Searches Hugging Face Hub metadata via AI service.
   */
  static async searchHuggingFace(query, limit = 8) {
    const res = await fetch(`${AI_SERVICE_URL}/models/huggingface?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) {
      throw new Error(`Hugging Face search failed (HTTP ${res.status})`);
    }
    return await res.json();
  }
}

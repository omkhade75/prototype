import crypto from 'crypto';
import { db } from '../database/db.js';
import { DocumentService } from './documentService.js';
import { AIService } from './aiService.js';
import { ModelService } from './modelService.js';

export class AgentService {
  static getAllRuns() {
    return db.prepare(`
      SELECT 
        id, 
        user_prompt, 
        status, 
        provider, 
        model,
        duration_ms, 
        total_steps, 
        final_response, 
        error_message, 
        created_at
      FROM agent_runs
      ORDER BY created_at DESC
    `).all();
  }

  static getRunById(id) {
    const run = db.prepare('SELECT * FROM agent_runs WHERE id = ?').get(id);
    if (!run) return null;

    const steps = db.prepare(`
      SELECT 
        id, 
        step_number, 
        thought, 
        tool_name, 
        tool_args, 
        tool_result, 
        status, 
        duration_ms, 
        created_at
      FROM agent_steps
      WHERE run_id = ?
      ORDER BY step_number ASC
    `).all(id);

    const parsedSteps = steps.map((s) => ({
      ...s,
      tool_args: s.tool_args ? JSON.parse(s.tool_args) : {},
      tool_result: s.tool_result ? JSON.parse(s.tool_result) : {}
    }));

    return {
      ...run,
      steps: parsedSteps
    };
  }

  static async executeAgentRun({ message, provider = 'demo', maxSteps = 5, model = null }) {
    if (!message || !message.trim()) {
      throw new Error('Agent prompt message is required.');
    }

    const activeConfig = ModelService.getActiveModelConfig();
    const resolvedModel = model || (provider === 'ollama' ? (activeConfig.model || 'llama3') : 'deterministic-engine');

    const runId = `agent-${crypto.randomUUID()}`;
    const startTime = Date.now();

    // 1. Record initial agent run
    db.prepare(`
      INSERT INTO agent_runs (id, user_prompt, status, provider, model, created_at)
      VALUES (?, ?, 'running', ?, ?, CURRENT_TIMESTAMP)
    `).run(runId, message, provider, resolvedModel);

    try {
      // 2. Load context chunks from SQLite
      const chunks = DocumentService.getAllChunks();

      // 3. Call AI Service agent runner
      const agentResult = await AIService.runAgent(message, chunks, provider, maxSteps, resolvedModel);

      // 4. Save execution steps in SQLite
      const insertStep = db.prepare(`
        INSERT INTO agent_steps (
          run_id, step_number, thought, tool_name, tool_args, tool_result, status, duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const saveStepsTx = db.transaction((steps) => {
        for (const s of steps) {
          insertStep.run(
            runId,
            s.step_number,
            s.thought || '',
            s.tool_name,
            JSON.stringify(s.tool_args || {}),
            JSON.stringify(s.tool_result || {}),
            s.status || 'successful',
            s.duration_ms || 0
          );
        }
      });

      if (agentResult.steps && agentResult.steps.length > 0) {
        saveStepsTx(agentResult.steps);
      }

      const totalDuration = Date.now() - startTime;

      // 5. Update agent run record
      db.prepare(`
        UPDATE agent_runs
        SET 
          status = ?, 
          duration_ms = ?, 
          total_steps = ?, 
          final_response = ?, 
          error_message = ?,
          model = ?
        WHERE id = ?
      `).run(
        agentResult.status || 'successful',
        totalDuration,
        agentResult.total_steps || (agentResult.steps ? agentResult.steps.length : 0),
        agentResult.final_response || '',
        agentResult.error_message || null,
        agentResult.model || resolvedModel,
        runId
      );

      return this.getRunById(runId);

    } catch (err) {
      const totalDuration = Date.now() - startTime;
      db.prepare(`
        UPDATE agent_runs
        SET status = 'failed', duration_ms = ?, error_message = ?, model = ?
        WHERE id = ?
      `).run(totalDuration, err.message, resolvedModel, runId);

      throw err;
    }
  }

  static async getAvailableTools() {
    return AIService.getAvailableTools();
  }
}

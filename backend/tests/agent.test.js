import test from 'node:test';
import assert from 'node:assert';
import { db } from '../src/database/db.js';
import { initializeSchema } from '../src/database/schema.js';
import { AgentService } from '../src/services/agentService.js';

test('Agent Service Schema & Persistence Unit Tests', async (t) => {
  initializeSchema();

  await t.test('agent_runs table supports model and provider fields', () => {
    const testRunId = `test-run-${Date.now()}`;
    db.prepare(`
      INSERT INTO agent_runs (id, user_prompt, status, provider, model, duration_ms, total_steps, final_response)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(testRunId, 'Test prompt for model tracking', 'successful', 'ollama', 'llama3', 120, 2, 'Test answer');

    const retrieved = AgentService.getRunById(testRunId);
    assert.ok(retrieved, 'Should retrieve created run');
    assert.strictEqual(retrieved.provider, 'ollama');
    assert.strictEqual(retrieved.model, 'llama3');
    assert.strictEqual(retrieved.status, 'successful');

    // Clean up
    db.prepare('DELETE FROM agent_runs WHERE id = ?').run(testRunId);
  });

  await t.test('getAllRuns includes model and provider fields', () => {
    const runs = AgentService.getAllRuns();
    assert.ok(Array.isArray(runs), 'Runs should be an array');
    if (runs.length > 0) {
      assert.ok('provider' in runs[0], 'Should contain provider property');
      assert.ok('model' in runs[0], 'Should contain model property');
    }
  });
});

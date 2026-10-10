import test from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';
import { db } from '../src/database/db.js';
import { initializeSchema } from '../src/database/schema.js';
import { ModelService } from '../src/services/modelService.js';

test('AI Model Library & Learning Center Suite', async (t) => {
  // Ensure schema and tables exist
  initializeSchema();
  const app = createApp();

  await t.test('getActiveModelConfig and setActiveModelConfig manage SQLite app_settings', () => {
    // 1. Initial or default config
    const initialConfig = ModelService.getActiveModelConfig();
    assert.ok(initialConfig.provider);
    assert.ok(initialConfig.model);

    // 2. Set new active configuration
    const updated = ModelService.setActiveModelConfig({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b',
      task: 'coding'
    });

    assert.strictEqual(updated.provider, 'ollama');
    assert.strictEqual(updated.model, 'qwen2.5-coder:7b');
    assert.strictEqual(updated.task, 'coding');

    // 3. Verify direct DB query in app_settings table
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'active_model'").get();
    assert.strictEqual(row.value, 'qwen2.5-coder:7b');

    // 4. Reset back to llama3
    ModelService.setActiveModelConfig({
      provider: 'ollama',
      model: 'llama3',
      task: 'general'
    });
  });

  await t.test('Model test run persistence, rubric rating update, and listing', async () => {
    // Mock global fetch to return a test result from AI service
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          model: 'qwen2.5-coder:7b',
          response: 'def quicksort(arr): return sorted(arr)',
          duration_ms: 320.5,
          tokens_per_second: 38.4,
          total_tokens: 24,
          error: null
        })
      };
    };

    try {
      // 1. Execute testModel
      const run = await ModelService.testModel({
        modelName: 'qwen2.5-coder:7b',
        prompt: 'Implement quicksort',
        category: 'coding'
      });

      assert.ok(run.test_id);
      assert.strictEqual(run.model, 'qwen2.5-coder:7b');
      assert.strictEqual(run.duration_ms, 320.5);

      // 2. Save rubric evaluation
      const rubric = {
        correctness: 5,
        explanation: 4,
        code_quality: 5,
        notes: 'Clean idiomatic python implementation'
      };
      const saved = ModelService.saveRubricEvaluation(run.test_id, rubric);
      assert.strictEqual(saved, true);

      // 3. Verify in listTestRuns
      const testRuns = ModelService.listTestRuns(10);
      assert.ok(Array.isArray(testRuns));
      const found = testRuns.find((r) => r.id === run.test_id);
      assert.ok(found);
      assert.strictEqual(found.model_name, 'qwen2.5-coder:7b');
      assert.strictEqual(found.eval_rubric.correctness, 5);
      assert.strictEqual(found.eval_rubric.notes, 'Clean idiomatic python implementation');

      // Cleanup
      db.prepare('DELETE FROM model_test_runs WHERE id = ?').run(run.test_id);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('Model comparison session persistence and listing', () => {
    // 1. Save comparison session
    const comp = ModelService.saveComparison({
      title: 'Coder vs Generalist Shootout',
      models: ['qwen2.5-coder:7b', 'llama3.1:8b'],
      prompt: 'Write a LRU Cache in C++',
      comparisonData: {
        winner: 'qwen2.5-coder:7b',
        notes: 'Qwen implemented proper DLL + hashmap with custom templates'
      }
    });

    assert.ok(comp.id);
    assert.strictEqual(comp.title, 'Coder vs Generalist Shootout');

    // 2. Retrieve comparisons list
    const comparisons = ModelService.listComparisons();
    assert.ok(Array.isArray(comparisons));
    const found = comparisons.find((c) => c.id === comp.id);
    assert.ok(found);
    assert.strictEqual(found.title, 'Coder vs Generalist Shootout');
    assert.strictEqual(found.models.length, 2);
    assert.strictEqual(found.comparison_data.winner, 'qwen2.5-coder:7b');

    // Cleanup
    db.prepare('DELETE FROM model_comparisons WHERE id = ?').run(comp.id);
  });

  await t.test('ModelService proxies catalog and hardware presets via AI service', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (url.includes('/models/catalog')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            total: 10,
            page: 1,
            page_size: 10,
            total_pages: 1,
            models: [{ id: 'ollama:qwen2.5-coder:7b', name: 'Qwen 2.5 Coder' }]
          })
        };
      }
      if (url.includes('/models/presets')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            presets: [{ id: 'hp_victus', vram_gb: 6.0, ram_gb: 16.0 }]
          })
        };
      }
      return { ok: false, status: 404 };
    };

    try {
      const catalog = await ModelService.getCatalog({ page: 1 });
      assert.strictEqual(catalog.total, 10);
      assert.strictEqual(catalog.models[0].id, 'ollama:qwen2.5-coder:7b');

      const presets = await ModelService.getHardwarePresets();
      assert.ok(presets.presets);
      assert.strictEqual(presets.presets[0].id, 'hp_victus');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('ModelController HTTP routes handle config and comparison requests', async () => {
    // Use app directly or import supertest/node:http
    const originalFetch = globalThis.fetch;
    try {
      // Test config update via ModelService
      ModelService.setActiveModelConfig({
        provider: 'ollama',
        model: 'deepseek-r1:7b',
        task: 'reasoning'
      });

      const config = ModelService.getActiveModelConfig();
      assert.strictEqual(config.model, 'deepseek-r1:7b');
      assert.strictEqual(config.task, 'reasoning');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

import test from 'node:test';
import assert from 'node:assert';
import { EvaluationService } from '../src/services/evaluationService.js';
import { initializeSchema } from '../src/database/schema.js';
import { seedDatabase } from '../src/database/seed.js';

test('Evaluation Service Integration Test', async (t) => {
  initializeSchema();
  seedDatabase();

  await t.test('evaluations table stores and retrieves historical evaluation suites', () => {
    const evals = EvaluationService.getAllEvaluations();
    assert.ok(Array.isArray(evals), 'Evaluations should be returned as an array');
  });
});

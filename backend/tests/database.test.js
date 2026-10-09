import test from 'node:test';
import assert from 'node:assert';
import { db } from '../src/database/db.js';
import { initializeSchema } from '../src/database/schema.js';
import { seedDatabase } from '../src/database/seed.js';

test('Database Schema & Seeding Test', async (t) => {
  initializeSchema();
  seedDatabase();

  await t.test('documents table exists and contains seeded record', () => {
    const doc = db.prepare('SELECT * FROM documents WHERE filename = ?').get('Orbit AI Architectural Specification.md');
    assert.ok(doc, 'Seeded document should exist');
    assert.strictEqual(doc.file_type, 'md');
    assert.strictEqual(doc.status, 'processed');
  });

  await t.test('document chunks are seeded with positive token count', () => {
    const chunks = db.prepare('SELECT * FROM document_chunks').all();
    assert.ok(chunks.length >= 4, 'Should have at least 4 chunks seeded');
    assert.ok(chunks[0].token_count > 0, 'Token count should be greater than zero');
  });

  await t.test('sample workflows exist in workflow_definitions', () => {
    const workflows = db.prepare('SELECT * FROM workflow_definitions').all();
    assert.ok(workflows.length >= 2, 'Should have at least 2 sample workflows seeded');
    const wf1 = workflows.find((w) => w.id === 'wf-sample-1');
    assert.ok(wf1, 'wf-sample-1 should exist');
  });
});

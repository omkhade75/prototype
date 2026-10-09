import test from 'node:test';
import assert from 'node:assert';
import { WorkflowService } from '../src/services/workflowService.js';

test('Workflow Engine DAG Validation & Execution Test', async (t) => {
  await t.test('valid acyclic graph passes validation', () => {
    const nodes = [
      { id: 'n1', type: 'input', data: { value: 'test' } },
      { id: 'n2', type: 'output', data: {} }
    ];
    const edges = [{ id: 'e1', source: 'n1', target: 'n2' }];

    const result = WorkflowService.validateGraph(nodes, edges);
    assert.strictEqual(result.isValid, true);
    assert.deepStrictEqual(result.executionOrder, ['n1', 'n2']);
  });

  await t.test('cyclic graph is rejected with cycle error', () => {
    const nodes = [
      { id: 'n1', type: 'input' },
      { id: 'n2', type: 'ai_task' },
      { id: 'n3', type: 'output' }
    ];
    // n1 -> n2 -> n3 -> n1 (cycle!)
    const edges = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n1' }
    ];

    assert.throws(
      () => WorkflowService.validateGraph(nodes, edges),
      /cycle or circular dependency/
    );
  });

  await t.test('unsupported node type is rejected', () => {
    const nodes = [
      { id: 'n1', type: 'unsupported_custom_code_runner' }
    ];
    const edges = [];

    assert.throws(
      () => WorkflowService.validateGraph(nodes, edges),
      /Unsupported node type/
    );
  });
});

import test from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';
import { CodingService } from '../src/services/codingService.js';

test('Coding Service & API Endpoints Integration Test', async (t) => {
  const app = createApp();

  await t.test('CodingService exports all expected methods', () => {
    assert.strictEqual(typeof CodingService.getTopics, 'function');
    assert.strictEqual(typeof CodingService.getTopicById, 'function');
    assert.strictEqual(typeof CodingService.getProblems, 'function');
    assert.strictEqual(typeof CodingService.getProblemById, 'function');
    assert.strictEqual(typeof CodingService.consultTutor, 'function');
    assert.strictEqual(typeof CodingService.getRunnerStatus, 'function');
    assert.strictEqual(typeof CodingService.runCode, 'function');
  });

  await t.test('CodingService.runCode proxies execution payload to AI service', async () => {
    let capturedUrl = '';
    let capturedBody = null;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      if (options && options.body) {
        capturedBody = JSON.parse(options.body);
      }
      return {
        ok: true,
        json: async () => ({
          success: true,
          status: 'passed',
          passed_count: 1,
          total_count: 1,
          results: [{ test_case_id: 1, passed: true, actual: '42\n' }]
        })
      };
    };

    try {
      const res = await CodingService.runCode({
        language: 'python',
        code: 'print(42)',
        problemId: 'test-p',
        customInput: 'in',
        testCases: [{ input: 'in', output: '42' }]
      });

      assert.ok(res.success);
      assert.strictEqual(res.status, 'passed');
      assert.ok(capturedUrl.includes('/coding/run'));
      assert.strictEqual(capturedBody.language, 'python');
      assert.strictEqual(capturedBody.code, 'print(42)');
      assert.strictEqual(capturedBody.problem_id, 'test-p');
      assert.strictEqual(capturedBody.custom_input, 'in');
      assert.strictEqual(capturedBody.test_cases.length, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('CodingService.getRunnerStatus fetches docker availability status', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      assert.ok(url.includes('/coding/runner/status'));
      return {
        ok: true,
        json: async () => ({
          success: true,
          docker_available: false,
          error: 'Docker not installed'
        })
      };
    };

    try {
      const status = await CodingService.getRunnerStatus();
      assert.ok(status.success);
      assert.strictEqual(status.docker_available, false);
      assert.strictEqual(status.error, 'Docker not installed');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('CodingService payload construction preserves arguments', async () => {
    // Test payload formatting without external network dependency
    let capturedUrl = '';
    let capturedBody = null;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      if (options && options.body) {
        capturedBody = JSON.parse(options.body);
      }
      return {
        ok: true,
        json: async () => ({ success: true, mode: 'learn', content: 'Mock response' })
      };
    };

    try {
      const res = await CodingService.consultTutor({
        mode: 'debug',
        language: 'cpp',
        problemId: 'two-sum',
        studentCode: 'int x = 10;',
        userQuery: 'Is this optimal?',
        provider: 'demo'
      });

      assert.ok(res.success);
      assert.ok(capturedUrl.includes('/coding/tutor'));
      assert.strictEqual(capturedBody.mode, 'debug');
      assert.strictEqual(capturedBody.language, 'cpp');
      assert.strictEqual(capturedBody.problem_id, 'two-sum');
      assert.strictEqual(capturedBody.student_code, 'int x = 10;');
      assert.strictEqual(capturedBody.provider, 'demo');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

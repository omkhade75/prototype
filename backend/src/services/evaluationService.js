import crypto from 'crypto';
import { db } from '../database/db.js';
import { AIService } from './aiService.js';
import { DocumentService } from './documentService.js';
import { WorkflowService } from './workflowService.js';
import { AgentService } from './agentService.js';

export class EvaluationService {
  static getAllEvaluations() {
    const list = db.prepare(`
      SELECT id, suite_name, total_tests, passed_tests, failed_tests, duration_ms, results_json, created_at
      FROM evaluations
      ORDER BY created_at DESC
    `).all();

    return list.map((item) => ({
      ...item,
      results: JSON.parse(item.results_json)
    }));
  }

  static getEvaluationById(id) {
    const item = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id);
    if (!item) return null;
    return {
      ...item,
      results: JSON.parse(item.results_json)
    };
  }

  static async runSuite() {
    const suiteStart = Date.now();
    const testResults = [];

    // --- TEST 1: Knowledge Retrieval on Seeded Corpus ---
    const t1Start = Date.now();
    try {
      const chunks = DocumentService.getAllChunks();
      const res = await AIService.retrieve('TF-IDF retriever ranking', chunks, 2);
      const top = res.results && res.results[0];
      const passed = top && top.content.toLowerCase().includes('tf-idf') && top.score > 0;

      testResults.push({
        id: 'eval-1',
        name: 'Knowledge Retrieval Grounding',
        category: 'RAG Retrieval',
        description: 'Verifies TF-IDF accurately retrieves seeded chunks matching relevant keywords.',
        status: passed ? 'PASSED' : 'FAILED',
        duration_ms: Date.now() - t1Start,
        details: {
          expected: 'Chunk containing "TF-IDF" with score > 0',
          actual: top ? `Top score: ${top.score}, doc #${top.document_id}` : 'No passages matched'
        }
      });
    } catch (err) {
      testResults.push({
        id: 'eval-1',
        name: 'Knowledge Retrieval Grounding',
        category: 'RAG Retrieval',
        description: 'Verifies TF-IDF accurately retrieves seeded chunks.',
        status: 'FAILED',
        duration_ms: Date.now() - t1Start,
        error: err.message
      });
    }

    // --- TEST 2: Missing Information Rejection ---
    const t2Start = Date.now();
    try {
      const chunks = DocumentService.getAllChunks();
      const res = await AIService.retrieve('antimatter hyperdrive propulsion engine', chunks, 2);
      const matches = res.results || [];
      const passed = matches.length === 0;

      testResults.push({
        id: 'eval-2',
        name: 'Missing Information Detection',
        category: 'RAG Hallucination Prevention',
        description: 'Verifies retriever returns zero matches for non-existent out-of-domain knowledge.',
        status: passed ? 'PASSED' : 'FAILED',
        duration_ms: Date.now() - t2Start,
        details: {
          expected: '0 matches returned for unseen queries',
          actual: `${matches.length} matches returned`
        }
      });
    } catch (err) {
      testResults.push({
        id: 'eval-2',
        name: 'Missing Information Detection',
        category: 'RAG Hallucination Prevention',
        description: 'Verifies retriever returns zero matches for unseen queries.',
        status: 'FAILED',
        duration_ms: Date.now() - t2Start,
        error: err.message
      });
    }

    // --- TEST 3: Tool Argument Schema Validation ---
    const t3Start = Date.now();
    try {
      let rejected = false;
      let errorCaptured = '';
      try {
        // Missing required prompt / arguments
        await AgentService.executeAgentRun({ message: '' });
      } catch (e) {
        rejected = true;
        errorCaptured = e.message;
      }

      testResults.push({
        id: 'eval-3',
        name: 'Tool & Prompt Argument Validation',
        category: 'Agent Guardrails',
        description: 'Verifies empty or malformed parameters are rejected before tool execution.',
        status: rejected ? 'PASSED' : 'FAILED',
        duration_ms: Date.now() - t3Start,
        details: {
          expected: 'Immediate rejection of empty prompt',
          actual: rejected ? `Validation caught: "${errorCaptured}"` : 'Failed to reject empty prompt'
        }
      });
    } catch (err) {
      testResults.push({
        id: 'eval-3',
        name: 'Tool & Prompt Argument Validation',
        category: 'Agent Guardrails',
        description: 'Verifies empty or malformed parameters are rejected.',
        status: 'FAILED',
        duration_ms: Date.now() - t3Start,
        error: err.message
      });
    }

    // --- TEST 4: Workflow Approval Pause & Idempotent Resume ---
    const t4Start = Date.now();
    try {
      // Execute sample workflow with human approval
      const wfRun = await WorkflowService.executeWorkflow({
        workflowId: 'wf-sample-2',
        initialInput: { input: 'Student applicant evaluation' }
      });

      const pausedCorrectly = wfRun.status === 'waiting_for_approval';

      // Resume execution with approval
      const resumedRun = await WorkflowService.resumeApproval({
        runId: wfRun.id,
        approved: true,
        reviewerNotes: 'Automated evaluation test approval'
      });

      const finishedCorrectly = resumedRun.status === 'successful';

      // Attempt duplicate approval (should be rejected for idempotency)
      let duplicateRejected = false;
      try {
        await WorkflowService.resumeApproval({
          runId: wfRun.id,
          approved: true
        });
      } catch (e) {
        duplicateRejected = true;
      }

      const passed = pausedCorrectly && finishedCorrectly && duplicateRejected;

      testResults.push({
        id: 'eval-4',
        name: 'Human Approval State Transition & Idempotency',
        category: 'Workflow Integrity',
        description: 'Verifies workflows pause at approval nodes, resume cleanly, and forbid duplicate approvals.',
        status: passed ? 'PASSED' : 'FAILED',
        duration_ms: Date.now() - t4Start,
        details: {
          expected: 'Pause -> Resume to Successful -> Reject Duplicate',
          actual: `Paused: ${pausedCorrectly}, Resumed: ${finishedCorrectly}, Duplicate blocked: ${duplicateRejected}`
        }
      });
    } catch (err) {
      testResults.push({
        id: 'eval-4',
        name: 'Human Approval State Transition & Idempotency',
        category: 'Workflow Integrity',
        description: 'Verifies workflow approval state machine.',
        status: 'FAILED',
        duration_ms: Date.now() - t4Start,
        error: err.message
      });
    }

    const suiteDuration = Date.now() - suiteStart;
    const passedCount = testResults.filter((t) => t.status === 'PASSED').length;
    const failedCount = testResults.filter((t) => t.status === 'FAILED').length;
    const evalId = `eval-${crypto.randomUUID()}`;

    // Persist evaluation result
    db.prepare(`
      INSERT INTO evaluations (
        id, suite_name, total_tests, passed_tests, failed_tests, duration_ms, results_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      evalId,
      'ORBIT AI Core Integrity Suite',
      testResults.length,
      passedCount,
      failedCount,
      suiteDuration,
      JSON.stringify(testResults)
    );

    return this.getEvaluationById(evalId);
  }
}

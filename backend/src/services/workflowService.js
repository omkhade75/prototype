import crypto from 'crypto';
import { db } from '../database/db.js';
import { AIService } from './aiService.js';
import { DocumentService } from './documentService.js';

export const SUPPORTED_NODE_TYPES = [
  'input',
  'knowledge_search',
  'ai_task',
  'condition',
  'human_approval',
  'output'
];

export class WorkflowService {
  static getAllWorkflows() {
    const list = db.prepare(`
      SELECT id, name, description, graph_json, created_at, updated_at
      FROM workflow_definitions
      ORDER BY updated_at DESC
    `).all();

    return list.map((w) => ({
      ...w,
      graph: JSON.parse(w.graph_json)
    }));
  }

  static getWorkflowById(id) {
    const w = db.prepare('SELECT * FROM workflow_definitions WHERE id = ?').get(id);
    if (!w) return null;
    return {
      ...w,
      graph: JSON.parse(w.graph_json)
    };
  }

  static saveWorkflow({ id, name, description, graph }) {
    if (!name || !name.trim()) {
      throw new Error('Workflow name is required.');
    }
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      throw new Error('Workflow must contain nodes and edges arrays.');
    }

    // Validate graph structure before saving
    this.validateGraph(graph.nodes, graph.edges);

    const workflowId = id || `wf-${crypto.randomUUID()}`;
    const graphJson = JSON.stringify(graph);

    const existing = db.prepare('SELECT id FROM workflow_definitions WHERE id = ?').get(workflowId);

    if (existing) {
      db.prepare(`
        UPDATE workflow_definitions
        SET name = ?, description = ?, graph_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, description || '', graphJson, workflowId);
    } else {
      db.prepare(`
        INSERT INTO workflow_definitions (id, name, description, graph_json)
        VALUES (?, ?, ?, ?)
      `).run(workflowId, name, description || '', graphJson);
    }

    return this.getWorkflowById(workflowId);
  }

  static validateGraph(nodes, edges) {
    if (!nodes || nodes.length === 0) {
      throw new Error('Workflow graph must contain at least one node.');
    }

    // 1. Validate node types
    const nodeMap = new Map();
    for (const node of nodes) {
      if (!node.id) {
        throw new Error('All nodes must have a unique id.');
      }
      if (nodeMap.has(node.id)) {
        throw new Error(`Duplicate node ID detected: '${node.id}'.`);
      }
      if (!SUPPORTED_NODE_TYPES.includes(node.type)) {
        throw new Error(`Unsupported node type '${node.type}'. Supported types: ${SUPPORTED_NODE_TYPES.join(', ')}.`);
      }
      nodeMap.set(node.id, node);
    }

    // 2. Validate edges point to valid nodes
    const inDegree = new Map();
    const adjList = new Map();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    }

    for (const edge of edges) {
      if (!nodeMap.has(edge.source)) {
        throw new Error(`Edge source '${edge.source}' does not exist in nodes.`);
      }
      if (!nodeMap.has(edge.target)) {
        throw new Error(`Edge target '${edge.target}' does not exist in nodes.`);
      }
      adjList.get(edge.source).push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target) + 1);
    }

    // 3. Cycle Detection using Kahn's algorithm (Topological sort)
    const queue = [];
    for (const [nodeId, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(nodeId);
      }
    }

    let visitedCount = 0;
    const sortedOrder = [];

    while (queue.length > 0) {
      const current = queue.shift();
      sortedOrder.push(current);
      visitedCount += 1;

      for (const neighbor of adjList.get(current)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (visitedCount !== nodes.length) {
      throw new Error('Validation Error: Workflow graph contains a cycle or circular dependency. DAG execution requires acyclic graph.');
    }

    return {
      isValid: true,
      executionOrder: sortedOrder
    };
  }

  static async executeWorkflow({ workflowId, initialInput = null, provider = 'demo' }) {
    const workflow = this.getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error(`Workflow '${workflowId}' not found.`);
    }

    const { nodes, edges } = workflow.graph;
    const validation = this.validateGraph(nodes, edges);
    const executionOrder = validation.executionOrder;

    const runId = `wfrun-${crypto.randomUUID()}`;
    const startTime = Date.now();

    // Create initial run record
    db.prepare(`
      INSERT INTO workflow_runs (
        id, workflow_id, workflow_name, status, input_data, created_at, updated_at
      ) VALUES (?, ?, ?, 'running', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      runId,
      workflowId,
      workflow.name,
      JSON.stringify(initialInput || {})
    );

    return await this._runExecutionPipeline({
      runId,
      workflow,
      executionOrder,
      startIndex: 0,
      initialContext: initialInput || {},
      provider,
      startTime
    });
  }

  static async resumeApproval({ runId, approved, reviewerNotes = '' }) {
    const run = this.getRunById(runId);
    if (!run) {
      throw new Error(`Workflow run '${runId}' not found.`);
    }

    // Idempotency check: Cannot re-approve completed or failed runs
    if (run.status !== 'waiting_for_approval') {
      throw new Error(`Workflow run '${runId}' is in '${run.status}' state and cannot be resumed.`);
    }

    const workflow = this.getWorkflowById(run.workflow_id);
    const { nodes, edges } = workflow.graph;
    const { executionOrder } = this.validateGraph(nodes, edges);

    const pausedNodeId = run.paused_step_id;
    const pausedNodeIndex = executionOrder.indexOf(pausedNodeId);

    if (!approved) {
      // User rejected approval
      db.prepare(`
        UPDATE workflow_runs
        SET 
          status = 'failed', 
          error_message = ?, 
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(`Execution rejected by human reviewer. Notes: ${reviewerNotes || 'None'}`, runId);

      db.prepare(`
        UPDATE workflow_steps
        SET 
          status = 'failed', 
          error_message = 'Rejected by human reviewer', 
          output_data = ?
        WHERE run_id = ? AND node_id = ?
      `).run(JSON.stringify({ approved: false, reviewerNotes }), runId, pausedNodeId);

      return this.getRunById(runId);
    }

    // Update approval step to successful
    db.prepare(`
      UPDATE workflow_steps
      SET 
        status = 'successful', 
        output_data = ?
      WHERE run_id = ? AND node_id = ?
    `).run(JSON.stringify({ approved: true, reviewerNotes, timestamp: new Date().toISOString() }), runId, pausedNodeId);

    // Get previous accumulated context
    const lastStep = run.steps.find((s) => s.node_id === pausedNodeId);
    let currentContext = lastStep && lastStep.input_data ? JSON.parse(lastStep.input_data) : {};
    currentContext.approval = { approved: true, reviewerNotes };

    // Resume from the node following the approval node
    return await this._runExecutionPipeline({
      runId,
      workflow,
      executionOrder,
      startIndex: pausedNodeIndex + 1,
      initialContext: currentContext,
      provider: 'demo',
      startTime: new Date(run.created_at).getTime()
    });
  }

  static async _runExecutionPipeline({
    runId,
    workflow,
    executionOrder,
    startIndex,
    initialContext,
    provider,
    startTime
  }) {
    const nodeMap = new Map(workflow.graph.nodes.map((n) => [n.id, n]));
    let context = { ...initialContext };
    let finalOutput = null;

    const insertStep = db.prepare(`
      INSERT INTO workflow_steps (
        run_id, node_id, node_type, node_name, status, duration_ms, input_data, output_data, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      for (let i = startIndex; i < executionOrder.length; i++) {
        const nodeId = executionOrder[i];
        const node = nodeMap.get(nodeId);
        const nodeStartTime = Date.now();
        let stepOutput = null;
        let stepStatus = 'successful';
        let stepError = null;

        const nodeLabel = node.data?.label || `${node.type} Node`;

        if (node.type === 'input') {
          const val = context.input || node.data?.value || 'Default Input Text';
          stepOutput = { value: val };
          context.input = val;
          context.current_text = typeof val === 'string' ? val : JSON.stringify(val);

        } else if (node.type === 'knowledge_search') {
          const query = context.current_text || context.input || 'General Knowledge Query';
          const topK = node.data?.topK || 2;
          const chunks = DocumentService.getAllChunks();
          const retrievalRes = await AIService.retrieve(query, chunks, topK);
          stepOutput = {
            query,
            matched_count: retrievalRes.results ? retrievalRes.results.length : 0,
            passages: retrievalRes.results || []
          };
          context.retrieved_passages = stepOutput.passages;
          if (stepOutput.passages.length > 0) {
            context.current_text = stepOutput.passages.map((p) => p.content).join('\n\n');
          }

        } else if (node.type === 'ai_task') {
          const taskType = node.data?.taskType || 'summarize';
          const textToProcess = context.current_text || context.input || '';
          const taskRes = await AIService.executeTask(taskType, textToProcess, node.data?.params || {}, provider);
          stepOutput = taskRes;
          context.ai_result = taskRes.result;
          context.current_text = typeof taskRes.result === 'string' ? taskRes.result : JSON.stringify(taskRes.result);

        } else if (node.type === 'condition') {
          // Predefined safe comparisons (NO eval or arbitrary code execution!)
          const operator = node.data?.operator || 'is_not_empty';
          const targetValue = node.data?.targetValue || '';
          const textToEvaluate = String(context.current_text || context.input || '');

          let conditionPassed = false;
          if (operator === 'equals') conditionPassed = textToEvaluate === targetValue;
          else if (operator === 'contains') conditionPassed = textToEvaluate.includes(targetValue);
          else if (operator === 'is_not_empty') conditionPassed = textToEvaluate.trim().length > 0;
          else if (operator === 'length_greater_than') conditionPassed = textToEvaluate.length > Number(targetValue);

          stepOutput = {
            operator,
            targetValue,
            evaluated_text: textToEvaluate.slice(0, 100),
            passed: conditionPassed
          };
          context.condition_passed = conditionPassed;

        } else if (node.type === 'human_approval') {
          // Pause execution and wait for human review!
          const nodeDuration = Date.now() - nodeStartTime;
          insertStep.run(
            runId,
            node.id,
            node.type,
            nodeLabel,
            'waiting_for_approval',
            nodeDuration,
            JSON.stringify(context),
            JSON.stringify({ prompt: node.data?.promptMessage || 'Approval Required' }),
            null
          );

          db.prepare(`
            UPDATE workflow_runs
            SET 
              status = 'waiting_for_approval', 
              paused_step_id = ?, 
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(node.id, runId);

          return this.getRunById(runId);

        } else if (node.type === 'output') {
          finalOutput = {
            result: context.current_text || context.ai_result || context.input,
            contextSnapshot: context,
            timestamp: new Date().toISOString()
          };
          stepOutput = finalOutput;
        }

        const nodeDuration = Date.now() - nodeStartTime;
        insertStep.run(
          runId,
          node.id,
          node.type,
          nodeLabel,
          stepStatus,
          nodeDuration,
          JSON.stringify(context),
          JSON.stringify(stepOutput || {}),
          stepError
        );
      }

      // If loop completed without pausing, mark workflow run as successful
      const totalDuration = Date.now() - startTime;
      db.prepare(`
        UPDATE workflow_runs
        SET 
          status = 'successful', 
          duration_ms = ?, 
          output_data = ?, 
          paused_step_id = NULL, 
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        totalDuration,
        JSON.stringify(finalOutput || context),
        runId
      );

      return this.getRunById(runId);

    } catch (err) {
      const totalDuration = Date.now() - startTime;
      db.prepare(`
        UPDATE workflow_runs
        SET 
          status = 'failed', 
          duration_ms = ?, 
          error_message = ?, 
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(totalDuration, err.message, runId);

      throw err;
    }
  }

  static getRunById(runId) {
    const run = db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(runId);
    if (!run) return null;

    const steps = db.prepare(`
      SELECT id, run_id, node_id, node_type, node_name, status, duration_ms, input_data, output_data, error_message, created_at
      FROM workflow_steps
      WHERE run_id = ?
      ORDER BY id ASC
    `).all(runId);

    return {
      ...run,
      input_data: run.input_data ? JSON.parse(run.input_data) : null,
      output_data: run.output_data ? JSON.parse(run.output_data) : null,
      steps
    };
  }

  static getAllRuns() {
    return db.prepare(`
      SELECT 
        id, 
        workflow_id, 
        workflow_name, 
        status, 
        duration_ms, 
        paused_step_id, 
        error_message, 
        created_at, 
        updated_at
      FROM workflow_runs
      ORDER BY created_at DESC
    `).all();
  }
}

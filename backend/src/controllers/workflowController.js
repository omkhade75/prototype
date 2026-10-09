import { WorkflowService } from '../services/workflowService.js';

export class WorkflowController {
  static async listWorkflows(req, res, next) {
    try {
      const workflows = WorkflowService.getAllWorkflows();
      res.json({ success: true, count: workflows.length, data: workflows });
    } catch (err) {
      next(err);
    }
  }

  static async getWorkflow(req, res, next) {
    try {
      const workflow = WorkflowService.getWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ success: false, error: { message: 'Workflow not found.' } });
      }
      res.json({ success: true, data: workflow });
    } catch (err) {
      next(err);
    }
  }

  static async saveWorkflow(req, res, next) {
    try {
      const { id, name, description, graph } = req.body;
      const saved = WorkflowService.saveWorkflow({ id, name, description, graph });
      res.status(200).json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }

  static async executeWorkflow(req, res, next) {
    try {
      const { id } = req.params;
      const { input, provider } = req.body;
      const result = await WorkflowService.executeWorkflow({
        workflowId: id,
        initialInput: input || {},
        provider: provider || 'demo'
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async approveWorkflow(req, res, next) {
    try {
      const { id } = req.params;
      const { approved = true, reviewerNotes = '' } = req.body;
      const result = await WorkflowService.resumeApproval({
        runId: id,
        approved: Boolean(approved),
        reviewerNotes
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async rejectWorkflow(req, res, next) {
    try {
      const { id } = req.params;
      const { reviewerNotes = '' } = req.body;
      const result = await WorkflowService.resumeApproval({
        runId: id,
        approved: false,
        reviewerNotes
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

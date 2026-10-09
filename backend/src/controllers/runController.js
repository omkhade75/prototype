import { WorkflowService } from '../services/workflowService.js';
import { AgentService } from '../services/agentService.js';

export class RunController {
  static async listAllRuns(req, res, next) {
    try {
      const type = req.query.type; // 'workflow', 'agent', or undefined
      const workflowRuns = (!type || type === 'workflow') ? WorkflowService.getAllRuns() : [];
      const agentRuns = (!type || type === 'agent') ? AgentService.getAllRuns() : [];

      const combined = [
        ...workflowRuns.map((r) => ({ ...r, execution_type: 'workflow' })),
        ...agentRuns.map((r) => ({ ...r, execution_type: 'agent' }))
      ];

      // Sort combined runs descending by creation date
      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      res.json({ success: true, count: combined.length, data: combined });
    } catch (err) {
      next(err);
    }
  }

  static async getWorkflowRun(req, res, next) {
    try {
      const run = WorkflowService.getRunById(req.params.id);
      if (!run) {
        return res.status(404).json({ success: false, error: { message: 'Workflow run not found.' } });
      }
      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }
}

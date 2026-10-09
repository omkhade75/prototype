import { AgentService } from '../services/agentService.js';

export class AgentController {
  static async listRuns(req, res, next) {
    try {
      const runs = AgentService.getAllRuns();
      res.json({ success: true, count: runs.length, data: runs });
    } catch (err) {
      next(err);
    }
  }

  static async getRun(req, res, next) {
    try {
      const run = AgentService.getRunById(req.params.id);
      if (!run) {
        return res.status(404).json({ success: false, error: { message: 'Agent run not found.' } });
      }
      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  static async runAgent(req, res, next) {
    try {
      const { message, provider, maxSteps } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Message parameter is required.' }
        });
      }

      const run = await AgentService.executeAgentRun({
        message,
        provider: provider || 'demo',
        maxSteps: maxSteps ? Number(maxSteps) : 5
      });

      res.status(201).json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  static async getTools(req, res, next) {
    try {
      const tools = await AgentService.getAvailableTools();
      res.json({ success: true, data: tools });
    } catch (err) {
      next(err);
    }
  }
}

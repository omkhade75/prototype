import { EvaluationService } from '../services/evaluationService.js';

export class EvaluationController {
  static async listEvaluations(req, res, next) {
    try {
      const evals = EvaluationService.getAllEvaluations();
      res.json({ success: true, count: evals.length, data: evals });
    } catch (err) {
      next(err);
    }
  }

  static async getEvaluation(req, res, next) {
    try {
      const evaluation = EvaluationService.getEvaluationById(req.params.id);
      if (!evaluation) {
        return res.status(404).json({ success: false, error: { message: 'Evaluation run not found.' } });
      }
      res.json({ success: true, data: evaluation });
    } catch (err) {
      next(err);
    }
  }

  static async runSuite(req, res, next) {
    try {
      const result = await EvaluationService.runSuite();
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

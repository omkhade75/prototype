import { Router } from 'express';
import { EvaluationController } from '../controllers/evaluationController.js';

const router = Router();

router.get('/results', EvaluationController.listEvaluations);
router.get('/results/:id', EvaluationController.getEvaluation);
router.post('/run', EvaluationController.runSuite);

export default router;

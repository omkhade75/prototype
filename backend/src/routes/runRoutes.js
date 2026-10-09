import { Router } from 'express';
import { RunController } from '../controllers/runController.js';

const router = Router();

router.get('/', RunController.listAllRuns);
router.get('/:id', RunController.getWorkflowRun);

export default router;

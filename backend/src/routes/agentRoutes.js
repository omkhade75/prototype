import { Router } from 'express';
import { AgentController } from '../controllers/agentController.js';

const router = Router();

router.get('/history', AgentController.listRuns);
router.get('/runs/:id', AgentController.getRun);
router.get('/tools', AgentController.getTools);
router.post('/run', AgentController.runAgent);

export default router;

import { Router } from 'express';
import { KnowledgeController } from '../controllers/knowledgeController.js';

const router = Router();

router.post('/ask', KnowledgeController.askQuestion);

export default router;

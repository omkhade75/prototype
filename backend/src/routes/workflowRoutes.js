import { Router } from 'express';
import { WorkflowController } from '../controllers/workflowController.js';

const router = Router();

router.get('/', WorkflowController.listWorkflows);
router.get('/:id', WorkflowController.getWorkflow);
router.post('/', WorkflowController.saveWorkflow);
router.post('/:id/execute', WorkflowController.executeWorkflow);
router.post('/approvals/:id/approve', WorkflowController.approveWorkflow);
router.post('/approvals/:id/reject', WorkflowController.rejectWorkflow);

export default router;

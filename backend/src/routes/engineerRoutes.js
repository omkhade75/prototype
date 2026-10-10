import express from 'express';
import { EngineerController } from '../controllers/engineerController.js';

const router = express.Router();

// Projects
router.get('/projects', EngineerController.listProjects);
router.post('/projects', EngineerController.createProject);
router.get('/projects/:id', EngineerController.getProject);
router.patch('/projects/:id', EngineerController.updateProject);
router.delete('/projects/:id', EngineerController.deleteProject);

// Tasks
router.get('/projects/:id/tasks', EngineerController.listTasks);
router.post('/projects/:id/tasks', EngineerController.createTask);
router.patch('/projects/:id/tasks/:taskId', EngineerController.updateTask);

// Files (workspace safe sandbox)
router.get('/projects/:id/files', EngineerController.getFileTree);
router.get('/projects/:id/files/content', EngineerController.readFile);
router.post('/projects/:id/files', EngineerController.writeFile);
router.put('/projects/:id/files/edit', EngineerController.editFile);

// Commands
router.post('/projects/:id/commands', EngineerController.executeCommand);

// Git
router.get('/projects/:id/git/status', EngineerController.getGitStatus);
router.get('/projects/:id/git/preview-commit', EngineerController.previewCommit);
router.post('/projects/:id/git/commit', EngineerController.createCommit);
router.post('/projects/:id/git/push', EngineerController.pushRepository);

// Preview
router.post('/projects/:id/preview/start', EngineerController.startPreview);
router.post('/projects/:id/preview/stop', EngineerController.stopPreview);
router.get('/projects/:id/preview/status', EngineerController.getPreviewStatus);

// AI Planning, Generation & Repair
router.post('/projects/:id/ai/plan', EngineerController.planProject);
router.post('/projects/:id/ai/generate', EngineerController.generateProject);
router.post('/projects/:id/ai/repair', EngineerController.repairProject);

export default router;

import express from 'express';
import { LearningController } from '../controllers/learningController.js';

const router = express.Router();

router.get('/dashboard', LearningController.getDashboard);
router.post('/lesson', LearningController.recordLesson);
router.post('/hint', LearningController.recordHint);
router.post('/problem-attempt', LearningController.recordProblemAttempt);
router.post('/quiz-attempt', LearningController.recordQuizAttempt);
router.post('/reset', LearningController.resetProgress);

export default router;

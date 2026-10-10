import express from 'express';
import { CodingController } from '../controllers/codingController.js';

const router = express.Router();

router.get('/topics', CodingController.getTopics);
router.get('/topics/:id', CodingController.getTopic);
router.get('/problems', CodingController.getProblems);
router.get('/problems/:id', CodingController.getProblem);
router.post('/tutor', CodingController.consultTutor);
router.get('/runner/status', CodingController.getRunnerStatus);
router.post('/run', CodingController.runCode);
router.post('/document/analyze-topics', CodingController.analyzeDocumentTopics);
router.post('/lesson/generate', CodingController.generateLesson);
router.post('/lesson/followup', CodingController.answerFollowup);
router.post('/hints', CodingController.getProgressiveHint);
router.post('/quiz/evaluate', CodingController.evaluateQuiz);

export default router;

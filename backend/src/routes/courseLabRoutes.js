import express from 'express';
import { CourseLabController } from '../controllers/courseLabController.js';

const router = express.Router();

// Courses & Modules & Lessons
router.get('/courses', CourseLabController.listCourses);
router.post('/courses', CourseLabController.createCourse);
router.get('/courses/:id', CourseLabController.getCourse);
router.post('/courses/:courseId/modules', CourseLabController.createModule);
router.post('/courses/:courseId/modules/:moduleId/lessons', CourseLabController.createLesson);
router.post('/lessons/link-document', CourseLabController.linkDocument);

// Code Snippets
router.get('/snippets', CourseLabController.listSnippets);
router.post('/snippets', CourseLabController.addSnippet);
router.delete('/snippets/:id', CourseLabController.deleteSnippet);

// Learning Assistant Modes
router.post('/assistant/learn', CourseLabController.learn);
router.post('/assistant/explain-code', CourseLabController.explainCode);
router.post('/assistant/debug', CourseLabController.debug);
router.post('/assistant/practise', CourseLabController.practise);

// Notebook Builder & Validation
router.post('/notebooks/build', CourseLabController.buildNotebook);
router.post('/notebooks/validate', CourseLabController.validateNotebook);
router.get('/notebooks', CourseLabController.listNotebooks);
router.get('/notebooks/:id', CourseLabController.getNotebook);
router.get('/notebooks/:id/download', CourseLabController.downloadNotebook);

// Learning Progress
router.post('/progress', CourseLabController.logProgress);
router.get('/progress/summary', CourseLabController.getProgressSummary);

export default router;

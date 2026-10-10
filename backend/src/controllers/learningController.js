import { LearningService } from '../services/learningService.js';

export class LearningController {
  static async getDashboard(req, res, next) {
    try {
      const data = LearningService.getDashboard();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async recordLesson(req, res, next) {
    try {
      const { topicId, topicName, documentId, documentName } = req.body;
      const data = LearningService.recordTopicLesson({
        topicId,
        topicName,
        documentId,
        documentName
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async recordHint(req, res, next) {
    try {
      const { topicId, topicName, problemId, hintLevel } = req.body;
      const data = LearningService.recordHintRequest({
        topicId,
        topicName,
        problemId,
        hintLevel
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async recordProblemAttempt(req, res, next) {
    try {
      const {
        topicId,
        topicName,
        problemId,
        solved,
        independent,
        usedSolution,
        hintsCount,
        errorDescription
      } = req.body;

      const data = LearningService.recordProblemAttempt({
        topicId,
        topicName,
        problemId,
        solved,
        independent,
        usedSolution,
        hintsCount,
        errorDescription
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async recordQuizAttempt(req, res, next) {
    try {
      const {
        topicId,
        topicName,
        documentId,
        totalQuestions,
        correctAnswers,
        answers
      } = req.body;

      const data = LearningService.recordQuizAttempt({
        topicId,
        topicName,
        documentId,
        totalQuestions,
        correctAnswers,
        answers
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async resetProgress(req, res, next) {
    try {
      const data = LearningService.resetProgress();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

import { CodingService } from '../services/codingService.js';

export class CodingController {
  static async getTopics(req, res, next) {
    try {
      const data = await CodingService.getTopics();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getTopic(req, res, next) {
    try {
      const data = await CodingService.getTopicById(req.params.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getProblems(req, res, next) {
    try {
      const { topic_id } = req.query;
      const data = await CodingService.getProblems(topic_id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getProblem(req, res, next) {
    try {
      const data = await CodingService.getProblemById(req.params.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async consultTutor(req, res, next) {
    try {
      const {
        mode,
        language,
        problemId,
        topicId,
        studentCode,
        userQuery,
        documentId,
        provider
      } = req.body;

      const data = await CodingService.consultTutor({
        mode: mode || 'learn',
        language: language || 'cpp',
        problemId,
        topicId,
        studentCode,
        userQuery,
        documentId,
        provider: provider || 'demo'
      });

      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getRunnerStatus(req, res, next) {
    try {
      const data = await CodingService.getRunnerStatus();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async runCode(req, res, next) {
    try {
      const { language, code, problemId, customInput, testCases } = req.body;
      const data = await CodingService.runCode({
        language,
        code,
        problemId,
        customInput,
        testCases
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async analyzeDocumentTopics(req, res, next) {
    try {
      const { documentId } = req.body;
      const data = await CodingService.analyzeDocumentTopics(documentId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async generateLesson(req, res, next) {
    try {
      const { topicId, language, documentId, provider } = req.body;
      const data = await CodingService.generateLesson({
        topicId,
        language,
        documentId,
        provider
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async answerFollowup(req, res, next) {
    try {
      const { topicId, sectionNumber, question, documentId } = req.body;
      const data = await CodingService.answerFollowup({
        topicId,
        sectionNumber,
        question,
        documentId
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async getProgressiveHint(req, res, next) {
    try {
      const { problemId, hintLevel, language, topicId } = req.body;
      const data = await CodingService.getProgressiveHint({
        problemId,
        hintLevel,
        language,
        topicId
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  static async evaluateQuiz(req, res, next) {
    try {
      const { topicId, answers } = req.body;
      const data = await CodingService.evaluateQuiz({
        topicId,
        answers
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

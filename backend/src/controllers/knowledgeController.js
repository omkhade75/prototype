import { KnowledgeService } from '../services/knowledgeService.js';

export class KnowledgeController {
  static async askQuestion(req, res, next) {
    try {
      const { question, documentId, topK, provider } = req.body;
      if (!question || !question.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Question parameter is required and cannot be blank.' }
        });
      }

      const result = await KnowledgeService.askQuestion({
        question,
        documentId: documentId ? Number(documentId) : null,
        topK: topK ? Number(topK) : 3,
        provider: provider || 'demo'
      });

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

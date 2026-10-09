import { DocumentService } from './documentService.js';
import { AIService } from './aiService.js';
import { db } from '../database/db.js';

export class KnowledgeService {
  static async askQuestion({ question, documentId = null, topK = 3, provider = 'demo' }) {
    if (!question || !question.trim()) {
      throw new Error('Question cannot be empty.');
    }

    // 1. Fetch chunks from SQLite
    const chunks = DocumentService.getAllChunks(documentId);
    if (!chunks || chunks.length === 0) {
      return {
        answer: 'No documents or passages are currently uploaded in the knowledge base.',
        supported: false,
        citations: [],
        retrieved_passages: [],
        provider
      };
    }

    // 2. Query TF-IDF retrieval through Python AI Service
    const retrievalRes = await AIService.retrieve(question, chunks, topK);
    const rankedPassages = retrievalRes.results || [];

    // 3. Attach document filenames to the passages for clean citation display
    const docCache = new Map();
    const enrichedPassages = rankedPassages.map((p) => {
      const docId = p.document_id;
      if (!docCache.has(docId)) {
        const docRow = db.prepare('SELECT filename FROM documents WHERE id = ?').get(docId);
        docCache.set(docId, docRow ? docRow.filename : `Document #${docId}`);
      }
      return {
        ...p,
        filename: docCache.get(docId)
      };
    });

    // 4. Generate grounded answer
    const answerRes = await AIService.generateAnswer(question, enrichedPassages, provider);

    return {
      question,
      answer: answerRes.answer,
      supported: answerRes.supported,
      citations: answerRes.citations || [],
      retrieved_passages: enrichedPassages,
      provider: answerRes.provider || provider,
      total_chunks_searched: chunks.length
    };
  }
}

import dotenv from 'dotenv';
import { AIService } from './aiService.js';
import { DocumentService } from './documentService.js';
import { LearningService } from './learningService.js';
dotenv.config();

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class CodingService {
  static async getTopics() {
    const res = await fetch(`${AI_SERVICE_URL}/coding/topics`);
    if (!res.ok) {
      throw new Error(`Failed to fetch DSA topics: HTTP ${res.status}`);
    }
    return await res.json();
  }

  static async getTopicById(topicId) {
    const res = await fetch(`${AI_SERVICE_URL}/coding/topics/${encodeURIComponent(topicId)}`);
    if (!res.ok) {
      throw new Error(`Topic '${topicId}' not found.`);
    }
    return await res.json();
  }

  static async getProblems(topicId = null) {
    const url = topicId
      ? `${AI_SERVICE_URL}/coding/problems?topic_id=${encodeURIComponent(topicId)}`
      : `${AI_SERVICE_URL}/coding/problems`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch LeetCode problems: HTTP ${res.status}`);
    }
    return await res.json();
  }

  static async getProblemById(problemId) {
    const res = await fetch(`${AI_SERVICE_URL}/coding/problems/${encodeURIComponent(problemId)}`);
    if (!res.ok) {
      throw new Error(`Problem '${problemId}' not found.`);
    }
    return await res.json();
  }

  static async consultTutor({
    mode = 'learn',
    language = 'cpp',
    problemId = null,
    topicId = null,
    studentCode = null,
    userQuery = null,
    documentId = null,
    provider = 'demo'
  }) {
    let knowledgePassages = [];

    // Optional integration with Knowledge Hub documents:
    if (documentId) {
      const allChunks = DocumentService.getAllChunks();
      const docChunks = allChunks.filter((c) => String(c.document_id) === String(documentId));

      if (docChunks.length > 0) {
        // If a query or problem is present, retrieve top relevant chunks
        const queryText = userQuery || problemId || 'algorithm data structure';
        try {
          const retRes = await AIService.retrieve(queryText, docChunks, 2);
          if (retRes && retRes.passages) {
            knowledgePassages = retRes.passages;
          }
        } catch {
          knowledgePassages = docChunks.slice(0, 2);
        }
      }
    }

    const payload = {
      mode,
      language,
      problem_id: problemId,
      topic_id: topicId,
      student_code: studentCode,
      user_query: userQuery,
      knowledge_passages: knowledgePassages,
      provider
    };

    const res = await fetch(`${AI_SERVICE_URL}/coding/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Tutor consultation failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  static async getRunnerStatus() {
    const res = await fetch(`${AI_SERVICE_URL}/coding/runner/status`);
    if (!res.ok) {
      throw new Error(`Failed to fetch runner status: HTTP ${res.status}`);
    }
    return await res.json();
  }

  static async runCode({
    language = 'cpp',
    code,
    problemId = null,
    customInput = null,
    testCases = null
  }) {
    const payload = {
      language,
      code,
      problem_id: problemId,
      custom_input: customInput,
      test_cases: testCases
    };

    const res = await fetch(`${AI_SERVICE_URL}/coding/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Execution failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  static async analyzeDocumentTopics(documentId) {
    const doc = DocumentService.getDocumentById(documentId);
    if (!doc) {
      throw new Error(`Document #${documentId} not found.`);
    }

    const res = await fetch(`${AI_SERVICE_URL}/coding/document/analyze-topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chunks: doc.chunks || [],
        filename: doc.filename
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Topic analysis failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  static async generateLesson({
    topicId,
    language = 'cpp',
    documentId = null,
    provider = 'demo'
  }) {
    let documentChunks = [];
    let filename = null;

    if (documentId) {
      const doc = DocumentService.getDocumentById(documentId);
      if (doc) {
        documentChunks = doc.chunks || [];
        filename = doc.filename;
      }
    }

    const res = await fetch(`${AI_SERVICE_URL}/coding/lesson/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic_id: topicId,
        language,
        document_chunks: documentChunks,
        filename,
        provider
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Lesson generation failed with HTTP ${res.status}`);
    }

    const data = await res.json();

    try {
      LearningService.recordTopicLesson({
        topicId: data.topic_id || topicId,
        topicName: data.topic_name,
        documentId
      });
    } catch (e) {
      console.warn('Failed to record learning progress for lesson:', e.message);
    }

    return data;
  }

  static async answerFollowup({
    topicId,
    sectionNumber,
    question,
    documentId = null
  }) {
    let documentChunks = [];
    let filename = null;

    if (documentId) {
      const doc = DocumentService.getDocumentById(documentId);
      if (doc) {
        documentChunks = doc.chunks || [];
        filename = doc.filename;
      }
    }

    const res = await fetch(`${AI_SERVICE_URL}/coding/lesson/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic_id: topicId,
        section_number: sectionNumber,
        question,
        document_chunks: documentChunks,
        filename
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Lesson follow-up failed with HTTP ${res.status}`);
    }

    return await res.json();
  }

  static async getProgressiveHint({
    problemId,
    hintLevel = 1,
    language = 'cpp',
    topicId = null
  }) {
    const res = await fetch(`${AI_SERVICE_URL}/coding/hints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problem_id: problemId,
        hint_level: hintLevel,
        language
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Hint fetch failed with HTTP ${res.status}`);
    }

    const data = await res.json();

    try {
      LearningService.recordHintRequest({
        topicId: topicId || 'arrays',
        problemId,
        hintLevel
      });
    } catch (e) {
      console.warn('Failed to record hint request:', e.message);
    }

    return data;
  }

  static async evaluateQuiz({
    topicId,
    answers = []
  }) {
    const res = await fetch(`${AI_SERVICE_URL}/coding/quiz/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic_id: topicId,
        answers
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Quiz evaluation failed with HTTP ${res.status}`);
    }

    const data = await res.json();

    try {
      LearningService.recordQuizAttempt({
        topicId,
        score: data.percentage,
        totalQuestions: data.total_questions,
        passed: data.passed,
        answers
      });
    } catch (e) {
      console.warn('Failed to record quiz attempt:', e.message);
    }

    return data;
  }
}

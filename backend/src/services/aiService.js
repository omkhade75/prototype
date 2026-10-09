import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');

export class AIService {
  static getBaseUrl() {
    return AI_SERVICE_URL;
  }

  static async getHealth() {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/health`);
      if (!res.ok) {
        return {
          status: 'unreachable',
          error: `AI service returned HTTP ${res.status}`
        };
      }
      return await res.json();
    } catch (err) {
      return {
        status: 'unreachable',
        error: `Could not connect to Python AI service at ${AI_SERVICE_URL}: ${err.message}`
      };
    }
  }

  static async extractAndChunk(fileBuffer, filename, documentId) {
    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append('file', blob, filename);
    formData.append('filename', filename);
    if (documentId) {
      formData.append('document_id', String(documentId));
    }

    const res = await fetch(`${AI_SERVICE_URL}/documents/extract-and-chunk`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Extraction failed with status ${res.status}`);
    }

    return await res.json();
  }

  static async chunkText(filename, content, documentId) {
    const res = await fetch(`${AI_SERVICE_URL}/documents/chunk-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content, document_id: documentId })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Chunking failed with status ${res.status}`);
    }

    return await res.json();
  }

  static async retrieve(query, chunks, topK = 3) {
    const res = await fetch(`${AI_SERVICE_URL}/retrieval/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, chunks, top_k: topK })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Retrieval query failed with status ${res.status}`);
    }

    return await res.json();
  }

  static async generateAnswer(question, passages, provider = 'demo') {
    const res = await fetch(`${AI_SERVICE_URL}/retrieval/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, passages, provider })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Answer generation failed with status ${res.status}`);
    }

    return await res.json();
  }

  static async runAgent(message, chunks = [], provider = 'demo', maxSteps = 5) {
    const res = await fetch(`${AI_SERVICE_URL}/agent/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chunks, provider, max_steps: maxSteps })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Agent execution failed with status ${res.status}`);
    }

    return await res.json();
  }

  static async getAvailableTools() {
    const res = await fetch(`${AI_SERVICE_URL}/agent/tools`);
    if (!res.ok) {
      throw new Error(`Failed to fetch tools: HTTP ${res.status}`);
    }
    return await res.json();
  }

  static async executeTask(taskType, inputText, parameters = {}, provider = 'demo') {
    const res = await fetch(`${AI_SERVICE_URL}/tasks/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_type: taskType,
        input_text: inputText,
        parameters,
        provider
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Task execution failed with status ${res.status}`);
    }

    return await res.json();
  }
}

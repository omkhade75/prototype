const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // --- System Health & Status ---
  getSystemStatus: () => request('/system/status'),

  // --- Documents & Knowledge Hub ---
  getDocuments: () => request('/documents'),
  getDocument: (id) => request(`/documents/${id}`),
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  askQuestion: ({ question, documentId = null, topK = 3, provider = 'demo' }) =>
    request('/knowledge/ask', {
      method: 'POST',
      body: JSON.stringify({ question, documentId, topK, provider })
    }),

  // --- Agent Playground ---
  getTools: () => request('/agent/tools'),
  getAgentRuns: () => request('/agent/history'),
  getAgentRun: (id) => request(`/agent/runs/${id}`),
  runAgent: ({ message, provider = 'demo', maxSteps = 5 }) =>
    request('/agent/run', {
      method: 'POST',
      body: JSON.stringify({ message, provider, maxSteps })
    }),

  // --- Workflow Studio ---
  getWorkflows: () => request('/workflows'),
  getWorkflow: (id) => request(`/workflows/${id}`),
  saveWorkflow: (payload) =>
    request('/workflows', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  executeWorkflow: (id, input = {}, provider = 'demo') =>
    request(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input, provider })
    }),
  approveWorkflow: (runId, reviewerNotes = '') =>
    request(`/workflows/approvals/${runId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved: true, reviewerNotes })
    }),
  rejectWorkflow: (runId, reviewerNotes = '') =>
    request(`/workflows/approvals/${runId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewerNotes })
    }),

  // --- Runs Dashboard ---
  getAllRuns: (type) => request(`/runs${type ? `?type=${type}` : ''}`),
  getWorkflowRun: (id) => request(`/runs/${id}`),

  // --- Evaluations ---
  getEvaluations: () => request('/evaluations/results'),
  getEvaluation: (id) => request(`/evaluations/results/${id}`),
  runEvaluations: () => request('/evaluations/run', { method: 'POST' })
};

export default api;

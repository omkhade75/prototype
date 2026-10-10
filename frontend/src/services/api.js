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
  runEvaluations: () => request('/evaluations/run', { method: 'POST' }),

  // --- Coding Playground ---
  getCodingTopics: () => request('/coding/topics'),
  getCodingTopic: (id) => request(`/coding/topics/${id}`),
  getCodingProblems: (topicId = null) =>
    request(`/coding/problems${topicId ? `?topic_id=${encodeURIComponent(topicId)}` : ''}`),
  getCodingProblem: (id) => request(`/coding/problems/${id}`),
  consultCodingTutor: ({
    mode = 'learn',
    language = 'cpp',
    problemId = null,
    topicId = null,
    studentCode = null,
    userQuery = null,
    documentId = null,
    provider = 'demo'
  }) =>
    request('/coding/tutor', {
      method: 'POST',
      body: JSON.stringify({
        mode,
        language,
        problemId,
        topicId,
        studentCode,
        userQuery,
        documentId,
        provider
      })
    }),
  getCodingRunnerStatus: () => request('/coding/runner/status'),
  runCode: ({ language, code, problemId = null, customInput = null, testCases = null }) =>
    request('/coding/run', {
      method: 'POST',
      body: JSON.stringify({
        language,
        code,
        problemId,
        customInput,
        testCases
      })
    }),

  // --- PDF-Based DSA Tutor & Lessons ---
  analyzeDocumentTopics: (documentId) =>
    request('/coding/document/analyze-topics', {
      method: 'POST',
      body: JSON.stringify({ documentId })
    }),
  generateLesson: ({ topicId, language = 'cpp', documentId = null, provider = 'demo' }) =>
    request('/coding/lesson/generate', {
      method: 'POST',
      body: JSON.stringify({ topicId, language, documentId, provider })
    }),
  answerLessonFollowup: ({ topicId, sectionNumber, question, documentId = null }) =>
    request('/coding/lesson/followup', {
      method: 'POST',
      body: JSON.stringify({ topicId, sectionNumber, question, documentId })
    }),
  getProgressiveHint: ({ problemId, hintLevel = 1, language = 'cpp', topicId = null }) =>
    request('/coding/hints', {
      method: 'POST',
      body: JSON.stringify({ problemId, hintLevel, language, topicId })
    }),
  evaluateQuiz: ({ topicId, answers }) =>
    request('/coding/quiz/evaluate', {
      method: 'POST',
      body: JSON.stringify({ topicId, answers })
    }),

  // --- Personalized Learning Progress & Analytics ---
  getLearningDashboard: () => request('/learning/dashboard'),
  recordTopicLesson: ({ topicId, topicName, documentId = null, documentName = null }) =>
    request('/learning/lesson', {
      method: 'POST',
      body: JSON.stringify({ topicId, topicName, documentId, documentName })
    }),
  recordHintRequest: ({ topicId, topicName, problemId, hintLevel = 1 }) =>
    request('/learning/hint', {
      method: 'POST',
      body: JSON.stringify({ topicId, topicName, problemId, hintLevel })
    }),
  recordProblemAttempt: ({
    topicId,
    topicName,
    problemId,
    solved = false,
    independent = true,
    usedSolution = false,
    hintsCount = 0,
    errorDescription = null
  }) =>
    request('/learning/attempt', {
      method: 'POST',
      body: JSON.stringify({
        topicId,
        topicName,
        problemId,
        solved,
        independent,
        usedSolution,
        hintsCount,
        errorDescription
      })
    }),
  recordQuizAttempt: ({ topicId, topicName, score, totalQuestions, passed, answers }) =>
    request('/learning/quiz', {
      method: 'POST',
      body: JSON.stringify({ topicId, topicName, score, totalQuestions, passed, answers })
    }),
  resetLearningProgress: () =>
    request('/learning/reset', {
      method: 'POST'
    }),

  // --- Software Engineer Agent & Workspaces ---
  getEngineerProjects: () => request('/engineer/projects'),
  getEngineerProject: (id) => request(`/engineer/projects/${encodeURIComponent(id)}`),
  createEngineerProject: ({ name, description, stack }) =>
    request('/engineer/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description, stack })
    }),
  updateEngineerProject: (id, updates) =>
    request(`/engineer/projects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteEngineerProject: (id) =>
    request(`/engineer/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),
  getEngineerTasks: (id) => request(`/engineer/projects/${encodeURIComponent(id)}/tasks`),
  createEngineerTask: (id, taskData) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData)
    }),
  updateEngineerTask: (id, taskId, updates) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  getEngineerFileTree: (id) => request(`/engineer/projects/${encodeURIComponent(id)}/files`),
  readEngineerFile: (id, path) => request(`/engineer/projects/${encodeURIComponent(id)}/files/content?path=${encodeURIComponent(path)}`),
  writeEngineerFile: (id, path, content) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/files`, {
      method: 'POST',
      body: JSON.stringify({ path, content })
    }),
  editEngineerFile: (id, path, target_content, replacement_content) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/files/edit`, {
      method: 'PUT',
      body: JSON.stringify({ path, target_content, replacement_content })
    }),
  executeEngineerCommand: (id, { command, args, confirmed = false }) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/commands`, {
      method: 'POST',
      body: JSON.stringify({ command, args, confirmed })
    }),
  getEngineerGitStatus: (id) => request(`/engineer/projects/${encodeURIComponent(id)}/git/status`),
  previewEngineerCommit: (id) => request(`/engineer/projects/${encodeURIComponent(id)}/git/preview-commit`),
  createEngineerCommit: (id, message, confirmed = false) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/git/commit`, {
      method: 'POST',
      body: JSON.stringify({ message, confirmed })
    }),
  pushEngineerRepo: (id, remote = 'origin', branch = 'main', confirmed = false) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/git/push`, {
      method: 'POST',
      body: JSON.stringify({ remote, branch, confirmed })
    }),
  startEngineerPreview: (id) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/preview/start`, {
      method: 'POST'
    }),
  stopEngineerPreview: (id) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/preview/stop`, {
      method: 'POST'
    }),
  getEngineerPreviewStatus: (id) => request(`/engineer/projects/${encodeURIComponent(id)}/preview/status`),
  planEngineerProject: (id, { prompt, stack, provider = 'demo', model }) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/ai/plan`, {
      method: 'POST',
      body: JSON.stringify({ prompt, stack, provider, model })
    }),
  generateEngineerProject: (id, { provider = 'demo', model }) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/ai/generate`, {
      method: 'POST',
      body: JSON.stringify({ provider, model })
    }),
  repairEngineerProject: (id, { error_details, provider = 'demo', model }) =>
    request(`/engineer/projects/${encodeURIComponent(id)}/ai/repair`, {
      method: 'POST',
      body: JSON.stringify({ error_details, provider, model })
    }),

  // --- AI Model Library & Learning Center ---
  getModelCatalog: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/models/catalog${q ? `?${q}` : ''}`);
  },
  getModelCard: (modelId) => request(`/models/catalog/${encodeURIComponent(modelId)}`),
  getHardwarePresets: () => request('/models/presets'),
  recommendModels: (payload) =>
    request('/models/recommend', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getLocalModels: () => request('/models/local'),
  inspectLocalModel: (modelName) =>
    request('/models/local/inspect', {
      method: 'POST',
      body: JSON.stringify({ model_name: modelName })
    }),
  deleteLocalModel: (modelName, confirmed = false) =>
    request(`/models/local/${encodeURIComponent(modelName)}?confirmed=${Boolean(confirmed)}`, {
      method: 'DELETE'
    }),
  testModel: ({ model_name, prompt, system_prompt, category = 'general' }) =>
    request('/models/test', {
      method: 'POST',
      body: JSON.stringify({ model_name, prompt, system_prompt, category })
    }),
  saveTestRubric: (testId, rubric) =>
    request(`/models/test/${encodeURIComponent(testId)}/rubric`, {
      method: 'POST',
      body: JSON.stringify(rubric)
    }),
  getModelTestRuns: (limit = 20) => request(`/models/test-runs?limit=${limit}`),
  saveModelComparison: (payload) =>
    request('/models/comparisons', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getModelComparisons: () => request('/models/comparisons'),
  getActiveModelConfig: () => request('/models/config'),
  setActiveModelConfig: ({ provider, model, task }) =>
    request('/models/config', {
      method: 'POST',
      body: JSON.stringify({ provider, model, task })
    }),
  searchHuggingFace: (query = 'coder', limit = 8) =>
    request(`/models/huggingface?q=${encodeURIComponent(query)}&limit=${limit}`),

  // --- Course-to-Code Lab ---
  getCourses: () => request('/course-lab/courses'),
  getCourse: (id) => request(`/course-lab/courses/${id}`),
  createCourse: (data) =>
    request('/course-lab/courses', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createModule: (courseId, data) =>
    request(`/course-lab/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createLesson: (courseId, moduleId, data) =>
    request(`/course-lab/courses/${courseId}/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  linkCourseDocument: (lessonId, documentId) =>
    request('/course-lab/lessons/link-document', {
      method: 'POST',
      body: JSON.stringify({ lessonId, documentId })
    }),
  getCourseSnippets: ({ courseId, lessonId } = {}) => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (lessonId) params.append('lessonId', lessonId);
    return request(`/course-lab/snippets?${params.toString()}`);
  },
  addCourseSnippet: (data) =>
    request('/course-lab/snippets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteCourseSnippet: (id) =>
    request(`/course-lab/snippets/${id}`, {
      method: 'DELETE'
    }),
  assistantLearn: (data) =>
    request('/course-lab/assistant/learn', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  assistantExplainCode: (data) =>
    request('/course-lab/assistant/explain-code', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  assistantDebug: (data) =>
    request('/course-lab/assistant/debug', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  assistantPractise: (data) =>
    request('/course-lab/assistant/practise', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  buildNotebook: (data) =>
    request('/course-lab/notebooks/build', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  validateNotebook: (data) =>
    request('/course-lab/notebooks/validate', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  listCourseNotebooks: (courseId = null) => {
    const q = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
    return request(`/course-lab/notebooks${q}`);
  },
  getCourseNotebook: (id) => request(`/course-lab/notebooks/${id}`),
  logCourseProgress: (data) =>
    request('/course-lab/progress', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getCourseProgressSummary: () => request('/course-lab/progress/summary'),
  getNotebookDownloadUrl: (id) => `/api/course-lab/notebooks/${id}/download`
};

export default api;

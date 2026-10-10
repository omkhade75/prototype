import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Play, 
  Sparkles, 
  Terminal, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  RotateCcw, 
  Bug, 
  Cpu, 
  FileText, 
  Layers, 
  Search, 
  Clock, 
  Bookmark, 
  ChevronRight, 
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Wrench,
  Target,
  XCircle,
  Info,
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  Award,
  BarChart2,
  RefreshCw,
  Send,
  FileSearch,
  CheckSquare
} from 'lucide-react';
import { api } from '../services/api';

export function CodingPlayground({ systemStatus }) {
  // State
  const [selectedLanguage, setSelectedLanguage] = useState('cpp'); // 'cpp' | 'python'
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [code, setCode] = useState('');
  const [leftTab, setLeftTab] = useState('problem'); // 'problem' | 'explanation' | 'topics' | 'catalogue' | 'pdf-lesson' | 'dashboard'
  const [tutorMode, setTutorMode] = useState('learn'); // 'learn' | 'build' | 'debug' | 'practice'
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorResponse, setTutorResponse] = useState(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorError, setTutorError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('demo');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [runnerStatus, setRunnerStatus] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showComparisonRules, setShowComparisonRules] = useState(false);
  const [runningExecution, setRunningExecution] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // PDF DSA Tutor & Lesson State
  const [activeLesson, setActiveLesson] = useState(null);
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [lessonError, setLessonError] = useState(null);
  const [pdfScanning, setPdfScanning] = useState(false);
  const [pdfTopicResults, setPdfTopicResults] = useState(null);
  const [followupSection, setFollowupSection] = useState(1);
  const [followupQuery, setFollowupQuery] = useState('');
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followupResponse, setFollowupResponse] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [evaluatingQuiz, setEvaluatingQuiz] = useState(false);

  // Progressive Hints State
  const [showHintsPanel, setShowHintsPanel] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintData, setHintData] = useState(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [solutionViewedForCurrentProblem, setSolutionViewedForCurrentProblem] = useState(false);

  // Learning Progress Dashboard State
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [resettingProgress, setResettingProgress] = useState(false);

  const configuredModel = systemStatus?.ai_service?.configured_model || 'llama3';
  const ollamaReachable = Boolean(systemStatus?.ai_service?.ollama_reachable);

  // Load initial topics, problems, documents, and runner status
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [topicsRes, problemsRes, docsRes, runnerRes] = await Promise.all([
        api.getCodingTopics().catch(() => ({ topics: [] })),
        api.getCodingProblems().catch(() => ({ problems: [] })),
        api.getDocuments().catch(() => ({ data: [] })),
        api.getCodingRunnerStatus().catch(() => ({ docker_available: false }))
      ]);

      const loadedTopics = topicsRes.topics || [];
      const loadedProblems = problemsRes.problems || [];
      setTopics(loadedTopics);
      setProblems(loadedProblems);
      setDocuments(docsRes.data || []);
      setRunnerStatus(runnerRes);

      if (loadedProblems.length > 0) {
        selectProblem(loadedProblems[0], 'cpp');
      }
      loadDashboard();
    } catch (err) {
      console.error('Failed to load coding playground data:', err);
    }
  };

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await api.getLearningDashboard();
      setDashboardData(res);
    } catch (err) {
      console.error('Failed to load learning dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const selectProblem = (problem, lang = selectedLanguage) => {
    setSelectedProblem(problem);
    const starter = problem.starter_code?.[lang] || (lang === 'cpp' ? '// C++ Solution' : '# Python Solution');
    setCode(starter);
    setTestResults(null);
    setTutorResponse(null);
    setTutorError(null);
    setHintData(null);
    setHintLevel(0);
    setShowHintsPanel(false);
    setSolutionViewedForCurrentProblem(false);
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (selectedProblem) {
      const otherLang = lang === 'cpp' ? 'python' : 'cpp';
      const otherStarter = selectedProblem.starter_code?.[otherLang];
      if (!code.trim() || code.trim() === otherStarter?.trim()) {
        setCode(selectedProblem.starter_code?.[lang] || '');
      }
    }
  };

  const handleEditorKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetTemplate = () => {
    if (selectedProblem) {
      setCode(selectedProblem.starter_code?.[selectedLanguage] || '');
      setTestResults(null);
    }
  };

  const handleLoadSolution = () => {
    if (selectedProblem && selectedProblem.solution_code) {
      setCode(selectedProblem.solution_code[selectedLanguage] || '');
      setSolutionViewedForCurrentProblem(true);
    }
  };

  // PDF-Based DSA Tutor Handlers
  const handleScanDocument = async () => {
    if (!selectedDocId) {
      alert('Please select a Knowledge Hub document from the top dropdown first.');
      return;
    }
    setPdfScanning(true);
    setLessonError(null);
    try {
      const res = await api.analyzeDocumentTopics(selectedDocId);
      setPdfTopicResults(res);
      setLeftTab('pdf-lesson');
    } catch (err) {
      setLessonError(err.message || 'Failed to scan document.');
    } finally {
      setPdfScanning(false);
    }
  };

  const handleStartLesson = async (topicId) => {
    setGeneratingLesson(true);
    setLessonError(null);
    setQuizAnswers({});
    setQuizResult(null);
    setFollowupResponse(null);
    try {
      const res = await api.generateLesson({
        topicId,
        language: selectedLanguage,
        documentId: selectedDocId || undefined,
        provider: selectedProvider
      });
      setActiveLesson(res);
      setLeftTab('pdf-lesson');
      loadDashboard();
    } catch (err) {
      setLessonError(err.message || 'Failed to generate lesson.');
    } finally {
      setGeneratingLesson(false);
    }
  };

  const handleAskFollowup = async () => {
    if (!followupQuery.trim() || !activeLesson) return;
    setFollowupLoading(true);
    try {
      const res = await api.answerLessonFollowup({
        topicId: activeLesson.topic_id,
        sectionNumber: Number(followupSection),
        question: followupQuery.trim(),
        documentId: selectedDocId || undefined
      });
      setFollowupResponse(res);
      setFollowupQuery('');
    } catch (err) {
      alert(err.message || 'Failed to answer follow-up question.');
    } finally {
      setFollowupLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeLesson) return;
    setEvaluatingQuiz(true);
    try {
      const answersArray = Object.entries(quizAnswers).map(([qid, optIdx]) => ({
        question_id: Number(qid),
        selected_option_index: Number(optIdx)
      }));
      const res = await api.evaluateQuiz({
        topicId: activeLesson.topic_id,
        answers: answersArray
      });
      setQuizResult(res);
      loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to submit quiz.');
    } finally {
      setEvaluatingQuiz(false);
    }
  };

  const handleSendCodeToPlayground = (snippet, lang) => {
    setSelectedLanguage(lang);
    setCode(snippet);
    setSolutionViewedForCurrentProblem(true);
  };

  // Progressive Hints Handler
  const handleRequestHint = async (level) => {
    if (!selectedProblem) return;
    setLoadingHint(true);
    try {
      const res = await api.getProgressiveHint({
        problemId: selectedProblem.id,
        hintLevel: level,
        language: selectedLanguage,
        topicId: selectedProblem.topic_id
      });
      setHintData(res);
      setHintLevel(level);
      setShowHintsPanel(true);
      loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to fetch hint.');
    } finally {
      setLoadingHint(false);
    }
  };

  // Reset Progress Handler
  const handleResetProgress = async () => {
    if (!window.confirm('Are you sure you want to reset all learning progress and analytics? This will clear all topic study stats and quiz scores.')) {
      return;
    }
    setResettingProgress(true);
    try {
      await api.resetLearningProgress();
      await loadDashboard();
    } catch (err) {
      alert(err.message || 'Failed to reset progress.');
    } finally {
      setResettingProgress(false);
    }
  };

  // Tutor Consultation
  const handleConsultTutor = async (modeToUse = tutorMode, queryOverride = null) => {
    const q = queryOverride !== null ? queryOverride : tutorQuery;
    setTutorLoading(true);
    setTutorError(null);
    try {
      const res = await api.consultCodingTutor({
        mode: modeToUse,
        language: selectedLanguage,
        problemId: selectedProblem?.id,
        topicId: selectedProblem?.topic_id || selectedTopicId,
        studentCode: code,
        userQuery: q?.trim() || undefined,
        documentId: selectedDocId || undefined,
        provider: selectedProvider
      });
      setTutorResponse(res);
      setTutorMode(modeToUse);
    } catch (err) {
      setTutorError(err.message || 'Tutor request failed.');
    } finally {
      setTutorLoading(false);
    }
  };

  // Real Execution: Run Code (Custom Input or first example input)
  const handleRunCode = async () => {
    setRunningExecution(true);
    setTestResults(null);
    try {
      const inputToUse = showCustomInput 
        ? customInput 
        : (selectedProblem?.examples?.[0]?.input || '');
      const res = await api.runCode({
        language: selectedLanguage,
        code,
        problemId: selectedProblem?.id,
        customInput: inputToUse,
        testCases: null
      });
      setTestResults(res);
    } catch (err) {
      setTestResults({
        success: false,
        status: 'system_error',
        error: err.message || 'Execution failed.'
      });
    } finally {
      setRunningExecution(false);
    }
  };

  // Real Execution: Run Test Cases (Full problem test suite)
  const handleRunTestCases = async () => {
    if (!selectedProblem) return;
    setRunningExecution(true);
    setTestResults(null);
    try {
      const res = await api.runCode({
        language: selectedLanguage,
        code,
        problemId: selectedProblem.id,
        testCases: selectedProblem.examples || []
      });
      setTestResults(res);

      if (res.status === 'passed') {
        const isIndependent = !solutionViewedForCurrentProblem && hintLevel < 3;
        await api.recordProblemAttempt({
          topicId: selectedProblem.topic_id,
          topicName: selectedProblem.title,
          problemId: selectedProblem.id,
          solved: true,
          independent: isIndependent,
          usedSolution: !isIndependent,
          hintsCount: hintLevel
        }).catch(() => {});
        loadDashboard();
      } else if (res.status !== 'docker_unavailable') {
        await api.recordProblemAttempt({
          topicId: selectedProblem.topic_id,
          topicName: selectedProblem.title,
          problemId: selectedProblem.id,
          solved: false,
          independent: false,
          usedSolution: solutionViewedForCurrentProblem,
          hintsCount: hintLevel,
          errorDescription: res.status
        }).catch(() => {});
      }
    } catch (err) {
      setTestResults({
        success: false,
        status: 'system_error',
        error: err.message || 'Test suite execution failed.'
      });
    } finally {
      setRunningExecution(false);
    }
  };

  // Helper: Trigger Debug Tutor with error details
  const handleDebugError = (errorMsg) => {
    const prompt = `My code encountered an error during execution:\n\n${errorMsg}\n\nPlease analyze what caused this error and guide me to fix it.`;
    setTutorQuery(prompt);
    handleConsultTutor('debug', prompt);
  };

  // Filtered problems catalogue
  const filteredProblems = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.topic_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const matchesTopic = !selectedTopicId || p.topic_id === selectedTopicId;
    return matchesSearch && matchesDiff && matchesTopic;
  });

  const lines = code.split('\n');

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Top Header Bar */}
      <div 
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-glass-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber-light)'
            }}
          >
            <Code2 size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Coding Playground & DSA Tutor</h2>
              <span className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                Phase 3B Sandbox Engine
              </span>
              <span 
                className={`badge ${runnerStatus?.docker_available ? 'badge-emerald' : 'badge-amber'}`}
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                title={runnerStatus?.docker_available ? 'Docker Container Boundary Active' : 'Docker Offline - Actionable setup required'}
              >
                {runnerStatus?.docker_available ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
                <span>{runnerStatus?.docker_available ? 'Docker Sandbox Active' : 'Docker Offline'}</span>
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Master C++ and Python • Deep DSA Intuiton • LeetCode Interview Preparation
            </p>
          </div>
        </div>

        {/* Header Controls: Language, Provider, Knowledge Hub Doc */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* C++ vs Python Selector */}
          <div 
            style={{ 
              display: 'flex', 
              backgroundColor: 'rgba(15, 23, 42, 0.75)', 
              borderRadius: '8px', 
              padding: '0.2rem', 
              border: '1px solid var(--border-glass)' 
            }}
          >
            <button
              type="button"
              onClick={() => handleLanguageChange('cpp')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedLanguage === 'cpp' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: selectedLanguage === 'cpp' ? '#93c5fd' : 'var(--text-muted)',
                fontWeight: selectedLanguage === 'cpp' ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>C++ (C++17)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('python')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedLanguage === 'python' ? 'rgba(236, 72, 153, 0.25)' : 'transparent',
                color: selectedLanguage === 'python' ? '#f472b6' : 'var(--text-muted)',
                fontWeight: selectedLanguage === 'python' ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>Python (3.11)</span>
            </button>
          </div>

          {/* AI Provider Mode Selector */}
          <div 
            style={{ 
              display: 'flex', 
              backgroundColor: 'rgba(15, 23, 42, 0.75)', 
              borderRadius: '8px', 
              padding: '0.2rem', 
              border: '1px solid var(--border-glass)' 
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedProvider('demo')}
              title="Deterministic Grounded Engine without GPU"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedProvider === 'demo' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                color: selectedProvider === 'demo' ? '#c4b5fd' : 'var(--text-muted)',
                fontWeight: selectedProvider === 'demo' ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Demo Mode
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider('ollama')}
              title="Real local LLM via Ollama"
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedProvider === 'ollama' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                color: selectedProvider === 'ollama' ? '#67e8f9' : 'var(--text-muted)',
                fontWeight: selectedProvider === 'ollama' ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Ollama Mode
            </button>
          </div>

          {/* Knowledge Hub PDF attachment selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bookmark size={14} color="var(--accent-blue-light)" />
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              style={{
                padding: '0.35rem 0.6rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                maxWidth: '180px'
              }}
              title="Attach an uploaded study document from Knowledge Hub for grounded tutoring"
            >
              <option value="">No Document Attached</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  📄 {doc.filename}
                </option>
              ))}
            </select>
            {selectedDocId && (
              <button
                type="button"
                onClick={handleScanDocument}
                disabled={pdfScanning}
                className="btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="Scan document for DSA topics and start grounded lessons"
              >
                <FileSearch size={13} color="var(--accent-cyan-light)" />
                <span>{pdfScanning ? 'Scanning...' : 'Scan PDF'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left Column (Problem & Concepts), Right Column (IDE & Tutor) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(380px, 46%) 1fr', 
          gap: '1rem',
          alignItems: 'stretch',
          flex: 1,
          minHeight: 0
        }}
      >
        
        {/* =========================================================================
            LEFT PANEL: Problem Description, 7-Part Explanation, Catalogue, Topics
           ========================================================================= */}
        <div 
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 0
          }}
        >
          {/* Navigation Tabs */}
          <div 
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-glass)',
              backgroundColor: 'rgba(10, 16, 32, 0.85)',
              overflowX: 'auto',
              gap: '0.2rem',
              padding: '0.4rem 0.6rem'
            }}
          >
            <button
              type="button"
              className={`btn-sm ${leftTab === 'problem' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLeftTab('problem')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <FileText size={13} />
              <span>Problem</span>
            </button>
            <button
              type="button"
              className={`btn-sm ${leftTab === 'explanation' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLeftTab('explanation')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <Lightbulb size={13} />
              <span>Explanation (7 Steps)</span>
            </button>
            <button
              type="button"
              className={`btn-sm ${leftTab === 'topics' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLeftTab('topics')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <Layers size={13} />
              <span>DSA Topics ({topics.length || 15})</span>
            </button>
            <button
              type="button"
              className={`btn-sm ${leftTab === 'catalogue' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLeftTab('catalogue')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            >
              <Target size={13} />
              <span>LeetCode List</span>
            </button>
            <button
              type="button"
              className={`btn-sm ${leftTab === 'pdf-lesson' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLeftTab('pdf-lesson')}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', backgroundColor: leftTab === 'pdf-lesson' ? 'var(--accent-purple)' : undefined }}
            >
              <GraduationCap size={13} />
              <span>PDF Lesson (13 Steps)</span>
            </button>
            <button
              type="button"
              className={`btn-sm ${leftTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setLeftTab('dashboard'); loadDashboard(); }}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', backgroundColor: leftTab === 'dashboard' ? 'var(--accent-cyan)' : undefined }}
            >
              <BarChart2 size={13} />
              <span>Learning Dashboard</span>
            </button>
          </div>

          {/* Left Panel Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
            
            {/* TAB 1: PROBLEM DESCRIPTION */}
            {leftTab === 'problem' && selectedProblem && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        #{selectedProblem.leetcode_num}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                        {selectedProblem.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span 
                        className={`badge ${
                          selectedProblem.difficulty === 'Easy' ? 'badge-success' :
                          selectedProblem.difficulty === 'Medium' ? 'badge-amber' : 'badge-danger'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {selectedProblem.difficulty}
                      </span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                        {selectedProblem.topic_id}
                      </span>
                    </div>
                  </div>

                  {/* Verified Official LeetCode Link */}
                  <a
                    href={selectedProblem.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem', color: 'var(--accent-amber-light)' }}
                    title="Open on official LeetCode website"
                  >
                    <span>LeetCode Official</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Problem Statement */}
                <div 
                  style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.85rem', 
                    lineHeight: 1.65, 
                    whiteSpace: 'pre-wrap',
                    padding: '0.85rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass-subtle)'
                  }}
                >
                  {selectedProblem.description}
                </div>

                {/* Examples */}
                <div>
                  <h4 style={{ fontSize: '0.825rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                    Examples
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {selectedProblem.examples?.map((ex, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '0.75rem', 
                          borderRadius: '8px', 
                          backgroundColor: 'rgba(4, 7, 15, 0.65)', 
                          border: '1px solid var(--border-glass-subtle)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--accent-cyan-light)', marginBottom: '0.2rem' }}>
                          Example {idx + 1}:
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#93c5fd', marginBottom: '0.2rem' }}>
                          <strong>Input:</strong> {ex.input}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a7f3d0', marginBottom: '0.2rem' }}>
                          <strong>Output:</strong> {ex.output}
                        </div>
                        {ex.explanation && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            <strong>Explanation:</strong> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                {selectedProblem.constraints && selectedProblem.constraints.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.825rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                      Constraints
                    </h4>
                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.785rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {selectedProblem.constraints.map((c, i) => (
                        <li key={i}><code>{c}</code></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: STRUCTURED EXPLANATION (ALL 7 SECTIONS) */}
            {leftTab === 'explanation' && selectedProblem?.structured_explanation && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber-light)' }}>
                    7-Step Pedagogical Breakdown: {selectedProblem.title}
                  </h3>
                  <button
                    type="button"
                    onClick={handleLoadSolution}
                    className="btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                  >
                    Load Solution into Editor
                  </button>
                </div>

                {/* 1. Problem Understanding */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-blue-light)', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    1. Problem Understanding
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                    {selectedProblem.structured_explanation.problem_understanding}
                  </p>
                </div>

                {/* 2. Approach & Intuition */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-violet-light)', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    2. Approach & Intuition
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                    {selectedProblem.structured_explanation.approach}
                  </p>
                </div>

                {/* 3. Pseudocode */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-cyan-light)', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    3. Algorithmic Pseudocode
                  </div>
                  <pre style={{ backgroundColor: 'rgba(4, 7, 15, 0.75)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.75rem', color: '#93c5fd', whiteSpace: 'pre-wrap' }}>
                    {selectedProblem.structured_explanation.pseudocode}
                  </pre>
                </div>

                {/* 4. Complete Reference Code */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-emerald-light)', fontSize: '0.825rem' }}>
                      4. Verified Solution Code ({selectedLanguage === 'cpp' ? 'C++17' : 'Python 3.11'})
                    </div>
                  </div>
                  <pre style={{ backgroundColor: 'rgba(4, 7, 15, 0.85)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.74rem', color: '#a7f3d0', overflowX: 'auto' }}>
                    {selectedProblem.solution_code[selectedLanguage]}
                  </pre>
                </div>

                {/* 5. Line-by-Line Explanation */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-magenta-light)', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    5. Line-by-Line Explanation
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.785rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {selectedProblem.structured_explanation.line_by_line[selectedLanguage]?.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* 6. Dry Run Trace Table */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-amber-light)', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    6. Dry Run Walkthrough (State Trace)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {selectedProblem.structured_explanation.dry_run?.map((step, idx) => (
                      <div key={idx} style={{ padding: '0.5rem 0.65rem', backgroundColor: 'rgba(4, 7, 15, 0.65)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {Object.entries(step).map(([k, v]) => (
                          <span key={k}>
                            <strong style={{ color: 'var(--text-dim)' }}>{k}:</strong> <span style={{ color: '#fff' }}>{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Time & Space Complexity */}
                <div className="glass-panel" style={{ padding: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-rose-light)', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    7. Time & Space Complexity
                  </div>
                  <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div><strong>Time Complexity:</strong> {selectedProblem.structured_explanation.complexity.time}</div>
                    <div><strong>Space Complexity:</strong> {selectedProblem.structured_explanation.complexity.space}</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: 10 DSA TOPICS BROWSER */}
            {leftTab === 'topics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                    10 Core DSA Curricular Topics
                  </h3>
                  {selectedTopicId && (
                    <button
                      type="button"
                      onClick={() => setSelectedTopicId(null)}
                      className="btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {topics.map((t) => {
                    const isSelected = selectedTopicId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTopicId(t.id);
                          setLeftTab('catalogue');
                        }}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(15, 23, 42, 0.65)',
                          border: `1px solid ${isSelected ? 'var(--accent-violet)' : 'var(--border-glass)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>{t.name}</span>
                          <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                            View Problems →
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          {t.tagline}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {t.patterns?.map((pat, idx) => (
                            <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                              {pat}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: LEETCODE PRACTICE CATALOGUE */}
            {leftTab === 'catalogue' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search problems by name or topic..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.785rem' }}
                  />
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '8px' }}
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {filteredProblems.map((prob) => {
                    const isCurrent = selectedProblem?.id === prob.id;
                    return (
                      <div
                        key={prob.id}
                        onClick={() => {
                          selectProblem(prob);
                          setLeftTab('problem');
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.18)' : 'rgba(15, 23, 42, 0.65)',
                          border: `1px solid ${isCurrent ? 'var(--accent-blue)' : 'var(--border-glass-subtle)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                            #{prob.leetcode_num}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.825rem' }}>
                              {prob.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              Topic: {prob.topic_id}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span 
                            className={`badge ${
                              prob.difficulty === 'Easy' ? 'badge-success' :
                              prob.difficulty === 'Medium' ? 'badge-amber' : 'badge-danger'
                            }`}
                            style={{ fontSize: '0.68rem' }}
                          >
                            {prob.difficulty}
                          </span>
                          <ChevronRight size={14} color="var(--text-dim)" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: PDF-BASED DSA LESSON (13 STEPS) */}
            {leftTab === 'pdf-lesson' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {generatingLesson && (
                  <div className="card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                    <Clock size={32} className="spin" color="var(--accent-purple)" style={{ margin: '0 auto 1rem' }} />
                    <h4 style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem' }}>Generating 13-Part DSA Masterclass Lesson...</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Extracting authentic citations, page numbers, analogies, dry runs, and executable code implementations.
                    </p>
                  </div>
                )}

                {lessonError && (
                  <div className="alert alert-danger" style={{ fontSize: '0.78rem' }}>
                    <AlertCircle size={15} />
                    <span>{lessonError}</span>
                  </div>
                )}

                {/* Sub-view A: Active Lesson Loaded */}
                {!generatingLesson && activeLesson && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-glass-subtle)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <button 
                            type="button" 
                            onClick={() => setActiveLesson(null)} 
                            className="btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                          >
                            ← Back
                          </button>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                            {activeLesson.topic_name}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                            13-Part Structured Curriculum
                          </span>
                          {activeLesson.has_pdf_evidence ? (
                            <span className="badge badge-cyan" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Bookmark size={10} />
                              <span>Grounded in: {activeLesson.document_name} ({activeLesson.pdf_citations?.length || 0} citations)</span>
                            </span>
                          ) : (
                            <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                              Pedagogical Mastery (Standard Syllabus)
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                          {selectedLanguage === 'cpp' ? 'C++17 Mode' : 'Python 3.11 Mode'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {activeLesson.sections?.map((sec) => (
                        <div 
                          key={sec.section_number}
                          className="card"
                          style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.65)',
                            border: '1px solid var(--border-glass-subtle)',
                            padding: '0.95rem',
                            borderRadius: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                              {sec.title}
                            </h4>
                            <span 
                              className={`badge ${sec.source_type === 'pdf' ? 'badge-cyan' : sec.source_type === 'ai_generated' ? 'badge-amber' : 'badge-purple'}`}
                              style={{ fontSize: '0.65rem' }}
                            >
                              {sec.provenance_badge}
                            </span>
                          </div>

                          {sec.pdf_excerpt && (
                            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(6, 182, 212, 0.08)', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)', marginBottom: '0.65rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <div style={{ fontWeight: 600, color: 'var(--accent-cyan-light)', marginBottom: '0.2rem' }}>
                                📖 Passage from Page {activeLesson.pdf_citations?.[0]?.page_number || 1}:
                              </div>
                              <em>"{sec.pdf_excerpt}"</em>
                            </div>
                          )}

                          {sec.content && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                              {sec.content}
                            </div>
                          )}

                          {(sec.section_number === 6 || sec.section_number === 7) && sec.code && (
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleSendCodeToPlayground(sec.code, sec.language)}
                                className="btn-primary btn-sm"
                                style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                              >
                                <Play size={12} />
                                <span>Send to Playground & Run</span>
                              </button>
                            </div>
                          )}

                          {sec.section_number === 13 && sec.quiz_questions && (
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ fontWeight: 700, color: 'var(--accent-purple-light)', fontSize: '0.85rem' }}>
                                📝 Concept Mastery Check (3 Questions)
                              </div>

                              {sec.quiz_questions.map((q, qIndex) => {
                                const evalInfo = quizResult?.results?.find(r => r.question_id === q.id);

                                return (
                                  <div 
                                    key={q.id}
                                    style={{
                                      padding: '0.75rem',
                                      borderRadius: '8px',
                                      backgroundColor: evalInfo ? (evalInfo.is_correct ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)') : 'rgba(10, 16, 32, 0.65)',
                                      border: `1px solid ${evalInfo ? (evalInfo.is_correct ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)') : 'var(--border-glass-subtle)'}`
                                    }}
                                  >
                                    <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#ffffff', marginBottom: '0.5rem' }}>
                                      Q{qIndex + 1}: {q.question}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                      {q.options.map((opt, optIdx) => {
                                        const isChosen = quizAnswers[q.id] === optIdx;
                                        const isCorrectOpt = evalInfo && evalInfo.correct_option_index === optIdx;

                                        return (
                                          <label
                                            key={optIdx}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '0.45rem',
                                              padding: '0.35rem 0.6rem',
                                              borderRadius: '6px',
                                              cursor: quizResult ? 'default' : 'pointer',
                                              backgroundColor: isCorrectOpt ? 'rgba(16, 185, 129, 0.2)' : isChosen ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                              border: `1px solid ${isCorrectOpt ? 'rgba(16, 185, 129, 0.4)' : isChosen ? 'rgba(59, 130, 246, 0.4)' : 'transparent'}`,
                                              fontSize: '0.75rem',
                                              color: isCorrectOpt ? 'var(--accent-emerald-light)' : 'var(--text-secondary)'
                                            }}
                                          >
                                            <input
                                              type="radio"
                                              name={`quiz-q-${q.id}`}
                                              value={optIdx}
                                              checked={isChosen}
                                              disabled={Boolean(quizResult)}
                                              onChange={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                                            />
                                            <span>{opt}</span>
                                          </label>
                                        );
                                      })}
                                    </div>

                                    {evalInfo && (
                                      <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: evalInfo.is_correct ? 'var(--accent-emerald-light)' : 'var(--accent-rose-light)' }}>
                                        <strong>{evalInfo.is_correct ? '✅ Correct!' : '❌ Incorrect.'}</strong> {evalInfo.explanation}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {!quizResult ? (
                                <button
                                  type="button"
                                  onClick={handleSubmitQuiz}
                                  disabled={evaluatingQuiz || Object.keys(quizAnswers).length < sec.quiz_questions.length}
                                  className="btn-primary"
                                  style={{ alignSelf: 'flex-start', fontSize: '0.78rem', padding: '0.45rem 1rem' }}
                                >
                                  {evaluatingQuiz ? <Clock size={13} className="spin" /> : <span>Submit Quiz & Evaluate Mastery</span>}
                                </button>
                              ) : (
                                <div style={{ padding: '0.85rem', borderRadius: '8px', backgroundColor: quizResult.passed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', border: `1px solid ${quizResult.passed ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}` }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.825rem', color: quizResult.passed ? 'var(--accent-emerald-light)' : 'var(--accent-amber-light)', marginBottom: '0.35rem' }}>
                                    {quizResult.feedback}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    Score: <strong>{quizResult.percentage}%</strong> ({quizResult.correct_count} / {quizResult.total_questions} correct).
                                    {quizResult.passed ? ' Criterion satisfied: Quiz score >= 80%!' : ' Requires >= 80% to earn topic mastery.'}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { setQuizResult(null); setQuizAnswers({}); }}
                                    className="btn-secondary btn-sm"
                                    style={{ marginTop: '0.5rem', fontSize: '0.72rem' }}
                                  >
                                    Retake Quiz
                                  </button>
                                </div>
                              )}

                              {sec.related_problems && sec.related_problems[0] && (
                                <div style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--glass-elevated)', border: '1px solid var(--border-glass-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#ffffff' }}>
                                      Target LeetCode Practice: {sec.related_problems[0].title}
                                    </div>
                                    <a 
                                      href={sec.related_problems[0].official_url}
                                      target="_blank" 
                                      rel="noreferrer"
                                      style={{ fontSize: '0.72rem', color: 'var(--accent-cyan-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    >
                                      <span>Official LeetCode Link</span>
                                      <ExternalLink size={11} />
                                    </a>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matched = problems.find(p => p.id === sec.related_problems[0].id);
                                      if (matched) {
                                        selectProblem(matched);
                                        setLeftTab('problem');
                                      }
                                    }}
                                    className="btn-secondary btn-sm"
                                    style={{ fontSize: '0.72rem' }}
                                  >
                                    Load in Editor
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Follow-up Q&A Drawer */}
                    <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-glass-subtle)', padding: '1rem', borderRadius: '10px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-cyan-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <HelpCircle size={15} />
                        <span>Ask a Follow-Up Question on This Lesson</span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <select
                          value={followupSection}
                          onChange={(e) => setFollowupSection(e.target.value)}
                          style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: 'rgba(10, 16, 32, 0.85)', color: 'var(--text-main)', border: '1px solid var(--border-glass)' }}
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
                            <option key={num} value={num}>Section {num}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Ask a question about this specific section..."
                          value={followupQuery}
                          onChange={(e) => setFollowupQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAskFollowup(); }}
                          style={{ flex: 1, minWidth: '200px', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        />
                        <button
                          type="button"
                          onClick={handleAskFollowup}
                          disabled={followupLoading || !followupQuery.trim()}
                          className="btn-primary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {followupLoading ? <Clock size={12} className="spin" /> : <span>Ask</span>}
                        </button>
                      </div>

                      {followupResponse && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {followupResponse.answer}
                          {followupResponse.citation && (
                            <div style={{ marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(6, 182, 212, 0.2)', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                              📄 Grounded in {followupResponse.citation.document_name} (Page {followupResponse.citation.page_number}): "{followupResponse.citation.snippet}..."
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-view B: Topic Scanner & Launchpad */}
                {!generatingLesson && !activeLesson && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-glass)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-purple-light)' }}>
                        <GraduationCap size={20} />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                          PDF-Based DSA Tutor & Topic Extractor
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                        ORBIT scans your uploaded study PDFs in Knowledge Hub, identifies curriculum topics with authentic page numbers, 
                        and generates comprehensive 13-part structured lessons with analogies, dry-runs, and executable code.
                      </p>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleScanDocument}
                          disabled={pdfScanning || !selectedDocId}
                          className="btn-primary"
                          style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          {pdfScanning ? <Clock size={14} className="spin" /> : <FileSearch size={14} />}
                          <span>{pdfScanning ? 'Scanning Text Chunks...' : 'Scan Selected Document for DSA Topics'}</span>
                        </button>
                        {!selectedDocId && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber-light)' }}>
                            Select a document in the top header bar first
                          </span>
                        )}
                      </div>

                      {pdfTopicResults && (
                        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan-light)' }}>
                              {pdfTopicResults.message}
                            </span>
                            <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
                              {pdfTopicResults.total_chunks_analyzed} Chunks Analyzed
                            </span>
                          </div>

                          {pdfTopicResults.topics_found?.length === 0 ? (
                            <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              No standard DSA curriculum terms were found in this document. You can still launch any curriculum lesson below!
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                              {pdfTopicResults.topics_found?.map((match) => (
                                <div 
                                  key={match.topic_id}
                                  style={{
                                    padding: '0.85rem',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(10, 16, 32, 0.85)',
                                    border: '1px solid var(--border-glass-subtle)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem'
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: '220px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                                      <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>
                                        {match.topic_name}
                                      </span>
                                      <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                                        {match.match_count} matches
                                      </span>
                                      <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                                        Pages: {match.pages_referenced?.join(', ') || '1'}
                                      </span>
                                    </div>
                                    {match.citations?.[0] && (
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                        "{match.citations[0].snippet}"
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleStartLesson(match.topic_id)}
                                    className="btn-primary btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                  >
                                    <span>Start 13-Step Lesson</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', border: '1px solid var(--border-glass)', padding: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
                        Complete 15-Topic DSA Masterclass Syllabus
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                        Study any curriculum topic with structured beginner explanations, step-by-step logic, C++ and Python code, dry runs, and interactive quizzes.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
                        {topics.map((t) => (
                          <div 
                            key={t.id}
                            style={{
                              padding: '0.75rem',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(10, 16, 32, 0.75)',
                              border: '1px solid var(--border-glass-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '0.5rem'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.825rem', marginBottom: '0.2rem' }}>
                                {t.name}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>
                                {t.tagline || t.description?.slice(0, 60) + '...'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStartLesson(t.id)}
                              className="btn-secondary btn-sm"
                              style={{ alignSelf: 'flex-start', fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                            >
                              <span>Open Lesson</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: PERSONALIZED LEARNING DASHBOARD */}
            {leftTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-glass-subtle)' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Award size={20} color="var(--accent-amber-light)" />
                      <span>Personal Learning Dashboard & Analytics</span>
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      Mastery Criterion: &gt;= 1 Independent solve AND &gt;= 80% quiz score per topic.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={loadDashboard}
                      disabled={loadingDashboard}
                      className="btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                      title="Refresh analytics from SQLite"
                    >
                      <RefreshCw size={12} className={loadingDashboard ? 'spin' : ''} />
                      <span>Refresh</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetProgress}
                      disabled={resettingProgress}
                      className="btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', color: 'var(--accent-rose)' }}
                      title="Reset all learning progress"
                    >
                      <span>Reset Progress</span>
                    </button>
                  </div>
                </div>

                {dashboardData?.summary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem' }}>
                    <div className="card" style={{ padding: '0.85rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald-light)' }}>
                        {dashboardData.summary.mastered_topics}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mastered Topics</div>
                    </div>

                    <div className="card" style={{ padding: '0.85rem', backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan-light)' }}>
                        {dashboardData.summary.in_progress_topics + dashboardData.summary.practicing_topics}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>In Progress</div>
                    </div>

                    <div className="card" style={{ padding: '0.85rem', backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-purple-light)' }}>
                        {dashboardData.summary.lessons_completed}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lessons Studied</div>
                    </div>

                    <div className="card" style={{ padding: '0.85rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#93c5fd' }}>
                        {dashboardData.summary.problems_solved_independently}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Independent Solves</div>
                    </div>

                    <div className="card" style={{ padding: '0.85rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-amber-light)' }}>
                        {dashboardData.summary.hints_requested_count}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hints Requested</div>
                    </div>

                    <div className="card" style={{ padding: '0.85rem', backgroundColor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f472b6' }}>
                        {dashboardData.summary.quizzes_passed} / {dashboardData.summary.quizzes_taken}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quizzes Passed</div>
                    </div>
                  </div>
                )}

                {dashboardData?.recommended_next && (
                  <div 
                    style={{
                      padding: '0.95rem',
                      borderRadius: '10px',
                      backgroundColor: dashboardData.recommended_next.type === 'revision' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      border: `1px solid ${dashboardData.recommended_next.type === 'revision' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.65rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: dashboardData.recommended_next.type === 'revision' ? 'var(--accent-amber-light)' : '#93c5fd', marginBottom: '0.2rem' }}>
                        🎯 Next Recommended Activity: {dashboardData.recommended_next.topic_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {dashboardData.recommended_next.reason}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartLesson(dashboardData.recommended_next.topic_id)}
                      className="btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      <span>Open Lesson</span>
                    </button>
                  </div>
                )}

                <div className="card" style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-glass)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.65rem' }}>
                    Curriculum Mastery Matrix
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {topics.map((t) => {
                      const prog = dashboardData?.topics?.find(p => p.topic_id === t.id);
                      const isMastered = prog?.status === 'mastered';
                      const needsRev = prog?.needs_revision === 1;

                      return (
                        <div 
                          key={t.id}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(10, 16, 32, 0.65)',
                            border: '1px solid var(--border-glass-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.4rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span 
                              className={`badge ${
                                isMastered ? 'badge-emerald' : 
                                prog?.status === 'practicing' ? 'badge-cyan' :
                                prog?.status === 'in_progress' ? 'badge-amber' : 'badge-slate'
                              }`}
                              style={{ fontSize: '0.68rem' }}
                            >
                              {isMastered ? 'Mastered 🏆' : prog ? (prog.status === 'in_progress' ? 'In Progress' : 'Practicing') : 'Not Started'}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#ffffff' }}>
                              {t.name}
                            </span>
                            {needsRev && (
                              <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>
                                Revision Needed (Quiz &lt; 80%)
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              Solved: <strong style={{ color: 'var(--text-main)' }}>{prog?.problems_solved_independently || 0}</strong> indep.
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              Quiz: <strong style={{ color: prog?.last_quiz_score >= 80 ? 'var(--accent-emerald-light)' : 'var(--text-main)' }}>
                                {prog?.last_quiz_score !== null && prog?.last_quiz_score !== undefined ? `${prog.last_quiz_score}%` : 'N/A'}
                              </strong>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleStartLesson(t.id)}
                              className="btn-secondary btn-sm"
                              style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                            >
                              Lesson
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 && (
                  <div className="card" style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-glass)' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Recent Learning Activity
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {dashboardData.recent_activity.slice(0, 8).map((log) => (
                        <div 
                          key={log.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.35rem 0.5rem', 
                            fontSize: '0.72rem', 
                            color: 'var(--text-secondary)',
                            borderBottom: '1px solid var(--border-glass-subtle)'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.62rem' }}>{log.activity_type}</span>
                            <span>Topic: <strong>{log.topic_id}</strong></span>
                            {log.problem_id && <span>({log.problem_id})</span>}
                          </div>
                          <span style={{ color: 'var(--text-dim)' }}>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: IDE Code Editor (Top) + Tutor & Test Results (Bottom)
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
          
          {/* Top Half: Code Editor */}
          <div 
            className="card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: 0, 
              overflow: 'hidden',
              minHeight: '340px',
              flex: '1 1 50%'
            }}
          >
            {/* Editor Topbar */}
            <div 
              style={{
                padding: '0.55rem 0.85rem',
                backgroundColor: 'rgba(10, 16, 32, 0.95)',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.785rem', fontWeight: 600, color: '#93c5fd', fontFamily: 'var(--font-mono)' }}>
                  {selectedLanguage === 'cpp' ? 'solution.cpp (C++17)' : 'solution.py (Python 3.11)'}
                </span>
                <span className="badge badge-magenta" style={{ fontSize: '0.65rem' }}>
                  {lines.length} lines
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className={`btn-sm ${showCustomInput ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                  title="Toggle custom stdin input"
                >
                  <Terminal size={12} />
                  <span>Custom Stdin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowComparisonRules(!showComparisonRules)}
                  className={`btn-sm ${showComparisonRules ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                  title="View output comparison & normalization rules"
                >
                  <Info size={12} />
                  <span>Rules</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTemplate}
                  className="btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                  title="Reset to starter skeleton"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                  title="Copy current code"
                >
                  {copied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextShow = !showHintsPanel;
                    setShowHintsPanel(nextShow);
                    if (nextShow && hintLevel === 0) {
                      handleRequestHint(1);
                    }
                  }}
                  className={`btn-sm ${showHintsPanel ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', backgroundColor: showHintsPanel ? 'rgba(234, 179, 8, 0.25)' : undefined, color: showHintsPanel ? '#fde047' : undefined }}
                  title="Progressive hints (Level 1 Intuition -> Level 2 Algorithm -> Level 3 Code scaffold)"
                >
                  <Lightbulb size={12} />
                  <span>Hints ({hintLevel > 0 ? `L${hintLevel}` : 'Off'})</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSolution}
                  className="btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: solutionViewedForCurrentProblem ? 'var(--accent-amber-light)' : undefined }}
                  title="Reveal verified official solution code (marks solve as assisted)"
                >
                  <span>{solutionViewedForCurrentProblem ? 'Solution Viewed' : 'Solution'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={runningExecution}
                  className="btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}
                  title="Execute current code in container sandbox"
                >
                  {runningExecution ? <Clock size={12} className="spin" /> : <Play size={12} />}
                  <span>Run Code</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunTestCases}
                  disabled={runningExecution}
                  className="btn-primary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.75rem', backgroundColor: 'var(--accent-emerald)' }}
                  title="Run test suite against problem cases"
                >
                  {runningExecution ? <Clock size={12} className="spin" /> : <CheckCircle2 size={12} />}
                  <span>Run Tests</span>
                </button>
              </div>
            </div>

            {/* Collapsible Progressive Hints Box */}
            {showHintsPanel && (
              <div style={{ padding: '0.75rem 0.95rem', backgroundColor: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid var(--border-glass)', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <Lightbulb size={14} color="var(--accent-amber-light)" />
                    <strong style={{ color: 'var(--accent-amber-light)' }}>Progressive Pedagogical Hints</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleRequestHint(1)}
                      disabled={loadingHint}
                      className={`btn-sm ${hintLevel === 1 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}
                    >
                      1: Intuition
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestHint(2)}
                      disabled={loadingHint}
                      className={`btn-sm ${hintLevel === 2 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}
                    >
                      2: Algorithm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestHint(3)}
                      disabled={loadingHint}
                      className={`btn-sm ${hintLevel === 3 ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}
                    >
                      3: Code Scaffold
                    </button>
                  </div>
                </div>

                {loadingHint ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0.5rem 0' }}>
                    <Clock size={13} className="spin" />
                    <span>Loading progressive hint...</span>
                  </div>
                ) : hintData ? (
                  <div style={{ padding: '0.65rem', borderRadius: '6px', backgroundColor: 'var(--glass-elevated)', border: '1px solid var(--border-glass-subtle)', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>
                      {hintData.title}
                    </div>
                    {hintData.hint_text}
                    {hintLevel === 3 && selectedProblem && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCode(selectedProblem.starter_code?.[selectedLanguage] || '');
                            setSolutionViewedForCurrentProblem(true);
                          }}
                          className="btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                        >
                          Load Scaffold Template into Editor
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                    Click Level 1 to get a conceptual intuition without spoiling any code.
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Custom Input Box */}
            {showCustomInput && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--glass-elevated)', borderBottom: '1px solid var(--border-glass-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Standard Input (stdin) for Run Code:
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    Passed directly to program stdin
                  </span>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter inputs here (e.g. 2 7 11 15\n9 or nums = [2, 7, 11, 15], target = 9)..."
                  rows={2}
                  style={{ width: '100%', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            )}

            {/* Collapsible Comparison Rules Box */}
            {showComparisonRules && (
              <div style={{ padding: '0.75rem 0.95rem', backgroundColor: 'var(--glass-elevated)', borderBottom: '1px solid var(--border-glass-subtle)', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-blue-light)', marginBottom: '0.25rem' }}>
                  Truthful Output Comparison & Normalization Rules:
                </div>
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'var(--text-muted)' }}>
                  <li><strong>Line Endings:</strong> Normalized from CRLF (\r\n) to LF (\n).</li>
                  <li><strong>Trailing Whitespace:</strong> Trimmed from each line before comparing.</li>
                  <li><strong>Blank Lines:</strong> Leading and trailing blank lines are removed.</li>
                  <li><strong>Structural Data:</strong> JSON arrays (e.g. <code>[0, 1]</code> vs <code>[0,1]</code>) and booleans are parsed and verified by semantic structure.</li>
                  <li><strong>Floating Point:</strong> Compared within an absolute tolerance of <code>1e-5</code>.</li>
                </ul>
              </div>
            )}

            {/* Editor Textarea with Gutter */}
            <div style={{ display: 'flex', flex: 1, backgroundColor: 'rgba(4, 7, 15, 0.85)', minHeight: 0, position: 'relative' }}>
              {/* Line Numbers Gutter */}
              <div 
                style={{
                  width: '42px',
                  padding: '0.75rem 0.4rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--text-dim)',
                  textAlign: 'right',
                  userSelect: 'none',
                  borderRight: '1px solid var(--border-glass-subtle)',
                  lineHeight: '1.5rem',
                  overflowY: 'hidden'
                }}
              >
                {lines.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Editable Code Box */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                spellCheck="false"
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: '#e2e8f0',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.825rem',
                  lineHeight: '1.5rem',
                  padding: '0.75rem',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  whiteSpace: 'pre',
                  overflowY: 'auto'
                }}
              />
            </div>
          </div>

          {/* Bottom Half: Tutor & Test Execution Console */}
          <div 
            className="card"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              padding: 0, 
              overflow: 'hidden',
              flex: '1 1 50%',
              minHeight: '280px'
            }}
          >
            {/* Tutor Controls Header */}
            <div 
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'rgba(10, 16, 32, 0.95)',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              {/* 4 Tutor Modes */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleConsultTutor('learn')}
                  disabled={tutorLoading}
                  className={`btn-sm ${tutorMode === 'learn' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                >
                  <Lightbulb size={12} />
                  <span>Learn</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConsultTutor('build')}
                  disabled={tutorLoading}
                  className={`btn-sm ${tutorMode === 'build' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                >
                  <Wrench size={12} />
                  <span>Build With Me</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConsultTutor('debug')}
                  disabled={tutorLoading}
                  className={`btn-sm ${tutorMode === 'debug' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                >
                  <Bug size={12} />
                  <span>Debug</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConsultTutor('practice')}
                  disabled={tutorLoading}
                  className={`btn-sm ${tutorMode === 'practice' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                >
                  <Target size={12} />
                  <span>Practice</span>
                </button>
              </div>

              {/* Status Indicator */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>Engine: </span>
                <strong style={{ color: selectedProvider === 'ollama' ? 'var(--accent-cyan-light)' : 'var(--accent-magenta-light)' }}>
                  {selectedProvider === 'ollama' ? configuredModel : 'Demo Tutor'}
                </strong>
              </div>
            </div>

            {/* Custom Question Form */}
            <div style={{ display: 'flex', gap: '0.4rem', padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--border-glass-subtle)' }}>
              <input
                type="text"
                placeholder={`Ask tutor in ${tutorMode} mode (or press a mode button above)...`}
                value={tutorQuery}
                onChange={(e) => setTutorQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConsultTutor(); }}
                disabled={tutorLoading}
                style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.785rem' }}
              />
              <button
                type="button"
                onClick={() => handleConsultTutor()}
                disabled={tutorLoading}
                className="btn-primary btn-sm"
                style={{ padding: '0.4rem 0.85rem' }}
              >
                {tutorLoading ? <Clock size={13} className="spin" /> : <span>Ask</span>}
              </button>
            </div>

            {/* Console Output Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem', fontSize: '0.825rem', lineHeight: 1.6 }}>
              {/* Ollama Unreachable warning banner */}
              {selectedProvider === 'ollama' && !ollamaReachable && (
                <div className="alert alert-warning" style={{ fontSize: '0.75rem', marginBottom: '0.65rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Local Ollama is offline (http://localhost:11434).</strong> Start with <code>ollama serve</code> or switch to <strong>Demo Mode</strong> for instant grounded guidance.
                  </div>
                </div>
              )}

              {/* Tutor Error */}
              {tutorError && (
                <div className="alert alert-danger" style={{ fontSize: '0.78rem', marginBottom: '0.65rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{tutorError}</span>
                </div>
              )}

              {/* Real Execution & Sandbox Results Display */}
              {testResults && (
                <div 
                  style={{
                    padding: '0.85rem',
                    borderRadius: '10px',
                    backgroundColor: testResults.status === 'docker_unavailable' 
                      ? 'rgba(239, 68, 68, 0.08)' 
                      : (testResults.status === 'compile_error' || testResults.status === 'wrong_answer' || testResults.status === 'runtime_error'
                        ? 'rgba(245, 158, 11, 0.08)' 
                        : 'rgba(16, 185, 129, 0.08)'),
                    border: `1px solid ${
                      testResults.status === 'docker_unavailable' 
                        ? 'rgba(239, 68, 68, 0.35)' 
                        : (testResults.status === 'compile_error' || testResults.status === 'wrong_answer' || testResults.status === 'runtime_error'
                          ? 'rgba(245, 158, 11, 0.35)' 
                          : 'rgba(16, 185, 129, 0.35)')
                    }`,
                    marginBottom: '0.85rem'
                  }}
                >
                  {/* Case 1: Docker Unavailable (Fail-Safe Security Notice) */}
                  {testResults.status === 'docker_unavailable' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose-light)', fontWeight: 700 }}>
                        <ShieldAlert size={18} />
                        <span>Docker Sandbox Offline — Secure Container Boundary Required</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        ORBIT AI enforces strict Docker container isolation (<code>--network none</code>, <code>256MB RAM</code>, dropped Linux capabilities). 
                        <strong> For security, untrusted student code is never executed directly on the host machine.</strong>
                      </p>
                      <div style={{ padding: '0.65rem', borderRadius: '6px', backgroundColor: 'var(--glass-elevated)', fontSize: '0.74rem', border: '1px solid var(--border-glass-subtle)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-amber-light)', marginBottom: '0.25rem' }}>
                          Actionable Setup Instructions:
                        </div>
                        <pre style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
{testResults.actionable_setup || 
`1. Install Docker Desktop for Windows: https://www.docker.com/products/docker-desktop/
2. Ensure the Docker engine is running (WSL 2 backend enabled).
3. Pre-pull images for offline use:
   docker pull gcc:13-bookworm
   docker pull python:3.11-slim`}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Case 2: Compilation Error */}
                  {testResults.status === 'compile_error' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose-light)', fontWeight: 700 }}>
                          <XCircle size={16} />
                          <span>C++ Compilation Failed (Compiler Exit Code Non-Zero)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDebugError(testResults.compiler_output || 'Compilation failed.')}
                          className="btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem', display: 'flex', gap: '0.3rem' }}
                        >
                          <Bug size={12} color="var(--accent-magenta)" />
                          <span>Debug Compiler Error with AI</span>
                        </button>
                      </div>
                      <pre style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.75rem', color: '#f87171', whiteSpace: 'pre-wrap', maxHeight: '160px', overflowY: 'auto' }}>
                        {testResults.compiler_output}
                      </pre>
                    </div>
                  )}

                  {/* Case 3: Test Cases Executed */}
                  {testResults.results && testResults.results.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', color: testResults.status === 'passed' ? 'var(--accent-emerald-light)' : 'var(--accent-amber-light)' }}>
                          {testResults.status === 'passed' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                          <span>
                            Execution Results: {testResults.passed_count} of {testResults.total_count} Test Cases Passed
                          </span>
                        </div>
                        {testResults.passed_count < testResults.total_count && (
                          <button
                            type="button"
                            onClick={() => {
                              const failing = testResults.results.find(r => !r.passed);
                              const details = failing 
                                ? `Test Case ${failing.test_case_id} failed.\nInput: ${failing.input}\nExpected: ${failing.expected}\nActual: ${failing.actual}\nError: ${failing.error || 'Output mismatch'}`
                                : 'One or more test cases failed.';
                              handleDebugError(details);
                            }}
                            className="btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                          >
                            <Bug size={12} color="var(--accent-magenta)" />
                            <span>Debug Failing Case with AI</span>
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {testResults.results.map((c) => (
                          <div 
                            key={c.test_case_id} 
                            style={{ 
                              padding: '0.5rem 0.75rem', 
                              borderRadius: '6px', 
                              backgroundColor: 'var(--glass-elevated)', 
                              border: `1px solid ${c.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              fontSize: '0.75rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.25rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                Case #{c.test_case_id}
                              </span>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  {c.execution_time_ms} ms
                                </span>
                                <span className={`badge ${c.passed ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '0.65rem' }}>
                                  {c.status}
                                </span>
                              </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem', marginTop: '0.2rem' }}>
                              <div>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>Input: </span>
                                <code>{c.input || '(empty)'}</code>
                              </div>
                              {c.expected && (
                                <div>
                                  <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>Expected: </span>
                                  <code>{c.expected}</code>
                                </div>
                              )}
                              <div>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>Actual: </span>
                                <code style={{ color: c.passed ? 'var(--accent-emerald-light)' : 'var(--accent-rose-light)' }}>
                                  {c.actual || '(no stdout)'}
                                </code>
                              </div>
                            </div>

                            {c.error && (
                              <div style={{ marginTop: '0.25rem', padding: '0.35rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', fontSize: '0.72rem' }}>
                                <strong>Stderr / Error:</strong> {c.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Case 4: General System Error */}
                  {testResults.status === 'system_error' && (
                    <div style={{ color: 'var(--accent-rose)', fontSize: '0.78rem' }}>
                      <strong>Execution Error:</strong> {testResults.error}
                    </div>
                  )}
                </div>
              )}

              {/* Tutor Content */}
              {tutorResponse ? (
                <div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {tutorResponse.content}
                  </div>
                  {tutorResponse.citations && tutorResponse.citations.length > 0 && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-glass-subtle)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <Bookmark size={13} color="var(--accent-blue-light)" />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Grounded in Knowledge Hub Document #{tutorResponse.citations[0].document_id} (Page {tutorResponse.citations[0].page_number})
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <Lightbulb size={32} className="empty-state-icon" />
                  <div className="empty-state-title">DSA Tutor Console</div>
                  <div className="empty-state-desc">
                    Click <strong>Learn</strong>, <strong>Build With Me</strong>, <strong>Debug</strong>, or <strong>Practice</strong> above to begin interactive instruction in {selectedLanguage === 'cpp' ? 'C++' : 'Python'}.
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default CodingPlayground;

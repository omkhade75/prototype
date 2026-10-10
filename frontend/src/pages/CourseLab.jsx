import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  GraduationCap,
  BookOpen,
  FileCode2,
  Code2,
  Bug,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  FileText,
  Search,
  Check,
  FolderOpen
} from 'lucide-react';

export default function CourseLab({ systemStatus }) {
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'assistant' | 'notebook' | 'progress'
  
  // Data states
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [progressSummary, setProgressSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Materials & Upload states
  const [uploadWarning, setUploadWarning] = useState(null);
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // Assistant states
  const [assistantMode, setAssistantMode] = useState('learn'); // 'learn' | 'explain' | 'debug' | 'practise'
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [learnResult, setLearnResult] = useState(null);
  const [codeToExplain, setCodeToExplain] = useState('');
  const [explainResult, setExplainResult] = useState(null);
  const [debugCode, setDebugCode] = useState('');
  const [debugError, setDebugError] = useState('');
  const [debugResult, setDebugResult] = useState(null);
  const [practiseResult, setPractiseResult] = useState(null);
  const [revealedHints, setRevealedHints] = useState({});
  const [showSolution, setShowSolution] = useState(false);

  // Notebook Builder states
  const [notebookTitle, setNotebookTitle] = useState('Algorithmic Design Lab Notebook');
  const [notebookGoal, setNotebookGoal] = useState('Implement and verify core course algorithms with assertions');
  const [notebookCells, setNotebookCells] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [savedNotebookId, setSavedNotebookId] = useState(null);
  const [selectedNotebookView, setSelectedNotebookView] = useState(null);

  // Load Initial Data
  useEffect(() => {
    loadCourses();
    loadKnowledgeDocs();
    loadNotebooks();
    loadProgress();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.getCourses();
      if (res.data && res.data.length > 0) {
        setCourses(res.data);
        if (!selectedCourse) {
          loadCourseDetails(res.data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load courses:', e);
    }
  };

  const loadCourseDetails = async (courseId) => {
    try {
      setLoading(true);
      const res = await api.getCourse(courseId);
      if (res.data) {
        setSelectedCourse(res.data);
        if (res.data.modules && res.data.modules.length > 0) {
          const firstMod = res.data.modules[0];
          if (firstMod.lessons && firstMod.lessons.length > 0) {
            setSelectedLesson(firstMod.lessons[0]);
          }
        }
        if (res.data.snippets) {
          setSnippets(res.data.snippets);
        }
      }
    } catch (e) {
      console.error('Failed to load course details:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadKnowledgeDocs = async () => {
    try {
      const res = await api.getDocuments();
      if (res.data) setKnowledgeDocs(res.data);
    } catch (e) {
      console.warn('Knowledge docs error:', e);
    }
  };

  const loadNotebooks = async () => {
    try {
      const res = await api.listCourseNotebooks();
      if (res.data) setNotebooks(res.data);
    } catch (e) {
      console.warn('Notebooks load error:', e);
    }
  };

  const loadProgress = async () => {
    try {
      const res = await api.getCourseProgressSummary();
      if (res.data) setProgressSummary(res.data);
    } catch (e) {
      console.warn('Progress summary error:', e);
    }
  };

  // Create New Course
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseTitle.trim()) return;
    try {
      setLoading(true);
      const res = await api.createCourse({
        title: newCourseTitle,
        code: newCourseCode,
        description: newCourseDesc
      });
      setShowNewCourseModal(false);
      setNewCourseTitle('');
      setNewCourseCode('');
      setNewCourseDesc('');
      await loadCourses();
      if (res.data) {
        loadCourseDetails(res.data.id);
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Link Knowledge Hub Document to Current Lesson
  const handleLinkDoc = async (docId) => {
    if (!selectedLesson || !docId) return;
    try {
      setLoading(true);
      const res = await api.linkCourseDocument(selectedLesson.id, docId);
      if (res.data) {
        setSelectedLesson(res.data);
        setStatusMsg({ type: 'success', text: `Linked Knowledge Hub document to '${selectedLesson.title}'` });
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Add Snippet to Notebook Builder
  const handleAddSnippetToNotebook = (snip) => {
    const newCells = [
      ...notebookCells,
      {
        cell_type: 'code',
        title: snip.title,
        source: snip.code,
        code: snip.code,
        explanation: snip.explanation,
        source_section: snip.source_section,
        snippet_id: snip.id
      }
    ];
    setNotebookCells(newCells);
    setActiveTab('notebook');
    setStatusMsg({ type: 'success', text: `Added snippet '${snip.title}' to Notebook Builder!` });
  };

  // Send Snippet to Coding Playground
  const handleSendToPlayground = (snip) => {
    localStorage.setItem('orbit_playground_code', snip.code);
    localStorage.setItem('orbit_playground_lang', snip.language || 'python');
    setStatusMsg({ type: 'success', text: 'Snippet copied! Switch to Coding Playground to run it.' });
  };

  // Assistant: Learn
  const handleRunLearn = async () => {
    if (!selectedLesson) return;
    try {
      setAssistantLoading(true);
      const res = await api.assistantLearn({
        lesson_title: selectedLesson.title,
        lesson_content: selectedLesson.content || selectedLesson.title,
        source_filename: selectedLesson.source_filename,
        source_pages: selectedLesson.source_pages,
        lessonId: selectedLesson.id
      });
      setLearnResult(res.data);
      loadProgress();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setAssistantLoading(false);
    }
  };

  // Assistant: Explain Code
  const handleRunExplainCode = async () => {
    if (!codeToExplain.trim()) return;
    try {
      setAssistantLoading(true);
      const res = await api.assistantExplainCode({
        code: codeToExplain,
        language: 'python',
        context_title: selectedLesson ? selectedLesson.title : 'Code Block'
      });
      setExplainResult(res.data);
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setAssistantLoading(false);
    }
  };

  // Assistant: Debug
  const handleRunDebug = async () => {
    if (!debugCode.trim()) return;
    try {
      setAssistantLoading(true);
      const res = await api.assistantDebug({
        code: debugCode,
        language: 'python',
        error_output: debugError
      });
      setDebugResult(res.data);
      loadProgress();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setAssistantLoading(false);
    }
  };

  // Assistant: Practise
  const handleRunPractise = async () => {
    if (!selectedLesson) return;
    try {
      setAssistantLoading(true);
      const res = await api.assistantPractise({
        lesson_title: selectedLesson.title,
        lesson_content: selectedLesson.content || selectedLesson.title,
        difficulty: 'medium'
      });
      setPractiseResult(res.data);
      setRevealedHints({});
      setShowSolution(false);
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleRevealHint = (level) => {
    setRevealedHints(prev => ({ ...prev, [level]: true }));
    api.logCourseProgress({
      itemType: 'exercise',
      itemId: practiseResult?.exercise_id || 'ex',
      action: 'viewed_hint',
      details: { level }
    });
  };

  const handleRevealSolution = () => {
    setShowSolution(true);
    api.logCourseProgress({
      itemType: 'exercise',
      itemId: practiseResult?.exercise_id || 'ex',
      action: 'revealed_solution',
      details: { exercise_id: practiseResult?.exercise_id }
    });
    loadProgress();
  };

  const handleMarkSolvedIndependently = () => {
    api.logCourseProgress({
      itemType: 'exercise',
      itemId: practiseResult?.exercise_id || 'ex',
      action: 'solved_independently',
      details: { exercise_id: practiseResult?.exercise_id }
    });
    setStatusMsg({ type: 'success', text: 'Great job! Marked as solved independently.' });
    loadProgress();
  };

  // Notebook Builder: Reorder / Add cells
  const moveCell = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= notebookCells.length) return;
    const updated = [...notebookCells];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setNotebookCells(updated);
  };

  const deleteCell = (index) => {
    setNotebookCells(notebookCells.filter((_, idx) => idx !== index));
  };

  const addEmptyCell = (type = 'code') => {
    setNotebookCells([
      ...notebookCells,
      {
        cell_type: type,
        title: type === 'code' ? 'Custom Implementation Cell' : 'Notes & Explanation',
        code: type === 'code' ? '# Write python code here\n' : '',
        source: type === 'code' ? '# Write python code here\n' : '# Explanation notes\n',
        explanation: 'User defined cell'
      }
    ]);
  };

  // Notebook: Validate
  const handleValidateNotebook = async () => {
    if (!notebookCells.length) {
      setStatusMsg({ type: 'error', text: 'Add at least one cell before validating.' });
      return;
    }
    try {
      setLoading(true);
      // Generate temporary notebook object to validate
      const buildRes = await api.buildNotebook({
        title: notebookTitle,
        goal: notebookGoal,
        cells: notebookCells,
        courseId: selectedCourse?.id
      });
      setValidationResult(buildRes.data?.validation || null);
      setSavedNotebookId(buildRes.data?.notebook_id || null);
      setStatusMsg({ type: 'success', text: 'Notebook validated successfully!' });
      loadNotebooks();
      loadProgress();
    } catch (e) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-lab-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Navigation Bar */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.1))',
            border: '1px solid var(--accent-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-teal)'
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                Course-to-Code Lab
              </h1>
              <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>Interactive Learning</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Turn course materials, PDFs & code into understandable lessons and executable Jupyter notebooks.
            </p>
          </div>
        </div>

        {/* Course Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={selectedCourse?.id || ''}
            onChange={(e) => loadCourseDetails(e.target.value)}
            style={{
              background: 'var(--bg-glass)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.85rem'
            }}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code ? `[${c.code}] ` : ''}{c.title}</option>
            ))}
          </select>

          <button
            onClick={() => setShowNewCourseModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
          >
            <Plus size={14} /> New Course
          </button>
        </div>
      </div>

      {/* Status / Alert Notification */}
      {statusMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${statusMsg.type === 'error' ? 'var(--accent-red)' : 'var(--accent-emerald)'}`,
          color: statusMsg.type === 'error' ? 'var(--accent-red)' : 'var(--accent-emerald)',
          fontSize: '0.85rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Tab Switcher Pills */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
        {[
          { id: 'materials', label: '1. Course Materials & Syllabus', icon: BookOpen },
          { id: 'assistant', label: '2. Course Learning Assistant', icon: Sparkles },
          { id: 'notebook', label: '3. Course-to-Notebook Builder', icon: FileCode2 },
          { id: 'progress', label: '4. Lab Analytics & Progress', icon: CheckCircle2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: isActive ? '1px solid var(--accent-teal)' : '1px solid transparent',
                background: isActive ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '400',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Course Materials & Syllabus */}
      {activeTab === 'materials' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '20px' }}>
          {/* Left Column: Modules & Lessons Tree */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border-glass)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
              Course Modules
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
              {selectedCourse?.modules?.map(mod => (
                <div key={mod.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--accent-teal)', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    {mod.title}
                  </div>
                  {mod.lessons?.map(les => {
                    const isSelected = selectedLesson?.id === les.id;
                    return (
                      <button
                        key={les.id}
                        onClick={() => setSelectedLesson(les)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          marginLeft: '10px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid var(--accent-teal)' : '1px solid var(--border-glass)',
                          background: isSelected ? 'rgba(20, 184, 166, 0.15)' : 'var(--bg-glass)',
                          color: isSelected ? 'var(--accent-teal)' : 'var(--text-main)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {les.title}
                        </span>
                        <span className={`badge ${les.status === 'completed' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                          {les.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column: Selected Lesson Viewer & Assignment */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border-glass)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {selectedLesson ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                      {selectedLesson.title}
                    </h2>
                    {selectedLesson.source_filename && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--accent-teal)', marginTop: '4px' }}>
                        <FileText size={13} />
                        Source: {selectedLesson.source_filename}
                        {selectedLesson.source_pages?.length > 0 && ` (Pages: ${selectedLesson.source_pages.join(', ')})`}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setActiveTab('assistant');
                        setAssistantMode('learn');
                        handleRunLearn();
                      }}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      <Sparkles size={13} /> Explain in Simple English
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('assistant');
                        setAssistantMode('practise');
                        handleRunPractise();
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      <Lightbulb size={13} /> Practice Exercise
                    </button>
                  </div>
                </div>

                {/* Lesson Notes Content */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Lesson Concepts & Content
                  </h4>
                  <div style={{
                    background: 'var(--bg-glass)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    padding: '14px',
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    color: 'var(--text-main)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}>
                    {selectedLesson.content || 'No content written for this lesson yet.'}
                  </div>
                </div>

                {/* Assignment & Coding Instructions */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Assignment / LeetCode Instructions
                  </h4>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    padding: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-main)',
                    lineHeight: '1.5'
                  }}>
                    {selectedLesson.assignment_instructions || 'No special assignment instructions attached.'}
                  </div>
                </div>

                {/* Link to Knowledge Hub Document */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} color="var(--accent-blue)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Link previously ingested Knowledge Hub document:
                    </span>
                  </div>
                  <select
                    onChange={(e) => handleLinkDoc(Number(e.target.value))}
                    defaultValue=""
                    style={{
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.75rem'
                    }}
                  >
                    <option value="" disabled>Select Knowledge Hub Document...</option>
                    {knowledgeDocs.map(d => (
                      <option key={d.id} value={d.id}>{d.filename} ({d.file_type.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                Select a lesson from the left module list to view notes and assignment instructions.
              </div>
            )}
          </div>

          {/* Right Column: Code Snippets Drawer / Scratchpad */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '14px',
            border: '1px solid var(--border-glass)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                Code Snippets ({snippets.length})
              </h3>
              <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>Scratchpad</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto' }}>
              {snippets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No snippets saved yet. Extracted code from documents or user snippets appear here.
                </div>
              ) : (
                snippets.map(s => (
                  <div key={s.id} style={{
                    background: 'var(--bg-glass)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        {s.title}
                      </span>
                      <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                        {s.language}
                      </span>
                    </div>

                    <pre style={{
                      margin: 0,
                      padding: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '6px',
                      fontSize: '0.725rem',
                      fontFamily: 'monospace',
                      maxHeight: '100px',
                      overflow: 'hidden',
                      color: 'var(--accent-teal)'
                    }}>
                      {s.code}
                    </pre>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                      <button
                        onClick={() => handleAddSnippetToNotebook(s)}
                        className="btn-primary"
                        style={{ flex: 1, fontSize: '0.7rem', padding: '4px 8px' }}
                      >
                        <Plus size={11} /> Add to Notebook
                      </button>
                      <button
                        onClick={() => handleSendToPlayground(s)}
                        className="btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        title="Send to Coding Playground"
                      >
                        <Play size={11} />
                      </button>
                      <button
                        onClick={() => {
                          setCodeToExplain(s.code);
                          setActiveTab('assistant');
                          setAssistantMode('explain');
                          handleRunExplainCode();
                        }}
                        className="btn-secondary"
                        style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        title="Explain Code"
                      >
                        <Sparkles size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Course Learning Assistant */}
      {activeTab === 'assistant' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'learn', label: 'Learn (Simple English)', icon: BookOpen },
              { id: 'explain', label: 'Explain Code (Line-by-Line & Dry Run)', icon: FileCode2 },
              { id: 'debug', label: 'Debug (Error Analysis & Sandbox)', icon: Bug },
              { id: 'practise', label: 'Practise (Progressive Hints)', icon: Lightbulb }
            ].map(m => {
              const Icon = m.icon;
              const isSelected = assistantMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setAssistantMode(m.id)}
                  className={isSelected ? 'btn-primary' : 'btn-secondary'}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
                >
                  <Icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>

          {/* Sub-mode: Learn */}
          {assistantMode === 'learn' && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-glass)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                  Structured Explanation: {selectedLesson?.title || 'Lesson Overview'}
                </h3>
                <button
                  onClick={handleRunLearn}
                  disabled={assistantLoading}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  {assistantLoading ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
                  Refresh Explanation
                </button>
              </div>

              {learnResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Source Grounding Tag */}
                  {learnResult.source_tag && (
                    <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid var(--accent-teal)', fontSize: '0.75rem', color: 'var(--accent-teal)' }}>
                      <strong>Citation:</strong> {learnResult.source_tag}
                    </div>
                  )}

                  {/* Fundamentals */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', marginBottom: '6px' }}>Core Fundamentals</h4>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', margin: 0 }}>
                      {learnResult.fundamentals}
                    </p>
                  </div>

                  {/* Terminology Cards */}
                  {learnResult.terminology?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', marginBottom: '8px' }}>Key Terminology</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                        {learnResult.terminology.map((t, idx) => (
                          <div key={idx} style={{ background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)', padding: '12px' }}>
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.8rem' }}>{t.term}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{t.definition}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Illustrative Examples */}
                  {learnResult.examples?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', marginBottom: '6px' }}>Illustrative Examples</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                        {learnResult.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Recap */}
                  {learnResult.recap?.length > 0 && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', margin: '0 0 6px 0' }}>Lesson Recap</h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {learnResult.recap.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sub-mode: Explain Code */}
          {assistantMode === 'explain' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>Code Snippet to Decompose</h4>
                <textarea
                  value={codeToExplain}
                  onChange={(e) => setCodeToExplain(e.target.value)}
                  placeholder="Paste or select C++, Python, or JavaScript code..."
                  rows={14}
                  style={{
                    background: 'var(--bg-glass)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}
                />
                <button
                  onClick={handleRunExplainCode}
                  disabled={assistantLoading || !codeToExplain.trim()}
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}
                >
                  {assistantLoading ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
                  Explain Code In-Depth
                </button>
              </div>

              {explainResult && (
                <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '600px', overflowY: 'auto' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', margin: '0 0 4px 0' }}>Purpose & Expected Behavior</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0 }}>{explainResult.purpose}</p>
                  </div>

                  {/* Complexity */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="badge badge-teal" style={{ fontSize: '0.75rem' }}>Time: {explainResult.complexity?.time}</div>
                    <div className="badge badge-indigo" style={{ fontSize: '0.75rem' }}>Space: {explainResult.complexity?.space}</div>
                  </div>

                  {/* Dry Run Table */}
                  {explainResult.dry_run_table?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', margin: '0 0 6px 0' }}>Dry Run Execution Table</h4>
                      <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                            <th style={{ padding: '6px' }}>Step</th>
                            <th style={{ padding: '6px' }}>Line</th>
                            <th style={{ padding: '6px' }}>Variables</th>
                            <th style={{ padding: '6px' }}>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {explainResult.dry_run_table.map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                              <td style={{ padding: '6px' }}>{row.step}</td>
                              <td style={{ padding: '6px' }}>{row.line}</td>
                              <td style={{ padding: '6px', fontFamily: 'monospace' }}>{JSON.stringify(row.variables)}</td>
                              <td style={{ padding: '6px', color: 'var(--text-muted)' }}>{row.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Line by line breakdown */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', margin: '0 0 6px 0' }}>Line-by-Line Breakdown</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {explainResult.line_by_line?.map((l, idx) => (
                        <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', gap: '8px', padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                          <span style={{ color: 'var(--text-muted)', width: '24px' }}>L{l.line_number}:</span>
                          <span style={{ fontFamily: 'monospace', color: 'var(--accent-teal)', width: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.code}</span>
                          <span style={{ color: 'var(--text-main)', flex: 1 }}>{l.explanation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-mode: Debug */}
          {assistantMode === 'debug' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>Erroneous Code</h4>
                <textarea
                  value={debugCode}
                  onChange={(e) => setDebugCode(e.target.value)}
                  placeholder="Paste Python or C++ code with bug..."
                  rows={8}
                  style={{ background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', margin: '4px 0 0 0' }}>Compiler / Runtime Error Output</h4>
                <textarea
                  value={debugError}
                  onChange={(e) => setDebugError(e.target.value)}
                  placeholder="Paste error trace (e.g. IndexError, SyntaxError, Segmentation fault)..."
                  rows={4}
                  style={{ background: 'var(--bg-glass)', color: 'var(--accent-red)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
                <button
                  onClick={handleRunDebug}
                  disabled={assistantLoading || !debugCode.trim()}
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}
                >
                  <Bug size={14} /> Diagnose Bug & Minimal Fix
                </button>
              </div>

              {debugResult && (
                <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-red)', margin: '0 0 4px 0' }}>Diagnosed Root Cause</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0 }}>{debugResult.diagnosed_cause}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', margin: '0 0 4px 0' }}>Smallest Useful Correction</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', margin: 0 }}>{debugResult.smallest_fix_explanation}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', margin: '0 0 4px 0' }}>Corrected Code</h4>
                    <pre style={{ margin: 0, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-emerald)' }}>
                      {debugResult.corrected_code}
                    </pre>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <strong>Execution Status:</strong> {debugResult.guarantee_notice}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-mode: Practise */}
          {assistantMode === 'practise' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                  Lesson Practice Exercise: {selectedLesson?.title}
                </h3>
                <button onClick={handleRunPractise} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                  Generate New Problem
                </button>
              </div>

              {practiseResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                    {practiseResult.problem_statement}
                  </div>

                  {/* Progressive Hints */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', marginBottom: '8px' }}>Progressive Hints</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {practiseResult.hints?.map(h => (
                        <div key={h.level} style={{ background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)', padding: '10px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
                              Hint {h.level}: {h.title}
                            </span>
                            {!revealedHints[h.level] && (
                              <button onClick={() => handleRevealHint(h.level)} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                                Reveal Hint {h.level}
                              </button>
                            )}
                          </div>
                          {revealedHints[h.level] && (
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {h.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Reference Solution */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                    <button onClick={handleMarkSolvedIndependently} className="btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
                      <CheckCircle2 size={14} /> Solved Independently!
                    </button>
                    <button onClick={handleRevealSolution} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>
                      Reveal Reference Solution
                    </button>
                  </div>

                  {showSolution && (
                    <div style={{ marginTop: '10px' }}>
                      <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', marginBottom: '6px' }}>Reference Solution</h4>
                      <pre style={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--accent-teal)' }}>
                        {practiseResult.reference_solution}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Click "Generate New Problem" to create an exercise grounded in this lesson.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Course-to-Notebook Builder */}
      {activeTab === 'notebook' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
          {/* Main Notebook Ordering & Builder Area */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notebook Title</label>
              <input
                type="text"
                value={notebookTitle}
                onChange={(e) => setNotebookTitle(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.9rem', marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lab Goal & Objective</label>
              <input
                type="text"
                value={notebookGoal}
                onChange={(e) => setNotebookGoal(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            {/* Cell Arrangement Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '14px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>
                Notebook Cells ({notebookCells.length})
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => addEmptyCell('markdown')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                  + Markdown Cell
                </button>
                <button onClick={() => addEmptyCell('code')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px' }}>
                  + Code Cell
                </button>
              </div>
            </div>

            {/* Ordered Cell List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notebookCells.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-glass)', borderRadius: '8px' }}>
                  No cells added yet. Add snippets from Course Materials or click "+ Code Cell" to begin.
                </div>
              ) : (
                notebookCells.map((c, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: c.cell_type === 'code' ? 'var(--accent-teal)' : 'var(--accent-indigo)' }}>
                        Cell {idx + 1}: {c.cell_type.toUpperCase()} — {c.title || 'Section'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => moveCell(idx, -1)} disabled={idx === 0} className="btn-secondary btn-icon" style={{ height: '24px', width: '24px' }}>
                          <ArrowUp size={12} />
                        </button>
                        <button onClick={() => moveCell(idx, 1)} disabled={idx === notebookCells.length - 1} className="btn-secondary btn-icon" style={{ height: '24px', width: '24px' }}>
                          <ArrowDown size={12} />
                        </button>
                        <button onClick={() => deleteCell(idx)} className="btn-secondary btn-icon" style={{ height: '24px', width: '24px', color: 'var(--accent-red)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={c.source || c.code || ''}
                      onChange={(e) => {
                        const updated = [...notebookCells];
                        updated[idx].source = e.target.value;
                        updated[idx].code = e.target.value;
                        setNotebookCells(updated);
                      }}
                      rows={c.cell_type === 'code' ? 6 : 3}
                      style={{
                        background: 'rgba(0,0,0,0.2)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '6px',
                        padding: '8px',
                        fontFamily: c.cell_type === 'code' ? 'monospace' : 'inherit',
                        fontSize: '0.75rem'
                      }}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Validation & Build Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleValidateNotebook} disabled={loading || !notebookCells.length} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
                <CheckCircle2 size={15} /> Validate Notebook (.ipynb)
              </button>
              {savedNotebookId && (
                <a
                  href={`/api/course-lab/notebooks/${savedNotebookId}/download`}
                  download={`${notebookTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}.ipynb`}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  <Download size={15} /> Download .ipynb File
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Validation Report & Google Colab Integration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Google Colab Instructions Box */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExternalLink size={18} color="var(--accent-amber)" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>Google Colab Workflow</h4>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
                1. Download your validated <code>.ipynb</code> notebook.<br/>
                2. Open Google Colab and select <strong>File &gt; Upload Notebook</strong>.<br/>
                3. For API tokens or database credentials, use <strong>Colab Secrets</strong>:
                <code>from google.colab import userdata</code>.<br/>
                ORBIT never writes hardcoded passwords into notebook files.
              </p>
            </div>

            {/* Real-time Validation Report */}
            {validationResult && (
              <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0, color: validationResult.valid ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                  Validation Status: {validationResult.valid ? 'PASSED (Syntactically Valid)' : 'ERRORS DETECTED'}
                </h4>

                {validationResult.errors?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-red)' }}>Syntax Errors:</span>
                    {validationResult.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: '0.725rem', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)', padding: '6px', borderRadius: '4px' }}>
                        {err.message}
                      </div>
                    ))}
                  </div>
                )}

                {validationResult.warnings?.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-amber)' }}>Dependency & Security Warnings:</span>
                    {validationResult.warnings.map((w, i) => (
                      <div key={i} style={{ fontSize: '0.725rem', color: 'var(--accent-amber)', background: 'rgba(245,158,11,0.1)', padding: '6px', borderRadius: '4px' }}>
                        {w.message}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Execution Environment: <strong>{validationResult.execution_status}</strong>
                </div>
              </div>
            )}

            {/* Saved Notebooks History */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', margin: 0 }}>Saved Notebooks</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {notebooks.map(nb => (
                  <div key={nb.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg-glass)', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{nb.title}</span>
                    <a href={`/api/course-lab/notebooks/${nb.id}/download`} download style={{ color: 'var(--accent-teal)' }}>
                      <Download size={13} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Lab Analytics & Progress */}
      {activeTab === 'progress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Active Courses', value: progressSummary?.total_courses || 0, color: 'var(--accent-teal)' },
              { label: 'Lessons Reviewed', value: progressSummary?.lessons_reviewed || 0, color: 'var(--accent-blue)' },
              { label: 'Notebooks Built', value: progressSummary?.total_notebooks || 0, color: 'var(--accent-indigo)' },
              { label: 'Solved Independently', value: progressSummary?.solved_independently || 0, color: 'var(--accent-emerald)' }
            ].map((stat, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.label}</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color, marginTop: '4px' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Activity Log */}
          <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-glass)', padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', margin: '0 0 14px 0' }}>Recent Student Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {progressSummary?.recent_activity?.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-glass)', borderRadius: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>{log.item_type}</span>
                    <span style={{ color: 'var(--text-main)' }}>Action: {log.action}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Course */}
      {showNewCourseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-glass)',
            padding: '24px',
            width: '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>Create New Course</h3>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Course Title *</label>
              <input
                type="text"
                placeholder="e.g. CS106B Programming Abstractions"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Course Code</label>
              <input
                type="text"
                placeholder="e.g. CS106B"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Description</label>
              <textarea
                placeholder="Overview of syllabus and learning goals..."
                value={newCourseDesc}
                onChange={(e) => setNewCourseDesc(e.target.value)}
                rows={3}
                style={{ width: '100%', background: 'var(--bg-glass)', color: 'var(--text-main)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowNewCourseModal(false)} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                Cancel
              </button>
              <button onClick={handleCreateCourse} disabled={!newCourseTitle.trim()} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                Create Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

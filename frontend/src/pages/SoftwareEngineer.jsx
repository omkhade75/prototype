import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Play, 
  FolderTree, 
  FileCode, 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  ExternalLink, 
  RotateCw, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight, 
  FileText, 
  HelpCircle,
  Database,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Maximize2
} from 'lucide-react';
import { api } from '../services/api';

export function SoftwareEngineer({ systemStatus }) {
  // State
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // New Project Form Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStack, setNewProjectStack] = useState('react-express-sqlite');
  const [creatingProject, setCreatingProject] = useState(false);

  // Navigation & Tabs
  const [leftTab, setLeftTab] = useState('spec'); // 'spec' | 'files' | 'git'
  const [consoleTab, setConsoleTab] = useState('activity'); // 'activity' | 'tests' | 'preview'

  // Files & Editor
  const [fileTree, setFileTree] = useState([]);
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  // AI Agent Operations
  const [selectedProvider, setSelectedProvider] = useState('demo');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentTrace, setAgentTrace] = useState([]);
  const [generationSummary, setGenerationSummary] = useState(null);
  const [clarification, setClarification] = useState(null);
  const [clarificationAnswer, setClarificationAnswer] = useState('');

  // Local Preview
  const [previewStatus, setPreviewStatus] = useState({ status: 'stopped', url: null, port: 5173, logs: [] });
  const [previewStarting, setPreviewStarting] = useState(false);

  // Git & Screening
  const [gitStatus, setGitStatus] = useState(null);
  const [gitScreening, setGitScreening] = useState(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);

  const ollamaReachable = Boolean(systemStatus?.ai_service?.ollama_reachable);
  const configuredModel = systemStatus?.ai_service?.configured_model || 'llama3';

  // Load project list on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Reload selected project details whenever selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await api.getEngineerProjects();
      const list = res.projects || [];
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        setSelectedProjectId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadProjectDetails = async (id) => {
    try {
      const [projRes, treeRes, gitRes, screeningRes, prevRes] = await Promise.all([
        api.getEngineerProject(id).catch(() => ({ project: null })),
        api.getEngineerFileTree(id).catch(() => ({ tree: [] })),
        api.getEngineerGitStatus(id).catch(() => ({ git: null })),
        api.previewEngineerCommit(id).catch(() => ({ screening: null })),
        api.getEngineerPreviewStatus(id).catch(() => ({ preview: { status: 'stopped' } }))
      ]);

      if (projRes.project) {
        setSelectedProject(projRes.project);
        setGenerationSummary(projRes.project.summary || null);
      }
      setFileTree(treeRes.tree || []);
      setGitStatus(gitRes.git || null);
      setGitScreening(screeningRes.screening || null);
      if (prevRes.preview) {
        setPreviewStatus(prevRes.preview);
      }

      // If no file selected, pick first entry
      if (treeRes.tree && treeRes.tree.length > 0 && !selectedFilePath) {
        const firstFile = findFirstFile(treeRes.tree);
        if (firstFile) {
          loadFileContent(id, firstFile.path);
        }
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  const findFirstFile = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const child = findFirstFile(node.children);
        if (child) return child;
      }
    }
    return null;
  };

  const loadFileContent = async (projId, path) => {
    try {
      setLoadingFile(true);
      setSelectedFilePath(path);
      const res = await api.readEngineerFile(projId, path);
      setFileContent(res.file?.content || '');
      setIsEditing(false);
    } catch (err) {
      console.error('Error reading file:', err);
      setFileContent(`// Error loading file: ${err.message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectDesc.trim()) return;

    try {
      setCreatingProject(true);
      const res = await api.createEngineerProject({
        name: newProjectName,
        description: newProjectDesc,
        stack: newProjectStack
      });

      if (res.project) {
        setProjects(prev => [res.project, ...prev]);
        setSelectedProjectId(res.project.id);
        setShowNewModal(false);
        setNewProjectName('');
        setNewProjectDesc('');
      }
    } catch (err) {
      alert(`Project creation failed: ${err.message}`);
    } finally {
      setCreatingProject(false);
    }
  };

  const handlePlanProject = async () => {
    if (!selectedProjectId || !selectedProject) return;
    try {
      setIsPlanning(true);
      setClarification(null);
      const res = await api.planEngineerProject(selectedProjectId, {
        prompt: clarificationAnswer 
          ? `${selectedProject.description}\nAdditional specification: ${clarificationAnswer}` 
          : selectedProject.description,
        stack: selectedProject.stack,
        provider: selectedProvider,
        model: selectedProvider === 'ollama' ? configuredModel : undefined
      });

      if (res.plan) {
        if (res.plan.needs_clarification) {
          setClarification(res.plan.clarification_question);
        } else {
          loadProjectDetails(selectedProjectId);
        }
      }
    } catch (err) {
      alert(`Planning failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleGenerateProject = async () => {
    if (!selectedProjectId) return;
    try {
      setIsGenerating(true);
      setConsoleTab('activity');
      const res = await api.generateEngineerProject(selectedProjectId, {
        provider: selectedProvider,
        model: selectedProvider === 'ollama' ? configuredModel : undefined
      });

      if (res.generation) {
        setAgentTrace(res.generation.trace || []);
        setGenerationSummary(res.generation.summary || null);
        loadProjectDetails(selectedProjectId);
      }
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedProjectId || !selectedFilePath) return;
    try {
      setSavingFile(true);
      await api.writeEngineerFile(selectedProjectId, selectedFilePath, fileContent);
      setIsEditing(false);
      loadProjectDetails(selectedProjectId);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSavingFile(false);
    }
  };

  const handleStartPreview = async () => {
    if (!selectedProjectId) return;
    try {
      setPreviewStarting(true);
      const res = await api.startEngineerPreview(selectedProjectId);
      if (res.preview) {
        setPreviewStatus(res.preview);
        setConsoleTab('preview');
      }
    } catch (err) {
      alert(`Failed to start preview: ${err.message}`);
    } finally {
      setPreviewStarting(false);
    }
  };

  const handleStopPreview = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await api.stopEngineerPreview(selectedProjectId);
      if (res.preview) {
        setPreviewStatus(prev => ({ ...prev, status: 'stopped' }));
      }
    } catch (err) {
      alert(`Failed to stop preview: ${err.message}`);
    }
  };

  const handleCommit = async () => {
    if (!selectedProjectId || !commitMessage.trim()) return;
    try {
      setCommitting(true);
      const res = await api.createEngineerCommit(selectedProjectId, commitMessage.trim(), true);
      if (res.result?.success) {
        setCommitMessage('');
        setShowCommitConfirm(false);
        loadProjectDetails(selectedProjectId);
      } else {
        alert(res.result?.stderr || 'Commit failed.');
      }
    } catch (err) {
      alert(`Commit error: ${err.message}`);
    } finally {
      setCommitting(false);
    }
  };

  // Render file tree recursively
  const renderTree = (nodes) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {nodes.map((node) => {
          if (node.type === 'directory') {
            return (
              <div key={node.path} style={{ marginLeft: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <FolderTree size={14} color="var(--accent-amber-light)" />
                  <span>{node.name}</span>
                </div>
                {node.children && <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', marginLeft: '0.5rem', paddingLeft: '0.4rem' }}>{renderTree(node.children)}</div>}
              </div>
            );
          }
          const isSelected = selectedFilePath === node.path;
          return (
            <button
              key={node.path}
              onClick={() => loadFileContent(selectedProjectId, node.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.76rem',
                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isSelected ? 'var(--accent-blue-light)' : 'var(--text-dim)',
                border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <FileCode size={13} color={isSelected ? 'var(--accent-blue-light)' : 'var(--text-muted)'} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: '0.75rem' }}>
      
      {/* Top Workspace Header Bar */}
      <header className="panel-glass" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* Left: Project Selector & Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Terminal size={18} color="var(--accent-indigo)" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>Workspace:</span>
          </div>

          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="input-glass"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', minWidth: '220px' }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.stack})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewModal(true)}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Plus size={14} /> New Project
          </button>

          {selectedProject && (
            <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
              {selectedProject.stack}
            </span>
          )}
        </div>

        {/* Right: Runtime Controls & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Model / Provider Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-glass-subtle)' }}>
            <Cpu size={14} color="var(--accent-violet)" />
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.74rem', cursor: 'pointer' }}
            >
              <option value="demo">Demo Mode (Deterministic)</option>
              <option value="ollama" disabled={!ollamaReachable}>
                Ollama Local ({configuredModel}) {!ollamaReachable ? '(Offline)' : ''}
              </option>
            </select>
          </div>

          {/* Plan Project Action */}
          <button
            onClick={handlePlanProject}
            disabled={isPlanning || isGenerating || !selectedProjectId}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Sparkles size={14} className={isPlanning ? 'spin' : ''} />
            {isPlanning ? 'Planning...' : 'Plan Project'}
          </button>

          {/* Generate & Run Action */}
          <button
            onClick={handleGenerateProject}
            disabled={isGenerating || isPlanning || !selectedProjectId}
            className="btn-primary"
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Play size={14} className={isGenerating ? 'spin' : ''} />
            {isGenerating ? 'Building Full-Stack...' : 'Generate & Run'}
          </button>

          {/* Local Preview Action */}
          {previewStatus.status === 'running' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <a
                href={previewStatus.url}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
              >
                <ExternalLink size={13} />
                Preview: {previewStatus.port}
              </a>
              <button
                onClick={handleStopPreview}
                className="btn-secondary"
                title="Stop Local Preview Server"
                style={{ padding: '0.4rem', color: '#f87171' }}
              >
                <Square size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartPreview}
              disabled={previewStarting || !selectedProjectId}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Play size={13} color="var(--accent-emerald-light)" />
              {previewStarting ? 'Starting...' : 'Start Preview'}
            </button>
          )}
        </div>

      </header>

      {/* Main 3-Column / Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 380px', gap: '0.75rem', flex: 1, minHeight: 0 }}>
        
        {/* Left Column: Spec, Planner & Workspace Navigator */}
        <div className="panel-glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab Headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass-subtle)', background: 'rgba(0,0,0,0.1)' }}>
            <button
              onClick={() => setLeftTab('spec')}
              style={{
                flex: 1,
                padding: '0.65rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: leftTab === 'spec' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: leftTab === 'spec' ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: leftTab === 'spec' ? '2px solid var(--accent-indigo)' : 'none',
                cursor: 'pointer'
              }}
            >
              Specification & Plan
            </button>
            <button
              onClick={() => setLeftTab('files')}
              style={{
                flex: 1,
                padding: '0.65rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: leftTab === 'files' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: leftTab === 'files' ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: leftTab === 'files' ? '2px solid var(--accent-indigo)' : 'none',
                cursor: 'pointer'
              }}
            >
              Files ({fileTree.length})
            </button>
            <button
              onClick={() => setLeftTab('git')}
              style={{
                flex: 1,
                padding: '0.65rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: leftTab === 'git' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: leftTab === 'git' ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: leftTab === 'git' ? '2px solid var(--accent-indigo)' : 'none',
                cursor: 'pointer'
              }}
            >
              Git & Safe Push
            </button>
          </div>

          {/* Left Tab Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
            
            {/* Tab 1: Spec & Planner */}
            {leftTab === 'spec' && selectedProject && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Project Prompt
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                    {selectedProject.description}
                  </div>
                </div>

                {/* Clarification Box if AI detected missing critical details */}
                {clarification && (
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber-light)', fontSize: '0.78rem', fontWeight: 600 }}>
                      <HelpCircle size={14} /> Clarification Requested
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      {clarification}
                    </div>
                    <input
                      type="text"
                      placeholder="Type details (e.g., add customer loyalty points)..."
                      value={clarificationAnswer}
                      onChange={(e) => setClarificationAnswer(e.target.value)}
                      className="input-glass"
                      style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.76rem', padding: '0.35rem 0.5rem' }}
                    />
                    <button
                      onClick={handlePlanProject}
                      className="btn-primary"
                      style={{ marginTop: '0.4rem', width: '100%', fontSize: '0.74rem', padding: '0.3rem' }}
                    >
                      Update Plan
                    </button>
                  </div>
                )}

                {/* Architecture & Entities */}
                {generationSummary?.architecture && (
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.4rem' }}>
                      Proposed Architecture
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '6px', fontSize: '0.74rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Domain:</span>
                        <strong style={{ color: 'var(--accent-blue-light)' }}>{generationSummary.architecture.domain}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-dim)' }}>Database:</span>
                        <span>{generationSummary.architecture.backend?.database || 'SQLite'}</span>
                      </div>
                      <div style={{ color: 'var(--text-dim)', marginTop: '0.4rem', fontSize: '0.7rem' }}>
                        Entities: {generationSummary.architecture.database_tables?.join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Checklist */}
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Implementation Tasks ({selectedProject.tasks?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {(selectedProject.tasks || []).map((task, idx) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.4rem',
                          padding: '0.45rem',
                          borderRadius: '6px',
                          background: task.status === 'completed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.2)',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}
                      >
                        <div style={{ marginTop: '2px' }}>
                          {task.status === 'completed' ? (
                            <CheckCircle2 size={13} color="var(--accent-emerald)" />
                          ) : (
                            <Clock size={13} color="var(--text-muted)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: task.status === 'completed' ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                            {idx + 1}. {task.title}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {task.category}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 2: File Explorer */}
            {leftTab === 'files' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Workspace Tree
                  </span>
                  <button
                    onClick={() => loadProjectDetails(selectedProjectId)}
                    className="btn-icon"
                    title="Refresh Tree"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
                {fileTree.length > 0 ? (
                  renderTree(fileTree)
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                    No files generated yet. Click "Generate & Run".
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Git & Version Control */}
            {leftTab === 'git' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Secret Screening Alert */}
                {gitScreening && (
                  <div style={{
                    padding: '0.65rem',
                    borderRadius: '6px',
                    background: gitScreening.ready_for_commit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${gitScreening.ready_for_commit ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', fontWeight: 600, color: gitScreening.ready_for_commit ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {gitScreening.ready_for_commit ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                      {gitScreening.ready_for_commit ? 'Passed Secret Screening' : 'Secret Screening Blocked'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                      {gitScreening.message}
                    </div>
                  </div>
                )}

                {/* Git Status Summary */}
                {gitStatus && (
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Branch & Changes
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '4px' }}>
                      {gitStatus.branch_summary}
                    </div>
                  </div>
                )}

                {/* Commit Action */}
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Create Safe Commit
                  </div>
                  <input
                    type="text"
                    placeholder="feat: complete restaurant CRUD & tests"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="input-glass"
                    style={{ width: '100%', fontSize: '0.76rem', padding: '0.4rem' }}
                  />
                  <button
                    onClick={() => setShowCommitConfirm(true)}
                    disabled={!commitMessage.trim() || committing || (gitScreening && !gitScreening.ready_for_commit)}
                    className="btn-primary"
                    style={{ marginTop: '0.4rem', width: '100%', fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <GitCommit size={14} /> Commit (Requires Gate)
                  </button>
                </div>

                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '0.5rem' }}>
                  <strong>Security Guard:</strong> Commits automatically exclude <code>.env</code>, <code>*.db</code>, credentials, and never touch ORBIT AI's own repository.
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Center Column: Code Editor & File Viewer */}
        <div className="panel-glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* File Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.85rem', borderBottom: '1px solid var(--border-glass-subtle)', background: 'rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
              <FileCode size={15} color="var(--accent-blue-light)" />
              <span>{selectedFilePath || 'Select a file to view'}</span>
            </div>

            {selectedFilePath && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveFile}
                      disabled={savingFile}
                      className="btn-primary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Save size={12} /> {savingFile ? 'Saving...' : 'Save File'}
                    </button>
                    <button
                      onClick={() => loadFileContent(selectedProjectId, selectedFilePath)}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem' }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem' }}
                  >
                    Edit Code
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Editor Body */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {loadingFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Loading file content...
              </div>
            ) : isEditing ? (
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#090d16',
                  color: '#e2e8f0',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.8rem',
                  lineHeight: '1.45',
                  padding: '1rem',
                  border: 'none',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            ) : (
              <pre
                style={{
                  margin: 0,
                  height: '100%',
                  padding: '1rem',
                  overflow: 'auto',
                  background: '#090d16',
                  color: '#e2e8f0',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.8rem',
                  lineHeight: '1.45'
                }}
              >
                <code>{fileContent || '// Select a file from the explorer on the left to inspect its source code.'}</code>
              </pre>
            )}
          </div>
        </div>

        {/* Right Column: Execution Trace, Tests & Live Preview */}
        <div className="panel-glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Console Tab Headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass-subtle)', background: 'rgba(0,0,0,0.1)' }}>
            <button
              onClick={() => setConsoleTab('activity')}
              style={{
                flex: 1,
                padding: '0.65rem 0.4rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                background: consoleTab === 'activity' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: consoleTab === 'activity' ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: consoleTab === 'activity' ? '2px solid var(--accent-indigo)' : 'none',
                cursor: 'pointer'
              }}
            >
              Activity Trace
            </button>
            <button
              onClick={() => setConsoleTab('tests')}
              style={{
                flex: 1,
                padding: '0.65rem 0.4rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                background: consoleTab === 'tests' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: consoleTab === 'tests' ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: consoleTab === 'tests' ? '2px solid var(--accent-indigo)' : 'none',
                cursor: 'pointer'
              }}
            >
              Tests & Build
            </button>
            <button
              onClick={() => setConsoleTab('preview')}
              style={{
                flex: 1,
                padding: '0.65rem 0.4rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                background: consoleTab === 'preview' ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: consoleTab === 'preview' ? 'var(--text-main)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: consoleTab === 'preview' ? '2px solid var(--accent-indigo)' : 'none',
                cursor: 'pointer'
              }}
            >
              Local Preview
            </button>
          </div>

          {/* Console Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.85rem' }}>
            
            {/* Console Tab 1: Activity Trace */}
            {consoleTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {agentTrace.length > 0 ? (
                  agentTrace.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        fontSize: '0.74rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ textTransform: 'uppercase', color: 'var(--accent-blue-light)' }}>
                          Phase: {step.phase}
                        </strong>
                        <span className={`badge ${step.status === 'completed' || step.status === 'passed' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                          {step.status}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>{step.details}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
                    Activity trace empty. Click "Generate & Run" to watch the agent plan, scaffold, and test code.
                  </div>
                )}
              </div>
            )}

            {/* Console Tab 2: Tests & Build Results */}
            {consoleTab === 'tests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {generationSummary ? (
                  <>
                    <div style={{
                      padding: '0.65rem',
                      borderRadius: '6px',
                      background: generationSummary.test_success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${generationSummary.test_success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: generationSummary.test_success ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {generationSummary.test_success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        {generationSummary.test_success ? 'All Integration Tests Passed' : 'Test Suite Failed'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                        Command: <code>{generationSummary.tests_run}</code>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Test Output (stdout)
                      </div>
                      <pre style={{ background: '#090d16', padding: '0.6rem', borderRadius: '4px', fontSize: '0.72rem', color: '#94a3b8', maxHeight: '180px', overflowY: 'auto' }}>
                        {generationSummary.test_stdout || '(No stdout)'}
                      </pre>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
                        Verified System Features
                      </div>
                      <ul style={{ listStyleType: 'disc', paddingLeft: '1.2rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {(generationSummary.verified_features || []).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '2rem 0' }}>
                    No test results recorded yet.
                  </div>
                )}
              </div>
            )}

            {/* Console Tab 3: Local Preview */}
            {consoleTab === 'preview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ fontSize: '0.74rem' }}>
                    Status: <strong style={{ color: previewStatus.status === 'running' ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>{previewStatus.status.toUpperCase()}</strong>
                  </div>
                  {previewStatus.url && (
                    <a href={previewStatus.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--accent-blue-light)', textDecoration: 'none' }}>
                      Open in Tab ↗
                    </a>
                  )}
                </div>

                {previewStatus.status === 'running' && previewStatus.url ? (
                  <iframe
                    src={previewStatus.url}
                    title="Local Project Preview"
                    style={{ width: '100%', height: '260px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: '#ffffff' }}
                  />
                ) : null}

                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Server Process Logs
                  </div>
                  <pre style={{ background: '#090d16', padding: '0.6rem', borderRadius: '4px', fontSize: '0.7rem', color: '#64748b', maxHeight: '180px', overflowY: 'auto' }}>
                    {(previewStatus.logs || []).join('\n') || '(No server logs yet)'}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Modal: New Project */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="panel-glass" style={{ width: '480px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Create New Full-Stack Project</h3>
            
            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Project Name</label>
              <input
                type="text"
                placeholder="e.g. Restaurant Management System"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="input-glass"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Project Specification / Prompt</label>
              <textarea
                rows={4}
                placeholder="Describe your app: entities, workflows, auth, dashboards, and features..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="input-glass"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Selected Stack</label>
              <select
                value={newProjectStack}
                onChange={(e) => setNewProjectStack(e.target.value)}
                className="input-glass"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem' }}
              >
                <option value="react-express-sqlite">React + Express + SQLite (Recommended)</option>
                <option value="react-vite-js">React + Vite + Modern JavaScript</option>
                <option value="node-express-sqlite">Node.js + Express + SQLite REST API</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={() => setShowNewModal(false)}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creatingProject || !newProjectName.trim() || !newProjectDesc.trim()}
                className="btn-primary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
              >
                {creatingProject ? 'Creating...' : 'Initialize Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Git Commit Confirmation Gate */}
      {showCommitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="panel-glass" style={{ width: '440px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              Confirm Safe Git Commit
            </h4>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to stage approved workspace files and commit with message:
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', marginTop: '0.3rem', color: 'var(--accent-cyan)' }}>
                "{commitMessage}"
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              All <code>.env</code> files, credentials, and <code>*.db</code> databases are automatically excluded from the commit.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setShowCommitConfirm(false)} className="btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}>
                Cancel
              </button>
              <button onClick={handleCommit} disabled={committing} className="btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}>
                {committing ? 'Committing...' : 'Confirm & Commit'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SoftwareEngineer;

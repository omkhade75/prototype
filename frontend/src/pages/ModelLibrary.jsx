import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Boxes,
  Cpu,
  HardDrive,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Scale,
  Sparkles,
  BookOpen,
  Search,
  Sliders,
  Layers,
  Terminal,
  ExternalLink,
  Info,
  Clock,
  Gauge,
  Zap,
  Award,
  RefreshCw,
  Check,
  X,
  FileCode,
  ShieldCheck,
  Star
} from 'lucide-react';

export function ModelLibrary({ systemStatus, onRefresh }) {
  // Navigation tabs within Model Library
  const [activeTab, setActiveTab] = useState('discovery'); // 'discovery' | 'local' | 'compare' | 'recommend' | 'learning' | 'testbench'

  // Global active model setting
  const [activeConfig, setActiveConfig] = useState({ provider: 'ollama', model: 'llama3', task: 'coding' });

  // 1. Model Discovery State
  const [catalog, setCatalog] = useState([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogPage, setCatalogPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState('all');
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedPublisher, setSelectedPublisher] = useState('all');
  const [filterFits6GB, setFilterFits6GB] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // 2. Local Models State
  const [localData, setLocalData] = useState({ reachable: false, models: [], storage: { free_gb: 0, total_gb: 0 } });
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [pullModalOpen, setPullModalOpen] = useState(false);
  const [pullModelName, setPullModelName] = useState('llama3.2:1b');
  const [pullProgress, setPullProgress] = useState(null);
  const [isPulling, setIsPulling] = useState(false);
  const [deleteConfirmModel, setDeleteConfirmModel] = useState(null);
  const [inspectModalData, setInspectModalData] = useState(null);

  // 3. Model Comparison State
  const [compareModelIds, setCompareModelIds] = useState(['ollama:qwen2.5-coder:7b', 'ollama:llama3.1:8b']);
  const [comparisonDetails, setComparisonDetails] = useState([]);
  const [savedComparisons, setSavedComparisons] = useState([]);
  const [comparisonTitle, setComparisonTitle] = useState('');

  // 4. Hardware Recommendations State
  const [recTask, setRecTask] = useState('coding');
  const [recPreset, setRecPreset] = useState('hp_victus');
  const [recRam, setRecRam] = useState(16.0);
  const [recVram, setRecVram] = useState(6.0);
  const [recDisk, setRecDisk] = useState(100.0);
  const [recSpeed, setRecSpeed] = useState('balanced');
  const [recLicense, setRecLicense] = useState('any');
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // 5. Learning Center State
  const [learningModelId, setLearningModelId] = useState('ollama:qwen2.5-coder:7b');
  const [learningModelCard, setLearningModelCard] = useState(null);

  // 6. Test Bench State
  const [testModelName, setTestModelName] = useState('');
  const [testPrompt, setTestPrompt] = useState('Implement a binary search function in C++ with boundary condition explanations.');
  const [testCategory, setTestCategory] = useState('coding');
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testHistory, setTestHistory] = useState([]);
  const [rubricScores, setRubricScores] = useState({ correctness: 4, explanation: 5, code_quality: 4, notes: '' });

  // Initial load
  useEffect(() => {
    fetchActiveConfig();
    fetchCatalog();
    fetchLocalModels();
    fetchTestHistory();
    fetchSavedComparisons();
  }, []);

  // Update learning card whenever learningModelId changes
  useEffect(() => {
    if (learningModelId) {
      api.getModelCard(learningModelId)
        .then(res => setLearningModelCard(res.model))
        .catch(() => {});
    }
  }, [learningModelId]);

  // Sync comparison models
  useEffect(() => {
    if (compareModelIds.length > 0) {
      Promise.all(compareModelIds.map(id => api.getModelCard(id).catch(() => null)))
        .then(results => {
          setComparisonDetails(results.filter(Boolean).map(r => r.model));
        });
    }
  }, [compareModelIds]);

  const fetchActiveConfig = async () => {
    try {
      const res = await api.getActiveModelConfig();
      if (res.success && res.config) {
        setActiveConfig(res.config);
        setTestModelName(res.config.model);
      }
    } catch (err) {
      console.warn('Active config fetch:', err.message);
    }
  };

  const fetchCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const params = {
        query: searchQuery,
        task: selectedTask,
        modality: selectedModality,
        publisher: selectedPublisher,
        page: catalogPage,
        page_size: 12
      };
      if (filterFits6GB) params.fits_vram_gb = 6.0;

      const res = await api.getModelCatalog(params);
      if (res.success) {
        setCatalog(res.models || []);
        setCatalogTotal(res.total || 0);
      }
    } catch (err) {
      console.error('Fetch catalog error:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const fetchLocalModels = async () => {
    try {
      setLoadingLocal(true);
      const res = await api.getLocalModels();
      if (res.success) {
        setLocalData(res);
        if (res.models?.length > 0 && !testModelName) {
          setTestModelName(res.models[0].name);
        }
      }
    } catch (err) {
      setLocalData({ reachable: false, models: [], error: err.message, storage: { free_gb: 0, total_gb: 0 } });
    } finally {
      setLoadingLocal(false);
    }
  };

  const fetchTestHistory = async () => {
    try {
      const res = await api.getModelTestRuns(10);
      if (res.success) setTestHistory(res.runs || []);
    } catch (err) {
      console.warn('Test history fetch:', err.message);
    }
  };

  const fetchSavedComparisons = async () => {
    try {
      const res = await api.getModelComparisons();
      if (res.success) setSavedComparisons(res.comparisons || []);
    } catch (err) {
      console.warn('Comparisons fetch:', err.message);
    }
  };

  const handleSetActiveModel = async (modelName) => {
    try {
      const res = await api.setActiveModelConfig({
        provider: 'ollama',
        model: modelName,
        task: activeConfig.task
      });
      if (res.success) {
        setActiveConfig(res.config);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(`Failed to set active model: ${err.message}`);
    }
  };

  const handleInspectModel = async (modelName) => {
    try {
      const res = await api.inspectLocalModel(modelName);
      if (res.success) {
        setInspectModalData(res.details);
      }
    } catch (err) {
      alert(`Inspection failed: ${err.message}`);
    }
  };

  const handleDeleteModel = async () => {
    if (!deleteConfirmModel) return;
    try {
      const res = await api.deleteLocalModel(deleteConfirmModel, true);
      if (res.success) {
        setDeleteConfirmModel(null);
        fetchLocalModels();
      }
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setLoadingRecs(true);
      const payload = {
        task: recTask,
        ram_gb: parseFloat(recRam),
        vram_gb: parseFloat(recVram),
        disk_free_gb: parseFloat(recDisk),
        speed_preference: recSpeed,
        license_constraint: recLicense
      };
      const res = await api.recommendModels(payload);
      if (res.success) {
        setRecommendations(res);
      }
    } catch (err) {
      alert(`Recommendation failed: ${err.message}`);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleRunModelTest = async () => {
    if (!testModelName) {
      alert('Please select an installed model to test.');
      return;
    }
    try {
      setTestRunning(true);
      setTestResult(null);
      const res = await api.testModel({
        model_name: testModelName,
        prompt: testPrompt,
        category: testCategory
      });
      if (res.success) {
        setTestResult(res.result);
        fetchTestHistory();
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message, model: testModelName });
    } finally {
      setTestRunning(false);
    }
  };

  const handleSaveRubric = async () => {
    if (!testResult?.test_id) return;
    try {
      await api.saveTestRubric(testResult.test_id, rubricScores);
      alert('Evaluation rubric saved to SQLite!');
      fetchTestHistory();
    } catch (err) {
      alert(`Failed to save rubric: ${err.message}`);
    }
  };

  const handleSaveComparisonSession = async () => {
    if (comparisonDetails.length < 2) {
      alert('Select at least 2 models to save a comparison.');
      return;
    }
    try {
      const title = comparisonTitle.trim() || `Comparison: ${comparisonDetails.map(m => m.name).join(' vs ')}`;
      await api.saveModelComparison({
        title,
        models: compareModelIds,
        prompt: 'Benchmark Analysis',
        comparison_data: { details: comparisonDetails }
      });
      alert('Comparison session saved to SQLite!');
      setComparisonTitle('');
      fetchSavedComparisons();
    } catch (err) {
      alert(`Failed to save comparison: ${err.message}`);
    }
  };

  // Preset hardware changer
  const handlePresetChange = (presetId) => {
    setRecPreset(presetId);
    if (presetId === 'hp_victus') {
      setRecRam(16.0);
      setRecVram(6.0);
      setRecDisk(150.0);
    } else if (presetId === 'budget_laptop') {
      setRecRam(8.0);
      setRecVram(0.0);
      setRecDisk(50.0);
    } else if (presetId === 'pro_workstation') {
      setRecRam(32.0);
      setRecVram(12.0);
      setRecDisk(500.0);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      {/* Top Banner & Active Model Status Pill */}
      <div className="card-glass" style={{ marginBottom: '1.25rem', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-violet-glow)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={22} color="var(--accent-violet)" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>AI Model Library & Learning Center</h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Discover, install, benchmark, and understand open-weights AI architectures on your local hardware.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
            <Cpu size={14} color="var(--accent-cyan)" />
            <span>Active Model:</span>
            <strong style={{ color: 'var(--accent-cyan-light)' }}>{activeConfig.model || 'llama3'}</strong>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{activeConfig.provider.toUpperCase()}</span>
          </div>

          <div style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
            <span className={`status-dot ${localData.reachable ? 'green' : 'amber'}`} />
            <span>Ollama Daemon:</span>
            <strong style={{ color: localData.reachable ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
              {localData.reachable ? 'Online (11434)' : 'Offline'}
            </strong>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'discovery', label: 'Model Discovery', icon: Search },
          { id: 'local', label: 'My Local Models', icon: HardDrive, count: localData.models?.length },
          { id: 'compare', label: 'Model Comparison', icon: Scale },
          { id: 'recommend', label: 'Hardware Advisor', icon: Sparkles },
          { id: 'learning', label: 'Learning Center', icon: BookOpen },
          { id: 'testbench', label: 'Model Test Bench', icon: Terminal }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn-secondary ${isActive ? 'active' : ''}`}
              style={{
                borderRadius: '8px 8px 0 0',
                borderBottom: isActive ? '2px solid var(--accent-violet)' : '2px solid transparent',
                background: isActive ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '400',
                fontSize: '0.85rem',
                padding: '0.55rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Icon size={15} color={isActive ? 'var(--accent-violet)' : 'currentColor'} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------------------------- */}
      {/* 1. MODEL DISCOVERY SUB-TAB */}
      {/* -------------------------------------------------------------------------------------- */}
      {activeTab === 'discovery' && (
        <div>
          {/* Search & Filter Bar */}
          <div className="card-glass" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 250px', position: 'relative' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Search models by name, publisher, tag, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchCatalog()}
                  style={{ paddingLeft: '2.2rem', width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <select
                className="input-glass"
                value={selectedTask}
                onChange={(e) => { setSelectedTask(e.target.value); fetchCatalog(); }}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
              >
                <option value="all">All Tasks</option>
                <option value="coding">Coding & Synthesis</option>
                <option value="dsa_tutor">DSA & Algorithmic Tutoring</option>
                <option value="reasoning">Chain-of-Thought Reasoning</option>
                <option value="rag">RAG & Retrieval</option>
                <option value="summarization">Document Summarization</option>
              </select>

              <select
                className="input-glass"
                value={selectedPublisher}
                onChange={(e) => { setSelectedPublisher(e.target.value); fetchCatalog(); }}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}
              >
                <option value="all">All Publishers</option>
                <option value="Meta AI">Meta AI</option>
                <option value="Alibaba Cloud">Alibaba Cloud</option>
                <option value="DeepSeek">DeepSeek</option>
                <option value="Mistral AI">Mistral AI</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Google">Google</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterFits6GB}
                  onChange={(e) => { setFilterFits6GB(e.target.checked); fetchCatalog(); }}
                />
                <span>Fits in 6GB VRAM (RTX 3050)</span>
              </label>

              <button className="btn-primary" onClick={fetchCatalog} style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
                Apply Filters
              </button>
            </div>
          </div>

          {/* Model Cards Grid */}
          {loadingCatalog ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <RefreshCw className="spin" size={24} style={{ marginBottom: '0.5rem' }} />
              <p>Loading model metadata catalogue...</p>
            </div>
          ) : catalog.length === 0 ? (
            <div className="card-glass" style={{ textAlign: 'center', padding: '3rem' }}>
              <AlertTriangle size={32} color="var(--accent-amber)" style={{ marginBottom: '0.5rem' }} />
              <h4>No matching models found</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Try clearing filters or adjusting your query terms.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {catalog.map(model => {
                const isInstalled = localData.models?.some(m => m.name === model.ollama_tag || m.name.startsWith(`${model.ollama_tag}:`));
                const isActive = activeConfig.model === model.ollama_tag;

                return (
                  <div key={model.id} className="card-glass card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--accent-violet)', fontWeight: '600', textTransform: 'uppercase' }}>
                            {model.publisher}
                          </div>
                          <h4 style={{ margin: '0.15rem 0', fontSize: '1.05rem', fontWeight: '700' }}>{model.name}</h4>
                        </div>
                        <span className={`badge ${model.fits_rtx_3050_6gb ? 'badge-success' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                          {model.fits_rtx_3050_6gb ? '✓ Fits RTX 3050' : '⚡ Partial RAM'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                        {model.description}
                      </p>

                      {/* Specs Matrix */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
                        <div><strong>Params:</strong> <span style={{ color: 'var(--text-muted)' }}>{model.parameter_size}</span></div>
                        <div><strong>Download:</strong> <span style={{ color: 'var(--text-muted)' }}>{model.size_display}</span></div>
                        <div><strong>Context:</strong> <span style={{ color: 'var(--text-muted)' }}>{model.context_length ? `${Math.round(model.context_length / 1024)}k` : '32k'}</span></div>
                        <div><strong>VRAM:</strong> <span style={{ color: 'var(--text-muted)' }}>{model.vram_rec_gb} GB</span></div>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                        {model.tasks?.slice(0, 3).map(t => (
                          <span key={t} className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{t}</span>
                        ))}
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{model.license.split(' ')[0]}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => { setLearningModelId(model.id); setActiveTab('learning'); }}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      >
                        <BookOpen size={13} />
                        Learn
                      </button>

                      {isInstalled ? (
                        <button
                          className={isActive ? 'btn-primary' : 'btn-secondary'}
                          onClick={() => handleSetActiveModel(model.ollama_tag)}
                          disabled={isActive}
                          style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <CheckCircle2 size={13} color={isActive ? '#fff' : 'var(--accent-emerald)'} />
                          {isActive ? 'Active' : 'Set Active'}
                        </button>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => { setPullModelName(model.ollama_tag); setPullModalOpen(true); }}
                          style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                        >
                          <Download size={13} />
                          Install
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------------------- */}
      {/* 2. MY LOCAL MODELS SUB-TAB */}
      {/* -------------------------------------------------------------------------------------- */}
      {activeTab === 'local' && (
        <div>
          {/* Storage Meter & Daemon Status Card */}
          <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Local Ollama Environment</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Connected to daemon at <code style={{ color: 'var(--accent-violet)' }}>http://localhost:11434</code>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={fetchLocalModels} disabled={loadingLocal} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                  <RefreshCw size={14} className={loadingLocal ? 'spin' : ''} style={{ marginRight: '0.4rem' }} />
                  Refresh
                </button>
                <button className="btn-primary" onClick={() => setPullModalOpen(true)} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                  <Download size={14} style={{ marginRight: '0.4rem' }} />
                  Pull New Model
                </button>
              </div>
            </div>

            {/* Disk usage bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                <span>Local Disk Space</span>
                <span><strong>{localData.storage?.free_gb || 0} GB Free</strong> / {localData.storage?.total_gb || 0} GB Total</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.round(((localData.storage?.used_gb || 0) / (localData.storage?.total_gb || 1)) * 100))}%`,
                    height: '100%',
                    background: 'var(--gradient-primary)',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Local Models Table / List */}
          {!localData.reachable ? (
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <AlertTriangle size={36} color="var(--accent-amber)" style={{ marginBottom: '0.75rem' }} />
              <h4>Ollama Daemon is Offline</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '450px', margin: '0 auto 1.25rem' }}>
                Could not connect to the local Ollama server at <code>http://localhost:11434</code>. Please ensure Ollama is installed and running.
              </p>
              <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '8px', display: 'inline-block', fontSize: '0.8rem', textAlign: 'left' }}>
                <code>1. Run in terminal: ollama serve</code><br />
                <code>2. Verify: curl http://localhost:11434/api/tags</code>
              </div>
            </div>
          ) : localData.models.length === 0 ? (
            <div className="card-glass" style={{ padding: '3rem', textAlign: 'center' }}>
              <HardDrive size={36} color="var(--accent-violet)" style={{ marginBottom: '0.75rem' }} />
              <h4>No Local Models Installed Yet</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '450px', margin: '0 auto 1.25rem' }}>
                You have not downloaded any models to your local Ollama daemon. Download a compact model to get started.
              </p>
              <button className="btn-primary" onClick={() => setPullModalOpen(true)}>
                <Download size={15} style={{ marginRight: '0.4rem' }} />
                Download Recommended Model (Llama 3.2 1B)
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {localData.models.map(m => {
                const isActive = activeConfig.model === m.name;
                return (
                  <div key={m.name} className="card-glass" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: isActive ? 'var(--accent-emerald-glow)' : 'rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Terminal size={18} color={isActive ? 'var(--accent-emerald)' : 'var(--accent-violet)'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{m.name}</h4>
                          {isActive && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active ORBIT Model</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.75rem' }}>
                          <span>Size: <strong>{m.size_display}</strong></span>
                          <span>Format: <strong>{m.format}</strong></span>
                          <span>Family: <strong>{m.family}</strong></span>
                          <span>Quant: <strong>{m.quantization_level}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => handleInspectModel(m.name)}
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                      >
                        <Info size={13} style={{ marginRight: '0.3rem' }} />
                        Inspect
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => { setTestModelName(m.name); setActiveTab('testbench'); }}
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
                      >
                        <Play size={13} style={{ marginRight: '0.3rem' }} />
                        Test
                      </button>

                      {!isActive && (
                        <button
                          className="btn-secondary"
                          onClick={() => handleSetActiveModel(m.name)}
                          style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem', color: 'var(--accent-cyan)' }}
                        >
                          Set Active
                        </button>
                      )}

                      <button
                        className="btn-secondary"
                        onClick={() => setDeleteConfirmModel(m.name)}
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem', color: '#ef4444' }}
                        title="Delete from local storage"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------------------- */}
      {/* 3. MODEL COMPARISON SUB-TAB */}
      {/* -------------------------------------------------------------------------------------- */}
      {activeTab === 'compare' && (
        <div>
          <div className="card-glass" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Compare Model Architectures</h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Select 2 to 4 models from the catalogue to compare reasoning, context lengths, benchmarks, and memory requirements.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {CATALOG_MODELS.map(m => {
                const isSelected = compareModelIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (isSelected) {
                        setCompareModelIds(prev => prev.filter(id => id !== m.id));
                      } else {
                        if (compareModelIds.length >= 4) {
                          alert('You can compare a maximum of 4 models simultaneously.');
                          return;
                        }
                        setCompareModelIds(prev => [...prev, m.id]);
                      }
                    }}
                    className={`btn-secondary ${isSelected ? 'active' : ''}`}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      border: isSelected ? '1px solid var(--accent-violet)' : '1px solid var(--border-glass)',
                      background: isSelected ? 'var(--accent-violet-glow)' : 'transparent',
                      color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)'
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '} {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          {comparisonDetails.length === 0 ? (
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <Scale size={32} color="var(--accent-violet)" style={{ marginBottom: '0.5rem' }} />
              <p>Select at least 2 models above to render the side-by-side comparison matrix.</p>
            </div>
          ) : (
            <div className="card-glass" style={{ padding: '1rem', overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', width: '200px' }}>Dimension</th>
                    {comparisonDetails.map(m => (
                      <th key={m.id} style={{ padding: '0.75rem', textAlign: 'left', minWidth: '220px' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700' }}>{m.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-violet)' }}>{m.publisher}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-glass-subtle)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: '600' }}>Parameter Size</td>
                    {comparisonDetails.map(m => <td key={m.id} style={{ padding: '0.65rem' }}>{m.parameter_size}</td>)}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-glass-subtle)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: '600' }}>Download Size</td>
                    {comparisonDetails.map(m => <td key={m.id} style={{ padding: '0.65rem' }}>{m.size_display}</td>)}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-glass-subtle)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: '600' }}>Context Window</td>
                    {comparisonDetails.map(m => <td key={m.id} style={{ padding: '0.65rem' }}>{Math.round((m.context_length || 32768) / 1024)}k tokens</td>)}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-glass-subtle)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: '600' }}>VRAM Requirement</td>
                    {comparisonDetails.map(m => <td key={m.id} style={{ padding: '0.65rem' }}>{m.vram_rec_gb} GB</td>)}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-glass-subtle)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: '600' }}>RTX 3050 6GB Fit</td>
                    {comparisonDetails.map(m => (
                      <td key={m.id} style={{ padding: '0.65rem' }}>
                        <span className={`badge ${m.fits_rtx_3050_6gb ? 'badge-success' : 'badge-amber'}`}>
                          {m.fits_rtx_3050_6gb ? '✓ Full GPU' : '⚡ Partial RAM'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-glass-subtle)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: '600' }}>Published Benchmarks</td>
                    {comparisonDetails.map(m => (
                      <td key={m.id} style={{ padding: '0.65rem', fontSize: '0.72rem' }}>
                        {m.benchmarks ? (
                          <div>
                            {m.benchmarks.humaneval && <div>HumanEval: <strong>{m.benchmarks.humaneval}%</strong></div>}
                            {m.benchmarks.mmlu && <div>MMLU: <strong>{m.benchmarks.mmlu}%</strong></div>}
                            {m.benchmarks.gsm8k && <div>GSM8K: <strong>{m.benchmarks.gsm8k}%</strong></div>}
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({m.benchmarks.source_type})</span>
                          </div>
                        ) : 'Not documented'}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-glass-subtle)' }}>
                    <td style={{ padding: '0.65rem', fontWeight: '600' }}>License</td>
                    {comparisonDetails.map(m => <td key={m.id} style={{ padding: '0.65rem', fontSize: '0.72rem' }}>{m.license}</td>)}
                  </tr>
                </tbody>
              </table>

              {/* Save Comparison Session */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Optional comparison title (e.g. 7B Coder Showdown)..."
                  value={comparisonTitle}
                  onChange={(e) => setComparisonTitle(e.target.value)}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                />
                <button className="btn-primary" onClick={handleSaveComparisonSession} style={{ fontSize: '0.8rem' }}>
                  Save Comparison Session
                </button>
              </div>
            </div>
          )}

          {/* Historical Saved Comparisons */}
          {savedComparisons.length > 0 && (
            <div className="card-glass" style={{ padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Saved Comparison History</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {savedComparisons.map(c => (
                  <div key={c.id} style={{ padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>{c.title}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.models.join(', ')} • {new Date(c.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------------------- */}
      {/* 4. HARDWARE ADVISOR SUB-TAB */}
      {/* -------------------------------------------------------------------------------------- */}
      {activeTab === 'recommend' && (
        <div>
          <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: '700' }}>Hardware-Aware Model Advisor</h4>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Evaluate your rig's memory constraints and receive a ranked shortlist of models optimized for your task.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Task Selector */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', display: 'block' }}>Target Task</label>
                <select className="input-glass" value={recTask} onChange={(e) => setRecTask(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }}>
                  <option value="coding">Coding & Software Engineering</option>
                  <option value="dsa_tutor">DSA & Algorithmic Tutoring</option>
                  <option value="full_stack_dev">Full-Stack Scaffolding</option>
                  <option value="rag">RAG Document Q&A</option>
                  <option value="reasoning">Math & Chain-of-Thought</option>
                  <option value="summarization">General Summarization</option>
                </select>
              </div>

              {/* Hardware Preset Selector */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', display: 'block' }}>Hardware Profile</label>
                <select className="input-glass" value={recPreset} onChange={(e) => handlePresetChange(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }}>
                  <option value="hp_victus">HP Victus Laptop (i7 + RTX 3050 6GB VRAM)</option>
                  <option value="budget_laptop">Integrated GPU Laptop (8GB RAM, CPU-only)</option>
                  <option value="pro_workstation">Pro Workstation (RTX 4070 12GB VRAM)</option>
                </select>
              </div>

              {/* Speed Preference */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', display: 'block' }}>Optimization Preference</label>
                <select className="input-glass" value={recSpeed} onChange={(e) => setRecSpeed(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }}>
                  <option value="balanced">Balanced (Optimal Trade-off)</option>
                  <option value="fast">Maximum Speed (1B-3B Models)</option>
                  <option value="quality">Deepest Reasoning (7B-8B Models)</option>
                </select>
              </div>

              {/* License Constraint */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', display: 'block' }}>License Requirement</label>
                <select className="input-glass" value={recLicense} onChange={(e) => setRecLicense(e.target.value)} style={{ width: '100%', fontSize: '0.82rem' }}>
                  <option value="any">Any Free Open-Weights License</option>
                  <option value="permissive">Strictly Permissive (MIT / Apache 2.0)</option>
                </select>
              </div>
            </div>

            {/* Hardware Values Inputs */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>VRAM: </span>
                <strong>{recVram} GB</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>System RAM: </span>
                <strong>{recRam} GB</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Available Disk: </span>
                <strong>{recDisk} GB</strong>
              </div>
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Preset: <em>{recPreset === 'hp_victus' ? 'HP Victus (RTX 3050)' : recPreset}</em>
              </span>
            </div>

            <button className="btn-primary" onClick={handleGenerateRecommendations} disabled={loadingRecs} style={{ width: '100%' }}>
              <Sparkles size={16} style={{ marginRight: '0.5rem' }} />
              {loadingRecs ? 'Calculating Hardware Fit...' : 'Generate Ranked Recommendations'}
            </button>
          </div>

          {/* Recommendations Output */}
          {recommendations && (
            <div>
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(124, 58, 237, 0.08)', borderRadius: '8px', borderLeft: '3px solid var(--accent-violet)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong>Evaluated Configuration:</strong> {recommendations.hardware_evaluated?.preset_match} ({recommendations.hardware_evaluated?.vram_gb} GB VRAM / {recommendations.hardware_evaluated?.system_ram_gb} GB RAM).
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{recommendations.disclaimer}</div>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {recommendations.recommendations?.map((rec, idx) => (
                  <div key={rec.model_id} className="card-glass" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{rec.name}</h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-violet)' }}>{rec.publisher}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span className={`badge ${rec.fit_badge === 'fit_gpu' ? 'badge-success' : 'badge-amber'}`}>
                          {rec.memory_fit}
                        </span>
                        <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                          Match Score: {rec.score}/100
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      {rec.why_recommended}
                    </p>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.72rem', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                      <div><strong>Estimated Speed:</strong> <span style={{ color: 'var(--accent-emerald)' }}>{rec.speed_estimate}</span></div>
                      <div><strong>Trade-off:</strong> <span style={{ color: 'var(--text-muted)' }}>{rec.expected_compromise}</span></div>
                      <div><strong>Requirements:</strong> <span style={{ color: 'var(--text-muted)' }}>{rec.resource_requirements?.vram_recommended_gb}GB VRAM / {rec.resource_requirements?.disk_gb}GB Disk</span></div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => { setLearningModelId(rec.model_id); setActiveTab('learning'); }}
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                      >
                        <BookOpen size={13} style={{ marginRight: '0.3rem' }} />
                        Read Learning Guide
                      </button>

                      <button
                        className="btn-primary"
                        onClick={() => { setPullModelName(rec.ollama_tag); setPullModalOpen(true); }}
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                      >
                        <Download size={13} style={{ marginRight: '0.3rem' }} />
                        Install via Ollama
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------------------- */}
      {/* 5. LEARNING CENTER SUB-TAB */}
      {/* -------------------------------------------------------------------------------------- */}
      {activeTab === 'learning' && (
        <div>
          {/* Model Selector Pill Bar */}
          <div className="card-glass" style={{ padding: '0.75rem', marginBottom: '1.25rem', display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
            {CATALOG_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setLearningModelId(m.id)}
                className={`btn-secondary ${learningModelId === m.id ? 'active' : ''}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  whiteSpace: 'nowrap',
                  borderRadius: '6px',
                  background: learningModelId === m.id ? 'var(--accent-violet-glow)' : 'transparent',
                  border: learningModelId === m.id ? '1px solid var(--accent-violet)' : '1px solid transparent'
                }}
              >
                {m.name}
              </button>
            ))}
          </div>

          {learningModelCard ? (
            <div className="card-glass" style={{ padding: '1.5rem' }}>
              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem', marginBottom: '0.4rem' }}>{learningModelCard.family}</span>
                <h3 style={{ margin: '0.2rem 0', fontSize: '1.4rem', fontWeight: '800' }}>{learningModelCard.name}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{learningModelCard.description}</p>
              </div>

              {/* Learning Sections */}
              <div style={{ display: 'grid', gap: '1.25rem', fontSize: '0.82rem' }}>
                {/* 1. Architecture Overview */}
                <div>
                  <h4 style={{ margin: '0 0 0.4rem', color: 'var(--accent-violet)', fontSize: '0.95rem' }}>1. Architectural Overview</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {learningModelCard.learning_guide?.overview}
                  </p>
                </div>

                {/* 2. Strengths and Limitations */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'rgba(5, 150, 105, 0.05)', padding: '0.85rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-emerald)' }}>
                    <strong style={{ color: 'var(--accent-emerald)' }}>Strengths:</strong>
                    <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                      {learningModelCard.learning_guide?.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  <div style={{ background: 'rgba(217, 119, 6, 0.05)', padding: '0.85rem', borderRadius: '8px', borderLeft: '3px solid var(--accent-amber)' }}>
                    <strong style={{ color: 'var(--accent-amber)' }}>Limitations:</strong>
                    <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                      {learningModelCard.learning_guide?.limitations?.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  </div>
                </div>

                {/* 3. Hardware & Memory Footprint */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 0.4rem', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>2. Hardware & VRAM Allocation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>Recommended VRAM: <strong>{learningModelCard.vram_rec_gb} GB</strong></div>
                    <div>Minimum System RAM: <strong>{learningModelCard.ram_min_gb} GB</strong></div>
                    <div>Download / Disk Size: <strong>{learningModelCard.size_display}</strong></div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {learningModelCard.gpu_fit_note}
                  </p>
                </div>

                {/* 4. Prompt Engineering & Best Practices */}
                <div>
                  <h4 style={{ margin: '0 0 0.4rem', color: 'var(--accent-magenta)', fontSize: '0.95rem' }}>3. Prompt Engineering Pattern</h4>
                  <pre style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    {learningModelCard.learning_guide?.prompt_pattern}
                  </pre>
                </div>

                {/* 5. ORBIT AI Integrated Workflow */}
                <div>
                  <h4 style={{ margin: '0 0 0.4rem', color: 'var(--accent-indigo)', fontSize: '0.95rem' }}>4. Role Inside ORBIT AI</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {learningModelCard.learning_guide?.orbit_workflow}
                  </p>
                </div>

                {/* 6. Setup Command */}
                <div>
                  <h4 style={{ margin: '0 0 0.4rem', color: 'var(--accent-violet)', fontSize: '0.95rem' }}>5. Terminal Execution Command</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <code style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', flex: 1 }}>
                      {learningModelCard.learning_guide?.local_setup_command}
                    </code>
                    <button
                      className="btn-primary"
                      onClick={() => { setPullModelName(learningModelCard.ollama_tag); setPullModalOpen(true); }}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Download size={13} style={{ marginRight: '0.3rem' }} />
                      Install Now
                    </button>
                  </div>
                </div>

                {/* 7. License and Privacy */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                  <strong>License & Privacy Terms:</strong> {learningModelCard.license}. Model weights execute completely offline on local hardware with zero telemetry sent to cloud providers.
                </div>
              </div>
            </div>
          ) : (
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Select a model to view its learning guide.</p>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------------------- */}
      {/* 6. MODEL TEST BENCH SUB-TAB */}
      {/* -------------------------------------------------------------------------------------- */}
      {activeTab === 'testbench' && (
        <div>
          <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: '700' }}>Local Model Testing Bench</h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Execute prompts directly against installed local models and measure real-time latency and token generation speed.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              {/* Select Installed Model */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', display: 'block' }}>Target Model</label>
                <select
                  className="input-glass"
                  value={testModelName}
                  onChange={(e) => setTestModelName(e.target.value)}
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  {localData.models?.length > 0 ? (
                    localData.models.map(m => <option key={m.name} value={m.name}>{m.name} ({m.size_display})</option>)
                  ) : (
                    <option value="">No local models installed (Ollama offline or empty)</option>
                  )}
                </select>
              </div>

              {/* Category Preset */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', display: 'block' }}>Prompt Preset</label>
                <select
                  className="input-glass"
                  value={testCategory}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setTestCategory(cat);
                    if (cat === 'coding') setTestPrompt('Implement a binary search function in C++ with boundary condition explanations.');
                    if (cat === 'debugging') setTestPrompt('Debug this Python function: def is_palindrome(s): return s == s[1:]');
                    if (cat === 'dsa') setTestPrompt('Explain the difference between Dijkstra and A* algorithms with graph intuition.');
                    if (cat === 'reasoning') setTestPrompt('If a train leaves Station A at 60 mph and another leaves Station B at 90 mph 150 miles apart, when do they meet?');
                  }}
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  <option value="coding">Coding (C++ Implementation)</option>
                  <option value="debugging">Debugging (Python Off-by-one)</option>
                  <option value="dsa">DSA Algorithmic Intuition</option>
                  <option value="reasoning">Mathematical Reasoning</option>
                  <option value="custom">Custom Prompt</option>
                </select>
              </div>
            </div>

            {/* Prompt Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', display: 'block' }}>Evaluation Prompt</label>
              <textarea
                className="input-glass"
                rows={3}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical' }}
              />
            </div>

            <button
              className="btn-primary"
              onClick={handleRunModelTest}
              disabled={testRunning || !testModelName}
              style={{ width: '100%' }}
            >
              {testRunning ? (
                <>
                  <RefreshCw className="spin" size={15} style={{ marginRight: '0.4rem' }} />
                  Generating Local Inference...
                </>
              ) : (
                <>
                  <Play size={15} style={{ marginRight: '0.4rem' }} />
                  Run Live Benchmark Test
                </>
              )}
            </button>
          </div>

          {/* Test Results Output */}
          {testResult && (
            <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>Inference Output: {testResult.model}</h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real latency measurement from local Ollama daemon</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                    <Clock size={12} style={{ marginRight: '0.3rem' }} />
                    {testResult.duration_ms} ms
                  </span>
                  {testResult.tokens_per_second > 0 && (
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      <Zap size={12} style={{ marginRight: '0.3rem' }} />
                      {testResult.tokens_per_second} tokens/sec
                    </span>
                  )}
                </div>
              </div>

              {/* Output Content */}
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px', fontSize: '0.82rem', maxHeight: '400px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.5', marginBottom: '1rem' }}>
                {testResult.response || testResult.error}
              </div>

              {/* Interactive Rubric Evaluation */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '8px', borderTop: '1px solid var(--border-glass)' }}>
                <strong style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>Quality Rubric Evaluation (Score 1-5):</strong>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
                  <div>
                    <span>Correctness: </span>
                    <select
                      className="input-glass"
                      value={rubricScores.correctness}
                      onChange={(e) => setRubricScores(prev => ({ ...prev, correctness: parseInt(e.target.value) }))}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                    </select>
                  </div>

                  <div>
                    <span>Explanation: </span>
                    <select
                      className="input-glass"
                      value={rubricScores.explanation}
                      onChange={(e) => setRubricScores(prev => ({ ...prev, explanation: parseInt(e.target.value) }))}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                    </select>
                  </div>

                  <div>
                    <span>Code Quality: </span>
                    <select
                      className="input-glass"
                      value={rubricScores.code_quality}
                      onChange={(e) => setRubricScores(prev => ({ ...prev, code_quality: parseInt(e.target.value) }))}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v} Stars</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Notes (e.g., Clean syntax, accurate edge cases)..."
                    value={rubricScores.notes}
                    onChange={(e) => setRubricScores(prev => ({ ...prev, notes: e.target.value }))}
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  />
                  <button className="btn-secondary" onClick={handleSaveRubric} style={{ fontSize: '0.75rem' }}>
                    Save Evaluation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test History */}
          {testHistory.length > 0 && (
            <div className="card-glass" style={{ padding: '1rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Recent Test Traces (SQLite)</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {testHistory.map(t => (
                  <div key={t.id} style={{ padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <strong>{t.model_name} ({t.category})</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{t.duration_ms} ms • {t.tokens_per_second} tps</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Prompt: {t.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------------------------- */}
      {/* MODALS */}
      {/* -------------------------------------------------------------------------------------- */}

      {/* 1. Pull Model Modal */}
      {pullModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card-glass" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Install Local Ollama Model</h4>
              <button className="btn-icon" onClick={() => { setPullModalOpen(false); setIsPulling(false); }}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Downloads real open-weights model files into your local Ollama repository. Requires an active internet connection.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.3rem', display: 'block' }}>Ollama Model Tag</label>
              <input
                type="text"
                className="input-glass"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                placeholder="e.g. llama3.2:1b, qwen2.5-coder:7b"
                disabled={isPulling}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            {/* Storage Pre-check Warning */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '1rem' }}>
              <div>Available Free Disk: <strong>{localData.storage?.free_gb || 0} GB</strong></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
                Downloading requires sufficient disk space. Model files range from 1.0 GB to 5.0 GB.
              </div>
            </div>

            {/* Live Progress Bar if pulling */}
            {isPulling && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                  <span>{pullProgress?.status || 'Connecting to Ollama registry...'}</span>
                  <span>{pullProgress?.percent || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pullProgress?.percent || 5}%`,
                      height: '100%',
                      background: 'var(--gradient-primary)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setPullModalOpen(false); setIsPulling(false); }} disabled={isPulling}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={isPulling || !pullModelName}
                onClick={async () => {
                  try {
                    setIsPulling(true);
                    setPullProgress({ status: 'Starting download...', percent: 0 });

                    // Connect to SSE stream
                    const response = await fetch(`/api/models/local/pull`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ model_name: pullModelName, confirmed: true })
                    });

                    if (!response.ok) {
                      throw new Error(`Pull request failed (HTTP ${response.status})`);
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    while (true) {
                      const { value, done } = await reader.read();
                      if (done) break;
                      const text = decoder.decode(value);
                      const lines = text.split('\n');
                      for (const line of lines) {
                        if (line.startsWith('data: ')) {
                          const jsonStr = line.substring(6).trim();
                          if (jsonStr) {
                            try {
                              const data = JSON.parse(jsonStr);
                              if (data.status === 'error') {
                                alert(`Download error: ${data.error}`);
                                setIsPulling(false);
                                return;
                              }
                              setPullProgress(data);
                              if (data.status === 'success') {
                                alert(`Model '${pullModelName}' downloaded successfully!`);
                                setIsPulling(false);
                                setPullModalOpen(false);
                                fetchLocalModels();
                                return;
                              }
                            } catch {}
                          }
                        }
                      }
                    }

                    setIsPulling(false);
                    fetchLocalModels();
                  } catch (err) {
                    alert(`Download failed: ${err.message}`);
                    setIsPulling(false);
                  }
                }}
              >
                {isPulling ? 'Downloading...' : 'Confirm & Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Inspect Model Modal */}
      {inspectModalData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card-glass" style={{ maxWidth: '600px', width: '100%', padding: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Model Inspection: {inspectModalData.name}</h4>
              <button className="btn-icon" onClick={() => setInspectModalData(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div>
                <strong>Format:</strong> {inspectModalData.details?.format} ({inspectModalData.details?.quantization_level})
              </div>
              <div>
                <strong>Family:</strong> {inspectModalData.details?.family}
              </div>
              <div>
                <strong>Parameters:</strong> {inspectModalData.details?.parameter_size}
              </div>
              {inspectModalData.system && (
                <div>
                  <strong>Default System Prompt:</strong>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                    {inspectModalData.system}
                  </pre>
                </div>
              )}
              {inspectModalData.template && (
                <div>
                  <strong>Chat Template:</strong>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.72rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {inspectModalData.template}
                  </pre>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button className="btn-secondary" onClick={() => setInspectModalData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deleteConfirmModel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card-glass" style={{ maxWidth: '420px', width: '100%', padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444' }}>Delete Local Model File?</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Are you sure you want to permanently delete <strong>'{deleteConfirmModel}'</strong> from your local Ollama storage? This will remove several gigabytes of model weights from disk.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDeleteConfirmModel(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleDeleteModel} style={{ background: '#ef4444' }}>
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelLibrary;

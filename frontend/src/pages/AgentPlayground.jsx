import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Wrench, 
  Sparkles, 
  Zap, 
  Bookmark, 
  Cpu, 
  RefreshCw,
  XCircle,
  HelpCircle,
  Play
} from 'lucide-react';
import { api } from '../services/api';

export function AgentPlayground({ systemStatus, onRefresh }) {
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [pastRuns, setPastRuns] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [error, setError] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('demo');

  const configuredModel = systemStatus?.ai_service?.configured_model || 'llama3';
  const ollamaReachable = Boolean(systemStatus?.ai_service?.ollama_reachable);
  const ollamaInstalledModels = systemStatus?.ai_service?.ollama_installed_models || [];
  const isModelInstalled = systemStatus?.ai_service?.ollama_model_installed ?? false;

  useEffect(() => {
    loadTools();
    loadPastRuns();
  }, []);

  const loadTools = async () => {
    try {
      const res = await api.getTools();
      setAvailableTools(res.data?.tools || []);
    } catch (e) {
      console.error('Failed to load tools:', e);
    }
  };

  const loadPastRuns = async () => {
    try {
      const res = await api.getAgentRuns();
      setPastRuns(res.data || []);
      if (res.data && res.data.length > 0 && !currentRun) {
        loadRunDetails(res.data[0].id);
      }
    } catch (e) {
      console.error('Failed to load past runs:', e);
    }
  };

  const loadRunDetails = async (runId) => {
    try {
      const res = await api.getAgentRun(runId);
      setCurrentRun(res.data);
    } catch (e) {
      console.error('Failed to load run details:', e);
    }
  };

  const handleSubmit = async (messageText) => {
    const textToSend = messageText || prompt;
    if (!textToSend.trim()) return;

    try {
      setRunning(true);
      setError(null);
      const res = await api.runAgent({ 
        message: textToSend.trim(), 
        provider: selectedProvider,
        maxSteps: 5 
      });
      setCurrentRun(res.data);
      if (res.data?.status === 'failed' && res.data?.error_message) {
        setError(res.data.error_message);
      }
      setPrompt('');
      await loadPastRuns();
    } catch (err) {
      setError(err.message);
      await loadPastRuns();
    } finally {
      setRunning(false);
    }
  };

  const starterPrompts = [
    { label: 'Generate Quiz (RAG)', text: 'Generate a 3-question quiz on RAG retrieval principles using the knowledge available in ORBIT AI.' },
    { label: 'Search Knowledge', text: 'Search knowledge base for workflow engine features' },
    { label: 'Summarize Spec', text: 'Summarize document #1 architectural specifications' },
    { label: 'Mars Test (Out of domain)', text: 'Generate a 3-question quiz on the current population of Mars' },
    { label: 'Structured Analysis', text: 'Extract and format a structured result with key takeaways for ORBIT AI' }
  ];

  return (
    <div className="page-container">
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ wordBreak: 'break-word' }}>{error}</span>
        </div>
      )}

      {/* Main Grid: Left = Chat & Inputs, Right = Observable Execution Trace */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        
        {/* Left Column: Conversational Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Bot size={18} color="var(--accent-violet)" />
                <div>
                  <h3 className="card-title">Agent Prompt Console</h3>
                  <p className="card-subtitle">Self-directed loop with bounded tool authorization</p>
                </div>
              </div>
              <span className="badge badge-magenta">
                <Zap size={11} /> Max 5 Steps
              </span>
            </div>

            {/* AI Provider Runtime Selector */}
            <div 
              style={{
                padding: '0.9rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid var(--border-glass)',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Execution Runtime Provider
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Target Model:</span>
                  <code style={{ 
                    padding: '0.15rem 0.45rem', 
                    borderRadius: '5px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                    color: selectedProvider === 'ollama' ? 'var(--accent-cyan-light)' : 'var(--accent-magenta-light)',
                    border: '1px solid var(--border-glass-subtle)'
                  }}>
                    {selectedProvider === 'ollama' ? configuredModel : 'deterministic-engine'}
                  </code>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedProvider('demo')}
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: selectedProvider === 'demo' ? '1px solid var(--accent-magenta)' : '1px solid var(--border-glass)',
                    backgroundColor: selectedProvider === 'demo' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: selectedProvider === 'demo' ? '#ffffff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: selectedProvider === 'demo' ? 600 : 400,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Sparkles size={14} color={selectedProvider === 'demo' ? 'var(--accent-magenta-light)' : 'var(--text-dim)'} />
                  <span>Demo Mode <small style={{ opacity: 0.7 }}>(Grounded)</small></span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider('ollama')}
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: selectedProvider === 'ollama' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                    backgroundColor: selectedProvider === 'ollama' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    color: selectedProvider === 'ollama' ? '#ffffff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: selectedProvider === 'ollama' ? 600 : 400,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Cpu size={14} color={selectedProvider === 'ollama' ? 'var(--accent-cyan-light)' : 'var(--text-dim)'} />
                  <span>Ollama Mode <small style={{ opacity: 0.7 }}>(Local LLM)</small></span>
                </button>
              </div>
            </div>

            {/* Ollama Unreachable Warning Banner */}
            {selectedProvider === 'ollama' && !ollamaReachable && (
              <div 
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  lineHeight: 1.5
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-amber-light)', fontWeight: 700 }}>
                    <AlertCircle size={15} />
                    <span>Ollama Daemon Unreachable (http://localhost:11434)</span>
                  </div>
                  {onRefresh && (
                    <button 
                      type="button" 
                      onClick={onRefresh} 
                      className="btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}
                    >
                      <RefreshCw size={11} /> Check Connection
                    </button>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  To run live local agent inference, start the local Ollama background server and ensure <code>{configuredModel}</code> is installed:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <code style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', backgroundColor: 'rgba(4, 7, 15, 0.75)', color: '#a7f3d0', fontSize: '0.75rem', border: '1px solid var(--border-glass-subtle)' }}>
                    ollama serve
                  </code>
                  <code style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', backgroundColor: 'rgba(4, 7, 15, 0.75)', color: '#93c5fd', fontSize: '0.75rem', border: '1px solid var(--border-glass-subtle)' }}>
                    ollama pull {configuredModel}
                  </code>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Note: Submitting prompts will test the local endpoint directly without falling back to Demo Mode.
                </p>
              </div>
            )}

            {/* Quick Starter Prompts */}
            <div style={{ marginBottom: '1.15rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Test Instructions & Quiz Prompts:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {starterPrompts.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => handleSubmit(p.text)}
                    disabled={running}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', borderRadius: '8px' }}
                  >
                    <Sparkles size={11} color="var(--accent-magenta-light)" />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder={`Instruct the agent using ${selectedProvider === 'ollama' ? 'Ollama' : 'Demo'} mode...`}
                disabled={running}
              />
              <button
                onClick={() => handleSubmit()}
                className="btn-primary"
                disabled={running || !prompt.trim()}
                style={{ flexShrink: 0, padding: '0.6rem 1.15rem' }}
              >
                {running ? <Clock size={16} className="spin" /> : <Send size={16} />}
              </button>
            </div>

            {/* Current or Selected Response */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentRun ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>User Prompt:</span>
                    <strong style={{ color: 'var(--text-main)', wordBreak: 'break-word' }}>"{currentRun.user_prompt}"</strong>
                  </div>

                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(11, 17, 32, 0.75)',
                      border: currentRun.status === 'failed' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-glass)',
                      lineHeight: 1.6,
                      fontSize: '0.875rem',
                      boxShadow: 'var(--shadow-glass-card)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: currentRun.provider === 'ollama' ? 'var(--accent-cyan-light)' : 'var(--accent-magenta-light)', fontWeight: 700, letterSpacing: '0.5px' }}>
                        Agent Response ({currentRun.provider || selectedProvider} mode)
                      </span>
                      <span className={`badge ${currentRun.status === 'failed' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                        {currentRun.status}
                      </span>
                    </div>
                    
                    <div style={{ whiteSpace: 'pre-wrap', color: currentRun.status === 'failed' ? 'var(--accent-rose-light)' : 'var(--text-main)', wordBreak: 'break-word', lineHeight: 1.7 }}>
                      {currentRun.final_response}
                    </div>
                  </div>

                  {/* Execution Summary Pill */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      gap: '0.75rem', 
                      fontSize: '0.75rem', 
                      color: 'var(--text-muted)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass-subtle)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span>Duration: <strong style={{ color: 'var(--accent-emerald-light)' }}>{currentRun.duration_ms} ms</strong></span>
                    <span>•</span>
                    <span>Steps: <strong style={{ color: 'var(--accent-cyan-light)' }}>{currentRun.total_steps || currentRun.steps?.length || 0}</strong></span>
                    <span>•</span>
                    <span>Provider: <strong style={{ color: currentRun.provider === 'ollama' ? 'var(--accent-cyan-light)' : 'var(--accent-magenta-light)' }}>{currentRun.provider}</strong></span>
                    {currentRun.model && (
                      <>
                        <span>•</span>
                        <span>Model: <strong style={{ color: 'var(--text-main)' }}>{currentRun.model}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                  <Bot size={36} className="empty-state-icon" />
                  <div className="empty-state-title">Agent is Ready</div>
                  <div className="empty-state-desc">Select an instruction or type a prompt above to observe reasoning and tool calls.</div>
                </div>
              )}
            </div>

            {/* Past Runs Selector */}
            {pastRuns.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recent Runs History
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto' }}>
                  {pastRuns.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => loadRunDetails(r.id)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: currentRun?.id === r.id ? 'rgba(139, 92, 246, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${currentRun?.id === r.id ? 'rgba(139, 92, 246, 0.45)' : 'transparent'}`,
                        cursor: 'pointer',
                        fontSize: '0.775rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                        <span className={`badge ${r.provider === 'ollama' ? 'badge-cyan' : 'badge-magenta'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                          {r.provider}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', color: currentRun?.id === r.id ? '#fff' : 'var(--text-secondary)' }}>
                          {r.user_prompt}
                        </span>
                      </div>
                      <span className={`badge ${r.status === 'failed' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.68rem', flexShrink: 0 }}>
                        {r.status === 'failed' ? 'Failed' : `${r.duration_ms}ms`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Execution Trace & Tool Observability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title-group">
                <Terminal size={18} color="var(--accent-cyan)" />
                <div>
                  <h3 className="card-title">Execution Trace & Observability</h3>
                  <p className="card-subtitle">
                    Runtime: <strong style={{ color: (currentRun?.provider || selectedProvider) === 'ollama' ? 'var(--accent-cyan-light)' : 'var(--accent-magenta-light)' }}>
                      {currentRun?.provider || selectedProvider}
                    </strong>
                    {' '}• Model: <strong style={{ color: 'var(--text-main)' }}>
                      {currentRun?.model || (selectedProvider === 'ollama' ? configuredModel : 'deterministic-engine')}
                    </strong>
                  </p>
                </div>
              </div>
              <span className={`badge ${currentRun?.status === 'failed' ? 'badge-danger' : 'badge-cyan'}`}>
                {currentRun?.status === 'failed' ? 'Failed' : `${currentRun?.steps?.length || 0} Step(s)`}
              </span>
            </div>

            {/* Run Failure Alert Banner */}
            {currentRun?.status === 'failed' && (
              <div 
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  fontSize: '0.825rem',
                  color: 'var(--accent-rose-light)'
                }}
              >
                <XCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Agent Execution Error:</strong>
                  <div style={{ marginTop: '0.2rem', wordBreak: 'break-word', color: 'var(--text-main)', fontSize: '0.785rem' }}>
                    {currentRun.error_message || currentRun.final_response}
                  </div>
                </div>
              </div>
            )}

            {!currentRun || !currentRun.steps || currentRun.steps.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
                <Wrench size={36} className="empty-state-icon" />
                <div className="empty-state-title">No Active Execution Trace</div>
                <div className="empty-state-desc">Trigger an agent run to inspect model thoughts, tool arguments, and verified outputs.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentRun.steps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: '12px',
                      backgroundColor: 'rgba(11, 17, 32, 0.75)',
                      border: step.status === 'failed' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-glass)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-glass-card)'
                    }}
                  >
                    {/* Step Header */}
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        borderBottom: '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span className="badge badge-magenta" style={{ fontSize: '0.72rem' }}>
                          Step #{step.step_number}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                          Tool: <code style={{ color: 'var(--accent-cyan-light)' }}>{step.tool_name}</code>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          {step.duration_ms} ms
                        </span>
                        {step.status === 'failed' ? (
                          <XCircle size={15} color="var(--accent-rose)" />
                        ) : (
                          <CheckCircle2 size={15} color="var(--accent-emerald)" />
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {/* Thought */}
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.3rem', letterSpacing: '0.5px' }}>
                          Operational Thought
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', wordBreak: 'break-word', lineHeight: 1.5 }}>
                          "{step.thought}"
                        </div>
                      </div>

                      {/* Tool Arguments */}
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.3rem', letterSpacing: '0.5px' }}>
                          Validated Arguments
                        </div>
                        <pre
                          style={{
                            backgroundColor: 'rgba(4, 7, 15, 0.85)',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.775rem',
                            color: '#93c5fd',
                            overflowX: 'auto',
                            border: '1px solid var(--border-glass-subtle)',
                            wordBreak: 'break-all'
                          }}
                        >
                          {JSON.stringify(step.tool_args, null, 2)}
                        </pre>
                      </div>

                      {/* Tool Result */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
                            Observed Tool Result
                          </span>
                          {step.tool_result?.retrieved_sources && (
                            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                              <Bookmark size={10} /> {step.tool_result.retrieved_sources.length} Source(s) Cited
                            </span>
                          )}
                          {step.tool_result?.passages && (
                            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                              <Bookmark size={10} /> {step.tool_result.passages.length} Passage(s) Found
                            </span>
                          )}
                        </div>

                        {step.tool_result?.error ? (
                          <div 
                            style={{ 
                              color: 'var(--accent-rose-light)', 
                              padding: '0.75rem', 
                              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                              borderRadius: '8px', 
                              fontSize: '0.775rem',
                              border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            <strong>Tool Error:</strong> {step.tool_result.error}
                          </div>
                        ) : (
                          <pre
                            style={{
                              backgroundColor: 'rgba(4, 7, 15, 0.85)',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.775rem',
                              color: '#a7f3d0',
                              maxHeight: '180px',
                              overflowY: 'auto',
                              border: '1px solid var(--border-glass-subtle)',
                              wordBreak: 'break-word'
                            }}
                          >
                            {JSON.stringify(step.tool_result, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AgentPlayground;

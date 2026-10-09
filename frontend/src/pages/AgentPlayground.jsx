import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Terminal, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Wrench, 
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export function AgentPlayground() {
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState(null);
  const [pastRuns, setPastRuns] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [error, setError] = useState(null);
  const [activeStepTab, setActiveStepTab] = useState(null);

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
        // Load details of most recent run
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
      if (res.data?.steps?.length > 0) {
        setActiveStepTab(0);
      }
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
      const res = await api.runAgent({ message: textToSend.trim(), provider: 'demo' });
      setCurrentRun(res.data);
      if (res.data?.steps?.length > 0) {
        setActiveStepTab(0);
      }
      setPrompt('');
      await loadPastRuns();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const starterPrompts = [
    { label: 'Search Knowledge', text: 'Search knowledge base for workflow engine features' },
    { label: 'Summarize Spec', text: 'Summarize document #1 architectural specifications' },
    { label: 'Generate Quiz', text: 'Generate a 3-question quiz on RAG retrieval principles' },
    { label: 'Structured Analysis', text: 'Extract and format a structured result with key takeaways for ORBIT AI' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left = Chat & Inputs, Right = Observable Execution Trace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        
        {/* Left Column: Conversational Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={18} color="var(--accent-violet)" />
                <h3 className="card-title">Agent Prompt Console</h3>
              </div>
              <span className="badge badge-purple">Bounded Tools (Max 5)</span>
            </div>

            {/* Quick Starter Prompts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1rem' }}>
              {starterPrompts.map((p, i) => (
                <button
                  key={i}
                  className="btn-secondary btn-sm"
                  onClick={() => handleSubmit(p.text)}
                  disabled={running}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  <Sparkles size={12} color="var(--accent-blue)" />
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="Instruct the agent (e.g. search, summarize, quiz)..."
                disabled={running}
              />
              <button
                onClick={() => handleSubmit()}
                className="btn-primary"
                disabled={running || !prompt.trim()}
              >
                {running ? <Clock size={16} className="spin" /> : <Send size={16} />}
              </button>
            </div>

            {/* Current or Selected Response */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentRun ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    User Prompt: <strong style={{ color: 'var(--text-main)' }}>"{currentRun.user_prompt}"</strong>
                  </div>

                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      lineHeight: 1.6,
                      fontSize: '0.875rem'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent-violet)', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Final Agent Output
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                      {currentRun.final_response}
                    </div>
                  </div>

                  {/* Execution Summary Tag */}
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <span>Duration: <strong>{currentRun.duration_ms} ms</strong></span>
                    <span>Steps Executed: <strong>{currentRun.total_steps || currentRun.steps?.length || 0}</strong></span>
                    <span>Provider: <strong>{currentRun.provider}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Bot size={36} className="empty-state-icon" />
                  <div>Select a prompt or ask the agent above.</div>
                </div>
              )}
            </div>

            {/* Past Runs Selector */}
            {pastRuns.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.45rem', fontWeight: 600 }}>
                  Recent Runs
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '110px', overflowY: 'auto' }}>
                  {pastRuns.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      onClick={() => loadRunDetails(r.id)}
                      style={{
                        padding: '0.4rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor: currentRun?.id === r.id ? 'var(--bg-card-hover)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.775rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {r.user_prompt}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                        {r.duration_ms}ms
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
          <div className="card" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={18} color="var(--accent-emerald)" />
                <h3 className="card-title">Execution Trace & Tool Observability</h3>
              </div>
              <span className="badge badge-info">
                {currentRun?.steps?.length || 0} Step(s)
              </span>
            </div>

            {!currentRun || !currentRun.steps || currentRun.steps.length === 0 ? (
              <div className="empty-state">
                <Wrench size={36} className="empty-state-icon" />
                <div>No tool calls in this execution.</div>
                <div style={{ fontSize: '0.75rem' }}>Execute an agent prompt to inspect reasoning steps and tool traces.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
                {currentRun.steps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Step Header */}
                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--bg-card)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                          Step #{step.step_number}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                          Tool: <code style={{ color: 'var(--accent-blue)' }}>{step.tool_name}</code>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                          {step.duration_ms} ms
                        </span>
                        <CheckCircle2 size={15} color="var(--accent-emerald)" />
                      </div>
                    </div>

                    <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {/* Thought */}
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.2rem' }}>
                          Reasoning Thought
                        </div>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "{step.thought}"
                        </div>
                      </div>

                      {/* Tool Arguments */}
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.2rem' }}>
                          Validated Arguments
                        </div>
                        <pre
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#93c5fd',
                            overflowX: 'auto',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {JSON.stringify(step.tool_args, null, 2)}
                        </pre>
                      </div>

                      {/* Tool Result */}
                      <div>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.2rem' }}>
                          Observed Tool Result
                        </div>
                        <pre
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#a7f3d0',
                            maxHeight: '160px',
                            overflowY: 'auto',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {JSON.stringify(step.tool_result, null, 2)}
                        </pre>
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

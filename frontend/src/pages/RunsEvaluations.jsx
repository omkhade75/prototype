import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  FileCheck2, 
  RefreshCw,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import Modal from '../components/Modal';

export function RunsEvaluations() {
  const [activeTab, setActiveTab] = useState('runs'); // 'runs' | 'evaluations'
  
  // Runs state
  const [runs, setRuns] = useState([]);
  const [typeFilter, setTypeFilter] = useState(''); // '' | 'workflow' | 'agent'
  const [selectedRun, setSelectedRun] = useState(null);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // Evaluations state
  const [evaluations, setEvaluations] = useState([]);
  const [latestEval, setLatestEval] = useState(null);
  const [runningEval, setRunningEval] = useState(false);
  const [evalError, setEvalError] = useState(null);

  useEffect(() => {
    loadRuns();
    loadEvaluations();
  }, [typeFilter]);

  const loadRuns = async () => {
    try {
      setLoadingRuns(true);
      const res = await api.getAllRuns(typeFilter);
      setRuns(res.data || []);
    } catch (e) {
      console.error('Failed to load runs:', e);
    } finally {
      setLoadingRuns(false);
    }
  };

  const loadEvaluations = async () => {
    try {
      const res = await api.getEvaluations();
      const list = res.data || [];
      setEvaluations(list);
      if (list.length > 0 && !latestEval) {
        setLatestEval(list[0]);
      }
    } catch (e) {
      console.error('Failed to load evaluations:', e);
    }
  };

  const handleInspectRun = async (run) => {
    try {
      if (run.execution_type === 'workflow') {
        const res = await api.getWorkflowRun(run.id);
        setSelectedRun({ ...res.data, execution_type: 'workflow' });
      } else {
        const res = await api.getAgentRun(run.id);
        setSelectedRun({ ...res.data, execution_type: 'agent' });
      }
    } catch (e) {
      console.error('Failed to fetch run details:', e);
    }
  };

  const handleRunEvaluationSuite = async () => {
    try {
      setRunningEval(true);
      setEvalError(null);
      const res = await api.runEvaluations();
      setLatestEval(res.data);
      await loadEvaluations();
    } catch (err) {
      setEvalError(err.message);
    } finally {
      setRunningEval(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('runs')}
          className={`btn-secondary ${activeTab === 'runs' ? 'btn-primary' : ''}`}
          style={{ padding: '0.45rem 1rem' }}
        >
          <Activity size={16} /> Execution Runs
        </button>
        <button
          onClick={() => setActiveTab('evaluations')}
          className={`btn-secondary ${activeTab === 'evaluations' ? 'btn-primary' : ''}`}
          style={{ padding: '0.45rem 1rem' }}
        >
          <FileCheck2 size={16} /> Evaluation Test Suite
        </button>
      </div>

      {/* --- TAB 1: EXECUTION RUNS --- */}
      {activeTab === 'runs' && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 className="card-title">All Execution Runs</h3>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ width: '160px', padding: '0.35rem 0.6rem', fontSize: '0.775rem' }}
              >
                <option value="">All Types</option>
                <option value="workflow">Workflows Only</option>
                <option value="agent">Agents Only</option>
              </select>
            </div>
            <button onClick={loadRuns} className="btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={14} className={loadingRuns ? 'spin' : ''} />
            </button>
          </div>

          {runs.length === 0 ? (
            <div className="empty-state">No execution runs recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Run ID / Name</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => {
                    const isWf = r.execution_type === 'workflow';
                    const name = isWf ? r.workflow_name : r.user_prompt;
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className={`badge ${isWf ? 'badge-info' : 'badge-purple'}`}>
                            {isWf ? 'Workflow' : 'Agent'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div>{name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 400 }}>{r.id}</div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              r.status === 'successful'
                                ? 'badge-success'
                                : r.status === 'waiting_for_approval'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {r.duration_ms} ms
                        </td>
                        <td style={{ color: 'var(--text-dim)', fontSize: '0.775rem' }}>
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td>
                          <button
                            onClick={() => handleInspectRun(r)}
                            className="btn-secondary btn-sm"
                            title="Inspect Run Trace"
                          >
                            <Eye size={14} /> Trace
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: EVALUATION TEST SUITE --- */}
      {activeTab === 'evaluations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {evalError && (
            <div className="alert alert-danger">
              <AlertTriangle size={18} />
              <span>{evalError}</span>
            </div>
          )}

          {/* Action Header Card */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 className="card-title">Deterministic Integrity Suite</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Runs real, measured tests against retrieval accuracy, hallucination prevention, guardrails, and approval state machines.
              </p>
            </div>
            <button
              onClick={handleRunEvaluationSuite}
              className="btn-primary"
              disabled={runningEval}
            >
              <Play size={16} /> {runningEval ? 'Executing Tests...' : 'Run Evaluation Suite'}
            </button>
          </div>

          {/* Latest Evaluation Results */}
          {latestEval && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{latestEval.suite_name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Evaluated on: {new Date(latestEval.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Score Summary Metrics */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div className="badge badge-success" style={{ fontSize: '0.825rem', padding: '0.35rem 0.75rem' }}>
                    Passed: {latestEval.passed_tests} / {latestEval.total_tests}
                  </div>
                  {latestEval.failed_tests > 0 && (
                    <div className="badge badge-danger" style={{ fontSize: '0.825rem', padding: '0.35rem 0.75rem' }}>
                      Failed: {latestEval.failed_tests}
                    </div>
                  )}
                  <div className="badge badge-info" style={{ fontSize: '0.825rem', padding: '0.35rem 0.75rem' }}>
                    Latency: {latestEval.duration_ms} ms
                  </div>
                </div>
              </div>

              {/* Test Cases Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Test Case</th>
                      <th>Category</th>
                      <th>Measured Latency</th>
                      <th>Expected vs Actual Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestEval.results?.map((t) => (
                      <tr key={t.id}>
                        <td>
                          {t.status === 'PASSED' ? (
                            <span className="badge badge-success">
                              <CheckCircle2 size={12} /> PASS
                            </span>
                          ) : (
                            <span className="badge badge-danger">
                              <XCircle size={12} /> FAIL
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <div>{t.name}</div>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 400 }}>{t.description}</div>
                        </td>
                        <td>
                          <span className="badge badge-purple">{t.category}</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {t.duration_ms} ms
                        </td>
                        <td style={{ fontSize: '0.775rem' }}>
                          <div><strong>Expected:</strong> <span style={{ color: '#93c5fd' }}>{t.details?.expected}</span></div>
                          <div><strong>Actual:</strong> <span style={{ color: '#a7f3d0' }}>{t.details?.actual}</span></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Run Trace Modal */}
      <Modal
        isOpen={Boolean(selectedRun)}
        onClose={() => setSelectedRun(null)}
        title={`Run Trace: ${selectedRun?.id}`}
        maxWidth="800px"
      >
        {selectedRun && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-info">{selectedRun.execution_type?.toUpperCase()}</span>
                <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{selectedRun.workflow_name || selectedRun.user_prompt}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge badge-success">{selectedRun.status}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedRun.duration_ms} ms</span>
              </div>
            </div>

            {/* Steps & Trace List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Step-by-step Trace ({selectedRun.steps?.length || 0} steps)
              </div>

              {selectedRun.steps?.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-violet)' }}>
                      Step #{s.step_number || idx + 1}: {s.tool_name || s.node_name || 'Step'}
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                      {s.duration_ms} ms
                    </span>
                  </div>

                  {s.thought && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.35rem' }}>
                      Thought: "{s.thought}"
                    </div>
                  )}

                  {s.tool_args && (
                    <pre style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '4px', fontSize: '0.72rem', color: '#93c5fd', marginBottom: '0.35rem' }}>
                      {JSON.stringify(s.tool_args, null, 2)}
                    </pre>
                  )}

                  {s.tool_result && (
                    <pre style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '4px', fontSize: '0.72rem', color: '#a7f3d0' }}>
                      {JSON.stringify(s.tool_result, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {/* Final Output */}
            {(selectedRun.output_data || selectedRun.final_response) && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.35rem' }}>
                  Execution Result
                </div>
                <pre
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.775rem',
                    color: '#a7f3d0',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}
                >
                  {typeof (selectedRun.output_data || selectedRun.final_response) === 'string'
                    ? selectedRun.output_data || selectedRun.final_response
                    : JSON.stringify(selectedRun.output_data || selectedRun.final_response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RunsEvaluations;

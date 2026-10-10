import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Play,
  Save,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
  Cpu,
  Layers,
  FileCheck,
  FolderOpen,
  Sparkles,
  RefreshCw,
  X,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

// --- Custom Flow Node Components with Glassmorphic Styling ---
const CustomNodeWrapper = ({ title, icon: Icon, color, children, isPaused }) => (
  <div
    style={{
      padding: '0.85rem 1rem',
      borderRadius: '12px',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `2px solid ${isPaused ? 'var(--accent-amber)' : color}`,
      color: 'var(--text-main)',
      minWidth: '200px',
      boxShadow: `0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 0 16px -4px ${color}40`,
      fontSize: '0.825rem',
      transition: 'all 0.2s ease-in-out'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>
      <div 
        style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '6px', 
          background: `${color}25`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color 
        }}
      >
        <Icon size={14} />
      </div>
      <span style={{ color: 'var(--text-main)' }}>{title}</span>
    </div>
    {children}
  </div>
);

const InputNode = ({ data }) => (
  <CustomNodeWrapper title="Input Node" icon={Layers} color="var(--accent-blue)">
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      {data.label || data.value || 'Data Input'}
    </div>
    <Handle 
      type="source" 
      position={Position.Right} 
      style={{ background: 'var(--accent-blue)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
  </CustomNodeWrapper>
);

const KnowledgeSearchNode = ({ data }) => (
  <CustomNodeWrapper title="Knowledge Search" icon={Search} color="var(--accent-cyan)">
    <Handle 
      type="target" 
      position={Position.Left} 
      style={{ background: 'var(--accent-cyan)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      Top-{data.topK || 2} Passages (TF-IDF)
    </div>
    <Handle 
      type="source" 
      position={Position.Right} 
      style={{ background: 'var(--accent-cyan)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
  </CustomNodeWrapper>
);

const AITaskNode = ({ data }) => (
  <CustomNodeWrapper title="AI Task" icon={Cpu} color="var(--accent-violet)">
    <Handle 
      type="target" 
      position={Position.Left} 
      style={{ background: 'var(--accent-violet)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      Task: <strong style={{ color: 'var(--accent-violet-light)' }}>{data.taskType || 'summarize'}</strong>
    </div>
    <Handle 
      type="source" 
      position={Position.Right} 
      style={{ background: 'var(--accent-violet)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
  </CustomNodeWrapper>
);

const ConditionNode = ({ data }) => (
  <CustomNodeWrapper title="Condition Check" icon={AlertTriangle} color="var(--accent-amber)">
    <Handle 
      type="target" 
      position={Position.Left} 
      style={{ background: 'var(--accent-amber)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      Op: <code style={{ color: 'var(--accent-amber-light)' }}>{data.operator || 'is_not_empty'}</code>
    </div>
    <Handle 
      type="source" 
      position={Position.Right} 
      style={{ background: 'var(--accent-amber)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
  </CustomNodeWrapper>
);

const HumanApprovalNode = ({ data }) => (
  <CustomNodeWrapper title="Human Approval" icon={UserCheck} color="var(--accent-amber)">
    <Handle 
      type="target" 
      position={Position.Left} 
      style={{ background: 'var(--accent-amber)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      Suspends execution for human sign-off
    </div>
    <Handle 
      type="source" 
      position={Position.Right} 
      style={{ background: 'var(--accent-amber)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
  </CustomNodeWrapper>
);

const OutputNode = ({ data }) => (
  <CustomNodeWrapper title="Output Node" icon={FileCheck} color="var(--accent-emerald)">
    <Handle 
      type="target" 
      position={Position.Left} 
      style={{ background: 'var(--accent-emerald)', width: '10px', height: '10px', border: '2px solid #fff' }} 
    />
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      {data.label || 'Saves Final Result'}
    </div>
  </CustomNodeWrapper>
);

export function WorkflowStudio() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [workflowName, setWorkflowName] = useState('My Custom Workflow');
  const [workflowDesc, setWorkflowDesc] = useState('');

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [executing, setExecuting] = useState(false);
  const [activeRun, setActiveRun] = useState(null);
  const [error, setError] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [nodeTypeToAdd, setNodeTypeToAdd] = useState('input');

  const nodeTypes = useMemo(() => ({
    input: InputNode,
    knowledge_search: KnowledgeSearchNode,
    ai_task: AITaskNode,
    condition: ConditionNode,
    human_approval: HumanApprovalNode,
    output: OutputNode
  }), []);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const res = await api.getWorkflows();
      const list = res.data || [];
      setWorkflows(list);
      if (list.length > 0 && !selectedWorkflowId) {
        selectWorkflow(list[0]);
      }
    } catch (e) {
      console.error('Failed to load workflows:', e);
    }
  };

  const selectWorkflow = (wf) => {
    setSelectedWorkflowId(wf.id);
    setWorkflowName(wf.name);
    setWorkflowDesc(wf.description || '');
    setNodes(wf.graph?.nodes || []);
    setEdges(wf.graph?.edges || []);
    setActiveRun(null);
    setError(null);
  };

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleAddNode = () => {
    const type = nodeTypeToAdd;
    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: 80 + (nodes.length % 5) * 60, y: 80 + (nodes.length % 5) * 50 },
      data: {
        label: `${type} Node`,
        value: type === 'input' ? 'Initial Input Text' : undefined,
        taskType: type === 'ai_task' ? 'summarize' : undefined,
        topK: type === 'knowledge_search' ? 2 : undefined,
        operator: type === 'condition' ? 'is_not_empty' : undefined,
        promptMessage: type === 'human_approval' ? 'Requires User Approval' : undefined
      }
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const handleSaveWorkflow = async () => {
    try {
      setError(null);
      const payload = {
        id: selectedWorkflowId,
        name: workflowName,
        description: workflowDesc,
        graph: { nodes, edges }
      };
      await api.saveWorkflow(payload);
      alert('Workflow saved successfully!');
      await loadWorkflows();
    } catch (err) {
      setError(`Save failed: ${err.message}`);
    }
  };

  const handleExecuteWorkflow = async () => {
    try {
      setExecuting(true);
      setError(null);
      // Auto-save before running
      await api.saveWorkflow({
        id: selectedWorkflowId,
        name: workflowName,
        description: workflowDesc,
        graph: { nodes, edges }
      });

      const res = await api.executeWorkflow(selectedWorkflowId, {}, 'demo');
      setActiveRun(res.data);
    } catch (err) {
      setError(`Execution error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleApprove = async () => {
    if (!activeRun) return;
    try {
      setExecuting(true);
      setError(null);
      const res = await api.approveWorkflow(activeRun.id, approvalNotes);
      setActiveRun(res.data);
      setApprovalNotes('');
    } catch (err) {
      setError(`Approval failed: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleReject = async () => {
    if (!activeRun) return;
    try {
      setExecuting(true);
      setError(null);
      const res = await api.rejectWorkflow(activeRun.id, approvalNotes);
      setActiveRun(res.data);
      setApprovalNotes('');
    } catch (err) {
      setError(`Rejection failed: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="page-container" style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}>
      {/* Top Banner Error */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 0 }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span style={{ wordBreak: 'break-word' }}>{error}</span>
        </div>
      )}

      {/* Clean Organized Glass Toolbar (Zero Overlap Guaranteed) */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          flexShrink: 0
        }}
      >
        {/* Left Section: Workflow Selector & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FolderOpen size={16} color="var(--accent-violet)" />
            <select
              value={selectedWorkflowId}
              onChange={(e) => {
                const wf = workflows.find((w) => w.id === e.target.value);
                if (wf) selectWorkflow(wf);
              }}
              style={{ width: '220px', padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
            >
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{ width: '200px', padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
            placeholder="Workflow Name"
          />
        </div>

        {/* Center Section: Add Node Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={nodeTypeToAdd}
            onChange={(e) => setNodeTypeToAdd(e.target.value)}
            style={{ width: '160px', padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
          >
            <option value="input">Input Node</option>
            <option value="knowledge_search">Knowledge Search</option>
            <option value="ai_task">AI Task (Summarize)</option>
            <option value="condition">Condition Check</option>
            <option value="human_approval">Human Approval</option>
            <option value="output">Output Node</option>
          </select>
          <button onClick={handleAddNode} className="btn-secondary btn-sm" title="Add Selected Node to Canvas">
            <Plus size={14} /> Add Node
          </button>
        </div>

        {/* Right Section: Save & Run Workflow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button onClick={handleSaveWorkflow} className="btn-secondary btn-sm">
            <Save size={14} /> Save
          </button>
          <button
            onClick={handleExecuteWorkflow}
            className="btn-primary btn-sm"
            disabled={executing}
          >
            {executing ? (
              <>
                <RefreshCw size={14} className="spin" /> Executing...
              </>
            ) : (
              <>
                <Play size={14} /> Run Workflow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: Canvas + Execution Inspector */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: activeRun ? 'minmax(0, 1fr) 380px' : 'minmax(0, 1fr)', 
          gap: '1.25rem', 
          flex: 1, 
          minHeight: 0 
        }}
      >
        {/* React Flow Visual Canvas Container */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '14px',
            backgroundColor: 'rgba(7, 11, 20, 0.95)',
            border: '1px solid var(--border-glass)',
            minHeight: '480px',
            height: '100%'
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="rgba(255, 255, 255, 0.08)" gap={20} size={1} />
            <Controls style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: '8px', fill: '#fff' }} />
          </ReactFlow>
        </div>

        {/* Execution Inspector Drawer */}
        {activeRun && (
          <div 
            className="card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem', 
              overflowY: 'auto',
              maxHeight: '100%',
              minHeight: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)'
            }}
          >
            <div className="card-header" style={{ marginBottom: 0 }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.95rem' }}>Run Trace</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {activeRun.id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span
                  className={`badge ${
                    activeRun.status === 'successful'
                      ? 'badge-success'
                      : activeRun.status === 'waiting_for_approval'
                      ? 'badge-warning'
                      : 'badge-danger'
                  }`}
                >
                  {activeRun.status}
                </span>
                <button
                  onClick={() => setActiveRun(null)}
                  className="btn-secondary btn-icon"
                  style={{ width: '26px', height: '26px', padding: 0 }}
                  title="Close Inspector"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* HUMAN APPROVAL ACTION BANNER */}
            {activeRun.status === 'waiting_for_approval' && (
              <div
                style={{
                  padding: '1.15rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber-light)', fontWeight: 700, fontSize: '0.85rem' }}>
                  <UserCheck size={18} />
                  <span>Human Approval Required</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  Workflow execution is currently <strong>suspended</strong>. Please review the step outputs before approving or rejecting resumption.
                </div>
                <input
                  type="text"
                  placeholder="Reviewer remarks / sign-off notes..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleApprove} className="btn-primary btn-sm" disabled={executing} style={{ flex: 1 }}>
                    <CheckCircle2 size={14} /> Approve & Resume
                  </button>
                  <button onClick={handleReject} className="btn-danger btn-sm" disabled={executing}>
                    Reject Run
                  </button>
                </div>
              </div>
            )}

            {/* Step-by-step Execution List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Executed Step Outputs
              </div>

              {activeRun.steps?.map((step) => {
                let parsedOut = step.output_data;
                try {
                  if (typeof parsedOut === 'string') parsedOut = JSON.parse(parsedOut);
                } catch (e) {}

                return (
                  <div
                    key={step.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(11, 17, 32, 0.6)',
                      border: '1px solid var(--border-glass)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {step.node_name} <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>({step.node_type})</span>
                      </span>
                      <span className={`badge ${step.status === 'successful' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem' }}>
                        {step.duration_ms} ms
                      </span>
                    </div>
                    <pre
                      style={{
                        backgroundColor: 'rgba(4, 7, 15, 0.75)',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        color: '#93c5fd',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-glass-subtle)'
                      }}
                    >
                      {JSON.stringify(parsedOut, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>

            {/* Final Output if finished */}
            {activeRun.output_data && (
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-emerald-light)', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.5px' }}>
                  Final Workflow Output
                </div>
                <pre
                  style={{
                    backgroundColor: 'rgba(11, 17, 32, 0.7)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: '#a7f3d0',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  {JSON.stringify(activeRun.output_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkflowStudio;

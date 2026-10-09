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
  FolderOpen
} from 'lucide-react';
import { api } from '../services/api';

// --- Custom Flow Node Components ---
const CustomNodeWrapper = ({ title, icon: Icon, color, children, isPaused }) => (
  <div
    style={{
      padding: '0.75rem',
      borderRadius: '8px',
      backgroundColor: 'var(--bg-secondary)',
      border: `2px solid ${isPaused ? 'var(--accent-amber)' : color}`,
      color: 'var(--text-main)',
      minWidth: '180px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
      fontSize: '0.8rem'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem', fontWeight: 600 }}>
      <Icon size={14} color={color} />
      <span>{title}</span>
    </div>
    {children}
  </div>
);

const InputNode = ({ data }) => (
  <CustomNodeWrapper title="Input Node" icon={Layers} color="var(--accent-blue)">
    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
      {data.label || data.value || 'Data Input'}
    </div>
    <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-blue)' }} />
  </CustomNodeWrapper>
);

const KnowledgeSearchNode = ({ data }) => (
  <CustomNodeWrapper title="Knowledge Search" icon={Search} color="var(--accent-cyan)">
    <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-cyan)' }} />
    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
      Top-{data.topK || 2} Passages (TF-IDF)
    </div>
    <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-cyan)' }} />
  </CustomNodeWrapper>
);

const AITaskNode = ({ data }) => (
  <CustomNodeWrapper title="AI Task" icon={Cpu} color="var(--accent-violet)">
    <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-violet)' }} />
    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
      Task: <strong style={{ color: 'var(--text-main)' }}>{data.taskType || 'summarize'}</strong>
    </div>
    <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-violet)' }} />
  </CustomNodeWrapper>
);

const ConditionNode = ({ data }) => (
  <CustomNodeWrapper title="Condition Check" icon={AlertTriangle} color="var(--accent-amber)">
    <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-amber)' }} />
    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
      Op: {data.operator || 'is_not_empty'}
    </div>
    <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-amber)' }} />
  </CustomNodeWrapper>
);

const HumanApprovalNode = ({ data }) => (
  <CustomNodeWrapper title="Human Approval" icon={UserCheck} color="var(--accent-amber)">
    <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-amber)' }} />
    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
      Suspends execution for review
    </div>
    <Handle type="source" position={Position.Right} style={{ background: 'var(--accent-amber)' }} />
  </CustomNodeWrapper>
);

const OutputNode = ({ data }) => (
  <CustomNodeWrapper title="Output Node" icon={FileCheck} color="var(--accent-emerald)">
    <Handle type="target" position={Position.Left} style={{ background: 'var(--accent-emerald)' }} />
    <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
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

  const handleAddNode = (type) => {
    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: 100 + nodes.length * 40, y: 100 + nodes.length * 30 },
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
      const res = await api.saveWorkflow(payload);
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
      // Auto-save graph before executing
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      {/* Top Banner Error */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 0 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div
        className="card"
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FolderOpen size={16} color="var(--accent-violet)" />
          <select
            value={selectedWorkflowId}
            onChange={(e) => {
              const wf = workflows.find((w) => w.id === e.target.value);
              if (wf) selectWorkflow(wf);
            }}
            style={{ width: '250px', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{ width: '220px', padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
            placeholder="Workflow Name"
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Add Node Buttons */}
          <button
            onClick={() => handleAddNode('input')}
            className="btn-secondary btn-sm"
            title="Add Input Node"
          >
            <Plus size={12} /> Input
          </button>
          <button
            onClick={() => handleAddNode('knowledge_search')}
            className="btn-secondary btn-sm"
            title="Add Knowledge Search Node"
          >
            <Plus size={12} /> Search
          </button>
          <button
            onClick={() => handleAddNode('ai_task')}
            className="btn-secondary btn-sm"
            title="Add AI Task Node"
          >
            <Plus size={12} /> AI Task
          </button>
          <button
            onClick={() => handleAddNode('condition')}
            className="btn-secondary btn-sm"
            title="Add Condition Node"
          >
            <Plus size={12} /> Condition
          </button>
          <button
            onClick={() => handleAddNode('human_approval')}
            className="btn-secondary btn-sm"
            title="Add Approval Node"
          >
            <Plus size={12} /> Approval
          </button>
          <button
            onClick={() => handleAddNode('output')}
            className="btn-secondary btn-sm"
            title="Add Output Node"
          >
            <Plus size={12} /> Output
          </button>

          <button onClick={handleSaveWorkflow} className="btn-secondary btn-sm">
            <Save size={14} /> Save
          </button>

          <button
            onClick={handleExecuteWorkflow}
            className="btn-primary btn-sm"
            disabled={executing}
          >
            <Play size={14} /> {executing ? 'Executing...' : 'Run Workflow'}
          </button>
        </div>
      </div>

      {/* Main Studio Area: Canvas + Execution Results */}
      <div style={{ display: 'grid', gridTemplateColumns: activeRun ? '2fr 1fr' : '1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
        
        {/* React Flow Visual Canvas */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
            borderRadius: '10px',
            backgroundColor: '#070a13'
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
            <Background color="#1f2c42" gap={16} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Execution Inspector Drawer */}
        {activeRun && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
            <div className="card-header" style={{ marginBottom: 0 }}>
              <div>
                <h3 className="card-title">Run Trace: {activeRun.workflow_name}</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: {activeRun.id}</span>
              </div>
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
            </div>

            {/* HUMAN APPROVAL ACTION BANNER */}
            {activeRun.status === 'waiting_for_approval' && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                  <UserCheck size={18} />
                  <span>Human Approval Required</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  Workflow execution is currently <strong>paused</strong>. Please review the step outputs before approving or rejecting resumption.
                </div>
                <input
                  type="text"
                  placeholder="Reviewer remarks / sign-off notes..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleApprove} className="btn-primary btn-sm" disabled={executing}>
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
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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
                      padding: '0.65rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.775rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {step.node_name} ({step.node_type})
                      </span>
                      <span className={`badge ${step.status === 'successful' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem' }}>
                        {step.duration_ms} ms
                      </span>
                    </div>
                    <pre
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        padding: '0.4rem',
                        borderRadius: '4px',
                        color: '#93c5fd',
                        maxHeight: '120px',
                        overflowY: 'auto'
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
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Final Workflow Output
                </div>
                <pre
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: '#a7f3d0',
                    border: '1px solid var(--border-subtle)'
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

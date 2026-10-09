import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Database, 
  Cpu, 
  Server, 
  ShieldCheck, 
  Info,
  Layers,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';

export function SettingsHealth({ systemStatus, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState(systemStatus);

  useEffect(() => {
    setStatusData(systemStatus);
  }, [systemStatus]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemStatus();
      setStatusData(res.data);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Failed to refresh status:', e);
    } finally {
      setLoading(false);
    }
  };

  const backend = statusData?.backend || {};
  const dbStats = statusData?.database || {};
  const ai = statusData?.ai_service || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="card-title" style={{ fontSize: '1.15rem' }}>System Health & AI Provider Status</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Inspect microservice connectivity, database persistence metrics, and local AI model reachability.
          </p>
        </div>
        <button onClick={handleRefresh} className="btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          {loading ? 'Pinging Services...' : 'Refresh Health'}
        </button>
      </div>

      {/* Grid of 3 Core Services */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        
        {/* 1. Main Express Backend */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} color="var(--accent-blue)" />
              <h3 className="card-title">Express.js API Gateway</h3>
            </div>
            <span className="badge badge-success">
              <CheckCircle2 size={12} /> {backend.status || 'healthy'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Runtime Environment</span>
              <strong style={{ color: 'var(--text-main)' }}>{backend.runtime || 'Node.js'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Listening Port</span>
              <strong style={{ color: 'var(--text-main)' }}>{backend.port || 5000}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Service Uptime</span>
              <strong style={{ color: 'var(--text-main)' }}>{backend.uptime_seconds || 0} seconds</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Role</span>
              <span style={{ color: 'var(--accent-blue)' }}>Orchestration & Data Persistence</span>
            </div>
          </div>
        </div>

        {/* 2. SQLite Database */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="var(--accent-emerald)" />
              <h3 className="card-title">SQLite Database</h3>
            </div>
            <span className="badge badge-success">
              <CheckCircle2 size={12} /> WAL Mode
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Driver</span>
              <strong style={{ color: 'var(--text-main)' }}>{dbStats.engine || 'better-sqlite3'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stored Documents</span>
              <strong style={{ color: 'var(--text-main)' }}>{dbStats.statistics?.documents || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Document Chunks</span>
              <strong style={{ color: 'var(--text-main)' }}>{dbStats.statistics?.document_chunks || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Workflow Definitions</span>
              <strong style={{ color: 'var(--text-main)' }}>{dbStats.statistics?.workflow_definitions || 0}</strong>
            </div>
          </div>
        </div>

        {/* 3. Python AI Microservice */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="var(--accent-violet)" />
              <h3 className="card-title">Python FastAPI Service</h3>
            </div>
            <span className={`badge ${ai.status === 'healthy' ? 'badge-success' : 'badge-warning'}`}>
              {ai.status === 'healthy' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {ai.status || 'unreachable'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active AI Provider</span>
              <span className={`badge ${ai.is_demo_mode ? 'badge-purple' : 'badge-info'}`}>
                {ai.is_demo_mode ? 'Demo Mode (Extractive)' : 'Ollama Local LLM'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Configured Model</span>
              <strong style={{ color: 'var(--text-main)' }}>{ai.configured_model || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ollama Reachability</span>
              <strong style={{ color: ai.ollama_reachable ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                {ai.ollama_reachable ? 'Reachable' : 'Not Running (Demo Mode Active)'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>RAG Baseline</span>
              <span style={{ color: 'var(--accent-violet)' }}>Pure Python TF-IDF</span>
            </div>
          </div>
        </div>

      </div>

      {/* Educational Architecture Explanation Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
            <h3 className="card-title">Architecture Safeguards & Learning Notes</h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.825rem', lineHeight: 1.6 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '0.35rem' }}>
              1. 100% Free & Local
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              ORBIT AI requires no OpenAI, Anthropic, or paid cloud APIs. Demo Mode runs deterministically in pure Python without requiring any GPU or local LLM setup.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-violet)', marginBottom: '0.35rem' }}>
              2. Strict Bounded Sandboxing
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              Neither the AI agent nor workflow nodes can execute arbitrary shell scripts, arbitrary SQL, or unconstrained code. Tool parameters are strictly validated against schemas.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
              3. Decoupled Service Boundary
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              The React frontend speaks exclusively to the Express backend. The Python AI service is kept internal, ensuring security and decoupling application logic from AI inference.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default SettingsHealth;

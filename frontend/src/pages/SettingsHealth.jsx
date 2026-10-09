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
  Terminal,
  Activity,
  HardDrive
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
    <div className="page-container">
      {/* Top Header Card */}
      <div 
        className="card" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '1rem',
          padding: '1.5rem'
        }}
      >
        <div>
          <h2 className="card-title" style={{ fontSize: '1.2rem' }}>System Health & AI Provider Status</h2>
          <p className="card-subtitle" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Inspect microservice connectivity, database persistence metrics, and local AI model reachability.
          </p>
        </div>
        <button onClick={handleRefresh} className="btn-secondary" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          {loading ? 'Pinging Services...' : 'Refresh Health'}
        </button>
      </div>

      {/* Grid of 3 Core Services */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* 1. Main Express Backend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Server size={18} color="var(--accent-blue)" />
              <div>
                <h3 className="card-title">Express.js API Gateway</h3>
                <p className="card-subtitle">Node.js ES Modules</p>
              </div>
            </div>
            <span className="badge badge-success">
              <CheckCircle2 size={12} /> {backend.status || 'healthy'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Runtime Environment</span>
              <strong style={{ color: '#ffffff' }}>{backend.runtime || 'Node.js'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Listening Port</span>
              <strong style={{ color: 'var(--accent-blue-light)' }}>{backend.port || 5000}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Service Uptime</span>
              <strong style={{ color: '#ffffff' }}>{backend.uptime_seconds || 0} seconds</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Role</span>
              <span style={{ color: 'var(--accent-blue-light)', fontWeight: 600 }}>Orchestration & Data Persistence</span>
            </div>
          </div>
        </div>

        {/* 2. SQLite Database */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Database size={18} color="var(--accent-emerald)" />
              <div>
                <h3 className="card-title">SQLite Database</h3>
                <p className="card-subtitle">Local ACID storage</p>
              </div>
            </div>
            <span className="badge badge-success">
              <CheckCircle2 size={12} /> WAL Mode Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Storage Driver</span>
              <strong style={{ color: '#ffffff' }}>{dbStats.engine || 'better-sqlite3'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stored Documents</span>
              <strong style={{ color: 'var(--accent-emerald-light)' }}>{dbStats.statistics?.documents || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Document Chunks</span>
              <strong style={{ color: 'var(--accent-emerald-light)' }}>{dbStats.statistics?.document_chunks || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Workflow Definitions</span>
              <strong style={{ color: 'var(--accent-emerald-light)' }}>{dbStats.statistics?.workflow_definitions || 0}</strong>
            </div>
          </div>
        </div>

        {/* 3. Python AI Microservice & Local Ollama */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Cpu size={18} color="var(--accent-violet)" />
              <div>
                <h3 className="card-title">Python FastAPI Service</h3>
                <p className="card-subtitle">Local AI capabilities & Ollama runtime</p>
              </div>
            </div>
            <span className={`badge ${ai.status === 'healthy' ? 'badge-success' : 'badge-warning'}`}>
              {ai.status === 'healthy' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {ai.status || 'unreachable'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active AI Provider</span>
              <span className={`badge ${ai.is_demo_mode ? 'badge-purple' : 'badge-info'}`}>
                {ai.is_demo_mode ? 'Demo Mode (Extractive)' : 'Ollama Local LLM'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Configured Model</span>
              <strong style={{ color: '#ffffff' }}>{ai.configured_model || 'llama3'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ollama Daemon</span>
              <span style={{ color: 'var(--accent-cyan-light)', fontFamily: 'monospace' }}>
                {ai.ollama_base_url || 'http://localhost:11434'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ollama Reachability</span>
              <strong style={{ color: ai.ollama_reachable ? 'var(--accent-emerald-light)' : 'var(--accent-amber-light)' }}>
                {ai.ollama_reachable ? 'Reachable (Active)' : 'Not Running / Unreachable'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Installed Models</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'flex-end', maxWidth: '180px' }}>
                {ai.ollama_installed_models && ai.ollama_installed_models.length > 0 ? (
                  ai.ollama_installed_models.map((m, idx) => (
                    <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>
                      {m}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>None detected</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>RAG Baseline</span>
              <span style={{ color: 'var(--accent-violet-light)', fontWeight: 600 }}>Pure Python TF-IDF</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dedicated Ollama Setup & Configuration Guide (Windows) */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <Terminal size={18} color="var(--accent-cyan)" />
            <div>
              <h3 className="card-title">Local Ollama Setup & Quickstart Guide (Windows)</h3>
              <p className="card-subtitle">Run real local LLM agent execution without cloud APIs or credit cards</p>
            </div>
          </div>
          <span className="badge badge-info">100% Free & Local</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-cyan-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>1</span>
              <span>Install Ollama on Windows</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Open PowerShell and install via Windows Package Manager, or download the installer:
            </p>
            <code style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', backgroundColor: 'rgba(4, 7, 15, 0.75)', color: '#93c5fd', fontSize: '0.775rem', border: '1px solid var(--border-glass-subtle)' }}>
              winget install Ollama.Ollama
            </code>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-emerald-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>2</span>
              <span>Start the Ollama Daemon</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Start the background server listening on <code>http://localhost:11434</code>:
            </p>
            <code style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', backgroundColor: 'rgba(4, 7, 15, 0.75)', color: '#a7f3d0', fontSize: '0.775rem', border: '1px solid var(--border-glass-subtle)' }}>
              ollama serve
            </code>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-magenta-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-magenta" style={{ fontSize: '0.7rem' }}>3</span>
              <span>Pull Tool-Calling Model</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Download the weights for <code>llama3</code> (or <code>mistral</code> / <code>qwen2.5:7b</code>):
            </p>
            <code style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', backgroundColor: 'rgba(4, 7, 15, 0.75)', color: '#f472b6', fontSize: '0.775rem', border: '1px solid var(--border-glass-subtle)' }}>
              ollama pull llama3
            </code>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-amber-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>4</span>
              <span>Select in Agent Playground</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              In Agent Playground, click <strong>Ollama Mode</strong>. The agent will formulate tool calls using your real local model!
            </p>
          </div>
        </div>
      </div>

      {/* Educational Architecture Explanation Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <ShieldCheck size={18} color="var(--accent-emerald)" />
            <div>
              <h3 className="card-title">Architecture Safeguards & Design Principles</h3>
              <p className="card-subtitle">Guarantees safety, determinism, and zero cloud dependency</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
          <div className="glass-panel">
            <div style={{ fontWeight: 700, color: 'var(--accent-blue-light)', marginBottom: '0.35rem' }}>
              1. 100% Free & Local
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              ORBIT AI requires no OpenAI, Anthropic, or paid cloud APIs. Demo Mode runs deterministically in pure Python without requiring any GPU or local LLM setup.
            </p>
          </div>

          <div className="glass-panel">
            <div style={{ fontWeight: 700, color: 'var(--accent-violet-light)', marginBottom: '0.35rem' }}>
              2. Strict Bounded Sandboxing
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Neither the AI agent nor workflow nodes can execute arbitrary shell scripts, arbitrary SQL, or unconstrained code. Tool parameters are strictly validated against schemas.
            </p>
          </div>

          <div className="glass-panel">
            <div style={{ fontWeight: 700, color: 'var(--accent-cyan-light)', marginBottom: '0.35rem' }}>
              3. Decoupled Service Boundary
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              The React frontend speaks exclusively to the Express backend. The Python AI service is kept internal, ensuring security and decoupling application logic from AI inference.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default SettingsHealth;

import React from 'react';
import { 
  BookOpen, 
  Bot, 
  Workflow, 
  Activity, 
  Settings, 
  Layers,
  Database,
  Cpu,
  Sparkles
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab, systemStatus }) {
  const navItems = [
    { id: 'knowledge', label: 'Knowledge Hub', icon: BookOpen, color: 'var(--accent-blue)' },
    { id: 'agent', label: 'Agent Playground', icon: Bot, color: 'var(--accent-violet)' },
    { id: 'workflows', label: 'Workflow Studio', icon: Workflow, color: 'var(--accent-cyan)' },
    { id: 'runs', label: 'Runs & Evaluations', icon: Activity, color: 'var(--accent-emerald)' },
    { id: 'settings', label: 'Settings & Health', icon: Settings, color: 'var(--accent-amber)' },
  ];

  const aiServiceStatus = systemStatus?.ai_service?.status === 'healthy';
  const isDemo = systemStatus?.ai_service?.is_demo_mode ?? true;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <Sparkles size={16} />
        </div>
        <div className="brand-info">
          <div className="brand-title">
            ORBIT AI
            <span className="brand-version">v1.0</span>
          </div>
          <span className="brand-subtitle">AI Engineering Workspace</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer System Telemetry */}
      <div className="sidebar-footer">
        <div className="system-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={14} color="var(--accent-violet-light)" />
            <span style={{ color: 'var(--text-secondary)' }}>AI Engine</span>
          </div>
          <span className={`badge ${isDemo ? 'badge-purple' : 'badge-info'}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}>
            {isDemo ? 'Demo Mode' : 'Ollama LLM'}
          </span>
        </div>

        <div className="system-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={14} color="var(--accent-emerald-light)" />
            <span style={{ color: 'var(--text-secondary)' }}>SQLite WAL</span>
          </div>
          <span className="status-dot green" title="WAL Persistence Connected" />
        </div>

        <div className="system-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={14} color="var(--accent-cyan-light)" />
            <span style={{ color: 'var(--text-secondary)' }}>Python FastAP</span>
          </div>
          <span 
            className={`status-dot ${aiServiceStatus ? 'green' : 'amber'}`} 
            title={aiServiceStatus ? 'Python AI Online' : 'Connecting to AI Service'}
          />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

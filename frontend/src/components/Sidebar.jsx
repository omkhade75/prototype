import React from 'react';
import { 
  BookOpen, 
  Bot, 
  Workflow, 
  Activity, 
  Settings, 
  Layers,
  Database,
  Cpu
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab, systemStatus }) {
  const navItems = [
    { id: 'knowledge', label: 'Knowledge Hub', icon: BookOpen },
    { id: 'agent', label: 'Agent Playground', icon: Bot },
    { id: 'workflows', label: 'Workflow Studio', icon: Workflow },
    { id: 'runs', label: 'Runs & Evaluations', icon: Activity },
    { id: 'settings', label: 'Settings & Health', icon: Settings },
  ];

  const aiServiceStatus = systemStatus?.ai_service?.status === 'healthy';
  const isDemo = systemStatus?.ai_service?.is_demo_mode ?? true;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="brand-badge">ORBIT</span>
        <div>
          <h1 className="brand-title">ORBIT AI</h1>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Learning Prototype</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
              style={{ width: '100%', textAlign: 'left', background: 'none' }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Cpu size={14} color="#818cf8" />
            <span>AI Provider</span>
          </div>
          <span className={`badge ${isDemo ? 'badge-purple' : 'badge-info'}`}>
            {isDemo ? 'Demo Mode' : 'Ollama'}
          </span>
        </div>

        <div className="system-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Database size={14} color="#34d399" />
            <span>SQLite WAL</span>
          </div>
          <span className="status-dot green" title="Database Connected"></span>
        </div>

        <div className="system-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Layers size={14} color="#38bdf8" />
            <span>Python AI Svc</span>
          </div>
          <span className={`status-dot ${aiServiceStatus ? 'green' : 'amber'}`} title={aiServiceStatus ? 'Online' : 'Pending'}></span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;

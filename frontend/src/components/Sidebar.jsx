import React from 'react';
import { OrbitLogo } from './OrbitLogo';
import { 
  BookOpen, 
  Code2,
  Bot, 
  Workflow, 
  Activity, 
  Settings, 
  Layers, 
  Database, 
  Cpu, 
  Sparkles, 
  Terminal, 
  Home as HomeIcon, 
  Compass, 
  Boxes, 
  GraduationCap,
  Laptop
} from 'lucide-react';

export function Sidebar({ currentTab, setCurrentTab, systemStatus }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon, color: 'var(--accent-violet)' },
    { id: 'laptop-copilot', label: 'Laptop Copilot', icon: Laptop, color: 'var(--accent-teal)' },
    { id: 'user-guide', label: 'Start Here / Guide', icon: Compass, color: 'var(--accent-blue)' },
    { id: 'course-lab', label: 'Course-to-Code Lab', icon: GraduationCap, color: 'var(--accent-teal)' },
    { id: 'engineer', label: 'Software Engineer', icon: Terminal, color: 'var(--accent-indigo)' },
    { id: 'models', label: 'AI Model Library', icon: Boxes, color: 'var(--accent-violet)' },
    { id: 'coding', label: 'Coding Playground', icon: Code2, color: 'var(--accent-amber)' },
    { id: 'agent', label: 'Agent Playground', icon: Bot, color: 'var(--accent-pink)' },
    { id: 'workflows', label: 'Workflow Studio', icon: Workflow, color: 'var(--accent-cyan)' },
    { id: 'knowledge', label: 'Knowledge Hub', icon: BookOpen, color: 'var(--accent-blue)' },
    { id: 'runs', label: 'Runs & Evaluations', icon: Activity, color: 'var(--accent-emerald)' },
    { id: 'settings', label: 'Settings & Health', icon: Settings, color: 'var(--accent-magenta)' },
  ];

  const aiServiceStatus = systemStatus?.ai_service?.status === 'healthy';
  const isDemo = systemStatus?.ai_service?.is_demo_mode ?? true;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OrbitLogo size={34} animated={false} />
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
              style={isActive ? { 
                borderColor: 'rgba(255, 255, 255, 0.15)', 
                boxShadow: 'none' 
              } : {}}
            >
              <span 
                className="nav-icon"
                style={{ 
                  color: item.color,
                  background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'}`,
                  padding: '5px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
              </span>
              <span style={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                {item.label}
              </span>
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

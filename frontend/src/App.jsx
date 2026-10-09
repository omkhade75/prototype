import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KnowledgeHub from './pages/KnowledgeHub';
import AgentPlayground from './pages/AgentPlayground';
import WorkflowStudio from './pages/WorkflowStudio';
import RunsEvaluations from './pages/RunsEvaluations';
import SettingsHealth from './pages/SettingsHealth';
import { api } from './services/api';
import { 
  BookOpen, 
  Bot, 
  Workflow, 
  Activity, 
  Settings, 
  RefreshCw,
  Cpu,
  CheckCircle2,
  Database
} from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState('knowledge');
  const [systemStatus, setSystemStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.getSystemStatus();
      setSystemStatus(res.data);
    } catch (e) {
      console.warn('System status check:', e.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const tabConfig = {
    knowledge: {
      title: 'Knowledge Hub',
      subtitle: 'RAG Document Management & Verifiable TF-IDF Q&A',
      icon: BookOpen,
      color: 'var(--accent-blue)'
    },
    agent: {
      title: 'Agent Playground',
      subtitle: 'Bounded Autonomous Agent & Observable Execution Trace',
      icon: Bot,
      color: 'var(--accent-violet)'
    },
    workflows: {
      title: 'Workflow Studio',
      subtitle: 'Visual DAG Pipeline Automation & Human-in-the-Loop',
      icon: Workflow,
      color: 'var(--accent-cyan)'
    },
    runs: {
      title: 'Runs & Evaluations',
      subtitle: 'System Execution Logs & Automated Regression Test Suites',
      icon: Activity,
      color: 'var(--accent-emerald)'
    },
    settings: {
      title: 'Settings & System Health',
      subtitle: 'Microservice Connectivity, SQLite WAL & AI Providers',
      icon: Settings,
      color: 'var(--accent-amber)'
    }
  };

  const activeTabMeta = tabConfig[currentTab] || tabConfig.knowledge;
  const TabIcon = activeTabMeta.icon;

  const aiIsDemo = systemStatus?.ai_service?.is_demo_mode ?? true;
  const aiStatusHealthy = systemStatus?.ai_service?.status === 'healthy';

  return (
    <div className="app-container">
      {/* Sleek Glass Navigation Dock */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        systemStatus={systemStatus}
      />

      {/* Main Workspace Area */}
      <main className="main-wrapper">
        {/* Glass Frosted Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeTabMeta.color,
                boxShadow: '0 0 16px rgba(0, 0, 0, 0.2)'
              }}
            >
              <TabIcon size={18} />
            </div>
            <div>
              <h2 className="page-title">{activeTabMeta.title}</h2>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                {activeTabMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="topbar-right">
            {/* Live Microservice Pills */}
            <div className="status-indicator-group">
              <span>
                <span className="status-dot green" />
                Backend: <strong style={{ color: 'var(--accent-emerald)' }}>Port 5000</strong>
              </span>
              <span style={{ color: 'var(--border-glass)' }}>•</span>
              <span>
                <Database size={13} color="var(--accent-blue-light)" />
                SQLite WAL: <strong style={{ color: 'var(--text-main)' }}>Connected</strong>
              </span>
              <span style={{ color: 'var(--border-glass)' }}>•</span>
              <span>
                <Cpu size={13} color="var(--accent-violet-light)" />
                AI Service: <strong style={{ color: aiStatusHealthy ? 'var(--accent-violet-light)' : 'var(--accent-amber)' }}>
                  {aiIsDemo ? 'Demo Mode' : 'Ollama Active'}
                </strong>
              </span>
            </div>

            {/* Quick Ping Button */}
            <button
              onClick={fetchHealth}
              className="btn-secondary btn-icon"
              title="Ping Microservices"
              disabled={isRefreshing}
              style={{ height: '34px', width: '34px', borderRadius: '8px' }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            </button>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <section className="content-area">
          {currentTab === 'knowledge' && <KnowledgeHub />}
          {currentTab === 'agent' && <AgentPlayground systemStatus={systemStatus} onRefresh={fetchHealth} />}
          {currentTab === 'workflows' && <WorkflowStudio />}
          {currentTab === 'runs' && <RunsEvaluations />}
          {currentTab === 'settings' && <SettingsHealth systemStatus={systemStatus} onRefresh={fetchHealth} />}
        </section>
      </main>
    </div>
  );
}

export default App;

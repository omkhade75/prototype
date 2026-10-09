import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KnowledgeHub from './pages/KnowledgeHub';
import AgentPlayground from './pages/AgentPlayground';
import WorkflowStudio from './pages/WorkflowStudio';
import RunsEvaluations from './pages/RunsEvaluations';
import SettingsHealth from './pages/SettingsHealth';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState('knowledge');
  const [systemStatus, setSystemStatus] = useState(null);

  const fetchHealth = async () => {
    try {
      const res = await api.getSystemStatus();
      setSystemStatus(res.data);
    } catch (e) {
      console.warn('System status check:', e.message);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const tabTitles = {
    knowledge: 'Knowledge Hub — RAG Documents & Grounded Q&A',
    agent: 'Agent Playground — Conversational Loop & Tool Trace',
    workflows: 'Workflow Studio — Visual DAG Automation',
    runs: 'Runs & Evaluations — Execution Traces & Test Suites',
    settings: 'Settings & System Health — Microservices & Model Providers'
  };

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        systemStatus={systemStatus}
      />

      {/* Main Workspace Area */}
      <main className="main-wrapper">
        <header className="topbar">
          <h2 className="page-title">{tabTitles[currentTab] || 'Workspace'}</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Backend: <strong style={{ color: 'var(--accent-emerald)' }}>Online (Port 5000)</strong></span>
            <span>•</span>
            <span>AI: <strong style={{ color: 'var(--accent-violet)' }}>
              {systemStatus?.ai_service?.is_demo_mode ? 'Demo Mode' : 'Ollama Active'}
            </strong></span>
          </div>
        </header>

        <section className="content-area">
          {currentTab === 'knowledge' && <KnowledgeHub />}
          {currentTab === 'agent' && <AgentPlayground />}
          {currentTab === 'workflows' && <WorkflowStudio />}
          {currentTab === 'runs' && <RunsEvaluations />}
          {currentTab === 'settings' && <SettingsHealth systemStatus={systemStatus} onRefresh={fetchHealth} />}
        </section>
      </main>
    </div>
  );
}

export default App;

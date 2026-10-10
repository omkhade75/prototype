import React from 'react';
import { 
  Sparkles, 
  Terminal, 
  GraduationCap, 
  Boxes, 
  Code2, 
  Bot, 
  Workflow, 
  BookOpen, 
  Activity, 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Layers, 
  Cpu, 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink,
  HelpCircle,
  Play,
  Compass,
  Laptop
} from 'lucide-react';

export function Home({ systemStatus, setCurrentTab }) {
  const backendHealthy = systemStatus?.backend?.status === 'healthy';
  const dbConnected = Boolean(systemStatus?.database?.engine);
  const aiServiceHealthy = systemStatus?.ai_service?.status === 'healthy';
  const isDemoMode = systemStatus?.ai_service?.is_demo_mode ?? true;
  const ollamaOnline = Boolean(systemStatus?.ai_service?.ollama_reachable);
  const activeModel = systemStatus?.backend?.active_model || systemStatus?.ai_service?.configured_model || 'llama3';
  const dockerAvailable = Boolean(systemStatus?.backend?.docker_available);

  // Quick Action feature cards
  const featureCards = [
    {
      id: 'course-lab',
      title: 'Course-to-Code Lab',
      badge: 'Academic',
      badgeColor: 'badge-teal',
      icon: GraduationCap,
      color: 'var(--accent-teal)',
      desc: 'Ingest university slides and PDFs, harvest code snippets, and generate validated Jupyter Notebooks (.ipynb) ready for Google Colab.',
      actionText: 'Open Course Lab'
    },
    {
      id: 'engineer',
      title: 'AI Software Engineer',
      badge: 'Autonomous',
      badgeColor: 'badge-indigo',
      icon: Terminal,
      color: 'var(--accent-indigo)',
      desc: 'Turn natural-language prompts into runnable full-stack React + Express applications backed by real SQLite databases on disk.',
      actionText: 'Build Full-Stack App'
    },
    {
      id: 'models',
      title: 'AI Model Library',
      badge: 'Hardware Aware',
      badgeColor: 'badge-purple',
      icon: Boxes,
      color: 'var(--accent-violet)',
      desc: 'Discover open-weights models tailored to your HP Victus laptop (6 GB VRAM), benchmark responses, and compare rubric scores.',
      actionText: 'Explore Models'
    },
    {
      id: 'coding',
      title: 'Coding Playground & DSA',
      badge: 'Bilingual C++/Python',
      badgeColor: 'badge-amber',
      icon: Code2,
      color: 'var(--accent-amber)',
      desc: 'Master algorithms with 4 guided modes (Learn, Build With Me, Debug, Practise), LeetCode catalogue, and AST dry-run traces.',
      actionText: 'Start Coding'
    },
    {
      id: 'knowledge',
      title: 'Knowledge Hub (RAG)',
      badge: 'Zero Cloud APIs',
      badgeColor: 'badge-blue',
      icon: BookOpen,
      color: 'var(--accent-blue)',
      desc: 'Upload notes and textbooks; ask questions grounded in text passages with verifiable page citations and transparent TF-IDF math.',
      actionText: 'Search Knowledge'
    },
    {
      id: 'agent',
      title: 'Agent Playground',
      badge: 'Observable',
      badgeColor: 'badge-pink',
      icon: Bot,
      color: 'var(--accent-magenta)',
      desc: 'Submit autonomous tasks and inspect step-by-step reasoning, bounded tool calling, arguments, observations, and timings.',
      actionText: 'Launch Agent'
    },
    {
      id: 'workflows',
      title: 'Workflow Studio',
      badge: 'Visual DAG',
      badgeColor: 'badge-cyan',
      icon: Workflow,
      color: 'var(--accent-cyan)',
      desc: 'Design node-based automation pipelines using React Flow with Kahn cycle detection and human approval pause states.',
      actionText: 'Design Workflow'
    },
    {
      id: 'runs',
      title: 'Runs & Evaluations',
      badge: 'Observability',
      badgeColor: 'badge-emerald',
      icon: Activity,
      color: 'var(--accent-emerald)',
      desc: 'Inspect historical execution traces, benchmark automated test suites, and audit system performance metrics.',
      actionText: 'View Runs & Tests'
    }
  ];

  // Checklist items
  const readinessChecklist = [
    {
      label: 'Node.js Express Backend',
      detail: 'REST API & SQLite persistence listening on Port 5000',
      status: backendHealthy ? 'ready' : 'offline',
      mandatory: true
    },
    {
      label: 'SQLite 3 Database (WAL Mode)',
      detail: 'Binary ACID storage active at backend/data/orbit_ai.db',
      status: dbConnected ? 'ready' : 'offline',
      mandatory: true
    },
    {
      label: 'Python FastAPI AI Service',
      detail: 'TF-IDF RAG, AST validation & tutor listening on Port 8000',
      status: aiServiceHealthy ? 'ready' : 'offline',
      mandatory: true
    },
    {
      label: 'Local Ollama Daemon',
      detail: ollamaOnline 
        ? 'Connected on Port 11434 with local model inference' 
        : 'Not running — Demo Mode is actively providing deterministic fallback',
      status: ollamaOnline ? 'ready' : 'optional',
      mandatory: false,
      fixCommand: 'ollama serve'
    },
    {
      label: 'Docker Container Sandbox',
      detail: dockerAvailable 
        ? 'Docker daemon detected; container-isolated execution active' 
        : 'Not running — Safe AST analysis active on local host if absent',
      status: dockerAvailable ? 'ready' : 'optional',
      mandatory: false,
      fixGuide: 'docs/DOCKER_SANDBOX_SETUP.md'
    },
    {
      label: 'Sandboxed Project Workspaces',
      detail: 'Secure file directory at workspaces/ with path-traversal denial',
      status: 'ready',
      mandatory: true
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '2.5rem' }}>
      
      {/* Hero Welcome Banner */}
      <section className="panel-glass" style={{ padding: '2rem 2.25rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '820px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(124, 58, 237, 0.3)', color: 'var(--accent-violet-light)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.85rem' }}>
              <Sparkles size={13} />
              <span>100% Free & Local-First AI Engineering Workstation</span>
            </div>
            
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: '0.65rem' }}>
              Welcome to ORBIT AI
            </h1>
            
            <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              ORBIT AI is your local AI engineering and learning workspace. Learn programming, practise DSA, explore AI models, work with course materials, build applications and experiment with AI agents from one place.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setCurrentTab('user-guide')}
                className="btn-primary"
                style={{ padding: '0.65rem 1.35rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                <Compass size={16} />
                Start Here: Beginner User Guide
                <ArrowRight size={15} />
              </button>

              <button 
                onClick={() => setCurrentTab('engineer')}
                className="btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                <Terminal size={16} color="var(--accent-indigo)" />
                Launch Software Engineer
              </button>

              <button 
                onClick={() => setCurrentTab('coding')}
                className="btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              >
                <Code2 size={16} color="var(--accent-amber)" />
                Practise DSA & LeetCode
              </button>
            </div>
          </div>

          {/* Quick HP Victus Profile Card */}
          <div style={{ minWidth: '260px', padding: '1rem 1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <Laptop size={14} color="var(--accent-blue)" />
              HP Victus Calibration
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Intel Core i7 • RTX 3050 (6GB)
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Optimized for <strong>Q4 quantized models (3B–8B)</strong> running with full GPU acceleration on 16GB RAM.
            </div>
            <div style={{ borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active AI Provider:</span>
              <span className={`badge ${isDemoMode ? 'badge-purple' : 'badge-emerald'}`}>
                {isDemoMode ? 'Demo Mode' : `Ollama (${activeModel})`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Local Readiness Checklist */}
      <section className="panel-glass" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--accent-emerald)" />
              Local System Readiness Checklist
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Live microservice diagnostics, persistence verification, and local dependency status.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            All core features operate 100% offline without paid cloud APIs.
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '0.85rem' }}>
          {readinessChecklist.map((item, idx) => (
            <div 
              key={idx}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <div style={{ marginTop: '0.1rem' }}>
                {item.status === 'ready' && <CheckCircle2 size={16} color="var(--accent-emerald)" />}
                {item.status === 'optional' && <HelpCircle size={16} color="var(--accent-amber)" />}
                {item.status === 'offline' && <AlertCircle size={16} color="var(--accent-rose)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item.label}
                  </span>
                  <span 
                    className={`badge ${
                      item.status === 'ready' 
                        ? 'badge-emerald' 
                        : item.status === 'optional' 
                        ? 'badge-amber' 
                        : 'badge-rose'
                    }`}
                    style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}
                  >
                    {item.status === 'ready' ? 'Ready' : item.status === 'optional' ? 'Optional' : 'Action Needed'}
                  </span>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                  {item.detail}
                </p>
                {item.fixCommand && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', background: 'rgba(0,0,0,0.25)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--accent-amber-light)' }}>
                    Tip: Run <code>{item.fixCommand}</code> to connect local LLM.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Explore ORBIT Modules Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Explore ORBIT Capabilities
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Select a specialized module designed for your learning or engineering objective.
            </p>
          </div>
          <button 
            onClick={() => setCurrentTab('user-guide')}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-violet-light)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            Read Tab-by-Tab Guide <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1rem' }}>
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.id}
                className="panel-glass"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
                onClick={() => setCurrentTab(card.id)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div 
                      style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '10px', 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '1px solid var(--border-glass)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: card.color 
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <span className={`badge ${card.badgeColor}`} style={{ fontSize: '0.68rem' }}>
                      {card.badge}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem' }}>
                    {card.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {card.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: card.color }}>
                    {card.actionText}
                  </span>
                  <ArrowRight size={14} color={card.color} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Beginner 3-Step Recommendation */}
      <section className="panel-glass" style={{ padding: '1.5rem 1.75rem', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          New to ORBIT AI? Suggested 3-Step Journey
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Follow these quick steps to get familiar with ORBIT's local intelligence and coding workflows.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-violet)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              1
            </div>
            <h5 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Review the User Guide
            </h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Browse the <strong>Start Here</strong> guide to understand each tab, offline capabilities, and 10 goal-based paths.
            </p>
            <button 
              onClick={() => setCurrentTab('user-guide')}
              className="btn-secondary"
              style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.74rem', padding: '0.35rem' }}
            >
              Open User Guide
            </button>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-amber)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              2
            </div>
            <h5 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Solve a DSA Problem
            </h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Open the <strong>Coding Playground</strong>, select Two Sum in C++ or Python, and ask the tutor for an algorithmic dry-run.
            </p>
            <button 
              onClick={() => setCurrentTab('coding')}
              className="btn-secondary"
              style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.74rem', padding: '0.35rem' }}
            >
              Open Coding Playground
            </button>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-indigo)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              3
            </div>
            <h5 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Generate Full-Stack Project
            </h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Use the <strong>Software Engineer</strong> workspace to plan and scaffold a complete web app with a real binary SQLite database.
            </p>
            <button 
              onClick={() => setCurrentTab('engineer')}
              className="btn-secondary"
              style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.74rem', padding: '0.35rem' }}
            >
              Open Software Engineer
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;

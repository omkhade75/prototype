import React, { useState } from 'react';
import { OrbitLogo } from '../components/OrbitLogo';
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
  Laptop,
  Zap,
  ChevronRight,
  HardDrive,
  Copy,
  Check
} from 'lucide-react';

export function Home({ systemStatus, setCurrentTab }) {
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Dynamic system status evaluation
  const backendHealthy = systemStatus?.backend?.status === 'healthy';
  const dbConnected = Boolean(systemStatus?.database?.engine);
  const aiServiceHealthy = systemStatus?.ai_service?.status === 'healthy';
  const isDemoMode = systemStatus?.ai_service?.is_demo_mode ?? true;
  const ollamaOnline = Boolean(systemStatus?.ai_service?.ollama_reachable);
  const activeModel = systemStatus?.backend?.active_model || systemStatus?.ai_service?.configured_model || 'llama3';
  const dockerAvailable = Boolean(systemStatus?.backend?.docker_available);

  // Quick Action feature cards data preserved intact
  const featureCards = [
    {
      id: 'laptop-copilot',
      title: 'Laptop Copilot & Privacy Shield',
      badge: 'Zero-Access Shield',
      badgeColor: 'badge-teal',
      icon: Laptop,
      color: 'var(--accent-teal)',
      glowColor: 'rgba(20, 184, 166, 0.28)',
      tagline: 'Power, Load Shifting & Internet Accelerator',
      desc: 'Control laptop power (shutdown in 5 min), shift background loads to free RAM, accelerate WiFi, and enforce zero-access privacy shields.',
      actionText: 'Open Laptop Copilot',
      featured: true
    },
    {
      id: 'engineer',
      title: 'AI Software Engineer',
      badge: 'Autonomous',
      badgeColor: 'badge-indigo',
      icon: Terminal,
      color: 'var(--accent-indigo)',
      glowColor: 'rgba(99, 102, 241, 0.28)',
      tagline: 'Full-Stack Scaffold & SQLite Persistence',
      desc: 'Turn natural-language prompts into runnable full-stack React + Express applications backed by real SQLite databases on disk.',
      actionText: 'Build Full-Stack App',
      featured: true
    },
    {
      id: 'course-lab',
      title: 'Course-to-Code Lab',
      badge: 'Academic',
      badgeColor: 'badge-purple',
      icon: GraduationCap,
      color: 'var(--accent-violet)',
      glowColor: 'rgba(139, 92, 246, 0.25)',
      tagline: 'Curriculum & Jupyter Synthesizer',
      desc: 'Ingest university slides and PDFs, harvest code snippets, and generate validated Jupyter Notebooks (.ipynb) ready for Google Colab.',
      actionText: 'Open Course Lab',
      featured: true
    },
    {
      id: 'coding',
      title: 'Coding Playground & DSA',
      badge: 'Bilingual C++/Python',
      badgeColor: 'badge-amber',
      icon: Code2,
      color: 'var(--accent-amber)',
      glowColor: 'rgba(245, 158, 11, 0.22)',
      tagline: '4 Guided Modes & LeetCode Suite',
      desc: 'Master algorithms with 4 guided modes (Learn, Build With Me, Debug, Practise), LeetCode catalogue, and AST dry-run traces.',
      actionText: 'Start Coding'
    },
    {
      id: 'models',
      title: 'AI Model Library',
      badge: 'Hardware Aware',
      badgeColor: 'badge-purple',
      icon: Boxes,
      color: 'var(--accent-violet)',
      glowColor: 'rgba(168, 85, 247, 0.22)',
      tagline: 'VRAM Profiler & Benchmark Matrix',
      desc: 'Discover open-weights models tailored to your HP Victus laptop (6 GB VRAM), benchmark responses, and compare rubric scores.',
      actionText: 'Explore Models'
    },
    {
      id: 'knowledge',
      title: 'Knowledge Hub (RAG)',
      badge: 'Zero Cloud APIs',
      badgeColor: 'badge-blue',
      icon: BookOpen,
      color: 'var(--accent-blue)',
      glowColor: 'rgba(59, 130, 246, 0.22)',
      tagline: 'Local TF-IDF Citation Engine',
      desc: 'Upload notes and textbooks; ask questions grounded in text passages with verifiable page citations and transparent TF-IDF math.',
      actionText: 'Search Knowledge'
    },
    {
      id: 'agent',
      title: 'Agent Playground',
      badge: 'Observable',
      badgeColor: 'badge-magenta',
      icon: Bot,
      color: 'var(--accent-magenta)',
      glowColor: 'rgba(236, 72, 153, 0.22)',
      tagline: 'Step-by-Step Reasoner & Tool Bus',
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
      glowColor: 'rgba(6, 182, 212, 0.22)',
      tagline: 'Kahn Cycle Detection & Pause States',
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
      glowColor: 'rgba(16, 185, 129, 0.22)',
      tagline: 'Execution Traces & Regression Tests',
      desc: 'Inspect historical execution traces, benchmark automated test suites, and audit system performance metrics.',
      actionText: 'View Runs & Tests'
    }
  ];

  // Readiness checklist items preserved intact
  const readinessChecklist = [
    {
      label: 'Node.js Express Backend',
      detail: 'REST API & SQLite persistence listening on Port 5000',
      status: backendHealthy ? 'ready' : 'offline',
      mandatory: true,
      port: ':5000'
    },
    {
      label: 'SQLite 3 Database (WAL Mode)',
      detail: 'Binary ACID storage active at backend/data/orbit_ai.db',
      status: dbConnected ? 'ready' : 'offline',
      mandatory: true,
      port: 'disk'
    },
    {
      label: 'Python FastAPI AI Service',
      detail: 'TF-IDF RAG, AST validation & tutor listening on Port 8000',
      status: aiServiceHealthy ? 'ready' : 'offline',
      mandatory: true,
      port: ':8000'
    },
    {
      label: 'Local Ollama Daemon',
      detail: ollamaOnline 
        ? 'Connected on Port 11434 with local model inference' 
        : 'Not running — Demo Mode is actively providing deterministic fallback',
      status: ollamaOnline ? 'ready' : 'optional',
      mandatory: false,
      port: ':11434',
      fixCommand: 'ollama serve'
    },
    {
      label: 'Docker Container Sandbox',
      detail: dockerAvailable 
        ? 'Docker daemon detected; container-isolated execution active' 
        : 'Not running — Safe AST analysis active on local host if absent',
      status: dockerAvailable ? 'ready' : 'optional',
      mandatory: false,
      port: 'daemon',
      fixGuide: 'docs/DOCKER_SANDBOX_SETUP.md'
    },
    {
      label: 'Sandboxed Project Workspaces',
      detail: 'Secure file directory at workspaces/ with path-traversal denial',
      status: 'ready',
      mandatory: true,
      port: 'fs'
    }
  ];

  const readyCount = readinessChecklist.filter(item => item.status === 'ready').length;
  const healthPercent = Math.round((readyCount / readinessChecklist.length) * 100);

  const handleCopyCmd = (cmd) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="orbit-home-root">
      {/* 2026 Liquid Glass & Aurora Keyframes */}
      <style>{`
        .orbit-home-root {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 1440px;
          margin: 0 auto;
          padding-bottom: 3rem;
          position: relative;
        }

        /* Ambient floating orbs */
        .orbit-glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.45;
          animation: floatOrb 18s ease-in-out infinite alternate;
        }

        .orbit-glow-orb-1 {
          width: 520px;
          height: 380px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(99, 102, 241, 0.15) 60%, transparent 80%);
          top: -80px;
          left: -40px;
        }

        .orbit-glow-orb-2 {
          width: 440px;
          height: 360px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.30) 0%, rgba(217, 119, 6, 0.08) 60%, transparent 80%);
          top: 40px;
          right: -20px;
          animation-delay: -6s;
          animation-duration: 22s;
        }

        .orbit-glow-orb-3 {
          width: 400px;
          height: 300px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.28) 0%, rgba(139, 92, 246, 0.08) 60%, transparent 80%);
          bottom: 25%;
          left: 30%;
          animation-delay: -11s;
          animation-duration: 25s;
        }

        @keyframes floatOrb {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(35px, -25px, 0) scale(1.08);
          }
          100% {
            transform: translate3d(-25px, 25px, 0) scale(0.94);
          }
        }

        /* Hero container with dynamic aurora background */
        .orbit-hero-panel {
          position: relative;
          z-index: 1;
          border-radius: 24px;
          padding: 2.75rem 2.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%),
                      radial-gradient(ellipse 90% 80% at 50% -20%, rgba(139, 92, 246, 0.22), transparent 75%);
          border: 1px solid var(--border-glass);
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          overflow: hidden;
        }

        /* Subtle grid line overlay in hero */
        .orbit-hero-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse 80% 65% at 50% 30%, black 20%, transparent 90%);
          -webkit-mask-image: radial-gradient(ellipse 80% 65% at 50% 30%, black 20%, transparent 90%);
          pointer-events: none;
        }

        /* Animated gradient text for ORBIT AI */
        .orbit-gradient-brand {
          background: linear-gradient(135deg, #ffffff 0%, #f472b6 22%, #c084fc 45%, #38bdf8 70%, #34d399 95%);
          background-size: 250% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shineGradient 7s linear infinite;
          display: inline-block;
          font-weight: 850;
          letter-spacing: -0.03em;
        }

        @keyframes shineGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Shimmering chip tag */
        .orbit-chip-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.95rem;
          border-radius: 9999px;
          background: rgba(139, 92, 246, 0.14);
          border: 1px solid rgba(139, 92, 246, 0.4);
          box-shadow: 0 0 16px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          color: var(--accent-violet-light);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          margin-bottom: 1.25rem;
          backdrop-filter: blur(12px);
        }

        .orbit-pulse-ping {
          position: relative;
          display: inline-flex;
          width: 8px;
          height: 8px;
        }

        .orbit-pulse-ping::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: var(--accent-emerald);
          opacity: 0.75;
          animation: pingRing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .orbit-pulse-ping::after {
          content: '';
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-emerald-light);
          box-shadow: 0 0 8px var(--accent-emerald);
        }

        @keyframes pingRing {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* Quick stats strip */
        .orbit-stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 900px) {
          .orbit-stats-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 520px) {
          .orbit-stats-bar {
            grid-template-columns: 1fr;
          }
        }

        .orbit-stat-card {
          padding: 1.15rem 1.35rem;
          border-radius: 16px;
          background: var(--glass-card);
          border: 1px solid var(--border-glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          gap: 1.1rem;
          transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
          box-shadow: var(--shadow-glass-card);
        }

        .orbit-stat-card:hover {
          transform: translateY(-3px);
          border-color: var(--border-glass-hover);
          box-shadow: 0 12px 30px -6px rgba(0, 0, 0, 0.45);
        }

        .orbit-stat-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* Bento Grid 2026 Layout */
        .orbit-bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.25rem;
          position: relative;
          z-index: 1;
        }

        .orbit-bento-span-7 {
          grid-column: span 7;
        }

        .orbit-bento-span-5 {
          grid-column: span 5;
        }

        .orbit-bento-span-4 {
          grid-column: span 4;
        }

        @media (max-width: 1080px) {
          .orbit-bento-span-7,
          .orbit-bento-span-5,
          .orbit-bento-span-4 {
            grid-column: span 6;
          }
        }

        @media (max-width: 720px) {
          .orbit-bento-span-7,
          .orbit-bento-span-5,
          .orbit-bento-span-4 {
            grid-column: span 12;
          }
        }

        /* 2026 Micro-interacting Glass Bento Cards */
        .orbit-bento-card {
          position: relative;
          border-radius: 20px;
          background: var(--glass-card);
          border: 1px solid var(--border-glass);
          padding: 1.6rem 1.65rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.28s ease,
                      box-shadow 0.28s ease,
                      background 0.28s ease;
          box-shadow: var(--shadow-glass-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .orbit-bento-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(400px circle at var(--mouse-x, 80%) var(--mouse-y, 20%), var(--card-glow, rgba(139, 92, 246, 0.15)), transparent 80%);
          opacity: 0.6;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .orbit-bento-card:hover {
          transform: translateY(-5px);
          border-color: var(--border-glass-hover);
          background: var(--glass-card-hover);
          box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.6), 0 0 24px -4px var(--card-glow, rgba(139, 92, 246, 0.25));
        }

        .orbit-bento-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, var(--card-glow, #8b5cf6) 50%, transparent 100%);
          opacity: 0.65;
          transition: opacity 0.25s ease, height 0.25s ease;
        }

        .orbit-bento-card:hover::after {
          opacity: 1;
          height: 2.5px;
        }

        .orbit-bento-card:hover::before {
          opacity: 1;
        }

        .orbit-bento-card .orbit-action-arrow {
          transition: transform 0.22s ease, color 0.22s ease;
        }

        .orbit-bento-card:hover .orbit-action-arrow {
          transform: translateX(5px);
        }

        /* Animated Progress bar in readiness */
        .orbit-progress-track {
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
          position: relative;
        }

        .orbit-progress-fill {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%);
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Pulsing indicator states */
        .orbit-indicator-ready {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);
          animation: pulseReady 2.2s infinite;
        }

        .orbit-indicator-optional {
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.7);
          animation: pulseOptional 2.2s infinite;
        }

        .orbit-indicator-offline {
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
        }

        @keyframes pulseReady {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.15); }
        }

        @keyframes pulseOptional {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }

        /* Journey step hover lift */
        .orbit-journey-card {
          padding: 1.35rem 1.45rem;
          border-radius: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-glass);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
        }

        .orbit-journey-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-glass-hover);
          box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.4);
        }

        /* Pure OLED Black Dark Mode Overrides (Zero Blue, 0% Idle Compositing) */
        [data-theme="dark"] .orbit-glow-orb {
          display: none !important;
        }

        [data-theme="dark"] .orbit-hero-panel {
          background: #000000 !important;
          border: 1px solid #1a1a1a !important;
          box-shadow: none !important;
        }

        [data-theme="dark"] .orbit-hero-panel::before {
          display: none !important;
        }

        [data-theme="dark"] .orbit-gradient-brand {
          background: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          animation: none !important;
        }

        [data-theme="dark"] .orbit-chip-pill {
          background: #111111 !important;
          border-color: #222222 !important;
          color: #cbd5e1 !important;
          box-shadow: none !important;
        }

        [data-theme="dark"] .orbit-stat-card {
          background: #080808 !important;
          border-color: #1a1a1a !important;
          box-shadow: none !important;
        }

        [data-theme="dark"] .orbit-stat-card:hover {
          border-color: #333333 !important;
        }

        [data-theme="dark"] .orbit-bento-card {
          background: #080808 !important;
          border-color: #1a1a1a !important;
          box-shadow: none !important;
        }

        [data-theme="dark"] .orbit-bento-card::before,
        [data-theme="dark"] .orbit-bento-card::after {
          display: none !important;
        }

        [data-theme="dark"] .orbit-bento-card:hover {
          background: #121212 !important;
          border-color: #333333 !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.9) !important;
        }

        [data-theme="dark"] .orbit-journey-card {
          background: #080808 !important;
          border-color: #1a1a1a !important;
          box-shadow: none !important;
        }

        [data-theme="dark"] .orbit-journey-card:hover {
          border-color: #333333 !important;
        }
      `}</style>

      {/* Floating Animated Ambient Glow Orbs */}
      <div className="orbit-glow-orb orbit-glow-orb-1" aria-hidden="true" />
      <div className="orbit-glow-orb orbit-glow-orb-2" aria-hidden="true" />
      <div className="orbit-glow-orb orbit-glow-orb-3" aria-hidden="true" />

      {/* 1. ANIMATED GRADIENT HERO SECTION */}
      <section className="orbit-hero-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '820px' }}>
            
            {/* Shimmering Badge with OrbitLogo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)',
                boxShadow: 'none'
              }}>
                <OrbitLogo size={36} animated={false} />
              </div>
              <div className="orbit-chip-pill" style={{ marginBottom: 0 }}>
                <span className="orbit-pulse-ping" />
                <Sparkles size={14} color="var(--text-muted)" />
                <span>Local AI Engineering Workstation</span>
                <span style={{ opacity: 0.5, margin: '0 0.2rem' }}>•</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>100% Offline Capable</span>
              </div>
            </div>

            {/* Glowing Large Typography */}
            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 5vw, 3.4rem)', 
              fontWeight: 850, 
              color: 'var(--text-main)', 
              lineHeight: 1.15, 
              letterSpacing: '-0.035em', 
              marginBottom: '1rem' 
            }}>
              Architect, Code & Master AI with{' '}
              <span className="orbit-gradient-brand">ORBIT AI</span>
            </h1>

            {/* Punchy Tagline */}
            <p style={{ 
              fontSize: '1.08rem', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.65, 
              marginBottom: '1.85rem',
              maxWidth: '740px'
            }}>
              Your unified, privacy-first local workspace. Generate production-ready full-stack apps with SQLite, solve algorithmic DSA with real-time AST traces, query local knowledge with zero cloud telemetry, and run autonomous agent loops on bare metal.
            </p>

            {/* Quick Launch Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setCurrentTab('user-guide')}
                className="btn-primary"
                style={{ 
                  padding: '0.75rem 1.6rem', 
                  fontSize: '0.92rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem', 
                  fontWeight: 700,
                  borderRadius: '12px'
                }}
              >
                <Compass size={18} />
                Explore User Guide
                <ArrowRight size={16} />
              </button>

              <button 
                onClick={() => setCurrentTab('engineer')}
                className="btn-secondary"
                style={{ 
                  padding: '0.75rem 1.45rem', 
                  fontSize: '0.92rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem', 
                  fontWeight: 600,
                  borderRadius: '12px'
                }}
              >
                <Terminal size={17} color="var(--accent-indigo)" />
                Launch Full-Stack Engineer
              </button>

              <button 
                onClick={() => setCurrentTab('coding')}
                className="btn-secondary"
                style={{ 
                  padding: '0.75rem 1.45rem', 
                  fontSize: '0.92rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem', 
                  fontWeight: 600,
                  borderRadius: '12px'
                }}
              >
                <Code2 size={17} color="var(--accent-amber)" />
                Practise DSA & LeetCode
              </button>
            </div>
          </div>

          {/* Spatial Depth Hardware Calibration Card */}
          <div style={{ 
            minWidth: '290px', 
            maxWidth: '340px',
            flex: '1 1 290px',
            padding: '1.35rem 1.45rem', 
            borderRadius: '18px', 
            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)', 
            border: '1px solid var(--border-glass)', 
            boxShadow: '0 12px 36px -6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.85rem',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', fontWeight: 750, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <Laptop size={15} color="var(--accent-cyan)" />
                Victus Calibration
              </div>
              <span className={`badge ${backendHealthy ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem' }}>
                {backendHealthy ? 'Online' : 'Standby'}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Intel Core i7 • RTX 3050
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--accent-violet-light)', fontWeight: 600, marginTop: '0.15rem' }}>
                6 GB Dedicated VRAM • 16 GB RAM
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Calibrated for <strong>Q4 quantized LLMs (3B–8B)</strong> running with full GPU offloading, zero cloud leaks, and persistent caching.
            </p>

            <div style={{ borderTop: '1px solid var(--border-glass-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Cpu size={13} color="var(--text-muted)" />
                Active Provider:
              </span>
              <span className={`badge ${isDemoMode ? 'badge-purple' : 'badge-emerald'}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                {isDemoMode ? '⚡ Demo Mode' : `🟢 Ollama (${activeModel})`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK STATS ROW */}
      <section className="orbit-stats-bar">
        <div className="orbit-stat-card">
          <div className="orbit-stat-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet-light)' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>8 Modules</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Full-Stack, RAG, Agents & DSA</div>
          </div>
        </div>

        <div className="orbit-stat-card">
          <div className="orbit-stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald-light)' }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>0 ms Cloud</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>100% Offline & Zero API Cost</div>
          </div>
        </div>

        <div className="orbit-stat-card">
          <div className="orbit-stat-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan-light)' }}>
            <HardDrive size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>SQLite WAL</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>ACID Binary Disk Persistence</div>
          </div>
        </div>

        <div className="orbit-stat-card">
          <div className="orbit-stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber-light)' }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>{healthPercent}% Ready</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{readyCount} of 6 Subsystems Active</div>
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID LAYOUT FOR FEATURE CARDS */}
      <section style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-violet-light)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              <Sparkles size={13} />
              Modular Architecture
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Explore ORBIT Capabilities
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Asymmetric bento workstation designed for deep learning, algorithmic mastery, and autonomous system design.
            </p>
          </div>

          <button 
            onClick={() => setCurrentTab('user-guide')}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid var(--border-glass)', 
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              color: 'var(--text-main)', 
              fontSize: '0.82rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>Read Tab-by-Tab Guide</span>
            <ChevronRight size={15} color="var(--accent-violet-light)" />
          </button>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="orbit-bento-grid">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            const isSpan7 = idx === 0;
            const isSpan5 = idx === 1;
            const spanClass = isSpan7 ? 'orbit-bento-span-7' : isSpan5 ? 'orbit-bento-span-5' : 'orbit-bento-span-4';

            return (
              <div 
                key={card.id}
                className={`orbit-bento-card ${spanClass}`}
                style={{ '--card-glow': card.glowColor }}
                onClick={() => setCurrentTab(card.id)}
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.15rem' }}>
                    <div 
                      style={{ 
                        width: '46px', 
                        height: '46px', 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)', 
                        border: '1px solid var(--border-glass)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: card.color,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {card.featured && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 750, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.06em', 
                          color: 'var(--accent-violet-light)', 
                          background: 'rgba(139, 92, 246, 0.12)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '6px',
                          border: '1px solid rgba(139, 92, 246, 0.25)' 
                        }}>
                          Flagship
                        </span>
                      )}
                      <span className={`badge ${card.badgeColor}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                        {card.badge}
                      </span>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 style={{ fontSize: isSpan7 || isSpan5 ? '1.25rem' : '1.08rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem', letterSpacing: '-0.015em' }}>
                    {card.title}
                  </h3>
                  
                  <div style={{ fontSize: '0.74rem', fontWeight: 600, color: card.color, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {card.tagline}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                    {card.desc}
                  </p>
                </div>

                {/* Bottom Action Strip */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  borderTop: '1px solid var(--border-glass-subtle)', 
                  paddingTop: '1rem', 
                  marginTop: '1.25rem' 
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: card.color, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {card.actionText}
                  </span>
                  <div className="orbit-action-arrow" style={{ display: 'flex', alignItems: 'center', color: card.color }}>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ANIMATED SYSTEM READINESS CHECKLIST */}
      <section className="panel-glass" style={{ padding: '1.85rem 2.15rem', position: 'relative', zIndex: 1, borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={19} color="var(--accent-emerald)" />
              </div>
              <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.015em', margin: 0 }}>
                Local System Readiness Checklist
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Live runtime diagnostics, container sandboxing, and offline zero-leak persistence verification.
            </p>
          </div>

          {/* Overall Health Indicator Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ minWidth: '150px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status Score</span>
                <span style={{ color: 'var(--accent-emerald)' }}>{healthPercent}% Nominal</span>
              </div>
              <div className="orbit-progress-track">
                <div className="orbit-progress-fill" style={{ width: `${healthPercent}%` }} />
              </div>
            </div>

            <span className={`badge ${healthPercent === 100 ? 'badge-emerald' : 'badge-amber'}`} style={{ padding: '0.35rem 0.75rem', fontSize: '0.74rem' }}>
              {healthPercent === 100 ? 'All Systems Go' : 'Partial Setup'}
            </span>
          </div>
        </div>

        {/* Readiness Micro-cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
          {readinessChecklist.map((item, idx) => {
            const isReady = item.status === 'ready';
            const isOptional = item.status === 'optional';
            const isOffline = item.status === 'offline';

            return (
              <div 
                key={idx}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: '14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.9rem',
                  position: 'relative',
                  transition: 'border-color var(--transition-fast), transform var(--transition-fast)'
                }}
              >
                {/* Animated Pulsing Status Dot */}
                <div style={{ marginTop: '0.2rem', position: 'relative' }}>
                  {isReady && (
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-emerald)' }} className="orbit-indicator-ready" />
                  )}
                  {isOptional && (
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-amber)' }} className="orbit-indicator-optional" />
                  )}
                  {isOffline && (
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-rose)' }} className="orbit-indicator-offline" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                      {item.label}
                    </span>
                    <span 
                      className={`badge ${
                        isReady 
                          ? 'badge-emerald' 
                          : isOptional 
                          ? 'badge-amber' 
                          : 'badge-rose'
                      }`}
                      style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}
                    >
                      {isReady ? 'Active' : isOptional ? 'Optional' : 'Offline'}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {item.detail}
                  </p>

                  {/* Fix Command Terminal Snippet */}
                  {item.fixCommand && (
                    <div style={{ 
                      marginTop: '0.55rem', 
                      fontSize: '0.74rem', 
                      background: 'rgba(0,0,0,0.3)', 
                      padding: '0.35rem 0.65rem', 
                      borderRadius: '8px', 
                      fontFamily: 'var(--font-mono)', 
                      color: 'var(--accent-amber-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <span>$ {item.fixCommand}</span>
                      <button 
                        onClick={() => handleCopyCmd(item.fixCommand)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: copiedCmd ? 'var(--accent-emerald)' : 'var(--text-muted)', 
                          cursor: 'pointer',
                          padding: '0.1rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Copy command"
                      >
                        {copiedCmd ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  )}

                  {item.fixGuide && !dockerAvailable && (
                    <div style={{ marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Setup guide: <code style={{ color: 'var(--accent-cyan)' }}>{item.fixGuide}</code>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. SUGGESTED 3-STEP JOURNEY */}
      <section className="panel-glass" style={{ 
        padding: '1.85rem 2.15rem', 
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(37, 99, 235, 0.05) 50%, rgba(6, 182, 212, 0.06) 100%)',
        position: 'relative',
        zIndex: 1,
        borderRadius: '20px'
      }}>
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-violet-light)', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            <Compass size={13} />
            Getting Started
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.015em', margin: 0 }}>
            New to ORBIT AI? Suggested 3-Step Journey
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
            Follow these streamlined steps to get familiar with offline inference, guided tutoring, and full-stack generation.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
          
          {/* Step 1 */}
          <div className="orbit-journey-card">
            <div>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, var(--accent-violet) 0%, var(--accent-violet-light) 100%)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.85rem', 
                fontWeight: 800, 
                marginBottom: '0.85rem',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
              }}>
                1
              </div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 750, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Review the User Guide
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Browse the <strong>Start Here</strong> guide to understand each module, zero-cloud API safeguards, and 10 goal-based paths.
              </p>
            </div>
            <button 
              onClick={() => setCurrentTab('user-guide')}
              className="btn-secondary"
              style={{ marginTop: '1.15rem', width: '100%', fontSize: '0.8rem', padding: '0.55rem', borderRadius: '10px' }}
            >
              Open User Guide
            </button>
          </div>

          {/* Step 2 */}
          <div className="orbit-journey-card">
            <div>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, var(--accent-amber) 0%, var(--accent-amber-light) 100%)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.85rem', 
                fontWeight: 800, 
                marginBottom: '0.85rem',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
              }}>
                2
              </div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 750, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Solve a DSA Problem
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Open the <strong>Coding Playground</strong>, select Two Sum in C++ or Python, and ask the tutor for an algorithmic dry-run trace.
              </p>
            </div>
            <button 
              onClick={() => setCurrentTab('coding')}
              className="btn-secondary"
              style={{ marginTop: '1.15rem', width: '100%', fontSize: '0.8rem', padding: '0.55rem', borderRadius: '10px' }}
            >
              Open Coding Playground
            </button>
          </div>

          {/* Step 3 */}
          <div className="orbit-journey-card">
            <div>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, var(--accent-indigo) 0%, #818cf8 100%)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.85rem', 
                fontWeight: 800, 
                marginBottom: '0.85rem',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}>
                3
              </div>
              <h4 style={{ fontSize: '0.96rem', fontWeight: 750, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Scaffold Full-Stack Project
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Use the <strong>Software Engineer</strong> workspace to plan and scaffold a complete web app backed by real SQLite databases.
              </p>
            </div>
            <button 
              onClick={() => setCurrentTab('engineer')}
              className="btn-secondary"
              style={{ marginTop: '1.15rem', width: '100%', fontSize: '0.8rem', padding: '0.55rem', borderRadius: '10px' }}
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

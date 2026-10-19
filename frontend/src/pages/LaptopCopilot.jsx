import React, { useState, useEffect } from 'react';
import { 
  Power, 
  Zap, 
  Wifi, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  RotateCcw, 
  Terminal, 
  Cpu, 
  Clock, 
  Activity, 
  BatteryCharging, 
  Battery, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';

export function LaptopCopilot() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [powerPending, setPowerPending] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizingNet, setOptimizingNet] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [notification, setNotification] = useState(null);
  const [netResult, setNetResult] = useState(null);
  const [optResult, setOptResult] = useState(null);
  const notifTimerRef = React.useRef(null);

  const showNotification = (notif) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification(notif);
    // Auto-dismiss within 3.5s to avoid popup clutter
    notifTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleCleanTemp = async () => {
    try {
      setCleaning(true);
      const res = await api.sendSystemPrompt('clean temp files and free disk space');
      showNotification({ type: 'success', text: res.message });
      fetchMetrics();
      setCliHistory(prev => [
        ...prev,
        { sender: 'user', text: 'clean temp files' },
        { sender: 'ai', text: res.message }
      ]);
    } catch (err) {
      showNotification({ type: 'error', text: err.message });
    } finally {
      setCleaning(false);
    }
  };

  // Terminal chat state
  const [cliInput, setCliInput] = useState('');
  const [cliHistory, setCliHistory] = useState([
    {
      sender: 'system',
      text: 'ORBIT AI Laptop Copilot initialized. Type commands like "shutdown in 5 min", "shift load", "make internet fast", or "status". Privacy Shield is active.'
    }
  ]);

  const fetchMetrics = async () => {
    try {
      const res = await api.getSystemMetrics();
      if (res?.data) {
        setMetrics(res.data);
      } else if (res?.cpu_percent !== undefined) {
        setMetrics(res);
      }
    } catch (err) {
      console.warn('Could not refresh system metrics:', err.message);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Poll every 25 seconds; skip when document is hidden to keep CPU/fan idle
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchMetrics();
      }
    }, 25000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        fetchMetrics();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, []);

  const handleShutdown = async (minutes) => {
    try {
      setLoading(true);
      const res = await api.scheduleShutdown({ minutes });
      setPowerPending({ minutes, scheduledFor: res.scheduled_for });
      showNotification({ type: 'success', text: res.message });
      setCliHistory(prev => [
        ...prev,
        { sender: 'user', text: `shutdown in ${minutes} minutes` },
        { sender: 'ai', text: res.message }
      ]);
    } catch (err) {
      showNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelShutdown = async () => {
    try {
      setLoading(true);
      const res = await api.cancelShutdown();
      setPowerPending(null);
      showNotification({ type: 'info', text: res.message });
      setCliHistory(prev => [
        ...prev,
        { sender: 'user', text: 'cancel shutdown' },
        { sender: 'ai', text: res.message }
      ]);
    } catch (err) {
      showNotification({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeLoad = async () => {
    try {
      setOptimizing(true);
      const res = await api.optimizePerformance();
      setOptResult(res);
      showNotification({ type: 'success', text: res.message });
      fetchMetrics();
      setCliHistory(prev => [
        ...prev,
        { sender: 'user', text: 'boost performance & shift load' },
        { sender: 'ai', text: res.message }
      ]);
    } catch (err) {
      showNotification({ type: 'error', text: err.message });
    } finally {
      setOptimizing(false);
    }
  };

  const handleOptimizeNetwork = async () => {
    try {
      setOptimizingNet(true);
      const res = await api.optimizeNetwork();
      setNetResult(res);
      showNotification({ type: 'success', text: res.message });
      fetchMetrics();
      setCliHistory(prev => [
        ...prev,
        { sender: 'user', text: 'make internet fast' },
        { sender: 'ai', text: res.message }
      ]);
    } catch (err) {
      showNotification({ type: 'error', text: err.message });
    } finally {
      setOptimizingNet(false);
    }
  };

  const handleCliSubmit = async (e) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const userPrompt = cliInput.trim();
    setCliInput('');
    setCliHistory(prev => [...prev, { sender: 'user', text: userPrompt }]);

    try {
      const res = await api.sendSystemPrompt(userPrompt);
      if (res.blocked) {
        setCliHistory(prev => [...prev, { sender: 'shield', text: res.message }]);
      } else {
        setCliHistory(prev => [...prev, { sender: 'ai', text: res.message }]);
        if (res.category === 'power' && userPrompt.toLowerCase().includes('shutdown')) {
          fetchMetrics();
        }
      }
    } catch (err) {
      setCliHistory(prev => [
        ...prev,
        { sender: 'error', text: `Command failed: ${err.message}` }
      ]);
    }
  };

  const bat = metrics?.battery || {};
  const isCharging = bat?.power_plugged;

  return (
    <div className="tab-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Top Notification Toast - Auto-dismissing subtle banner */}
      {notification && (
        <div 
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${notification.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            color: notification.type === 'error' ? '#fca5a5' : '#86efac',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span style={{ fontSize: '0.825rem', fontWeight: 500 }}>{notification.text}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '0.75rem', opacity: 0.7 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* CPU Status Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CPU Load
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-violet)' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {metrics ? `${metrics.cpu_percent}%` : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Multi-core utilization
          </div>
        </div>

        {/* RAM Status Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RAM Utilization
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {metrics ? `${metrics.memory_percent}%` : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {metrics ? `${metrics.memory_available_gb} GB free of ${metrics.memory_total_gb} GB` : 'Monitoring RAM'}
          </div>
        </div>

        {/* Battery & Power Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Power & Battery
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>
              {isCharging ? <BatteryCharging size={18} /> : <Battery size={18} />}
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {bat?.battery_percent !== undefined ? `${bat.battery_percent}%` : 'AC Power'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {isCharging ? 'Plugged In (High Performance)' : 'On Battery'}
          </div>
        </div>

        {/* Disk Storage Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Free Storage (C:)
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(20, 184, 166, 0.1)', color: 'var(--accent-teal)' }}>
              <HardDrive size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {metrics ? `${metrics.disk_free_gb} GB` : '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {metrics ? `${metrics.disk_percent}% used (${metrics.disk_total_gb} GB total)` : 'Free storage'}
          </div>
        </div>

        {/* Privacy Shield Status Card */}
        <div className="card" style={{ padding: '1.25rem', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Privacy Shield
            </span>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            LOCKED & SAFE
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Personal files & keys completely blocked
          </div>
        </div>
      </div>

      {/* Main Grid: Control Panels and Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Action Control Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Power Control Section */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '8px', borderRadius: '9px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>
                <Power size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>System Power Management</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Automate and schedule safe shutdown, restart, and workstation lock
                </p>
              </div>
            </div>

            {/* Pending Shutdown Alert */}
            {powerPending && (
              <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.9rem' }}>
                      Shutdown Scheduled ({powerPending.minutes} min)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Target Time: {powerPending.scheduledFor}
                    </div>
                  </div>
                  <button 
                    onClick={handleCancelShutdown} 
                    className="btn-danger"
                    disabled={loading}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Cancel Shutdown
                  </button>
                </div>
              </div>
            )}

            {/* Shutdown Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[5, 10, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleShutdown(mins)}
                  disabled={loading}
                  className="btn-secondary"
                  style={{ flex: 1, minWidth: '90px', padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}
                >
                  <Clock size={14} style={{ marginRight: '4px' }} />
                  {mins} min
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleShutdown(customMinutes)}
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1, padding: '0.65rem 1rem' }}
              >
                <Power size={16} style={{ marginRight: '6px' }} />
                Shutdown in {customMinutes} min
              </button>
              
              <button
                onClick={handleCancelShutdown}
                disabled={loading}
                className="btn-secondary"
                style={{ padding: '0.65rem 1rem' }}
              >
                Abort
              </button>
            </div>
          </div>

          {/* Load Shifting & Performance Engine */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '8px', borderRadius: '9px', background: 'rgba(168, 85, 247, 0.12)', color: 'var(--accent-violet)' }}>
                <Zap size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Workload Shifting & Performance</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Throttles background consumers and trims unneeded memory working sets
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Shifts process priorities of non-essential background tasks (cloud syncs, telemetry updaters) to low/idle priority, and reclaims memory pages using Windows PSAPI.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                onClick={handleOptimizeLoad}
                disabled={optimizing}
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Zap size={16} className={optimizing ? 'spin' : ''} />
                {optimizing ? 'Shifting System Loads...' : 'Boost Performance & Shift Load'}
              </button>

              <button
                onClick={handleCleanTemp}
                disabled={cleaning}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <HardDrive size={16} className={cleaning ? 'spin' : ''} />
                {cleaning ? 'Cleaning Cache Files...' : 'Clean Temp Files & Free Disk'}
              </button>
            </div>

            {/* Live Load Shift Telemetry Feedback */}
            {optResult && (
              <div style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Background Priority Shift:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{optResult.shifted_processes_count} process(es) demoted</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Memory Pages Trimmed:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{optResult.trimmed_processes_count} apps optimized</span>
                </div>
                {optResult.laptop_health_score !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--border-glass-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Laptop Health Index:</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>{optResult.laptop_health_score}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Network Optimizer Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '8px', borderRadius: '9px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)' }}>
                <Wifi size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Network & Internet Speed</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Flushes DNS resolver cache and verifies global ping routes
                </p>
              </div>
            </div>

            <button
              onClick={handleOptimizeNetwork}
              disabled={optimizingNet}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Wifi size={16} className={optimizingNet ? 'spin' : ''} />
              {optimizingNet ? 'Flushing DNS & Benchmarking...' : 'Flush DNS & Accelerate Internet'}
            </button>

            {/* Live Network Benchmark Results */}
            {netResult && (
              <div style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>DNS Resolver:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{netResult.dns_flushed ? 'Flushed Clean' : 'Operational'}</span>
                </div>
                {netResult.targets?.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t.target}:</span>
                    <span style={{ fontFamily: 'monospace', color: t.latency_ms ? '#38bdf8' : '#f87171', fontWeight: 600 }}>
                      {t.latency_ms ? `${t.latency_ms} ms` : 'Timeout'}
                    </span>
                  </div>
                ))}
                {netResult.active_connections !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-glass-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Active TCP Connections:</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--text-main)', fontWeight: 600 }}>{netResult.active_connections}</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Terminal Assistant & Privacy Shield Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* In-Browser Terminal Copilot */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '420px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={17} color="var(--accent-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>ORBIT Terminal Assistant</span>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                Powershell & Python CLI
              </span>
            </div>

            {/* Chat/Terminal Output Stream */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '8px',
                padding: '0.85rem',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              {cliHistory.map((msg, idx) => (
                <div key={idx} style={{ lineHeight: 1.45 }}>
                  {msg.sender === 'user' && (
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>&gt; {msg.text}</span>
                  )}
                  {msg.sender === 'ai' && (
                    <span style={{ color: 'var(--text-main)' }}>{msg.text}</span>
                  )}
                  {msg.sender === 'shield' && (
                    <span style={{ color: '#f87171', fontWeight: 600 }}>{msg.text}</span>
                  )}
                  {msg.sender === 'system' && (
                    <span style={{ color: 'var(--text-muted)' }}>{msg.text}</span>
                  )}
                  {msg.sender === 'error' && (
                    <span style={{ color: '#ef4444' }}>{msg.text}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Command Input Form */}
            <form onSubmit={handleCliSubmit} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="Type 'shutdown in 5 min', 'boost performance', or 'status'..."
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  borderRadius: '7px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.825rem'
                }}
              />
              <button 
                type="submit" 
                className="btn-primary btn-icon"
                style={{ width: '38px', height: '38px', borderRadius: '7px' }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>

          {/* Privacy Shield Policy & Architecture Details */}
          <div className="card" style={{ padding: '1.25rem', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <ShieldCheck size={20} color="#34d399" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
                Zero-Access Privacy Shield Active
              </h4>
            </div>
            
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
              The system controller strictly isolates your sensitive user directories. The following locations are permanently blocked from AI read, write, and scan operations:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div>• Documents</div>
              <div>• SSH Keys (~/.ssh)</div>
              <div>• Pictures & Photos</div>
              <div>• AWS Credentials (~/.aws)</div>
              <div>• Desktop Files</div>
              <div>• Browser Passwords & DBs</div>
              <div>• Downloads & Videos</div>
              <div>• Secret keys (.pem, .key)</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default LaptopCopilot;

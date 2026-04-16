import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, RefreshCw, Camera, Zap,
  AlertTriangle, Crosshair, X, Radio, Target, BarChart2,
} from 'lucide-react';

import type { Alert, PersonEvent, ClassThreshold } from './types/dashboard';
import { API } from './types/dashboard';
import CameraStream from './components/dashboard/CameraStream';
import AlertsPanel from './components/dashboard/AlertsPanel';
import PersonsPanel from './components/dashboard/PersonsPanel';
import SettingsPanel from './components/dashboard/SettingsPanel';
import WatchlistManager from './components/dashboard/WatchlistManager';
import DashboardAnalytics from './components/dashboard/DashboardAnalytics';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // ─── Core state ───
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [detectedPersons, setDetectedPersons] = useState<PersonEvent[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isCameraToggling, setIsCameraToggling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [activeView, setActiveView] = useState<'live' | 'analytics'>('live');

  const scrollRef = useRef<HTMLDivElement>(null);

  const username = localStorage.getItem('username') || 'OPERATOR';
  const userEmail = localStorage.getItem('email') || 'N/A';

  const savedMode = localStorage.getItem('systemMode') as 'detection' | 'search' | 'both' | null;
  const [systemMode, setSystemMode] = useState<'detection' | 'search' | 'both'>(savedMode || 'detection');

  const [classThresholds, setClassThresholds] = useState<ClassThreshold[]>([]);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const savedSearchStatus = localStorage.getItem('searchStatus') as 'idle' | 'uploading' | 'active' | 'error' | null;
  const [searchStatus] = useState<'idle' | 'uploading' | 'active' | 'error'>(savedSearchStatus || 'idle');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [operatorLatLon, setOperatorLatLon] = useState<{ lat: number; lon: number } | null>(null);
  const [mapAlert, setMapAlert] = useState<Alert | null>(null);
  const [currentSource, setCurrentSource] = useState<'0' | 'remote' | 'hybrid'>(
    (localStorage.getItem('currentSource') as '0' | 'remote' | 'hybrid') || '0'
  );
  const [activeFeeds, setActiveFeeds] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetPreview, setNewTargetPreview] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showRemoteLink, setShowRemoteLink] = useState(false);
  const [systemIp, setSystemIp] = useState<string | null>(null);
  const [smtpEmail, setSmtpEmail] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [personLogEnabled, setPersonLogEnabled] = useState(true);
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [focusedPersonVisible, setFocusedPersonVisible] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<{ id: string; score: number }[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const semanticDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load thresholds when settings opens ───
  useEffect(() => {
    if (!showSettings) return;
    setThresholdsLoading(true);
    fetch(`${API}/api/model/classes`)
      .then(res => res.json())
      .then(data => setClassThresholds(data.classes ?? []))
      .catch(() => setClassThresholds([]))
      .finally(() => setThresholdsLoading(false));
  }, [showSettings]);

  // ─── UI settings from backend ───
  useEffect(() => {
    fetch(`${API}/api/settings/ui`)
      .then(res => res.json())
      .then(data => {
        if (typeof data.person_log_enabled === 'boolean') setPersonLogEnabled(data.person_log_enabled);
      })
      .catch(() => {});
  }, []);

  // ─── Operator location ───
  useEffect(() => {
    fetch('http://ip-api.com/json/')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setOperatorLatLon({ lat: data.lat, lon: data.lon });
      })
      .catch(() => {});
  }, []);

  // ─── System info ───
  useEffect(() => {
    fetch(`${API}/api/system/info`)
      .then(res => res.json())
      .then(data => {
        setSystemIp(data.local_ip);
        setSmtpEmail(data.smtp_email);
        setEmailEnabled(data.email_enabled);
        setPrivacyMode(data.privacy_mode);
        setPersonLogEnabled(data.person_log_enabled);
        if (typeof data.voice_enabled === 'boolean') setVoiceEnabled(data.voice_enabled);
      })
      .catch(() => {});
  }, []);

  // ─── Watchlist ───
  const fetchWatchlist = async () => {
    try {
      const res = await fetch(`${API}/api/watchlist`);
      const data = await res.json();
      setWatchlist(data.watchlist || []);
    } catch (_) {}
  };
  useEffect(() => { fetchWatchlist(); }, []);

  // ─── Camera feeds polling ───
  useEffect(() => {
    if (!cameraActive) return;
    const fetchFeeds = async () => {
      try {
        const res = await fetch(`${API}/api/camera/feeds`);
        const data = await res.json();
        setActiveFeeds(data.feeds || []);
      } catch (_) {}
    };
    fetchFeeds();
    const interval = setInterval(fetchFeeds, 3000);
    return () => clearInterval(interval);
  }, [cameraActive, currentSource]);

  // ─── Init camera ───
  useEffect(() => {
    localStorage.setItem('cameraActive', 'false');
    setCameraActive(false);
    fetch(`${API}/api/camera/stop`, { method: 'POST' }).catch(() => {});
    const curMode = localStorage.getItem('systemMode') || 'detection';
    fetch(`${API}/api/camera/mode`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: curMode }),
    }).catch(() => {});
    return () => { fetch(`${API}/api/camera/stop`, { method: 'POST' }).catch(() => {}); };
  }, []);

  // ─── Alerts WebSocket (with auto-reconnect) ───
  useEffect(() => {
    if (isReconnecting) return;

    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false; // set true on cleanup so we never reconnect after unmount

    const connect = () => {
      if (dead) return;
      ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);

      ws.onopen = () => setIsConnected(true);

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 1 s unless the effect has been cleaned up
        if (!dead) retryTimer = setTimeout(connect, 1000);
      };

      ws.onerror = () => ws?.close(); // triggers onclose → retry

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setAlerts(prev => [data, ...prev].slice(0, 50));
        } catch (_) {}
      };
    };

    connect();

    return () => {
      dead = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, [systemMode, isReconnecting]);

  // ─── Persons WebSocket ───
  useEffect(() => {
    if (!cameraActive) return;
    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/persons`);
    ws.onmessage = (event) => {
      const data: PersonEvent = JSON.parse(event.data);
      if (focusedPersonId && data.person_id === focusedPersonId) {
        setFocusedPersonVisible(true);
        setTimeout(() => setFocusedPersonVisible(false), 3000);
      }
      setDetectedPersons(prev => {
        const filtered = prev.filter(p => p.person_id !== data.person_id);
        return [data, ...filtered].slice(0, 30);
      });
    };
    return () => ws.close();
  }, [cameraActive, focusedPersonId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [alerts]);

  // ─── Handlers ───
  const togglePersonLog = async () => {
    const newVal = !personLogEnabled;
    setPersonLogEnabled(newVal);
    try {
      await fetch(`${API}/api/settings/ui`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ui_person_log_enabled', value: newVal }),
      });
    } catch (_) {}
  };

  const handleSoundToggle = async (className: string) => {
    const updated = classThresholds.map(cls =>
      cls.name === className ? { ...cls, sound_enabled: !cls.sound_enabled } : cls
    );
    setClassThresholds(updated);
    try {
      const sounds: Record<string, boolean> = {};
      updated.forEach(c => (sounds[c.name] = c.sound_enabled));
      await fetch(`${API}/api/model/sounds`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sounds }),
      });
    } catch (_) {}
  };

  const toggleEmail = async () => {
    const newVal = !emailEnabled;
    try {
      await fetch(`${API}/api/camera/email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newVal }),
      });
      setEmailEnabled(newVal);
    } catch (_) {}
  };

  const toggleVoice = async () => {
    const newVal = !voiceEnabled;
    try {
      await fetch(`${API}/api/camera/voice`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newVal }),
      });
      setVoiceEnabled(newVal);
    } catch (_) {}
  };

  // Dismiss the speak-once lock for a label so the system will announce it again next time.
  // Pass label=null to clear ALL locks at once.
  const dismissSpeech = async (label: string | null = null) => {
    try {
      await fetch(`${API}/api/camera/speech/dismiss`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
    } catch (_) {}
  };

  const handleSetFocus = async (pid: string | null) => {
    try {
      await fetch(`${API}/api/camera/focus`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: pid }),
      });
      setFocusedPersonId(pid);
      if (!pid) setFocusedPersonVisible(false);
    } catch (_) {}
  };

  const togglePrivacy = async () => {
    try {
      const next = !privacyMode;
      await fetch(`${API}/api/camera/privacy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      setPrivacyMode(next);
      if (next) setPersonLogEnabled(false);
    } catch (_) {}
  };

  const handleSemanticSearch = (val: string) => {
    setSemanticQuery(val);
    if (semanticDebounceRef.current) clearTimeout(semanticDebounceRef.current);
    if (!val.trim()) { setSemanticResults([]); setSemanticLoading(false); return; }
    setSemanticLoading(true);
    semanticDebounceRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(`${API}/api/persons/search?q=${encodeURIComponent(val)}`);
        const data = await resp.json();
        if (data.status === 'success') setSemanticResults(data.results);
      } catch (_) {}
      finally { setSemanticLoading(false); }
    }, 600);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  const changeMode = async (mode: 'detection' | 'search' | 'both') => {
    if (mode === systemMode) return;
    setIsReconnecting(true);
    try {
      await fetch(`${API}/api/camera/mode`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSystemMode(mode);
      localStorage.setItem('systemMode', mode);
    } catch (_) {}
    finally { setIsReconnecting(false); }
  };

  const handleThresholdChange = (name: string, value: number) => {
    setClassThresholds(prev => prev.map(c => c.name === name ? { ...c, threshold: value } : c));
    setSaveStatus('idle');
  };

  const handleSaveThresholds = async () => {
    setSaveStatus('saving');
    const thresholds: Record<string, number> = {};
    classThresholds.forEach(c => { thresholds[c.name] = c.threshold; });
    try {
      const res = await fetch(`${API}/api/model/thresholds`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds }),
      });
      if (!res.ok) throw new Error('Failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); }
  };

  const handleAddWatchlist = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newTargetName) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewTargetPreview(reader.result as string);
    reader.readAsDataURL(file);
    setIsReconnecting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/api/watchlist?name=${encodeURIComponent(newTargetName)}`, {
        method: 'POST', body: formData,
      });
      if (res.ok) {
        setNewTargetName('');
        setNewTargetPreview(null);
        setIsAddingTarget(false);
        fetchWatchlist();
      }
    } catch (_) {}
    finally { setIsReconnecting(false); }
  };

  const removeTarget = async (name: string) => {
    try {
      await fetch(`${API}/api/watchlist/${encodeURIComponent(name)}`, { method: 'DELETE' });
      fetchWatchlist();
    } catch (_) {}
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/'); };

  const toggleCamera = async () => {
    setIsCameraToggling(true);
    try {
      const endpoint = cameraActive ? '/api/camera/stop' : '/api/camera/start';
      await fetch(`${API}${endpoint}`, { method: 'POST' });
      const newState = !cameraActive;
      setCameraActive(newState);
      localStorage.setItem('cameraActive', String(newState));
    } catch (_) {}
    finally { setIsCameraToggling(false); }
  };

  const handleSourceChange = async (newSource: '0' | 'remote' | 'hybrid') => {
    setIsReconnecting(true);
    try {
      const res = await fetch(`${API}/api/camera/source`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: newSource }),
      });
      if (res.ok) {
        setCurrentSource(newSource);
        localStorage.setItem('currentSource', newSource);
        setCameraActive(true);
        const feedsRes = await fetch(`${API}/api/camera/feeds`);
        const feedsData = await feedsRes.json();
        setActiveFeeds(feedsData.feeds || []);
      }
    } catch (_) {}
    finally { setIsReconnecting(false); }
  };

  const displayIp = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname.includes('.'))
    ? (systemIp || window.location.hostname)
    : window.location.hostname;

  const remoteUrl = `${window.location.protocol}//${displayIp}${window.location.port ? ':' + window.location.port : ''}/remote-camera?client_id=${Math.random().toString(36).substring(7)}`;

  const modeConfig = {
    detection: { label: 'ACTIVITY_SCAN',  color: '#00ff85', bg: 'rgba(0,255,133,0.1)',  border: 'rgba(0,255,133,0.4)' },
    search:    { label: 'PERSON_SEARCH',  color: '#ff4466', bg: 'rgba(255,68,102,0.1)', border: 'rgba(255,68,102,0.4)' },
    both:      { label: 'HYBRID_LINK',    color: '#00e5ff', bg: 'rgba(0,229,255,0.1)',  border: 'rgba(0,229,255,0.4)' },
  };

  return (
    <div className="flex flex-col h-screen bg-[#060608] text-[#00ff85] font-mono overflow-hidden">

      {/* ─── BIOMETRIC OVERLAY ─── */}
      <AnimatePresence>
        {(systemMode === 'search' || systemMode === 'both') && searchStatus === 'active' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
            style={{ background: 'rgba(2,3,4,0.85)' }}
          >
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'linear-gradient(rgba(0,255,133,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,133,0.06) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff85] to-transparent animate-biometric-scan"
              style={{ boxShadow: '0 0 20px #00ff85, 0 0 40px rgba(0,255,133,0.3)' }} />
            <div className="absolute left-10 top-1/2 -translate-y-1/2 w-56 space-y-6 opacity-60">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] tracking-widest text-[#00ff85]">
                  <span>FACIAL_VECTORS</span>
                  <span className="animate-pulse">PROCESSING...</span>
                </div>
                <div className="h-0.5 bg-[rgba(0,255,133,0.1)] overflow-hidden">
                  <div className="h-full bg-[#00ff85] animate-progress-fast" />
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className={`h-3 border border-[rgba(0,255,133,0.2)] ${Math.random() > 0.5 ? 'bg-[rgba(0,255,133,0.3)]' : ''}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-56 text-right opacity-40">
              <div className="text-[9px] tracking-widest mb-2">DATA_STREAM_OMEGA</div>
              <div className="space-y-1 text-[8px] font-mono">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-data-stream">{`QUERY_${Math.random().toString(16).slice(2, 10).toUpperCase()} >> NO_MATCH`}</div>
                ))}
              </div>
              <div className="mt-4 border border-[rgba(0,255,133,0.2)] p-3 inline-block">
                <div className="text-[8px] opacity-40 mb-1">THRESHOLD</div>
                <div className="text-xl font-bold">0.985</div>
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODE CHANGE LOADER ─── */}
      <AnimatePresence>
        {isReconnecting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-[#060608] flex flex-col items-center justify-center"
          >
            <div className="w-full max-w-sm space-y-5 px-8">
              <div className="space-y-1">
                <p className="text-[9px] text-[#00ff85]/40 tracking-[0.3em] font-bold">INITIALIZING_LINK</p>
                <p className="text-2xl font-bold tracking-tighter text-[#00ff85]">RECONFIGURING_CORE</p>
              </div>
              <div className="h-0.5 w-full bg-[rgba(0,255,133,0.1)] overflow-hidden">
                <motion.div className="h-full bg-[#00ff85]"
                  initial={{ width: '0%' }} animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }} />
              </div>
              <div className="grid grid-cols-2 gap-8 text-[9px] opacity-30">
                <div className="space-y-1"><p>PORT: 8000</p><p>PROTOCOL: WSS_V2</p><p>ENCRYPTION: AES_256</p></div>
                <div className="text-right space-y-1">
                  <p>TARGET: {systemMode === 'detection' ? 'ACTIVITY_SCAN' : systemMode === 'search' ? 'PERSON_SEARCH' : 'HYBRID'}</p>
                  <p>LATENCY: 12ms</p><p>STATUS: INJECTING...</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── WATCHLIST MANAGER ─── */}
      <WatchlistManager
        isAddingTarget={isAddingTarget}
        setIsAddingTarget={setIsAddingTarget}
        newTargetName={newTargetName}
        setNewTargetName={setNewTargetName}
        newTargetPreview={newTargetPreview}
        setNewTargetPreview={setNewTargetPreview}
        handleAddWatchlist={handleAddWatchlist}
        watchlist={watchlist}
        removeTarget={removeTarget}
      />

      {/* ─── SETTINGS PANEL ─── */}
      <SettingsPanel
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        username={username}
        userEmail={userEmail}
        emailEnabled={emailEnabled}
        toggleEmail={toggleEmail}
        voiceEnabled={voiceEnabled}
        toggleVoice={toggleVoice}
        privacyMode={privacyMode}
        togglePrivacy={togglePrivacy}
        watchlist={watchlist}
        setIsAddingTarget={setIsAddingTarget}
        personLogEnabled={personLogEnabled}
        togglePersonLog={togglePersonLog}
        classThresholds={classThresholds}
        thresholdsLoading={thresholdsLoading}
        handleThresholdChange={handleThresholdChange}
        handleSaveThresholds={handleSaveThresholds}
        saveStatus={saveStatus}
        handleSoundToggle={handleSoundToggle}
        smtpEmail={smtpEmail}
        systemIp={systemIp}
        handleLogout={handleLogout}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        currentSource={currentSource}
        handleSourceChange={handleSourceChange}
        isReconnecting={isReconnecting}
      />

      {/* ─── HEADER ─── */}
      <header className="relative z-10 flex justify-between items-center px-6 py-3 bg-[rgba(6,6,8,0.95)] border-b border-[rgba(0,255,133,0.1)] backdrop-blur-sm shrink-0">
        {/* Brand + Mode switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 border border-[rgba(0,255,133,0.5)] flex items-center justify-center group-hover:border-[#00ff85] group-hover:shadow-[0_0_12px_rgba(0,255,133,0.3)] transition-all duration-300 animate-glow-pulse">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold tracking-[0.2em] uppercase">SmartSurv</span>
              <span className="text-[#00ff85]/30 text-xs ml-2">// OPS_CORE</span>
            </div>
          </div>

          {/* Mode Pills */}
          <div className="flex items-center bg-[rgba(12,13,16,0.8)] border border-[rgba(0,255,133,0.1)] p-0.5 gap-0.5">
            {(['detection', 'search', 'both'] as const).map(mode => {
              const cfg = modeConfig[mode];
              const active = systemMode === mode;
              return (
                <button key={mode} onClick={() => changeMode(mode)}
                  className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-300"
                  style={active
                    ? { background: cfg.bg, color: cfg.color, borderBottom: `2px solid ${cfg.color}` }
                    : { color: 'rgba(0,255,133,0.3)' }
                  }>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">

          {/* View Toggle: LIVE / ANALYTICS */}
          <div className="flex items-center bg-[rgba(12,13,16,0.8)] border border-[rgba(0,255,133,0.1)] p-0.5 gap-0.5">
            <button
              onClick={() => setActiveView('live')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-300"
              style={activeView === 'live'
                ? { background: 'rgba(0,255,133,0.1)', color: '#00ff85', borderBottom: '2px solid #00ff85' }
                : { color: 'rgba(0,255,133,0.3)' }
              }
            >
              <Radio className="w-3 h-3" />
              LIVE
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-300"
              style={activeView === 'analytics'
                ? { background: 'rgba(0,229,255,0.1)', color: '#00e5ff', borderBottom: '2px solid #00e5ff' }
                : { color: 'rgba(0,255,133,0.3)' }
              }
            >
              <BarChart2 className="w-3 h-3" />
              ANALYTICS
            </button>
          </div>

          {/* Camera toggle */}
          <button
            id="camera-toggle-btn"
            onClick={toggleCamera}
            disabled={isCameraToggling}
            className={`flex items-center gap-2 px-4 py-2 border text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${isCameraToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={cameraActive
              ? { borderColor: '#00ff85', color: '#00ff85', background: 'rgba(0,255,133,0.05)' }
              : { borderColor: 'rgba(255,68,102,0.5)', color: '#ff4466', background: 'rgba(255,68,102,0.05)' }
            }
          >
            {isCameraToggling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            {isCameraToggling ? (cameraActive ? 'TURNING_OFF...' : 'TURNING_ON...') : (cameraActive ? 'CAMERA_OFF' : 'CAMERA_ON')}
          </button>

          {/* Connect Phone */}
          <button
            onClick={() => setShowRemoteLink(true)}
            className="flex items-center gap-2 px-3 py-2 border border-[rgba(0,255,133,0.2)] text-[10px] font-bold hover:border-[#00ff85] transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            CONNECT_PHONE
          </button>

          {/* Connection status */}
          <div className="flex items-center gap-1.5 px-3 py-2 border border-[rgba(0,255,133,0.1)] text-[10px]">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#00ff85] animate-pulse' : 'bg-red-500'}`} />
            <span className="opacity-50">{isConnected ? 'UPLINK' : 'OFFLINE'}</span>
          </div>

          {/* Settings */}
          <button
            id="settings-btn"
            onClick={() => setShowSettings(true)}
            className="p-2 border border-[rgba(0,255,133,0.15)] bg-[rgba(12,13,16,0.8)] hover:border-[#00ff85] hover:bg-[rgba(0,255,133,0.05)] transition-all duration-300"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── REMOTE LINK MODAL ─── */}
      <AnimatePresence>
        {showRemoteLink && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRemoteLink(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#090a0c] border border-[rgba(0,255,133,0.2)] p-8 z-[201] text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 border-2 border-[#00ff85] flex items-center justify-center animate-glow-pulse">
                  <Zap className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold tracking-[0.2em] mb-2 uppercase">Remote Node Link</h3>
              <p className="text-[10px] opacity-40 mb-8 leading-relaxed">
                Scan this code or open this URL on your secondary device to start a remote surveillance uplink.
              </p>
              <div className="bg-white p-4 inline-block mb-8">
                <div className="text-black text-[10px] font-bold break-all max-w-[200px]">{remoteUrl}</div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { navigator.clipboard.writeText(remoteUrl); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }}
                  className={`w-full py-3 font-bold text-[10px] tracking-widest uppercase transition-all ${isCopied ? 'bg-white text-black' : 'bg-[#00ff85] text-black hover:brightness-110'}`}
                >
                  {isCopied ? 'COPIED!' : 'Copy Link'}
                </button>
                <button
                  onClick={() => setShowRemoteLink(false)}
                  className="w-full py-3 border border-[rgba(0,255,133,0.3)] text-[10px] font-bold tracking-widest uppercase hover:bg-[rgba(0,255,133,0.05)] transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex flex-1 overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {activeView === 'analytics' ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-1 overflow-hidden"
            >
              <DashboardAnalytics
                alerts={alerts}
                detectedPersons={detectedPersons}
                isConnected={isConnected}
                systemMode={systemMode}
              />
            </motion.div>
          ) : (
            <motion.div
              key="live"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="flex flex-1 overflow-hidden"
            >
              {/* ─── VIDEO FEED SECTION ─── */}
              <section className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                <div className="flex-1 relative border border-[rgba(0,255,133,0.12)] bg-[#080a0c] overflow-hidden group">

                  {/* Corner brackets */}
                  {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
                    <div key={i} className={`absolute w-8 h-8 ${cls} border-[#00ff85]/30 group-hover:border-[#00ff85]/70 transition-colors duration-500 animate-corner-pulse`} />
                  ))}

                  {/* Focus HUD */}
                  <AnimatePresence>
                    {focusedPersonId && (
                      <motion.div
                        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-[20] flex items-center gap-4 bg-black/80 border border-red-500/40 px-6 py-2 backdrop-blur-md"
                      >
                        <div className="flex items-center gap-2">
                          <Target className={`w-4 h-4 ${focusedPersonVisible ? 'text-red-500 animate-pulse' : 'text-red-900'}`} />
                          <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Tactical_Focus: <span className="text-red-500">{focusedPersonId}</span></span>
                        </div>
                        <div className="h-4 w-[1px] bg-red-500/20" />
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-bold tracking-widest ${focusedPersonVisible ? 'text-green-400' : 'text-red-400'}`}>
                            {focusedPersonVisible ? 'STATUS: LOCKED_IN_FEED' : 'STATUS: SEARCHING_FEEDS...'}
                          </span>
                          <button onClick={() => handleSetFocus(null)} className="hover:text-white transition-colors">
                            <X className="w-3 h-3 ml-2" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Video grid */}
                  <div className={`absolute inset-0 w-full h-full p-2 grid gap-2 ${activeFeeds.length > 4 ? 'grid-cols-3' : activeFeeds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {activeFeeds.length > 0 ? (
                      activeFeeds.map(feedId => (
                        <div key={feedId} className="relative border border-[rgba(0,255,133,0.1)] bg-black/40 overflow-hidden group/feed">
                          <CameraStream feedId={feedId} active={cameraActive} showHeatmap={showHeatmap} />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-[8px] font-bold border border-[rgba(0,255,133,0.2)] tracking-tighter">
                            FEED_{feedId.toUpperCase()}
                          </div>
                          {privacyMode && (
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-[#00e5ff]/20 text-[#00e5ff] text-[7px] font-bold border border-[#00e5ff]/30 tracking-widest backdrop-blur-sm">
                              PRIVACY_GUARD_ACTIVE
                            </div>
                          )}
                          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#00ff85]/30" />
                          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#00ff85]/30" />
                        </div>
                      ))
                    ) : (
                      cameraActive && <CameraStream active={cameraActive} showHeatmap={showHeatmap} />
                    )}
                  </div>

                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#00ff85]/25">
                      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <Camera className="w-14 h-14" />
                      </motion.div>
                      <p className="text-[10px] tracking-[0.4em] font-bold">FEED_OFFLINE</p>
                      <button
                        onClick={toggleCamera} disabled={isCameraToggling}
                        className={`mt-2 flex items-center gap-2 px-5 py-2 border border-[rgba(0,255,133,0.25)] text-[#00ff85]/50 hover:text-[#00ff85] hover:border-[#00ff85] text-[9px] tracking-widest uppercase transition-all duration-300 ${isCameraToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isCameraToggling && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {isCameraToggling ? 'TURNING_ON...' : 'CAMERA_ON'}
                      </button>
                    </div>
                  )}

                  {/* HUD — top-left */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                    <div className="flex items-center gap-2 bg-[rgba(0,255,133,0.9)] text-[#060608] px-2.5 py-1 text-[10px] font-bold">
                      <Radio className="w-3 h-3" />
                      LIVE_INTERCEPT
                    </div>
                    <div className="text-[9px] text-[#00ff85]/40 pl-0.5">RES 640×480 // 30 FPS</div>
                  </div>

                  {/* HUD — top-right mode badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <AnimatePresence mode="wait">
                      <motion.div key={systemMode}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold"
                        style={{ color: modeConfig[systemMode].color, border: `1px solid ${modeConfig[systemMode].border}`, background: modeConfig[systemMode].bg }}
                      >
                        {systemMode === 'detection' && <AlertTriangle className="w-3 h-3" />}
                        {systemMode === 'search' && <Crosshair className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />}
                        {systemMode === 'both' && <Zap className="w-3 h-3" />}
                        {modeConfig[systemMode].label}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Grid overlay when scanning */}
                  {cameraActive && (systemMode === 'search' || systemMode === 'both') && searchStatus === 'active' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[1 / 4, 2 / 4, 3 / 4].map((pos, i) => (
                        <React.Fragment key={i}>
                          <div className="absolute top-0 bottom-0 w-px bg-[rgba(0,255,133,0.08)]" style={{ left: `${pos * 100}%` }} />
                          <div className="absolute left-0 right-0 h-px bg-[rgba(0,255,133,0.08)]" style={{ top: `${pos * 100}%` }} />
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* ─── PERSONS PANEL ─── */}
              {personLogEnabled && (
                <PersonsPanel
                  detectedPersons={detectedPersons}
                  setSelectedPerson={setSelectedPerson}
                  semanticQuery={semanticQuery}
                  semanticResults={semanticResults}
                  semanticLoading={semanticLoading}
                  handleSemanticSearch={handleSemanticSearch}
                  focusedPersonId={focusedPersonId}
                  setDetectedPersons={setDetectedPersons}
                />
              )}

              {/* ─── ALERTS PANEL ─── */}
              <AlertsPanel
                alerts={alerts}
                watchlist={watchlist}
                setIsAddingTarget={setIsAddingTarget}
                setMapAlert={setMapAlert}
                scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
                dismissSpeech={dismissSpeech}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── PERSON DETAIL MODAL ─── */}
      {personLogEnabled && (
        <AnimatePresence>
          {selectedPerson && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-lg flex items-center justify-center p-8"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-[#090a0c] border border-[rgba(0,255,133,0.25)] shadow-[0_0_80px_rgba(0,255,133,0.08)] w-full max-w-sm overflow-hidden"
              >
                {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 ${c} border-[#00ff85]/50 z-10`} />
                ))}
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="absolute top-3 right-3 z-20 p-1.5 bg-black/60 border border-[rgba(0,255,133,0.2)] hover:border-[#00ff85] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative w-full aspect-square bg-black overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${selectedPerson.face}`}
                    alt={selectedPerson.person_id}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-[#00ff85]/60 animate-scanner" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090a0c] via-transparent to-transparent" />
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold tracking-widest"
                    style={selectedPerson.status === 'NEW' ? { background: '#00ff85', color: '#000' } : { background: '#00e5ff', color: '#000' }}
                  >
                    {selectedPerson.status === 'NEW' ? 'NEW_SUBJECT' : 'REAPPEARED'}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[9px] opacity-30 tracking-[0.3em] mb-1">BIOMETRIC_SUBJECT_ID</p>
                    <p className="text-2xl font-bold tracking-widest text-[#00ff85]">{selectedPerson.person_id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 border border-[rgba(0,255,133,0.1)] p-3">
                      <p className="text-[8px] opacity-30 tracking-widest mb-1">FEED_SOURCE</p>
                      <p className="text-[11px] font-bold text-[#00ff85]">{selectedPerson.feed_id.toUpperCase()}</p>
                    </div>
                    <div className="bg-black/40 border border-[rgba(0,255,133,0.1)] p-3">
                      <p className="text-[8px] opacity-30 tracking-widest mb-1">DETECTED_AT</p>
                      <p className="text-[11px] font-bold text-[#00ff85]">{selectedPerson.timestamp}</p>
                    </div>
                  </div>
                  <p className="text-[8px] text-[#00ff85]/20 leading-relaxed pt-1 border-t border-[rgba(0,255,133,0.06)]">
                    Subject logged by Re-ID engine. Will re-appear in PERSONS_LOG after a 5-minute cooldown window.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const isFocused = focusedPersonId === selectedPerson.person_id;
                        handleSetFocus(isFocused ? null : selectedPerson.person_id);
                      }}
                      className={`w-full py-3 border font-bold text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                        focusedPersonId === selectedPerson.person_id
                          ? 'bg-red-600 border-red-600 text-white shadow-[0_0_15px_rgba(255,0,0,0.4)]'
                          : 'bg-[rgba(255,255,255,0.02)] border-[rgba(0,255,133,0.3)] text-[#00ff85] hover:bg-[#00ff85] hover:text-black'
                      }`}
                    >
                      <Target className={`w-3.5 h-3.5 ${focusedPersonId === selectedPerson.person_id ? 'animate-pulse' : ''}`} />
                      {focusedPersonId === selectedPerson.person_id ? 'TERMINATE_FOCUS' : 'ESTABLISH_TACTICAL_FOCUS'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ─── MAP MODAL ─── */}
      <AnimatePresence>
        {mapAlert && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl bg-[#0a0b0d] border border-[rgba(0,255,133,0.2)] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
            >
              <div className="p-4 border-b border-[rgba(0,255,133,0.1)] flex justify-between items-center bg-[#0d0e12]">
                <div>
                  <h3 className="text-[14px] font-bold tracking-[0.2em] text-[#00ff85]">GEOSPATIAL_INTERCEPT</h3>
                  <p className="text-[10px] opacity-40 uppercase">Threat Location: {mapAlert.location?.id}</p>
                </div>
                <button onClick={() => setMapAlert(null)} className="p-2 hover:bg-white/5 transition-all">
                  <X className="w-5 h-5 text-[#00ff85]" />
                </button>
              </div>
              <div className="flex h-[500px]">
                <div className="flex-1 bg-black relative">
                  <iframe
                    width="100%" height="100%" frameBorder="0"
                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8)' }}
                    src={`https://www.google.com/maps?q=${mapAlert.location?.lat},${mapAlert.location?.lon}&z=14&output=embed`}
                    allowFullScreen
                  />
                  <div className="absolute inset-0 pointer-events-none border-[15px] border-[#00ff85]/5" />
                </div>
                <div className="w-72 border-l border-[rgba(0,255,133,0.1)] p-5 flex flex-col bg-[#0a0b0d]">
                  <div className="mb-6">
                    <p className="text-[9px] font-bold opacity-30 tracking-widest mb-2">TARGET_COORDINATES</p>
                    <p className="text-[12px] font-mono text-[#00ff85]">{mapAlert.location?.lat}° N, {mapAlert.location?.lon}° E</p>
                  </div>
                  <div className="mb-6 p-3 bg-[rgba(0,229,255,0.04)] border border-[rgba(0,229,255,0.2)]">
                    <p className="text-[9px] font-bold text-[#00e5ff] tracking-widest mb-1 leading-tight">INTERCEPT_DISTANCE</p>
                    {operatorLatLon ? (
                      <div>
                        <p className="text-[20px] font-bold text-[#00e5ff]">
                          {calculateDistance(operatorLatLon.lat, operatorLatLon.lon, parseFloat(mapAlert.location?.lat || '0'), parseFloat(mapAlert.location?.lon || '0'))}
                          <span className="text-[10px] ml-1">KM</span>
                        </p>
                        <p className="text-[8px] opacity-40 mt-1 uppercase italic">Distance from your server to threat camera</p>
                      </div>
                    ) : (
                      <div className="flex gap-1 items-center animate-pulse">
                        {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 bg-[#00e5ff] rounded-full" />)}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto pt-4 border-t border-[rgba(0,255,133,0.1)]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Priority Alert</p>
                    </div>
                    <button
                      onClick={() => window.open(mapAlert.location?.maps, '_blank')}
                      className="w-full py-2 bg-[#00ff85] text-black font-bold text-[10px] hover:bg-[#00cc6a] transition-all"
                    >
                      OPEN_IN_MAPS_APP
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes biometric-scan { 0%{top:0;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes progress-fast  { 0%{width:0%} 100%{width:100%} }
        @keyframes data-stream    { 0%{transform:translateY(0)} 100%{transform:translateY(-50%)} }
        @keyframes scanner        { 0%{top:0%} 100%{top:100%} }
        @keyframes corner-pulse   { 0%,100%{opacity:0.25} 50%{opacity:0.8} }
        .animate-biometric-scan { animation: biometric-scan 4s linear infinite; }
        .animate-progress-fast  { animation: progress-fast 2s ease-in-out infinite; }
        .animate-data-stream    { animation: data-stream 15s linear infinite; }
        .animate-scanner        { animation: scanner 2s ease-in-out infinite; }
        .animate-corner-pulse   { animation: corner-pulse 3s ease-in-out infinite; }
        .animate-glow-pulse     { animation: glow-pulse 2.5s ease-in-out infinite; }
        @keyframes glow-pulse   { 0%,100%{box-shadow:0 0 0 rgba(0,255,133,0)} 50%{box-shadow:0 0 20px rgba(0,255,133,0.4)} }
        .range-hacker::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:10px; height:18px; background:#00e5ff; border:1px solid #000; cursor:pointer; box-shadow:0 0 8px rgba(0,229,255,0.5); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #060608; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,133,0.2); }
        ::-webkit-scrollbar-thumb:hover { background: #00ff85; }
      `}</style>
    </div>
  );
};

export default Dashboard;

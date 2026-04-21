import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, RefreshCw, Bell, User, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import type { Alert, PersonEvent, ClassThreshold } from '../types/dashboard';
import { API } from '../types/dashboard';

export interface AppContextValue {
  alerts: Alert[];
  detectedPersons: PersonEvent[];
  setDetectedPersons: React.Dispatch<React.SetStateAction<PersonEvent[]>>;
  selectedPerson: PersonEvent | null;
  setSelectedPerson: (p: PersonEvent | null) => void;
  isConnected: boolean;
  cameraActive: boolean;
  isCameraToggling: boolean;
  toggleCamera: () => void;
  currentSource: '0' | 'remote' | 'hybrid';
  handleSourceChange: (src: '0' | 'remote' | 'hybrid') => void;
  activeFeeds: string[];
  watchlist: string[];
  fetchWatchlist: () => void;
  emailEnabled: boolean;
  toggleEmail: () => void;
  privacyMode: boolean;
  togglePrivacy: () => void;
  personLogEnabled: boolean;
  togglePersonLog: () => void;
  browserSoundEnabled: boolean;
  toggleBrowserSound: () => void;
  classThresholds: ClassThreshold[];
  thresholdsLoading: boolean;
  handleThresholdChange: (name: string, value: number) => void;
  handleSaveThresholds: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  handleSoundToggle: (name: string) => void;
  smtpEmail: string | null;
  systemIp: string | null;
  focusedPersonId: string | null;
  handleSetFocus: (pid: string | null) => void;
  focusedPersonVisible: boolean;
  semanticQuery: string;
  semanticResults: { id: string; score: number }[];
  semanticLoading: boolean;
  handleSemanticSearch: (val: string) => void;
  isReconnecting: boolean;
  username: string;
  userEmail: string;
  handleLogout: () => void;
}

export const AppContext = React.createContext<AppContextValue | null>(null);
export const useApp = () => {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppLayout');
  return ctx;
};

const pageTitles: Record<string, string> = {
  '/dashboard': 'Monitor',
  '/dashboard/alerts': 'Alerts Log',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/watchlist': 'Watchlist',
  '/dashboard/settings': 'Settings',
  '/dashboard/users': 'User Management',
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const username = localStorage.getItem('username') || 'OPERATOR';
  const userEmail = localStorage.getItem('email') || 'N/A';

  // ── Core state ──
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [detectedPersons, setDetectedPersons] = useState<PersonEvent[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isCameraToggling, setIsCameraToggling] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [activeFeeds, setActiveFeeds] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const [currentSource, setCurrentSource] = useState<'0' | 'remote' | 'hybrid'>(
    (localStorage.getItem('currentSource') as '0' | 'remote' | 'hybrid') || '0'
  );

  // ── Settings state ──
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [personLogEnabled, setPersonLogEnabled] = useState(false);
  const [browserSoundEnabled, setBrowserSoundEnabled] = useState(localStorage.getItem('browserSound') !== 'false');
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const [smtpEmail, setSmtpEmail] = useState<string | null>(null);
  const [systemIp, setSystemIp] = useState<string | null>(null);
  const [classThresholds, setClassThresholds] = useState<ClassThreshold[]>([]);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // ── Person focus ──
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [focusedPersonVisible, setFocusedPersonVisible] = useState(false);

  // ── Semantic search ──
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<{ id: string; score: number }[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const semanticDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Unread alerts badge ──
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // ── Browser Audio ──
  useEffect(() => {
    alertAudioRef.current = new Audio('/alert.mp3');
    alertAudioRef.current.load();
  }, []);

  const playAlertSound = useCallback(() => {
    if (!browserSoundEnabled || !alertAudioRef.current) return;
    alertAudioRef.current.currentTime = 0;
    alertAudioRef.current.play().catch(() => {
      console.warn("Audio playback blocked by browser. User interaction needed.");
    });
  }, [browserSoundEnabled]);

  // ── Init system info ──
  useEffect(() => {
    fetch(`${API}/api/camera/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'both' }),
    }).catch(() => {});

    fetch(`${API}/api/camera/feeds`)
      .then(r => r.json())
      .then(d => {
        const active = d.feeds && d.feeds.length > 0;
        setCameraActive(active);
        localStorage.setItem('cameraActive', String(active));
        setActiveFeeds(d.feeds || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API}/api/system/info`)
      .then(r => r.json())
      .then(d => {
        setSystemIp(d.local_ip);
        setSmtpEmail(d.smtp_email);
        setEmailEnabled(d.email_enabled);
        setPrivacyMode(d.privacy_mode);
        setPersonLogEnabled(d.person_log_enabled);
      }).catch(() => {});
    fetch(`${API}/api/settings/ui`)
      .then(r => r.json())
      .then(d => { if (typeof d.person_log_enabled === 'boolean') setPersonLogEnabled(d.person_log_enabled); })
      .catch(() => {});
  }, []);

  // ── Role Protection ──
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin && (location.pathname === '/dashboard/settings' || location.pathname === '/dashboard/users')) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  // ── Load thresholds ──
  useEffect(() => {
    setThresholdsLoading(true);
    fetch(`${API}/api/model/classes`)
      .then(r => r.json())
      .then(d => setClassThresholds(d.classes ?? []))
      .catch(() => setClassThresholds([]))
      .finally(() => setThresholdsLoading(false));
  }, []);

  // ── Alerts WebSocket ──
  useEffect(() => {
    if (isReconnecting) return;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false;
    const connect = () => {
      if (dead) return;
      ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => { setIsConnected(false); if (!dead) retryTimer = setTimeout(connect, 1000); };
      ws.onerror = () => ws?.close();
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setAlerts(prev => [data, ...prev].slice(0, 50));
          setUnreadAlerts(n => n + 1);
          playAlertSound();
        } catch (_) {}
      };
    };
    connect();
    return () => { dead = true; if (retryTimer) clearTimeout(retryTimer); ws?.close(); };
  }, [isReconnecting]);

  // ── Persons WebSocket ──
  useEffect(() => {
    if (!cameraActive) return;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false;

    const connect = () => {
      if (dead) return;
      ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/persons`);
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
      ws.onclose = () => { if (!dead) retryTimer = setTimeout(connect, 1500); };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => { dead = true; if (retryTimer) clearTimeout(retryTimer); ws?.close(); };
  }, [cameraActive, focusedPersonId]);

  // ── Camera feeds polling ──
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

  // ── Watchlist ──
  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/watchlist`);
      const data = await res.json();
      setWatchlist(data.watchlist || []);
    } catch (_) {}
  }, []);
  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  // ── Handlers ──
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

  const toggleEmail = async () => {
    const newVal = !emailEnabled;
    try {
      await fetch(`${API}/api/camera/email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: newVal }) });
      setEmailEnabled(newVal);
    } catch (_) {}
  };

  const togglePrivacy = async () => {
    const next = !privacyMode;
    try {
      await fetch(`${API}/api/camera/privacy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: next }) });
      setPrivacyMode(next);
      if (next) setPersonLogEnabled(false);
    } catch (_) {}
  };

  const togglePersonLog = async () => {
    const newVal = !personLogEnabled;
    setPersonLogEnabled(newVal);
    try {
      await fetch(`${API}/api/settings/ui`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'ui_person_log_enabled', value: newVal }) });
    } catch (_) {}
  };

  const toggleBrowserSound = () => {
    const newVal = !browserSoundEnabled;
    setBrowserSoundEnabled(newVal);
    localStorage.setItem('browserSound', String(newVal));
  };

  const handleSoundToggle = async (className: string) => {
    const updated = classThresholds.map(cls => cls.name === className ? { ...cls, sound_enabled: !cls.sound_enabled } : cls);
    setClassThresholds(updated);
    try {
      const sounds: Record<string, boolean> = {};
      updated.forEach(c => (sounds[c.name] = c.sound_enabled));
      await fetch(`${API}/api/model/sounds`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sounds }) });
    } catch (_) {}
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
      const res = await fetch(`${API}/api/model/thresholds`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ thresholds }) });
      if (!res.ok) throw new Error('Failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); }
  };

  const handleSetFocus = async (pid: string | null) => {
    try {
      await fetch(`${API}/api/camera/focus`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person_id: pid }) });
      setFocusedPersonId(pid);
      if (!pid) setFocusedPersonVisible(false);
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

  const pageTitle = pageTitles[location.pathname] ?? 'Dashboard';
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const ctxValue: AppContextValue = {
    alerts, detectedPersons, setDetectedPersons, selectedPerson, setSelectedPerson,
    isConnected, cameraActive, isCameraToggling, toggleCamera,
    currentSource, handleSourceChange, activeFeeds,
    watchlist, fetchWatchlist,
    emailEnabled, toggleEmail,
    privacyMode, togglePrivacy, personLogEnabled, togglePersonLog,
    browserSoundEnabled, toggleBrowserSound,
    classThresholds, thresholdsLoading, handleThresholdChange, handleSaveThresholds,
    saveStatus, handleSoundToggle, smtpEmail, systemIp,
    focusedPersonId, handleSetFocus, focusedPersonVisible,
    semanticQuery, semanticResults, semanticLoading, handleSemanticSearch,
    isReconnecting, username, userEmail, handleLogout,
  };

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0c0e11', color: '#e2e2e6', fontFamily: "'Inter', sans-serif" }}>

        {/* ── Sidebar ── */}
        <Sidebar />

        {/* ── Main area ── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* ── Top header ── */}
          <header className="shrink-0 flex items-center justify-between px-6"
            style={{ height: '64px', background: '#111316', borderBottom: '1px solid rgba(176,198,255,0.08)' }}>
            {/* Page title */}
            <h1 className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Manrope', sans-serif", color: '#ccd8ff' }}>
              {pageTitle}
            </h1>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Connection dot */}
              

              {/* Camera eye toggle */}
              <button
                onClick={toggleCamera}
                disabled={isCameraToggling}
                title={cameraActive ? 'Camera ON — click to stop' : 'Camera OFF — click to start'}
                className="p-2 transition-all duration-300 disabled:opacity-50"
                style={cameraActive
                  ? { border: '1px solid rgba(176,198,255,0.3)', color: '#b0c6ff', background: 'rgba(176,198,255,0.05)', borderRadius: '0.25rem' }
                  : { border: '1px solid rgba(255,180,171,0.3)', color: '#ffb4ab', background: 'rgba(255,180,171,0.05)', borderRadius: '0.25rem' }
                }
              >
                {isCameraToggling
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : cameraActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />
                }
              </button>

              {/* Alerts bell */}
              <button
                onClick={() => { navigate('/dashboard/alerts'); setUnreadAlerts(0); }}
                className="relative p-2 transition-all"
                style={{ border: '1px solid rgba(176,198,255,0.1)', borderRadius: '0.25rem', color: '#8c909f' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8c909f'; }}
              >
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full"
                    style={{ background: '#ffb4ab', color: '#690005' }}>
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </button>

              {/* Profile icon + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(v => !v)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'rgba(10,88,202,0.25)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#b0c6ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(176,198,255,0.2)'; }}
                >
                  <User className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setShowProfileMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 z-[100] overflow-hidden"
                        style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.15)', borderRadius: '0.375rem' }}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(176,198,255,0.08)' }}>
                          <p className="text-xs font-bold truncate" style={{ color: '#ccd8ff', fontFamily: "'Manrope', sans-serif" }}>{username}</p>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(176,198,255,0.35)' }}>{userEmail}</p>
                        </div>
                        <button
                          onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs transition-all"
                          style={{ color: '#ffb4ab' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,180,171,0.08)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* ── Reconnecting overlay ── */}
          <AnimatePresence>
            {isReconnecting && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex flex-col items-center justify-center"
                style={{ background: '#0c0e11' }}
              >
                <div className="w-full max-w-sm space-y-5 px-8">
                  <div className="space-y-1">
                    <p className="text-[9px] tracking-[0.3em] font-bold" style={{ color: 'rgba(176,198,255,0.4)' }}>RECONFIGURING</p>
                    <p className="text-2xl font-bold tracking-tighter" style={{ color: '#b0c6ff', fontFamily: "'Manrope', sans-serif" }}>SWITCHING SOURCE</p>
                  </div>
                  <div className="h-0.5 w-full overflow-hidden" style={{ background: 'rgba(176,198,255,0.1)' }}>
                    <motion.div className="h-full" style={{ background: '#b0c6ff' }}
                      initial={{ width: '0%' }} animate={{ width: '100%' }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Page content ── */}
          <main className="flex-1 overflow-hidden">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
};

export default AppLayout;

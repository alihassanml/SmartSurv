import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, RefreshCw, Bell, User, LogOut, Power, Shield, Activity, MapPin, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import type { Alert, PersonEvent, ClassThreshold } from '../types/dashboard';
import { API } from '../types/dashboard';
import { AppContext } from '../context/AppContext';
import type { AppContextValue, UrlCamera } from '../context/AppContext';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Monitor',
  '/dashboard/cameras': 'Cameras',
  '/dashboard/alerts': 'Alerts Log',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/watchlist': 'Watchlist',
  '/dashboard/settings': 'Settings',
  '/dashboard/users': 'User Management',
  '/dashboard/organization': 'Organization Feed',
  '/dashboard/organization-controls': 'Organization Management',
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const username = localStorage.getItem('username') || 'OPERATOR';
  const userEmail = localStorage.getItem('email') || 'N/A';
  const role = localStorage.getItem('role') || 'admin';

  // Redirection for Organization role
  useEffect(() => {
    if (role === 'organization' && !location.pathname.includes('/dashboard/organization')) {
      navigate('/dashboard/organization', { replace: true });
    }
  }, [role, location.pathname, navigate]);

  // --- Core state ---
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
  const [urlCameras, setUrlCameras] = useState<UrlCamera[]>([]);

  // â”€â”€ Settings state â”€â”€
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
  // Local camera visibility — persisted in DB via /api/camera/local/toggle-visibility
  const [localCameraVisible, setLocalCameraVisible] = useState(true);

  // --- Person focus ---
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [focusedPersonVisible, setFocusedPersonVisible] = useState(false);

  // --- Camera detection mode (null = not yet loaded from DB) ---
  const [cameraMode, setCameraMode] = useState<'detection' | 'search' | 'both' | null>(null);

  // --- Semantic search ---
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<{ id: string; score: number }[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [lastAlert, setLastAlert] = useState<Alert | null>(null);
  const semanticDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dataSettings, setDataSettings] = useState({ display_days: 1, retention_days: 30 });

  // â”€â”€ Unread alerts badge â”€â”€
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);

  // â”€â”€ Browser Audio â”€â”€
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

  // --- Init system info ---
  useEffect(() => {
    // Load current mode from DB (don't force-reset it)
    fetch(`${API}/api/camera/mode`)
      .then(r => r.json())
      .then(d => { if (d.mode) setCameraMode(d.mode as 'detection' | 'search' | 'both'); })
      .catch(() => {});

    fetch(`${API}/api/camera/feeds`)
      .then(r => r.json())
      .then(d => {
        const active = d.feeds && d.feeds.length > 0;
        setCameraActive(active);
        localStorage.setItem('cameraActive', String(active));
        setActiveFeeds(d.feeds || []);
      })
      .catch(() => {});

    fetch(`${API}/api/alerts/history`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAlerts(d); })
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
        // Load persisted local camera visibility (defaults true)
        if (typeof d.local_camera_visible === 'boolean') {
          setLocalCameraVisible(d.local_camera_visible);
        }
      }).catch(() => {});
    fetch(`${API}/api/settings/ui`)
      .then(r => r.json())
      .then(d => { if (typeof d.person_log_enabled === 'boolean') setPersonLogEnabled(d.person_log_enabled); })
      .catch(() => {});

    fetch(`${API}/api/settings/data`)
      .then(r => r.json())
      .then(d => { if (d.display_days) setDataSettings(d); })
      .catch(() => {});
  }, []);

  // --- Role Protection ---
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin && (location.pathname === '/dashboard/settings' || location.pathname === '/dashboard/users')) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  // --- Load thresholds ---
  useEffect(() => {
    setThresholdsLoading(true);
    fetch(`${API}/api/model/classes`)
      .then(r => r.json())
      .then(d => setClassThresholds(d.classes ?? []))
      .catch(() => setClassThresholds([]))
      .finally(() => setThresholdsLoading(false));
  }, []);

  // --- Alerts WebSocket ---
  useEffect(() => {
    if (isReconnecting) return;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let dead = false;
    const connect = () => {
      if (dead) return;
      const token = localStorage.getItem('token');
      ws = new WebSocket(`ws://${window.location.hostname}:8000/ws?token=${token}`);
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => { setIsConnected(false); if (!dead) retryTimer = setTimeout(connect, 1000); };
      ws.onerror = () => ws?.close();
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setAlerts(prev => [data, ...prev].slice(0, 50));
          setUnreadAlerts(n => n + 1);
          setLastAlert(data);
          playAlertSound();
          setTimeout(() => setLastAlert(null), 6000);
        } catch (_) {}
      };
    };
    connect();
    return () => { dead = true; if (retryTimer) clearTimeout(retryTimer); ws?.close(); };
  }, [isReconnecting]);

  // --- Stats (Heartbeat) WebSocket ---
  useEffect(() => {
    let ws: WebSocket | null = null;
    let dead = false;
    const connect = () => {
      if (dead) return;
      ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/stats`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.ts) {
            const lag = Math.max(0, Date.now() - data.ts);
            setSystemLatency(lag);
          }
        } catch (_) {}
      };
      ws.onclose = () => { if (!dead) setTimeout(connect, 3000); };
    };
    connect();
    return () => { dead = true; ws?.close(); };
  }, []);

  // â”€â”€ Persons WebSocket â”€â”€
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
          return [data, ...filtered].slice(0, 10);
        });
      };
      ws.onclose = () => { if (!dead) retryTimer = setTimeout(connect, 1500); };
      ws.onerror = () => ws?.close();
    };
    connect();
    return () => { dead = true; if (retryTimer) clearTimeout(retryTimer); ws?.close(); };
  }, [cameraActive, focusedPersonId]);

  // â”€â”€ Camera feeds polling â€” always runs so URL-only setups update correctly â”€â”€
  useEffect(() => {
    const fetchFeeds = async () => {
      // Don't override state while the user is actively toggling
      if (isCameraToggling) return;
      try {
        const res = await fetch(`${API}/api/camera/feeds`);
        const data = await res.json();
        const feeds: string[] = data.feeds || [];
        setActiveFeeds(feeds);
        // Keep cameraActive in sync: true if any feed is live
        setCameraActive(feeds.length > 0);
      } catch (_) {}
    };
    fetchFeeds();
    const interval = setInterval(fetchFeeds, 1500);
    return () => clearInterval(interval);
  }, [isCameraToggling]);

  // â”€â”€ URL Cameras â”€â”€
  const fetchUrlCameras = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/url-cameras`);
      const data = await res.json();
      setUrlCameras(data.cameras || []);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchUrlCameras(); }, [fetchUrlCameras]);

  const toggleUrlCamera = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/url-cameras/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      setUrlCameras(prev => prev.map(c => c.id === id ? { ...c, active: data.active } : c));
    } catch (_) {}
  };

  const toggleUrlCameraVisibility = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/url-cameras/${id}/toggle-visibility`, { method: 'POST' });
      const data = await res.json();
      setUrlCameras(prev => prev.map(c => c.id === id ? { ...c, visible: data.visible } : c));
    } catch (_) {}
  };

  const toggleLocalCameraVisibility = async () => {
    // Optimistic update first so UI responds instantly
    const newVal = !localCameraVisible;
    setLocalCameraVisible(newVal);
    try {
      await fetch(`${API}/api/camera/local/toggle-visibility`, { method: 'POST' });
    } catch (_) {
      // Roll back on failure
      setLocalCameraVisible(!newVal);
    }
  };

  // â”€â”€ Watchlist â”€â”€
  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/watchlist`);
      const data = await res.json();
      setWatchlist(data.watchlist || []);
    } catch (_) {}
  }, []);
  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  // â”€â”€ Handlers â”€â”€
  const handleLogout = () => { localStorage.removeItem('token'); navigate('/'); };

  const toggleCamera = async () => {
    setIsCameraToggling(true);
    try {
      const endpoint = cameraActive ? '/api/camera/stop' : '/api/camera/start';
      await fetch(`${API}${endpoint}`, { method: 'POST' });
      const newState = !cameraActive;
      setCameraActive(newState);
      localStorage.setItem('cameraActive', String(newState));
      if (!newState) {
        // Camera stopped â€” immediately clear feeds so monitor goes dark
        setActiveFeeds([]);
      } else {
        // Camera started â€” fetch feeds so monitor shows streams immediately
        try {
          const res = await fetch(`${API}/api/camera/feeds`);
          const data = await res.json();
          setActiveFeeds(data.feeds || []);
        } catch (_) {}
      }
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

  const handleModeChange = async (mode: 'detection' | 'search' | 'both') => {
    setCameraMode(mode); // optimistic
    try {
      await fetch(`${API}/api/camera/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
    } catch (_) {
      // roll back on failure
      setCameraMode(cameraMode);
    }
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

  const updateDataSettings = async (display: number, retention: number) => {
    // Optimistic update for instant slider feedback
    setDataSettings({ display_days: display, retention_days: retention });
    
    try {
      const res = await fetch(`${API}/api/settings/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_days: display, retention_days: retention }),
      });
      if (res.ok) {
        // Refresh history to reflect new display buffer
        fetch(`${API}/api/alerts/history`)
          .then(r => r.json())
          .then(d => { if (Array.isArray(d)) setAlerts(d); });
      }
    } catch (_) {
      // Rollback on failure could be added here if needed
    }
  };

  const deleteAlerts = async (ids: number[]) => {
    try {
      const res = await fetch(`${API}/api/alerts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => !ids.includes(a.id)));
      }
    } catch (_) {}
  };

  const pageTitle = pageTitles[location.pathname] ?? 'Dashboard';
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const ctxValue: AppContextValue = {
    alerts, detectedPersons, setDetectedPersons, selectedPerson, setSelectedPerson,
    isConnected, cameraActive, isCameraToggling, toggleCamera,
    currentSource, handleSourceChange, activeFeeds,
    urlCameras, fetchUrlCameras, toggleUrlCamera, toggleUrlCameraVisibility,
    localCameraVisible, toggleLocalCameraVisibility,
    watchlist, fetchWatchlist,
    emailEnabled, toggleEmail,
    privacyMode, togglePrivacy, personLogEnabled, togglePersonLog,
    browserSoundEnabled, toggleBrowserSound,
    classThresholds, thresholdsLoading, handleThresholdChange, handleSaveThresholds,
    saveStatus, handleSoundToggle, smtpEmail, systemIp,
    focusedPersonId, handleSetFocus, focusedPersonVisible,
    semanticQuery, semanticResults, semanticLoading, handleSemanticSearch,
    dataSettings, updateDataSettings,
    isReconnecting, username, userEmail, role, handleLogout,
    systemLatency,
    cameraMode, handleModeChange,
    deleteAlerts,
  };

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-background)', color: 'var(--color-on-surface)', fontFamily: "'Inter', sans-serif" }}>

        {/* --- Sidebar --- */}
        {role !== 'organization' && <Sidebar />}

        {/* --- Main area --- */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* --- Top header --- */}
          <header className="shrink-0 flex items-center justify-between px-6"
            style={{ height: '64px', background: 'var(--color-surface)', borderBottom: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {/* Page title */}
            <h1 className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}>
              {pageTitle}
            </h1>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* Connection dot */}
              

              {/* System Power toggle */}
              <button
                onClick={toggleCamera}
                disabled={isCameraToggling}
                title={cameraActive ? 'System Power ON â€” click to stop' : 'System Power OFF â€” click to start'}
                className="px-3 py-1.5 flex items-center gap-2 transition-all duration-300 disabled:opacity-50 text-[10px] font-bold tracking-widest uppercase"
                style={cameraActive
                  ? { border: '1px solid rgba(36,128,255,0.35)', color: 'var(--color-primary-container)', background: 'rgba(36,128,255,0.08)', borderRadius: '0.375rem' }
                  : { border: '1px solid rgba(186,26,26,0.35)', color: '#ba1a1a', background: 'rgba(186,26,26,0.06)', borderRadius: '0.375rem' }
                }
              >
                {isCameraToggling
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Power className="w-3.5 h-3.5" />
                }
                {cameraActive ? 'SYSTEM ON' : 'SYSTEM OFF'}
              </button>

              {/* Alerts bell */}
              <button
                onClick={() => { navigate('/dashboard/alerts'); setUnreadAlerts(0); }}
                className="relative p-2 transition-all"
                style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.375rem', color: 'var(--color-outline)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-outline)'; }}
              >
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold flex items-center justify-center rounded-full"
                    style={{ background: '#ba1a1a', color: '#ffffff' }}>
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </button>

              {/* Profile icon + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(v => !v)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{ background: 'rgba(36,128,255,0.1)', border: '1px solid rgba(36,128,255,0.25)', color: 'var(--color-primary)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(36,128,255,0.25)'; }}
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
                        style={{ background: 'var(--color-surface)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope', sans-serif" }}>{username}</p>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--color-outline)' }}>{userEmail}</p>
                        </div>
                        <button
                          onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs transition-all"
                          style={{ color: '#ba1a1a' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(186,26,26,0.06)'; }}
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

          {/* --- Reconnecting overlay --- */}
          <AnimatePresence>
            {isReconnecting && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex flex-col items-center justify-center"
                style={{ background: 'var(--color-background)' }}
              >
                <div className="w-full max-w-sm space-y-5 px-8">
                  <div className="space-y-1">
                    <p className="text-[9px] tracking-[0.3em] font-bold" style={{ color: 'var(--color-outline)' }}>RECONFIGURING</p>
                    <p className="text-2xl font-bold tracking-tighter" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope', sans-serif" }}>SWITCHING SOURCE</p>
                  </div>
                  <div className="h-0.5 w-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                    <motion.div className="h-full" style={{ background: 'var(--color-primary)' }}
                      initial={{ width: '0%' }} animate={{ width: '100%' }}
                      transition={{ duration: 1.2, ease: 'easeInOut' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- Page content --- */}
          <main className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ 
                  duration: 0.3, 
                  ease: [0.4, 0, 0.2, 1] 
                }}
                className="h-full w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
      </div>

      </div>

      {/* --- Global Alert Toast --- */}
    <AnimatePresence>
      {lastAlert && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: 50 }}
          onClick={() => setLastAlert(null)}
          className="fixed bottom-8 right-8 z-[9999] w-[380px] cursor-pointer overflow-hidden group"
          style={{
            background: 'var(--color-on-surface)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}
        >
          {/* Progress bar timer */}
          <motion.div 
            initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 6, ease: 'linear' }}
            className="h-1 bg-[var(--color-primary)]" 
          />
          
          <div className="p-5 flex gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${lastAlert.is_person_search_match ? 'bg-[#ba1a1a] shadow-[0_0_20px_rgba(186,26,26,0.4)]' : 'bg-[var(--color-primary)]'}`}>
              <Shield size={24} color="white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${lastAlert.is_person_search_match ? 'text-[#ffb4ab]' : 'text-[var(--color-primary)]'}`}>
                  {lastAlert.is_person_search_match ? 'Watchlist Match' : 'Security Alert'}
                </span>
                <span className="text-[10px] text-white/30 font-bold">{lastAlert.timestamp}</span>
              </div>
              
              <h4 className="text-sm font-black text-white uppercase tracking-tight truncate">
                {lastAlert.is_person_search_match ? 'Target Identified' : lastAlert.detections.map(d => d.label).join(', ')}
              </h4>
              
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-white/60">
                  <MapPin size={10} />
                  {lastAlert.location?.id || 'Main Entrance'}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-white/60">
                  <Activity size={10} />
                  {(lastAlert.detections[0]?.confidence * 100).toFixed(0)}% CONF
                </div>
              </div>
            </div>
            
            <button className="shrink-0 p-1 text-white/20 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Hover highlight overlay */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.03] transition-colors pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  </AppContext.Provider>
  );
};

export default AppLayout;


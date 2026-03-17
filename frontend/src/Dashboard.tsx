import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, LogOut, Shield, RefreshCw, Sliders, Search, Camera, UploadCloud, AlertTriangle, Crosshair } from 'lucide-react';

interface Detection {
  label: string;
  confidence: number;
  box: number[];
}

interface Alert {
  timestamp: string;
  detections: Detection[];
  image: string;
  is_person_search_match?: boolean;
}

interface ClassThreshold {
  name: string;
  threshold: number;
}

const API = 'http://localhost:8000';

const App: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const savedCamState = localStorage.getItem('cameraActive');
  const [cameraActive, setCameraActive] = useState(savedCamState === null ? true : savedCamState === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'OPERATOR';

  // --- Mode State ---
  const savedMode = localStorage.getItem('systemMode') as 'detection' | 'search' | 'both' | null;
  const [systemMode, setSystemMode] = useState<'detection' | 'search' | 'both'>(savedMode || 'detection');

  // --- Threshold state ---
  const [classThresholds, setClassThresholds] = useState<ClassThreshold[]>([]);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // --- Person Search state ---
  const savedSearchStatus = localStorage.getItem('searchStatus') as 'idle' | 'uploading' | 'active' | 'error' | null;
  const savedPreview = localStorage.getItem('searchPreview');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'uploading' | 'active' | 'error'>(savedSearchStatus || 'idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(savedPreview);

  // Fetch model classes + current thresholds when settings panel opens
  useEffect(() => {
    if (!showSettings) return;
    setThresholdsLoading(true);
    fetch(`${API}/api/model/classes`)
      .then(res => res.json())
      .then(data => {
        setClassThresholds(data.classes ?? []);
      })
      .catch(() => setClassThresholds([]))
      .finally(() => setThresholdsLoading(false));
  }, [showSettings]);

  const changeMode = async (mode: 'detection' | 'search' | 'both') => {
    try {
      await fetch(`${API}/api/camera/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      setSystemMode(mode);
      localStorage.setItem('systemMode', mode);
    } catch (e) {
      console.error("Failed to change mode", e);
    }
  };

  const handleThresholdChange = (name: string, value: number) => {
    setClassThresholds(prev =>
      prev.map(c => c.name === name ? { ...c, threshold: value } : c)
    );
    setSaveStatus('idle');
  };

  const handleSaveThresholds = async () => {
    setSaveStatus('saving');
    const thresholds: Record<string, number> = {};
    classThresholds.forEach(c => { thresholds[c.name] = c.threshold; });
    try {
      const res = await fetch(`${API}/api/model/thresholds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds }),
      });
      if (!res.ok) throw new Error('Failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSearchFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to base64 for persistence
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewUrl(base64String);
      localStorage.setItem('searchPreview', base64String);
    };
    reader.readAsDataURL(file);

    setSearchStatus('uploading');
    localStorage.setItem('searchStatus', 'uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/api/person/search`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      setSearchStatus('active');
      localStorage.setItem('searchStatus', 'active');
    } catch {
      setSearchStatus('error');
      localStorage.setItem('searchStatus', 'error');
    }
  };

  const clearPersonSearch = async () => {
    try {
      await fetch(`${API}/api/person/search`, { method: 'DELETE' });
      setPreviewUrl(null);
      setSearchStatus('idle');
      localStorage.removeItem('searchPreview');
      localStorage.removeItem('searchStatus');
    } catch (e) {
      console.error('Failed to clear search', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const toggleCamera = async () => {
    try {
      const endpoint = cameraActive ? '/api/camera/stop' : '/api/camera/start';
      await fetch(`${API}${endpoint}`, { method: 'POST' });
      const newState = !cameraActive;
      setCameraActive(newState);
      localStorage.setItem('cameraActive', String(newState));
    } catch (error) {
      console.error('Failed to toggle camera', error);
    }
  };

  useEffect(() => {
    const initCam = async () => {
      const pref = localStorage.getItem('cameraActive');
      const curMode = localStorage.getItem('systemMode') || 'detection';
      const shouldStart = pref === null || pref === 'true';

      // Sync initial mode to backend
      fetch(`${API}/api/camera/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: curMode }),
      }).catch(() => {});

      if (shouldStart) {
        try {
          await fetch(`${API}/api/camera/start`, { method: 'POST' });
          setCameraActive(true);
        } catch (e) {
          console.error('Could not start camera', e);
        }
      } else {
        fetch(`${API}/api/camera/stop`, { method: 'POST' }).catch(() => {});
        setCameraActive(false);
      }
    };
    initCam();
    return () => {
      fetch(`${API}/api/camera/stop`, { method: 'POST' }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws`);
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newAlert: Alert = data;
      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [alerts]);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-[#00ff00] font-mono">
      {/* BIOMETRIC SEARCH OVERLAY (Active during Person Search) */}
      {(systemMode === 'search' || systemMode === 'both') && searchStatus === 'active' && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020202]">
          {/* Hexagonal Pattern Background */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          {/* Cyberpunk Grid */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,255,153,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,153,0.05)_1px,transparent_1px)] bg-[size:100px_100px]"></div>

          {/* Central Biometric Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="relative w-[800px] h-[800px] flex items-center justify-center">
                {/* Rotating Outer Hexagon */}
                
                {/* Pulsing Scan Circle */}
                
                {/* Target Brackets */}
                {/* <div className="absolute inset-[25%] flex items-center justify-center">
                   <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-hacker-green"></div>
                   <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-hacker-green"></div>
                   <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-hacker-green"></div>
                   <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-hacker-green"></div>
                </div> */}

                {/* Vertical Scanning Beam */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-hacker-green to-transparent animate-biometric-scan shadow-[0_0_15px_#00ff99]"></div>
             </div>
          </div>

          {/* Left Side: Biometric Telemetry */}
          <div className="absolute left-10 top-1/2 -translate-y-1/2 w-64 space-y-12">
             <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-hacker-green">
                   <span>FACIAL_VECTORS</span>
                   <span className="animate-pulse">PROCESSING...</span>
                </div>
                <div className="h-1 bg-black border border-hacker-green/20 overflow-hidden">
                   <div className="h-full bg-hacker-green animate-progress-fast w-1/2"></div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                   {[...Array(16)].map((_, i) => (
                     <div key={i} className={`h-4 border border-hacker-green/20 ${Math.random() > 0.6 ? 'bg-hacker-green/40' : ''}`}></div>
                   ))}
                </div>
             </div>

             <div className="space-y-4 opacity-40">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 text-[9px] font-mono">
                     <span className="text-hacker-green font-bold">PT_0{i}</span>
                     <span className="flex-1 border-b border-dashed border-hacker-green/20"></span>
                     <span className="animate-pulse">{(Math.random()*100).toFixed(2)}%</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Right Side: Identity Buffering */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-64 space-y-12 text-right">
             <div className="space-y-2">
                <div className="text-[10px] font-bold text-hacker-green mb-1">DATA_STREAM_OMEGA</div>
                <div className="flex flex-col gap-1 overflow-hidden h-40 opacity-30 text-[8px] font-mono leading-tight">
                   {[...Array(20)].map((_, i) => (
                     <div key={i} className="animate-data-stream">
                        {`DB_QUERY_${Math.random().toString(16).slice(2, 10).toUpperCase()} >> NO_MATCH_FOUND`}
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="bg-hacker-green/5 border border-hacker-green/20 p-4 inline-block">
                <div className="text-[8px] opacity-40 mb-2">MATCH_THRESHOLD</div>
                <div className="text-2xl font-bold tracking-tighter">0.985</div>
             </div>
          </div>

          {/* Screen Glitch Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
        </div>
      )}

      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-[#0a0a0a] border-b border-[#1a1a1a] relative z-10">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#00ff00] rounded-full animate-pulse"></div>
            <span>SMARTSURV // OPS_CORE</span>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex bg-[#111] border border-[#1a1a1a] p-1 gap-1">
            <button 
              onClick={() => changeMode('detection')}
              className={`px-3 py-1 text-[10px] transition-all ${systemMode === 'detection' ? 'bg-[#00ff00] text-black font-bold' : 'hover:bg-[#1a1a1a] opacity-50'}`}
            >
              ACTIVITY_SCAN
            </button>
            <button 
              onClick={() => changeMode('search')}
              className={`px-3 py-1 text-[10px] transition-all ${systemMode === 'search' ? 'bg-red-600 text-white font-bold' : 'hover:bg-[#1a1a1a] opacity-50'}`}
            >
              PERSON_SEARCH
            </button>
            <button 
              onClick={() => changeMode('both')}
              className={`px-3 py-1 text-[10px] transition-all ${systemMode === 'both' ? 'bg-[#00ffea] text-black font-bold' : 'hover:bg-[#1a1a1a] opacity-50'}`}
            >
              HYBRID_LINK
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleCamera}
            className={`px-4 py-1.5 text-[11px] border border-[#00ff00] transition-all hover:bg-[#00ff00] hover:text-black flex items-center gap-2 ${!cameraActive && 'border-red-600 text-red-600'}`}
          >
            <Camera className="w-3 h-3" />
            {cameraActive ? 'TERMINATE_FEED' : 'INITIALIZE_FEED'}
          </button>
          
          <div className="flex items-center gap-4 text-[11px]">
             <div className="flex flex-col items-end">
               <span className="opacity-40 text-[9px]">UPLINK_STATUS</span>
               <span className={isConnected ? 'text-[#00ff00]' : 'text-red-600'}>{isConnected ? 'STABLE' : 'LOST'}</span>
             </div>
             <button onClick={() => setShowSettings(true)} className="p-2 border border-[#1a1a1a] hover:border-[#00ff00] bg-[#111] transition-all">
                <Settings className="w-4 h-4" />
             </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="fixed top-0 right-0 h-full w-[460px] bg-[#080808] border-l border-[#1a1a1a] z-50 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#1a1a1a] shrink-0">
              <span className="font-bold tracking-widest text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#00ff00]"></div>
                SYSTEM_PARAMETERS
              </span>
              <button onClick={() => setShowSettings(false)} className="text-[10px] px-2 py-1 bg-[#111] border border-[#1a1a1a] hover:text-white">
                QUIT
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* User Profile */}
              <div className="p-8 border-b border-[#1a1a1a] bg-gradient-to-b from-[#0a0a0a] to-transparent">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 border-2 border-[#00ff00] p-1">
                    <div className="w-full h-full bg-[#00ff00]/10 flex items-center justify-center">
                      <User className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] opacity-30 tracking-[0.2em] mb-1">AUTHORIZED_OPERATOR</p>
                    <p className="text-xl font-bold tracking-tight uppercase">{username}</p>
                    <div className="mt-2 text-[9px] bg-[#00ff00]/5 border border-[#00ff00]/20 px-2 py-1 inline-block">
                       LEVEL_01_ACCESS
                    </div>
                  </div>
                </div>
              </div>

              {/* PERSON SEARCH UI */}
              <div className="p-8 border-b border-[#1a1a1a]">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#00ff00]" />
                      <span className="text-xs font-bold tracking-widest">PERSON_TARGET_LOCK</span>
                   </div>
                   {searchStatus === 'active' && (
                     <span className="text-[9px] text-red-500 animate-pulse font-bold">[ SCANNING_ACTIVE ]</span>
                   )}
                </div>

                {searchStatus === 'idle' ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border border-dashed border-[#1a1a1a] hover:bg-[#00ff00]/5 hover:border-[#00ff00]/50 transition-all cursor-pointer group">
                    <UploadCloud className="w-8 h-8 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    <span className="text-[10px] opacity-40 mt-3 font-bold group-hover:text-[#00ff00]">INJECT_FACIAL_DATA</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleSearchFileUpload} />
                  </label>
                ) : (
                  <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-4 relative overflow-hidden">
                    {/* Background animation for target box */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff00]"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00ff00]"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00ff00]"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff00]"></div>

                    <div className="flex gap-6 relative z-10">
                      {previewUrl && (
                        <div className="relative">
                          <img src={previewUrl} alt="Target" className="w-24 h-24 object-cover grayscale brightness-110" />
                          <div className="absolute inset-0 border border-[#00ff00]/30"></div>
                          <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ff00]/50 animate-scanner"></div>
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-[10px] font-bold opacity-30">DATA_SET</p>
                          <p className="text-[11px] font-bold">TARGET_OMEGA_01</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold opacity-30">MATCH_ENGINE</p>
                          <p className="text-[11px] text-[#00ff00] flex items-center gap-1">
                            <div className="w-1 h-1 bg-[#00ff00] animate-ping"></div>
                            ACTIVE_SCAN
                          </p>
                        </div>
                        <button
                          onClick={clearPersonSearch}
                          className="w-full py-2 bg-red-950/20 border border-red-900/50 text-red-500 text-[9px] font-bold hover:bg-red-900/40 transition-all"
                        >
                          PURGE_TARGET_DATA
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* THRESHOLDS UI */}
              <div className="p-8">
                <div className="flex items-center gap-2 mb-8">
                  <Sliders className="w-4 h-4 text-[#00ffea]" />
                  <span className="text-xs font-bold tracking-widest">ACTIVITY_CONFIDENCE</span>
                </div>

                {thresholdsLoading ? (
                  <div className="flex items-center justify-center py-10 opacity-30 text-[10px] gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    FETCHING_DYNAMIC_CLASSES...
                  </div>
                ) : (
                  <div className="space-y-8">
                    {classThresholds.map((cls) => (
                      <div key={cls.name} className="group">
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">
                            {cls.name.toUpperCase()}_CHECK
                          </span>
                          <span className="text-[14px] font-bold tabular-nums">
                            {(cls.threshold * 100).toFixed(0)}<span className="text-[10px] opacity-40 ml-0.5">%</span>
                          </span>
                        </div>
                        <input
                          type="range" min={0} max={1} step={0.01} value={cls.threshold}
                          onChange={(e) => handleThresholdChange(cls.name, parseFloat(e.target.value))}
                          className="w-full appearance-none h-1 bg-[#1a1a1a] rounded-none outline-none cursor-pointer range-hacker"
                          style={{ background: `linear-gradient(to right, #00ffea 0%, #00ffea ${cls.threshold * 100}%, #1a1a1a ${cls.threshold * 100}%, #1a1a1a 100%)` }}
                        />
                      </div>
                    ))}
                    
                    <button
                      onClick={handleSaveThresholds}
                      disabled={saveStatus === 'saving'}
                      className={`w-full py-4 border-2 font-bold text-xs tracking-widest transition-all mt-4 flex items-center justify-center gap-2 ${
                        saveStatus === 'saved' ? 'bg-[#00ffea] text-black border-[#00ffea]' : 
                        saveStatus === 'error' ? 'bg-red-600 text-white border-red-600' :
                        'bg-transparent border-[#00ffea] text-[#00ffea] hover:bg-[#00ffea] hover:text-black'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
                      {saveStatus === 'saving' ? 'UPLOADING_VECTORS...' : 'REBOOT_CORE_SYNC'}
                    </button>
                    {saveStatus === 'saved' && (
                       <p className="text-[10px] text-[#00ffea] text-center font-bold mt-2 animate-pulse">✓ ENGINE_HOT_RELOADED</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-[#1a1a1a]">
               <button onClick={handleLogout} className="w-full py-3 flex items-center justify-center gap-3 bg-[#111] border border-red-900/30 text-red-500 hover:bg-red-900/10 text-[10px] font-bold transition-all">
                  <LogOut className="w-4 h-4" />
                  TERMINATE_SESSION
               </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden relative z-10">
        <section className="flex-1 p-6 flex flex-col gap-6">
          {/* Main Feed Container */}
          <div className="flex-1  overflow-hidden flex items-center justify-center relative border border-[#1a1a1a] shadow-[0_0_50px_rgba(0,255,0,0.05)]">
            
            {/* Corners Decorative */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00ff00]/20"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00ff00]/20"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00ff00]/20"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00ff00]/20"></div>

            {cameraActive ? (
              <img src={`${API}/video_feed`} alt="LIVE FEED" className="max-h-full max-w-full object-contain brightness-110 contrast-110" />
            ) : (
              <div className="flex flex-col items-center gap-4 text-[#00ff00]/40">
                <Camera className="w-12 h-12 animate-pulse" />
                <div className="text-[10px] font-bold tracking-[0.4em]">FEED_OFFLINE</div>
              </div>
            )}

            {/* Viewport HUD */}
            <div className="absolute top-6 left-6 flex flex-col gap-1">
               <div className="bg-[#00ff00] text-black px-2 py-0.5 text-[10px] font-bold">LIVE_INTERCEPT</div>
               <div className="text-[9px] opacity-40">RES_640x480 // FPS_30</div>
            </div>

            <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
               {systemMode === 'search' && (
                 <div className="bg-red-600 text-white px-3 py-1 text-[10px] font-bold animate-pulse flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,0,0.4)]">
                    <Crosshair className="w-3 h-3" />
                    SEARCHING_FACIAL_OMEGA
                 </div>
               )}
               {systemMode === 'detection' && (
                 <div className="bg-[#00ff00] text-black px-3 py-1 text-[10px] font-bold flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    ACTIVITY_MONITOR_ON
                 </div>
               )}
               {systemMode === 'both' && (
                 <div className="bg-[#00ffea] text-black px-3 py-1 text-[10px] font-bold flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" />
                    HYBRID_MODE_ACTIVE
                 </div>
               )}
            </div>

            {/* Animated Scanning Line (only during Active Person Search) */}
            {cameraActive && (systemMode === 'search' || systemMode === 'both') && searchStatus === 'active' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-[1px] bg-[#00ff00]/40 absolute animate-v-scan shadow-[0_0_10px_#00ff00]"></div>
                
                {/* Tracking Reticle Lines */}
                <div className="h-full w-[0.5px] bg-[#00ff00]/10 absolute left-1/4 backdrop-blur-[1px]"></div>
                <div className="h-full w-[0.5px] bg-[#00ff00]/10 absolute left-2/4 backdrop-blur-[1px]"></div>
                <div className="h-full w-[0.5px] bg-[#00ff00]/10 absolute left-3/4 backdrop-blur-[1px]"></div>
                
                <div className="w-full h-[0.5px] bg-[#00ff00]/10 absolute top-1/4 backdrop-blur-[1px]"></div>
                <div className="w-full h-[0.5px] bg-[#00ff00]/10 absolute top-2/4 backdrop-blur-[1px]"></div>
                <div className="w-full h-[0.5px] bg-[#00ff00]/10 absolute top-3/4 backdrop-blur-[1px]"></div>
                
              </div>
            )}
          </div>

         
        </section>

        {/* Alerts Sidebar - High contrast List */}
        <aside className="w-[360px] bg-[#080808] border-l border-[#1a1a1a] flex flex-col shadow-2xl">
          <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center bg-[#0a0a0a]">
            <div>
              <h2 className="text-sm font-bold tracking-widest">ALERTS_BUFFER</h2>
              <p className="text-[9px] opacity-30 mt-1 uppercase">Intercepted Incidents Queue</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
            {alerts.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                  <Shield className="w-12 h-12" />
                  <span className="text-[10px] tracking-widest">NO_THREATS_DETECTED</span>
               </div>
            ) : (
              alerts.map((alert, index) => (
                <div key={index} className={`relative overflow-hidden group border-2 ${alert.is_person_search_match ? 'border-red-600/50 bg-red-950/10' : 'border-[#1a1a1a] bg-[#0c0c0c]'}`}>
                  {/* Event ID Badge */}
                  <div className={`absolute top-0 right-0 px-2 py-1 text-[9px] font-bold ${alert.is_person_search_match ? 'bg-red-600 text-white' : 'bg-[#1a1a1a] text-[#00ff00]'}`}>
                    ID_{index.toString().padStart(3, '0')}
                  </div>

                  {/* Timestamp Sidebar */}
                  <div className="absolute left-2 top-2 text-[8px] opacity-40 rotate-180 [writing-mode:vertical-lr]">
                    {alert.timestamp}_UTC
                  </div>

                  <div className="p-3 pl-8">
                     <div className="relative mb-3 aspect-video overflow-hidden">
                        <img 
                          src={`data:image/jpeg;base64,${alert.image}`} 
                          alt="INCIDENT" 
                          className={`w-full h-full object-cover transition-all duration-700 ${alert.is_person_search_match ? 'brightness-125 saturate-150 scale-105' : 'grayscale group-hover:grayscale-0'}`} 
                        />
                        {alert.is_person_search_match && (
                          <div className="absolute inset-0 bg-red-600/20 mix-blend-overlay animate-pulse"></div>
                        )}
                        
                        {/* Target Marker for Face Match */}
                        {alert.is_person_search_match && (
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Crosshair className="w-12 h-12 text-red-600 animate-ping opacity-60" />
                           </div>
                        )}
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between items-center bg-black/40 p-1.5 border-l-2 border-[#00ff00]">
                           <span className="text-[10px] font-bold">THREAT_IDENT:</span>
                           <div className="flex flex-wrap gap-1 justify-end">
                              {alert.is_person_search_match && (
                                <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 font-bold">TARGET_OMEGA</span>
                              )}
                              {alert.detections.map((d, i) => (
                                <span key={i} className="text-[9px] bg-[#1a1a1a] text-[#00ff00] px-1.5 py-0.5 border border-[#00ff00]/20">
                                  {d.label.toUpperCase()}
                                </span>
                              ))}
                           </div>
                        </div>

                        {alert.is_person_search_match && (
                          <div className="bg-red-600/20 border border-red-600/40 p-2">
                             <p className="text-[9px] text-red-500 font-bold leading-tight">
                               MATCH_CONFIRMED: Visual verification required immediately. GPS tracking initiated.
                             </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-[9px] opacity-40 font-bold pt-1">
                           <span>AI_REL_SCORE: {(Math.max(...(alert.detections.map(d => d.confidence) || [0]), 0) * 100).toFixed(1)}%</span>
                           <span>CHANNEL_00</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Decorative Scanline */}
                  <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-[#00ff00]/10"></div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      <style>{`
        @keyframes sonar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes biometric-scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes progress-fast {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes data-stream {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
        @keyframes data-stream-reverse {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }
        @keyframes ping-slow {
          0% { transform: scale(0.8); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes v-scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes scanner {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-sonar-spin {
          animation: sonar-spin 8s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-reverse-spin {
          animation: reverse-spin 15s linear infinite;
        }
        .animate-biometric-scan {
          animation: biometric-scan 4s linear infinite;
        }
        .animate-progress-fast {
          animation: progress-fast 2s ease-in-out infinite;
        }
        .animate-data-stream {
          animation: data-stream 20s linear infinite;
        }
        .animate-data-stream-reverse {
          animation: data-stream-reverse 30s linear infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-v-scan {
          animation: v-scan 3s linear infinite;
        }
        .animate-scanner {
          animation: scanner 2s ease-in-out infinite;
        }
        
        .range-hacker::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 8px; height: 16px; background: #00ffea; border: 1px solid #000; cursor: pointer;
        }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; }
        ::-webkit-scrollbar-thumb:hover { background: #00ff00; }
      `}</style>
    </div>
  );
};

export default App;
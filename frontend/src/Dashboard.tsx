import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, LogOut, Shield, RefreshCw, Sliders,
  Search, Camera, UploadCloud, AlertTriangle, Crosshair,
  Volume2, X, ChevronDown, Zap, Radio, Mail, MapPin, Target
} from 'lucide-react';


interface Detection { label: string; confidence: number; box: number[]; }
interface Alert { 
  timestamp: string; 
  detections: Detection[]; 
  image: string; 
  is_person_search_match?: boolean | string;
  location?: { id: string; lat: string; lon: string; maps: string; };
}

interface ClassThreshold { name: string; threshold: number; sound_enabled: boolean; }

const API = `http://${window.location.hostname}:8000`;

const CameraStream: React.FC<{ feedId?: string; active: boolean; showHeatmap?: boolean }> = ({ feedId, active, showHeatmap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapImgRef = useRef<HTMLImageElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
       if (rafRef.current) cancelAnimationFrame(rafRef.current);
       return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let isActive = true;

    const run = async () => {
      try {
        const url = `${API}/video_feed${feedId ? `?id=${feedId}` : ''}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.body || !isActive) return;
        const reader = res.body.getReader();
        let buffer = new Uint8Array(0);

        while (isActive) {
          const { done, value } = await reader.read();
          if (done || !isActive) { if (reader) reader.cancel(); break; }

          const tmp = new Uint8Array(buffer.length + value.length);
          tmp.set(buffer); tmp.set(value, buffer.length);
          buffer = tmp;

          let start = -1, end = -1;
          for (let i = 0; i < buffer.length - 1; i++) {
            if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8) start = i;
            if (start >= 0 && buffer[i] === 0xFF && buffer[i + 1] === 0xD9) { end = i + 2; break; }
          }

          if (start >= 0 && end > start) {
            const jpeg = buffer.slice(start, end);
            buffer = buffer.slice(end);
            const blobUrl = URL.createObjectURL(new Blob([jpeg], { type: 'image/jpeg' }));
            const img = new Image();
            img.onload = () => {
              if (!isActive) { URL.revokeObjectURL(blobUrl); return; }
              if (canvas.width !== img.naturalWidth) canvas.width = img.naturalWidth;
              if (canvas.height !== img.naturalHeight) canvas.height = img.naturalHeight;
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(blobUrl);
            };
            img.src = blobUrl;
          }
        }
      } catch (e) {
        if (isActive) setTimeout(run, 1000);
      }
    };

    run();
    return () => { isActive = false; };
  }, [active, feedId]);

  useEffect(() => {
    if (!active || !showHeatmap) return;
    let isActive = true;
    const fetchHeatmap = async () => {
      try {
        const url = `${API}/api/camera/heatmap/${feedId || 'camera-0'}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data.heatmap && heatmapImgRef.current) {
          heatmapImgRef.current.src = `data:image/png;base64,${data.heatmap}`;
        }
      } catch (e) {
         // ignore
      } finally {
        if (isActive) setTimeout(fetchHeatmap, 1000);
      }
    };
    fetchHeatmap();
    return () => { isActive = false; };
  }, [active, showHeatmap, feedId]);

  return (
    <div className="relative w-full h-full">
       <canvas ref={canvasRef} className="w-full h-full object-contain" style={{ imageRendering: 'auto' }} />
       {showHeatmap && (
          <img 
             ref={heatmapImgRef} 
             className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-[0.85] transition-opacity duration-1000" 
             alt="Heatmap" 
          />
       )}
    </div>
  );
};


const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const savedCamState = localStorage.getItem('cameraActive');
  const [cameraActive, setCameraActive] = useState(savedCamState === 'true');
  const [isCameraToggling, setIsCameraToggling] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const navigate   = useNavigate();

  const username = localStorage.getItem('username') || 'OPERATOR';

  const savedMode = localStorage.getItem('systemMode') as 'detection' | 'search' | 'both' | null;
  const [systemMode, setSystemMode] = useState<'detection' | 'search' | 'both'>(savedMode || 'detection');

  const [classThresholds, setClassThresholds] = useState<ClassThreshold[]>([]);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const savedSearchStatus = localStorage.getItem('searchStatus') as 'idle' | 'uploading' | 'active' | 'error' | null;
  const savedPreview = localStorage.getItem('searchPreview');
  const [searchStatus, setSearchStatus] = useState<'idle' | 'uploading' | 'active' | 'error'>(savedSearchStatus || 'idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(savedPreview);
  const [searchSoundEnabled, setSearchSoundEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [operatorLatLon, setOperatorLatLon] = useState<{ lat: number; lon: number } | null>(null);
  const [mapAlert, setMapAlert] = useState<Alert | null>(null);
  const [currentSource, setCurrentSource] = useState<'0' | 'remote' | 'hybrid'>((localStorage.getItem('currentSource') as any) || '0');
  const [activeFeeds, setActiveFeeds] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [newTargetName, setNewTargetName] = useState("");
  const [newTargetPreview, setNewTargetPreview] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const [showRemoteLink, setShowRemoteLink] = useState(false);
  const [systemIp, setSystemIp] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);




  useEffect(() => {
    if (!showSettings) return;
    setThresholdsLoading(true);
    fetch(`${API}/api/model/classes`)
      .then(res => res.json())
      .then(data => setClassThresholds(data.classes ?? []))
      .catch(() => setClassThresholds([]))
      .finally(() => setThresholdsLoading(false));
  }, [showSettings]);

  useEffect(() => {
    // Auto-detect operator location
    const detectLocation = async () => {
      try {
        const res = await fetch('http://ip-api.com/json/');
        const data = await res.json();
        if (data.status === 'success') {
          setOperatorLatLon({ lat: data.lat, lon: data.lon });
        }
      } catch (err) { console.error('Failed to detect operator location', err); }
    };
    detectLocation();
  }, []);

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
    } catch (err) { console.error('Failed to sync sound', err); }
  };

  const toggleSearchSound = async () => {
    const newVal = !searchSoundEnabled;
    try {
      await fetch(`${API}/api/camera/sound`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newVal }),
      });
      setSearchSoundEnabled(newVal);
    } catch (err) { console.error('Failed to toggle search sound', err); }
  };

  const toggleEmail = async () => {
    const newVal = !emailEnabled;
    try {
      await fetch(`${API}/api/camera/email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newVal }),
      });
      setEmailEnabled(newVal);
    } catch (err) { console.error('Failed to toggle email', err); }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
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
    } catch (e) { console.error('Failed to change mode', e); }
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

  const fetchWatchlist = async () => {
    try {
      const res = await fetch(`${API}/api/watchlist`);
      const data = await res.json();
      setWatchlist(data.watchlist || []);
    } catch (e) { console.error("Failed to fetch watchlist", e); }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAddWatchlist = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !newTargetName) return;
    
    // Create local preview
    const reader = new FileReader();
    reader.onloadend = () => setNewTargetPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsReconnecting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/api/watchlist?name=${encodeURIComponent(newTargetName)}`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setNewTargetName("");
        setNewTargetPreview(null);
        setIsAddingTarget(false);
        fetchWatchlist();
      }
    } catch (e) { console.error("Failed to add target", e); }
    finally { setIsReconnecting(false); }
  };


  const removeTarget = async (name: string) => {
    try {
      await fetch(`${API}/api/watchlist/${encodeURIComponent(name)}`, { method: 'DELETE' });
      fetchWatchlist();
    } catch (e) { console.error("Failed to remove target", e); }
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
    } catch (error) { console.error('Failed to toggle camera', error); }
    finally { setIsCameraToggling(false); }
  };

  const handleSourceChange = async (newSource: '0' | 'remote' | 'hybrid') => {
    setIsReconnecting(true);
    try {
      const res = await fetch(`${API}/api/camera/source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: newSource }),
      });
      if (res.ok) {
        setCurrentSource(newSource);
        localStorage.setItem('currentSource', newSource);
        setCameraActive(true);
        // Refresh feeds list immediately
        const feedsRes = await fetch(`${API}/api/camera/feeds`);
        const feedsData = await feedsRes.json();
        setActiveFeeds(feedsData.feeds || []);
      }

    } catch (e) {
      console.error('Failed to change source', e);
    } finally {
      setIsReconnecting(false);
    }
  };


  useEffect(() => {
    if (!cameraActive) return;
    const fetchFeeds = async () => {
      try {
        const res = await fetch(`${API}/api/camera/feeds`);
        const data = await res.json();
        setActiveFeeds(data.feeds || []);
      } catch (e) { console.error("Failed to fetch feeds", e); }
    };
    fetchFeeds();
    const interval = setInterval(fetchFeeds, 3000);
    return () => clearInterval(interval);
  }, [cameraActive, currentSource]);

  useEffect(() => {
    fetch(`${API}/api/system/info`)
      .then(res => res.json())
      .then(data => setSystemIp(data.local_ip))
      .catch(err => console.error("Failed to get system IP", err));
  }, []);

  const displayIp = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? (systemIp || 'localhost') 
    : window.location.hostname;

  const remoteUrl = `${window.location.protocol}//${displayIp}${window.location.port ? ':' + window.location.port : ''}/remote-camera?client_id=${Math.random().toString(36).substring(7)}`;

  useEffect(() => {
    const initCam = async () => {
      const pref = localStorage.getItem('cameraActive');
      const curMode = localStorage.getItem('systemMode') || 'detection';
      fetch(`${API}/api/camera/mode`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: curMode }),
      }).catch(() => {});
      if (pref === 'true') {
        try { await fetch(`${API}/api/camera/start`, { method: 'POST' }); setCameraActive(true); }
        catch (e) { console.error('Could not start camera', e); }
      } else {
        fetch(`${API}/api/camera/stop`, { method: 'POST' }).catch(() => {});
        setCameraActive(false);
      }
    };
    initCam();
    return () => { fetch(`${API}/api/camera/stop`, { method: 'POST' }).catch(() => {}); };
  }, []);

  useEffect(() => {
    if (isReconnecting) return;
    const ws = new WebSocket(`ws://localhost:8000/ws`);
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAlerts(prev => [data, ...prev].slice(0, 50));
    };
    return () => ws.close();
  }, [systemMode, isReconnecting]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [alerts]);

  // Grid rendering logic moved to separate component for multi-feed support


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
            {/* Grid */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'linear-gradient(rgba(0,255,133,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,133,0.06) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

            {/* Scan beam */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff85] to-transparent animate-biometric-scan"
              style={{ boxShadow: '0 0 20px #00ff85, 0 0 40px rgba(0,255,133,0.3)' }} />

            {/* Left telemetry */}
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

            {/* Right data stream */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-56 text-right opacity-40">
              <div className="text-[9px] tracking-widest mb-2">DATA_STREAM_OMEGA</div>
              <div className="space-y-1 text-[8px] font-mono">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-data-stream">{`QUERY_${Math.random().toString(16).slice(2,10).toUpperCase()} >> NO_MATCH`}</div>
                ))}
              </div>
              <div className="mt-4 border border-[rgba(0,255,133,0.2)] p-3 inline-block">
                <div className="text-[8px] opacity-40 mb-1">THRESHOLD</div>
                <div className="text-xl font-bold">0.985</div>
              </div>
            </div>

            {/* Scanline CRT effect */}
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

      {/* ─── WATCHLIST MANAGER (Right Side) ─── */}
      <AnimatePresence>
        {isAddingTarget && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setIsAddingTarget(false)}
               className="fixed inset-0 bg-black/80 z-[300] backdrop-blur-md"
            />
            <motion.div
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               className="fixed top-0 right-0 h-full w-[400px] bg-[#090a0c] border-l border-[#00ff85]/20 p-8 z-[301] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10 border-b border-[#00ff85]/10 pb-6">
                 <div>
                   <h3 className="text-xl font-bold tracking-widest text-[#00ff85]">WATCHLIST_DB</h3>
                   <p className="text-[10px] opacity-40 uppercase font-bold mt-1">Personnel Authorization Management</p>
                 </div>
                 <button onClick={() => setIsAddingTarget(false)} className="p-2 hover:bg-white/5 border border-transparent hover:border-[#00ff85]/30">
                   <X className="w-5 h-5 text-[#00ff85]" />
                 </button>
              </div>

              <div className="space-y-8">
                {/* Add New Target Input */}
                <div className="space-y-3 bg-[#0c0e12] p-5 border border-[#00ff85]/10">
                   <p className="text-[9px] font-bold text-[#00ff85]/60 tracking-widest uppercase">Add New Target</p>
                   <input 
                      type="text" 
                      placeholder="ENTER_PERSON_NAME..."
                      value={newTargetName}
                      onChange={(e) => setNewTargetName(e.target.value)}
                      className="w-full bg-black/40 border border-[#00ff85]/20 text-[#00ff85] text-xs px-4 py-3 placeholder:text-[#00ff85]/20 focus:outline-none focus:border-[#00ff85]/50 transition-all font-bold"
                   />
                   <label className="block">
                      {newTargetPreview ? (
                         <div className="relative w-full aspect-square border border-[#00ff85]/30 mb-3 bg-black/40 overflow-hidden">
                            <img src={newTargetPreview} className="w-full h-full object-cover grayscale" alt="Preview" />
                            <div className="absolute inset-0 bg-[#00ff85]/10 animate-pulse" />
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ff85] animate-scanner" />
                            <button 
                               onClick={(e) => { e.preventDefault(); setNewTargetPreview(null); }}
                               className="absolute top-2 right-2 p-1 bg-black/60 text-white hover:text-red-500"
                            >
                               <X className="w-4 h-4" />
                            </button>
                         </div>
                      ) : (
                         <div className={`w-full py-8 border-2 border-dashed ${newTargetName ? 'border-[#00ff85]/40 hover:bg-[#00ff85]/5 cursor-pointer text-[#00ff85]' : 'border-white/5 text-white/10 opacity-50 cursor-not-allowed'} font-bold text-[10px] tracking-widest uppercase text-center transition-all flex flex-col items-center gap-2`}>
                            <UploadCloud className="w-6 h-6" />
                            {newTargetName ? "Select Biometric Image" : "Enter Name First"}
                         </div>
                      )}
                      <input type="file" className="hidden" onChange={handleAddWatchlist} disabled={!newTargetName} />
                   </label>
                </div>

                {/* Current Watchlist */}
                <div className="space-y-4">
                  <p className="text-[9px] font-bold text-[#00ff85]/60 tracking-widest uppercase">Active Targets ({watchlist.length})</p>
                  <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {watchlist.length === 0 ? (
                      <div className="text-center py-10 opacity-20 text-[10px] italic">NO_TARGETS_ACTIVE</div>
                    ) : (
                      watchlist.map(name => (
                        <div key={name} className="flex justify-between items-center p-2 bg-black/40 border border-white/5 group hover:border-[#00ff85]/30 transition-all">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-[#00ff85]/20 overflow-hidden bg-black shrink-0 relative">
                                 <img 
                                    src={`${API}/api/watchlist/images/${name}.jpg?t=${Date.now()}`} 
                                    className="w-full h-full object-cover grayscale" 
                                    onError={(e) => { e.currentTarget.style.display='none'; }}
                                    alt="" 
                                 />

                                 <Search className="absolute inset-0 m-auto w-3 h-3 text-[#00ff85]/20" />
                              </div>
                              <span className="text-[10px] font-bold tracking-wider">{name.toUpperCase()}</span>
                           </div>
                           <button onClick={() => removeTarget(name)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 transition-all">
                              <X className="w-4 h-4" />
                           </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* ─── HEADER ─── */}
      <header className="relative z-10 flex justify-between items-center px-6 py-3 bg-[rgba(6,6,8,0.95)] border-b border-[rgba(0,255,133,0.1)] backdrop-blur-sm shrink-0">
        {/* Brand + Mode switcher */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 border border-[rgba(0,255,133,0.5)] flex items-center justify-center group-hover:border-[#00ff85] group-hover:shadow-[0_0_12px_rgba(0,255,133,0.3)] transition-all duration-300 animate-glow-pulse">
              <Shield className="w-4 h-4" />
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
                <button key={mode}
                  onClick={() => changeMode(mode)}
                  className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-300"
                  style={active ? { background: cfg.bg, color: cfg.color, borderBottom: `2px solid ${cfg.color}` } : { color: 'rgba(0,255,133,0.3)' }}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#00ff85] animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-[10px] font-bold ${isConnected ? 'text-[#00ff85]/70' : 'text-red-500'}`}>
              {isConnected ? 'UPLINK_STABLE' : 'UPLINK_LOST'}
            </span>
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
            {isCameraToggling ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            {isCameraToggling
              ? (cameraActive ? 'TURNING_OFF...' : 'TURNING_ON...')
              : (cameraActive ? 'CAMERA_OFF' : 'CAMERA_ON')}
          </button>

          {/* Source Dropdown */}
          <div className="relative group">
            <select
              value={currentSource}
              onChange={(e) => handleSourceChange(e.target.value as any)}
              className="appearance-none bg-[rgba(12,13,16,0.8)] border border-[rgba(0,255,133,0.2)] text-[#00ff85] text-[10px] font-bold tracking-widest px-8 py-2 hover:border-[#00ff85] focus:outline-none transition-all cursor-pointer uppercase min-w-[160px]"
              style={{
                color: currentSource === 'hybrid' ? '#00e5ff' : currentSource === 'remote' ? '#ff4466' : '#00ff85',
                borderColor: currentSource === 'hybrid' ? 'rgba(0,229,255,0.4)' : currentSource === 'remote' ? 'rgba(255,68,102,0.4)' : 'rgba(0,255,133,0.2)'
              }}
            >
              <option value="0">Source: Local</option>
              <option value="remote">Source: Remote</option>
              <option value="hybrid">Source: Hybrid</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
               <ChevronDown className="w-3 h-3" />
            </div>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <Radio className={`w-3.5 h-3.5 ${currentSource !== '0' ? 'animate-pulse' : ''}`} 
                 style={{ color: currentSource === 'hybrid' ? '#00e5ff' : currentSource === 'remote' ? '#ff4466' : '#00ff85' }} />
            </div>
          </div>


          {/* Phone Link Button */}
          <button
            onClick={() => setShowRemoteLink(true)}
            className="flex items-center gap-2 px-3 py-2 border border-[rgba(0,255,133,0.2)] text-[10px] font-bold hover:border-[#00ff85] transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            CONNECT_PHONE
          </button>

          {/* Heatmap Toggle */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center gap-2 px-3 py-2 border border-[rgba(0,255,133,0.2)] text-[10px] font-bold hover:border-[#00ff85] transition-all"
            style={showHeatmap ? { borderColor: '#00ff85', color: '#00ff85', background: 'rgba(0,255,133,0.1)' } : {}}
          >
            <Sliders className={`w-3.5 h-3.5 ${showHeatmap ? 'animate-pulse' : ''}`} />
            {showHeatmap ? 'HEATMAP_ON' : 'HEATMAP_OFF'}
          </button>

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

      {/* --- REMOTE LINK MODAL --- */}
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
                Scan this code or open this URL on your secondary device (phone) to start a remote surveillance uplink.
              </p>
              
              <div className="bg-white p-4 inline-block mb-8">
                {/* Simplified QR Placeholder - actually just the URL for now as creating a QR in code is complex without libraries */}
                <div className="text-black text-[10px] font-bold break-all max-w-[200px]">
                  {remoteUrl}
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(remoteUrl);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className={`w-full py-3 font-bold text-[10px] tracking-widest uppercase transition-all ${
                    isCopied ? 'bg-white text-black' : 'bg-[#00ff85] text-black hover:brightness-110'
                  }`}
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

      {/* ─── SETTINGS PANEL ─── */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-[440px] bg-[#090a0c] border-l border-[rgba(0,255,133,0.12)] z-50 flex flex-col shadow-[−20px_0_60px_rgba(0,0,0,0.8)]"
            >
              {/* Panel Header */}
              <div className="flex justify-between items-center p-6 border-b border-[rgba(0,255,133,0.1)] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ff85]" />
                  <span className="text-xs font-bold tracking-[0.25em]">SYSTEM_PARAMETERS</span>
                </div>
                <button onClick={() => setShowSettings(false)}
                  className="p-1.5 hover:bg-[rgba(0,255,133,0.06)] border border-transparent hover:border-[rgba(0,255,133,0.2)] transition-all duration-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* User Profile */}
                <div className="p-6 border-b border-[rgba(0,255,133,0.08)]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-2 border-[rgba(0,255,133,0.4)] flex items-center justify-center bg-[rgba(0,255,133,0.05)]">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] opacity-30 tracking-[0.2em] mb-0.5">AUTHORIZED_OPERATOR</p>
                      <p className="text-base font-bold tracking-tight uppercase">{username}</p>
                      <div className="mt-1 text-[8px] tracking-widest text-[#00ff85]/40 border border-[rgba(0,255,133,0.15)] px-2 py-0.5 inline-block">
                        LEVEL_01_ACCESS
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-b border-[rgba(0,255,133,0.08)]">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-[#00ff85]" />
                      <span className="text-[10px] font-bold tracking-[0.2em]">WATCHLIST_STATUS</span>
                    </div>
                  </div>

                  <div className="border border-[rgba(0,255,133,0.15)] bg-[rgba(0,255,133,0.02)] p-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] opacity-40 uppercase">Active Targets:</span>
                            <span className="text-[11px] font-bold text-[#00ff85]">{watchlist.length}</span>
                        </div>
                        <button 
                            onClick={() => { setShowSettings(false); setIsAddingTarget(true); }}
                            className="w-full py-2 bg-[rgba(0,255,133,0.1)] border border-[rgba(0,255,133,0.3)] text-[9px] font-bold text-[#00ff85] hover:bg-[#00ff85] hover:text-black transition-all"
                        >
                            MANAGE_WATCHLIST
                        </button>
                    </div>
                  </div>
                </div>


                {/* Thresholds */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Sliders className="w-3.5 h-3.5 text-[#00e5ff]" />
                    <span className="text-[10px] font-bold tracking-[0.2em]">ACTIVITY_CONFIDENCE</span>
                  </div>

                  {thresholdsLoading ? (
                    <div className="flex items-center gap-2 py-8 opacity-30 text-[10px] justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      FETCHING_CLASSES...
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {classThresholds.map(cls => (
                        <div key={cls.name} className="group border-b border-[rgba(0,255,133,0.06)] pb-6 last:border-0">
                          {/* Sound toggle */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Volume2 className={`w-3 h-3 ${cls.sound_enabled ? 'text-[#00e5ff]' : 'text-red-600/50'}`} />
                              <span className="text-[8px] opacity-40 uppercase">Audio: {cls.name}</span>
                            </div>
                            <button onClick={() => handleSoundToggle(cls.name)}
                              className="relative w-8 h-4 border transition-all duration-300"
                              style={cls.sound_enabled ? { borderColor: '#00e5ff', background: 'rgba(0,229,255,0.05)' } : { borderColor: 'rgba(255,68,102,0.3)' }}>
                              <div className={`absolute top-0.5 bottom-0.5 w-2.5 transition-all duration-300 ${cls.sound_enabled ? 'right-0.5 bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]' : 'left-0.5 bg-red-800'}`} />
                            </button>
                          </div>
                          {/* Slider */}
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[9px] font-bold opacity-30 group-hover:opacity-70 transition-opacity uppercase">{cls.name}</span>
                            <span className="text-sm font-bold tabular-nums text-[#00e5ff]">
                              {(cls.threshold * 100).toFixed(0)}<span className="text-[9px] opacity-40 ml-0.5">%</span>
                            </span>
                          </div>
                          <input type="range" min={0} max={1} step={0.01} value={cls.threshold}
                            onChange={e => handleThresholdChange(cls.name, parseFloat(e.target.value))}
                            className="w-full appearance-none h-0.5 rounded-none outline-none cursor-pointer range-hacker"
                            style={{ background: `linear-gradient(to right, #00e5ff 0%, #00e5ff ${cls.threshold * 100}%, rgba(0,229,255,0.1) ${cls.threshold * 100}%, rgba(0,229,255,0.1) 100%)` }}
                          />
                        </div>
                      ))}

                      <button onClick={handleSaveThresholds} disabled={saveStatus === 'saving'}
                        className="w-full py-3 border-2 font-bold text-[10px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2"
                        style={saveStatus === 'saved'
                          ? { background: '#00e5ff', color: '#000', borderColor: '#00e5ff' }
                          : saveStatus === 'error'
                          ? { background: '#ff4466', color: '#fff', borderColor: '#ff4466' }
                          : { background: 'transparent', color: '#00e5ff', borderColor: '#00e5ff' }
                        }>
                        <RefreshCw className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
                        {saveStatus === 'saving' ? 'UPLOADING...' : saveStatus === 'saved' ? '✓ SYNCED' : 'SYNC_THRESHOLDS'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Logout */}
              <div className="p-5 border-t border-[rgba(0,255,133,0.08)] shrink-0">
                <button onClick={handleLogout}
                  className="w-full py-3 flex items-center justify-center gap-2 border border-red-900/40 text-red-400 hover:bg-red-900/10 text-[10px] font-bold tracking-widest transition-all duration-200">
                  <LogOut className="w-3.5 h-3.5" />
                  TERMINATE_SESSION
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex flex-1 overflow-hidden relative z-10">

        {/* ─── VIDEO FEED SECTION ─── */}
        <section className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">

          {/* Feed Container */}
          <div className="flex-1 relative border border-[rgba(0,255,133,0.12)] bg-[#080a0c] overflow-hidden group">

            {/* Corner brackets */}
            {['top-0 left-0 border-t-2 border-l-2','top-0 right-0 border-t-2 border-r-2','bottom-0 left-0 border-b-2 border-l-2','bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
              <div key={i} className={`absolute w-8 h-8 ${cls} border-[#00ff85]/30 group-hover:border-[#00ff85]/70 transition-colors duration-500 animate-corner-pulse`} />
            ))}

            {/* Dynamic Video Feeds Grid */}
            <div className={`absolute inset-0 w-full h-full p-2 grid gap-2 ${
               activeFeeds.length > 4 ? 'grid-cols-3' : activeFeeds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
              {activeFeeds.length > 0 ? (
                activeFeeds.map(feedId => (
                  <div key={feedId} className="relative border border-[rgba(0,255,133,0.1)] bg-black/40 overflow-hidden group/feed">
                     <CameraStream feedId={feedId} active={cameraActive} showHeatmap={showHeatmap} />
                     <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 text-[8px] font-bold border border-[rgba(0,255,133,0.2)] tracking-tighter">
                        FEED_{feedId.toUpperCase()}
                     </div>
                     {/* Decorative corner for each feed */}
                     <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-[#00ff85]/30" />
                     <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-[#00ff85]/30" />
                  </div>
                ))
              ) : (
                cameraActive && <CameraStream active={cameraActive} showHeatmap={showHeatmap} />
              )}
            </div>

            {!cameraActive ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#00ff85]/25">
                <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Camera className="w-14 h-14" />
                </motion.div>
                <p className="text-[10px] tracking-[0.4em] font-bold">FEED_OFFLINE</p>
                <button onClick={toggleCamera}
                  disabled={isCameraToggling}
                  className={`mt-2 flex items-center gap-2 px-5 py-2 border border-[rgba(0,255,133,0.25)] text-[#00ff85]/50 hover:text-[#00ff85] hover:border-[#00ff85] text-[9px] tracking-widest uppercase transition-all duration-300 ${isCameraToggling ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isCameraToggling && <RefreshCw className="w-3 h-3 animate-spin" />}
                  {isCameraToggling ? 'TURNING_ON...' : 'CAMERA_ON'}
                </button>
              </div>
            ) : null}

            {/* HUD — top-left */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              <div className="flex items-center gap-2 bg-[rgba(0,255,133,0.9)] text-[#060608] px-2.5 py-1 text-[10px] font-bold">
                <Radio className="w-3 h-3" />
                LIVE_INTERCEPT
              </div>
              <div className="text-[9px] text-[#00ff85]/40 pl-0.5">RES 800×600 // 30 FPS</div>
            </div>

            {/* HUD — top-right mode badge */}
            <div className="absolute top-4 right-4 z-10">
              <AnimatePresence mode="wait">
                <motion.div key={systemMode}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold"
                  style={{
                    color: modeConfig[systemMode].color,
                    border: `1px solid ${modeConfig[systemMode].border}`,
                    background: modeConfig[systemMode].bg,
                  }}>
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
                {[1/4, 2/4, 3/4].map((pos, i) => (
                  <React.Fragment key={i}>
                    <div className="absolute top-0 bottom-0 w-px bg-[rgba(0,255,133,0.08)]" style={{ left: `${pos * 100}%` }} />
                    <div className="absolute left-0 right-0 h-px bg-[rgba(0,255,133,0.08)]" style={{ top: `${pos * 100}%` }} />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── ALERTS SIDEBAR ─── */}
        <aside className="w-[340px] bg-[#070809] border-l border-[rgba(0,255,133,0.1)] flex flex-col shrink-0">

          {/* Sidebar header */}
          <div className="px-5 py-4 border-b border-[rgba(0,255,133,0.1)] bg-[rgba(6,6,8,0.9)] flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-[11px] font-bold tracking-[0.25em]">ALERTS_BUFFER</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-[8px] opacity-25 uppercase">Incidents</p>
                <div className="h-[2px] w-2 bg-[#00ff85]/20" />
                <button onClick={() => setIsAddingTarget(true)} className="text-[8px] text-[#00ff85] hover:underline hover:opacity-100 opacity-60 font-bold tracking-widest">OPEN_WATCHLIST ({watchlist.length})</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {alerts.length > 0 && (
                <span className="text-[9px] bg-[rgba(0,255,133,0.1)] border border-[rgba(0,255,133,0.2)] px-1.5 py-0.5 font-bold">
                  {alerts.length}
                </span>
              )}
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
          </div>

          {/* Alerts list */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-15">
                <Shield className="w-10 h-10" />
                <span className="text-[9px] tracking-[0.3em]">NO_THREATS_DETECTED</span>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {alerts.map((alert, index) => (
                  <motion.div key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden border group"
                    style={alert.is_person_search_match
                      ? { borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.04)' }
                      : { borderColor: 'rgba(0,255,133,0.1)', background: 'rgba(12,13,16,0.8)' }
                    }
                  >
                    {/* ID badge */}
                    <div className="absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold flex items-center gap-1.5"
                      style={alert.is_person_search_match
                        ? { background: '#ff4466', color: '#fff' }
                        : { background: 'rgba(0,255,133,0.15)', color: '#00ff85' }
                      }>
                      {alert.is_person_search_match && <Target className="w-2.5 h-2.5" />}
                      ID_{index.toString().padStart(3, '0')}
                    </div>


                    {/* Timestamp */}
                    <div className="absolute left-2 top-2 text-[7px] opacity-30 rotate-180 [writing-mode:vertical-lr]">
                      {alert.timestamp}_UTC
                    </div>

                    <div className="p-2.5 pl-7">
                      {/* Image */}
                      <div className="relative mb-2.5 aspect-[4/3] overflow-hidden">
                        <img
                          src={`data:image/jpeg;base64,${alert.image}`}
                          alt="INCIDENT"
                          className={`w-full h-full object-cover transition-all duration-500 ${alert.is_person_search_match ? 'brightness-125 saturate-150' : 'grayscale group-hover:grayscale-0'}`}
                        />
                        {alert.is_person_search_match && (
                          <>
                            <div className="absolute inset-0 bg-red-600/15 mix-blend-overlay animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Crosshair className="w-10 h-10 text-red-400 animate-ping opacity-50" />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Labels */}
                      <div className="flex justify-between items-center bg-[rgba(0,0,0,0.3)] px-2 py-1.5 border-l-2 mb-2"
                        style={{ borderColor: alert.is_person_search_match ? '#ff4466' : '#00ff85' }}>
                        <span className="text-[9px] font-bold opacity-50">THREAT:</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {alert.is_person_search_match && (
                            <span className="text-[8px] px-1.5 py-0.5 font-bold bg-red-600 text-white">TARGET_Ω</span>
                          )}
                          {alert.detections.map((d, i) => (
                            <span key={i} className="text-[8px] px-1.5 py-0.5 border border-[rgba(0,255,133,0.2)] text-[#00ff85]">
                              {d.label.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Match confirmation */}
                      {alert.is_person_search_match && (
                        <div className="bg-red-950/20 border border-red-800/40 p-2 mb-2">
                          <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest mb-1 italic">
                            {(typeof alert.is_person_search_match === 'string') ? alert.is_person_search_match : "TARGET_LOCATED"}
                          </p>
                          <p className="text-[7px] text-red-400 opacity-80 leading-tight">Visual verification required immediately. Threat active in current sector.</p>
                        </div>
                      )}

                      {/* Confidence & Location */}
                      <div className="flex justify-between items-center text-[8px] font-bold">
                        <div className="flex flex-col opacity-30">
                          <span>AI_REL: {(Math.max(...(alert.detections.map(d => d.confidence) || [0]), 0) * 100).toFixed(1)}%</span>
                          <span>CHANNEL_00</span>
                        </div>

                        
                        {alert.location && (
                          <button 
                            onClick={() => setMapAlert(alert)}
                            className="flex items-center gap-1.5 px-2 py-1 bg-[rgba(0,255,133,0.05)] border border-[rgba(0,255,133,0.2)] text-[#00ff85] hover:bg-[#00ff85] hover:text-[#000] transition-all duration-300"
                          >
                            <MapPin className="w-3 h-3" />
                            MAP
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </aside>
      </main>

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
                {/* Embedded Google Map */}
                <div className="flex-1 bg-black relative">
                  <iframe 
                    width="100%" height="100%" frameBorder="0" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8)' }}
                    src={`https://www.google.com/maps?q=${mapAlert.location?.lat},${mapAlert.location?.lon}&z=14&output=embed`}
                    allowFullScreen
                  />
                  {/* Decorative Scan FX */}
                  <div className="absolute inset-0 pointer-events-none border-[15px] border-[#00ff85]/5" />
                </div>

                {/* Tactical Stats */}
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
                        <div className="w-1 h-1 bg-[#00e5ff] rounded-full" />
                        <div className="w-1 h-1 bg-[#00e5ff] rounded-full" />
                        <div className="w-1 h-1 bg-[#00e5ff] rounded-full" />
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
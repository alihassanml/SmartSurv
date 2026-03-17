import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, LogOut, Shield, RefreshCw, Sliders } from 'lucide-react';

interface Detection {
  label: string;
  confidence: number;
  box: number[];
}

interface Alert {
  timestamp: string;
  detections: Detection[];
  image: string;
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

  // --- Threshold state ---
  const [classThresholds, setClassThresholds] = useState<ClassThreshold[]>([]);
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
      // Camera was restarted by backend; update button state
      if (cameraActive) {
        localStorage.setItem('cameraActive', 'true');
      }
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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
      const shouldStart = pref === null || pref === 'true';
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
      const newAlert: Alert = JSON.parse(event.data);
      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [alerts]);

  const saveLabel =
    saveStatus === 'saving' ? 'APPLYING...' :
    saveStatus === 'saved'  ? '✓ APPLIED & RESTARTED' :
    saveStatus === 'error'  ? '✗ ERROR' :
    'UPDATE & RESTART';

  const saveBtnClass =
    saveStatus === 'saved'  ? 'bg-[#00ff00] text-black border-[#00ff00]' :
    saveStatus === 'error'  ? 'border-red-500 text-red-500' :
    saveStatus === 'saving' ? 'opacity-50 cursor-not-allowed border-[#00ff00]' :
    'border-[#00ff00] hover:bg-[#00ff00] hover:text-black';

  return (
    <div className="flex flex-col h-screen bg-hacker-dark text-hacker-green">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-hacker-gray">
        <div
          className="text-xl font-bold tracking-widest flex items-center gap-4 cursor-pointer hover:text-white transition-colors"
        >
          <span>SMARTSURV // SYSTEM_V1.0</span>
          <button
            onClick={(e) => { e.stopPropagation(); toggleCamera(); }}
            className={`px-3 py-1 text-xs border border-hacker-green hover:bg-hacker-green hover:text-black transition-colors ${!cameraActive && 'opacity-50 text-red-500 border-red-500 hover:bg-red-500'}`}
          >
            {cameraActive ? 'STOP_CAM' : 'START_CAM'}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-hacker-green' : 'bg-red-600'}`} />
          <span className="text-sm">{isConnected ? 'UPLINK_STABLE' : 'UPLINK_OFFLINE'}</span>
          <span className="text-sm opacity-50">{new Date().toLocaleTimeString()}</span>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowSettings(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-[420px] bg-[#0a0a0a] border-l border-[#1a1a1a] z-50 flex flex-col font-mono text-[#00ff00] overflow-hidden">
            {/* Panel Header */}
            <div className="flex justify-between items-center p-4 border-b border-[#1a1a1a] shrink-0">
              <span className="font-bold tracking-widest uppercase text-sm">CONFIG // SETTINGS</span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                [ CLOSE ]
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* Profile */}
              <div className="p-6 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 border border-[#00ff00] flex items-center justify-center">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs opacity-50 uppercase tracking-widest mb-1">Operator</p>
                    <p className="font-bold text-lg tracking-wide uppercase">{username}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
                      <span className="text-xs opacity-60">ACTIVE_SESSION</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-6 border-b border-[#1a1a1a] space-y-3">
                <p className="text-xs opacity-50 uppercase tracking-widest mb-3">System Info</p>
                <div className="flex justify-between text-xs">
                  <span className="opacity-60">WebSocket</span>
                  <span className={isConnected ? 'text-[#00ff00]' : 'text-red-500'}>
                    {isConnected ? 'CONNECTED' : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-60">Camera</span>
                  <span className={cameraActive ? 'text-[#00ff00]' : 'text-red-500'}>
                    {cameraActive ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="opacity-60">Total Alerts</span>
                  <span>{alerts.length}</span>
                </div>
              </div>

              {/* ── Detection Confidence Thresholds ── */}
              <div className="p-6 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="w-4 h-4 opacity-70" />
                  <p className="text-xs uppercase tracking-widest font-bold">Detection Thresholds</p>
                </div>
                <p className="text-[10px] opacity-40 mb-5 leading-relaxed">
                  Set the minimum confidence required per class before an alert is triggered.
                  Hit UPDATE &amp; RESTART to apply — the camera engine will reload automatically.
                </p>

                {thresholdsLoading ? (
                  <div className="flex items-center gap-2 text-xs opacity-50 py-4">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>LOADING MODEL CLASSES...</span>
                  </div>
                ) : classThresholds.length === 0 ? (
                  <p className="text-xs text-red-500 opacity-70">
                    Could not load model classes. Is the backend running?
                  </p>
                ) : (
                  <div className="space-y-5">
                    {classThresholds.map((cls) => (
                      <div key={cls.name}>
                        {/* Label row */}
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] uppercase tracking-widest font-bold">
                            {cls.name}
                          </span>
                          <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 border border-[#00ff00]/30 bg-[#00ff00]/5">
                            {(cls.threshold * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Slider */}
                        <div className="relative">
                          <input
                            id={`threshold-${cls.name}`}
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={cls.threshold}
                            onChange={(e) =>
                              handleThresholdChange(cls.name, parseFloat(e.target.value))
                            }
                            className="w-full appearance-none h-[3px] bg-[#1a1a1a] rounded-none outline-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #00ff00 0%, #00ff00 ${cls.threshold * 100}%, #1a1a1a ${cls.threshold * 100}%, #1a1a1a 100%)`,
                            }}
                          />
                        </div>

                        {/* Tick labels */}
                        <div className="flex justify-between text-[9px] opacity-30 mt-1">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save button */}
                {classThresholds.length > 0 && (
                  <button
                    onClick={handleSaveThresholds}
                    disabled={saveStatus === 'saving'}
                    className={`mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 border text-xs uppercase tracking-widest transition-colors ${saveBtnClass}`}
                  >
                    <RefreshCw className={`w-4 h-4 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
                    {saveLabel}
                  </button>
                )}
              </div>

            </div>

            {/* Actions — always at bottom */}
            <div className="p-6 border-t border-[#1a1a1a] space-y-3 shrink-0">
              <button
                onClick={() => { setShowSettings(false); navigate('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 border border-[#1a1a1a] hover:border-[#00ff00]/50 text-xs uppercase tracking-widest transition-colors"
              >
                <Shield className="w-4 h-4 opacity-60" />
                HOME
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 border border-[#00ff00] hover:bg-[#00ff00] hover:text-black text-xs uppercase tracking-widest transition-colors"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Live Feed */}
        <section className="flex-1 p-4 flex flex-col gap-4">
          <div className="flex-1 bg-black overflow-hidden flex items-center justify-center relative border border-hacker-gray">
            {cameraActive ? (
              <img
                src={`${API}/video_feed`}
                alt="LIVE FEED"
                className="max-h-full max-w-full object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ) : (
              <div className="text-hacker-green animate-pulse">CAMERA_OFFLINE</div>
            )}
            <div className="absolute top-4 left-4 text-xs font-bold bg-black/50 p-1 px-2">
              LIVE_STREAM // CAM_00
            </div>
          </div>

          <div className="h-24 bg-hacker-gray p-2 text-xs overflow-hidden font-mono">
            <div className="text-opacity-70 mb-1 tracking-tighter">[ SYSTEM LOGS ]</div>
            {alerts.slice(0, 3).map((a, i) => (
              <div key={i} className="opacity-80">
                {`> ${a.timestamp} : DETECTED ${a.detections.map(d => d.label).join(', ')}`}
              </div>
            ))}
            {!alerts.length && <div>{"> WAITING FOR SYSTEM TRIGGERS..."}</div>}
          </div>
        </section>

        {/* Sidebar Alerts */}
        <aside className="w-80 bg-hacker-gray flex flex-col">
          <div className="p-4 text-lg font-bold">ALERTS_QUEUE</div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="bg-hacker-dark p-2 animate-pulse-once">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="font-bold underline">ID_{index.toString().padStart(3, '0')}</span>
                  <span>{alert.timestamp}</span>
                </div>
                <img
                  src={`data:image/jpeg;base64,${alert.image}`}
                  alt="EVENT SNAPSHOT"
                  className="w-full h-auto mb-2 grayscale contrast-125"
                />
                <div className="text-[10px] space-y-1">
                  {alert.detections.map((d, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-black bg-hacker-green px-1">{d.label.toUpperCase()}</span>
                      <span className="opacity-60">{(d.confidence * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!alerts.length && (
              <div className="text-center opacity-30 mt-20">NO_INCIDENTS_DETECTED</div>
            )}
          </div>
        </aside>
      </main>

      <style>{`
        @keyframes pulse-once {
          0%   { background-color: #00ff0033; }
          100% { background-color: transparent; }
        }
        .animate-pulse-once {
          animation: pulse-once 1s ease-out;
        }

        /* Custom range slider styling */
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #00ff00;
          border: 2px solid #000;
          cursor: pointer;
          border-radius: 0;
        }
        input[type='range']::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: #00ff00;
          border: 2px solid #000;
          cursor: pointer;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
};

export default App;
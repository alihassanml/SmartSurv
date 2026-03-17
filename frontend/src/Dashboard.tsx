import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, LogOut, Shield } from 'lucide-react';

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

const App: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  // Read saved camera preference — default to true (on) for first-time users
  const savedCamState = localStorage.getItem('cameraActive');
  const [cameraActive, setCameraActive] = useState(savedCamState === null ? true : savedCamState === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'OPERATOR';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const toggleCamera = async () => {
    try {
      const endpoint = cameraActive ? '/api/camera/stop' : '/api/camera/start';
      await fetch(`http://localhost:8000${endpoint}`, { method: 'POST' });
      const newState = !cameraActive;
      setCameraActive(newState);
      // Persist preference so it survives navigation
      localStorage.setItem('cameraActive', String(newState));
    } catch (error) {
      console.error('Failed to toggle camera', error);
    }
  };

  // On mount: respect the saved camera preference
  useEffect(() => {
    const initCam = async () => {
      const pref = localStorage.getItem('cameraActive');
      const shouldStart = pref === null || pref === 'true'; // default ON
      if (shouldStart) {
        try {
          await fetch('http://localhost:8000/api/camera/start', { method: 'POST' });
          setCameraActive(true);
        } catch (e) {
          console.error('Could not start camera', e);
        }
      } else {
        // user had it off — ensure backend is also off
        fetch('http://localhost:8000/api/camera/stop', { method: 'POST' }).catch(() => {});
        setCameraActive(false);
      }
    };
    initCam();

    return () => {
      // Always stop camera when leaving dashboard
      fetch('http://localhost:8000/api/camera/stop', { method: 'POST' }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      const newAlert: Alert = JSON.parse(event.data);
      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [alerts]);

  return (
    <div className="flex flex-col h-screen bg-hacker-dark text-hacker-green">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-hacker-gray">
        <div 
          className="text-xl font-bold tracking-widest flex items-center gap-4 cursor-pointer hover:text-white transition-colors"
          onClick={() => navigate('/')}
        >
          <span>SMARTSURV // SYSTEM_V1.0</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleCamera();
            }}
            className={`px-3 py-1 text-xs border border-hacker-green hover:bg-hacker-green hover:text-black transition-colors ${!cameraActive && 'opacity-50 text-red-500 border-red-500 hover:bg-red-500'}`}
          >
            {cameraActive ? 'STOP_CAM' : 'START_CAM'}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-hacker-green' : 'bg-red-600'}`}></div>
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
          <div className="fixed top-0 right-0 h-full w-96 bg-[#0f0f0f] border-l border-[#1a1a1a] z-50 flex flex-col font-mono text-[#00ff00]">
            <div className="flex justify-between items-center p-4 border-b border-[#1a1a1a]">
              <span className="font-bold tracking-widest uppercase text-sm">SETTINGS</span>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
              >
                [ CLOSE ]
              </button>
            </div>

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
                <span className={isConnected ? 'text-[#00ff00]' : 'text-red-500'}>{isConnected ? 'CONNECTED' : 'OFFLINE'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-60">Camera</span>
                <span className={cameraActive ? 'text-[#00ff00]' : 'text-red-500'}>{cameraActive ? 'ONLINE' : 'OFFLINE'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-60">Total Alerts</span>
                <span>{alerts.length}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 mt-auto space-y-3">
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
        {/* Live Feed Section */}
        <section className="flex-1 p-4 flex flex-col gap-4">
          <div className="flex-1 bg-black overflow-hidden flex items-center justify-center relative border border-hacker-gray">
            {cameraActive ? (
              <img 
                src="http://localhost:8000/video_feed" 
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
              <div className="text-center opacity-30 mt-20">
                NO_INCIDENTS_DETECTED
              </div>
            )}
          </div>
        </aside>
      </main>

      <style>{`
        @keyframes pulse-once {
          0% { background-color: #00ff0033; }
          100% { background-color: transparent; }
        }
        .animate-pulse-once {
          animation: pulse-once 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
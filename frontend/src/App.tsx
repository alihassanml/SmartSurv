import React, { useState, useEffect, useRef } from 'react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

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
        <div className="text-xl font-bold tracking-widest">
          SMARTSURV // SYSTEM_V1.0
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-hacker-green' : 'bg-red-600'}`}></div>
          <span className="text-sm">{isConnected ? 'UPLINK_STABLE' : 'UPLINK_OFFLINE'}</span>
          <span className="text-sm opacity-50">{new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Live Feed Section */}
        <section className="flex-1 p-4 flex flex-col gap-4">
          <div className="flex-1 bg-black overflow-hidden flex items-center justify-center relative">
            <img 
              src="http://localhost:8000/video_feed" 
              alt="LIVE FEED" 
              className="max-h-full max-w-full object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
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
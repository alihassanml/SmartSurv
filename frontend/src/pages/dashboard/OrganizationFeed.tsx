import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Bell, MapPin, Clock, AlertTriangle, Eye, Image as ImageIcon, Building, CheckCircle } from 'lucide-react';
import { API } from '../../types/dashboard';

interface Alert {
  feed_id: string;
  timestamp: string;
  detections: Array<{ label: string; confidence: number }>;
  image?: string;
  location?: { id: string; lat: number; lon: number };
  is_person_search_match?: boolean;
}

const OrganizationFeed: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWS = () => {
        const token = localStorage.getItem('token');
        const socket = new WebSocket(`ws://${window.location.hostname}:8000/ws?token=${token}`);
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setAlerts(prev => [data, ...prev].slice(0, 50));
            // Show toast or sound if needed
        };

        socket.onclose = () => setTimeout(connectWS, 3000);
        ws.current = socket;
    };

    connectWS();
    return () => ws.current?.close();
  }, []);

  return (
    <div className="h-full bg-[var(--color-background)] font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-white border-b border-[var(--color-outline-variant)] flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl shadow-[0_4px_12px_rgba(186,26,26,0.2)]" style={{ background: '#ba1a1a' }}>
                <Shield size={20} color="white" />
            </div>
            <div>
                <p className="text-xs text-[var(--color-outline)]">Organization Hub</p>
                <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Live Alert Feed</h1>
            </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
            <div className="w-2 h-2 bg-[#16a34a] rounded-full animate-pulse" />
            <span className="text-xs font-medium text-[var(--color-on-surface)]">System Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left: Alert List */}
        <div className="w-[420px] border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
                {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4 pt-20">
                        <Bell size={40} />
                        <p className="text-xs font-medium">Waiting for security events...</p>
                    </div>
                ) : (
                    alerts.map((alert, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setSelectedAlert(alert)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                selectedAlert === alert
                                ? 'bg-white border-[var(--color-primary)] shadow-[0_4px_16px_rgba(36,128,255,0.1)]'
                                : 'bg-white border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                    alert.is_person_search_match
                                    ? 'bg-red-50 text-[#ba1a1a] border border-red-200'
                                    : 'border border-[var(--color-outline-variant)] text-[var(--color-primary)]'
                                }`} style={!alert.is_person_search_match ? { background: 'rgba(36,128,255,0.08)' } : {}}>
                                    {alert.is_person_search_match ? 'Watchlist Match' : 'Activity Detected'}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs text-[var(--color-outline)]">
                                    <Clock size={10} />
                                    {alert.timestamp}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {alert.image && (
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-[var(--color-outline-variant)] shrink-0">
                                        <img src={`data:image/jpeg;base64,${alert.image}`} className="w-full h-full object-cover" alt="event" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {alert.detections.map((d, j) => (
                                            <span key={j} className="text-xs font-medium text-[var(--color-on-surface)] px-2 py-0.5 rounded-lg capitalize" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                                                {d.label}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-outline)] truncate">
                                        <MapPin size={10} />
                                        {alert.location?.id || 'Main Site Entrance'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </div>

        {/* Right: Detail View */}
        <div className="flex-1 p-8 overflow-y-auto">
            {selectedAlert ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Incident Detail</h2>
                            <p className="text-xs text-[var(--color-outline)] mt-1">Feed: {selectedAlert.feed_id.toUpperCase()} · {selectedAlert.timestamp}</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}>
                            <AlertTriangle size={14} className="text-amber-500" />
                            Report Issue
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border-4 border-white">
                                {selectedAlert.image ? (
                                    <img src={`data:image/jpeg;base64,${selectedAlert.image}`} className="w-full h-full object-cover" alt="Incident Capture" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-3">
                                        <ImageIcon size={48} />
                                        <span className="text-xs font-black uppercase tracking-widest">Image Unavailable</span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[9px] font-black text-white tracking-[0.2em] border border-white/10">
                                    CAPTURE_RT
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
                                <h3 className="text-xs font-bold text-[var(--color-outline)] border-b border-[var(--color-outline-variant)] pb-3">Security Metadata</h3>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <p className="text-xs text-[var(--color-outline)] mb-1">Time of Incident</p>
                                        <p className="text-sm font-bold text-[var(--color-on-surface)]">{selectedAlert.timestamp}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--color-outline)] mb-1">Match Type</p>
                                        <p className={`text-sm font-bold ${selectedAlert.is_person_search_match ? 'text-[#ba1a1a]' : 'text-[var(--color-primary)]'}`}>
                                            {selectedAlert.is_person_search_match ? 'Watchlist Hit' : 'Regular Detection'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--color-outline)] mb-1">Zone Reference</p>
                                        <p className="text-sm font-bold text-[var(--color-on-surface)]">{selectedAlert.location?.id || 'Alpha-01'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--color-outline)] mb-1">Protocol</p>
                                        <p className="text-sm font-bold text-[#16a34a]">Secure Link</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[var(--color-on-surface)] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <MapPin size={100} />
                                </div>
                                <h3 className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase mb-6">Location Vector</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[var(--color-primary)] border border-white/10">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-white/90">Main Campus North</p>
                                            <p className="text-[9px] text-white/40 font-mono tracking-widest">31.5204Â° N, 74.3587Â° E</p>
                                        </div>
                                    </div>
                                    <div className="h-40 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                                         <p className="text-[9px] font-black text-white/20 tracking-[0.5em] uppercase">Static Map Placeholder</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
                                <h3 className="text-xs font-bold text-[var(--color-outline)] border-b border-[var(--color-outline-variant)] pb-3">Detections</h3>
                                <div className="space-y-2">
                                    {selectedAlert.detections.map((det, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                                                <span className="text-sm font-medium text-[var(--color-on-surface)] capitalize">{det.label}</span>
                                            </div>
                                            <span className="text-xs font-bold text-[var(--color-primary)]">{(det.confidence * 100).toFixed(1)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <div className="p-6 bg-white rounded-full shadow-inner">
                        <Eye size={48} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tighter text-[var(--color-on-surface)]">SELECT AN INCIDENT</h3>
                        <p className="text-xs font-bold text-[var(--color-outline)] tracking-widest uppercase">Select an alert from the left to view deep telemetry</p>
                    </div>
                </div>
            )}
        </div>

        {/* Far Right: Station Profile */}
        <div className="w-[300px] bg-white border-l border-[var(--color-outline-variant)] p-5 overflow-y-auto flex flex-col gap-6">
            <div className="space-y-3 text-center">
                <div className="w-16 h-16 bg-[var(--color-primary)] rounded-2xl mx-auto flex items-center justify-center text-white shadow-[0_4px_16px_rgba(36,128,255,0.2)]">
                    <Shield size={28} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{localStorage.getItem('username')}</h3>
                    <p className="text-xs text-[var(--color-primary)] mt-0.5">Verified Facility Unit</p>
                </div>
            </div>

            <div className="space-y-5">
                <div className="space-y-2">
                    <p className="text-xs font-bold text-[var(--color-outline)]">Facility Details</p>
                    <div className="p-4 rounded-2xl space-y-3" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                        <div className="flex items-start gap-3">
                            <Building size={15} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-[var(--color-on-surface)]">Station Level 01</p>
                                <p className="text-xs text-[var(--color-outline)] mt-0.5">High Priority Response Unit</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 border-t border-[var(--color-outline-variant)] pt-3">
                            <MapPin size={15} className="text-[#ba1a1a] mt-0.5 shrink-0" />
                            <p className="text-xs text-[var(--color-on-surface)] leading-relaxed">
                                {localStorage.getItem('username')?.includes('Police') ? 'Main HQ Central District' : 'Regional Medical Center Zone A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-bold text-[var(--color-outline)]">Active Filters</p>
                    <div className="grid grid-cols-2 gap-2">
                        {["person", "knife", "gun", "smoking", "violence"].map(n => (
                            <div key={n} className="flex items-center justify-between text-xs font-medium text-[var(--color-on-surface)] px-3 py-2 rounded-xl capitalize" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                                {n}
                                <CheckCircle size={12} className="text-[#16a34a] shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 rounded-2xl" style={{ background: 'rgba(186,26,26,0.05)', border: '1px solid rgba(186,26,26,0.15)' }}>
                    <p className="text-xs font-bold text-[#ba1a1a] mb-1">System Override Active</p>
                    <p className="text-xs text-[#ba1a1a] leading-relaxed opacity-80">Notifications are filtered by Master Admin.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationFeed;

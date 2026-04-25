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
    <div className="h-full bg-[#e8ecf0] font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 bg-white border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ba1a1a] rounded-xl shadow-[0_4px_15px_rgba(186,26,26,0.2)]">
                <Shield size={24} color="white" />
            </div>
            <div>
                <p className="text-[9px] tracking-[0.4em] font-black uppercase text-[#74777d]">Organization Hub</p>
                <h1 className="text-2xl font-black tracking-tighter text-[#191c1e]">LIVE ALERT FEED</h1>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="text-right">
                <p className="text-[8px] font-black tracking-widest text-[#74777d] uppercase mb-1">Active Nodes</p>
                <div className="flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 bg-[#16a34a] rounded-full animate-pulse" />
                    <span className="text-xs font-black">SYSTEM_ONLINE</span>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left: Alert List */}
        <div className="w-[450px] border-r border-[rgba(0,0,0,0.06)] bg-white/50 overflow-y-auto custom-scrollbar p-6 space-y-4">
            <AnimatePresence initial={false}>
                {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                        <Bell size={40} />
                        <p className="text-xs font-bold tracking-widest uppercase">Waiting for security events...</p>
                    </div>
                ) : (
                    alerts.map((alert, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setSelectedAlert(alert)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedAlert === alert 
                                ? 'bg-white border-[#2480ff] shadow-lg ring-1 ring-[#2480ff]/20' 
                                : 'bg-white/80 border-[rgba(0,0,0,0.04)] hover:border-[#2480ff]/30 hover:shadow-md'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black tracking-widest uppercase ${
                                    alert.is_person_search_match ? 'bg-[#ba1a1a] text-white' : 'bg-[#2480ff]/10 text-[#2480ff]'
                                }`}>
                                    {alert.is_person_search_match ? 'WATCHLIST_MATCH' : 'ACTIVITY_DETECTED'}
                                </span>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#74777d]">
                                    <Clock size={10} />
                                    {alert.timestamp}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {alert.image && (
                                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-[rgba(0,0,0,0.05)] bg-[#f0f2f5] shrink-0">
                                        <img src={`data:image/jpeg;base64,${alert.image}`} className="w-full h-full object-cover" alt="event" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {alert.detections.map((d, j) => (
                                            <span key={j} className="text-[9px] font-black text-[#191c1e] bg-[#f0f2f5] px-2 py-0.5 rounded-sm uppercase">
                                                {d.label}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#74777d] font-bold truncate">
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
                            <h2 className="text-3xl font-black tracking-tighter text-[#191c1e] uppercase">Incident Detail</h2>
                            <p className="text-xs font-bold text-[#74777d] tracking-widest mt-1">LOG_ID: {selectedAlert.feed_id.toUpperCase()}-{selectedAlert.timestamp}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-xs font-bold hover:bg-[#f8f9fa] transition-colors shadow-sm">
                                <AlertTriangle size={14} className="text-[#ffbb33]" />
                                Report Issue
                            </button>
                        </div>
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

                            <div className="bg-white rounded-2xl p-6 border border-[rgba(0,0,0,0.06)] shadow-sm space-y-4">
                                <h3 className="text-xs font-black tracking-[0.2em] text-[#74777d] uppercase border-b border-[rgba(0,0,0,0.04)] pb-3">Security Metadata</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[8px] font-black text-[#c4c6cc] uppercase mb-1">Time of Incident</p>
                                        <p className="text-sm font-bold text-[#191c1e]">{selectedAlert.timestamp}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-[#c4c6cc] uppercase mb-1">Match Type</p>
                                        <p className={`text-sm font-bold ${selectedAlert.is_person_search_match ? 'text-[#ba1a1a]' : 'text-[#2480ff]'}`}>
                                            {selectedAlert.is_person_search_match ? 'Watchlist Hit' : 'Regular Detection'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-[#c4c6cc] uppercase mb-1">Zone Reference</p>
                                        <p className="text-sm font-bold text-[#191c1e]">{selectedAlert.location?.id || 'Alpha-01'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-[#c4c6cc] uppercase mb-1">Protocol</p>
                                        <p className="text-sm font-bold text-[#16a34a]">SECURE_LINK</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[#191c1e] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <MapPin size={100} />
                                </div>
                                <h3 className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase mb-6">Location Vector</h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#2480ff] border border-white/10">
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

                            <div className="bg-white rounded-2xl p-6 border border-[rgba(0,0,0,0.06)] shadow-sm space-y-4">
                                <h3 className="text-xs font-black tracking-[0.2em] text-[#74777d] uppercase border-b border-[rgba(0,0,0,0.04)] pb-3">Detections List</h3>
                                <div className="space-y-2">
                                    {selectedAlert.detections.map((det, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-[#2480ff]" />
                                                <span className="text-xs font-black text-[#191c1e] uppercase">{det.label}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-[#74777d]">{(det.confidence * 100).toFixed(1)}% CONF</span>
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
                        <Eye size={48} className="text-[#2480ff]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black tracking-tighter text-[#191c1e]">SELECT AN INCIDENT</h3>
                        <p className="text-xs font-bold text-[#74777d] tracking-widest uppercase">Select an alert from the left to view deep telemetry</p>
                    </div>
                </div>
            )}
        </div>

        {/* Far Right: Station Profile */}
        <div className="w-[320px] bg-white p-6 overflow-y-auto flex flex-col gap-8 shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
            <div className="space-y-4 text-center">
                <div className="w-20 h-20 bg-[#191c1e] rounded-2xl mx-auto flex items-center justify-center text-white border-4 border-[#e8ecf0] shadow-xl">
                    <Shield size={40} />
                </div>
                <div>
                    <h3 className="text-sm font-black tracking-widest text-[#191c1e] uppercase">{localStorage.getItem('username')}</h3>
                    <p className="text-[9px] font-bold text-[#2480ff] tracking-[0.2em] mt-1">VERIFIED_FACILITY_UNIT</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-[#c4c6cc] uppercase tracking-widest">Facility Details</p>
                    <div className="p-4 bg-[#f8f9fa] border border-[rgba(0,0,0,0.04)] rounded-xl space-y-3">
                        <div className="flex items-start gap-3">
                            <Building size={16} className="text-[#2480ff] mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black text-[#191c1e]">STATION_LEVEL_01</p>
                                <p className="text-[9px] text-[#74777d] mt-0.5">High Priority Response Unit</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 border-t border-[rgba(0,0,0,0.06)] pt-3">
                            <MapPin size={16} className="text-[#ff4466] mt-0.5" />
                            <p className="text-[9px] font-bold text-[#191c1e] leading-relaxed">
                                {localStorage.getItem('username')?.includes('Police') ? 'Main HQ Central District' : 'Regional Medical Center Zone A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[9px] font-black text-[#c4c6cc] uppercase tracking-widest">Active Filters</p>
                    <div className="grid grid-cols-2 gap-2">
                        {["person", "knife", "gun", "smoking", "violence"].map(n => (
                            <div key={n} className="flex items-center justify-between text-[10px] font-black text-[#191c1e] px-3 py-2 bg-[#f8f9fa] rounded-lg border border-[rgba(0,0,0,0.03)] uppercase">
                                {n}
                                <CheckCircle size={12} className="text-[#16a34a]" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-[#ba1a1a]/5 border border-[#ba1a1a]/10 rounded-xl space-y-2">
                    <p className="text-[9px] font-black text-[#ba1a1a] uppercase tracking-widest">System Override</p>
                    <p className="text-[10px] font-bold text-[#ba1a1a] leading-relaxed">Notifications are currently being filtered by Master Admin.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationFeed;

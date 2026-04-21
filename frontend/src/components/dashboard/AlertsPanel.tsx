import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, MapPin, Crosshair, X, Maximize2 } from 'lucide-react';
import type { Alert } from '../../types/dashboard';

interface AlertsPanelProps {
  alerts: Alert[];
  watchlist: string[];
  setIsAddingTarget: (v: boolean) => void;
  setMapAlert: (alert: Alert | null) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  watchlist,
  setIsAddingTarget,
  setMapAlert,
  scrollRef,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <aside className="w-[340px] bg-[#070809] border-l border-[rgba(176,198,255,0.1)] flex flex-col shrink-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(176,198,255,0.1)] bg-[rgba(6,6,8,0.9)] flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-[11px] font-bold tracking-[0.25em]">ALERTS_BUFFER</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[8px] opacity-25 uppercase">Incidents</p>
            <div className="h-[2px] w-2 bg-[#b0c6ff]/20" />
            <button
              onClick={() => setIsAddingTarget(true)}
              className="text-[8px] text-[#b0c6ff] hover:underline hover:opacity-100 opacity-60 font-bold tracking-widest"
            >
              OPEN_WATCHLIST ({watchlist.length})
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <span className="text-[9px] bg-[rgba(176,198,255,0.1)] border border-[rgba(176,198,255,0.2)] px-1.5 py-0.5 font-bold">
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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden border group"
                style={alert.is_person_search_match
                  ? { borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.04)' }
                  : { borderColor: 'rgba(176,198,255,0.1)', background: 'rgba(12,13,16,0.8)' }
                }
              >
                {/* ID badge */}
                <div
                  className="absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold flex items-center gap-1.5"
                  style={alert.is_person_search_match
                    ? { background: '#ff4466', color: '#fff' }
                    : { background: 'rgba(176,198,255,0.15)', color: '#b0c6ff' }
                  }
                >
                  {alert.is_person_search_match && <Target className="w-2.5 h-2.5" />}
                  ID_{index.toString().padStart(3, '0')}
                </div>

                {/* Timestamp */}
                <div className="absolute left-2 top-2 text-[7px] opacity-30 rotate-180 [writing-mode:vertical-lr]">
                  {alert.timestamp}_UTC
                </div>

                <div className="p-2.5 pl-7">
                  {/* Image */}
                  <div 
                    className="relative mb-2.5 aspect-[4/3] overflow-hidden cursor-pointer group/img"
                    onClick={() => setSelectedImage(`data:image/jpeg;base64,${alert.image}`)}
                  >
                    <img
                      src={`data:image/jpeg;base64,${alert.image}`}
                      alt="INCIDENT"
                      className={`w-full h-full object-cover transition-all duration-500 ${alert.is_person_search_match ? 'brightness-125 saturate-150' : 'grayscale group-hover:grayscale-0'} group-hover/img:scale-105`}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-6 h-6 text-[#b0c6ff] drop-shadow-[0_0_8px_rgba(176,198,255,0.5)]" />
                    </div>
                    {alert.is_person_search_match && (
                      <>
                        <div className="absolute inset-0 bg-red-600/15 mix-blend-overlay animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Crosshair className="w-10 h-10 text-red-400 animate-ping opacity-50" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Labels */}
                  <div
                    className="flex justify-between items-center bg-[rgba(0,0,0,0.3)] px-2 py-1.5 border-l-2 mb-2"
                    style={{ borderColor: alert.is_person_search_match ? '#ff4466' : '#b0c6ff' }}
                  >
                    <span className="text-[9px] font-bold opacity-50">THREAT:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {alert.is_person_search_match && (
                        <span className="text-[8px] px-1.5 py-0.5 font-bold bg-red-600 text-white">TARGET_Î©</span>
                      )}
                      {alert.detections.map((d, i) => (
                        <span key={i} className="text-[8px] px-1.5 py-0.5 border border-[rgba(176,198,255,0.2)] text-[#b0c6ff]">
                          {d.label.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {alert.is_person_search_match && (
                    <div className="bg-red-950/20 border border-red-800/40 p-2 mb-2">
                      <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest mb-1 italic">
                        {typeof alert.is_person_search_match === 'string' ? alert.is_person_search_match : 'TARGET_LOCATED'}
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
                        className="flex items-center gap-1.5 px-2 py-1 bg-[rgba(176,198,255,0.05)] border border-[rgba(176,198,255,0.2)] text-[#b0c6ff] hover:bg-[#b0c6ff] hover:text-[#000] transition-all duration-300"
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

      {/* Image Modal Overlay */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-[95vw] max-h-[92vh] bg-[#070809] border border-[#b0c6ff]/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] group/modal overflow-hidden flex flex-col"
            >
              {/* Tactical Corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#b0c6ff]/50 z-10 pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#b0c6ff]/50 z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#b0c6ff]/50 z-10 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#b0c6ff]/50 z-10 pointer-events-none" />

              {/* Close Button UI */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-20 opacity-0 group-hover/modal:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.4em] text-[#b0c6ff] uppercase">Secure_Incident_View_Alpha</span>
                </div>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 bg-black/40 border border-[#b0c6ff]/20 hover:bg-[#b0c6ff] hover:text-black transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
                <img
                  src={selectedImage}
                  alt="ENLARGED_INCIDENT"
                  className="max-w-full max-h-full object-contain select-none shadow-[0_0_60px_rgba(0,0,0,0.8)]"
                />
              </div>

              {/* Status Bar */}
              <div className="px-6 py-3 bg-black/80 backdrop-blur-md border-t border-[#b0c6ff]/10 flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-sans text-[#b0c6ff]/40">UID:</span>
                    <span className="text-[9px] font-sans text-[#b0c6ff] font-bold tracking-tight">INF-{Math.random().toString(36).substring(7).toUpperCase()}-SRV</span>
                  </div>
                  <div className="h-3 w-[1px] bg-[#b0c6ff]/10" />
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b0c6ff] animate-pulse" />
                    <span className="text-[9px] font-sans text-[#b0c6ff]/80 uppercase tracking-widest">Live_Verification_Active</span>
                  </div>
                </div>
                <div className="text-[9px] font-sans text-[#b0c6ff]/40 uppercase tracking-tighter">
                  System: SmartSurv Core // Buffer: 1024KB
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};

export default AlertsPanel;


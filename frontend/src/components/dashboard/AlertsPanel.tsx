import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, MapPin, Crosshair, MicOff } from 'lucide-react';
import type { Alert } from '../../types/dashboard';

interface AlertsPanelProps {
  alerts: Alert[];
  watchlist: string[];
  setIsAddingTarget: (v: boolean) => void;
  setMapAlert: (alert: Alert | null) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  dismissSpeech: (label: string | null) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  watchlist,
  setIsAddingTarget,
  setMapAlert,
  scrollRef,
  dismissSpeech,
}) => {
  return (
    <aside className="w-[340px] bg-[#070809] border-l border-[rgba(0,255,133,0.1)] flex flex-col shrink-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(0,255,133,0.1)] bg-[rgba(6,6,8,0.9)] flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-[11px] font-bold tracking-[0.25em]">ALERTS_BUFFER</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[8px] opacity-25 uppercase">Incidents</p>
            <div className="h-[2px] w-2 bg-[#00ff85]/20" />
            <button
              onClick={() => setIsAddingTarget(true)}
              className="text-[8px] text-[#00ff85] hover:underline hover:opacity-100 opacity-60 font-bold tracking-widest"
            >
              OPEN_WATCHLIST ({watchlist.length})
            </button>
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
              <motion.div
                key={index}
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
                <div
                  className="absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold flex items-center gap-1.5"
                  style={alert.is_person_search_match
                    ? { background: '#ff4466', color: '#fff' }
                    : { background: 'rgba(0,255,133,0.15)', color: '#00ff85' }
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
                  <div
                    className="flex justify-between items-center bg-[rgba(0,0,0,0.3)] px-2 py-1.5 border-l-2 mb-2"
                    style={{ borderColor: alert.is_person_search_match ? '#ff4466' : '#00ff85' }}
                  >
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
                        className="flex items-center gap-1.5 px-2 py-1 bg-[rgba(0,255,133,0.05)] border border-[rgba(0,255,133,0.2)] text-[#00ff85] hover:bg-[#00ff85] hover:text-[#000] transition-all duration-300"
                      >
                        <MapPin className="w-3 h-3" />
                        MAP
                      </button>
                    )}
                  </div>

                  {/* Dismiss Voice button — re-arms the speak-once lock for these labels */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const labelKey = alert.is_person_search_match
                        ? 'watchlist_target'
                        : [...alert.detections.map(d => d.label)].sort().join('|');
                      dismissSpeech(labelKey);
                    }}
                    title="Re-arm voice alert — system will announce again on next detection"
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 text-[7px] font-bold tracking-widest border border-[rgba(0,255,133,0.15)] text-[#00ff85]/40 hover:text-[#00ff85] hover:border-[rgba(0,255,133,0.4)] hover:bg-[rgba(0,255,133,0.04)] transition-all duration-200"
                  >
                    <MicOff className="w-2.5 h-2.5" />
                    VOICE_DONE · RE-ARM
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </aside>
  );
};

export default AlertsPanel;

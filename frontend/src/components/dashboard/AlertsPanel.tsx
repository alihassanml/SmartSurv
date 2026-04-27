import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Target, MapPin, Crosshair, X, Maximize2, Trash2, Check, Square } from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
  const { deleteAlerts } = useApp();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  return (
    <aside className="w-[340px] flex flex-col shrink-0"
      style={{ background: 'var(--color-surface)', borderLeft: '1px solid rgba(0,0,0,0.1)', boxShadow: '-2px 0 12px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div className="px-5 py-4 flex justify-between items-center shrink-0"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'var(--color-surface-container-low)' }}>
        <div>
          <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--color-on-surface)' }}>Alerts</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-[8px] uppercase" style={{ color: 'var(--color-outline)' }}>Incidents</p>
            <div className="h-[2px] w-2 rounded" style={{ background: 'rgba(0,0,0,0.1)' }} />
            <button
              onClick={() => setIsAddingTarget(true)}
              className="text-[8px] font-bold tracking-widest hover:underline transition-opacity"
              style={{ color: 'var(--color-primary)' }}
            >
              Watchlist ({watchlist.length})
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={() => { deleteAlerts(selectedIds); setSelectedIds([]); setIsSelectionMode(false); }}
                  className="p-1.5 transition-all rounded hover:bg-red-50 text-red-600"
                  style={{ border: '1px solid rgba(186,26,26,0.2)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                className="p-1.5 transition-all rounded hover:bg-gray-100 text-gray-500"
                style={{ border: '1px solid rgba(0,0,0,0.1)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              {alerts.length > 0 && (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="p-1.5 transition-all rounded hover:bg-blue-50 text-blue-600"
                  style={{ border: '1px solid rgba(36,128,255,0.2)' }}
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              )}
              {alerts.length > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(36,128,255,0.1)', border: '1px solid rgba(36,128,255,0.2)', color: 'var(--color-primary)' }}>
                  {alerts.length}
                </span>
              )}
            </>
          )}
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>

      {/* Alerts list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3" style={{ opacity: 0.3 }}>
            <Shield className="w-10 h-10" style={{ color: 'var(--color-outline)' }} />
            <span className="text-[9px] tracking-[0.3em]" style={{ color: 'var(--color-outline)' }}>NO THREATS DETECTED</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {alerts.map((alert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative overflow-hidden group rounded-lg"
                style={alert.is_person_search_match
                  ? { borderLeft: '3px solid #ba1a1a', background: 'rgba(186,26,26,0.04)', border: '1px solid rgba(186,26,26,0.2)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                  : { border: '1px solid rgba(0,0,0,0.1)', background: 'var(--color-surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }
                }
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds(prev => prev.includes(alert.id) ? prev.filter(id => id !== alert.id) : [...prev, alert.id]);
                    }}
                    className="absolute top-2 left-2 z-20 w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all"
                    style={{ 
                      background: selectedIds.includes(alert.id) ? 'var(--color-primary)' : 'white',
                      border: '1px solid rgba(0,0,0,0.1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {selectedIds.includes(alert.id) && <Check className="w-3 text-white" />}
                  </div>
                )}

                {/* ID badge */}
                <div
                  className="absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold flex items-center gap-1.5 z-10"
                  style={alert.is_person_search_match
                    ? { background: '#ba1a1a', color: '#fff', borderRadius: '0 0.5rem 0 0.25rem' }
                    : { background: 'var(--color-surface-container-low)', color: 'var(--color-outline)', borderRadius: '0 0.5rem 0 0.25rem' }
                  }
                >
                  {alert.is_person_search_match && <Target className="w-2.5 h-2.5" />}
                  #{index.toString().padStart(3, '0')}
                </div>

                {/* Timestamp */}
                <div className="absolute left-2 top-2 text-[7px] rotate-180 [writing-mode:vertical-lr]"
                  style={{ color: 'var(--color-outline-variant)' }}>
                  {alert.timestamp}
                </div>

                <div className="p-2.5 pl-7">
                  {/* Image */}
                  <div
                    className="relative mb-2.5 aspect-[4/3] overflow-hidden cursor-pointer group/img rounded"
                    onClick={() => setSelectedImage(`data:image/jpeg;base64,${alert.image}`)}
                  >
                    <img
                      src={`data:image/jpeg;base64,${alert.image}`}
                      alt="Incident"
                      className={`w-full h-full object-cover transition-all duration-500 ${alert.is_person_search_match ? 'brightness-110 saturate-125' : 'grayscale-[0.3] group-hover/img:grayscale-0'} group-hover/img:scale-105`}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                    {alert.is_person_search_match && (
                      <>
                        <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Crosshair className="w-10 h-10 text-red-500 animate-ping opacity-40" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Labels */}
                  <div
                    className="flex justify-between items-center px-2 py-1.5 mb-2 rounded"
                    style={{
                      borderLeft: `2px solid ${alert.is_person_search_match ? '#ba1a1a' : 'var(--color-primary)'}`,
                      background: 'var(--color-surface-container-low)',
                    }}
                  >
                    <span className="text-[9px] font-bold" style={{ color: 'var(--color-outline)' }}>Threat:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {alert.is_person_search_match && (
                        <span className="text-[8px] px-1.5 py-0.5 font-bold rounded"
                          style={{ background: '#ba1a1a', color: '#ffffff' }}>TARGET</span>
                      )}
                      {alert.detections.map((d, i) => (
                        <span key={i} className="text-[8px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ border: '1px solid rgba(36,128,255,0.2)', color: 'var(--color-primary)', background: 'rgba(36,128,255,0.06)' }}>
                          {d.label.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {alert.is_person_search_match && (
                    <div className="px-2 py-1.5 mb-2 rounded"
                      style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)' }}>
                      <p className="text-[8px] font-bold uppercase tracking-widest mb-1"
                        style={{ color: '#ba1a1a' }}>
                        {typeof alert.is_person_search_match === 'string' ? alert.is_person_search_match : 'TARGET LOCATED'}
                      </p>
                      <p className="text-[7px] leading-tight" style={{ color: 'var(--color-outline)' }}>
                        Visual verification required. Threat active in current sector.
                      </p>
                    </div>
                  )}

                  {/* Confidence & Location */}
                  <div className="flex justify-between items-center text-[8px] font-bold">
                    <div className="flex flex-col" style={{ color: 'var(--color-outline-variant)' }}>
                      <span>Conf: {(Math.max(...(alert.detections.map(d => d.confidence) || [0]), 0) * 100).toFixed(1)}%</span>
                    </div>

                    {alert.location && (
                      <button
                        onClick={() => setMapAlert(alert)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-300"
                        style={{ background: 'rgba(36,128,255,0.08)', border: '1px solid rgba(36,128,255,0.2)', color: 'var(--color-primary)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#ffffff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(36,128,255,0.08)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                      >
                        <MapPin className="w-3 h-3" />
                        Map
                      </button>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); deleteAlerts([alert.id]); }}
                      className="ml-auto p-1.5 transition-all opacity-0 group-hover:opacity-100 rounded hover:bg-red-50 text-red-500"
                      style={{ border: '1px solid transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(186,26,26,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
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
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-[95vw] max-h-[92vh] overflow-hidden flex flex-col rounded-xl"
              style={{ background: 'var(--color-surface)', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 z-10 pointer-events-none" style={{ borderColor: 'rgba(36,128,255,0.4)' }} />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 z-10 pointer-events-none" style={{ borderColor: 'rgba(36,128,255,0.4)' }} />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 z-10 pointer-events-none" style={{ borderColor: 'rgba(36,128,255,0.4)' }} />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 z-10 pointer-events-none" style={{ borderColor: 'rgba(36,128,255,0.4)' }} />

              {/* Close Button */}
              <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-6 z-20"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)' }}>
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-on-surface)' }}>Incident View</span>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 transition-all rounded"
                  style={{ background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-outline)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ba1a1a'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'var(--color-outline)'; }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex items-center justify-center p-4 pt-10">
                <img
                  src={selectedImage}
                  alt="Incident Detail"
                  className="max-w-full max-h-full object-contain select-none rounded"
                />
              </div>

              {/* Status Bar */}
              <div className="px-6 py-3 flex items-center justify-between z-20 shrink-0"
                style={{ background: 'var(--color-surface-container-low)', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-red-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface)' }}>SmartSurv</span>
                </div>
                <div className="text-[9px]" style={{ color: 'var(--color-outline)' }}>
                  Secure incident view
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


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Power, Eye, EyeOff, Activity, Video,
  LayoutGrid, X, Loader2, Maximize2, Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import CameraStream from '../../components/dashboard/CameraStream';
import AlertsPanel from '../../components/dashboard/AlertsPanel';
import PersonsPanel from '../../components/dashboard/PersonsPanel';
import type { Alert } from '../../types/dashboard';
import type { UrlCamera } from '../../context/AppContext';


function LocalCameraCard({
  cameraActive, isCameraToggling, toggleCamera,
  localCameraVisible, toggleLocalCameraVisibility,
  localFeedId, onMaximize,
}: {
  cameraActive: boolean;
  isCameraToggling: boolean;
  toggleCamera: () => void;
  localCameraVisible: boolean;
  toggleLocalCameraVisibility: () => void;
  localFeedId: string;
  onMaximize: (name: string, feedId: string) => void;
}) {
  const [streamLoaded, setStreamLoaded] = useState(false);
  const isStreaming = cameraActive && localCameraVisible;

  useEffect(() => {
    if (!isStreaming) setStreamLoaded(false);
  }, [isStreaming]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => isStreaming && onMaximize('LOCAL CAMERA', localFeedId)}
      className="group relative"
      style={{
        aspectRatio: '16/9',
        border: isStreaming
          ? '1px solid rgba(0,0,0,0.08)'
          : '1px dashed var(--color-outline-variant)',
        boxShadow: isStreaming 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 20px -10px rgba(0, 0, 0, 0.08)' 
          : '0 4px 10px rgba(0,0,0,0.03)',
        opacity: isStreaming ? 1 : 0.7,
        cursor: isStreaming ? 'pointer' : 'default',
        background: 'var(--color-surface)',
        overflow: 'hidden',
        borderRadius: '1.25rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Offline placeholder */}
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <EyeOff size={28} style={{ color: 'var(--color-outline-variant)' }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-on-surface-variant)' }}>Sector Offline</p>
          <p className="text-[9px] font-bold" style={{ color: 'var(--color-outline-variant)' }}>LOCAL CAMERA</p>
        </div>
      )}

      {/* WebRTC stream */}
      {isStreaming && (
        <CameraStream
          feedId={localFeedId}
          active={true}
          onLoaded={() => setStreamLoaded(true)}
        />
      )}

      {/* Name + LIVE badge */}
      <div className="absolute top-3 left-3 z-10 flex gap-2 items-center">
        {isStreaming && streamLoaded && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[0.6rem] font-bold rounded-full"
            style={{ background: 'rgba(36,128,255,0.85)', color: '#ffffff', backdropFilter: 'blur(8px)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ffffff' }} />
            LIVE
          </span>
        )}
        <span className="px-2.5 py-1 text-[0.6rem] font-black uppercase rounded-full border border-blue-100 shadow-sm"
          style={{ background: 'rgba(239, 246, 255, 0.9)', color: 'rgba(37, 99, 235, 1)', backdropFilter: 'blur(10px)' }}>
          LOCAL CAMERA
        </span>
      </div>

      {/* Top Right Controls (Floating Icons) */}
      <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={e => { e.stopPropagation(); toggleLocalCameraVisibility(); }}
          className="p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.9)', color: '#000000' }}>
          {localCameraVisible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); toggleCamera(); }}
          disabled={isCameraToggling}
          className="p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-110 active:scale-95"
          style={cameraActive
            ? { background: 'rgba(220,38,38,0.9)', color: '#ffffff' }
            : { background: 'rgba(37,99,235,0.9)', color: '#ffffff' }
          }>
          {isCameraToggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
        </button>
      </div>

      {/* Full View Button (Bottom Center) */}
      {isStreaming && (
        <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <button
            onClick={e => { e.stopPropagation(); onMaximize('LOCAL CAMERA', localFeedId); }}
            className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl pointer-events-auto hover:bg-blue-600 hover:text-white transition-all">
            Full View
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   URL CAMERA CARD
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function UrlCameraCard({
  cam, onToggle, onToggleVisibility, onMaximize, toggling,
}: {
  cam: UrlCamera;
  onToggle: (id: number) => void;
  onToggleVisibility: (id: number) => void;
  onMaximize: (name: string, feedId: string) => void;
  toggling: boolean;
}) {
  const [streamLoaded, setStreamLoaded] = useState(false);
  const isStreaming = cam.active && cam.visible;

  useEffect(() => {
    if (!isStreaming) setStreamLoaded(false);
  }, [isStreaming]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => isStreaming && onMaximize(cam.name, `url-${cam.id}`)}
      className="group relative"
      style={{
        aspectRatio: '16/9',
        border: isStreaming
          ? '1px solid rgba(0,0,0,0.08)'
          : '1px dashed var(--color-outline-variant)',
        boxShadow: isStreaming 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 20px -10px rgba(0, 0, 0, 0.08)' 
          : '0 4px 10px rgba(0,0,0,0.03)',
        opacity: isStreaming ? 1 : 0.7,
        cursor: isStreaming ? 'pointer' : 'default',
        background: 'var(--color-surface)',
        overflow: 'hidden',
        borderRadius: '1.25rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Offline placeholder */}
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <EyeOff size={28} style={{ color: 'var(--color-outline-variant)' }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--color-on-surface-variant)' }}>Sector Offline</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: 'var(--color-outline-variant)' }}>{cam.name}</p>
        </div>
      )}

      {/* WebRTC stream */}
      {isStreaming && (
        <CameraStream
          feedId={`url-${cam.id}`}
          active={true}
          onLoaded={() => setStreamLoaded(true)}
        />
      )}

      {/* Name + LIVE badge */}
      <div className="absolute top-3 left-3 z-10 flex gap-2 items-center">
        {isStreaming && streamLoaded && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[0.6rem] font-bold rounded-full"
            style={{ background: 'rgba(36,128,255,0.85)', color: '#ffffff', backdropFilter: 'blur(8px)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ffffff' }} />
            LIVE
          </span>
        )}
        <span className="px-2.5 py-1 text-[0.6rem] font-black uppercase rounded-full border border-blue-100 shadow-sm"
          style={{ background: 'rgba(239, 246, 255, 0.9)', color: 'rgba(37, 99, 235, 1)', backdropFilter: 'blur(10px)' }}>
          {cam.name}
        </span>
      </div>

      {/* Top Right Controls (Floating Icons) */}
      <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <button
          onClick={e => { e.stopPropagation(); onToggleVisibility(cam.id); }}
          className="p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{ background: 'rgba(255,255,255,0.9)', color: '#000000' }}>
          {cam.visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onToggle(cam.id); }}
          disabled={toggling}
          className="p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-110 active:scale-95"
          style={cam.active
            ? { background: 'rgba(220,38,38,0.9)', color: '#ffffff' }
            : { background: 'rgba(37,99,235,0.9)', color: '#ffffff' }
          }>
          {toggling ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
        </button>
      </div>

      {/* Full View Button (Bottom Center) */}
      {isStreaming && (
        <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <button
            onClick={e => { e.stopPropagation(); onMaximize(cam.name, `url-${cam.id}`); }}
            className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl pointer-events-auto hover:bg-blue-600 hover:text-white transition-all">
            Full View
          </button>
        </div>
      )}
    </motion.div>
  );
}



const Monitor: React.FC = () => {
  const {
    alerts, detectedPersons, setDetectedPersons, selectedPerson, setSelectedPerson,
    cameraActive, isCameraToggling, toggleCamera,
    activeFeeds,
    watchlist,
    privacyMode, personLogEnabled,
    focusedPersonId, handleSetFocus, focusedPersonVisible,
    semanticQuery, semanticResults, semanticLoading, handleSemanticSearch,
    urlCameras, toggleUrlCamera, toggleUrlCameraVisibility,
    localCameraVisible, toggleLocalCameraVisibility,
    systemLatency,
    cameraMode, handleModeChange,
  } = useApp();

  const [maximizedFeed, setMaximizedFeed] = useState<{ name: string; feedId: string } | null>(null);
  const [togglingIds, setTogglingIds] = useState<number[]>([]);
  const [mapAlert, setMapAlert] = useState<Alert | null>(null);

  // Derive local camera state from activeFeeds
  const localFeeds = activeFeeds.filter(f => !f.startsWith('url-'));
  const localCameraIsOn = localFeeds.length > 0;
  const localFeedId = localFeeds[0] || '0';

  // KPI counts
  const totalNodes = urlCameras.length + 1; // +1 for local camera
  const activeNodes = urlCameras.filter(c => c.active).length + (localCameraIsOn ? 1 : 0);
  const liveFeedCount = urlCameras.filter(c => c.active && c.visible).length + (localCameraIsOn && localCameraVisible ? 1 : 0);
  const offlineCount = totalNodes - activeNodes;

  const handleUrlToggle = async (id: number) => {
    setTogglingIds(p => [...p, id]);
    await toggleUrlCamera(id);
    setTogglingIds(p => p.filter(x => x !== id));
  };

  const setIsAddingTarget = (_v: boolean) => {};

  return (
    <div className="flex h-full overflow-hidden">

      {/* â”€â”€â”€ MAP MODAL â”€â”€â”€ */}
      <AnimatePresence>
        {mapAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl flex flex-col"
              style={{ background: 'var(--color-surface)', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', borderRadius: '0.5rem' }}>
              <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: 'var(--color-surface-container-low)', borderRadius: '0.5rem 0.5rem 0 0' }}>
                <div>
                  <h3 className="text-[14px] font-bold tracking-wide" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope', sans-serif" }}>Location</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-outline)' }}>ID: {mapAlert.location?.id}</p>
                </div>
                <button onClick={() => setMapAlert(null)} className="p-2 transition-all" style={{ color: 'var(--color-outline)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex h-[400px]">
                <div className="flex-1 relative">
                  <iframe width="100%" height="100%" frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${mapAlert.location?.lat},${mapAlert.location?.lon}&z=14&output=embed`}
                    allowFullScreen />
                </div>
                <div className="w-64 p-5 flex flex-col gap-4" style={{ borderLeft: '1px solid rgba(0,0,0,0.07)', background: 'var(--color-surface)' }}>
                  <div>
                    <p className="text-[9px] font-semibold tracking-widest mb-1 uppercase" style={{ color: 'var(--color-outline)' }}>Coordinates</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{mapAlert.location?.lat}Â° N</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{mapAlert.location?.lon}Â° E</p>
                  </div>
                  <div className="mt-auto">
                    <button onClick={() => window.open(mapAlert.location?.maps, '_blank')}
                      className="w-full py-2.5 font-bold text-[10px] tracking-widest uppercase"
                      style={{ background: 'var(--color-primary)', color: '#ffffff', borderRadius: '0.375rem' }}>
                      Open in Maps
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {maximizedFeed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMaximizedFeed(null)}
              className="absolute inset-0 bg-white/70 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full h-full max-w-7xl overflow-hidden z-[101]"
              style={{ 
                maxHeight: '85vh', 
                background: '#f8fafc', 
                border: '1px solid var(--color-outline-variant)', 
                borderRadius: '1.5rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.1)' 
              }}
            >
              {/* Header overlay */}
              <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)' }}>
                <div className="px-6 py-4 pointer-events-auto"
                  style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #f1f5f9', backdropFilter: 'blur(16px)', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 text-[#2563eb] rounded-xl">
                      <Maximize2 size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-[0.15em]" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope',sans-serif" }}>{maximizedFeed.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#16a34a' }}>Channel Live & Active</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setMaximizedFeed(null)}
                  className="p-4 transition-all pointer-events-auto hover:scale-110 active:scale-95"
                  style={{ background: 'white', border: '1px solid #f1f5f9', color: 'var(--color-outline)', borderRadius: '1rem', backdropFilter: 'blur(12px)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-outline)'; }}>
                  <X size={24} />
                </button>
              </div>

              {/* Corner decorations (Modernized) */}
              <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
                {['top-8 left-8 border-t-2 border-l-2', 'top-8 right-8 border-t-2 border-r-2', 'bottom-8 left-8 border-b-2 border-l-2', 'bottom-8 right-8 border-b-2 border-r-2'].map((cls, i) => (
                  <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: '#2563eb', borderRadius: i === 0 ? '8px 0 0 0' : i === 1 ? '0 8px 0 0' : i === 2 ? '0 0 0 8px' : '0 0 8px 0' }} />
                ))}
              </div>

              {/* Video */}
              <div className="w-full h-full flex items-center justify-center bg-slate-900/5">
                <div className="w-full h-full relative">
                  <CameraStream feedId={maximizedFeed.feedId} active={true} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {personLogEnabled && (
        <AnimatePresence>
          {selectedPerson && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="fixed inset-0 z-[500] bg-white/80 backdrop-blur-2xl flex items-center justify-center p-8">
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-sm overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
              >
                {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 ${c} z-10`} style={{ borderColor: 'rgba(36,128,255,0.4)' }} />
                ))}
                <button onClick={() => setSelectedPerson(null)}
                  className="absolute top-3 right-3 z-20 p-1.5 transition-all"
                  style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-outline)', borderRadius: '0.25rem' }}>
                  <X className="w-4 h-4" />
                </button>
                <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                  <img src={`data:image/jpeg;base64,${selectedPerson.face}`} alt={selectedPerson.person_id} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 top-0 h-[2px] animate-scanner" style={{ background: 'rgba(36,128,255,0.6)' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold tracking-widest rounded"
                    style={selectedPerson.status === 'NEW' ? { background: 'var(--color-primary)', color: '#ffffff' } : { background: '#47607e', color: '#ffffff' }}>
                    {selectedPerson.status}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.2em] mb-1 uppercase" style={{ color: 'var(--color-outline)' }}>Subject ID</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope', sans-serif" }}>{selectedPerson.person_id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded" style={{ background: 'var(--color-surface-container-low)', border: '1px solid rgba(0,0,0,0.07)' }}>
                      <p className="text-[8px] font-semibold tracking-widest mb-1 uppercase" style={{ color: 'var(--color-outline)' }}>Feed</p>
                      <p className="text-[11px] font-bold" style={{ color: 'var(--color-primary)' }}>{selectedPerson.feed_id.toUpperCase()}</p>
                    </div>
                    <div className="p-3 rounded" style={{ background: 'var(--color-surface-container-low)', border: '1px solid rgba(0,0,0,0.07)' }}>
                      <p className="text-[8px] font-semibold tracking-widest mb-1 uppercase" style={{ color: 'var(--color-outline)' }}>Detected</p>
                      <p className="text-[11px] font-bold" style={{ color: 'var(--color-on-surface)' }}>{selectedPerson.timestamp}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSetFocus(focusedPersonId === selectedPerson.person_id ? null : selectedPerson.person_id)}
                    className="w-full py-3 font-bold text-[10px] tracking-[0.15em] transition-all flex items-center justify-center gap-2 rounded"
                    style={focusedPersonId === selectedPerson.person_id
                      ? { background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.25)', color: '#ba1a1a' }
                      : { background: 'rgba(36,128,255,0.06)', border: '1px solid rgba(36,128,255,0.25)', color: 'var(--color-primary)' }}>
                    <Target className="w-3.5 h-3.5" />
                    {focusedPersonId === selectedPerson.person_id ? 'Release Focus' : 'Set Focus'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ——— LEFT: CAMERA GRID ——— */}
      <section className="flex-1 overflow-y-auto" style={{ background: 'var(--color-background)' }}>
        <div className="p-6 space-y-6 pb-12">

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Nodes',      value: totalNodes,    color: 'var(--color-on-surface)', border: 'var(--color-outline-variant)', bg: 'rgba(100, 116, 139, 0.05)' },
              { label: 'Active Readiness', value: activeNodes,   color: '#2563eb', border: 'rgba(37, 99, 235, 0.3)', bg: 'rgba(37, 99, 235, 0.05)' },
              { label: 'Feed Live',        value: liveFeedCount, color: '#16a34a', border: 'rgba(22, 163, 74, 0.3)', bg: 'rgba(22, 163, 74, 0.05)' },
              { label: 'Node Offline',     value: offlineCount,  color: 'var(--color-outline)', border: 'var(--color-outline-variant)', bg: 'rgba(241, 245, 249, 0.8)' },
            ].map(kpi => (
              <div key={kpi.label} className="p-6 flex flex-col justify-between relative overflow-hidden rounded-[1.25rem] transition-all hover:shadow-md h-32"
                style={{ 
                  background: kpi.bg, 
                  border: `1px solid ${kpi.border}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
                }}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--color-outline)', opacity: 0.8 }}>{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-black tracking-tighter" style={{ color: kpi.color, fontFamily: "'Manrope',sans-serif" }}>
                    {kpi.value.toString().padStart(2, '0')}
                  </p>
                </div>
                {kpi.label === 'Feed Live' && (
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                    <span className="text-[9px] font-black tracking-widest" style={{ color: '#16a34a' }}>STREAMING</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Header bar ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-[1.25rem]"
            style={{ background: 'white', border: '1px solid var(--color-outline-variant)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9', color: '#2563eb' }}>
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.15em]" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope',sans-serif" }}>
                  Camera Grid
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--color-on-surface-variant)' }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2563eb' }} />
                    {activeNodes} Nodes Online
                    </p>
                    {systemLatency !== null && (
                        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#16a34a' }}>
                        | LATENCY: {Number(systemLatency).toFixed(1)}ms
                        </p>
                    )}
                </div>
              </div>
            </div>

            {/* Detection Mode Selector */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              {(['detection', 'search', 'both'] as const).map((key) => {
                const label = key === 'detection' ? 'DETECT' : key === 'search' ? 'SEARCH' : 'HYBRID';
                const active = cameraMode === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleModeChange(key)}
                    className="relative px-6 py-2.5 text-[10px] font-black tracking-[0.1em] transition-all duration-300 rounded-xl"
                    style={{ color: active ? '#ffffff' : 'var(--color-on-surface-variant)' }}
                  >
                    {active && (
                      <motion.div
                        layoutId="mode-pill"
                        className="absolute inset-0 z-0 bg-[#2563eb] shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
                        style={{ borderRadius: '0.75rem' }}
                      />
                    )}
                    <span className="relative z-10">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* â”€â”€ Camera Card Grid â”€â”€ */}
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {/* Local camera card always shown */}
              <LocalCameraCard
                key="local-camera"
                cameraActive={localCameraIsOn}
                isCameraToggling={isCameraToggling}
                toggleCamera={toggleCamera}
                localCameraVisible={localCameraVisible}
                toggleLocalCameraVisibility={toggleLocalCameraVisibility}
                localFeedId={localFeedId}
                onMaximize={(name, feedId) => setMaximizedFeed({ name, feedId })}
              />

              {/* URL camera cards */}
              {urlCameras.map(cam => (
                <UrlCameraCard
                  key={`url-${cam.id}`}
                  cam={cam}
                  toggling={togglingIds.includes(cam.id)}
                  onToggle={handleUrlToggle}
                  onToggleVisibility={toggleUrlCameraVisibility}
                  onMaximize={(name, feedId) => setMaximizedFeed({ name, feedId })}
                />
              ))}
            </AnimatePresence>
          </motion.div>

        </div>
      </section>

      {/* â”€â”€â”€ RIGHT PANELS â”€â”€â”€ */}
      {personLogEnabled && (
        <PersonsPanel
          detectedPersons={detectedPersons}
          setSelectedPerson={setSelectedPerson}
          semanticQuery={semanticQuery}
          semanticResults={semanticResults}
          semanticLoading={semanticLoading}
          handleSemanticSearch={handleSemanticSearch}
          focusedPersonId={focusedPersonId}
          setDetectedPersons={setDetectedPersons}
        />
      )}

      <AlertsPanel
        alerts={alerts}
        watchlist={watchlist}
        setIsAddingTarget={setIsAddingTarget}
        setMapAlert={setMapAlert}
        scrollRef={{ current: null } as React.RefObject<HTMLDivElement>}
      />

      <style>{`
        @keyframes scanner { 0%{top:0%} 100%{top:100%} }
        .animate-scanner { animation: scanner 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Monitor;


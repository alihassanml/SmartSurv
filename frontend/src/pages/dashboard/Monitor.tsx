import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Power, Eye, EyeOff, Activity, Video,
  LayoutGrid, X, Loader2, Maximize2, Target,
} from 'lucide-react';
import { useApp } from '../../layouts/AppLayout';
import CameraStream from '../../components/dashboard/CameraStream';
import AlertsPanel from '../../components/dashboard/AlertsPanel';
import PersonsPanel from '../../components/dashboard/PersonsPanel';
import type { Alert } from '../../types/dashboard';
import type { UrlCamera } from '../../layouts/AppLayout';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LOCAL CAMERA CARD
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => isStreaming && onMaximize('LOCAL CAMERA', localFeedId)}
      className="group relative"
      style={{
        aspectRatio: '16/9',
        border: isStreaming
          ? '1px solid rgba(36,128,255,0.2)'
          : '1px dashed rgba(0,0,0,0.1)',
        opacity: isStreaming ? 1 : 0.7,
        cursor: isStreaming ? 'pointer' : 'default',
        background: '#e0e3e5',
        overflow: 'hidden',
        borderRadius: '0.375rem',
        transition: 'all 0.2s',
      }}
    >
      {/* Offline placeholder */}
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <EyeOff size={28} style={{ color: '#c4c6cc' }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#74777d' }}>Sector Offline</p>
          <p className="text-[9px] font-bold" style={{ color: '#c4c6cc' }}>LOCAL CAMERA</p>
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
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[0.6rem] font-bold"
            style={{ background: 'rgba(36,128,255,0.85)', border: '1px solid rgba(36,128,255,0.3)', color: '#ffffff', backdropFilter: 'blur(6px)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#e0e3e5' }} />
            LIVE
          </span>
        )}
        <span className="px-2 py-1 text-[0.6rem] font-bold uppercase"
          style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}>
          LOCAL CAMERA
        </span>
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }}
      >
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); toggleLocalCameraVisibility(); }}
              title={localCameraVisible ? 'Hide Camera' : 'Show Camera'}
              className="px-2 py-1.5 flex items-center gap-1.5 transition-all text-[9px] font-bold tracking-wider uppercase"
              style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.15)', color: '#44474c', borderRadius: '0.25rem' }}>
              {localCameraVisible ? <EyeOff size={12} /> : <Eye size={12} />}
              {localCameraVisible ? 'HIDE' : 'SHOW'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); toggleCamera(); }}
              disabled={isCameraToggling}
              title={cameraActive ? 'Stop Camera' : 'Start Camera'}
              className="px-2 py-1.5 flex items-center gap-1.5 transition-all text-[9px] font-bold tracking-wider uppercase"
              style={cameraActive
                ? { background: 'rgba(186,26,26,0.1)', border: '1px solid rgba(186,26,26,0.3)', color: '#ba1a1a', borderRadius: '0.25rem' }
                : { background: 'rgba(36,128,255,0.1)', border: '1px solid rgba(36,128,255,0.3)', color: '#2480ff', borderRadius: '0.25rem' }
              }>
              {isCameraToggling ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
              {cameraActive ? 'OFF' : 'ON'}
            </button>
          </div>
          {isStreaming && (
            <button
              onClick={e => { e.stopPropagation(); onMaximize('LOCAL CAMERA', localFeedId); }}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{ background: 'rgba(36,128,255,0.85)', color: '#ffffff', border: '1px solid rgba(36,128,255,0.3)', borderRadius: '0.25rem' }}>
              Full View
            </button>
          )}
        </div>
      </div>
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
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => isStreaming && onMaximize(cam.name, `url-${cam.id}`)}
      className="group relative"
      style={{
        aspectRatio: '16/9',
        border: isStreaming
          ? '1px solid rgba(36,128,255,0.2)'
          : '1px dashed rgba(0,0,0,0.1)',
        opacity: isStreaming ? 1 : 0.7,
        cursor: isStreaming ? 'pointer' : 'default',
        background: '#e0e3e5',
        overflow: 'hidden',
        borderRadius: '0.375rem',
        transition: 'all 0.2s',
      }}
    >
      {/* Offline placeholder */}
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <EyeOff size={28} style={{ color: '#c4c6cc' }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#74777d' }}>Sector Offline</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: '#c4c6cc' }}>{cam.name}</p>
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
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[0.6rem] font-bold"
            style={{ background: 'rgba(36,128,255,0.85)', border: '1px solid rgba(36,128,255,0.3)', color: '#ffffff', backdropFilter: 'blur(6px)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#e0e3e5' }} />
            LIVE
          </span>
        )}
        <span className="px-2 py-1 text-[0.6rem] font-bold uppercase"
          style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}>
          {cam.name}
        </span>
      </div>

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }}
      >
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); onToggleVisibility(cam.id); }}
              title={cam.visible ? 'Hide Camera' : 'Show Camera'}
              className="px-2 py-1.5 flex items-center gap-1.5 transition-all text-[9px] font-bold tracking-wider uppercase"
              style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(0,0,0,0.15)', color: '#44474c', borderRadius: '0.25rem' }}>
              {cam.visible ? <EyeOff size={12} /> : <Eye size={12} />}
              {cam.visible ? 'HIDE' : 'SHOW'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onToggle(cam.id); }}
              disabled={toggling}
              title={cam.active ? 'Stop Camera' : 'Start Camera'}
              className="px-2 py-1.5 flex items-center gap-1.5 transition-all text-[9px] font-bold tracking-wider uppercase"
              style={cam.active
                ? { background: 'rgba(186,26,26,0.1)', border: '1px solid rgba(186,26,26,0.3)', color: '#ba1a1a', borderRadius: '0.25rem' }
                : { background: 'rgba(36,128,255,0.1)', border: '1px solid rgba(36,128,255,0.3)', color: '#2480ff', borderRadius: '0.25rem' }
              }>
              {toggling ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
              {cam.active ? 'OFF' : 'ON'}
            </button>
          </div>
          {isStreaming && (
            <button
              onClick={e => { e.stopPropagation(); onMaximize(cam.name, `url-${cam.id}`); }}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all"
              style={{ background: 'rgba(36,128,255,0.85)', color: '#ffffff', border: '1px solid rgba(36,128,255,0.3)', borderRadius: '0.25rem' }}>
              Full View
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN MONITOR PAGE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
              style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', borderRadius: '0.5rem' }}>
              <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#f2f4f6', borderRadius: '0.5rem 0.5rem 0 0' }}>
                <div>
                  <h3 className="text-[14px] font-bold tracking-wide" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>Location</h3>
                  <p className="text-[10px] mt-0.5" style={{ color: '#74777d' }}>ID: {mapAlert.location?.id}</p>
                </div>
                <button onClick={() => setMapAlert(null)} className="p-2 transition-all" style={{ color: '#74777d' }}>
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
                <div className="w-64 p-5 flex flex-col gap-4" style={{ borderLeft: '1px solid rgba(0,0,0,0.07)', background: '#e0e3e5' }}>
                  <div>
                    <p className="text-[9px] font-semibold tracking-widest mb-1 uppercase" style={{ color: '#74777d' }}>Coordinates</p>
                    <p className="text-sm font-bold" style={{ color: '#2480ff' }}>{mapAlert.location?.lat}Â° N</p>
                    <p className="text-sm font-bold" style={{ color: '#2480ff' }}>{mapAlert.location?.lon}Â° E</p>
                  </div>
                  <div className="mt-auto">
                    <button onClick={() => window.open(mapAlert.location?.maps, '_blank')}
                      className="w-full py-2.5 font-bold text-[10px] tracking-widest uppercase"
                      style={{ background: '#2480ff', color: '#ffffff', borderRadius: '0.375rem' }}>
                      Open in Maps
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€â”€ MAXIMIZE MODAL â”€â”€â”€ */}
      <AnimatePresence>
        {maximizedFeed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMaximizedFeed(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="relative w-full h-full max-w-7xl overflow-hidden z-[101]"
              style={{ maxHeight: '90vh', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '0.5rem' }}
            >
              {/* Header overlay */}
              <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
                <div className="px-5 py-3 pointer-events-auto"
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '0.375rem' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-1.5" style={{ background: 'rgba(36,128,255,0.3)', border: '1px solid rgba(36,128,255,0.3)', color: '#ffffff', borderRadius: '0.25rem' }}>
                      <Eye size={16} />
                    </div>
                    <div>
                      <h2 className="font-bold uppercase tracking-widest" style={{ color: '#ffffff', fontFamily: "'Manrope',sans-serif" }}>{maximizedFeed.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2480ff' }} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.6)' }}>Channel Live</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setMaximizedFeed(null)}
                  className="p-3 transition-all pointer-events-auto"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: '0.375rem', backdropFilter: 'blur(12px)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(186,26,26,0.4)'; e.currentTarget.style.color = '#ffffff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
                  <X size={22} />
                </button>
              </div>

              {/* Corner decorations */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {['top-8 left-8 border-t border-l', 'top-8 right-8 border-t border-r', 'bottom-8 left-8 border-b border-l', 'bottom-8 right-8 border-b border-r'].map((cls, i) => (
                  <div key={i} className={`absolute w-10 h-10 ${cls}`} style={{ borderColor: 'rgba(36,128,255,0.3)' }} />
                ))}
              </div>

              {/* Video */}
              <div className="w-full h-full">
                <CameraStream feedId={maximizedFeed.feedId} active={true} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* â”€â”€â”€ PERSON DETAIL MODAL â”€â”€â”€ */}
      {personLogEnabled && (
        <AnimatePresence>
          {selectedPerson && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-lg flex items-center justify-center p-8">
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-sm overflow-hidden"
                style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
              >
                {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 ${c} z-10`} style={{ borderColor: 'rgba(36,128,255,0.4)' }} />
                ))}
                <button onClick={() => setSelectedPerson(null)}
                  className="absolute top-3 right-3 z-20 p-1.5 transition-all"
                  style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.1)', color: '#74777d', borderRadius: '0.25rem' }}>
                  <X className="w-4 h-4" />
                </button>
                <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                  <img src={`data:image/jpeg;base64,${selectedPerson.face}`} alt={selectedPerson.person_id} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 top-0 h-[2px] animate-scanner" style={{ background: 'rgba(36,128,255,0.6)' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold tracking-widest rounded"
                    style={selectedPerson.status === 'NEW' ? { background: '#2480ff', color: '#ffffff' } : { background: '#47607e', color: '#ffffff' }}>
                    {selectedPerson.status}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[9px] font-semibold tracking-[0.2em] mb-1 uppercase" style={{ color: '#74777d' }}>Subject ID</p>
                    <p className="text-xl font-bold" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>{selectedPerson.person_id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded" style={{ background: '#f2f4f6', border: '1px solid rgba(0,0,0,0.07)' }}>
                      <p className="text-[8px] font-semibold tracking-widest mb-1 uppercase" style={{ color: '#74777d' }}>Feed</p>
                      <p className="text-[11px] font-bold" style={{ color: '#2480ff' }}>{selectedPerson.feed_id.toUpperCase()}</p>
                    </div>
                    <div className="p-3 rounded" style={{ background: '#f2f4f6', border: '1px solid rgba(0,0,0,0.07)' }}>
                      <p className="text-[8px] font-semibold tracking-widest mb-1 uppercase" style={{ color: '#74777d' }}>Detected</p>
                      <p className="text-[11px] font-bold" style={{ color: '#191c1e' }}>{selectedPerson.timestamp}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSetFocus(focusedPersonId === selectedPerson.person_id ? null : selectedPerson.person_id)}
                    className="w-full py-3 font-bold text-[10px] tracking-[0.15em] transition-all flex items-center justify-center gap-2 rounded"
                    style={focusedPersonId === selectedPerson.person_id
                      ? { background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.25)', color: '#ba1a1a' }
                      : { background: 'rgba(36,128,255,0.06)', border: '1px solid rgba(36,128,255,0.25)', color: '#2480ff' }}>
                    <Target className="w-3.5 h-3.5" />
                    {focusedPersonId === selectedPerson.person_id ? 'Release Focus' : 'Set Focus'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* â”€â”€â”€ LEFT: CAMERA GRID â”€â”€â”€ */}
      <section className="flex-1 overflow-y-auto" style={{ background: '#e8ecf0' }}>
        <div className="p-6 space-y-6 pb-12">

          {/* â”€â”€ KPI Cards â”€â”€ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Nodes',      value: totalNodes,    color: '#191c1e', bg: '#e0e3e5',                    border: 'rgba(0,0,0,0.12)',           icon: <Video size={20} /> },
              { label: 'Active Readiness', value: activeNodes,   color: '#2480ff', bg: 'rgba(36,128,255,0.06)',       border: 'rgba(36,128,255,0.2)',        icon: <Activity size={20} /> },
              { label: 'Feed Live',        value: liveFeedCount, color: '#16a34a', bg: 'rgba(22,163,74,0.06)',        border: 'rgba(22,163,74,0.2)',         icon: null },
              { label: 'Node Offline',     value: offlineCount,  color: '#74777d', bg: '#f2f4f6',                    border: 'rgba(0,0,0,0.1)',             icon: null },
            ].map(kpi => (
              <div key={kpi.label} className="p-5 flex flex-col justify-between relative overflow-hidden rounded-xl"
                style={{ background: kpi.bg, border: `1px solid ${kpi.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#74777d' }}>{kpi.label}</p>
                <p className="text-3xl font-bold tracking-tighter" style={{ color: kpi.color, fontFamily: "'Manrope',sans-serif" }}>
                  {kpi.value.toString().padStart(2, '0')}
                </p>
                {kpi.label === 'Feed Live' && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#16a34a' }} />
                    <span className="text-[8px] font-bold" style={{ color: '#16a34a' }}>STREAMING</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* â”€â”€ Header bar â”€â”€ */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-xl"
            style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg" style={{ background: 'rgba(36,128,255,0.08)', border: '1px solid rgba(36,128,255,0.15)', color: '#2480ff' }}>
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: '#191c1e', fontFamily: "'Manrope',sans-serif" }}>
                  Camera Grid
                </h3>
                <p className="text-[9px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2" style={{ color: '#74777d' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2480ff' }} />
                  {activeNodes} Nodes Online
                  {systemLatency !== null && (
                    <span style={{ color: '#16a34a' }}>â€” {systemLatency}ms</span>
                  )}
                </p>
              </div>
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


import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, RefreshCw, Radio, Zap, Target, X,
} from 'lucide-react';
import { useApp } from '../../layouts/AppLayout';
import CameraStream from '../../components/dashboard/CameraStream';
import AlertsPanel from '../../components/dashboard/AlertsPanel';
import PersonsPanel from '../../components/dashboard/PersonsPanel';
import type { Alert } from '../../types/dashboard';
import { API } from '../../types/dashboard';

const Monitor: React.FC = () => {
  const {
    alerts, detectedPersons, setDetectedPersons, selectedPerson, setSelectedPerson,
    cameraActive, isCameraToggling, toggleCamera,
    currentSource, handleSourceChange, activeFeeds,
    watchlist,
    privacyMode, personLogEnabled,
    focusedPersonId, handleSetFocus, focusedPersonVisible,
    semanticQuery, semanticResults, semanticLoading, handleSemanticSearch,
    isReconnecting,
  } = useApp();

  const [showRemoteLink, setShowRemoteLink] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [mapAlert, setMapAlert] = useState<Alert | null>(null);

  const displayIp = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (null) : window.location.hostname;
  const systemIp = displayIp || window.location.hostname;
  const remoteUrl = `${window.location.protocol}//${systemIp}${window.location.port ? ':' + window.location.port : ''}/remote-camera?client_id=${Math.random().toString(36).substring(7)}`;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
  };

  const setIsAddingTarget = (_v: boolean) => {};

  return (
    <div className="flex h-full overflow-hidden">

      {/* ─── Remote Link Modal ─── */}
      <AnimatePresence>
        {showRemoteLink && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRemoteLink(false)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-8 z-[201] text-center"
              style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.15)' }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 flex items-center justify-center animate-glow-pulse"
                  style={{ border: '2px solid #b0c6ff', color: '#b0c6ff' }}>
                  <Zap className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-xl font-bold tracking-[0.2em] mb-2 uppercase"
                style={{ fontFamily: "'Manrope', sans-serif", color: '#ccd8ff' }}>Remote Node Link</h3>
              <p className="text-[10px] mb-8 leading-relaxed" style={{ color: 'rgba(195,198,214,0.45)' }}>
                Open this URL on your secondary device to start a remote surveillance uplink.
              </p>
              <div className="bg-white p-4 inline-block mb-8">
                <div className="text-black text-[10px] font-bold break-all max-w-[200px]">{remoteUrl}</div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { navigator.clipboard.writeText(remoteUrl); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }}
                  className="w-full py-3 font-bold text-[10px] tracking-widest uppercase transition-all"
                  style={isCopied ? { background: '#ccd8ff', color: '#002c6f' } : { background: '#0a58ca', color: '#ccd8ff' }}
                >
                  {isCopied ? 'COPIED!' : 'Copy Link'}
                </button>
                <button onClick={() => setShowRemoteLink(false)}
                  className="w-full py-3 text-[10px] font-bold tracking-widest uppercase transition-all"
                  style={{ border: '1px solid rgba(176,198,255,0.25)', color: '#b0c6ff', background: 'transparent' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAP MODAL ─── */}
      <AnimatePresence>
        {mapAlert && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-4xl flex flex-col"
              style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.15)', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}>
              <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(176,198,255,0.08)', background: '#1a1c1f' }}>
                <div>
                  <h3 className="text-[14px] font-bold tracking-[0.2em]" style={{ color: '#b0c6ff', fontFamily: "'Manrope', sans-serif" }}>GEOSPATIAL_INTERCEPT</h3>
                  <p className="text-[10px] opacity-40 uppercase">Location: {mapAlert.location?.id}</p>
                </div>
                <button onClick={() => setMapAlert(null)} className="p-2 transition-all" style={{ color: '#b0c6ff' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex h-[400px]">
                <div className="flex-1 bg-black relative">
                  <iframe width="100%" height="100%" frameBorder="0"
                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.8)' }}
                    src={`https://www.google.com/maps?q=${mapAlert.location?.lat},${mapAlert.location?.lon}&z=14&output=embed`}
                    allowFullScreen />
                </div>
                <div className="w-64 p-5 flex flex-col gap-4" style={{ borderLeft: '1px solid rgba(176,198,255,0.08)', background: '#111316' }}>
                  <div>
                    <p className="text-[9px] opacity-30 tracking-widest mb-1" style={{ color: '#c3c6d6' }}>COORDINATES</p>
                    <p className="text-sm font-bold" style={{ color: '#b0c6ff' }}>{mapAlert.location?.lat}° N</p>
                    <p className="text-sm font-bold" style={{ color: '#b0c6ff' }}>{mapAlert.location?.lon}° E</p>
                  </div>
                  <div className="mt-auto">
                    <button onClick={() => window.open(mapAlert.location?.maps, '_blank')}
                      className="w-full py-2.5 font-bold text-[10px] tracking-widest uppercase"
                      style={{ background: '#0a58ca', color: '#ccd8ff' }}>
                      OPEN IN MAPS
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── VIDEO SECTION ─── */}
      <section className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">

        {/* Controls bar */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Source selector */}
            <select
              value={currentSource}
              onChange={e => handleSourceChange(e.target.value as '0' | 'remote' | 'hybrid')}
              disabled={isReconnecting}
              className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 appearance-none cursor-pointer"
              style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.15)', color: '#b0c6ff', borderRadius: '0.25rem' }}
            >
              <option value="0">LOCAL CAMERA</option>
              <option value="remote">REMOTE NODE</option>
              <option value="hybrid">HYBRID</option>
            </select>

            {/* Remote link */}
            <button onClick={() => setShowRemoteLink(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase transition-all"
              style={{ border: '1px solid rgba(176,198,255,0.15)', color: '#8c909f', borderRadius: '0.25rem', background: '#1a1c1f' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8c909f'; }}>
              <Zap className="w-3 h-3" />
              CONNECT_PHONE
            </button>
          </div>

        </div>

        {/* Feed area */}
        <div className="flex-1 relative overflow-hidden group" style={{ border: '1px solid rgba(176,198,255,0.1)', background: '#0c0e11', borderRadius: '0.25rem' }}>

          {/* Corner brackets */}
          {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
            <div key={i} className={`absolute w-8 h-8 ${cls} animate-corner-pulse z-10`}
              style={{ borderColor: 'rgba(176,198,255,0.2)' }} />
          ))}

          {/* Focus HUD */}
          <AnimatePresence>
            {focusedPersonId && (
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-6 py-2 backdrop-blur-md"
                style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,180,171,0.4)' }}>
                <div className="flex items-center gap-2">
                  <Target className={`w-4 h-4 ${focusedPersonVisible ? 'animate-pulse' : ''}`}
                    style={{ color: focusedPersonVisible ? '#ffb4ab' : '#690005' }} />
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: '#ffb4ab' }}>
                    FOCUS: {focusedPersonId}
                  </span>
                </div>
                <button onClick={() => handleSetFocus(null)}><X className="w-3 h-3" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Video grid */}
          <div className={`absolute inset-0 p-2 grid gap-2 ${activeFeeds.length > 4 ? 'grid-cols-3' : activeFeeds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {activeFeeds.length > 0 ? (
              activeFeeds.map(feedId => (
                <div key={feedId} className="relative overflow-hidden"
                  style={{ border: '1px solid rgba(176,198,255,0.08)', background: 'rgba(0,0,0,0.4)' }}>
                  <CameraStream feedId={feedId} active={cameraActive} />
                  <div className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-bold tracking-tighter"
                    style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff' }}>
                    FEED_{feedId.toUpperCase()}
                  </div>
                  {privacyMode && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[7px] font-bold tracking-widest backdrop-blur-sm"
                      style={{ background: 'rgba(180,198,248,0.15)', color: '#b4c6f8', border: '1px solid rgba(180,198,248,0.3)' }}>
                      PRIVACY_ACTIVE
                    </div>
                  )}
                </div>
              ))
            ) : (
              cameraActive && <CameraStream active={cameraActive} />
            )}
          </div>

          {/* Camera off state */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ color: 'rgba(176,198,255,0.25)' }}>
              <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Camera className="w-14 h-14" />
              </motion.div>
              <p className="text-[10px] tracking-[0.4em] font-bold">FEED_OFFLINE</p>
              <button
                onClick={toggleCamera} disabled={isCameraToggling}
                className="mt-2 flex items-center gap-2 px-5 py-2 text-[9px] tracking-widest uppercase transition-all disabled:opacity-50"
                style={{ border: '1px solid rgba(176,198,255,0.2)', color: 'rgba(176,198,255,0.5)', borderRadius: '0.25rem' }}
              >
                {isCameraToggling && <RefreshCw className="w-3 h-3 animate-spin" />}
                {isCameraToggling ? 'STARTING...' : 'START CAMERA'}
              </button>
            </div>
          )}

          {/* Live HUD badge */}
          {cameraActive && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold"
              style={{ background: 'rgba(10,88,202,0.9)', color: '#ccd8ff' }}>
              <Radio className="w-3 h-3" />
              LIVE
            </div>
          )}
        </div>
      </section>

      {/* ─── RIGHT PANELS ─── */}
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

      {/* ─── PERSON DETAIL MODAL ─── */}
      {personLogEnabled && (
        <AnimatePresence>
          {selectedPerson && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-lg flex items-center justify-center p-8">
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm overflow-hidden"
                style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.2)' }}
              >
                {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c, i) => (
                  <div key={i} className={`absolute w-6 h-6 ${c} z-10`} style={{ borderColor: 'rgba(176,198,255,0.4)' }} />
                ))}
                <button onClick={() => setSelectedPerson(null)}
                  className="absolute top-3 right-3 z-20 p-1.5 transition-all"
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff' }}>
                  <X className="w-4 h-4" />
                </button>
                <div className="relative w-full aspect-square bg-black overflow-hidden">
                  <img src={`data:image/jpeg;base64,${selectedPerson.face}`} alt={selectedPerson.person_id} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 top-0 h-[2px] animate-scanner" style={{ background: 'rgba(176,198,255,0.6)' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111316] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold tracking-widest"
                    style={selectedPerson.status === 'NEW' ? { background: '#0a58ca', color: '#ccd8ff' } : { background: '#364873', color: '#b4c6f8' }}>
                    {selectedPerson.status}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[9px] opacity-30 tracking-[0.3em] mb-1">SUBJECT_ID</p>
                    <p className="text-xl font-bold" style={{ color: '#b0c6ff', fontFamily: "'Manrope', sans-serif" }}>{selectedPerson.person_id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(176,198,255,0.08)' }}>
                      <p className="text-[8px] opacity-30 tracking-widest mb-1">FEED</p>
                      <p className="text-[11px] font-bold" style={{ color: '#b0c6ff' }}>{selectedPerson.feed_id.toUpperCase()}</p>
                    </div>
                    <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(176,198,255,0.08)' }}>
                      <p className="text-[8px] opacity-30 tracking-widest mb-1">DETECTED</p>
                      <p className="text-[11px] font-bold" style={{ color: '#b0c6ff' }}>{selectedPerson.timestamp}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { handleSetFocus(focusedPersonId === selectedPerson.person_id ? null : selectedPerson.person_id); }}
                    className="w-full py-3 font-bold text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    style={focusedPersonId === selectedPerson.person_id
                      ? { background: '#93000a', border: '1px solid #ffb4ab', color: '#ffdad6' }
                      : { background: 'transparent', border: '1px solid rgba(176,198,255,0.3)', color: '#b0c6ff' }}>
                    <Target className="w-3.5 h-3.5" />
                    {focusedPersonId === selectedPerson.person_id ? 'RELEASE FOCUS' : 'SET TACTICAL FOCUS'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <style>{`
        @keyframes scanner { 0%{top:0%} 100%{top:100%} }
        @keyframes corner-pulse { 0%,100%{opacity:0.25} 50%{opacity:0.8} }
        .animate-scanner { animation: scanner 2s ease-in-out infinite; }
        .animate-corner-pulse { animation: corner-pulse 3s ease-in-out infinite; }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 rgba(176,198,255,0)} 50%{box-shadow:0 0 20px rgba(176,198,255,0.3)} }
        .animate-glow-pulse { animation: glow-pulse 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Monitor;

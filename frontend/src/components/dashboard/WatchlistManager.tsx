import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UploadCloud, Search, Pencil, Check, AlertTriangle,
  Camera, Image as ImageIcon, RefreshCw, ZapIcon,
} from 'lucide-react';
import { API } from '../../types/dashboard';

interface WatchlistManagerProps {
  isAddingTarget: boolean;
  setIsAddingTarget: (v: boolean) => void;
  newTargetName: string;
  setNewTargetName: (v: string) => void;
  newTargetPreview: string | null;
  setNewTargetPreview: (v: string | null) => void;
  handleAddWatchlist: (e: React.ChangeEvent<HTMLInputElement>) => void;
  watchlist: string[];
  removeTarget: (name: string) => void;
  fetchWatchlist: () => void;
}

const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  isAddingTarget,
  setIsAddingTarget,
  newTargetName,
  setNewTargetName,
  newTargetPreview,
  setNewTargetPreview,
  handleAddWatchlist,
  watchlist,
  removeTarget,
  fetchWatchlist,
}) => {
  /* ── Rename state ── */
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue]     = useState('');
  const [editError, setEditError]     = useState('');
  const [editLoading, setEditLoading] = useState(false);

  /* ── Add-mode state ── */
  const [addMode, setAddMode] = useState<'upload' | 'camera'>('upload');

  /* ── Camera capture state ── */
  const videoRef                              = useRef<HTMLVideoElement>(null);
  const canvasRef                             = useRef<HTMLCanvasElement>(null);
  const streamRef                             = useRef<MediaStream | null>(null); // stable ref for direct attachment
  const [stream, setStream]                   = useState<MediaStream | null>(null);
  const [videoReady, setVideoReady]           = useState(false);  // true once first frame is decoded
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob]       = useState<Blob | null>(null);
  const [camError, setCamError]               = useState('');
  const [camLoading, setCamLoading]           = useState(false);
  const [submitLoading, setSubmitLoading]     = useState(false);
  const [submitError, setSubmitError]         = useState('');

  /* ── Stop camera helper ── */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setVideoReady(false);
  }, []);

  /* ── Start camera — registers canplay listener imperatively BEFORE play() ── */
  const startCamera = useCallback(async () => {
    setCamError('');
    setVideoReady(false);
    setCamLoading(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = s;

        // ✅ Register listeners BEFORE play() — React's onCanPlay JSX prop
        //    arrives too late (event already fired by the time React reconciles).
        const markReady = () => {
          setVideoReady(true);
          video.removeEventListener('canplay',       markReady);
          video.removeEventListener('loadedmetadata', markReady);
        };
        video.addEventListener('canplay',       markReady);
        video.addEventListener('loadedmetadata', markReady);

        await video.play().catch(() => {});

        // Fallback: if readyState already advanced past HAVE_CURRENT_DATA
        // (can happen on fast machines where play() resolves synchronously)
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          setVideoReady(true);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCamError(`Camera error: ${msg}`);
    } finally {
      setCamLoading(false);
    }
  }, []);

  /* ── Safety net: re-attach if stream state updates without srcObject set ── */
  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      const video = videoRef.current;
      video.srcObject = stream;
      const markReady = () => {
        setVideoReady(true);
        video.removeEventListener('canplay',       markReady);
        video.removeEventListener('loadedmetadata', markReady);
      };
      video.addEventListener('canplay',       markReady);
      video.addEventListener('loadedmetadata', markReady);
      video.play().catch(() => {});
    }
  }, [stream]);

  /* ── Start / stop camera on mode change ── */
  useEffect(() => {
    if (addMode === 'camera') {
      setCapturedPreview(null);
      setCapturedBlob(null);
      startCamera();
    } else {
      stopCamera();
    }
  }, [addMode, startCamera, stopCamera]);

  /* ── Stop camera when panel closes ── */
  useEffect(() => {
    if (!isAddingTarget) {
      stopCamera();
      setCapturedPreview(null);
      setCapturedBlob(null);
      setAddMode('upload');
      setSubmitError('');
    }
  }, [isAddingTarget, stopCamera]);

  /* ── Capture frame from webcam ── */
  const captureFrame = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) { setCamError('Video element not available.'); return; }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setCamError('Video stream not ready yet — wait a moment and try again.');
      return;
    }

    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setCamError('Canvas not supported in this browser.'); return; }

    // Mirror horizontally to match the CSS scaleX(-1) on the video
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    canvas.toBlob(blob => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedPreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      } else {
        setCamError('Failed to capture frame — please try again.');
      }
    }, 'image/jpeg', 0.92);
  };

  /* ── Retake photo ── */
  const retake = () => {
    setCapturedPreview(null);
    setCapturedBlob(null);
    setSubmitError('');
    setCamError('');
    setVideoReady(false);
    startCamera();
  };

  /* ── Auto-name generator: target1, target2, … ── */
  const getAutoName = (): string => {
    let i = 1;
    while (watchlist.includes(`target${i}`)) i++;
    return `target${i}`;
  };

  /* ── Submit camera-captured image ── */
  const submitCameraCapture = async () => {
    if (!capturedBlob) return;
    const name = newTargetName.trim() || getAutoName();
    setSubmitLoading(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('file', capturedBlob, 'capture.jpg');
      const res = await fetch(
        `${API}/api/watchlist?name=${encodeURIComponent(name)}`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (res.ok) {
        setNewTargetName('');
        setCapturedPreview(null);
        setCapturedBlob(null);
        setAddMode('upload');
        fetchWatchlist();
      } else {
        setSubmitError(data.message || 'Failed — face not detected.');
      }
    } catch {
      setSubmitError('Network error. Try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ── Rename helpers ── */
  const startEdit  = (name: string) => { setEditingName(name); setEditValue(name); setEditError(''); };
  const cancelEdit = () => { setEditingName(null); setEditValue(''); setEditError(''); };

  const submitRename = async (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed)              { setEditError('Name cannot be empty'); return; }
    if (trimmed === oldName)   { cancelEdit(); return; }
    if (watchlist.includes(trimmed)) { setEditError('Name already exists'); return; }
    setEditLoading(true);
    try {
      const res = await fetch(`${API}/api/watchlist/${encodeURIComponent(oldName)}/rename`, {
        method: 'POST',                                  // ✅ POST (not PUT)
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.message || 'Rename failed');
      } else {
        cancelEdit();
        fetchWatchlist();
      }
    } catch {
      setEditError('Network error');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <AnimatePresence>
      {isAddingTarget && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setIsAddingTarget(false); cancelEdit(); }}
            className="fixed inset-0 bg-black/80 z-[300] backdrop-blur-md"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-[440px] bg-white border-l border-[var(--color-primary)]/20 z-[301] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-[var(--color-primary)]/10 shrink-0">
              <div>
                <h3 className="text-xl font-bold tracking-widest text-[var(--color-primary)]">Watchlist</h3>
                <p className="text-[10px] opacity-40 uppercase font-bold mt-1">Personnel Authorization Management</p>
              </div>
              <button
                onClick={() => { setIsAddingTarget(false); cancelEdit(); }}
                className="p-2 hover:bg-[rgba(0,0,0,0.04)] border border-transparent hover:border-[var(--color-primary)]/30 transition-all"
              >
                <X className="w-5 h-5 text-[var(--color-primary)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">

              {/* ── Add New Target ── */}
              <div className="space-y-4 bg-[var(--color-surface-container-low)] p-5 border border-[var(--color-primary)]/10">
                <p className="text-[10px] font-bold text-[var(--color-primary)]/60 tracking-widest uppercase">Add New Target</p>

                {/* Name Input */}
                <input
                  type="text"
                  placeholder="ENTER_NAME... (auto: target1, target2…)"
                  value={newTargetName}
                  onChange={(e) => setNewTargetName(e.target.value)}
                  className="w-full bg-white/80 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs px-4 py-3 placeholder:text-[var(--color-primary)]/20 focus:outline-none focus:border-[var(--color-primary)]/50 transition-all font-bold"
                />

                {/* Mode Tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAddMode('upload')}
                    className={`flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold tracking-widest uppercase border transition-all ${
                      addMode === 'upload'
                        ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-primary)]/15 text-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]/60'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Upload Image
                  </button>
                  <button
                    onClick={() => setAddMode('camera')}
                    className={`flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold tracking-widest uppercase border transition-all ${
                      addMode === 'camera'
                        ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-primary)]/15 text-[var(--color-primary)]/30 hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]/60'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Live Capture
                  </button>
                </div>

                {/* ── Upload Mode ── */}
                {addMode === 'upload' && (
                  <label className="block">
                    {newTargetPreview ? (
                      <div className="relative w-full aspect-square border border-[var(--color-primary)]/30 bg-white/80 overflow-hidden">
                        <img src={newTargetPreview} className="w-full h-full object-cover grayscale" alt="Preview" />
                        <div className="absolute inset-0 bg-[var(--color-primary)]/10 animate-pulse" />
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-[var(--color-primary)] animate-scanner" />
                        <button
                          onClick={(e) => { e.preventDefault(); setNewTargetPreview(null); }}
                          className="absolute top-2 right-2 p-1 bg-white/90 text-white hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="w-full py-10 border-2 border-dashed border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 cursor-pointer text-[var(--color-primary)] font-bold text-[10px] tracking-widest uppercase text-center transition-all flex flex-col items-center gap-3"
                        onClick={() => {
                          // Auto-set name before the file dialog opens so parent state is ready
                          if (!newTargetName.trim()) setNewTargetName(getAutoName());
                        }}
                      >
                        <UploadCloud className="w-7 h-7" />
                        {newTargetName.trim() ? 'Select Biometric Image' : `Select Image (auto-name: ${getAutoName()})`}
                      </div>
                    )}
                    <input type="file" className="hidden" onChange={handleAddWatchlist} accept="image/*" />
                  </label>
                )}

                {/* ── Camera Mode ── */}
                {addMode === 'camera' && (
                  <div className="space-y-3">
                    {/* Video / Preview area */}
                    <div className="relative w-full aspect-video bg-black border border-[var(--color-primary)]/20 overflow-hidden">
                      {/* Live video */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${capturedPreview ? 'hidden' : 'block'}`}
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      {/* Captured snapshot — no transform needed, canvas already mirrored */}
                      {capturedPreview && (
                        <img
                          src={capturedPreview}
                          alt="Captured"
                          className="w-full h-full object-cover grayscale"
                        />
                      )}
                      {/* Hidden canvas for capture */}
                      <canvas ref={canvasRef} className="hidden" />

                      {/* Loading overlay */}
                      {camLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/95">
                          <RefreshCw className="w-6 h-6 text-[var(--color-primary)] animate-spin" />
                        </div>
                      )}

                      {/* Scan line when live */}
                      {stream && !capturedPreview && (
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-[var(--color-primary)]/60 animate-scanner" />
                      )}

                      {/* Captured badge */}
                      {capturedPreview && (
                        <div className="absolute top-2 left-2 bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/40 px-2 py-0.5 text-[9px] font-bold text-[var(--color-primary)] tracking-widest">
                          CAPTURED
                        </div>
                      )}

                      {/* Corner brackets */}
                      <div className="absolute top-1 left-1 w-4 h-4 border-t border-l border-[var(--color-primary)]/40" />
                      <div className="absolute top-1 right-1 w-4 h-4 border-t border-r border-[var(--color-primary)]/40" />
                      <div className="absolute bottom-1 left-1 w-4 h-4 border-b border-l border-[var(--color-primary)]/40" />
                      <div className="absolute bottom-1 right-1 w-4 h-4 border-b border-r border-[var(--color-primary)]/40" />
                    </div>

                    {/* Camera error */}
                    {camError && (
                      <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 p-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {camError}
                      </div>
                    )}

                    {/* Capture / Retake / Submit */}
                    {!capturedPreview ? (
                      <button
                        onClick={captureFrame}
                        disabled={camLoading}
                        className="w-full py-3 flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest uppercase border-2 border-[var(--color-primary)]/60 text-[var(--color-primary)] bg-[var(--color-primary)]/08 hover:bg-[var(--color-primary)]/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ZapIcon className="w-4 h-4" />
                        {camLoading ? 'Starting camera...' : 'Capture Photo'}
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={retake}
                          className="py-2.5 text-[10px] font-bold tracking-widest uppercase border border-[var(--color-primary)]/30 text-[var(--color-primary)]/60 hover:border-[var(--color-primary)]/60 hover:text-[var(--color-primary)] transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retake
                        </button>
                        <button
                          onClick={submitCameraCapture}
                          disabled={submitLoading}
                          className="py-2.5 text-[10px] font-bold tracking-widest uppercase border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {submitLoading
                            ? <><RefreshCw className="w-3 h-3 animate-spin" /> Saving...</>
                            : <><Check className="w-3 h-3" /> Confirm</>
                          }
                        </button>
                      </div>
                    )}

                    {/* Submit error */}
                    {submitError && (
                      <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-500/5 border border-red-500/20 p-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {submitError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Active Watchlist ── */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-[var(--color-primary)]/60 tracking-widest uppercase">
                  Active Targets ({watchlist.length})
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {watchlist.length === 0 ? (
                    <div className="col-span-2 text-center py-10 opacity-20 text-[10px] italic">
                      NO_TARGETS_ACTIVE
                    </div>
                  ) : (
                    watchlist.map(name => (
                      <div
                        key={name}
                        className="relative border border-[var(--color-primary)]/15 bg-white group hover:border-[var(--color-primary)]/40 transition-all overflow-hidden"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-square bg-black overflow-hidden">
                          <img
                            src={`${API}/api/watchlist/images/${name}.jpg?t=${Date.now()}`}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            alt={name}
                          />
                          <div className="absolute inset-0 bg-[var(--color-primary)]/0 group-hover:bg-[var(--color-primary)]/5 transition-all duration-300" />
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-[var(--color-primary)]/40 opacity-0 group-hover:opacity-100 animate-scanner" />

                          {/* Delete */}
                          <button
                            onClick={() => removeTarget(name)}
                            className="absolute top-1 right-1 p-1 bg-white/95 text-[var(--color-primary)]/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Remove target"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {/* Edit */}
                          {editingName !== name && (
                            <button
                              onClick={() => startEdit(name)}
                              className="absolute top-1 left-1 p-1 bg-white/95 text-[var(--color-primary)]/30 hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-all"
                              title="Rename target"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Name / Edit row */}
                        <div className="px-2 py-1.5">
                          {editingName === name ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <input
                                  autoFocus
                                  value={editValue}
                                  onChange={e => { setEditValue(e.target.value); setEditError(''); }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter')  submitRename(name);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  className="flex-1 min-w-0 bg-white/90 border border-[var(--color-primary)]/40 text-[var(--color-primary)] text-[9px] px-1.5 py-1 focus:outline-none font-bold w-0"
                                />
                                <button
                                  onClick={() => submitRename(name)}
                                  disabled={editLoading}
                                  className="p-1 text-[var(--color-primary)] hover:text-green-400 transition-all shrink-0"
                                  title="Save"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1 text-[var(--color-primary)]/40 hover:text-red-400 transition-all shrink-0"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              {editError && (
                                <div className="flex items-center gap-1 text-[8px] text-red-400">
                                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                  {editError}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold tracking-wider text-[var(--color-primary)] truncate">
                                {name.toUpperCase()}
                              </span>
                              <Search className="w-3 h-3 text-[var(--color-primary)]/30 shrink-0" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WatchlistManager;

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, User, Upload, X, Pencil, Check, AlertTriangle, Camera, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { API } from '../../types/dashboard';

type AddMode = 'upload' | 'camera';

const WatchlistPage: React.FC = () => {
  const { watchlist, fetchWatchlist } = useApp();

  // Add modal state
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>('upload');
  const [newName, setNewName] = useState('');
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Camera capture state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [captured, setCaptured] = useState<string | null>(null);  // base64 dataURL

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Edit/rename state
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // ── Camera helpers ────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setCameraError('');
    setCaptured(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError('Camera access denied or unavailable');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setCaptured(null);
  }, [cameraStream]);

  // Make sure video attaches whenever the element mounts and stream is ready
  React.useEffect(() => {
    if (addMode === 'camera' && cameraStream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [addMode, cameraStream]);

  const getAutoName = (): string => {
    let i = 1;
    while (watchlist.includes(`target${i}`)) i++;
    return `target${i}`;
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d')!;
    
    // mirror the canvas so it matches the typical user-facing preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stopCamera();

    // Auto name if missing
    let finalName = newName.trim();
    if (!finalName) {
      finalName = getAutoName();
      setNewName(finalName);
    }

    // Auto submit immediately
    const blob = dataURLtoBlob(dataUrl);
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
    await uploadFile(file, finalName);
  };

  const retakePhoto = () => {
    setCaptured(null);
    startCamera();
  };

  // ── Submit helpers ────────────────────────────────────────────────────────

  const dataURLtoBlob = (dataUrl: string): Blob => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)![1];
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const submitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Auto name if missing
    if (!newName.trim()) {
      setNewName(getAutoName());
    }

    const reader = new FileReader();
    reader.onloadend = () => setNewPreview(reader.result as string);
    reader.readAsDataURL(file);
    await uploadFile(file);
  };

  const submitCapture = async () => {
    if (!captured) return;
    
    // Auto name if missing
    if (!newName.trim()) {
      setNewName(getAutoName());
    }

    const blob = dataURLtoBlob(captured);
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
    await uploadFile(file, newName.trim() || getAutoName());
  };

  const uploadFile = async (file: File, explicitName?: string) => {
    setIsLoading(true);
    const finalName = explicitName || newName.trim() || getAutoName();
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API}/api/watchlist?name=${encodeURIComponent(finalName)}`, { method: 'POST', body: formData });
      if (res.ok) {
        closeAddModal();
        fetchWatchlist();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setCameraError(errorData.message || 'Face recognition failed. Please try again.');
        setCaptured(null); // Clear the captured image so they can retry
      }
    } catch (_) {
      setCameraError('Network error while uploading.');
      setCaptured(null);
    }
    finally { setIsLoading(false); }
  };

  const closeAddModal = () => {
    stopCamera();
    setIsAdding(false);
    setNewName('');
    setNewPreview(null);
    setCaptured(null);
    setCameraError('');
    setAddMode('upload');
  };

  const switchMode = (mode: AddMode) => {
    stopCamera();
    setNewPreview(null);
    setCaptured(null);
    setCameraError('');
    setAddMode(mode);
    if (mode === 'camera') startCamera();
  };

  // ── Rename helpers ────────────────────────────────────────────────────────

  const removeTarget = async (name: string) => {
    try {
      await fetch(`${API}/api/watchlist/${encodeURIComponent(name)}`, { method: 'DELETE' });
      fetchWatchlist();
      setDeleteConfirm(null);
    } catch (_) {}
  };

  const startEdit = (name: string) => {
    setEditingName(name);
    setEditValue(name);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingName(null);
    setEditValue('');
    setEditError('');
  };

  const submitRename = async (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) { setEditError('Name cannot be empty'); return; }
    if (trimmed === oldName) { cancelEdit(); return; }
    if (watchlist.includes(trimmed)) { setEditError('Name already exists'); return; }
    setEditLoading(true);
    try {
      const res = await fetch(`${API}/api/watchlist/${encodeURIComponent(oldName)}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-background)' }}>

      {/* Header */}
      <div className="shrink-0 px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: 'var(--color-surface)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
          <div>
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}>WATCHLIST</h2>
            <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>
              {watchlist.length} targets registered — Person Re-ID engine
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all rounded-xl"
          style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0d6efd'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'; }}
        >
          <Plus className="w-3.5 h-3.5" /> ADD TARGET
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        {watchlist.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4"
            style={{ color: 'var(--color-outline-variant)' }}>
            <Target className="w-16 h-16" />
            <p className="text-sm tracking-[0.3em] font-bold">NO TARGETS REGISTERED</p>
            <p className="text-xs" style={{ color: 'rgba(0,0,0,0.1)' }}>
              Add reference images to enable person search mode.
            </p>
            <button onClick={() => setIsAdding(true)}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-widest uppercase rounded-xl transition-all"
              style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}>
              <Plus className="w-3.5 h-3.5" /> ADD FIRST TARGET
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchlist.map((name) => (
              <motion.div key={name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="group relative overflow-hidden flex flex-col bg-white rounded-2xl"
                style={{ border: '1px solid var(--color-outline-variant)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>

                {/* Image + action overlay */}
                <div className="aspect-square overflow-hidden relative" style={{ background: 'rgba(36,128,255,0.05)' }}>
                  <img
                    src={`${API}/api/watchlist/${encodeURIComponent(name)}/image`}
                    alt={name} className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `<div class="w-full h-full flex items-center justify-center"><svg class="w-10 h-10" fill="none" stroke="var(--color-primary)" stroke-width="1.5" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>`;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(255,255,255,0.9)' }}>
                    <button onClick={() => startEdit(name)}
                      className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-bold uppercase rounded-xl transition-all hover:bg-[var(--color-primary)] hover:text-white"
                      style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'white' }}>
                      <Pencil className="w-3 h-3" /> RENAME
                    </button>
                    <button onClick={() => setDeleteConfirm(name)}
                      className="flex items-center gap-1.5 px-3 py-2 text-[9px] font-bold uppercase rounded-xl transition-all hover:bg-[#ba1a1a] hover:text-white"
                      style={{ border: '1px solid #ba1a1a', color: '#ba1a1a', background: 'white' }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Name / inline edit */}
                <div className="p-2.5 flex-1">
                  {editingName === name ? (
                    <div className="space-y-1.5">
                      <input autoFocus value={editValue}
                        onChange={e => { setEditValue(e.target.value); setEditError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') submitRename(name); if (e.key === 'Escape') cancelEdit(); }}
                        className="w-full px-2 py-1 text-xs font-bold focus:outline-none"
                        style={{ background: 'var(--color-background)', border: '1px solid rgba(36,128,255,0.4)', color: 'var(--color-primary)', borderRadius: '0.125rem' }}
                      />
                      {editError && (
                        <div className="flex items-center gap-1 text-[8px]" style={{ color: '#ba1a1a' }}>
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />{editError}
                        </div>
                      )}
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => submitRename(name)} disabled={editLoading}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] font-bold rounded-lg transition-all hover:bg-[var(--color-primary)] hover:text-white"
                          style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                          {editLoading ? '...' : <><Check className="w-3 h-3" /> SAVE</>}
                        </button>
                        <button onClick={cancelEdit} className="px-2.5 py-1.5 text-[9px] font-bold rounded-lg transition-all hover:bg-gray-100"
                          style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)', background: 'white' }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--color-primary)', fontFamily: "'Manrope', sans-serif" }}>{name}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: 'var(--color-outline)' }}>TARGET REGISTERED</p>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Target Modal ── */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeAddModal}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-md" />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[201] rounded-3xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                <div>
                  <h3 className="text-sm font-bold" style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}>
                    Add Watchlist Target
                  </h3>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
                    Choose how to provide the face image
                  </p>
                </div>
                <button onClick={closeAddModal} style={{ color: 'var(--color-outline)' }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">

                {/* Name input */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest mb-1.5"
                    style={{ color: 'rgba(36,128,255,0.5)' }}>Target Name *</label>
                  <input
                    type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-2.5 text-sm focus:outline-none rounded-xl"
                    style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                  />
                </div>

                {/* Mode tabs */}
                <div className="flex gap-2">
                  {([
                    { key: 'upload', label: 'Upload Image', icon: Upload },
                    { key: 'camera', label: 'Live Camera', icon: Camera },
                  ] as const).map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => switchMode(key)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-all rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                      style={addMode === key
                        ? { background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }
                        : { background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)' }
                      }>
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>

                {/* Upload mode */}
                {addMode === 'upload' && (
                  <div>
                    {newPreview ? (
                      <div className="relative aspect-video overflow-hidden mb-3"
                        style={{ border: '1px solid rgba(36,128,255,0.15)', borderRadius: '0.25rem' }}>
                        <img src={newPreview} alt="preview" className="w-full h-full object-cover" />
                        <button onClick={() => setNewPreview(null)}
                          className="absolute top-2 right-2 p-1.5"
                          style={{ background: 'rgba(0,0,0,0.7)', color: '#ba1a1a', borderRadius: '0.25rem' }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-video flex flex-col items-center justify-center gap-3 mb-3"
                        style={{ border: '2px dashed rgba(0,0,0,0.1)', borderRadius: '0.25rem', background: 'rgba(36,128,255,0.02)', color: 'var(--color-outline)' }}>
                        <User className="w-10 h-10" />
                        <p className="text-[10px] tracking-widest">FACE PHOTO</p>
                      </div>
                    )}
                    <label className={`flex items-center justify-center gap-2 w-full py-3 text-xs font-bold uppercase tracking-widest cursor-pointer transition-all rounded-xl`}
                      style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}>
                      {isLoading ? <span className="animate-pulse">UPLOADING...</span> : (
                        <><Upload className="w-3.5 h-3.5" /> {newPreview ? 'CHANGE PHOTO' : 'SELECT PHOTO'}</>
                      )}
                      <input type="file" accept="image/*" onChange={submitUpload}
                        disabled={isLoading} className="sr-only" />
                    </label>
                  </div>
                )}

                {/* Camera mode */}
                {addMode === 'camera' && (
                  <div className="space-y-3">
                    {cameraError && (
                      <div className="flex items-center gap-2 p-3 text-xs"
                        style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(255,180,171,0.3)', color: '#ba1a1a', borderRadius: '0.25rem' }}>
                        <AlertTriangle className="w-4 h-4 shrink-0" /> {cameraError}
                      </div>
                    )}

                    <div className="relative aspect-video overflow-hidden"
                      style={{ background: '#000', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.25rem' }}>

                      {/* Live video */}
                      {!captured && (
                        <video ref={videoRef} autoPlay playsInline muted
                          className="w-full h-full object-cover"
                          style={{ display: cameraStream ? 'block' : 'none' }} />
                      )}

                      {/* Captured preview */}
                      {captured && (
                        <img src={captured} alt="captured"
                          className="w-full h-full object-cover" />
                      )}

                      {/* No stream / no capture placeholder */}
                      {!cameraStream && !captured && !cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                          style={{ color: 'var(--color-outline)' }}>
                          <Camera className="w-10 h-10 animate-pulse" />
                          <p className="text-[10px] tracking-widest">INITIALIZING CAMERA...</p>
                        </div>
                      )}

                      {/* Live indicator */}
                      {cameraStream && !captured && (
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold"
                          style={{ background: 'rgba(220,38,38,0.8)', color: '#fff', borderRadius: '0.125rem' }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          LIVE
                        </div>
                      )}
                    </div>

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Camera action buttons */}
                    <div className="flex gap-2">
                      {!cameraStream && !cameraError && !captured && (
                        <button onClick={startCamera}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase rounded-xl transition-all"
                          style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)' }}>
                          <Camera className="w-3.5 h-3.5" /> START CAMERA
                        </button>
                      )}
                      
                      {cameraStream && !captured && (
                        <button onClick={capturePhoto} disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase rounded-xl transition-all disabled:opacity-40"
                          style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}>
                          {isLoading 
                             ? <span className="animate-pulse">SAVING TO DATABASE...</span> 
                             : <><Camera className="w-3.5 h-3.5" /> CAPTURE & SAVE</>}
                        </button>
                      )}
                      
                      {cameraError && (
                        <button onClick={startCamera}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase rounded-xl transition-all"
                          style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)' }}>
                          <RotateCcw className="w-3.5 h-3.5" /> RETRY CAMERA
                        </button>
                      )}

                      {captured && isLoading && (
                        <button disabled className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase rounded-xl opacity-60"
                          style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}>
                          <span className="animate-pulse">SAVING...</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs p-7 z-[201] text-center rounded-3xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <Trash2 className="w-10 h-10 mx-auto mb-4" style={{ color: '#ba1a1a' }} />
              <p className="text-sm font-bold mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}>
                Remove Target?
              </p>
              <p className="text-xs mb-6" style={{ color: 'var(--color-outline)' }}>
                <span style={{ color: '#ba1a1a' }}>{deleteConfirm}</span> will be removed from the watchlist.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 text-xs font-bold uppercase rounded-xl transition-all"
                  style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)' }}>
                  CANCEL
                </button>
                <button onClick={() => removeTarget(deleteConfirm)} className="flex-1 py-2.5 text-xs font-bold uppercase rounded-xl transition-all"
                  style={{ background: '#ba1a1a', color: '#ffffff', border: '1px solid #ba1a1a' }}>
                  REMOVE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WatchlistPage;





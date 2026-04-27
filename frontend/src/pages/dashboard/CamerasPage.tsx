import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Plus, Trash2, Edit2, Search, X, Loader2,
  Video, LayoutGrid, Save, Laptop,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { API } from '../../types/dashboard';
import type { UrlCamera } from '../../context/AppContext';

/* ── tiny confirm modal ─────────────────────────────────────────────────────── */
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onCancel} />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-sm p-8 z-10 rounded-3xl"
        style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,68,102,0.3)' }}>
        <h3 className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: '#ba1a1a' }}>{title}</h3>
        <p className="text-[11px] mb-8 leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all rounded-xl"
            style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-xl"
            style={{ background: 'rgba(255,68,102,0.15)', border: '1px solid rgba(255,68,102,0.3)', color: '#ba1a1a' }}>
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── local camera card ──────────────────────────────────────────────────────── */
function LocalCameraCard({ active, toggling, onToggle }: {
  active: boolean;
  toggling: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, scale: 0.95, y: 15 }, show: { opacity: 1, scale: 1, y: 0 } }}
      className="flex flex-col overflow-hidden group bg-white rounded-2xl"
      style={{
        border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Top row */}
      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        <span className="text-[8px] font-bold tracking-widest uppercase px-2.5 py-1"
          style={{ background: 'rgba(36,128,255,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-outline)' }}>
          LC-000
        </span>
        <span className="text-[8px] font-bold tracking-widest uppercase px-2.5 py-1"
          style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(36,128,255,0.06)', color: 'var(--color-outline)' }}>
          BUILT-IN
        </span>
      </div>

      {/* Main body */}
      <div className="flex items-center gap-4 px-5 pb-4">
        <div className="w-12 h-12 shrink-0 flex items-center justify-center transition-all"
          style={{
            background: active ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${active ? 'rgba(36,128,255,0.3)' : 'rgba(0,0,0,0.1)'}`,
            color: active ? 'var(--color-primary)' : 'rgba(36,128,255,0.25)',
          }}>
          <Laptop className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-tight" style={{ color: 'var(--color-on-surface)' }}>Local Camera</h4>
          <p className="text-[9px] font-mono truncate mt-1" style={{ color: 'var(--color-outline)' }}>
            Laptop / USB Webcam · Device 0
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(36,128,255,0.05)', margin: '0 20px' }} />

      {/* Bottom: toggle + status */}
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        {/* Stream toggle */}
        <div className="flex flex-col gap-2">
          <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>
            Stream
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer"
              checked={active}
              onChange={() => !toggling && onToggle()}
              disabled={toggling}
            />
            <div className="w-8 h-4 rounded-full transition-all relative"
              style={{ background: active ? 'rgba(36,128,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
              <div className="absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all"
                style={{ left: active ? '18px' : '2px' }} />
            </div>
          </label>
        </div>

        {/* Status badge */}
        <span className="text-[8px] font-bold tracking-widest uppercase px-2.5 py-1"
          style={active
            ? { background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(36,128,255,0.25)', color: 'var(--color-primary)' }
            : { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-outline)' }
          }>
          {toggling ? '...' : active ? 'ONLINE' : 'OFFLINE'}
        </span>

        {/* Placeholder to match URL card spacing */}
        <div className="w-8 h-8 flex items-center justify-center"
          style={{ color: 'rgba(0,0,0,0.1)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>
          —
        </div>
      </div>
    </motion.div>
  );
}

/* ── url camera card ────────────────────────────────────────────────────────── */
function CameraCard({ cam, onToggle, onToggleVisibility, onDelete, onEdit, toggling }: {
  cam: UrlCamera;
  onToggle: (id: number) => void;
  onToggleVisibility: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (cam: UrlCamera) => void;
  toggling: boolean;
}) {
  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, scale: 0.95, y: 15 }, show: { opacity: 1, scale: 1, y: 0 } }}
      className="flex flex-col overflow-hidden group bg-white rounded-2xl"
      style={{
        border: cam.active ? '1px solid var(--color-primary)' : '1px solid var(--color-outline-variant)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Top row */}
      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        <span className="text-[8px] font-bold tracking-widest uppercase px-2.5 py-1"
          style={{ background: 'rgba(36,128,255,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-outline)' }}>
          ID-{String(cam.id).padStart(3, '0')}
        </span>
        <button onClick={() => onEdit(cam)} className="transition-colors"
          style={{ color: 'var(--color-outline-variant)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(36,128,255,0.15)')}>
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main body */}
      <div className="flex items-center gap-4 px-5 pb-4 cursor-pointer" onClick={() => onEdit(cam)}>
        <div className="w-12 h-12 shrink-0 flex items-center justify-center transition-all"
          style={{
            background: cam.active ? 'rgba(0,255,133,0.08)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${cam.active ? 'rgba(0,255,133,0.3)' : 'rgba(0,0,0,0.1)'}`,
            color: cam.active ? '#00ff85' : 'rgba(36,128,255,0.25)',
          }}>
          <Camera className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-tight truncate" style={{ color: 'var(--color-on-surface)' }}>{cam.name}</h4>
          <p className="text-[9px] font-mono truncate mt-1" style={{ color: 'var(--color-outline)' }}>{cam.url}</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(36,128,255,0.05)', margin: '0 20px' }} />

      {/* Bottom: two toggles + delete */}
      <div className="flex items-center justify-between px-5 py-4 gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-5">

          {/* Analysis toggle (active/start) */}
          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>
              Analysis
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer"
                checked={cam.active}
                onChange={() => !toggling && onToggle(cam.id)}
                disabled={toggling}
              />
              <div className="w-8 h-4 rounded-full transition-all relative"
                style={{ background: cam.active ? 'rgba(0,255,133,0.6)' : 'rgba(0,0,0,0.1)' }}>
                <div className="absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all"
                  style={{ left: cam.active ? '18px' : '2px' }} />
              </div>
            </label>
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(36,128,255,0.05)' }} />

          {/* Live toggle (visibility) */}
          <div className="flex flex-col gap-2">
            <span className="text-[8px] font-bold uppercase tracking-widest transition-colors"
              style={{ color: !cam.active ? 'rgba(0,0,0,0.1)' : 'rgba(36,128,255,0.25)' }}>
              Live
            </span>
            <label className={`relative inline-flex items-center ${!cam.active ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input type="checkbox" className="sr-only peer"
                checked={cam.visible && cam.active}
                onChange={() => onToggleVisibility(cam.id)}
                disabled={!cam.active}
              />
              <div className="w-8 h-4 rounded-full transition-all relative"
                style={{ background: cam.visible && cam.active ? 'rgba(36,128,255,0.4)' : 'rgba(0,0,0,0.1)' }}>
                <div className="absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all"
                  style={{ left: cam.visible && cam.active ? '18px' : '2px' }} />
              </div>
            </label>
          </div>
        </div>

        {/* Delete */}
        <button onClick={() => onDelete(cam.id)}
          className="p-2 transition-all mt-2"
          style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-outline)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,102,0.1)'; e.currentTarget.style.color = '#ba1a1a'; e.currentTarget.style.borderColor = 'rgba(255,68,102,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; e.currentTarget.style.color = 'rgba(36,128,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── main page ──────────────────────────────────────────────────────────────── */
export default function CamerasPage() {
  const {
    urlCameras, fetchUrlCameras, toggleUrlCamera, toggleUrlCameraVisibility,
    cameraActive, toggleCamera, isCameraToggling,
    activeFeeds,
  } = useApp();

  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCam, setEditCam] = useState<UrlCamera | null>(null);
  const [newCam, setNewCam] = useState({ name: '', url: '' });
  const [togglingIds, setTogglingIds] = useState<number[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'registry' | 'new'>('registry');

  // Local camera is active when any non-url feed is present
  const localIsOn = activeFeeds.some(f => !f.startsWith('url-')) || (cameraActive && !urlCameras.some(c => c.active));

  const filtered = urlCameras.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.url.toLowerCase().includes(search.toLowerCase())
  );

  // KPI counts (include local camera)
  const totalNodes = urlCameras.length + 1;
  const activeUrlCount = urlCameras.filter(c => c.active).length;
  const activeCount = activeUrlCount + (localIsOn ? 1 : 0);
  const liveFeedCount = urlCameras.filter(c => c.active && c.visible).length + (localIsOn ? 1 : 0);
  const offlineCount = totalNodes - activeCount;

  /* ── toggle active ── */
  const handleToggle = async (id: number) => {
    setTogglingIds(p => [...p, id]);
    await toggleUrlCamera(id);
    setTogglingIds(p => p.filter(x => x !== id));
  };

  /* ── toggle visibility ── */
  const handleToggleVisibility = async (id: number) => {
    await toggleUrlCameraVisibility(id);
  };

  /* ── add ── */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/url-cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCam),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewCam({ name: '', url: '' });
        fetchUrlCameras();
      }
    } finally { setSaving(false); }
  };

  /* ── edit / save ── */
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCam) return;
    setSaving(true);
    try {
      await fetch(`${API}/api/url-cameras/${editCam.id}`, { method: 'DELETE' });
      await fetch(`${API}/api/url-cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCam.name, url: editCam.url }),
      });
      setEditCam(null);
      fetchUrlCameras();
    } finally { setSaving(false); }
  };

  /* ── delete ── */
  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`${API}/api/url-cameras/${id}`, { method: 'DELETE' });
      fetchUrlCameras();
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--color-background)', color: 'var(--color-on-surface)' }}>
      <div className="p-6 space-y-6 pb-12">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Nodes',  value: totalNodes,    color: 'var(--color-on-surface)', border: 'var(--color-outline-variant)' },
            { label: 'Active',       value: activeCount,   color: 'var(--color-primary)', border: 'var(--color-primary)' },
            { label: 'Feed Live',    value: liveFeedCount, color: '#16a34a', border: '#16a34a' },
            { label: 'Node Offline', value: offlineCount,  color: 'var(--color-outline)', border: 'var(--color-outline-variant)' },
          ].map(kpi => (
            <div key={kpi.label} className="p-5 flex flex-col justify-between rounded-2xl bg-white"
              style={{ border: `1px solid ${kpi.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-outline)' }}>{kpi.label}</p>
              <p className="text-3xl font-bold tracking-tighter" style={{ color: kpi.color, fontFamily: "'Manrope',sans-serif" }}>
                {kpi.value.toString().padStart(2, '0')}
              </p>
            </div>
          ))}
        </div>

        {/* ── Header bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 rounded-2xl bg-white"
          style={{ border: '1px solid var(--color-outline-variant)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div className="flex items-center gap-4">
            <div className="p-2.5 flex items-center justify-center rounded-xl"
              style={{ background: 'var(--color-surface-container)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)' }}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope',sans-serif" }}>
                Network Topology
              </h3>
              <p className="text-[9px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2" style={{ color: 'var(--color-outline)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse inline-block" />
                Source Management — {activeCount} Nodes Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {searchOpen && (
                  <motion.input initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    autoFocus type="text" placeholder="Search nodes..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 outline-none rounded-xl"
                    style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)' }}
                  />
                )}
              </AnimatePresence>
              <button onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearch(''); }}
                className="p-2.5 transition-all rounded-xl"
                style={searchOpen
                  ? { background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }
                  : { background: 'var(--color-surface-container-low)', color: 'var(--color-outline)', border: '1px solid var(--color-outline-variant)' }}>
                {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            {/* Add button */}
            <button onClick={() => { setShowAddModal(true); setViewMode('new'); }}
              className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all rounded-xl"
              style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0d6efd')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
              <Plus className="w-4 h-4" />
              New Node
            </button>
          </div>
        </div>

        {/* ── Camera Grid ── */}
        <motion.div initial="hidden" animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">

            {/* Local camera card — always first */}
            <LocalCameraCard
              key="local-camera"
              active={localIsOn}
              toggling={isCameraToggling}
              onToggle={toggleCamera}
            />

            {/* URL camera cards */}
            {filtered.map(cam => (
              <CameraCard key={cam.id} cam={cam}
                toggling={togglingIds.includes(cam.id)}
                onToggle={handleToggle}
                onToggleVisibility={handleToggleVisibility}
                onDelete={(id) => setDeleteConfirmId(id)}
                onEdit={(c) => { setEditCam({ ...c }); setShowAddModal(false); }}
              />
            ))}
          </AnimatePresence>

          {/* Empty state when no URL cameras + search is active */}
          {filtered.length === 0 && search && (
            <div className="col-span-full flex flex-col items-center justify-center py-20"
              style={{ border: '1px dashed rgba(36,128,255,0.06)', color: 'var(--color-outline-variant)' }}>
              <Video className="w-10 h-10 mb-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Matching Nodes</p>
            </div>
          )}
        </motion.div>

        {/* Empty state when no URL cameras at all */}
        {urlCameras.length === 0 && !search && (
          <div className="flex flex-col items-center justify-center py-20 relative overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid rgba(36,128,255,0.06)' }}>
            <LayoutGrid className="absolute inset-0 m-auto opacity-[0.03] scale-[5] pointer-events-none" style={{ color: 'var(--color-primary)' }} />
            <div className="w-16 h-16 flex items-center justify-center mb-6 cursor-pointer transition-all"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-outline-variant)' }}
              onClick={() => { setShowAddModal(true); setViewMode('new'); }}>
              <Plus className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope',sans-serif" }}>
              No URL Cameras Added
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest max-w-sm text-center mb-6" style={{ color: 'var(--color-outline)' }}>
              Add RTSP / HTTP camera URLs to extend surveillance beyond the local webcam.
            </p>
            <button onClick={() => { setShowAddModal(true); setViewMode('new'); }}
              className="px-8 py-3 text-[10px] font-bold tracking-widest uppercase rounded-xl"
              style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}>
              ADD URL CAMERA
            </button>
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl p-10 z-10 overflow-hidden rounded-3xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'rgba(10,88,202,0.06)', filter: 'blur(80px)', transform: 'translate(50%,-50%)' }} />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-2.5" style={{ background: 'rgba(36,128,255,0.08)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-primary)' }}>
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope',sans-serif" }}>
                      Initialize Command Stream
                    </h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--color-outline)' }}>
                      NODE_CLASS: SURVEILLANCE_ENDPOINT
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 transition-all"
                  style={{ color: 'var(--color-outline)', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.background = 'rgba(36,128,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(36,128,255,0.3)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5 p-1.5 mb-8 relative z-10"
                style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(36,128,255,0.06)' }}>
                {(['registry', 'new'] as const).map(tab => (
                  <button key={tab} onClick={() => setViewMode(tab)}
                    className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all"
                    style={viewMode === tab
                      ? { background: 'var(--color-primary)', color: 'var(--color-on-surface)' }
                      : { color: 'var(--color-outline)', background: 'transparent' }}>
                    {tab === 'registry' ? 'Registry Archive' : 'New Deployment'}
                  </button>
                ))}
              </div>

              <div className="relative z-10">
                {viewMode === 'registry' ? (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {urlCameras.length > 0 ? urlCameras.map(cam => {
                      const isToggling = togglingIds.includes(cam.id);
                      return (
                        <div key={cam.id} className="flex items-center justify-between p-4"
                          style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <div className="overflow-hidden pr-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-tight flex items-center gap-2" style={{ color: 'var(--color-on-surface)' }}>
                              {cam.name}
                              <span className="text-[8px] px-2 py-0.5 font-bold tracking-widest"
                                style={cam.active
                                  ? { background: 'rgba(0,255,133,0.08)', border: '1px solid rgba(0,255,133,0.2)', color: '#00ff85' }
                                  : { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-outline)' }}>
                                {cam.active ? 'ONLINE' : 'OFFLINE'}
                              </span>
                            </h4>
                            <p className="text-[9px] font-mono truncate mt-1" style={{ color: 'var(--color-outline)' }}>
                              SOURCE: {cam.url}
                            </p>
                          </div>
                          <button onClick={() => !isToggling && handleToggle(cam.id)} disabled={isToggling}
                            className="shrink-0 px-5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                            style={cam.active
                              ? { background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.2)', color: '#ba1a1a' }
                              : { background: 'rgba(36,128,255,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-primary)' }}>
                            {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isToggling ? 'SYNCING...' : cam.active ? 'TERMINATE' : 'INITIALIZE'}
                          </button>
                        </div>
                      );
                    }) : (
                      <div className="flex flex-col items-center py-16 gap-4" style={{ color: 'var(--color-outline-variant)' }}>
                        <Video className="w-10 h-10" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Registry Empty</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>
                        Stream Designation
                      </label>
                      <input type="text" required placeholder="E.G. SECTOR_SOUTH_GATE"
                        value={newCam.name} onChange={e => setNewCam({ ...newCam, name: e.target.value })}
                        className="w-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none rounded-xl"
                        style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>
                        Source Protocol (RTSP / HTTP)
                      </label>
                      <input type="text" required placeholder="rtsp://admin:pass@192.168.1.100:554/ch1"
                        value={newCam.url} onChange={e => setNewCam({ ...newCam, url: e.target.value })}
                        className="w-full px-4 py-3 text-[10px] font-mono outline-none rounded-xl"
                        style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }} />
                    </div>
                    <button type="submit" disabled={saving}
                      className="w-full py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all rounded-xl"
                      style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {saving ? 'EXECUTING PROTOCOL...' : 'DEPLOY SURVEILLANCE NODE'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editCam && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setEditCam(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg p-10 z-10 rounded-3xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5" style={{ background: 'rgba(36,128,255,0.08)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-primary)' }}>
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope',sans-serif" }}>
                      Update Node Manifest
                    </h3>
                    <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'var(--color-outline)' }}>NODE_CLASS: SURVEILLANCE_ENDPOINT</p>
                  </div>
                </div>
                <button onClick={() => setEditCam(null)} className="p-2" style={{ color: 'var(--color-outline)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(36,128,255,0.3)')}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>Stream Designation</label>
                  <input type="text" required value={editCam.name}
                    onChange={e => setEditCam({ ...editCam, name: e.target.value })}
                    className="w-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none rounded-xl"
                    style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>Source Protocol</label>
                  <input type="text" required value={editCam.url}
                    onChange={e => setEditCam({ ...editCam, url: e.target.value })}
                    className="w-full px-4 py-3 text-[10px] font-mono outline-none rounded-xl"
                    style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }} />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 rounded-xl"
                  style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'APPLYING CHANGES...' : 'APPLY MANIFEST CHANGES'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        open={deleteConfirmId !== null}
        title="Node Decommission"
        message={`Permanently remove node "${urlCameras.find(c => c.id === deleteConfirmId)?.name}"? This will stop the stream and delete it from the database.`}
        loading={deletingId !== null}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}





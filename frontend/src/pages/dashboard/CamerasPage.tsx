import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Plus, Trash2, Edit2, Search, X, Power, Loader2,
  Video, Activity, LayoutGrid, Eye, EyeOff, Save,
} from 'lucide-react';
import { useApp } from '../../layouts/AppLayout';
import { API } from '../../types/dashboard';
import type { UrlCamera } from '../../layouts/AppLayout';

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
        className="relative w-full max-w-sm p-8 z-10"
        style={{ background: '#111316', border: '1px solid rgba(255,68,102,0.3)' }}>
        <h3 className="text-sm font-bold tracking-widest uppercase mb-2" style={{ color: '#ffb4ab' }}>{title}</h3>
        <p className="text-[11px] mb-8 leading-relaxed" style={{ color: 'rgba(195,198,214,0.55)' }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all"
            style={{ border: '1px solid rgba(176,198,255,0.15)', color: '#8c909f' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,68,102,0.15)', border: '1px solid rgba(255,68,102,0.3)', color: '#ffb4ab' }}>
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── camera card ────────────────────────────────────────────────────────────── */
function CameraCard({ cam, onToggle, onDelete, onEdit, toggling }: {
  cam: UrlCamera & { active: boolean };
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (cam: UrlCamera) => void;
  toggling: boolean;
}) {
  return (
    <motion.div layout
      variants={{ hidden: { opacity: 0, scale: 0.95, y: 15 }, show: { opacity: 1, scale: 1, y: 0 } }}
      className="flex flex-col overflow-hidden group"
      style={{
        background: '#111316',
        border: `1px solid ${cam.active ? 'rgba(0,255,133,0.2)' : 'rgba(176,198,255,0.08)'}`,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Top row */}
      <div className="flex justify-between items-center px-5 pt-5 pb-2">
        <span className="text-[8px] font-bold tracking-widest uppercase px-2.5 py-1"
          style={{ background: 'rgba(176,198,255,0.05)', border: '1px solid rgba(176,198,255,0.08)', color: 'rgba(176,198,255,0.4)' }}>
          ID-{String(cam.id).padStart(3, '0')}
        </span>
        <button onClick={() => onEdit(cam)} className="transition-colors"
          style={{ color: 'rgba(176,198,255,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#b0c6ff')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(176,198,255,0.2)')}>
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main body */}
      <div className="flex items-center gap-4 px-5 pb-4">
        <div className="w-12 h-12 shrink-0 flex items-center justify-center transition-all"
          style={{
            background: cam.active ? 'rgba(0,255,133,0.08)' : 'rgba(176,198,255,0.04)',
            border: `1px solid ${cam.active ? 'rgba(0,255,133,0.3)' : 'rgba(176,198,255,0.08)'}`,
            color: cam.active ? '#00ff85' : 'rgba(176,198,255,0.25)',
          }}>
          <Camera className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-tight truncate" style={{ color: '#ccd8ff' }}>{cam.name}</h4>
          <p className="text-[9px] font-mono truncate mt-1" style={{ color: 'rgba(176,198,255,0.3)' }}>{cam.url}</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(176,198,255,0.05)', margin: '0 20px' }} />

      {/* Bottom toggles */}
      <div className="flex items-center justify-between px-5 py-4">
        {/* Analysis toggle (ON/OFF) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'rgba(176,198,255,0.25)' }}>Stream</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={cam.active}
              onChange={() => !toggling && onToggle(cam.id)} disabled={toggling} />
            <div className="w-8 h-4 rounded-full transition-all relative"
              style={{
                background: cam.active ? 'rgba(0,255,133,0.6)' : 'rgba(176,198,255,0.1)',
              }}>
              <div className="absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all"
                style={{ left: cam.active ? '18px' : '2px' }} />
            </div>
          </label>
        </div>

        {/* Status badge */}
        <span className="text-[8px] font-bold tracking-widest uppercase px-2.5 py-1"
          style={cam.active
            ? { background: 'rgba(0,255,133,0.08)', border: '1px solid rgba(0,255,133,0.25)', color: '#00ff85' }
            : { background: 'rgba(176,198,255,0.04)', border: '1px solid rgba(176,198,255,0.08)', color: 'rgba(176,198,255,0.3)' }
          }>
          {toggling ? '...' : cam.active ? 'ONLINE' : 'OFFLINE'}
        </span>

        {/* Delete */}
        <button onClick={() => onDelete(cam.id)}
          className="p-2 transition-all"
          style={{ background: 'rgba(176,198,255,0.04)', border: '1px solid rgba(176,198,255,0.08)', color: 'rgba(176,198,255,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,102,0.1)'; e.currentTarget.style.color = '#ffb4ab'; e.currentTarget.style.borderColor = 'rgba(255,68,102,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(176,198,255,0.04)'; e.currentTarget.style.color = 'rgba(176,198,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(176,198,255,0.08)'; }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── main page ──────────────────────────────────────────────────────────────── */
export default function CamerasPage() {
  const { urlCameras, fetchUrlCameras, toggleUrlCamera } = useApp();

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

  const filtered = urlCameras.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.url.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = urlCameras.filter(c => c.active).length;

  /* ── toggle ── */
  const handleToggle = async (id: number) => {
    setTogglingIds(p => [...p, id]);
    await toggleUrlCamera(id);
    setTogglingIds(p => p.filter(x => x !== id));
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
      // Delete old, add new with same id approach: simpler to delete + re-add
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
    <div className="h-full overflow-y-auto" style={{ background: '#0c0e11', color: '#e2e2e6' }}>
      <div className="p-6 space-y-6 pb-12">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Nodes',   value: urlCameras.length, color: '#b0c6ff',  bg: 'rgba(176,198,255,0.05)',  border: 'rgba(176,198,255,0.1)' },
            { label: 'Active',        value: activeCount,       color: '#00ff85',  bg: 'rgba(0,255,133,0.05)',   border: 'rgba(0,255,133,0.15)' },
            { label: 'Feed Live',     value: activeCount,       color: '#4dd9ff',  bg: 'rgba(77,217,255,0.05)',  border: 'rgba(77,217,255,0.15)' },
            { label: 'Node Offline',  value: urlCameras.length - activeCount, color: 'rgba(176,198,255,0.3)', bg: 'rgba(176,198,255,0.03)', border: 'rgba(176,198,255,0.06)' },
          ].map(kpi => (
            <div key={kpi.label} className="p-5 flex flex-col justify-between"
              style={{ background: kpi.bg, border: `1px solid ${kpi.border}` }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(176,198,255,0.4)' }}>{kpi.label}</p>
              <p className="text-3xl font-bold tracking-tighter" style={{ color: kpi.color, fontFamily: "'Manrope',sans-serif" }}>
                {kpi.value.toString().padStart(2, '0')}
              </p>
            </div>
          ))}
        </div>

        {/* ── Header bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5"
          style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.08)' }}>
          <div className="flex items-center gap-4">
            <div className="p-2.5 flex items-center justify-center"
              style={{ background: 'rgba(10,88,202,0.1)', border: '1px solid rgba(176,198,255,0.1)', color: '#b0c6ff' }}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ccd8ff', fontFamily: "'Manrope',sans-serif" }}>
                Network Topology
              </h3>
              <p className="text-[9px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2" style={{ color: 'rgba(176,198,255,0.35)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#b0c6ff] animate-pulse inline-block" />
                {activeCount} Nodes Online
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
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-2 outline-none"
                    style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.15)', color: '#b0c6ff' }}
                  />
                )}
              </AnimatePresence>
              <button onClick={() => { setSearchOpen(v => !v); if (searchOpen) setSearch(''); }}
                className="p-2.5 transition-all"
                style={searchOpen
                  ? { background: '#0a58ca', color: '#ccd8ff', border: '1px solid #0a58ca' }
                  : { background: '#1a1c1f', color: '#8c909f', border: '1px solid rgba(176,198,255,0.1)' }}>
                {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            {/* Add button */}
            <button onClick={() => { setShowAddModal(true); setViewMode('registry'); }}
              className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all"
              style={{ background: '#0a58ca', color: '#ccd8ff', border: '1px solid rgba(10,88,202,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0d6efd')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0a58ca')}>
              <Plus className="w-4 h-4" />
              New Node
            </button>
          </div>
        </div>

        {/* ── Camera Grid ── */}
        {filtered.length > 0 ? (
          <motion.div initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map(cam => (
                <CameraCard key={cam.id} cam={cam as UrlCamera & { active: boolean }}
                  toggling={togglingIds.includes(cam.id)}
                  onToggle={handleToggle}
                  onDelete={(id) => setDeleteConfirmId(id)}
                  onEdit={(c) => { setEditCam({ ...c }); setShowAddModal(false); }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 relative overflow-hidden"
            style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.06)' }}>
            <LayoutGrid className="absolute inset-0 m-auto opacity-[0.03] scale-[5] pointer-events-none" style={{ color: '#b0c6ff' }} />
            <div className="w-20 h-20 flex items-center justify-center mb-8 cursor-pointer transition-all"
              style={{ background: 'rgba(176,198,255,0.04)', border: '1px solid rgba(176,198,255,0.08)', color: 'rgba(176,198,255,0.2)' }}
              onClick={() => setShowAddModal(true)}>
              <Plus className="w-9 h-9" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-widest mb-3" style={{ color: '#ccd8ff', fontFamily: "'Manrope',sans-serif" }}>
              No Nodes Initialized
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest max-w-sm text-center mb-8" style={{ color: 'rgba(176,198,255,0.3)' }}>
              Network registry is empty. Add camera URLs to begin surveillance.
            </p>
            <button onClick={() => setShowAddModal(true)}
              className="px-8 py-3 text-[10px] font-bold tracking-widest uppercase"
              style={{ background: '#0a58ca', color: '#ccd8ff', border: '1px solid rgba(10,88,202,0.5)' }}>
              INIT COMMAND CENTER
            </button>
          </div>
        )}
      </div>

      {/* ── Add / Registry Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl p-10 z-10 overflow-hidden"
              style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.15)' }}>

              {/* Glow decor */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'rgba(10,88,202,0.06)', filter: 'blur(80px)', transform: 'translate(50%,-50%)' }} />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-2.5" style={{ background: 'rgba(10,88,202,0.1)', border: '1px solid rgba(176,198,255,0.1)', color: '#b0c6ff' }}>
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ccd8ff', fontFamily: "'Manrope',sans-serif" }}>
                      {viewMode === 'registry' ? 'Sync Established Node' : 'Initialize New Source'}
                    </h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'rgba(176,198,255,0.25)' }}>
                      NODE DEPLOYMENT PROTOCOLS ACTIVE
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 transition-all"
                  style={{ color: 'rgba(176,198,255,0.3)', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#b0c6ff'; e.currentTarget.style.borderColor = 'rgba(176,198,255,0.1)'; e.currentTarget.style.background = 'rgba(176,198,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(176,198,255,0.3)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5 p-1.5 mb-8 relative z-10"
                style={{ background: 'rgba(176,198,255,0.04)', border: '1px solid rgba(176,198,255,0.06)' }}>
                {(['registry', 'new'] as const).map(tab => (
                  <button key={tab} onClick={() => setViewMode(tab)}
                    className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all"
                    style={viewMode === tab
                      ? { background: '#0a58ca', color: '#ccd8ff' }
                      : { color: 'rgba(176,198,255,0.3)', background: 'transparent' }}>
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
                          style={{ background: 'rgba(176,198,255,0.03)', border: '1px solid rgba(176,198,255,0.07)' }}>
                          <div className="overflow-hidden pr-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-tight flex items-center gap-2" style={{ color: '#ccd8ff' }}>
                              {cam.name}
                              <span className="text-[8px] px-2 py-0.5 font-bold tracking-widest"
                                style={cam.active
                                  ? { background: 'rgba(0,255,133,0.08)', border: '1px solid rgba(0,255,133,0.2)', color: '#00ff85' }
                                  : { background: 'rgba(176,198,255,0.04)', border: '1px solid rgba(176,198,255,0.08)', color: 'rgba(176,198,255,0.3)' }}>
                                {cam.active ? 'ONLINE' : 'OFFLINE'}
                              </span>
                            </h4>
                            <p className="text-[9px] font-mono truncate mt-1" style={{ color: 'rgba(176,198,255,0.3)' }}>
                              SOURCE: {cam.url}
                            </p>
                          </div>
                          <button onClick={() => !isToggling && handleToggle(cam.id)} disabled={isToggling}
                            className="shrink-0 px-5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                            style={cam.active
                              ? { background: 'rgba(255,68,102,0.08)', border: '1px solid rgba(255,68,102,0.2)', color: '#ffb4ab' }
                              : { background: 'rgba(10,88,202,0.08)', border: '1px solid rgba(176,198,255,0.15)', color: '#b0c6ff' }}>
                            {isToggling && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isToggling ? 'SYNCING...' : cam.active ? 'TERMINATE' : 'INITIALIZE'}
                          </button>
                        </div>
                      );
                    }) : (
                      <div className="flex flex-col items-center py-16 gap-4" style={{ color: 'rgba(176,198,255,0.2)' }}>
                        <Camera className="w-10 h-10" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Registry Empty</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleAdd} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(176,198,255,0.35)' }}>
                        Stream Designation
                      </label>
                      <input type="text" required placeholder="E.G. SECTOR_SOUTH_GATE"
                        value={newCam.name} onChange={e => setNewCam({ ...newCam, name: e.target.value })}
                        className="w-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none"
                        style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.12)', color: '#ccd8ff' }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(176,198,255,0.35)' }}>
                        Source Protocol (RTSP / HTTP)
                      </label>
                      <input type="text" required placeholder="rtsp://admin:pass@192.168.1.100:554/ch1"
                        value={newCam.url} onChange={e => setNewCam({ ...newCam, url: e.target.value })}
                        className="w-full px-4 py-3 text-[10px] font-mono outline-none"
                        style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.12)', color: '#ccd8ff' }} />
                    </div>
                    <button type="submit" disabled={saving}
                      className="w-full py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                      style={{ background: '#0a58ca', color: '#ccd8ff', border: '1px solid rgba(10,88,202,0.5)' }}>
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
              className="relative w-full max-w-lg p-10 z-10"
              style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.15)' }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-2.5" style={{ background: 'rgba(10,88,202,0.1)', border: '1px solid rgba(176,198,255,0.1)', color: '#b0c6ff' }}>
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#ccd8ff', fontFamily: "'Manrope',sans-serif" }}>
                      Update Node Manifest
                    </h3>
                    <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: 'rgba(176,198,255,0.25)' }}>NODE_CLASS: SURVEILLANCE_ENDPOINT</p>
                  </div>
                </div>
                <button onClick={() => setEditCam(null)} className="p-2" style={{ color: 'rgba(176,198,255,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#b0c6ff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(176,198,255,0.3)')}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(176,198,255,0.35)' }}>Stream Designation</label>
                  <input type="text" required value={editCam.name}
                    onChange={e => setEditCam({ ...editCam, name: e.target.value })}
                    className="w-full px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none"
                    style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.12)', color: '#ccd8ff' }} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(176,198,255,0.35)' }}>Source Protocol</label>
                  <input type="text" required value={editCam.url}
                    onChange={e => setEditCam({ ...editCam, url: e.target.value })}
                    className="w-full px-4 py-3 text-[10px] font-mono outline-none"
                    style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.12)', color: '#ccd8ff' }} />
                </div>
                <button type="submit" disabled={saving}
                  className="w-full py-4 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3"
                  style={{ background: '#0a58ca', color: '#ccd8ff', border: '1px solid rgba(10,88,202,0.5)' }}>
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

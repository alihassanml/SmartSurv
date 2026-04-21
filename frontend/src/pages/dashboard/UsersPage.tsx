import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Mail, Trash2, RefreshCw, UserPlus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { API } from '../../types/dashboard';

interface User {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at?: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) { setError('Admin access required'); return; }
      if (!res.ok) { setError('Failed to load users'); return; }
      const data = await res.json();
      setUsers(data.users || data || []);
    } catch {
      setError('Cannot reach backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDelete = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API}/api/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        showSuccess(`User "${user.username}" removed`);
      } else {
        setError('Delete failed');
      }
    } catch {
      setError('Delete failed');
    } finally {
      setActionLoading(null);
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API}/api/auth/users/${user.id}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
        showSuccess(`User "${user.username}" ${user.is_active ? 'deactivated' : 'activated'}`);
      }
    } catch (_) {}
    finally { setActionLoading(null); }
  };

  const handleToggleAdmin = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API}/api/auth/users/${user.id}/admin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
        showSuccess(`User "${user.username}" is now ${!user.is_admin ? 'an Admin' : 'a regular User'}`);
      }
    } catch (_) {}
    finally { setActionLoading(null); }
  };

  const handleVerify = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API}/api/auth/users/${user.id}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_verified: true } : u));
        showSuccess(`User "${user.username}" manually verified`);
      }
    } catch (_) {}
    finally { setActionLoading(null); }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#0c0e11' }}>

      {/* Header */}
      <div className="shrink-0 px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(176,198,255,0.08)', background: '#111316' }}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ background: '#b0c6ff' }} />
          <div>
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'Manrope', sans-serif", color: '#ccd8ff' }}>
              USER MANAGEMENT
            </h2>
            <p className="text-[10px]" style={{ color: 'rgba(176,198,255,0.35)' }}>
              {users.length} operator{users.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all"
          style={{ border: '1px solid rgba(176,198,255,0.15)', color: '#8c909f', borderRadius: '0.25rem' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8c909f'; }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          REFRESH
        </button>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 text-xs font-bold"
            style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.3)', color: '#b0c6ff', borderRadius: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          >
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center gap-3" style={{ color: 'rgba(176,198,255,0.35)' }}>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading users...</span>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: 'rgba(255,180,171,0.6)' }}>
            <AlertCircle className="w-12 h-12" />
            <p className="text-sm font-bold">{error}</p>
            {error === 'Admin access required' && (
              <p className="text-xs" style={{ color: 'rgba(176,198,255,0.3)' }}>
                This page requires administrator privileges.
              </p>
            )}
            <button onClick={fetchUsers} className="px-4 py-2 text-xs font-bold uppercase"
              style={{ border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff', borderRadius: '0.25rem' }}>
              RETRY
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: 'rgba(176,198,255,0.2)' }}>
            <Users className="w-16 h-16" />
            <p className="text-sm tracking-[0.3em] font-bold">NO USERS FOUND</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Summary */}
            <div className="mb-6 grid grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: users.length, color: '#b0c6ff' },
                { label: 'Active', value: users.filter(u => u.is_active).length, color: '#b4c6f8' },
                { label: 'Verified', value: users.filter(u => u.is_verified).length, color: '#a6b8e9' },
                { label: 'Admins', value: users.filter(u => u.is_admin).length, color: '#ffd6f9' },
              ].map(stat => (
                <div key={stat.label} className="p-4 text-center"
                  style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.08)', borderRadius: '0.5rem' }}>
                  <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "'Manrope', sans-serif" }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(176,198,255,0.4)' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div style={{ border: '1px solid rgba(176,198,255,0.08)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-[9px] font-bold tracking-[0.2em] uppercase"
                style={{ background: '#1a1c1f', color: 'rgba(176,198,255,0.4)', borderBottom: '1px solid rgba(176,198,255,0.08)' }}>
                <div className="col-span-1">#</div>
                <div className="col-span-3">Username</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Rows */}
              {users.map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="grid grid-cols-12 gap-4 px-5 py-4 items-center"
                  style={{
                    borderBottom: idx < users.length - 1 ? '1px solid rgba(176,198,255,0.05)' : 'none',
                    background: '#111316',
                  }}
                >
                  <div className="col-span-1 text-[10px]" style={{ color: 'rgba(176,198,255,0.3)' }}>{idx + 1}</div>

                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(10,88,202,0.2)', color: '#b0c6ff', border: '1px solid rgba(176,198,255,0.15)', borderRadius: '50%' }}>
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate" style={{ color: '#e2e2e6' }}>{user.username}</span>
                  </div>

                  <div className="col-span-3 flex items-center gap-1.5 text-xs" style={{ color: 'rgba(176,198,255,0.5)' }}>
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="col-span-3 flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-bold px-2 py-0.5 w-fit"
                      style={user.is_active
                        ? { background: 'rgba(176,198,255,0.1)', color: '#b0c6ff', border: '1px solid rgba(176,198,255,0.2)', borderRadius: '0.125rem' }
                        : { background: 'rgba(255,180,171,0.08)', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.25)', borderRadius: '0.125rem' }
                      }>
                      {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 w-fit"
                      style={user.is_verified
                        ? { color: 'rgba(176,198,255,0.4)' }
                        : { color: 'rgba(255,180,171,0.5)' }
                      }>
                      {user.is_verified ? '✓ Verified' : '⚠ Unverified'}
                    </span>
                    {user.is_admin && (
                      <span className="text-[9px] font-bold px-2 py-0.5 w-fit"
                        style={{ background: 'rgba(255,214,249,0.1)', color: '#ffd6f9', border: '1px solid rgba(255,214,249,0.25)', borderRadius: '0.125rem' }}>
                        ADMIN
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {!user.is_verified && (
                      <button
                        onClick={() => handleVerify(user)}
                        disabled={actionLoading === user.id}
                        title="Manually verify"
                        className="p-1.5 transition-all disabled:opacity-50"
                        style={{ border: '1px solid rgba(176,198,255,0.15)', color: '#8c909f', borderRadius: '0.25rem' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8c909f'; }}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleAdmin(user)}
                      disabled={actionLoading === user.id}
                      title={user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      className="p-1.5 transition-all disabled:opacity-50"
                      style={{ border: '1px solid rgba(255,214,249,0.15)', color: user.is_admin ? '#ffd6f9' : '#8c909f', borderRadius: '0.25rem' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffd6f9'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = user.is_admin ? '#ffd6f9' : '#8c909f'; }}
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={actionLoading === user.id}
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                      className="p-1.5 transition-all disabled:opacity-50"
                      style={{ border: '1px solid rgba(176,198,255,0.15)', color: '#8c909f', borderRadius: '0.25rem' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8c909f'; }}
                    >
                      {actionLoading === user.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => setDeleteConfirm(user)}
                      disabled={actionLoading === user.id}
                      title="Delete user"
                      className="p-1.5 transition-all disabled:opacity-50"
                      style={{ border: '1px solid rgba(255,180,171,0.15)', color: '#8c909f', borderRadius: '0.25rem' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ffb4ab'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,180,171,0.4)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8c909f'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,180,171,0.15)'; }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="fixed inset-0 bg-black/80 z-[200] backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs p-7 z-[201] text-center"
              style={{ background: '#111316', border: '1px solid rgba(255,180,171,0.25)', borderRadius: '0.5rem' }}>
              <Trash2 className="w-10 h-10 mx-auto mb-4" style={{ color: '#ffb4ab' }} />
              <p className="text-sm font-bold mb-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#ccd8ff' }}>Delete User?</p>
              <p className="text-xs mb-6" style={{ color: 'rgba(176,198,255,0.4)' }}>
                <span style={{ color: '#ffb4ab' }}>{deleteConfirm.username}</span> will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 text-xs font-bold uppercase"
                  style={{ border: '1px solid rgba(176,198,255,0.2)', color: '#8c909f', borderRadius: '0.25rem' }}>
                  CANCEL
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 text-xs font-bold uppercase flex items-center justify-center gap-2"
                  style={{ background: '#93000a', color: '#ffdad6', borderRadius: '0.25rem' }}>
                  {actionLoading === deleteConfirm.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  DELETE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;

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
  is_approved: boolean;
  role: string;
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

  const handleApprove = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`${API}/api/auth/users/${user.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_approved: true } : u));
        showSuccess(`User "${user.username}" approved`);
      }
    } catch (_) {}
    finally { setActionLoading(null); }
  };

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
    <div className="h-full flex flex-col" style={{ background: 'var(--color-background)' }}>

      {/* Header */}
      <div className="shrink-0 px-6 py-4 flex items-center justify-between bg-white"
        style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--color-primary)] shadow-[0_4px_12px_rgba(36,128,255,0.2)]">
            <Users className="text-white" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}>
              User Management
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
              {users.length} operator{users.length !== 1 ? 's' : ''} registered
            </p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all hover:bg-[var(--color-surface-container)]"
          style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Success toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-2xl"
            style={{ background: 'white', border: '1px solid #16a34a', color: '#16a34a', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
          >
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center gap-3" style={{ color: 'var(--color-outline)' }}>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading users...</span>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: 'rgba(255,180,171,0.6)' }}>
            <AlertCircle className="w-12 h-12" />
            <p className="text-sm font-bold">{error}</p>
            {error === 'Admin access required' && (
              <p className="text-xs" style={{ color: 'var(--color-outline)' }}>
                This page requires administrator privileges.
              </p>
            )}
            <button onClick={fetchUsers} className="px-4 py-2 text-xs font-bold uppercase"
              style={{ border: '1px solid rgba(36,128,255,0.15)', color: 'var(--color-primary)', borderRadius: '0.25rem' }}>
              RETRY
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: 'var(--color-outline-variant)' }}>
            <Users className="w-16 h-16" />
            <p className="text-sm tracking-[0.3em] font-bold">NO USERS FOUND</p>
          </div>
        ) : (
          <div className="w-full">
            {/* Summary */}
            <div className="mb-6 grid grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: users.length, color: 'var(--color-primary)' },
                { label: 'Active', value: users.filter(u => u.is_active).length, color: '#16a34a' },
                { label: 'Verified', value: users.filter(u => u.is_verified).length, color: 'var(--color-on-surface)' },
                { label: 'Admins', value: users.filter(u => u.is_admin).length, color: '#a855f7' },
              ].map(stat => (
                <div key={stat.label} className="p-4 text-center bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                  style={{ border: '1px solid var(--color-outline-variant)' }}>
                  <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "'Manrope', sans-serif" }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-outline)' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]" style={{ border: '1px solid var(--color-outline-variant)' }}>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-bold"
                style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-outline)', borderBottom: '1px solid var(--color-outline-variant)' }}>
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
                    borderBottom: idx < users.length - 1 ? '1px solid var(--color-outline-variant)' : 'none',
                    background: 'white',
                  }}
                >
                  <div className="col-span-1 text-[10px]" style={{ color: 'var(--color-outline)' }}>{idx + 1}</div>

                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(36,128,255,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '50%' }}>
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--color-on-surface)' }}>{user.username}</span>
                  </div>

                  <div className="col-span-3 flex items-center gap-1.5 text-xs" style={{ color: 'rgba(36,128,255,0.5)' }}>
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="col-span-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full w-fit"
                      style={user.is_active
                        ? { background: 'rgba(22,163,74,0.1)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }
                        : { background: 'rgba(186,26,26,0.08)', color: '#ba1a1a', border: '1px solid rgba(186,26,26,0.2)' }
                      }>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {user.is_verified ? (
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--color-outline)', border: '1px solid var(--color-outline-variant)' }}>✓ Verified</span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,180,171,0.08)', color: '#ba1a1a', border: '1px solid rgba(186,26,26,0.15)' }}>⚠ Unverified</span>
                    )}
                    {user.is_admin && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full w-fit"
                        style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                        Admin
                      </span>
                    )}
                    {!user.is_approved && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700" style={{ border: '1px solid rgba(251,191,36,0.3)' }}>
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {!user.is_approved && (
                      <button
                        onClick={() => handleApprove(user)}
                        disabled={actionLoading === user.id}
                        title="Approve user"
                        className="p-1.5 rounded-lg transition-all disabled:opacity-50 hover:bg-green-50"
                        style={{ border: '1px solid rgba(22,163,74,0.3)', color: '#16a34a' }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!user.is_verified && (
                      <button
                        onClick={() => handleVerify(user)}
                        disabled={actionLoading === user.id}
                        title="Manually verify"
                        className="p-1.5 rounded-lg transition-all disabled:opacity-50 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                        style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)' }}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleAdmin(user)}
                      disabled={actionLoading === user.id}
                      title={user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-50"
                      style={{ border: `1px solid ${user.is_admin ? 'rgba(168,85,247,0.3)' : 'var(--color-outline-variant)'}`, color: user.is_admin ? '#a855f7' : 'var(--color-outline)', background: user.is_admin ? 'rgba(168,85,247,0.08)' : 'transparent' }}
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={actionLoading === user.id}
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg transition-all disabled:opacity-50 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                      style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)' }}
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
                      className="p-1.5 rounded-lg transition-all disabled:opacity-50 hover:bg-red-50"
                      style={{ border: '1px solid rgba(186,26,26,0.2)', color: '#ba1a1a' }}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xs p-7 z-[201] text-center rounded-3xl"
              style={{ background: 'white', border: '1px solid var(--color-outline-variant)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <Trash2 className="w-10 h-10 mx-auto mb-4" style={{ color: '#ba1a1a' }} />
              <p className="text-sm font-bold mb-1" style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}>Delete User?</p>
              <p className="text-xs mb-6" style={{ color: 'var(--color-outline)' }}>
                <span style={{ color: '#ba1a1a' }}>{deleteConfirm.username}</span> will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all hover:bg-[var(--color-surface-container)]"
                  style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl flex items-center justify-center gap-2"
                  style={{ background: '#ba1a1a', color: '#ffffff', border: '1px solid #ba1a1a' }}>
                  {actionLoading === deleteConfirm.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
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





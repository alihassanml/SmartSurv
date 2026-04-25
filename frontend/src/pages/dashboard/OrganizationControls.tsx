import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, CheckCircle, XCircle, Search, Settings as SettingsIcon, Bell, Building } from 'lucide-react';
import { API } from '../../types/dashboard';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  organization_type: string | null;
  organization_address: string | null;
  allowed_notifications: string; // JSON string
}

const OrganizationControls: React.FC = () => {
  const [orgs, setOrgs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const detectionLabels = ["person", "knife", "gun", "smoking", "violence", "watchlist_match"];
  const token = localStorage.getItem('token');

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const allUsers: User[] = data.users || [];
      setOrgs(allUsers.filter(u => u.role === 'organization'));
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleToggleNotification = (label: string) => {
    if (!selectedOrg) return;
    const current = JSON.parse(selectedOrg.allowed_notifications || '[]');
    const next = current.includes(label) 
        ? current.filter((l: string) => l !== label) 
        : [...current, label];
    
    setSelectedOrg({ ...selectedOrg, allowed_notifications: JSON.stringify(next) });
  };

  const handleSaveSettings = async () => {
    if (!selectedOrg) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/users/${selectedOrg.id}/org-settings`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          allowed_notifications: JSON.parse(selectedOrg.allowed_notifications),
          organization_type: selectedOrg.organization_type,
          organization_address: selectedOrg.organization_address
        })
      });
      if (res.ok) {
          setOrgs(prev => prev.map(o => o.id === selectedOrg.id ? selectedOrg : o));
          // Show success toast
      }
    } catch (_) {}
    finally { setSaving(false); }
  };

  const filteredOrgs = orgs.filter(o => 
    o.username.toLowerCase().includes(search.toLowerCase()) || 
    o.organization_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 bg-white border-b border-[var(--color-outline-variant)] flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--color-primary)] shadow-[0_4px_12px_rgba(36,128,255,0.2)]">
              <Building className="text-white" size={18} />
            </div>
            <div>
                <h2 className="text-sm font-bold tracking-wide">Organization Management</h2>
                <p className="text-xs text-[var(--color-outline)]">Manage access and notification rules for agencies</p>
            </div>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" size={14} />
            <input 
                type="text" 
                placeholder="Search organizations..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] rounded-xl text-xs outline-none focus:border-[var(--color-primary)] transition-all w-64"
            />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Org List */}
        <div className="w-80 border-r border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] overflow-y-auto p-4 space-y-2">
            {loading ? (
                <p className="text-center py-10 text-xs font-bold animate-pulse text-[var(--color-outline)]">Loading...</p>
            ) : filteredOrgs.length === 0 ? (
                <p className="text-center py-10 text-xs text-[var(--color-outline)]">No organizations found</p>
            ) : filteredOrgs.map(org => (
                <div 
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedOrg?.id === org.id 
                        ? 'bg-white border-[var(--color-primary)] shadow-[0_4px_16px_rgba(36,128,255,0.1)]' 
                        : 'bg-white border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
                    }`}
                >
                    <p className="text-xs font-bold text-[var(--color-on-surface)] mb-1">{org.username.toUpperCase()}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-outline)]">
                        <Shield size={10} />
                        {org.organization_type || 'No type set'}
                    </div>
                </div>
            ))}
        </div>

        {/* Settings Panel */}
        <div className="flex-1 p-8 overflow-y-auto">
            {selectedOrg ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
                    <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)] pb-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-outline-variant)]">
                                <Building size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--color-on-surface)]">{selectedOrg.username.toUpperCase()}</h3>
                                <p className="text-xs text-[var(--color-outline)] mt-0.5">{selectedOrg.email}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="px-5 py-2.5 text-xs font-bold tracking-wider rounded-xl transition-all disabled:opacity-50 hover:opacity-90"
                            style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}
                        >
                            {saving ? 'Saving...' : 'Save Config'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Profile Info */}
                        <div className="bg-white rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
                            <h4 className="text-xs font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                                <Shield size={14} className="text-[var(--color-primary)]" /> Profile Data
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-outline)] mb-2">Station Type</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedOrg.organization_type || ''}
                                            onChange={e => setSelectedOrg({...selectedOrg, organization_type: e.target.value})}
                                            className="w-full appearance-none bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:bg-white p-3 text-xs rounded-xl font-bold text-[var(--color-on-surface)] outline-none transition-all"
                                        >
                                            <option value="" disabled>Select Type...</option>
                                            <option value="Police Station">Police Station</option>
                                            <option value="Hospital">Hospital Facility</option>
                                            <option value="Security Agency">Security Agency</option>
                                            <option value="Corporate Office">Corporate Office</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-outline)]">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-outline)] mb-2">Physical Address</label>
                                    <textarea 
                                        value={selectedOrg.organization_address || ''}
                                        onChange={e => setSelectedOrg({...selectedOrg, organization_address: e.target.value})}
                                        placeholder="Enter full address..."
                                        className="w-full bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:bg-white p-3 text-xs rounded-xl font-bold text-[var(--color-on-surface)] outline-none transition-all min-h-[100px] resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="bg-white rounded-2xl p-6 border border-[var(--color-outline-variant)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
                            <h4 className="text-xs font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                                <Bell size={14} className="text-[var(--color-primary)]" /> Notification Filters
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                {detectionLabels.map(label => {
                                    const isAllowed = JSON.parse(selectedOrg.allowed_notifications || '[]').includes(label);
                                    return (
                                        <div 
                                            key={label}
                                            onClick={() => handleToggleNotification(label)}
                                            className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all border ${
                                                isAllowed 
                                                ? 'border-[var(--color-primary)] shadow-[0_2px_8px_rgba(36,128,255,0.12)]' 
                                                : 'bg-[var(--color-surface-container-low)] border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]'
                                            }`}
                                            style={isAllowed ? { background: 'var(--color-primary)' } : {}}
                                        >
                                            <span className={`text-xs font-bold capitalize ${isAllowed ? 'text-white' : 'text-[var(--color-on-surface)]'}`}>
                                                {label.replace(/_/g, ' ')}
                                            </span>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isAllowed ? 'bg-white/20' : 'bg-[var(--color-outline-variant)]/30'}`}>
                                                {isAllowed ? <CheckCircle size={12} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-outline)]" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-[var(--color-outline-variant)] opacity-40">
                    <SettingsIcon size={48} className="mb-4" />
                    <p className="text-xs font-bold tracking-wide">Select an organization to manage</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationControls;

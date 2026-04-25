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
    <div className="h-full flex flex-col bg-[#e8ecf0]">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 bg-[#e0e3e5] border-b border-[rgba(0,0,0,0.1)] flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Building className="text-[#2480ff]" size={20} />
            <div>
                <h2 className="text-sm font-black tracking-widest uppercase">Organization Management</h2>
                <p className="text-[10px] text-[#74777d]">Manage access and notification rules for agencies</p>
            </div>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74777d]" size={14} />
            <input 
                type="text" 
                placeholder="Search organizations..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#e8ecf0] border border-[rgba(0,0,0,0.1)] rounded-lg text-xs outline-none focus:border-[#2480ff] transition-all w-64"
            />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Org List */}
        <div className="w-80 border-r border-[rgba(0,0,0,0.1)] bg-white/50 overflow-y-auto p-4 space-y-3">
            {loading ? (
                <p className="text-center py-10 text-xs font-bold animate-pulse text-[#74777d]">FETCHING_RECORDS...</p>
            ) : filteredOrgs.map(org => (
                <div 
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedOrg?.id === org.id 
                        ? 'bg-white border-[#2480ff] shadow-md' 
                        : 'bg-white/80 border-transparent hover:border-[rgba(0,0,0,0.1)]'
                    }`}
                >
                    <p className="text-xs font-black text-[#191c1e] mb-1">{org.username.toUpperCase()}</p>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#74777d]">
                        <Shield size={10} />
                        {org.organization_type || 'N/A'}
                    </div>
                </div>
            ))}
        </div>

        {/* Settings Panel */}
        <div className="flex-1 p-8 overflow-y-auto">
            {selectedOrg ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-8">
                    <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#2480ff]/10 rounded-2xl flex items-center justify-center text-[#2480ff] border border-[#2480ff]/20">
                                <Building size={24} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter text-[#191c1e]">{selectedOrg.username.toUpperCase()}</h3>
                                <p className="text-[10px] font-bold text-[#74777d] tracking-widest uppercase">{selectedOrg.email}</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="px-6 py-2 bg-[#2480ff] text-white text-[11px] font-black tracking-widest rounded-lg shadow-lg hover:bg-[#1a6fef] transition-all disabled:opacity-50"
                        >
                            {saving ? 'UPDATING...' : 'SAVE CONFIG'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Profile Info */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black tracking-[0.3em] text-[#74777d] uppercase flex items-center gap-2">
                                    <Shield size={12} /> PROFILE_DATA
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] font-black text-[#c4c6cc] uppercase">Station Type</label>
                                        <select 
                                            value={selectedOrg.organization_type || ''}
                                            onChange={e => setSelectedOrg({...selectedOrg, organization_type: e.target.value})}
                                            className="w-full mt-1 bg-white border border-[rgba(0,0,0,0.1)] p-2 text-xs rounded-lg font-bold"
                                        >
                                            <option value="Police Station">POLICE_STATION</option>
                                            <option value="Hospital">HOSPITAL_FACILITY</option>
                                            <option value="Security Agency">SECURITY_AGENCY</option>
                                            <option value="Corporate Office">CORPORATE_OFFICE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-[#c4c6cc] uppercase">Address</label>
                                        <textarea 
                                            value={selectedOrg.organization_address || ''}
                                            onChange={e => setSelectedOrg({...selectedOrg, organization_address: e.target.value})}
                                            className="w-full mt-1 bg-white border border-[rgba(0,0,0,0.1)] p-2 text-xs rounded-lg font-bold min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black tracking-[0.3em] text-[#74777d] uppercase flex items-center gap-2">
                                    <Bell size={12} /> NOTIFICATION_FILTER
                                </h4>
                                <div className="space-y-2">
                                    {detectionLabels.map(label => {
                                        const isAllowed = JSON.parse(selectedOrg.allowed_notifications || '[]').includes(label);
                                        return (
                                            <div 
                                                key={label}
                                                onClick={() => handleToggleNotification(label)}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                                    isAllowed ? 'bg-[#2480ff]/5 border-[#2480ff]/20 text-[#2480ff]' : 'bg-white border-[rgba(0,0,0,0.06)] text-[#74777d]'
                                                }`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                                                {isAllowed ? <CheckCircle size={14} /> : <XCircle size={14} className="opacity-20" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#c4c6cc] opacity-40">
                    <SettingsIcon size={48} className="mb-4" />
                    <p className="text-xs font-black tracking-widest uppercase">Select an organization to manage</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationControls;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Mail, Shield, Search, Sliders, RefreshCw, Volume2,
  LogOut, Radio, ChevronDown,
} from 'lucide-react';
import type { ClassThreshold } from '../../types/dashboard';

interface SettingsPanelProps {
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  username: string;
  userEmail: string;
  emailEnabled: boolean;
  toggleEmail: () => void;
  privacyMode: boolean;
  togglePrivacy: () => void;
  watchlist: string[];
  setIsAddingTarget: (v: boolean) => void;
  personLogEnabled: boolean;
  togglePersonLog: () => void;
  classThresholds: ClassThreshold[];
  thresholdsLoading: boolean;
  handleThresholdChange: (name: string, value: number) => void;
  handleSaveThresholds: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  handleSoundToggle: (name: string) => void;
  smtpEmail: string | null;
  systemIp: string | null;
  handleLogout: () => void;

  currentSource: '0' | 'remote' | 'hybrid';
  handleSourceChange: (src: '0' | 'remote' | 'hybrid') => void;
  isReconnecting: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  showSettings,
  setShowSettings,
  username,
  userEmail,
  emailEnabled,
  toggleEmail,
  privacyMode,
  togglePrivacy,
  watchlist,
  setIsAddingTarget,
  personLogEnabled,
  togglePersonLog,
  classThresholds,
  thresholdsLoading,
  handleThresholdChange,
  handleSaveThresholds,
  saveStatus,
  handleSoundToggle,
  smtpEmail,
  systemIp,
  handleLogout,

  currentSource,
  handleSourceChange,
  isReconnecting,
}) => {
  return (
    <AnimatePresence>
      {showSettings && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="fixed inset-0 bg-white/95 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-[560px] bg-white border-l border-[rgba(0,0,0,0.1)] z-50 flex flex-col shadow-[−20px_0_60px_rgba(0,0,0,0.8)]"
          >
            {/* Panel Header */}
            <div className="flex justify-between items-center p-6 border-b border-[rgba(0,0,0,0.08)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[var(--color-primary)]" />
                <span className="text-sm font-bold tracking-[0.25em]">SYSTEM_PARAMETERS</span>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 hover:bg-[rgba(36,128,255,0.06)] border border-transparent hover:border-[rgba(36,128,255,0.15)] transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* User Profile */}
              <div className="p-6 border-b border-[rgba(0,0,0,0.07)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-2 border-[rgba(36,128,255,0.4)] flex items-center justify-center bg-[rgba(36,128,255,0.05)]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] opacity-30 tracking-[0.2em] mb-0.5">AUTHORIZED_OPERATOR</p>
                    <p className="text-lg font-bold tracking-tight uppercase">{username}</p>
                    <p className="text-[12px] text-[var(--color-primary)]/60 mt-0.5 lowercase">{userEmail}</p>
                    <div className="mt-2 text-[10px] tracking-widest text-[var(--color-primary)]/40 border border-[rgba(0,0,0,0.1)] px-2 py-0.5 inline-block">
                      LEVEL_01_ACCESS
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera Source */}
              <div className="p-6 border-b border-[rgba(0,0,0,0.07)]">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-3.5 h-3.5" style={{ color: currentSource === 'hybrid' ? '#47607e' : currentSource === 'remote' ? '#ff4466' : 'var(--color-primary)' }} />
                  <div>
                    <span className="text-[12px] font-bold tracking-[0.2em]">CAMERA_SOURCE</span>
                    <p className="text-[10px] opacity-30 mt-0.5 uppercase">Feed Input Channel</p>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={currentSource}
                    onChange={(e) => handleSourceChange(e.target.value as '0' | 'remote' | 'hybrid')}
                    disabled={isReconnecting}
                    className="w-full appearance-none bg-[rgba(247,249,251,0.9)] border text-[12px] font-bold tracking-widest px-4 py-3 focus:outline-none transition-all cursor-pointer uppercase"
                    style={{
                      color: currentSource === 'hybrid' ? '#47607e' : currentSource === 'remote' ? '#ff4466' : 'var(--color-primary)',
                      borderColor: currentSource === 'hybrid' ? 'rgba(180,198,248,0.4)' : currentSource === 'remote' ? 'rgba(255,68,102,0.4)' : 'rgba(36,128,255,0.15)',
                    }}
                  >
                    <option value="0">Source: Local Camera</option>
                    <option value="remote">Source: Remote Node</option>
                    <option value="hybrid">Source: Hybrid</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <ChevronDown className="w-3 h-3 text-[var(--color-primary)]" />
                  </div>
                </div>
              </div>



              {/* Email Alerts */}
              <div className="p-6 border-b border-[rgba(0,0,0,0.07)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <div>
                      <span className="text-[12px] font-bold tracking-[0.2em]">COMM_LINK_SYSTEM</span>
                      <p className="text-[10px] opacity-30 mt-0.5 uppercase">Email Incident Alerts</p>
                    </div>
                  </div>
                  <button
                    id="email-toggle-btn"
                    onClick={toggleEmail}
                    className="relative w-10 h-5 border transition-all duration-300 shrink-0"
                    style={emailEnabled
                      ? { borderColor: 'var(--color-primary)', background: 'rgba(0,0,0,0.07)' }
                      : { borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.04)' }
                    }
                  >
                    <div
                      className={`absolute top-0.5 bottom-0.5 w-3.5 transition-all duration-300 ${
                        emailEnabled ? 'right-0.5 bg-[var(--color-primary)] shadow-[0_0_6px_var(--color-primary)]' : 'left-0.5 bg-red-700'
                      }`}
                    />
                  </button>
                </div>
                {!emailEnabled && (
                  <p className="text-[10px] text-red-400/60 mt-2 tracking-wider">▸ External email alerts disabled</p>
                )}
              </div>

              {/* Privacy Guard */}
              <div className="p-6 border-b border-[rgba(0,0,0,0.07)] bg-[rgba(0,180,255,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-[#47607e]" />
                    <div>
                      <span className="text-[12px] font-bold tracking-[0.2em] text-[#47607e]">PRIVACY_GUARD</span>
                      <p className="text-[10px] opacity-30 mt-0.5 uppercase">Selective Face Redaction</p>
                    </div>
                  </div>
                  <button
                    onClick={togglePrivacy}
                    className="relative w-10 h-5 border transition-all duration-300 shrink-0"
                    style={privacyMode
                      ? { borderColor: '#47607e', background: 'rgba(180,198,248,0.08)' }
                      : { borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.04)' }
                    }
                  >
                    <div
                      className={`absolute top-0.5 bottom-0.5 w-3.5 transition-all duration-300 ${
                        privacyMode ? 'right-0.5 bg-[#b4c6f8] shadow-[0_0_6px_#b4c6f8]' : 'left-0.5 bg-red-700'
                      }`}
                    />
                  </button>
                </div>
                {privacyMode && (
                  <p className="text-[10px] text-[#47607e]/60 mt-2 tracking-wider animate-pulse">🎯 Selective decryption active</p>
                )}
              </div>

              {/* Watchlist */}
              <div className="p-6 border-b border-[rgba(0,0,0,0.07)]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span className="text-[12px] font-bold tracking-[0.2em]">WATCHLIST_STATUS</span>
                  </div>
                </div>
                <div className="border border-[rgba(0,0,0,0.1)] bg-[rgba(36,128,255,0.02)] p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] opacity-40 uppercase">Active Targets:</span>
                      <span className="text-[13px] font-bold text-[var(--color-primary)]">{watchlist.length}</span>
                    </div>
                    <button
                      onClick={() => { setShowSettings(false); setIsAddingTarget(true); }}
                      className="w-full py-2 bg-[rgba(0,0,0,0.08)] border border-[rgba(36,128,255,0.3)] text-[11px] font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all"
                    >
                      MANAGE_WATCHLIST
                    </button>
                  </div>
                </div>
              </div>

              {/* Person Log Toggle */}
              <div className="p-6 border-b border-[rgba(0,0,0,0.07)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <div>
                      <span className="text-[12px] font-bold tracking-[0.2em]">PERSON_LOG</span>
                      <p className="text-[10px] opacity-30 mt-0.5 uppercase">Re-ID sidebar &amp; face crops</p>
                    </div>
                  </div>
                  <button
                    id="person-log-toggle-btn"
                    onClick={togglePersonLog}
                    className="relative w-10 h-5 border transition-all duration-300 shrink-0"
                    style={personLogEnabled
                      ? { borderColor: 'var(--color-primary)', background: 'rgba(0,0,0,0.07)' }
                      : { borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.04)' }
                    }
                  >
                    <div
                      className={`absolute top-0.5 bottom-0.5 w-3.5 transition-all duration-300 ${
                        personLogEnabled ? 'right-0.5 bg-[var(--color-primary)] shadow-[0_0_6px_var(--color-primary)]' : 'left-0.5 bg-red-700'
                      }`}
                    />
                  </button>
                </div>
                {!personLogEnabled && (
                  <p className="text-[10px] text-red-400/60 mt-2 tracking-wider">▸ Person panel + face images hidden</p>
                )}
              </div>

              {/* Detection Thresholds */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Sliders className="w-3.5 h-3.5 text-[#47607e]" />
                  <span className="text-[12px] font-bold tracking-[0.2em]">ACTIVITY_CONFIDENCE</span>
                </div>

                {thresholdsLoading ? (
                  <div className="flex items-center gap-2 py-8 opacity-30 text-[12px] justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    FETCHING_CLASSES...
                  </div>
                ) : (
                  <div className="space-y-6">
                    {classThresholds.map(cls => (
                      <div key={cls.name} className="group border-b border-[rgba(36,128,255,0.06)] pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Volume2 className={`w-3 h-3 ${cls.sound_enabled ? 'text-[#47607e]' : 'text-red-600/50'}`} />
                            <span className="text-[10px] opacity-40 uppercase">Audio: {cls.name}</span>
                          </div>
                          <button
                            onClick={() => handleSoundToggle(cls.name)}
                            className="relative w-8 h-4 border transition-all duration-300"
                            style={cls.sound_enabled
                              ? { borderColor: '#47607e', background: 'rgba(180,198,248,0.05)' }
                              : { borderColor: 'rgba(255,68,102,0.3)' }
                            }
                          >
                            <div className={`absolute top-0.5 bottom-0.5 w-2.5 transition-all duration-300 ${cls.sound_enabled ? 'right-0.5 bg-[#b4c6f8] shadow-[0_0_6px_#b4c6f8]' : 'left-0.5 bg-red-800'}`} />
                          </button>
                        </div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[11px] font-bold opacity-30 group-hover:opacity-70 transition-opacity uppercase">{cls.name}</span>
                          <span className="text-sm font-bold tabular-nums text-[#47607e]">
                            {(cls.threshold * 100).toFixed(0)}<span className="text-[9px] opacity-40 ml-0.5">%</span>
                          </span>
                        </div>
                        <input
                          type="range" min={0} max={1} step={0.01} value={cls.threshold}
                          onChange={e => handleThresholdChange(cls.name, parseFloat(e.target.value))}
                          className="w-full appearance-none h-0.5 rounded-none outline-none cursor-pointer range-hacker"
                          style={{ background: `linear-gradient(to right, #b4c6f8 0%, #b4c6f8 ${cls.threshold * 100}%, rgba(180,198,248,0.1) ${cls.threshold * 100}%, rgba(180,198,248,0.1) 100%)` }}
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleSaveThresholds}
                      disabled={saveStatus === 'saving'}
                      className="w-full py-3 border-2 font-bold text-[12px] tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2"
                      style={saveStatus === 'saved'
                        ? { background: '#47607e', color: '#000', borderColor: '#47607e' }
                        : saveStatus === 'error'
                        ? { background: '#ff4466', color: '#fff', borderColor: '#ff4466' }
                        : { background: 'transparent', color: '#47607e', borderColor: '#47607e' }
                      }
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
                      {saveStatus === 'saving' ? 'UPLOADING...' : saveStatus === 'saved' ? '✓ SYNCED' : 'SYNC_THRESHOLDS'}
                    </button>
                  </div>
                )}
              </div>

              {/* System Diagnostics */}
              <div className="p-6 border-t border-[rgba(0,0,0,0.07)] bg-[rgba(36,128,255,0.02)]">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-3.5 h-3.5 text-[var(--color-primary)]/40" />
                  <span className="text-[11px] font-bold tracking-[0.2em] text-[var(--color-primary)]/40 uppercase">System Diagnostics</span>
                </div>
                <div className="space-y-2 text-[11px] font-sans opacity-50">
                  <div className="flex justify-between">
                    <span>CORE_LATENCY:</span>
                    <span className="text-[var(--color-primary)]">12ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SMTP_LINK:</span>
                    <span className={smtpEmail ? 'text-[var(--color-primary)]' : 'text-red-500'}>{smtpEmail || 'NOT_CONFIGURED'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LOCAL_UPLINK:</span>
                    <span className="text-[var(--color-primary)]">{systemIp || 'FETCHING...'}</span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="p-6 border-t border-[rgba(0,0,0,0.07)]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 text-[12px] font-bold tracking-[0.2em] uppercase border border-red-500/30 text-red-400/60 hover:text-red-400 hover:border-red-500/60 hover:bg-red-500/05 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  TERMINATE_SESSION
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;

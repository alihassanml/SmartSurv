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
  showHeatmap: boolean;
  setShowHeatmap: (v: boolean) => void;
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
  showHeatmap,
  setShowHeatmap,
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
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-[560px] bg-[#111316] border-l border-[rgba(176,198,255,0.12)] z-50 flex flex-col shadow-[−20px_0_60px_rgba(0,0,0,0.8)]"
          >
            {/* Panel Header */}
            <div className="flex justify-between items-center p-6 border-b border-[rgba(176,198,255,0.1)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[#b0c6ff]" />
                <span className="text-sm font-bold tracking-[0.25em]">SYSTEM_PARAMETERS</span>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 hover:bg-[rgba(176,198,255,0.06)] border border-transparent hover:border-[rgba(176,198,255,0.2)] transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">

              {/* User Profile */}
              <div className="p-6 border-b border-[rgba(176,198,255,0.08)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border-2 border-[rgba(176,198,255,0.4)] flex items-center justify-center bg-[rgba(176,198,255,0.05)]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] opacity-30 tracking-[0.2em] mb-0.5">AUTHORIZED_OPERATOR</p>
                    <p className="text-lg font-bold tracking-tight uppercase">{username}</p>
                    <p className="text-[12px] text-[#b0c6ff]/60 mt-0.5 lowercase">{userEmail}</p>
                    <div className="mt-2 text-[10px] tracking-widest text-[#b0c6ff]/40 border border-[rgba(176,198,255,0.15)] px-2 py-0.5 inline-block">
                      LEVEL_01_ACCESS
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera Source */}
              <div className="p-6 border-b border-[rgba(176,198,255,0.08)]">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-3.5 h-3.5" style={{ color: currentSource === 'hybrid' ? '#b4c6f8' : currentSource === 'remote' ? '#ff4466' : '#b0c6ff' }} />
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
                    className="w-full appearance-none bg-[rgba(12,13,16,0.8)] border text-[12px] font-bold tracking-widest px-4 py-3 focus:outline-none transition-all cursor-pointer uppercase"
                    style={{
                      color: currentSource === 'hybrid' ? '#b4c6f8' : currentSource === 'remote' ? '#ff4466' : '#b0c6ff',
                      borderColor: currentSource === 'hybrid' ? 'rgba(180,198,248,0.4)' : currentSource === 'remote' ? 'rgba(255,68,102,0.4)' : 'rgba(176,198,255,0.2)',
                    }}
                  >
                    <option value="0">Source: Local Camera</option>
                    <option value="remote">Source: Remote Node</option>
                    <option value="hybrid">Source: Hybrid</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <ChevronDown className="w-3 h-3 text-[#b0c6ff]" />
                  </div>
                </div>
              </div>

              {/* Heatmap Toggle */}
              <div className="p-6 border-b border-[rgba(176,198,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-[#b0c6ff]" />
                    <div>
                      <span className="text-[12px] font-bold tracking-[0.2em]">HEATMAP_OVERLAY</span>
                      <p className="text-[10px] opacity-30 mt-0.5 uppercase">Activity heat visualization</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className="relative w-10 h-5 border transition-all duration-300 shrink-0"
                    style={showHeatmap
                      ? { borderColor: '#b0c6ff', background: 'rgba(176,198,255,0.08)' }
                      : { borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.04)' }
                    }
                  >
                    <div
                      className={`absolute top-0.5 bottom-0.5 w-3.5 transition-all duration-300 ${
                        showHeatmap ? 'right-0.5 bg-[#b0c6ff] shadow-[0_0_6px_#b0c6ff]' : 'left-0.5 bg-red-700'
                      }`}
                    />
                  </button>
                </div>
                {showHeatmap && (
                  <p className="text-[10px] text-[#b0c6ff]/50 mt-2 tracking-wider animate-pulse">▸ Heatmap overlay active on feeds</p>
                )}
              </div>

              {/* Email Alerts */}
              <div className="p-6 border-b border-[rgba(176,198,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#b0c6ff]" />
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
                      ? { borderColor: '#b0c6ff', background: 'rgba(176,198,255,0.08)' }
                      : { borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.04)' }
                    }
                  >
                    <div
                      className={`absolute top-0.5 bottom-0.5 w-3.5 transition-all duration-300 ${
                        emailEnabled ? 'right-0.5 bg-[#b0c6ff] shadow-[0_0_6px_#b0c6ff]' : 'left-0.5 bg-red-700'
                      }`}
                    />
                  </button>
                </div>
                {!emailEnabled && (
                  <p className="text-[10px] text-red-400/60 mt-2 tracking-wider">▸ External email alerts disabled</p>
                )}
              </div>

              {/* Privacy Guard */}
              <div className="p-6 border-b border-[rgba(176,198,255,0.08)] bg-[rgba(0,180,255,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-[#b4c6f8]" />
                    <div>
                      <span className="text-[12px] font-bold tracking-[0.2em] text-[#b4c6f8]">PRIVACY_GUARD</span>
                      <p className="text-[10px] opacity-30 mt-0.5 uppercase">Selective Face Redaction</p>
                    </div>
                  </div>
                  <button
                    onClick={togglePrivacy}
                    className="relative w-10 h-5 border transition-all duration-300 shrink-0"
                    style={privacyMode
                      ? { borderColor: '#b4c6f8', background: 'rgba(180,198,248,0.08)' }
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
                  <p className="text-[10px] text-[#b4c6f8]/60 mt-2 tracking-wider animate-pulse">🎯 Selective decryption active</p>
                )}
              </div>

              {/* Watchlist */}
              <div className="p-6 border-b border-[rgba(176,198,255,0.08)]">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-[#b0c6ff]" />
                    <span className="text-[12px] font-bold tracking-[0.2em]">WATCHLIST_STATUS</span>
                  </div>
                </div>
                <div className="border border-[rgba(176,198,255,0.15)] bg-[rgba(176,198,255,0.02)] p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] opacity-40 uppercase">Active Targets:</span>
                      <span className="text-[13px] font-bold text-[#b0c6ff]">{watchlist.length}</span>
                    </div>
                    <button
                      onClick={() => { setShowSettings(false); setIsAddingTarget(true); }}
                      className="w-full py-2 bg-[rgba(176,198,255,0.1)] border border-[rgba(176,198,255,0.3)] text-[11px] font-bold text-[#b0c6ff] hover:bg-[#b0c6ff] hover:text-black transition-all"
                    >
                      MANAGE_WATCHLIST
                    </button>
                  </div>
                </div>
              </div>

              {/* Person Log Toggle */}
              <div className="p-6 border-b border-[rgba(176,198,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#b0c6ff]" />
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
                      ? { borderColor: '#b0c6ff', background: 'rgba(176,198,255,0.08)' }
                      : { borderColor: 'rgba(255,68,102,0.4)', background: 'rgba(255,68,102,0.04)' }
                    }
                  >
                    <div
                      className={`absolute top-0.5 bottom-0.5 w-3.5 transition-all duration-300 ${
                        personLogEnabled ? 'right-0.5 bg-[#b0c6ff] shadow-[0_0_6px_#b0c6ff]' : 'left-0.5 bg-red-700'
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
                  <Sliders className="w-3.5 h-3.5 text-[#b4c6f8]" />
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
                      <div key={cls.name} className="group border-b border-[rgba(176,198,255,0.06)] pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Volume2 className={`w-3 h-3 ${cls.sound_enabled ? 'text-[#b4c6f8]' : 'text-red-600/50'}`} />
                            <span className="text-[10px] opacity-40 uppercase">Audio: {cls.name}</span>
                          </div>
                          <button
                            onClick={() => handleSoundToggle(cls.name)}
                            className="relative w-8 h-4 border transition-all duration-300"
                            style={cls.sound_enabled
                              ? { borderColor: '#b4c6f8', background: 'rgba(180,198,248,0.05)' }
                              : { borderColor: 'rgba(255,68,102,0.3)' }
                            }
                          >
                            <div className={`absolute top-0.5 bottom-0.5 w-2.5 transition-all duration-300 ${cls.sound_enabled ? 'right-0.5 bg-[#b4c6f8] shadow-[0_0_6px_#b4c6f8]' : 'left-0.5 bg-red-800'}`} />
                          </button>
                        </div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[11px] font-bold opacity-30 group-hover:opacity-70 transition-opacity uppercase">{cls.name}</span>
                          <span className="text-sm font-bold tabular-nums text-[#b4c6f8]">
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
                        ? { background: '#b4c6f8', color: '#000', borderColor: '#b4c6f8' }
                        : saveStatus === 'error'
                        ? { background: '#ff4466', color: '#fff', borderColor: '#ff4466' }
                        : { background: 'transparent', color: '#b4c6f8', borderColor: '#b4c6f8' }
                      }
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
                      {saveStatus === 'saving' ? 'UPLOADING...' : saveStatus === 'saved' ? '✓ SYNCED' : 'SYNC_THRESHOLDS'}
                    </button>
                  </div>
                )}
              </div>

              {/* System Diagnostics */}
              <div className="p-6 border-t border-[rgba(176,198,255,0.08)] bg-[rgba(176,198,255,0.02)]">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-3.5 h-3.5 text-[#b0c6ff]/40" />
                  <span className="text-[11px] font-bold tracking-[0.2em] text-[#b0c6ff]/40 uppercase">System Diagnostics</span>
                </div>
                <div className="space-y-2 text-[11px] font-sans opacity-50">
                  <div className="flex justify-between">
                    <span>CORE_LATENCY:</span>
                    <span className="text-[#b0c6ff]">12ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SMTP_LINK:</span>
                    <span className={smtpEmail ? 'text-[#b0c6ff]' : 'text-red-500'}>{smtpEmail || 'NOT_CONFIGURED'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LOCAL_UPLINK:</span>
                    <span className="text-[#b0c6ff]">{systemIp || 'FETCHING...'}</span>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="p-6 border-t border-[rgba(176,198,255,0.08)]">
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

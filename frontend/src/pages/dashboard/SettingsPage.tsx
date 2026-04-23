import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Shield, Sliders, RefreshCw, Volume2, Radio, ChevronDown,
} from 'lucide-react';
import { useApp } from '../../layouts/AppLayout';

const Toggle: React.FC<{ on: boolean; onToggle: () => void; id?: string }> = ({ on, onToggle, id }) => (
  <button
    id={id}
    onClick={onToggle}
    className="relative w-10 h-5 border transition-all duration-300 shrink-0"
    style={on
      ? { borderColor: '#2480ff', background: 'rgba(0,0,0,0.1)' }
      : { borderColor: 'rgba(186,26,26,0.25)', background: 'rgba(255,180,171,0.04)' }
    }
  >
    <div className={`absolute top-0.5 bottom-0.5 w-3.5 transition-all duration-300 ${on ? 'right-0.5 shadow-[0_0_6px_#2480ff]' : 'left-0.5 bg-red-700'}`}
      style={on ? { background: '#2480ff' } : {}} />
  </button>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.5rem', overflow: 'hidden' }}>
    {children}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; noBorder?: boolean }> = ({ title, children, noBorder }) => (
  <div className="px-6 py-5" style={noBorder ? {} : { borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
    <p className="text-[9px] font-bold tracking-[0.3em] uppercase mb-5" style={{ color: '#74777d' }}>{title}</p>
    {children}
  </div>
);

const ToggleRow: React.FC<{ icon: React.ReactNode; label: string; desc: string; on: boolean; onToggle: () => void; id?: string }> = ({ icon, label, desc, on, onToggle, id }) => (
  <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(36,128,255,0.05)' }}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: 'rgba(36,128,255,0.06)', borderRadius: '0.25rem' }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold" style={{ color: '#191c1e' }}>{label}</p>
      </div>
    </div>
    <Toggle on={on} onToggle={onToggle} id={id} />
  </div>
);

const SettingsPage: React.FC = () => {
  const {
    username, userEmail,
    emailEnabled, toggleEmail,
    privacyMode, togglePrivacy,
    personLogEnabled, togglePersonLog,
    currentSource, handleSourceChange,
    classThresholds, thresholdsLoading, handleThresholdChange, handleSaveThresholds, saveStatus,
    handleSoundToggle,
    smtpEmail, systemIp,
    handleLogout,
    isReconnecting,
    watchlist,
    browserSoundEnabled, toggleBrowserSound,
  } = useApp();

  const navigate = useNavigate();

  return (
    <div className="h-full overflow-auto" style={{ background: '#e8ecf0' }}>
      <div className="p-4">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-3">

            {/* Profile */}
            <Card>
              <Section title="Operator Profile">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 flex items-center justify-center text-xl font-bold shrink-0"
                    style={{ background: 'rgba(36,128,255,0.15)', color: '#2480ff', border: '1px solid rgba(36,128,255,0.15)', borderRadius: '0.5rem' }}>
                    {username[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] mb-0.5" style={{ color: '#74777d' }}>AUTHORIZED OPERATOR</p>
                    <p className="text-base font-bold truncate" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>{username}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(36,128,255,0.5)' }}>{userEmail}</p>
                    <div className="mt-2 inline-block px-2 py-0.5 text-[8px] font-bold tracking-widest"
                      style={{ border: '1px solid rgba(36,128,255,0.15)', color: 'rgba(36,128,255,0.5)', borderRadius: '0.125rem' }}>
                      LEVEL_01_ACCESS
                    </div>
                  </div>
                </div>
              </Section>
            </Card>

            {/* Camera Source */}
            <Card>
              <Section title="Camera Source">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-3.5 h-3.5 shrink-0" style={{ color: '#2480ff' }} />
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em]" style={{ color: '#191c1e' }}>INPUT CHANNEL</p>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={currentSource}
                    onChange={e => handleSourceChange(e.target.value as '0' | 'remote' | 'hybrid')}
                    disabled={isReconnecting}
                    className="w-full appearance-none px-4 py-3 text-xs font-bold tracking-widest uppercase cursor-pointer"
                    style={{ background: '#f2f4f6', border: '1px solid rgba(36,128,255,0.15)', color: '#2480ff', borderRadius: '0.25rem', outline: 'none' }}
                  >
                    <option value="0">Local Camera</option>
                    <option value="remote">Remote Node</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#74777d' }} />
                </div>
              </Section>
            </Card>

            {/* Watchlist */}
            <Card>
              <Section title="Watchlist Status">
                <div className="flex items-center justify-between p-4"
                  style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.25rem' }}>
                  <div>
                    <p className="text-3xl font-black" style={{ color: '#2480ff', fontFamily: "'Manrope', sans-serif" }}>{watchlist.length}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#74777d' }}>Active Targets</p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/watchlist')}
                    className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all"
                    style={{ background: '#2480ff', color: '#191c1e', borderRadius: '0.25rem' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0d6efd'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2480ff'; }}
                  >
                    MANAGE
                  </button>
                </div>
              </Section>
            </Card>

            {/* System Info */}
            <Card>
              <Section title="System Info" noBorder>
                <div className="space-y-0">
                  {[
                    ['SMTP Link', smtpEmail || 'NOT CONFIGURED'],
                    ['Local IP', systemIp || 'Fetching...'],
                    ['API Port', '8000'],
                    ['Detection Mode', 'Hybrid (Activity + Person)'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid rgba(36,128,255,0.05)' }}>
                      <span className="text-xs" style={{ color: '#74777d' }}>{k}</span>
                      <span className="text-xs font-medium" style={{ color: smtpEmail === null && k === 'SMTP Link' ? '#ba1a1a' : '#2480ff' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </Card>
          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-3">

            {/* Notifications */}
            <Card>
              <Section title="Notifications">
                <div className="-mt-2">
                  <ToggleRow icon={<Volume2 className="w-4 h-4" style={{ color: '#2480ff' }} />} label="Browser Sound" desc="Play alert sound in this browser" on={browserSoundEnabled} onToggle={toggleBrowserSound} />
                  <ToggleRow icon={<Mail className="w-4 h-4" style={{ color: '#2480ff' }} />} label="Email Alerts" desc="Send incident snapshots via SMTP" on={emailEnabled} onToggle={toggleEmail} id="email-toggle-btn" />
                </div>
              </Section>
            </Card>

            {/* Privacy & Display */}
            <Card>
              <Section title="Privacy & Display">
                <div className="-mt-2">
                  <ToggleRow icon={<Shield className="w-4 h-4" style={{ color: '#47607e' }} />} label="Privacy Guard" desc="Selective face redaction on feeds" on={privacyMode} onToggle={togglePrivacy} />
                  <ToggleRow icon={<User className="w-4 h-4" style={{ color: '#2480ff' }} />} label="Person Log Panel" desc="Show Re-ID sidebar and face crops" on={personLogEnabled} onToggle={togglePersonLog} id="person-log-toggle-btn" />
                </div>
              </Section>
            </Card>

            {/* Detection Thresholds */}
            <Card>
              <Section title="Detection Thresholds" noBorder>
                <p className="text-[10px] -mt-3 mb-5" style={{ color: '#74777d' }}>Adjust confidence levels per class</p>
                {thresholdsLoading ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-xs" style={{ color: '#74777d' }}>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading classes...
                  </div>
                ) : classThresholds.length === 0 ? (
                  <p className="text-center py-6 text-xs" style={{ color: '#74777d' }}>No detection classes found</p>
                ) : (
                  <div className="space-y-5">
                    {classThresholds.map(cls => (
                      <div key={cls.name}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-3 h-3" style={{ color: cls.sound_enabled ? '#47607e' : 'rgba(186,26,26,0.25)' }} />
                            <span className="text-xs font-medium" style={{ color: '#44474c' }}>{cls.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold tabular-nums" style={{ color: '#47607e' }}>
                              {(cls.threshold * 100).toFixed(0)}%
                            </span>
                            <button
                              onClick={() => handleSoundToggle(cls.name)}
                              className="relative w-8 h-4 border transition-all duration-300"
                              style={cls.sound_enabled
                                ? { borderColor: '#47607e', background: 'rgba(180,198,248,0.05)' }
                                : { borderColor: 'rgba(255,180,171,0.3)' }
                              }
                            >
                              <div className={`absolute top-0.5 bottom-0.5 w-2.5 transition-all duration-300 ${cls.sound_enabled ? 'right-0.5' : 'left-0.5 bg-red-800'}`}
                                style={cls.sound_enabled ? { background: '#47607e' } : {}} />
                            </button>
                          </div>
                        </div>
                        <input
                          type="range" min={0} max={1} step={0.01} value={cls.threshold}
                          onChange={e => handleThresholdChange(cls.name, parseFloat(e.target.value))}
                          className="w-full appearance-none h-0.5 outline-none cursor-pointer range-hacker"
                          style={{ background: `linear-gradient(to right, #b4c6f8 0%, #b4c6f8 ${cls.threshold * 100}%, rgba(180,198,248,0.12) ${cls.threshold * 100}%, rgba(180,198,248,0.12) 100%)` }}
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleSaveThresholds}
                      disabled={saveStatus === 'saving'}
                      className="w-full py-3 font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 mt-2"
                      style={saveStatus === 'saved'
                        ? { background: '#47607e', color: '#000', borderRadius: '0.25rem' }
                        : saveStatus === 'error'
                        ? { background: '#93000a', color: '#ffdad6', borderRadius: '0.25rem' }
                        : { background: 'transparent', color: '#47607e', border: '1px solid rgba(180,198,248,0.4)', borderRadius: '0.25rem' }
                      }
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
                      {saveStatus === 'saving' ? 'SAVING...' : saveStatus === 'saved' ? '✓ SAVED' : saveStatus === 'error' ? '✗ ERROR' : 'SAVE THRESHOLDS'}
                    </button>
                  </div>
                )}
              </Section>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;





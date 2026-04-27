import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Shield, Sliders, RefreshCw, Volume2, Radio, ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Toggle: React.FC<{ on: boolean; onToggle: () => void; id?: string }> = ({ on, onToggle, id }) => (
  <button
    id={id}
    onClick={onToggle}
    className="relative w-11 h-6 rounded-full transition-all duration-300 shrink-0"
    style={on
      ? { background: 'var(--color-primary)', border: '2px solid var(--color-primary)' }
      : { background: 'var(--color-outline-variant)', border: '2px solid var(--color-outline-variant)' }
    }
  >
    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${on ? 'right-0.5' : 'left-0.5'}`} />
  </button>
);

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]" style={{ border: '1px solid var(--color-outline-variant)' }}>
    {children}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; noBorder?: boolean }> = ({ title, children, noBorder }) => (
  <div className="px-6 py-5" style={noBorder ? {} : { borderBottom: '1px solid var(--color-outline-variant)' }}>
    <p className="text-xs font-bold mb-4" style={{ color: 'var(--color-on-surface-variant)' }}>{title}</p>
    {children}
  </div>
);

const ToggleRow: React.FC<{ icon: React.ReactNode; label: string; desc: string; on: boolean; onToggle: () => void; id?: string }> = ({ icon, label, desc, on, onToggle, id }) => (
  <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--color-outline)' }}>{desc}</p>
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
    dataSettings, updateDataSettings,
  } = useApp();

  const navigate = useNavigate();

  return (
    <div className="h-full overflow-auto" style={{ background: 'var(--color-background)' }}>
      <div className="p-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* ── Left column ── */}
          <div className="flex flex-col gap-3">

            {/* Profile */}
            <Card>
              <Section title="Operator Profile">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 flex items-center justify-center text-xl font-bold rounded-full shrink-0"
                    style={{ background: 'var(--color-primary)', color: '#ffffff' }}>
                    {username[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs mb-0.5" style={{ color: 'var(--color-outline)' }}>Authorized Operator</p>
                    <p className="text-base font-bold truncate" style={{ color: 'var(--color-on-surface)', fontFamily: "'Manrope', sans-serif" }}>{username}</p>
                    <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--color-primary)' }}>{userEmail}</p>
                    <div className="mt-2 inline-block px-3 py-1 text-xs font-medium rounded-full"
                      style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)' }}>
                      Level 1 Access
                    </div>
                  </div>
                </div>
              </Section>
            </Card>

            {/* Camera Source */}
            <Card>
              <Section title="Camera Source">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.15em]" style={{ color: 'var(--color-on-surface)' }}>INPUT CHANNEL</p>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={currentSource}
                    onChange={e => handleSourceChange(e.target.value as '0' | 'remote' | 'hybrid')}
                    disabled={isReconnecting}
                    className="w-full appearance-none px-4 py-3 text-sm font-medium cursor-pointer rounded-xl"
                    style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)', outline: 'none' }}
                  >
                    <option value="0">Local Camera</option>
                    <option value="remote">Remote Node</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-outline)' }} />
                </div>
              </Section>
            </Card>

            {/* Watchlist */}
            <Card>
              <Section title="Watchlist Status">
                <div className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)' }}>
                  <div>
                    <p className="text-3xl font-bold" style={{ color: 'var(--color-primary)', fontFamily: "'Manrope', sans-serif" }}>{watchlist.length}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>Active Targets</p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/watchlist')}
                    className="px-5 py-2.5 text-sm font-medium rounded-xl transition-all hover:opacity-90"
                    style={{ background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }}
                  >
                    Manage
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
                      <span className="text-xs" style={{ color: 'var(--color-outline)' }}>{k}</span>
                      <span className="text-xs font-medium" style={{ color: smtpEmail === null && k === 'SMTP Link' ? '#ba1a1a' : 'var(--color-primary)' }}>{v}</span>
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
                  <ToggleRow icon={<Volume2 className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />} label="Browser Sound" desc="Play alert sound in this browser" on={browserSoundEnabled} onToggle={toggleBrowserSound} />
                  <ToggleRow icon={<Mail className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />} label="Email Alerts" desc="Send incident snapshots via SMTP" on={emailEnabled} onToggle={toggleEmail} id="email-toggle-btn" />
                </div>
              </Section>
            </Card>

            {/* Privacy & Display */}
            <Card>
              <Section title="Privacy & Display">
                <div className="-mt-2">
                  <ToggleRow icon={<Shield className="w-4 h-4" style={{ color: '#47607e' }} />} label="Privacy Guard" desc="Selective face redaction on feeds" on={privacyMode} onToggle={togglePrivacy} />
                  <ToggleRow icon={<User className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />} label="Person Log Panel" desc="Show Re-ID sidebar and face crops" on={personLogEnabled} onToggle={togglePersonLog} id="person-log-toggle-btn" />
                </div>
              </Section>
            </Card>

            {/* Data Retention & History */}
            <Card>
              <Section title="Data Retention & History" noBorder>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>Display Buffer</label>
                      <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{dataSettings.display_days} Days</span>
                    </div>
                    <p className="text-[11px] mb-3" style={{ color: 'var(--color-outline)' }}>How many days of history to show on Dashboard charts</p>
                    <input 
                      type="range" min={1} max={30} step={1} 
                      value={dataSettings.display_days}
                      onChange={(e) => updateDataSettings(parseInt(e.target.value), dataSettings.retention_days)}
                      className="w-full appearance-none h-1.5 rounded-full outline-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${(dataSettings.display_days / 30) * 100}%, var(--color-surface-container) ${(dataSettings.display_days / 30) * 100}%, var(--color-surface-container) 100%)` }}
                    />
                  </div>

                  <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-outline-variant)' }}>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>Auto-Delete Policy</label>
                      <span className="text-xs font-bold" style={{ color: '#ba1a1a' }}>{dataSettings.retention_days} Days</span>
                    </div>
                    <p className="text-[11px] mb-3" style={{ color: 'var(--color-outline)' }}>Alerts older than this will be permanently deleted</p>
                    <input 
                      type="range" min={1} max={365} step={1} 
                      value={dataSettings.retention_days}
                      onChange={(e) => updateDataSettings(dataSettings.display_days, parseInt(e.target.value))}
                      className="w-full appearance-none h-1.5 rounded-full outline-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #ba1a1a 0%, #ba1a1a ${(dataSettings.retention_days / 365) * 100}%, var(--color-surface-container) ${(dataSettings.retention_days / 365) * 100}%, var(--color-surface-container) 100%)` }}
                    />
                  </div>
                </div>
              </Section>
            </Card>

            {/* Detection Thresholds */}
            <Card>
              <Section title="Detection Thresholds" noBorder>
                <p className="text-[10px] -mt-3 mb-5" style={{ color: 'var(--color-outline)' }}>Adjust confidence levels per class</p>
                {thresholdsLoading ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-xs" style={{ color: 'var(--color-outline)' }}>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading classes...
                  </div>
                ) : classThresholds.length === 0 ? (
                  <p className="text-center py-6 text-xs" style={{ color: 'var(--color-outline)' }}>No detection classes found</p>
                ) : (
                  <div className="space-y-5">
                    {classThresholds.map(cls => (
                      <div key={cls.name}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-3 h-3" style={{ color: cls.sound_enabled ? '#47607e' : 'rgba(186,26,26,0.25)' }} />
                            <span className="text-xs font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>{cls.name}</span>
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
                          className="w-full appearance-none h-1.5 rounded-full outline-none cursor-pointer"
                          style={{ background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${cls.threshold * 100}%, var(--color-surface-container) ${cls.threshold * 100}%, var(--color-surface-container) 100%)` }}
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleSaveThresholds}
                      disabled={saveStatus === 'saving'}
                      className="w-full py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                      style={saveStatus === 'saved'
                        ? { background: '#16a34a', color: '#ffffff', border: '1px solid #16a34a' }
                        : saveStatus === 'error'
                        ? { background: '#ba1a1a', color: '#ffffff', border: '1px solid #ba1a1a' }
                        : { background: 'var(--color-primary)', color: '#ffffff', border: '1px solid var(--color-primary)' }
                      }
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} />
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '✗ Error' : 'Save Thresholds'}
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





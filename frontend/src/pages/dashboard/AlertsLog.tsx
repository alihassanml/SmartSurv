import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, ShieldAlert, User, MapPin, Download,
  Activity, CheckCircle, X, Eye, Camera, Clock,
} from 'lucide-react';
import { useApp } from '../../layouts/AppLayout';
import type { Alert } from '../../types/dashboard';

type FilterSeverity = 'ALL' | 'CRITICAL' | 'HIGH' | 'ALERT' | 'MATCH';

const getSeverity = (alert: Alert): 'match' | 'critical' | 'high' | 'alert' => {
  if (alert.is_person_search_match) return 'match';
  const labels = alert.detections.map(d => d.label.toLowerCase());
  if (labels.some(l => l.includes('weapon') || l.includes('knife') || l.includes('gun') || l.includes('pistol'))) return 'critical';
  if (labels.some(l => l.includes('fight') || l.includes('violence'))) return 'high';
  return 'alert';
};

const SEV_MAP = {
  match:    { color: '#ffb4ab', bg: 'rgba(255,180,171,0.1)',  border: 'rgba(255,180,171,0.4)', label: 'MATCH',    Icon: ShieldAlert },
  critical: { color: '#ff6b6b', bg: 'rgba(147,0,10,0.15)',   border: 'rgba(255,107,107,0.5)', label: 'CRITICAL', Icon: ShieldAlert },
  high:     { color: '#ffa94d', bg: 'rgba(255,169,77,0.08)', border: 'rgba(255,169,77,0.35)', label: 'HIGH',     Icon: AlertTriangle },
  alert:    { color: '#b0c6ff', bg: 'rgba(176,198,255,0.06)', border: 'rgba(176,198,255,0.2)', label: 'ALERT',   Icon: Shield },
};

const AlertsLog: React.FC = () => {
  const { alerts } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('ALL');
  const [filterQuery, setFilterQuery] = useState('');
  const [viewingAlert, setViewingAlert] = useState<Alert | null>(null);

  const metrics = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter(a => getSeverity(a) === 'critical').length;
    const matches = alerts.filter(a => a.is_person_search_match).length;
    const feeds = new Set(alerts.map(a => (a as any).feed_id).filter(Boolean)).size;
    return { total, critical, matches, feeds };
  }, [alerts]);

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (filterSeverity !== 'ALL') {
        const sev = getSeverity(a);
        if (filterSeverity === 'MATCH'    && sev !== 'match')    return false;
        if (filterSeverity === 'CRITICAL' && sev !== 'critical') return false;
        if (filterSeverity === 'HIGH'     && sev !== 'high')     return false;
        if (filterSeverity === 'ALERT'    && sev !== 'alert')    return false;
      }
      if (filterQuery) {
        const q = filterQuery.toLowerCase();
        return (
          a.detections.some(d => d.label.toLowerCase().includes(q)) ||
          a.timestamp?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, filterSeverity, filterQuery]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Severity', 'Detections', 'Confidence', 'Location', 'Watchlist Match'];
    const rows = filtered.map(a => {
      const sev = getSeverity(a);
      const labels = a.detections.map(d => d.label).join('; ');
      const conf = a.detections.length
        ? (Math.max(...a.detections.map(d => d.confidence)) * 100).toFixed(0) + '%'
        : 'N/A';
      return [
        `"${a.timestamp}"`,
        `"${sev.toUpperCase()}"`,
        `"${labels}"`,
        `"${conf}"`,
        `"${a.location?.id ?? 'N/A'}"`,
        `"${a.is_person_search_match ? 'YES' : 'NO'}"`,
      ];
    });
    const csv = 'data:text/csv;charset=utf-8,﻿' + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `smartsurv_alerts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const FILTERS: { key: FilterSeverity; label: string }[] = [
    { key: 'ALL',      label: 'All' },
    { key: 'CRITICAL', label: 'Critical' },
    { key: 'HIGH',     label: 'High' },
    { key: 'ALERT',    label: 'Alert' },
    { key: 'MATCH',    label: 'Watchlist' },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: '#0c0e11' }}>

      {/* ── Fullscreen modal ── */}
      <AnimatePresence>
        {viewingAlert && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingAlert(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-4xl flex flex-col md:flex-row overflow-hidden z-10"
              style={{ background: '#111316', border: '1px solid rgba(176,198,255,0.15)', borderRadius: '0.5rem', maxHeight: '85vh' }}
            >
              {/* Corner accents */}
              {[['top-3 left-3 border-t-2 border-l-2',''],['top-3 right-3 border-t-2 border-r-2',''],['bottom-3 left-3 border-b-2 border-l-2',''],['bottom-3 right-3 border-b-2 border-r-2','']].map(([cls], i) => (
                <div key={i} className={`absolute w-5 h-5 pointer-events-none z-20 ${cls}`} style={{ borderColor: 'rgba(176,198,255,0.4)' }} />
              ))}

              {/* Image */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ background: '#080a0d', minHeight: '280px' }}>
                {viewingAlert.image ? (
                  <img src={`data:image/jpeg;base64,${viewingAlert.image}`} alt="Incident" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-3" style={{ color: 'rgba(176,198,255,0.2)' }}>
                    <Camera className="w-12 h-12" />
                    <p className="text-[10px] tracking-widest font-bold uppercase">No Image</p>
                  </div>
                )}
              </div>

              {/* Data panel */}
              <div className="w-full md:w-72 flex flex-col p-6 gap-5 shrink-0" style={{ borderLeft: '1px solid rgba(176,198,255,0.08)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] tracking-[0.3em] font-bold mb-1" style={{ color: 'rgba(176,198,255,0.4)' }}>INCIDENT DETAIL</p>
                    {(() => {
                      const s = SEV_MAP[getSeverity(viewingAlert)];
                      return (
                        <span className="text-[10px] font-bold tracking-widest px-2 py-0.5"
                          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '0.125rem' }}>
                          {s.label}
                        </span>
                      );
                    })()}
                  </div>
                  <button onClick={() => setViewingAlert(null)} className="p-1.5 transition-all" style={{ color: 'rgba(176,198,255,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#b0c6ff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(176,198,255,0.4)')}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-[8px] mb-1.5" style={{ color: 'rgba(176,198,255,0.35)' }}>TIMESTAMP</p>
                    <p className="text-sm font-bold" style={{ color: '#b0c6ff' }}>{viewingAlert.timestamp}</p>
                  </div>
                  <div>
                    <p className="text-[8px] mb-1.5" style={{ color: 'rgba(176,198,255,0.35)' }}>DETECTIONS</p>
                    <div className="flex flex-wrap gap-1">
                      {viewingAlert.detections.map((d, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5"
                          style={{ background: 'rgba(176,198,255,0.08)', color: '#b0c6ff', border: '1px solid rgba(176,198,255,0.15)', borderRadius: '0.125rem' }}>
                          {d.label} <span style={{ opacity: 0.5 }}>{Math.round(d.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {viewingAlert.location && (
                    <div>
                      <p className="text-[8px] mb-1.5" style={{ color: 'rgba(176,198,255,0.35)' }}>LOCATION</p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#b0c6ff' }}>
                        <MapPin className="w-3 h-3" />
                        {viewingAlert.location.id}
                      </div>
                    </div>
                  )}
                  {viewingAlert.is_person_search_match && (
                    <div className="p-3" style={{ background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: '0.25rem' }}>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" style={{ color: '#ffb4ab' }} />
                        <p className="text-[10px] font-bold tracking-widest" style={{ color: '#ffb4ab' }}>WATCHLIST MATCH</p>
                      </div>
                      <p className="text-[9px] mt-1" style={{ color: 'rgba(255,180,171,0.6)' }}>Target identified — immediate verification required.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid rgba(176,198,255,0.08)' }}>
                  <p className="text-[8px] text-center tracking-[0.3em] font-mono" style={{ color: 'rgba(176,198,255,0.2)' }}>SMARTSURV // SECURE FEED</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-4 flex flex-col gap-4" style={{ borderBottom: '1px solid rgba(176,198,255,0.08)', background: '#111316' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2" style={{ background: 'rgba(176,198,255,0.06)', border: '1px solid rgba(176,198,255,0.12)', borderRadius: '0.25rem' }}>
              <Activity className="w-4 h-4" style={{ color: '#b0c6ff' }} />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'Manrope', sans-serif", color: '#ccd8ff' }}>
                ALERTS LOG
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[10px]" style={{ color: 'rgba(176,198,255,0.35)' }}>{alerts.length} incidents recorded</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all"
            style={{ background: 'rgba(176,198,255,0.06)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff', borderRadius: '0.25rem' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#b0c6ff'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,198,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
          >
            <Download className="w-3.5 h-3.5" /> EXPORT CSV
          </button>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',    value: metrics.total,    icon: Activity,    color: '#b0c6ff' },
            { label: 'Critical', value: metrics.critical, icon: ShieldAlert, color: '#ff6b6b' },
            { label: 'Matches',  value: metrics.matches,  icon: User,        color: '#ffb4ab' },
            { label: 'Feeds',    value: metrics.feeds,    icon: Camera,      color: '#4dabf7' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 p-3"
              style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.08)', borderRadius: '0.375rem' }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color }} />
              <div>
                <p className="text-lg font-black leading-none" style={{ color, fontFamily: "'Manrope', sans-serif" }}>
                  {String(value).padStart(2, '0')}
                </p>
                <p className="text-[8px] font-bold tracking-widest uppercase mt-0.5" style={{ color: 'rgba(176,198,255,0.35)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter + search bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1" style={{ background: 'rgba(176,198,255,0.04)', border: '1px solid rgba(176,198,255,0.08)', borderRadius: '0.25rem' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterSeverity(f.key)}
                className="px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase transition-all"
                style={filterSeverity === f.key
                  ? { background: '#b0c6ff', color: '#000', borderRadius: '0.125rem' }
                  : { color: 'rgba(176,198,255,0.4)', borderRadius: '0.125rem' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text" value={filterQuery} onChange={e => setFilterQuery(e.target.value)}
            placeholder="Search alerts..."
            className="px-3 py-2 text-xs w-48"
            style={{ background: '#1a1c1f', border: '1px solid rgba(176,198,255,0.12)', color: '#e2e2e6', borderRadius: '0.25rem', outline: 'none' }}
          />
        </div>
      </div>

      {/* ── Alert list ── */}
      <div className="flex-1 overflow-auto p-5">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center gap-4" style={{ color: 'rgba(176,198,255,0.2)' }}>
            <Shield className="w-14 h-14" />
            <p className="text-sm tracking-[0.3em] font-bold">
              {filterQuery || filterSeverity !== 'ALL' ? 'NO MATCHING ALERTS' : 'NO ALERTS RECORDED'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(176,198,255,0.12)' }}>
              {filterQuery || filterSeverity !== 'ALL' ? 'Try adjusting your filters.' : 'Alerts appear here when threats are detected.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((alert, idx) => {
                const sev = getSeverity(alert);
                const s = SEV_MAP[sev];
                const SevIcon = s.Icon;
                const maxConf = alert.detections.length
                  ? Math.max(...alert.detections.map(d => d.confidence))
                  : 0;

                return (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    className="flex items-start gap-4 p-4 group cursor-pointer transition-all duration-200"
                    style={{ background: '#1a1c1f', border: `1px solid rgba(176,198,255,0.08)`, borderRadius: '0.375rem' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = s.border; (e.currentTarget as HTMLDivElement).style.background = s.bg; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(176,198,255,0.08)'; (e.currentTarget as HTMLDivElement).style.background = '#1a1c1f'; }}
                    onClick={() => setViewingAlert(alert)}
                  >
                    {/* Severity icon */}
                    <div className="p-3 shrink-0 transition-all"
                      style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '0.25rem' }}>
                      <SevIcon className="w-5 h-5" style={{ color: s.color }} />
                    </div>

                    {/* Thumbnail */}
                    {alert.image && (
                      <div className="w-16 h-16 shrink-0 overflow-hidden"
                        style={{ border: `1px solid ${s.border}`, borderRadius: '0.25rem' }}>
                        <img src={`data:image/jpeg;base64,${alert.image}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold tracking-widest px-2 py-0.5"
                          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '0.125rem' }}>
                          {s.label}
                        </span>
                        {alert.is_person_search_match && (
                          <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest"
                            style={{ color: '#ffb4ab' }}>
                            <User className="w-2.5 h-2.5" /> WATCHLIST_MATCH
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-1.5 text-[9px]" style={{ color: 'rgba(176,198,255,0.35)' }}>
                          <Clock className="w-3 h-3" />
                          {alert.timestamp}
                        </span>
                      </div>

                      {/* Detection labels */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {alert.detections.map((d, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5"
                            style={{ background: 'rgba(176,198,255,0.06)', color: '#b0c6ff', border: '1px solid rgba(176,198,255,0.12)', borderRadius: '0.125rem' }}>
                            {d.label} <span style={{ opacity: 0.5 }}>({Math.round(d.confidence * 100)}%)</span>
                          </span>
                        ))}
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(176,198,255,0.35)' }}>
                        {maxConf > 0 && (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3" style={{ color: s.color }} />
                            {(maxConf * 100).toFixed(1)}% CONFIDENCE
                          </span>
                        )}
                        {alert.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" style={{ color: '#b0c6ff' }} />
                            {alert.location.id}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inspect button */}
                    <button
                      onClick={e => { e.stopPropagation(); setViewingAlert(alert); }}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 text-[9px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: 'rgba(176,198,255,0.06)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff', borderRadius: '0.25rem' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#b0c6ff'; (e.currentTarget as HTMLButtonElement).style.color = '#000'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(176,198,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
                    >
                      <Eye className="w-3.5 h-3.5" /> INSPECT
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsLog;

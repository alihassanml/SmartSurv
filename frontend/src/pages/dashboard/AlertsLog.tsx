import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, ShieldAlert, User, MapPin, Download,
  Activity, CheckCircle, X, Eye, Camera, Clock, FileText, Trash2, Check,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
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
  match:    { color: '#ba1a1a', bg: 'rgba(186,26,26,0.06)',  border: 'rgba(186,26,26,0.25)',  label: 'MATCH',    Icon: ShieldAlert },
  critical: { color: '#ba1a1a', bg: 'rgba(186,26,26,0.08)',  border: 'rgba(186,26,26,0.3)',   label: 'CRITICAL', Icon: ShieldAlert },
  high:     { color: '#b45309', bg: 'rgba(180,83,9,0.06)',   border: 'rgba(180,83,9,0.2)',    label: 'HIGH',     Icon: AlertTriangle },
  alert:    { color: 'var(--color-primary)', bg: 'rgba(36,128,255,0.06)', border: 'rgba(36,128,255,0.15)', label: 'ALERT',   Icon: Shield },
};

const AlertsLog: React.FC = () => {
  const { alerts, deleteAlerts } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('ALL');
  const [filterQuery, setFilterQuery] = useState('');
  const [viewingAlert, setViewingAlert] = useState<Alert | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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

  const handleDownloadPDF = (alertToExport?: Alert) => {
    const alertData = alertToExport || viewingAlert;
    if (!alertData) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // --- BRANDING & HEADER ---
      // Clean White Background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Top accent bar (Primary Blue)
      doc.setFillColor(36, 128, 255);
      doc.rect(0, 0, pageWidth, 5, 'F');

      // Logo/Shield Icon Text
      doc.setTextColor(36, 128, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('SMARTSURV', 20, 25);
      
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.setFont('courier', 'bold');
      doc.text('SECURE INCIDENT INTELLIGENCE REPORT', 20, 31);

      // --- METADATA PANEL ---
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(20, 38, pageWidth - 20, 38);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`REPORT ID: #${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 45);
      doc.text(`GENERATED: ${new Date().toLocaleString()}`, pageWidth - 20, 45, { align: 'right' });

      // --- SEVERITY & STATUS ---
      const sev = getSeverity(alertData);
      let sevColor: [number, number, number] = [36, 128, 255]; // default blue
      let sevLabel = 'SYSTEM_ALERT';
      
      if (sev === 'critical') {
        sevColor = [186, 26, 26];
        sevLabel = 'CRITICAL_THREAT';
      } else if (sev === 'high') {
        sevColor = [180, 83, 9];
        sevLabel = 'HIGH_PRIORITY';
      } else if (sev === 'match') {
        sevColor = [186, 26, 26];
        sevLabel = 'WATCHLIST_TARGET_MATCH';
      }

      // Severity Background Tag (Light version)
      doc.setFillColor(sevColor[0], sevColor[1], sevColor[2], 0.05);
      doc.rect(20, 52, 170, 12, 'F');
      doc.setDrawColor(sevColor[0], sevColor[1], sevColor[2], 0.3);
      doc.rect(20, 52, 170, 12, 'D');

      doc.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`SECURITY STATUS: ${sevLabel}`, 25, 60);

      // --- INCIDENT CORE DATA ---
      let y = 78;
      const drawDataRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(label, 20, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(value, 65, y);
        y += 8;
      };

      drawDataRow('TIMESTAMP', alertData.timestamp);
      drawDataRow('SENSOR ID', alertData.location?.id || 'DYNAMIC_SENSOR_01');
      drawDataRow('COORDINATES', `${alertData.location?.lat || '0.0000'}, ${alertData.location?.lon || '0.0000'}`);
      
      y += 5;
      
      // --- DETECTION ACTIVITY BLOCK ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(36, 128, 255);
      doc.text('DETECTION ACTIVITY LOG', 20, y);
      y += 6;

      // Activity Table Header
      doc.setFillColor(245, 247, 250);
      doc.rect(20, y, 170, 8, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text('ACTIVITY TYPE', 25, y + 5.5);
      doc.text('CONFIDENCE', 80, y + 5.5);
      doc.text('ACTION TAKEN', 140, y + 5.5);
      y += 12;

      if (alertData.detections.length === 0 && !alertData.is_person_search_match) {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('No standard autonomous detections recorded.', 25, y);
        y += 8;
      } else {
        // Watchlist Match Entry
        if (alertData.is_person_search_match) {
          doc.setFillColor(186, 26, 26, 0.05);
          doc.rect(20, y - 4, 170, 7, 'F');
          doc.setTextColor(186, 26, 26);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('WATCHLIST_MATCH', 25, y + 1);
          doc.text('98.4%', 80, y + 1);
          doc.text('PROTOCOL_ALPHA', 140, y + 1);
          y += 8;
        }

        // YOLO Detections
        alertData.detections.forEach((d) => {
          const isDanger = ['knife', 'gun', 'fire', 'weapon', 'pistol'].includes(d.label.toLowerCase());
          doc.setTextColor(isDanger ? 186 : 50, isDanger ? 26 : 50, isDanger ? 26 : 50);
          doc.setFontSize(9);
          doc.setFont('helvetica', isDanger ? 'bold' : 'normal');
          doc.text(d.label.toUpperCase(), 25, y);
          doc.setTextColor(80, 80, 80);
          doc.text(`${Math.round(d.confidence * 100)}%`, 80, y);
          doc.text(isDanger ? 'THREAT_LOGGED' : 'ACTIVITY_LOGGED', 140, y);
          y += 7;
        });
      }

      y += 10;
      
      // --- VISUAL EVIDENCE ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(36, 128, 255);
      doc.text('EVIDENCE SNAPSHOT (CCTV_FEED)', 20, y);
      y += 6;

      if (alertData.image) {
        const imgData = `data:image/jpeg;base64,${alertData.image}`;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(20, y, 170, 127.5); // frame
        doc.addImage(imgData, 'JPEG', 21, y + 1, 168, 125.5);
        
        y += 135;
      } else {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, y, 170, 40, 'F');
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('VISUAL EVIDENCE UNAVAILABLE', pageWidth / 2, y + 22, { align: 'center' });
        y += 50;
      }

      // --- AUTHENTICATION FOOTER ---
      doc.setDrawColor(230, 230, 230);
      doc.line(20, 275, pageWidth - 20, 275);
      
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont('courier', 'normal');
      doc.text('CONFIDENTIAL // FOR AUTHORIZED PERSONNEL ONLY', 20, 282);
      doc.text(`SYSTEM_SIGNATURE: ${btoa(alertData.timestamp).substr(0, 16)}`, pageWidth - 20, 282, { align: 'right' });

      doc.save(`SmartSurv_Report_${alertData.timestamp.replace(/[: ]/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Unable to generate PDF report.');
    }
  };

  const FILTERS: { key: FilterSeverity; label: string }[] = [
    { key: 'ALL',      label: 'All' },
    { key: 'CRITICAL', label: 'Critical' },
    { key: 'HIGH',     label: 'High' },
    { key: 'ALERT',    label: 'Alert' },
    { key: 'MATCH',    label: 'Watchlist' },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-background)' }}>

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
              className="relative w-full max-w-4xl flex flex-col md:flex-row overflow-hidden z-10 rounded-3xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-outline-variant)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', maxHeight: '85vh' }}
            >
              {/* Corner accents */}
              {[['top-3 left-3 border-t-2 border-l-2',''],['top-3 right-3 border-t-2 border-r-2',''],['bottom-3 left-3 border-b-2 border-l-2',''],['bottom-3 right-3 border-b-2 border-r-2','']].map(([cls], i) => (
                <div key={i} className={`absolute w-5 h-5 pointer-events-none z-20 ${cls}`} style={{ borderColor: 'rgba(36,128,255,0.4)' }} />
              ))}

              {/* Image */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ background: '#080a0d', minHeight: '280px' }}>
                {viewingAlert.image ? (
                  <img src={`data:image/jpeg;base64,${viewingAlert.image}`} alt="Incident" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center gap-3" style={{ color: 'var(--color-outline-variant)' }}>
                    <Camera className="w-12 h-12" />
                    <p className="text-[10px] tracking-widest font-bold uppercase">No Image</p>
                  </div>
                )}
              </div>

              {/* Data panel */}
              <div className="w-full md:w-72 flex flex-col p-6 gap-5 shrink-0" style={{ borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] tracking-[0.3em] font-bold mb-1" style={{ color: 'var(--color-outline)' }}>INCIDENT DETAIL</p>
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
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDownloadPDF()} className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase transition-all rounded-xl"
                      style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)' }}
                      onMouseEnter={e => { (e.currentTarget.style.background = 'var(--color-primary)'); (e.currentTarget.style.color = '#ffffff') }}
                      onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(0,0,0,0.03)'); (e.currentTarget.style.color = 'var(--color-primary)') }}>
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={() => setViewingAlert(null)} className="p-1.5 transition-all" style={{ color: 'var(--color-outline)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ba1a1a')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(36,128,255,0.4)')}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-[8px] mb-1.5" style={{ color: 'var(--color-outline)' }}>TIMESTAMP</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{viewingAlert.timestamp}</p>
                  </div>
                  <div>
                    <p className="text-[8px] mb-1.5" style={{ color: 'var(--color-outline)' }}>DETECTIONS</p>
                    <div className="flex flex-wrap gap-1">
                      {viewingAlert.detections.map((d, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.1)', color: 'var(--color-primary)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.125rem' }}>
                          {d.label} <span style={{ opacity: 0.5 }}>{Math.round(d.confidence * 100)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {viewingAlert.location && (
                    <div>
                      <p className="text-[8px] mb-1.5" style={{ color: 'var(--color-outline)' }}>LOCATION</p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-primary)' }}>
                        <MapPin className="w-3 h-3" />
                        {viewingAlert.location.id}
                      </div>
                    </div>
                  )}
                  {viewingAlert.is_person_search_match && (
                    <div className="p-3" style={{ background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.3)', borderRadius: '0.25rem' }}>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" style={{ color: '#ba1a1a' }} />
                        <p className="text-[10px] font-bold tracking-widest" style={{ color: '#ba1a1a' }}>WATCHLIST MATCH</p>
                      </div>
                      <p className="text-[9px] mt-1" style={{ color: 'rgba(255,180,171,0.6)' }}>Target identified — immediate verification required.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <p className="text-[8px] text-center tracking-[0.3em] font-mono" style={{ color: 'var(--color-outline-variant)' }}>SMARTSURV // SECURE FEED</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-4 flex flex-col gap-4" style={{ borderBottom: '1px solid var(--color-outline-variant)', background: 'var(--color-surface)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2" style={{ background: 'rgba(36,128,255,0.06)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.25rem' }}>
              <Activity className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-[0.2em] uppercase" style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}>
                ALERTS LOG
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[10px]" style={{ color: 'var(--color-outline)' }}>{alerts.length} incidents recorded</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={() => { deleteAlerts(selectedIds); setSelectedIds([]); }}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all rounded-xl"
                style={{ background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.25)', color: '#ba1a1a' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ba1a1a'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(186,26,26,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#ba1a1a'; }}
              >
                <Trash2 className="w-3.5 h-3.5" /> DELETE ({selectedIds.length})
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all rounded-xl"
              style={{ background: 'rgba(36,128,255,0.06)', border: '1px solid rgba(36,128,255,0.15)', color: 'var(--color-primary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(36,128,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
            >
              <Download className="w-3.5 h-3.5" /> EXPORT CSV
            </button>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',    value: metrics.total,    icon: Activity,    color: 'var(--color-primary)' },
            { label: 'Critical', value: metrics.critical, icon: ShieldAlert, color: '#ff6b6b' },
            { label: 'Matches',  value: metrics.matches,  icon: User,        color: '#ba1a1a' },
            { label: 'Feeds',    value: metrics.feeds,    icon: Camera,      color: '#4dabf7' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 p-4 bg-white rounded-2xl"
              style={{ border: '1px solid var(--color-outline-variant)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color }} />
              <div>
                <p className="text-lg font-black leading-none" style={{ color, fontFamily: "'Manrope', sans-serif" }}>
                  {String(value).padStart(2, '0')}
                </p>
                <p className="text-[8px] font-bold tracking-widest uppercase mt-0.5" style={{ color: 'var(--color-outline)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter + search bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.25rem' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterSeverity(f.key)}
                className="px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase transition-all"
                style={filterSeverity === f.key
                  ? { background: 'var(--color-primary)', color: '#ffffff', borderRadius: '0.5rem' }
                  : { color: 'var(--color-outline)', borderRadius: '0.5rem' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text" value={filterQuery} onChange={e => setFilterQuery(e.target.value)}
            placeholder="Search alerts..."
            className="px-4 py-2.5 text-xs w-64 rounded-xl"
            style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)', outline: 'none' }}
          />
        </div>
      </div>

      {/* ── Alert list ── */}
      <div className="flex-1 overflow-auto p-5">
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center gap-4" style={{ color: 'var(--color-outline-variant)' }}>
            <Shield className="w-14 h-14" />
            <p className="text-sm tracking-[0.3em] font-bold">
              {filterQuery || filterSeverity !== 'ALL' ? 'NO MATCHING ALERTS' : 'NO ALERTS RECORDED'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(0,0,0,0.1)' }}>
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
                    className="flex items-center gap-4 p-4 group cursor-pointer transition-all duration-200 bg-white rounded-2xl"
                    style={{ border: `1px solid var(--color-outline-variant)`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = s.border; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-outline-variant)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
                    onClick={() => setViewingAlert(alert)}
                  >
                    {/* Checkbox */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds(prev => prev.includes(alert.id) ? prev.filter(id => id !== alert.id) : [...prev, alert.id]);
                      }}
                      className="w-5 h-5 shrink-0 rounded flex items-center justify-center transition-all"
                      style={{ 
                        border: '1px solid var(--color-outline-variant)',
                        background: selectedIds.includes(alert.id) ? 'var(--color-primary)' : 'transparent',
                        borderColor: selectedIds.includes(alert.id) ? 'var(--color-primary)' : 'var(--color-outline-variant)'
                      }}
                    >
                      {selectedIds.includes(alert.id) && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>

                    {/* Thumbnail or Fallback Icon */}
                    {alert.image ? (
                      <div className="w-12 h-12 shrink-0 overflow-hidden shadow-sm"
                        style={{ border: `1px solid ${s.border}`, borderRadius: '50%' }}>
                        <img src={`data:image/jpeg;base64,${alert.image}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 shrink-0 overflow-hidden flex items-center justify-center shadow-sm"
                        style={{ border: `1px solid ${s.border}`, borderRadius: '50%', background: s.bg, color: s.color }}>
                        <SevIcon className="w-5 h-5" />
                      </div>
                    )}

                    {/* Details Table Layout */}
                    <div className="flex-1 flex items-center justify-between gap-4 px-4 min-w-0">
                      
                      {/* Column 1: Severity / Match Tags */}
                      <div className="w-32 shrink-0 flex flex-col gap-2">
                        <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 w-max"
                          style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '0.125rem' }}>
                          {s.label}
                        </span>
                        {alert.is_person_search_match && (
                          <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest"
                            style={{ color: '#ba1a1a' }}>
                            <User className="w-2.5 h-2.5" /> WATCHLIST_MATCH
                          </span>
                        )}
                      </div>

                      {/* Column 2: Detection labels (centered) */}
                      <div className="flex-1 flex flex-wrap justify-center gap-1.5 min-w-0">
                        {alert.detections.length > 0 ? alert.detections.map((d, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 whitespace-nowrap"
                            style={{ background: 'var(--color-surface-container-low)', color: 'var(--color-primary)', border: '1px solid var(--color-outline-variant)', borderRadius: '0.25rem' }}>
                            {d.label} <span style={{ opacity: 0.5 }}>({Math.round(d.confidence * 100)}%)</span>
                          </span>
                        )) : (
                          <span className="text-[10px] font-medium opacity-50" style={{ color: 'var(--color-outline)' }}>NO OBJECTS</span>
                        )}
                      </div>

                      {/* Column 3: Location & Confidence */}
                      <div className="w-36 shrink-0 flex flex-col items-center gap-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>
                        {alert.location && (
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <MapPin className="w-3 h-3" style={{ color: 'var(--color-primary)' }} />
                            {alert.location.id}
                          </span>
                        )}
                        {maxConf > 0 && (
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <CheckCircle className="w-3 h-3" style={{ color: s.color }} />
                            {(maxConf * 100).toFixed(1)}% CONFIDENCE
                          </span>
                        )}
                      </div>

                      {/* Column 4: Centered Timestamp */}
                      <div className="w-36 shrink-0 flex justify-center pointer-events-none">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--color-outline)' }} />
                          <div className="flex flex-col items-center leading-none">
                            <span className="text-[11px] font-mono font-bold tracking-widest" style={{ color: 'var(--color-primary)' }}>
                              {alert.timestamp.split(' ').pop()}
                            </span>
                            <span className="text-[7px] opacity-40 font-bold mt-1">{alert.timestamp.split(' ')[0]}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-center">
                      <button
                        onClick={e => { e.stopPropagation(); handleDownloadPDF(alert); }}
                        className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold tracking-widest uppercase transition-all rounded-xl"
                        style={{ background: 'var(--color-surface-container-low)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-container-low)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setViewingAlert(alert); }}
                        className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold tracking-widest uppercase transition-all rounded-xl"
                        style={{ background: 'var(--color-primary)', border: '1px solid var(--color-primary)', color: '#ffffff' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0d6efd'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'; }}
                      >
                        <Eye className="w-3.5 h-3.5" /> INSPECT
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteAlerts([alert.id]); }}
                        className="p-2 transition-all rounded-xl hover:bg-red-50 hover:text-red-600"
                        style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--color-outline-variant)', color: 'var(--color-outline)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ba1a1a'; (e.currentTarget as HTMLButtonElement).style.color = '#ba1a1a'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-outline-variant)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-outline)'; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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





import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Radar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, Target, TrendingUp, AlertCircle, Cpu } from 'lucide-react';
import type { Alert, PersonEvent } from '../../types/dashboard';

interface Props {
  alerts: Alert[];
  detectedPersons: PersonEvent[];
  isConnected: boolean;
  systemMode: 'detection' | 'search' | 'both';
}

const COLORS = ['#2480ff', '#47607e', '#a855f7', '#ff4466', '#ffbb33', '#ff8c00'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#e0e3e5] border border-[rgba(36,128,255,0.2)] px-3 py-2 font-sans shadow-2xl backdrop-blur-md rounded-sm">
      <p className="text-[9px] text-[#2480ff] font-bold mb-1 tracking-[0.2em]">{label || 'TELEMETRY'}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[11px] font-bold flex items-center gap-2" style={{ color: p.color || p.fill }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: {p.value}{p.name.includes('%') ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  color: string;
  sub: string;
  index: number;
  symbol: string;
  trend: number[];
}> = ({ label, value, color, sub, index, symbol, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
    className="border border-[rgba(0,0,0,0.1)] bg-[#e0e3e5] p-5 relative overflow-hidden group hover:border-[rgba(36,128,255,0.25)] transition-all duration-300"
  >
    <div className="flex justify-between items-start">
      <div className="relative z-10">
        <p className="text-[8px] tracking-[0.35em] mb-3 uppercase font-black" style={{ color: '#74777d' }}>{label}</p>
        <p className="text-4xl font-bold tabular-nums tracking-tighter" style={{ color, textShadow: `0 0 20px ${color}30` }}>{value}</p>
        <p className="text-[8px] mt-2 uppercase tracking-widest font-bold" style={{ color: '#c4c6cc' }}>{sub}</p>
      </div>
      <div className="w-16 h-10 mt-1 opacity-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend.map((v, i) => ({ v, i }))}>
            <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    
    <div className="absolute bottom-3 right-4 text-[32px] opacity-5 font-black select-none pointer-events-none" style={{ color }}>
      {symbol}
    </div>
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(36,128,255,0.1)] to-transparent" />
  </motion.div>
);

const DashboardAnalytics: React.FC<Props> = ({ alerts, detectedPersons, isConnected, systemMode }) => {
  const data = useMemo(() => {
    // Activity type breakdown
    const activityMap: Record<string, { count: number; confidences: number[] }> = {};
    alerts.forEach(alert => {
      (alert.detections ?? []).forEach(d => {
        const lbl = d.label.toLowerCase();
        if (!activityMap[lbl]) activityMap[lbl] = { count: 0, confidences: [] };
        activityMap[lbl].count++;
        activityMap[lbl].confidences.push(d.confidence * 100);
      });
      // Treat person-search-match alerts with no YOLO detections as a PERSON detection
      if (alert.is_person_search_match && (!alert.detections || alert.detections.length === 0)) {
        if (!activityMap['person']) activityMap['person'] = { count: 0, confidences: [] };
        activityMap['person'].count++;
        activityMap['person'].confidences.push(100);
      }
    });

    const activityBreakdown = Object.entries(activityMap)
      .map(([name, { count, confidences }]) => ({
        name: name.toUpperCase(),
        count,
        full: 100, // For radar
        avgConf: Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length),
      }))
      .sort((a, b) => b.count - a.count);

    const scatterData = alerts.flatMap(a => {
        const timestamp = a.backend_ts ? new Date(a.backend_ts) : new Date(a.timestamp.replace(' ', 'T'));
        const hour = timestamp.getHours() + timestamp.getMinutes() / 60;
        const dets = a.detections ?? [];
        if (dets.length === 0 && a.is_person_search_match) {
          return [{ hour, confidence: 100, size: 30, label: 'PERSON' }];
        }
        return dets.map(det => ({
            hour,
            confidence: Math.round(det.confidence * 100),
            size: 10 + (det.confidence * 20),
            label: det.label.toUpperCase()
        }));
    }).slice(-100);

    const totalDetections = activityBreakdown.reduce((a, b) => a + b.count, 0);

    // Hourly buckets for last 24h
    const now = new Date();
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const h = new Date(now.getTime() - (23 - i) * 3600000);
      return {
        hour: `${h.getHours().toString().padStart(2, '0')}:00`,
        alerts: 0,
        persons: 0,
        critical: 0
      };
    });

    alerts.forEach(alert => {
      try {
        let d = alert.backend_ts ? new Date(alert.backend_ts) : new Date(alert.timestamp.replace(' ', 'T'));
        if (isNaN(d.getTime()) || d.getFullYear() < 2000) {
            const parts = alert.timestamp.split(':').map(Number);
            d = new Date();
            d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
        }
        if (!isNaN(d.getTime())) {
          const hoursAgo = Math.floor((now.getTime() - d.getTime()) / 3600000);
          if (hoursAgo >= 0 && hoursAgo < 24) {
            const idx = 23 - hoursAgo;
            hourlyData[idx].alerts++;
            // New classes: gun, knife, smoking, violence
            if ((alert.detections ?? []).some(det => ['gun', 'knife', 'smoking', 'violence'].includes(det.label.toLowerCase()))) {
                hourlyData[idx].critical++;
            }
          }
        }
      } catch (_) {}
    });

    detectedPersons.forEach(p => {
      try {
        let d = p.backend_ts ? new Date(p.backend_ts) : new Date(p.timestamp.replace(' ', 'T'));
        if (isNaN(d.getTime()) || d.getFullYear() < 2000) {
            const parts = p.timestamp.split(':').map(Number);
            d = new Date();
            d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
        }
        if (!isNaN(d.getTime())) {
          const hoursAgo = Math.floor((now.getTime() - d.getTime()) / 3600000);
          if (hoursAgo >= 0 && hoursAgo < 24) {
            const idx = 23 - hoursAgo;
            if (hourlyData[idx]) hourlyData[idx].persons++;
          }
        }
      } catch (_) {}
    });

    // Overall confidence
    const allConf = alerts.flatMap(a => (a.detections ?? []).map(d => d.confidence * 100));
    const avgConf = allConf.length > 0
      ? Math.round(allConf.reduce((a, b) => a + b, 0) / allConf.length)
      : 0;

    const peakHour = [...hourlyData].sort((a, b) => b.alerts - a.alerts)[0];

    // Dummy trends for StatCards (simulating historical data)
    const getTrend = (val: number) => Array.from({length: 10}, (_, i) => Math.max(0, val * (0.5 + Math.random() * 0.5 + (i/20))));

    return {
      activityBreakdown,
      hourlyData,
      scatterData,
      avgConf,
      totalDetections,
      totalAlerts: alerts.length,
      personMatches: alerts.filter(a => a.is_person_search_match).length,
      uniquePersons: detectedPersons.length,
      peakHour: peakHour?.alerts > 0 ? peakHour.hour : 'NONE',
      trends: {
          alerts: getTrend(alerts.length),
          conf: getTrend(avgConf),
          persons: getTrend(detectedPersons.length),
          matches: getTrend(alerts.filter(a => a.is_person_search_match).length)
      }
    };
  }, [alerts, detectedPersons]);

  const modeLabel = { detection: 'ACTIVITY_SCAN', search: 'PERSON_SEARCH', both: 'HYBRID_LINK' }[systemMode];
  const modeColor = { detection: '#2480ff', search: '#ff4466', both: '#a855f7' }[systemMode];

  return (
    <div className="flex-1 overflow-y-auto bg-[#e8ecf0] font-sans pb-12">
      {/* Analytics Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[rgba(0,0,0,0.1)] flex items-center justify-between sticky top-0 bg-[#e8ecf0]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2480ff] rounded-sm shadow-[0_0_15px_rgba(36,128,255,0.3)]">
            <TrendingUp size={18} color="white" />
          </div>
          <div>
            <p className="text-[7px] tracking-[0.5em] mb-0.5 font-black uppercase" style={{ color: '#74777d' }}>INTELLIGENCE_CENTER</p>
            <h1 className="text-xl font-black tracking-[0.1em] text-[#191c1e] uppercase">System Analytics</h1>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[7px] tracking-widest mb-0.5 font-bold uppercase" style={{ color: '#74777d' }}>ENGINE_PROTOCOL</p>
            <p className="text-[10px] font-black" style={{ color: modeColor }}>{modeLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] tracking-widest mb-0.5 font-bold uppercase" style={{ color: '#74777d' }}>LINK_STATUS</p>
            <div className="flex items-center gap-2 justify-end">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#16a34a] shadow-[0_0_10px_rgba(22,163,74,0.5)] animate-pulse' : 'bg-red-500'}`} />
              <p className="text-[10px] font-black uppercase tracking-widest">{isConnected ? 'ENCRYPTED' : 'DISCONNECTED'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* High-Level Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="TOTAL_INCIDENTS" value={data.totalAlerts} color="#2480ff" sub="system-wide alerts" index={0} symbol="â–²" trend={data.trends.alerts} />
          <StatCard label="AI_RELIABILITY" value={`${data.avgConf}%`} color="#47607e" sub="average confidence" index={1} symbol="â—†" trend={data.trends.conf} />
          <StatCard label="PERSONS_TRACKED" value={data.uniquePersons} color="#a855f7" sub="unique subject ids" index={2} symbol="â— " trend={data.trends.persons} />
          <StatCard label="SECURITY_HITS" value={data.personMatches} color="#ff4466" sub="watchlist matches" index={3} symbol="âœ•" trend={data.trends.matches} />
        </div>

        {/* Main Charts: Timeline + Radar */}
        <div className="grid grid-cols-12 gap-4">

          {/* Time Analysis â€” Area Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="col-span-8 border border-[rgba(0,0,0,0.1)] bg-[#e0e3e5] p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Activity size={16} className="text-[#2480ff]" />
                <div>
                  <p className="text-[8px] tracking-[0.4em] mb-0.5 font-black uppercase" style={{ color: '#74777d' }}>Temporal Analysis</p>
                  <p className="text-xs font-bold text-[#191c1e]">DETECTION_TIMELINE (24H)</p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-[8px] font-black tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#2480ff]" />ALERTS</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#ff4466]" />CRITICAL</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#a855f7]" />PERSONS</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.hourlyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAlert" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2480ff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2480ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4466" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff4466" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: '#74777d', fontSize: 8, fontWeight: 700 }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fill: '#74777d', fontSize: 8, fontWeight: 700 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="alerts" name="ALERTS" stroke="#2480ff" strokeWidth={2.5} fill="url(#gAlert)" />
                <Area type="monotone" dataKey="critical" name="CRITICAL" stroke="#ff4466" strokeWidth={2.5} fill="url(#gCrit)" />
                <Area type="monotone" dataKey="persons" name="PERSONS" stroke="#a855f7" strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Activity Fingerprint â€” Radar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
            className="col-span-4 border border-[rgba(0,0,0,0.1)] bg-[#e0e3e5] p-6 shadow-sm flex flex-col"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <Shield size={16} className="text-[#a855f7]" />
              <div>
                <p className="text-[8px] tracking-[0.4em] mb-0.5 font-black uppercase" style={{ color: '#74777d' }}>Signature Profile</p>
                <p className="text-xs font-bold text-[#191c1e]">ACTIVITY_RADAR</p>
              </div>
            </div>
            <div className="flex-1 min-h-[260px]">
              {data.activityBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-bold tracking-[0.3em] uppercase">Awaiting Signature Map...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.activityBreakdown}>
                    <PolarGrid stroke="rgba(0,0,0,0.05)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#74777d', fontSize: 7, fontWeight: 900 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar
                      name="Density"
                      dataKey="count"
                      stroke="#2480ff"
                      fill="#2480ff"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-[8px] text-center mt-2 font-bold uppercase tracking-widest" style={{ color: '#c4c6cc' }}>Multi-factor activity distribution</p>
          </motion.div>
        </div>

        {/* Secondary Row: Breakdown + Distribution */}
        <div className="grid grid-cols-12 gap-4">
            
          {/* Classification Breakdown â€” Bars */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="col-span-4 border border-[rgba(0,0,0,0.1)] bg-[#e0e3e5] p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <Target size={16} className="text-[#ffbb33]" />
                    <div>
                        <p className="text-[8px] tracking-[0.4em] mb-0.5 font-black uppercase" style={{ color: '#74777d' }}>Model Insights</p>
                        <p className="text-xs font-bold text-[#191c1e]">CLASSIFICATION_MAP</p>
                    </div>
                </div>
                <p className="text-[9px] font-black text-[#74777d]">{data.activityBreakdown.length} CLASSES</p>
            </div>
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {data.activityBreakdown.map((act, i) => (
                    <div key={act.name} className="group">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9px] font-black tracking-widest text-[#191c1e] group-hover:text-[#2480ff] transition-colors uppercase">{act.name}</span>
                            <span className="text-[9px] font-mono font-bold" style={{ color: '#74777d' }}>{act.count} UNITS</span>
                        </div>
                        <div className="h-1.5 bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: data.totalDetections > 0 ? `${Math.round((act.count / data.totalDetections) * 100)}%` : '0%' }}
                                transition={{ duration: 1, delay: 0.5 + i * 0.05 }}
                                className="h-full rounded-full"
                                style={{ background: COLORS[i % COLORS.length] }}
                            />
                        </div>
                    </div>
                ))}
            </div>
          </motion.div>

          {/* Detection Density â€” Scatter Plot */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="col-span-8 border border-[rgba(0,0,0,0.1)] bg-[#e0e3e5] p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <Zap size={16} className="text-[#2480ff]" />
                    <div>
                        <p className="text-[8px] tracking-[0.4em] mb-0.5 font-black uppercase" style={{ color: '#74777d' }}>Inference Accuracy</p>
                        <p className="text-xs font-bold text-[#191c1e]">DETECTION_DENSITY (CONFIDENCE VS TIME)</p>
                    </div>
                </div>
            </div>
            {data.scatterData.length === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2 opacity-30">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Awaiting Detection Data...</p>
                <p className="text-[8px] font-bold tracking-widest" style={{ color: '#74777d' }}>No inference events in current window</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                    <XAxis
                        type="number"
                        dataKey="hour"
                        name="Time"
                        domain={[0, 24]}
                        tick={{ fill: '#74777d', fontSize: 7, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${Math.floor(v)}h`}
                    />
                    <YAxis
                        type="number"
                        dataKey="confidence"
                        name="Confidence"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fill: '#74777d', fontSize: 7, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <ZAxis type="number" dataKey="size" range={[50, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Scatter
                        name="Detections"
                        data={data.scatterData}
                        fill="#2480ff"
                        fillOpacity={0.6}
                    >
                        {data.scatterData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.confidence > 85 ? '#16a34a' : entry.confidence > 60 ? '#2480ff' : '#ffbb33'} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* System Telemetry Row */}
        <div className="grid grid-cols-4 gap-4">
            {[
                { label: 'NODE_THROUGHPUT', value: `${(data.totalDetections / Math.max(1, alerts.length)).toFixed(2)}`, unit: 'OBJ/FRAME', icon: <Cpu size={14} />, color: '#47607e' },
                { label: 'PEAK_THREAT_TIME', value: data.peakHour, unit: 'LOCAL_TIME', icon: <AlertCircle size={14} />, color: '#ff4466' },
                { label: 'AI_RECOGNITION', value: 'OPTIMIZED', unit: 'GPU_CUDA', icon: <TrendingUp size={14} />, color: '#16a34a' },
                { label: 'DATA_INTEGRITY', value: 'SECURE', unit: 'ENCRYPTED', icon: <Shield size={14} />, color: '#2480ff' },
            ].map((tele, i) => (
                <div key={i} className="p-4 bg-[#e0e3e5] border border-[rgba(0,0,0,0.06)] flex items-center justify-between">
                    <div>
                        <p className="text-[7px] font-black tracking-widest text-[#74777d] uppercase mb-1">{tele.label}</p>
                        <p className="text-sm font-black text-[#191c1e]">{tele.value} <span className="text-[9px] text-[#74777d] font-normal">{tele.unit}</span></p>
                    </div>
                    <div style={{ color: tele.color }} className="opacity-30">{tele.icon}</div>
                </div>
            ))}
        </div>

        {/* Events Table */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="border border-[rgba(0,0,0,0.1)] bg-[#e0e3e5] p-6 shadow-sm"
        >
          <div className="flex items-center gap-2.5 mb-6">
              <TrendingUp size={16} className="text-[#2480ff]" />
              <div>
                  <p className="text-[8px] tracking-[0.4em] mb-0.5 font-black uppercase" style={{ color: '#74777d' }}>Event Audit</p>
                  <p className="text-xs font-bold text-[#191c1e]">LIVE_DETECTION_LOG (LAST 100)</p>
              </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[300px] custom-scrollbar">
            <table className="w-full text-[9px] font-sans border-separate border-spacing-y-1">
              <thead className="sticky top-0 bg-[#e0e3e5] z-10">
                <tr className="text-left text-[#74777d] font-black tracking-[0.2em] uppercase">
                  <th className="py-3 px-4">INDEX</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4">SIGNATURES</th>
                  <th className="py-3 px-4">CONFIDENCE</th>
                  <th className="py-3 px-4 text-right">PROTOCOL</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center opacity-30 tracking-[0.5em] font-black">SYSTEM_IDLE: NO_DATA</td>
                  </tr>
                ) : (
                  [...alerts].reverse().slice(0, 100).map((alert, i) => {
                    const maxConf = Math.max(...alert.detections.map(d => d.confidence), 0);
                    return (
                      <tr key={i} className="group hover:bg-[rgba(36,128,255,0.03)] transition-all">
                        <td className="py-3 px-4 font-bold tabular-nums text-[#c4c6cc] group-hover:text-[#2480ff]">{(i + 1).toString().padStart(3, '0')}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#74777d]">{alert.timestamp}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {alert.detections.map((d, j) => (
                              <span key={j} className="border border-[rgba(36,128,255,0.1)] px-2 py-0.5 text-[8px] font-bold text-[#2480ff] group-hover:border-[#2480ff] transition-colors">{d.label.toUpperCase()}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                             <div className="w-16 h-1 bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${maxConf * 100}%`, background: maxConf > 0.85 ? '#16a34a' : maxConf > 0.65 ? '#2480ff' : '#ffbb33' }} />
                             </div>
                             <span className="font-black tabular-nums text-[#191c1e]">{(maxConf * 100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {alert.is_person_search_match ? (
                            <span className="bg-[#ba1a1a] text-white text-[7px] px-2 py-1 font-black rounded-sm shadow-[0_0_10px_rgba(186,26,26,0.2)]">ALPHA_TARGET</span>
                          ) : (
                            <span className="text-[7px] font-black text-[#c4c6cc] border border-[rgba(0,0,0,0.06)] px-2 py-1 rounded-sm">DETECTION</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default DashboardAnalytics;






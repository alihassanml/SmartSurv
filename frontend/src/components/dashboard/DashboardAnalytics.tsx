import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import type { Alert, PersonEvent } from '../../types/dashboard';

interface Props {
  alerts: Alert[];
  detectedPersons: PersonEvent[];
  isConnected: boolean;
  systemMode: 'detection' | 'search' | 'both';
}

const COLORS = ['#b0c6ff', '#b4c6f8', '#a855f7', '#ff4466', '#ffbb33', '#ff8c00'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111316] border border-[rgba(176,198,255,0.2)] px-3 py-2 font-sans shadow-lg">
      <p className="text-[9px] text-[#b0c6ff]/50 mb-1 tracking-widest">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[11px] font-bold" style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}{p.name === 'CONF%' ? '%' : ''}
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
}> = ({ label, value, color, sub, index, symbol }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
    className="border border-[rgba(176,198,255,0.1)] bg-[#111316] p-5 relative overflow-hidden group hover:border-[rgba(176,198,255,0.2)] transition-colors duration-300"
  >
    <div
      className="absolute top-0 left-0 w-full h-[1px]"
      style={{ background: `linear-gradient(to right, transparent, ${color}50, transparent)` }}
    />
    <div
      className="absolute bottom-0 right-0 w-[1px] h-full opacity-20"
      style={{ background: `linear-gradient(to top, ${color}50, transparent)` }}
    />
    <p className="text-[8px] tracking-[0.3em] opacity-40 mb-3 uppercase">{label}</p>
    <p className="text-4xl font-bold tabular-nums" style={{ color, textShadow: `0 0 20px ${color}40` }}>{value}</p>
    <p className="text-[8px] opacity-25 mt-2 uppercase tracking-widest">{sub}</p>
    <div className="absolute bottom-3 right-4 text-[28px] opacity-5 font-bold select-none" style={{ color }}>
      {symbol}
    </div>
  </motion.div>
);

const DashboardAnalytics: React.FC<Props> = ({ alerts, detectedPersons, isConnected, systemMode }) => {
  const data = useMemo(() => {
    // Activity type breakdown
    const activityMap: Record<string, { count: number; confidences: number[] }> = {};
    alerts.forEach(alert => {
      alert.detections.forEach(d => {
        if (!activityMap[d.label]) activityMap[d.label] = { count: 0, confidences: [] };
        activityMap[d.label].count++;
        activityMap[d.label].confidences.push(d.confidence * 100);
      });
    });

    const activityBreakdown = Object.entries(activityMap)
      .map(([name, { count, confidences }]) => ({
        name: name.toUpperCase(),
        count,
        avgConf: Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length),
      }))
      .sort((a, b) => b.count - a.count);

    const totalDetections = activityBreakdown.reduce((a, b) => a + b.count, 0);

    // Hourly buckets for last 24h
    const now = new Date();
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const h = new Date(now.getTime() - (23 - i) * 3600000);
      return {
        hour: `${h.getHours().toString().padStart(2, '0')}:00`,
        alerts: 0,
        persons: 0,
      };
    });

    let anyParsed = false;
    alerts.forEach(alert => {
      try {
        const d = new Date(alert.timestamp.replace(' ', 'T'));
        if (!isNaN(d.getTime())) {
          const hoursAgo = Math.floor((now.getTime() - d.getTime()) / 3600000);
          if (hoursAgo >= 0 && hoursAgo < 24) {
            hourlyData[23 - hoursAgo].alerts++;
            anyParsed = true;
          }
        }
      } catch (_) {}
    });

    // Fallback: spread across last few hours if timestamps unparseable
    if (!anyParsed && alerts.length > 0) {
      const spread = Math.min(alerts.length, 6);
      for (let i = 0; i < alerts.length; i++) {
        hourlyData[23 - (i % spread)].alerts++;
      }
    }

    detectedPersons.forEach(p => {
      try {
        const d = new Date(p.timestamp.replace(' ', 'T'));
        if (!isNaN(d.getTime())) {
          const hoursAgo = Math.floor((now.getTime() - d.getTime()) / 3600000);
          if (hoursAgo >= 0 && hoursAgo < 24) hourlyData[23 - hoursAgo].persons++;
        }
      } catch (_) {}
    });

    // Overall confidence
    const allConf = alerts.flatMap(a => a.detections.map(d => d.confidence * 100));
    const avgConf = allConf.length > 0
      ? Math.round(allConf.reduce((a, b) => a + b, 0) / allConf.length)
      : 0;

    // Peak hour
    const peakHour = [...hourlyData].sort((a, b) => b.alerts - a.alerts)[0];

    return {
      activityBreakdown,
      hourlyData,
      avgConf,
      totalDetections,
      totalAlerts: alerts.length,
      personMatches: alerts.filter(a => a.is_person_search_match).length,
      uniquePersons: detectedPersons.length,
      peakHour: peakHour?.alerts > 0 ? peakHour.hour : '',
    };
  }, [alerts, detectedPersons]);

  const modeLabel = { detection: 'ACTIVITY_SCAN', search: 'PERSON_SEARCH', both: 'HYBRID_LINK' }[systemMode];
  const modeColor = { detection: '#b0c6ff', search: '#ff4466', both: '#b4c6f8' }[systemMode];

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0e11] font-sans">
      {/* Analytics Header */}
      <div className="px-6 pt-5 pb-4 border-b border-[rgba(176,198,255,0.08)] flex items-center justify-between">
        <div>
          <p className="text-[8px] tracking-[0.35em] opacity-30 mb-1">INTELLIGENCE_DASHBOARD</p>
          <h1 className="text-xl font-bold tracking-[0.15em] text-[#b0c6ff]">ANALYTICS_CORE</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[7px] opacity-30 tracking-widest mb-0.5">ACTIVE_MODE</p>
            <p className="text-[10px] font-bold" style={{ color: modeColor }}>{modeLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-[7px] opacity-30 tracking-widest mb-0.5">UPLINK_STATUS</p>
            <div className="flex items-center gap-1.5 justify-end">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#b0c6ff] animate-pulse' : 'bg-red-500'}`} />
              <p className="text-[10px] font-bold">{isConnected ? 'CONNECTED' : 'OFFLINE'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="TOTAL_ALERTS" value={data.totalAlerts} color="#b0c6ff" sub="incidents logged" index={0} symbol="â–²" />
          <StatCard label="AVG_CONFIDENCE" value={`${data.avgConf}%`} color="#b4c6f8" sub="AI reliability" index={1} symbol="â—†" />
          <StatCard label="PERSONS_DETECTED" value={data.uniquePersons} color="#a855f7" sub="unique subjects" index={2} symbol="â—" />
          <StatCard label="TARGET_MATCHES" value={data.personMatches} color="#ff4466" sub="watchlist hits" index={3} symbol="âœ•" />
        </div>

        {/* Secondary stat row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'TOTAL_DETECTIONS', value: data.totalDetections, color: '#b0c6ff', note: 'across all classes' },
            { label: 'PEAK_ACTIVITY_HOUR', value: data.peakHour, color: '#b4c6f8', note: 'highest alert density' },
            { label: 'ACTIVITY_CLASSES', value: data.activityBreakdown.length, color: '#a855f7', note: 'distinct threat types' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.07 }}
              className="border border-[rgba(176,198,255,0.08)] bg-[#111316] px-5 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-[8px] opacity-30 tracking-[0.25em] uppercase mb-1">{s.label}</p>
                <p className="text-[8px] opacity-20 uppercase">{s.note}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-3 gap-4">

          {/* Hourly timeline â€” area chart */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="col-span-2 border border-[rgba(176,198,255,0.1)] bg-[#111316] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[8px] tracking-[0.3em] opacity-30 mb-0.5">TEMPORAL_ANALYSIS</p>
                <p className="text-[11px] font-bold text-[#b0c6ff]">DETECTIONS LAST 24H</p>
              </div>
              <div className="flex items-center gap-4 text-[8px] opacity-60">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#b0c6ff] inline-block" />ALERTS
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#a855f7] inline-block" />PERSONS
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.hourlyData} margin={{ top: 5, right: 8, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAlert" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b0c6ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#b0c6ff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gPerson" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(176,198,255,0.05)" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: 'rgba(176,198,255,0.3)', fontSize: 8, fontFamily: 'monospace' }}
                  tickLine={false} axisLine={false} interval={3}
                />
                <YAxis
                  tick={{ fill: 'rgba(176,198,255,0.3)', fontSize: 8, fontFamily: 'monospace' }}
                  tickLine={false} axisLine={false} allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="alerts" name="ALERTS" stroke="#b0c6ff" strokeWidth={1.5} fill="url(#gAlert)" dot={false} />
                <Area type="monotone" dataKey="persons" name="PERSONS" stroke="#a855f7" strokeWidth={1.5} fill="url(#gPerson)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Activity breakdown bars */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="border border-[rgba(176,198,255,0.1)] bg-[#111316] p-5"
          >
            <p className="text-[8px] tracking-[0.3em] opacity-30 mb-0.5">THREAT_MATRIX</p>
            <p className="text-[11px] font-bold text-[#b0c6ff] mb-4">ACTIVITY BREAKDOWN</p>
            {data.activityBreakdown.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2 opacity-15">
                <p className="text-[9px] tracking-[0.3em]">AWAITING_INCIDENTS...</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[200px] pr-1">
                {data.activityBreakdown.map((act, i) => (
                  <div key={act.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-bold" style={{ color: COLORS[i % COLORS.length] }}>{act.name}</span>
                      <span className="text-[9px] opacity-50 tabular-nums">{act.count}Ã—</span>
                    </div>
                    <div className="h-1 bg-[rgba(176,198,255,0.05)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((act.count / data.totalDetections) * 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                        className="h-full"
                        style={{
                          background: COLORS[i % COLORS.length],
                          boxShadow: `0 0 8px ${COLORS[i % COLORS.length]}40`,
                        }}
                      />
                    </div>
                    <p className="text-[7px] opacity-20 mt-0.5 text-right">
                      {Math.round((act.count / data.totalDetections) * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-4">

          {/* Detection Frequency Bar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="border border-[rgba(176,198,255,0.1)] bg-[#111316] p-5"
          >
            <p className="text-[8px] tracking-[0.3em] opacity-30 mb-0.5">FREQUENCY_ANALYSIS</p>
            <p className="text-[11px] font-bold text-[#b0c6ff] mb-4">DETECTIONS PER ACTIVITY</p>
            {data.activityBreakdown.length === 0 ? (
              <div className="h-[170px] flex items-center justify-center opacity-15 text-[9px] tracking-widest">NO_DATA</div>
            ) : (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={data.activityBreakdown} margin={{ top: 4, right: 8, left: -28, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(176,198,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(176,198,255,0.4)', fontSize: 7, fontFamily: 'monospace' }}
                    tickLine={false} axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(176,198,255,0.3)', fontSize: 8, fontFamily: 'monospace' }}
                    tickLine={false} axisLine={false} allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="COUNT" radius={[2, 2, 0, 0]} maxBarSize={40}>
                    {data.activityBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Confidence Bar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="border border-[rgba(180,198,248,0.1)] bg-[#111316] p-5"
          >
            <p className="text-[8px] tracking-[0.3em] opacity-30 mb-0.5">RELIABILITY_INDEX</p>
            <p className="text-[11px] font-bold text-[#b4c6f8] mb-4">AVG CONFIDENCE BY TYPE</p>
            {data.activityBreakdown.length === 0 ? (
              <div className="h-[170px] flex items-center justify-center opacity-15 text-[9px] tracking-widest">NO_DATA</div>
            ) : (
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={data.activityBreakdown} margin={{ top: 4, right: 8, left: -20, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(180,198,248,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(180,198,248,0.4)', fontSize: 7, fontFamily: 'monospace' }}
                    tickLine={false} axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(180,198,248,0.3)', fontSize: 8, fontFamily: 'monospace' }}
                    tickLine={false} axisLine={false} domain={[0, 100]} unit="%"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgConf" name="CONF%" radius={[2, 2, 0, 0]} maxBarSize={40}>
                    {data.activityBreakdown.map((entry, i) => (
                      <Cell
                        key={i}
                        fill="#b4c6f8"
                        fillOpacity={0.4 + (entry.avgConf / 200)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Recent Incidents Table */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="border border-[rgba(176,198,255,0.1)] bg-[#111316] p-5"
        >
          <p className="text-[8px] tracking-[0.3em] opacity-30 mb-0.5">INCIDENT_LEDGER</p>
          <p className="text-[11px] font-bold text-[#b0c6ff] mb-4">RECENT DETECTIONS</p>
          <div className="overflow-x-auto overflow-y-auto max-h-64">
            <table className="w-full text-[9px] font-sans border-collapse">
              <thead className="sticky top-0 bg-[#111316] z-10">
                <tr className="border-b border-[rgba(176,198,255,0.08)]">
                  {['#', 'TIMESTAMP', 'DETECTED ACTIVITIES', 'MAX CONFIDENCE', 'CLASSIFICATION'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-[#b0c6ff]/35 tracking-[0.2em] font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center opacity-15 tracking-widest">NO_INCIDENTS_RECORDED</td>
                  </tr>
                ) : (
                  alerts.map((alert, i) => {
                    const maxConf = Math.max(...alert.detections.map(d => d.confidence), 0);
                    return (
                      <tr
                        key={i}
                        className="border-b border-[rgba(176,198,255,0.04)] hover:bg-[rgba(176,198,255,0.02)] transition-colors"
                      >
                        <td className="py-2.5 px-3 opacity-25 tabular-nums">{(i + 1).toString().padStart(2, '0')}</td>
                        <td className="py-2.5 px-3 opacity-40 tabular-nums">{alert.timestamp}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {alert.detections.slice(0, 4).map((d, j) => (
                              <span
                                key={j}
                                className="border border-[rgba(176,198,255,0.2)] px-1.5 py-0.5 text-[7px] text-[#b0c6ff]"
                              >
                                {d.label.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className="font-bold tabular-nums"
                            style={{
                              color: maxConf > 0.85 ? '#ff4466' : maxConf > 0.65 ? '#ffbb33' : '#b0c6ff',
                            }}
                          >
                            {(maxConf * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {alert.is_person_search_match ? (
                            <span className="text-[7px] px-1.5 py-0.5 bg-red-600/15 text-red-400 border border-red-600/30">
                              TARGET_MATCH
                            </span>
                          ) : (
                            <span className="opacity-25">DETECTION</span>
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


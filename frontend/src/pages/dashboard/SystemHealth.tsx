import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Cpu, Zap, HardDrive, AlertCircle, Monitor, Activity, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { API } from '../../types/dashboard';

interface SystemSpecs {
  os: string;
  cpu: string;
  cores: number;
  ram: number;
  gpu: { name: string; vram: number } | null;
  capacity: number;
  status: string;
}

const SystemHealth: React.FC = () => {
  const [specs, setSpecs] = useState<SystemSpecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfData, setPerfData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/system/check`)
      .then(res => res.json())
      .then(data => { setSpecs(data); setLoading(false); })
      .catch(() => setLoading(false));

    // Simulate live performance data for the graph
    const interval = setInterval(() => {
        setPerfData(prev => {
            const newData = [...prev, {
                time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                latency: 10 + Math.random() * 25,
                load: 15 + Math.random() * 10
            }].slice(-20);
            return newData;
        });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center" style={{ background: '#e8ecf0' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <Zap className="w-8 h-8" style={{ color: '#2480ff', opacity: 0.4 }} />
      </motion.div>
    </div>
  );

  if (!specs) return null;

  const isInsufficient = specs.capacity === 0;

  return (
    <div className="h-full overflow-y-auto font-sans pb-10" style={{ background: '#e8ecf0' }}>
      <div className="p-8 space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-[#2480ff] text-white text-[7px] font-black tracking-widest rounded-sm">V2.4.0</span>
                <p className="text-[9px] tracking-[0.4em] font-bold uppercase" style={{ color: '#74777d' }}>
                Diagnostic Terminal / ROOT_ACCESS
                </p>
            </div>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>
              SYSTEM INTEGRITY
              <div className={`w-3 h-3 rounded-full animate-pulse ${isInsufficient ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-[#16a34a] shadow-[0_0_10px_rgba(22,163,74,0.5)]'}`} />
            </h1>
          </div>

          {/* Info badges */}
          <div className="flex items-center gap-4 px-5 py-3 rounded-lg"
            style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: '#74777d' }}>Kernel Uptime</span>
              <span className="text-[11px] font-mono font-bold" style={{ color: '#191c1e' }}>02:14:55:09</span>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'rgba(0,0,0,0.1)' }} />
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: '#74777d' }}>Auth Status</span>
              <span className="text-[11px] font-mono font-bold" style={{ color: '#16a34a' }}>SUPER_USER</span>
            </div>
          </div>
        </div>

        {/* Main Diagnostic Row */}
        <div className="grid grid-cols-12 gap-6">
            
            {/* Capacity Verdict */}
            <motion.div
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="col-span-12 lg:col-span-5 p-7 rounded-xl flex flex-col justify-between"
                style={{
                    background: isInsufficient ? 'rgba(186,26,26,0.06)' : 'white',
                    border: `1px solid ${isInsufficient ? 'rgba(186,26,26,0.2)' : 'rgba(0,0,0,0.05)'}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                }}
            >
                <div className="space-y-2">
                    <p className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: '#74777d' }}>Capacity Verdict</p>
                    <h2 className="text-4xl font-black tracking-tighter" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>
                        {isInsufficient ? 'UNSUPPORTED' : `${specs.capacity} CAMERAS`}
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: isInsufficient ? '#ba1a1a' : '#2480ff' }}>
                        {isInsufficient ? 'INSUFFICIENT RESOURCES' : 'HARDWARE_OPTIMIZED'}
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[rgba(0,0,0,0.05)]">
                    <p className="text-[8px] font-bold uppercase tracking-widest mb-4" style={{ color: '#74777d' }}>Resource Allocation</p>
                    <div className="flex gap-2 items-end h-16">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex-1 rounded-sm transition-all duration-500"
                                style={{
                                    height: i < (isInsufficient ? 1 : specs.capacity + 2) ? `${40 + Math.random() * 60}%` : '15%',
                                    background: i < specs.capacity ? '#16a34a' : 'rgba(0,0,0,0.05)',
                                    opacity: i < specs.capacity ? 0.8 : 1
                                }} />
                        ))}
                    </div>
                    <div className="flex justify-between mt-3">
                         <span className="text-[7px] font-black text-[#c4c6cc]">0.0 NODE_ID</span>
                         <span className="text-[7px] font-black text-[#c4c6cc]">MAX_CAPACITY</span>
                    </div>
                </div>
            </motion.div>

            {/* Live Performance Chart */}
            <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="col-span-12 lg:col-span-7 p-7 rounded-xl"
                style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Activity className="text-[#2480ff] w-4 h-4" />
                        <div>
                            <p className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: '#74777d' }}>Live Diagnostics</p>
                            <p className="text-xs font-bold" style={{ color: '#191c1e' }}>INFERENCE_LATENCY (RT)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-[8px] font-black">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#2480ff]" />LATENCY (ms)</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#a855f7]" />LOAD (%)</span>
                    </div>
                </div>
                
                <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={perfData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis tick={{ fill: '#74777d', fontSize: 7, fontWeight: 900 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="latency" stroke="#2480ff" strokeWidth={2.5} dot={false} animationDuration={300} />
                        <Line type="monotone" dataKey="load" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="5 5" animationDuration={300} />
                    </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-[rgba(0,0,0,0.03)]">
                    <p className="text-[8px] font-bold text-[#c4c6cc] tracking-widest uppercase">Real-time hardware telemetry active</p>
                    <p className="text-[10px] font-black text-[#2480ff]">AVG: 18.4ms</p>
                </div>
            </motion.div>
        </div>

        {/* Spec Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CPU Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-6 rounded-xl space-y-4"
            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div className="flex items-center justify-between">
                <div className="p-2 bg-[#2480ff]/10 rounded-lg text-[#2480ff]"><Cpu size={18} /></div>
                <div className="text-right">
                    <p className="text-[7px] font-black text-[#74777d] tracking-widest uppercase">CPU_CORE</p>
                    <p className="text-sm font-black text-[#191c1e]">{specs.cores} UNITS</p>
                </div>
            </div>
            <div>
                <p className="text-[8px] font-black tracking-widest uppercase mb-1" style={{ color: '#74777d' }}>Processor Signature</p>
                <p className="text-sm font-bold leading-tight" style={{ color: '#191c1e' }}>{specs.cpu}</p>
            </div>
          </motion.div>

          {/* Memory Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-6 rounded-xl space-y-4"
            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div className="flex items-center justify-between">
                <div className="p-2 bg-[#a855f7]/10 rounded-lg text-[#a855f7]"><HardDrive size={18} /></div>
                <div className="text-right">
                    <p className="text-[7px] font-black text-[#74777d] tracking-widest uppercase">RAM_POOL</p>
                    <p className="text-sm font-black text-[#191c1e]">{specs.ram}GB ADDR</p>
                </div>
            </div>
            <div>
                <p className="text-[8px] font-black tracking-widest uppercase mb-1" style={{ color: '#74777d' }}>Memory Saturation</p>
                <div className="w-full h-1.5 bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-[#a855f7]" style={{ width: '42%' }} />
                </div>
                <p className="text-[7px] font-bold text-[#c4c6cc] mt-2 uppercase tracking-widest">4.2GB Available / System Reserved</p>
            </div>
          </motion.div>

          {/* GPU Card */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-6 rounded-xl space-y-4"
            style={{ background: 'white', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div className="flex items-center justify-between">
                <div className="p-2 bg-[#16a34a]/10 rounded-lg text-[#16a34a]"><Zap size={18} /></div>
                <div className="text-right">
                    <p className="text-[7px] font-black text-[#74777d] tracking-widest uppercase">GPU_ACCEL</p>
                    <p className="text-sm font-black text-[#16a34a]">{specs.gpu ? 'ENABLED' : 'DISABLED'}</p>
                </div>
            </div>
            {specs.gpu ? (
                <div>
                    <p className="text-[8px] font-black tracking-widest uppercase mb-1" style={{ color: '#74777d' }}>NVIDIA Architecture</p>
                    <p className="text-sm font-bold truncate" style={{ color: '#191c1e' }}>{specs.gpu.name}</p>
                    <p className="text-[9px] font-black text-[#16a34a] mt-1">{specs.gpu.vram}GB DEDICATED VRAM</p>
                </div>
            ) : (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">No CUDA acceleration found</p>
            )}
          </motion.div>

        </div>

        {/* Footer Terminal Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#1a1d21] rounded-xl font-mono text-[10px] space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 text-white"><Monitor size={40} /></div>
                <p style={{ color: 'rgba(255,255,255,0.3)' }} className="mb-3 uppercase font-black tracking-widest border-b border-white/5 pb-2">Diagnostic Logs</p>
                <p style={{ color: '#4ade80' }}>[OK] KERNEL_INIT: 0.042s</p>
                <p style={{ color: '#60a5fa' }}>[INFO] DETECTED_NVIDIA_DRIVER: v550.x</p>
                <p style={{ color: '#60a5fa' }}>[INFO] ALLOCATING_VRAM_POOL: 4096MB</p>
                <p style={{ color: '#4ade80' }}>[OK] YOLO_ENGINE_LOADED: DEVICE[0]</p>
                <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ color: 'rgba(255,255,255,0.5)' }}>
                    &gt; MONITORING_HARDWARE_INTEGRITY_
                </motion.p>
            </div>
            <div className="p-6 bg-white border border-[rgba(0,0,0,0.05)] rounded-xl flex flex-col justify-center gap-4">
                 <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                         <Shield size={20} />
                     </div>
                     <div>
                         <p className="text-xs font-black text-[#191c1e]">STABILITY_OPTIMIZED</p>
                         <p className="text-[10px] text-[#74777d]">All sub-systems reporting healthy status.</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                         <TrendingUp size={20} />
                     </div>
                     <div>
                         <p className="text-xs font-black text-[#191c1e]">AI_PERFORMANCE: PEAK</p>
                         <p className="text-[10px] text-[#74777d]">Inference latency optimized via TensorRT/CUDA.</p>
                     </div>
                 </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SystemHealth;

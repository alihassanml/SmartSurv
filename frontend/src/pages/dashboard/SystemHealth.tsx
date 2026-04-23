import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Cpu, Zap, HardDrive, AlertCircle, Monitor } from 'lucide-react';
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

  useEffect(() => {
    fetch(`${API}/api/system/check`)
      .then(res => res.json())
      .then(data => { setSpecs(data); setLoading(false); })
      .catch(() => setLoading(false));
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
    <div className="h-full overflow-y-auto font-sans" style={{ background: '#e8ecf0' }}>
      <div className="p-8 space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.4em] font-bold uppercase mb-2" style={{ color: '#74777d' }}>
              Diagnostic Terminal / v2.4.0
            </p>
            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>
              SYSTEM INTEGRITY
              <div className={`w-3 h-3 rounded-full animate-pulse ${isInsufficient ? 'bg-red-500' : 'bg-green-500'}`} />
            </h1>
          </div>

          {/* Info badges */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded"
            style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)' }}>
            <div className="flex flex-col">
              <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: '#74777d' }}>Uptime</span>
              <span className="text-[11px] font-mono font-bold" style={{ color: '#191c1e' }}>02:14:55:09</span>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'rgba(0,0,0,0.1)' }} />
            <div className="flex flex-col">
              <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: '#74777d' }}>Auth Level</span>
              <span className="text-[11px] font-mono font-bold" style={{ color: '#16a34a' }}>SUPER_USER</span>
            </div>
          </div>
        </div>

        {/* Capacity Verdict */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl"
          style={{
            background: isInsufficient ? 'rgba(186,26,26,0.06)' : 'rgba(36,128,255,0.06)',
            border: `1px solid ${isInsufficient ? 'rgba(186,26,26,0.2)' : 'rgba(36,128,255,0.2)'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold tracking-widest uppercase" style={{ color: '#74777d' }}>Analysis Results</p>
              <h2 className="text-3xl font-black tracking-tighter" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>
                {isInsufficient ? 'UNSUPPORTED HARDWARE' : `${specs.capacity} CAMERAS SUPPORTED`}
              </h2>
              <p className="text-sm font-semibold" style={{ color: isInsufficient ? '#ba1a1a' : '#2480ff' }}>
                System Status: <span className="font-bold">{specs.status}</span>
              </p>
            </div>

            {isInsufficient ? (
              <AlertCircle className="w-14 h-14 text-red-500 opacity-40" />
            ) : (
              <div className="flex gap-2 items-end">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-3 rounded-sm transition-all"
                    style={{
                      height: `${24 + i * 4}px`,
                      background: i < specs.capacity ? '#16a34a' : 'rgba(0,0,0,0.1)',
                    }} />
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Spec Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* CPU */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="p-5 rounded-xl space-y-3"
            style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2.5" style={{ color: '#2480ff' }}>
              <Cpu className="w-4 h-4" />
              <h3 className="text-[10px] font-bold tracking-widest uppercase">Process Unit</h3>
            </div>
            <p className="text-lg font-bold" style={{ color: '#191c1e' }}>{specs.cpu}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#74777d' }}>
              {specs.cores} Logical Cores · {specs.os}
            </p>
          </motion.div>

          {/* Memory */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-5 rounded-xl space-y-3"
            style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2.5" style={{ color: '#2480ff' }}>
              <HardDrive className="w-4 h-4" />
              <h3 className="text-[10px] font-bold tracking-widest uppercase">Memory Resources</h3>
            </div>
            <p className="text-3xl font-black" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>{specs.ram} <span className="text-lg">GB</span></p>
            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: '#74777d' }}>Total System RAM</p>
          </motion.div>

          {/* GPU */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-5 rounded-xl space-y-3 md:col-span-2"
            style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-2.5" style={{ color: '#2480ff' }}>
              <Zap className="w-4 h-4" />
              <h3 className="text-[10px] font-bold tracking-widest uppercase">Neural Acceleration (GPU)</h3>
            </div>
            {specs.gpu ? (
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <p className="text-xl font-bold" style={{ color: '#191c1e' }}>{specs.gpu.name}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mt-1" style={{ color: '#74777d' }}>NVIDIA CUDA Compatible</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black" style={{ color: '#16a34a', fontFamily: "'Manrope', sans-serif" }}>{specs.gpu.vram} <span className="text-base">GB VRAM</span></p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide mt-1" style={{ color: '#74777d' }}>Dedicated Memory</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 py-1" style={{ color: '#b45309' }}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-widest">No GPU Detected — Running in CPU Fallback Mode</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recommendations & Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recommendations */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 p-5 rounded-xl space-y-4"
            style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2" style={{ color: '#191c1e' }}>
              <Shield className="w-3 h-3" style={{ color: '#2480ff' }} /> Security Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {specs.ram < 16 && (
                <div className="p-3 rounded" style={{ background: 'rgba(180,83,9,0.07)', borderLeft: '2px solid #b45309' }}>
                  <p className="text-[10px] font-bold mb-1 uppercase" style={{ color: '#b45309' }}>Memory Bottleneck</p>
                  <p className="text-[10px]" style={{ color: '#74777d' }}>Upgrade to 16GB RAM for faster indexing.</p>
                </div>
              )}
              {!specs.gpu && (
                <div className="p-3 rounded" style={{ background: 'rgba(186,26,26,0.06)', borderLeft: '2px solid #ba1a1a' }}>
                  <p className="text-[10px] font-bold mb-1 uppercase" style={{ color: '#ba1a1a' }}>Inference Lag</p>
                  <p className="text-[10px]" style={{ color: '#74777d' }}>NVIDIA GPU recommended for AI detection.</p>
                </div>
              )}
              <div className="p-3 rounded" style={{ background: 'rgba(22,163,74,0.07)', borderLeft: '2px solid #16a34a' }}>
                <p className="text-[10px] font-bold mb-1 uppercase" style={{ color: '#16a34a' }}>Resolution Check</p>
                <p className="text-[10px]" style={{ color: '#74777d' }}>Feeds locked at 640×480 for stability.</p>
              </div>
              <div className="p-3 rounded" style={{ background: 'rgba(36,128,255,0.06)', borderLeft: '2px solid #2480ff' }}>
                <p className="text-[10px] font-bold mb-1 uppercase" style={{ color: '#2480ff' }}>Multi-Camera</p>
                <p className="text-[10px]" style={{ color: '#74777d' }}>Hardware scan active on all USB ports.</p>
              </div>
            </div>
          </motion.div>

          {/* Terminal — intentionally dark */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="p-4 rounded-xl font-mono text-[9px] overflow-hidden relative"
            style={{ background: '#1a1d21', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="absolute top-0 right-0 p-2 opacity-20"><Monitor className="w-3 h-3 text-white" /></div>
            <p className="mb-2 pb-1 uppercase tracking-tighter" style={{ color: 'rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              Live Diagnostics Log
            </p>
            <div className="space-y-1">
              <p style={{ color: '#4ade80' }}>[OK] CUDA_INITIALIZED_SUCCESS</p>
              <p style={{ color: '#60a5fa' }}>[INFO] SCANNING_LOCAL_DRIVES...</p>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>[INFO] MEMORY_PAGING_STABLE</p>
              <p style={{ color: '#60a5fa' }}>[INFO] DETECTING_PERIPHERALS...</p>
              <p style={{ color: '#4ade80' }}>[OK] MULTI_CAMERA_WATCHDOG_UP</p>
              <motion.p
                animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                &gt; LISTENING_FOR_HARDWARE_CHANGES_
              </motion.p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default SystemHealth;

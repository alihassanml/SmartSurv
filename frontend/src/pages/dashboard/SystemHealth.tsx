import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Cpu, Zap, HardDrive, Layout, AlertCircle, CheckCircle2, Monitor } from 'lucide-react';
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
      .then(data => {
        setSpecs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center bg-[#0c0e11]">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <Zap className="w-8 h-8 text-[#b0c6ff] opacity-20" />
      </motion.div>
    </div>
  );

  if (!specs) return null;

  const isInsufficient = specs.capacity === 0;

  return (
    <div className="h-full overflow-y-auto bg-[#0c0e11] font-sans relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
        style={{ backgroundImage: 'radial-gradient(#b0c6ff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0a58ca]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="p-8 space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.5em] text-[#b0c6ff]/40 font-black uppercase mb-2">Diagnostic Terminal / v2.4.0</p>
            <h1 className="text-4xl font-black tracking-tighter text-[#ccd8ff] flex items-center gap-4">
              SYSTEM_INTEGRITY_CHECK
              <div className={`w-3.5 h-3.5 rounded-full ${isInsufficient ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-[#00ff85] shadow-[0_0_15px_rgba(0,255,133,0.5)]'} animate-pulse`} />
            </h1>
          </div>
          <div className="px-4 py-2 border border-white/5 bg-white/5 backdrop-blur-sm rounded flex items-center gap-6">
             <div className="flex flex-col">
                <span className="text-[7px] text-white/30 uppercase font-black">Uptime</span>
                <span className="text-[10px] font-mono text-[#b0c6ff]">02:14:55:09</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[7px] text-white/30 uppercase font-black">Auth_Level</span>
                <span className="text-[10px] font-mono text-[#00ff85]">SUPER_USER</span>
             </div>
          </div>
        </div>

        {/* Capacity Verdict Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-8 relative overflow-hidden"
          style={{ 
            background: isInsufficient ? 'rgba(147,0,10,0.1)' : 'rgba(10,88,202,0.1)', 
            border: `1px solid ${isInsufficient ? 'rgba(255,180,171,0.2)' : 'rgba(176,198,255,0.2)'}`,
            borderRadius: '0.5rem'
          }}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold tracking-widest text-[#b0c6ff]/50 uppercase">Analysis Results</p>
              <h2 className="text-4xl font-black text-[#ccd8ff] tracking-tighter">
                {isInsufficient ? 'UNSUPPORTED_HARDWARE' : `${specs.capacity} CAMERAS SUPPORTED`}
              </h2>
              <p className="text-sm font-medium" style={{ color: isInsufficient ? '#ffb4ab' : '#b0c6ff' }}>
                System Status: <span className="font-bold">{specs.status}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {isInsufficient ? (
                <AlertCircle className="w-16 h-16 text-red-500 opacity-50" />
              ) : (
                <div className="flex gap-2">
                   {[...Array(6)].map((_, i) => (
                     <div key={i} className={`w-3 h-10 rounded-sm ${i < specs.capacity ? 'bg-[#00ff85]' : 'bg-white/5'}`} />
                   ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#b0c6ff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </motion.div>

        {/* Requirements Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CPU & OS */}
          <div className="p-6 bg-[#111316] border border-white/5 rounded-md space-y-4">
            <div className="flex items-center gap-3 text-[#b0c6ff]">
              <Cpu className="w-5 h-5" />
              <h3 className="text-xs font-bold tracking-widest uppercase">Process Unit</h3>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-[#ccd8ff]">{specs.cpu}</p>
              <p className="text-[10px] text-white/30 uppercase font-bold">{specs.cores} LOGICAL CORES | {specs.os} PLATFORM</p>
            </div>
          </div>

          {/* Memory */}
          <div className="p-6 bg-[#111316] border border-white/5 rounded-md space-y-4">
            <div className="flex items-center gap-3 text-[#b0c6ff]">
              <HardDrive className="w-5 h-5" />
              <h3 className="text-xs font-bold tracking-widest uppercase">Memory Resources</h3>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-[#ccd8ff]">{specs.ram} GB</p>
              <p className="text-[10px] text-white/30 uppercase font-bold">TOTAL SYSTEM RAM</p>
            </div>
          </div>

          {/* GPU */}
          <div className="p-6 bg-[#111316] border border-white/5 rounded-md space-y-4 md:col-span-2">
            <div className="flex items-center gap-3 text-[#b0c6ff]">
              <Zap className="w-5 h-5" />
              <h3 className="text-xs font-bold tracking-widest uppercase">Neural Acceleration (GPU)</h3>
            </div>
            {specs.gpu ? (
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <p className="text-xl font-bold text-[#ccd8ff]">{specs.gpu.name}</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold">NVIDIA CUDA COMPATIBLE</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#00ff85]">{specs.gpu.vram} GB</p>
                  <p className="text-[10px] text-white/30 uppercase font-bold">DEDICATED VRAM</p>
                </div>
              </div>
            ) : (
              <div className="py-2 flex items-center gap-3 text-amber-500/60">
                <AlertCircle className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-widest">NO GPU DETECTED - SYSTEM RUNNING IN CPU FALLBACK MODE</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations & Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 border border-white/5 bg-black/20 rounded-md space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#0a58ca] flex items-center gap-2">
              <Shield className="w-3 h-3" /> SECURITY_RECOMMENDATIONS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specs.ram < 16 && (
                <div className="p-3 bg-white/5 border-l-2 border-amber-500/50">
                  <p className="text-[10px] font-bold text-amber-500 mb-1 uppercase">Memory Bottleneck</p>
                  <p className="text-[10px] text-white/40">Upgrade to 16GB RAM for faster indexing.</p>
                </div>
              )}
              {!specs.gpu && (
                <div className="p-3 bg-white/5 border-l-2 border-red-500/50">
                  <p className="text-[10px] font-bold text-red-500 mb-1 uppercase">Inference Lag</p>
                  <p className="text-[10px] text-white/40">NVIDIA GPU recommended for AI detection.</p>
                </div>
              )}
              <div className="p-3 bg-white/5 border-l-2 border-[#00ff85]/50">
                <p className="text-[10px] font-bold text-[#00ff85] mb-1 uppercase">Resolution Check</p>
                <p className="text-[10px] text-white/40">Feeds locked at 640x480 for stability.</p>
              </div>
              <div className="p-3 bg-white/5 border-l-2 border-[#b0c6ff]/50">
                <p className="text-[10px] font-bold text-[#b0c6ff] mb-1 uppercase">Multi-Camera</p>
                <p className="text-[10px] text-white/40">Hardware scan active on all USB ports.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-black border border-white/10 rounded-md font-mono text-[9px] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 opacity-20"><Monitor className="w-3 h-3" /></div>
            <p className="text-white/20 mb-2 border-b border-white/5 pb-1 uppercase tracking-tighter">Live Diagnostics Log</p>
            <div className="space-y-1">
              <p className="text-[#00ff85]">[OK] CUDA_INITIALIZED_SUCCESS</p>
              <p className="text-[#b0c6ff]">[INFO] SCANNING_LOCAL_DRIVES...</p>
              <p className="text-white/40">[INFO] MEMORY_PAGING_STABLE</p>
              <p className="text-[#b0c6ff]">[INFO] DETECTING_PERIPHERALS...</p>
              <p className="text-[#00ff85]">[OK] MULTI_CAMERA_WATCHDOG_UP</p>
              <motion.p 
                animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-white/60"
              >
                &gt; LISTENING_FOR_HARDWARE_CHANGES_
              </motion.p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SystemHealth;

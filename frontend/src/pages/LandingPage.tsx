import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Bell, Activity, Zap, Lock } from 'lucide-react';

// Animated Matrix rain canvas
const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    const fontSize = 13;
    const cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);
    const chars = '01アイウエオカキクケコサNSM%#@${}[]()><';
    const draw = () => {
      ctx.fillStyle = 'rgba(6,6,8,0.07)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px JetBrains Mono`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.globalAlpha = Math.random() * 0.35 + 0.05;
        ctx.fillStyle = i % 7 === 0 ? '#ffffff' : '#00ff85';
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      ctx.globalAlpha = 1;
    };
    const interval = setInterval(draw, 55);
    window.addEventListener('resize', resize);
    return () => { clearInterval(interval); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-[0.22] pointer-events-none" />;
};

const features = [
  { icon: Eye,      title: 'Autonomous Detection', desc: 'Detects fights, weapons, and activities using YOLOv8 deep learning CV in real-time.', color: '#00ff85', delay: 0.5 },
  { icon: Activity, title: 'Person Re-ID',          desc: 'Upload a reference image and the system scans all live feeds to lock on the target.',   color: '#00e5ff', delay: 0.6 },
  { icon: Bell,     title: 'Instant Uplink',         desc: 'Multi-channel alerts via Dashboard, WhatsApp, and Email with evidence snapshots.',         color: '#a855f7', delay: 0.7 },
];

const termLines = [
  { text: '> Initializing neural networks...',             result: '' },
  { text: '> Loading YOLOv8 detection engine...',          result: '[OK]' },
  { text: '> Face recognition module...',                  result: '[READY]' },
  { text: '> WebSocket uplink established...',             result: '[ONLINE]' },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  const [termStep, setTermStep] = useState(0);

  useEffect(() => {
    if (termStep >= termLines.length) return;
    const t = setTimeout(() => setTermStep(s => s + 1), 650);
    return () => clearTimeout(t);
  }, [termStep]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  return (
    <div className="min-h-screen bg-[#060608] text-[#00ff85] font-mono overflow-x-hidden relative">
      <MatrixRain />

      {/* Centre ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 25%, rgba(0,255,133,0.07) 0%, transparent 70%)' }} />

      {/* ── NAV ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex justify-between items-center px-8 py-5 border-b border-[rgba(0,255,133,0.1)] backdrop-blur-sm bg-[rgba(6,6,8,0.75)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-[#00ff85] flex items-center justify-center animate-glow-pulse">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-base font-bold tracking-[0.25em] uppercase">SmartSurv</span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button id="nav-dashboard-btn" onClick={() => navigate('/dashboard')}
              className="btn-primary px-5 py-2 bg-[#00ff85] text-[#060608] font-bold text-xs tracking-widest uppercase hover:bg-[#00c962] transition-colors duration-200">
              Enter Dashboard
            </button>
          ) : (
            <>
              <button id="nav-login-btn" onClick={() => navigate('/login')}
                className="btn-primary px-4 py-2 border border-[rgba(0,255,133,0.35)] text-[#00ff85] hover:border-[#00ff85] hover:bg-[rgba(0,255,133,0.06)] text-xs tracking-widest uppercase transition-all duration-300">
                Login
              </button>
              <button id="nav-signup-btn" onClick={() => navigate('/signup')}
                className="btn-primary px-5 py-2 bg-[#00ff85] text-[#060608] font-bold text-xs tracking-widest uppercase hover:bg-[#00c962] transition-colors duration-200">
                Get Access
              </button>
            </>
          )}
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-8 pt-28 pb-20 flex flex-col items-center text-center"
      >
        {/* Status pill */}
        <motion.div variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 border border-[rgba(0,255,133,0.3)] bg-[rgba(0,255,133,0.03)] text-[10px] tracking-widest uppercase">
          <div className="w-1.5 h-1.5 bg-[#00ff85] rounded-full animate-pulse" />
          SYSTEM_STATUS: ONLINE
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={itemVariants}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          style={{ fontFamily: "'Space Grotesk', monospace" }}>
          Intelligent
          <span className="block" style={{
            background: 'linear-gradient(135deg, #00ff85 0%, #00e5ff 50%, #a855f7 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Surveillance</span>
          <span className="block text-4xl md:text-5xl text-[#00ff85]/50 font-light tracking-widest">
            Automated Reality.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants}
          className="max-w-xl text-sm text-[#00ff85]/55 mb-10 leading-relaxed">
          SmartSurv transforms traditional CCTV into proactive, intelligent security networks using
          YOLOv8, FaceNet, and real-time WebSocket streaming.
        </motion.p>

        {/* Terminal block */}
        <motion.div variants={itemVariants} className="w-full max-w-lg text-left border border-[rgba(0,255,133,0.15)] bg-[rgba(0,0,0,0.55)] mb-12">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[rgba(0,255,133,0.1)] bg-[rgba(0,255,133,0.03)]">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00ff85]/60" />
            <span className="ml-2 text-[9px] opacity-30 tracking-widest">SMARTSURV_BOOT_LOG</span>
          </div>
          <div className="p-4 space-y-1.5 text-[11px] min-h-[90px]">
            <AnimatePresence>
              {termLines.slice(0, termStep).map((line, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-2">
                  <span className="opacity-45">{line.text}</span>
                  {line.result && <span className="text-[#00ff85] font-bold">{line.result}</span>}
                </motion.div>
              ))}
            </AnimatePresence>
            {termStep >= termLines.length && (
              <div className="inline-flex items-center gap-1">
                <span className="opacity-45">&gt;</span>
                <span className="w-2 h-3.5 bg-[#00ff85] inline-block animate-[type-cursor_1s_ease-in-out_infinite]" />
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-24">
          <button id="hero-start-btn"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            className="btn-primary group px-8 py-3.5 bg-[#00ff85] text-[#060608] font-bold text-sm tracking-widest uppercase hover:bg-transparent hover:text-[#00ff85] border-2 border-[#00ff85] transition-all duration-300 flex items-center gap-2">
            <Zap className="w-4 h-4 group-hover:animate-bounce" />
            {isAuthenticated ? 'Open Dashboard' : 'Initialize Access'}
          </button>
          <button id="hero-learn-btn"
            onClick={() => navigate('/login')}
            className="btn-primary px-8 py-3.5 border border-[rgba(0,255,133,0.3)] text-[#00ff85]/70 text-sm tracking-widest uppercase hover:border-[#00ff85] hover:text-[#00ff85] hover:bg-[rgba(0,255,133,0.06)] transition-all duration-300 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Operator Login
          </button>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {features.map((f) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: f.delay, ease: 'easeOut' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative p-6 border border-[rgba(0,255,133,0.08)] bg-[rgba(12,13,16,0.7)] hover:border-[rgba(0,255,133,0.3)] hover:bg-[rgba(0,255,133,0.02)] transition-colors duration-300 text-left cursor-default"
            >
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ borderColor: f.color }} />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ borderColor: f.color }} />
              <div className="w-10 h-10 border mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                style={{ borderColor: `${f.color}40`, color: f.color }}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: f.color }}>{f.title}</h3>
              <p className="text-[12px] text-[#00ff85]/45 leading-relaxed group-hover:text-[#00ff85]/65 transition-colors duration-300">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.main>
    </div>
  );
};

export default LandingPage;

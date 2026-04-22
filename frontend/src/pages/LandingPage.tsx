import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Bell, Activity, Zap, Lock } from 'lucide-react';

const ParticleCanvas: React.FC = () => {
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
    const chars = '01ã‚¢ã‚¤ã‚¦ã‚¨ã‚ªã‚«ã‚­ã‚¯ã‚±ã‚³BCDEF{}[]()><';
    const draw = () => {
      ctx.fillStyle = 'rgba(12,14,17,0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px Inter`;
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.globalAlpha = Math.random() * 0.18 + 0.03;
        ctx.fillStyle = i % 5 === 0 ? '#ccd8ff' : '#b0c6ff';
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      ctx.globalAlpha = 1;
    };
    const interval = setInterval(draw, 60);
    window.addEventListener('resize', resize);
    return () => { clearInterval(interval); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-[0.18] pointer-events-none" />;
};

const features = [
  { icon: Eye,      title: 'Autonomous Detection', desc: 'Detects fights, weapons, and activities using YOLOv8 deep learning CV in real-time.', color: '#b0c6ff', delay: 0.5 },
  { icon: Activity, title: 'Person Re-ID',          desc: 'Upload a reference image and the system scans all live feeds to lock on the target.',   color: '#b4c6f8', delay: 0.6 },
  { icon: Bell,     title: 'Instant Uplink',         desc: 'Multi-channel alerts via Dashboard, WhatsApp, and Email with evidence snapshots.',         color: '#a6b8e9', delay: 0.7 },
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
    <div className="min-h-screen overflow-x-hidden relative" style={{ background: '#0c0e11', color: '#e2e2e6', fontFamily: "'Inter', sans-serif" }}>
      <ParticleCanvas />

      {/* Centre ambient glow */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 25%, rgba(176,198,255,0.06) 0%, transparent 70%)' }} />

      {/* â”€â”€ NAV â”€â”€ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex justify-between items-center px-8 py-5 backdrop-blur-sm"
        style={{ borderBottom: '1px solid rgba(176,198,255,0.1)', background: 'rgba(12,14,17,0.8)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center animate-glow-pulse"
            style={{ border: '1px solid #b0c6ff', borderRadius: '0.25rem' }}>
            <Shield className="w-5 h-5" style={{ color: '#b0c6ff' }} />
          </div>
          <span style={{ fontSize: '0.9rem', fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ccd8ff' }}>
            SmartSurv
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button id="nav-dashboard-btn" onClick={() => navigate('/dashboard')}
              className="btn-primary px-5 py-2 font-bold text-xs tracking-widest uppercase transition-colors duration-200"
              style={{ background: '#0a58ca', color: '#ccd8ff', borderRadius: '0.25rem' }}>
              Enter Dashboard
            </button>
          ) : (
            <>
              <button id="nav-login-btn" onClick={() => navigate('/login')}
                className="btn-primary px-4 py-2 text-xs tracking-widest uppercase transition-all duration-300"
                style={{ border: '1px solid rgba(176,198,255,0.3)', color: '#b0c6ff', borderRadius: '0.25rem', background: 'transparent' }}>
                Login
              </button>
              <button id="nav-signup-btn" onClick={() => navigate('/signup')}
                className="btn-primary px-5 py-2 font-bold text-xs tracking-widest uppercase transition-colors duration-200"
                style={{ background: '#0a58ca', color: '#ccd8ff', borderRadius: '0.25rem' }}>
                Get Access
              </button>
            </>
          )}
        </div>
      </motion.nav>

      {/* â”€â”€ HERO â”€â”€ */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-8 pt-28 pb-20 flex flex-col items-center text-center"
      >
      
        {/* Headline */}
        <motion.h1 variants={itemVariants}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          style={{ fontFamily: "'Manrope', sans-serif", color: '#e2e2e6' }}>
          Intelligent
          <span className="block" style={{
            background: 'linear-gradient(135deg, #b0c6ff 0%, #b4c6f8 40%, #a6b8e9 70%, #ccd8ff 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Surveillance</span>
          <span className="block text-4xl md:text-5xl font-light tracking-widest" style={{ color: 'rgba(176,198,255,0.4)' }}>
            Automated Reality.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants}
          className="max-w-xl text-sm mb-10 leading-relaxed"
          style={{ color: 'rgba(226,226,230,0.55)' }}>
          SmartSurv transforms traditional CCTV into proactive, intelligent security networks using
          YOLOv8, FaceNet, and real-time WebSocket streaming.
        </motion.p>

        {/* Terminal block */}
        <motion.div variants={itemVariants} className="w-full max-w-lg text-left mb-12"
          style={{ border: '1px solid rgba(176,198,255,0.12)', background: 'rgba(17,19,22,0.8)', borderRadius: '0.25rem' }}>
          <div className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(176,198,255,0.08)', background: 'rgba(176,198,255,0.02)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(176,198,255,0.6)' }} />
            <span className="ml-2 text-[9px] opacity-30 tracking-widest" style={{ color: '#b0c6ff' }}>SMARTSURV_BOOT_LOG</span>
          </div>
          <div className="p-4 space-y-1.5 text-[11px] min-h-[90px]" style={{ color: '#c3c6d6', fontFamily: "'Inter', monospace" }}>
            <AnimatePresence>
              {termLines.slice(0, termStep).map((line, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-2">
                  <span className="opacity-50">{line.text}</span>
                  {line.result && <span className="font-bold" style={{ color: '#b0c6ff' }}>{line.result}</span>}
                </motion.div>
              ))}
            </AnimatePresence>
            {termStep >= termLines.length && (
              <div className="inline-flex items-center gap-1">
                <span className="opacity-45" style={{ color: '#b0c6ff' }}>&gt;</span>
                <span className="w-2 h-3.5 inline-block animate-[type-cursor_1s_ease-in-out_infinite]"
                  style={{ background: '#b0c6ff' }} />
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-24">
          <button id="hero-start-btn"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            className="btn-primary group px-8 py-3.5 font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center gap-2"
            style={{ background: '#0a58ca', color: '#ccd8ff', border: '2px solid #0a58ca', borderRadius: '0.25rem' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0a58ca'; (e.currentTarget as HTMLButtonElement).style.color = '#ccd8ff'; }}>
            <Zap className="w-4 h-4" />
            {isAuthenticated ? 'Open Dashboard' : 'Initialize Access'}
          </button>
          <button id="hero-learn-btn"
            onClick={() => navigate('/login')}
            className="btn-primary px-8 py-3.5 text-sm tracking-widest uppercase transition-all duration-300 flex items-center gap-2"
            style={{ border: '1px solid rgba(176,198,255,0.25)', color: 'rgba(176,198,255,0.65)', borderRadius: '0.25rem', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#b0c6ff'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(176,198,255,0.25)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(176,198,255,0.65)'; }}>
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
              className="group relative p-6 text-left cursor-default transition-all duration-300"
              style={{
                border: '1px solid rgba(176,198,255,0.08)',
                background: 'rgba(26,28,31,0.7)',
                borderRadius: '0.5rem',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(176,198,255,0.25)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(30,32,35,0.9)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(176,198,255,0.08)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(26,28,31,0.7)'; }}
            >
              <div className="absolute top-0 left-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ borderTop: `2px solid ${f.color}`, borderLeft: `2px solid ${f.color}` }} />
              <div className="absolute bottom-0 right-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ borderBottom: `2px solid ${f.color}`, borderRight: `2px solid ${f.color}` }} />
              <div className="w-10 h-10 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                style={{ border: `1px solid ${f.color}40`, color: f.color, borderRadius: '0.25rem' }}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: f.color, fontFamily: "'Manrope', sans-serif" }}>{f.title}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(195,198,214,0.5)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.main>
    </div>
  );
};

export default LandingPage;


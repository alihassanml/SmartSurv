import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Bell, Activity, Zap, Lock } from 'lucide-react';

const DotGrid: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(36,128,255,0.12) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        opacity: 0.6,
      }}
    />
  );
};

const features = [
  { icon: Eye,      title: 'Autonomous Detection', desc: 'Detects fights, weapons, and activities using YOLOv8 deep learning CV in real-time.', color: '#2480ff', delay: 0.5 },
  { icon: Activity, title: 'Person Re-ID',          desc: 'Upload a reference image and the system scans all live feeds to lock on the target.',   color: '#47607e', delay: 0.6 },
  { icon: Bell,     title: 'Instant Uplink',         desc: 'Multi-channel alerts via Dashboard, WhatsApp, and Email with evidence snapshots.',         color: '#1a6fef', delay: 0.7 },
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
    <div className="min-h-screen overflow-x-hidden relative" style={{ background: '#e8ecf0', color: '#191c1e', fontFamily: "'Inter', sans-serif" }}>
      <DotGrid />

      {/* Top ambient tint */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(36,128,255,0.06) 0%, transparent 70%)' }} />

      {/* --- NAV --- */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex justify-between items-center px-8 py-4 backdrop-blur-sm"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: 'rgba(247,249,251,0.9)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center"
            style={{ border: '1px solid rgba(36,128,255,0.35)', borderRadius: '0.375rem', background: 'rgba(36,128,255,0.06)' }}>
            <Shield className="w-5 h-5" style={{ color: '#2480ff' }} />
          </div>
          <span style={{ fontSize: '0.9rem', fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#191c1e' }}>
            SmartSurv
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button id="nav-dashboard-btn" onClick={() => navigate('/dashboard')}
              className="btn-primary px-5 py-2 font-bold text-xs tracking-widest uppercase transition-colors duration-200"
              style={{ background: '#2480ff', color: '#ffffff', borderRadius: '0.375rem' }}>
              Enter Dashboard
            </button>
          ) : (
            <>
              <button id="nav-login-btn" onClick={() => navigate('/login')}
                className="btn-primary px-4 py-2 text-xs tracking-widest uppercase transition-all duration-300"
                style={{ border: '1px solid rgba(36,128,255,0.35)', color: '#2480ff', borderRadius: '0.375rem', background: 'transparent' }}>
                Login
              </button>
              <button id="nav-signup-btn" onClick={() => navigate('/signup')}
                className="btn-primary px-5 py-2 font-bold text-xs tracking-widest uppercase transition-colors duration-200"
                style={{ background: '#2480ff', color: '#ffffff', borderRadius: '0.375rem' }}>
                Get Access
              </button>
            </>
          )}
        </div>
      </motion.nav>

      {/* --- HERO --- */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-5xl mx-auto px-8 pt-28 pb-20 flex flex-col items-center text-center"
      >
        {/* Headline */}
        <motion.h1 variants={itemVariants}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          style={{ fontFamily: "'Manrope', sans-serif", color: '#191c1e' }}>
          Intelligent
          <span className="block" style={{
            background: 'linear-gradient(135deg, #2480ff 0%, #1a6fef 40%, #47607e 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Surveillance</span>
          <span className="block text-4xl md:text-5xl font-light tracking-widest" style={{ color: 'rgba(25,28,30,0.35)' }}>
            Automated Reality.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants}
          className="max-w-xl text-sm mb-10 leading-relaxed"
          style={{ color: '#74777d' }}>
          SmartSurv transforms traditional CCTV into proactive, intelligent security networks using
          YOLOv8, FaceNet, and real-time WebSocket streaming.
        </motion.p>

        {/* Terminal block */}
        <motion.div variants={itemVariants} className="w-full max-w-lg text-left mb-12"
          style={{ border: '1px solid rgba(0,0,0,0.1)', background: '#e0e3e5', borderRadius: '0.5rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', background: '#f2f4f6', borderRadius: '0.5rem 0.5rem 0 0' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-2 text-[9px] tracking-widest" style={{ color: '#74777d' }}>SMARTSURV_BOOT_LOG</span>
          </div>
          <div className="p-4 space-y-1.5 text-[11px] min-h-[90px]" style={{ color: '#44474c', fontFamily: "'Inter', monospace" }}>
            <AnimatePresence>
              {termLines.slice(0, termStep).map((line, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-2">
                  <span className="opacity-60">{line.text}</span>
                  {line.result && <span className="font-bold" style={{ color: '#2480ff' }}>{line.result}</span>}
                </motion.div>
              ))}
            </AnimatePresence>
            {termStep >= termLines.length && (
              <div className="inline-flex items-center gap-1">
                <span style={{ color: '#2480ff', opacity: 0.6 }}>&gt;</span>
                <span className="w-2 h-3.5 inline-block animate-[type-cursor_1s_ease-in-out_infinite]"
                  style={{ background: '#2480ff' }} />
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-24">
          <button id="hero-start-btn"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            className="btn-primary group px-8 py-3.5 font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center gap-2"
            style={{ background: '#2480ff', color: '#ffffff', border: '2px solid #2480ff', borderRadius: '0.375rem' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#2480ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2480ff'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}>
            <Zap className="w-4 h-4" />
            {isAuthenticated ? 'Open Dashboard' : 'Initialize Access'}
          </button>
          <button id="hero-learn-btn"
            onClick={() => navigate('/login')}
            className="btn-primary px-8 py-3.5 text-sm tracking-widest uppercase transition-all duration-300 flex items-center gap-2"
            style={{ border: '1px solid rgba(36,128,255,0.3)', color: '#47607e', borderRadius: '0.375rem', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2480ff'; (e.currentTarget as HTMLButtonElement).style.color = '#2480ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(36,128,255,0.3)'; (e.currentTarget as HTMLButtonElement).style.color = '#47607e'; }}>
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
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#e0e3e5',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(36,128,255,0.25)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(36,128,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.05)'; }}
            >
              <div className="w-10 h-10 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                style={{ border: `1px solid ${f.color}30`, color: f.color, borderRadius: '0.375rem', background: `${f.color}08` }}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: '#191c1e', fontFamily: "'Manrope', sans-serif" }}>{f.title}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: '#74777d' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.main>
    </div>
  );
};

export default LandingPage;



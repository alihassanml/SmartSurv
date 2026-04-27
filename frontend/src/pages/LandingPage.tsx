import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Bell, Activity, Zap, Lock } from 'lucide-react';

const DotGrid: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: 'radial-gradient(circle, var(--color-outline) 1.5px, transparent 1.5px)',
        backgroundSize: '32px 32px',
        opacity: 0.5,
      }}
    />
  );
};

const features = [
  { icon: Eye,      title: 'Autonomous Detection', desc: 'Detects fights, weapons, and activities using YOLOv8 deep learning CV in real-time.', color: 'var(--color-primary)', delay: 0.5 },
  { icon: Activity, title: 'Person Re-ID',          desc: 'Upload a reference image and the system scans all live feeds to lock on the target.',   color: 'var(--color-accent)', delay: 0.6 },
  { icon: Bell,     title: 'Instant Uplink',         desc: 'Multi-channel alerts via Dashboard, WhatsApp, and Email with evidence snapshots.',         color: 'var(--color-secondary)', delay: 0.7 },
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
    <div className="min-h-screen overflow-x-hidden relative bg-[var(--color-background)] text-[var(--color-on-surface)] font-[var(--font-sans)]">
      <DotGrid />

      {/* Top ambient tint */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-primary-container) 0%, transparent 70%)' }} />

      {/* --- NAV --- */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex justify-between items-center px-8 py-4 backdrop-blur-md"
        style={{ borderBottom: '1px solid var(--color-outline-variant)', background: 'rgba(255, 255, 255, 0.7)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-[var(--color-outline-variant)]">
            <Shield className="w-6 h-6 text-[var(--color-primary)]" />
          </div>
          <span className="text-[1rem] font-[var(--font-display)] font-extrabold tracking-[0.15em] uppercase text-[var(--color-on-surface)]">
            SmartSurv
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button id="nav-dashboard-btn" onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 font-semibold text-sm tracking-wide rounded-full text-white bg-[var(--color-primary)] hover:bg-[var(--color-on-primary-container)] transition-all shadow-md hover:shadow-lg">
              Enter Dashboard
            </button>
          ) : (
            <>
              <button id="nav-login-btn" onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-sm font-semibold tracking-wide rounded-full text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container)] transition-all">
                Login
              </button>
              <button id="nav-signup-btn" onClick={() => navigate('/signup')}
                className="px-6 py-2.5 font-semibold text-sm tracking-wide rounded-full text-white bg-[var(--color-primary)] hover:bg-[var(--color-on-primary-container)] transition-all shadow-md hover:shadow-[0_4px_14px_0_rgba(79,70,229,0.39)]">
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
          className="text-6xl md:text-[5rem] font-extrabold tracking-tight leading-[1.1] mb-6 text-[var(--color-on-surface)] font-[var(--font-display)]">
          Intelligent
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">Surveillance</span>
          <span className="block text-4xl md:text-5xl font-medium tracking-wide text-[var(--color-on-surface-variant)] mt-2">
            Automated Reality.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants}
          className="max-w-2xl text-lg mb-12 leading-relaxed text-[var(--color-on-surface-variant)]">
          SmartSurv transforms traditional CCTV into proactive, intelligent security networks using
          YOLOv8, FaceNet, and real-time WebSocket streaming.
        </motion.p>

     

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mb-24">
          <button id="hero-start-btn"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
            className="group px-8 py-4 font-semibold text-[15px] tracking-wide rounded-full text-white bg-[var(--color-primary)] hover:bg-[var(--color-on-primary-container)] transition-all shadow-[0_8px_20px_-4px_rgba(79,70,229,0.5)] hover:shadow-[0_12px_24px_-4px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 flex items-center gap-2">
            <Zap className="w-5 h-5 fill-current" />
            {isAuthenticated ? 'Open Dashboard' : 'Initialize Access'}
          </button>
          <button id="hero-learn-btn"
            onClick={() => navigate('/login')}
            className="px-8 py-4 font-semibold text-[15px] tracking-wide rounded-full text-[var(--color-on-surface)] bg-white border border-[var(--color-outline)] hover:border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container)] hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--color-on-surface-variant)]" />
            Operator Login
          </button>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {features.map((f) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: f.delay, ease: 'easeOut' }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative p-8 text-left cursor-default transition-all duration-300 bg-white rounded-2xl border border-[var(--color-outline-variant)] shadow-sm hover:shadow-xl hover:border-[var(--color-outline)]"
            >
              <div className="w-12 h-12 mb-6 flex items-center justify-center rounded-xl bg-opacity-10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                style={{ color: f.color, backgroundColor: `color-mix(in srgb, ${f.color} 12%, transparent)` }}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3 tracking-tight text-[var(--color-on-surface)]">{f.title}</h3>
              <p className="text-[14px] leading-relaxed text-[var(--color-on-surface-variant)]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.main>
    </div>
  );
};

export default LandingPage;



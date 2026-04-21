import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { API } from '../types/dashboard';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false');
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.detail || 'Authentication failed');
      }
    } catch {
      setError('Network error — backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0c0e11', color: '#e2e2e6', fontFamily: "'Inter', sans-serif" }}>

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(176,198,255,0.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(180,198,248,0.04) 0%, transparent 70%)' }} />

      {/* Subtle grid background */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(176,198,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(176,198,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5 cursor-pointer group z-10"
        onClick={() => navigate('/')}>
        <div className="w-8 h-8 flex items-center justify-center group-hover:shadow-[0_0_12px_rgba(176,198,255,0.3)] transition-all duration-300"
          style={{ border: '1px solid rgba(176,198,255,0.4)', borderRadius: '0.25rem', color: '#b0c6ff' }}>
          <Shield className="w-4 h-4" />
        </div>
        <span style={{ fontSize: '0.875rem', fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ccd8ff' }}>SmartSurv</span>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-4">

        {/* Corner accents */}
        <div className="absolute -top-px -left-px w-10 h-10 border-t-2 border-l-2" style={{ borderColor: '#0a58ca' }} />
        <div className="absolute -top-px -right-px w-10 h-10 border-t-2 border-r-2" style={{ borderColor: '#0a58ca' }} />
        <div className="absolute -bottom-px -left-px w-10 h-10 border-b-2 border-l-2" style={{ borderColor: '#0a58ca' }} />
        <div className="absolute -bottom-px -right-px w-10 h-10 border-b-2 border-r-2" style={{ borderColor: '#0a58ca' }} />

        <div className="p-8" style={{ background: 'rgba(17,19,22,0.97)', border: '1px solid rgba(176,198,255,0.1)', backdropFilter: 'blur(20px)' }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-4 animate-glow-pulse"
              style={{ border: '1px solid rgba(176,198,255,0.3)', borderRadius: '0.25rem', color: '#b0c6ff' }}>
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-widest uppercase mb-1"
              style={{ fontFamily: "'Manrope', sans-serif", color: '#ccd8ff', letterSpacing: '0.15em' }}>
              Authentication
            </h1>
            <p className="text-[10px] tracking-[0.3em]" style={{ color: 'rgba(176,198,255,0.35)' }}>
              ACCESS_LEVEL: REQUIRED
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3 py-2.5 animate-fade-in"
              style={{ border: '1px solid rgba(255,180,171,0.4)', background: 'rgba(147,0,10,0.15)', borderRadius: '0.25rem' }}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#ffb4ab' }} />
              <span className="text-[11px] leading-relaxed" style={{ color: '#ffb4ab' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] mb-2"
                style={{ color: 'rgba(176,198,255,0.5)' }}>
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'rgba(176,198,255,0.35)' }} />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm transition-all duration-200"
                  style={{
                    background: '#1a1c1f',
                    border: '1px solid rgba(176,198,255,0.15)',
                    color: '#e2e2e6',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#b0c6ff'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(176,198,255,0.25)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(176,198,255,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="operator_id"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] mb-2"
                style={{ color: 'rgba(176,198,255,0.5)' }}>
                Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'rgba(176,198,255,0.35)' }} />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm transition-all duration-200"
                  style={{
                    background: '#1a1c1f',
                    border: '1px solid rgba(176,198,255,0.15)',
                    color: '#e2e2e6',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#b0c6ff'; e.currentTarget.style.boxShadow = '0 0 0 1px rgba(176,198,255,0.25)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(176,198,255,0.15)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 font-bold text-[11px] tracking-[0.3em] uppercase transition-all duration-300 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'transparent', border: '2px solid #b0c6ff', color: '#b0c6ff' }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = '#0a58ca'; (e.currentTarget as HTMLButtonElement).style.color = '#ccd8ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#0a58ca'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#b0c6ff'; }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  EXECUTE_LOGIN
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(176,198,255,0.08)' }}>
            <span className="text-[10px]" style={{ color: 'rgba(176,198,255,0.3)' }}>NO CLEARANCE? </span>
            <button
              id="login-to-signup-link"
              onClick={() => navigate('/signup')}
              className="text-[10px] underline underline-offset-2 transition-colors"
              style={{ color: 'rgba(176,198,255,0.6)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(176,198,255,0.6)'; }}
            >
              REQUEST ACCESS
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;


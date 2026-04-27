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
        localStorage.setItem('role', data.role || 'admin');
        localStorage.setItem('isAdmin', data.is_admin ? 'true' : 'false');
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.detail || 'Authentication failed');
      }
    } catch {
      setError('Network error â€” backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--color-background)', color: 'var(--color-on-surface)', fontFamily: "'Inter', sans-serif" }}>

      {/* Dot grid background */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--color-outline) 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          opacity: 0.5,
        }} />

      {/* Top ambient tint */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-primary-container) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5 cursor-pointer group z-10"
        onClick={() => navigate('/')}>
        <div className="w-8 h-8 flex items-center justify-center transition-all duration-300 rounded-xl shadow-sm"
          style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)', background: 'var(--color-surface)' }}>
          <Shield className="w-4 h-4" />
        </div>
        <span style={{ fontSize: '0.875rem', fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-on-surface)' }}>SmartSurv</span>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-4">

        <div className="p-8 bg-white rounded-3xl border border-[var(--color-outline-variant)] shadow-sm hover:shadow-xl transition-all duration-300" style={{ background: 'var(--color-surface)' }}>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl"
              style={{ border: '1px solid var(--color-outline-variant)', color: 'var(--color-primary)', background: 'var(--color-surface-container)' }}>
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase mb-1"
              style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)', letterSpacing: '0.08em' }}>
              Sign In
            </h1>
            <p className="text-[11px] tracking-[0.2em]" style={{ color: 'var(--color-on-surface-variant)' }}>
              Enter your credentials to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3 py-2.5 animate-fade-in rounded-xl"
              style={{ border: '1px solid var(--color-error)', background: 'var(--color-error-container)' }}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#ba1a1a' }} />
              <span className="text-[11px] leading-relaxed" style={{ color: '#ba1a1a' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold"
                style={{ color: 'var(--color-on-surface-variant)' }}>
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'var(--color-outline-variant)' }} />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm transition-all duration-200 rounded-xl"
                  style={{
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-outline-variant)',
                    color: 'var(--color-on-surface)',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(36,128,255,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold"
                style={{ color: 'var(--color-on-surface-variant)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: 'var(--color-outline-variant)' }} />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 text-sm transition-all duration-200 rounded-xl"
                  style={{
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-outline-variant)',
                    color: 'var(--color-on-surface)',
                    outline: 'none',
                    fontFamily: "'Inter', sans-serif",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(36,128,255,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="*******"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 font-bold text-[11px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
              style={{ background: 'var(--color-primary)', border: '2px solid var(--color-primary)', color: '#ffffff' }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-container)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary-container)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-primary)'; }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <span className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>Don't have an account? </span>
            <button
              id="login-to-signup-link"
              onClick={() => navigate('/signup')}
              className="text-[11px] font-semibold underline underline-offset-2 transition-colors"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary-container)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
            >
              Request Access
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;



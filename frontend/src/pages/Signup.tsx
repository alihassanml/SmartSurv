import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Mail, Lock, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { API } from '../types/dashboard';

const Signup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/verify', { state: { email } }), 1200);
      } else {
        const data = await response.json();
        setError(data.detail || 'Signup failed');
      }
    } catch {
      setError('Network error â€” backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#e8ecf0',
    border: '1px solid rgba(0,0,0,0.12)',
    color: '#191c1e',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    borderRadius: '0.375rem',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#2480ff';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(36,128,255,0.15)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#e8ecf0', color: '#191c1e', fontFamily: "'Inter', sans-serif" }}>

      {/* Dot grid background */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(36,128,255,0.1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.6,
        }} />

      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(36,128,255,0.07) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="absolute top-6 left-6 flex items-center gap-2.5 cursor-pointer group z-10"
        onClick={() => navigate('/')}>
        <div className="w-8 h-8 flex items-center justify-center transition-all duration-300"
          style={{ border: '1px solid rgba(36,128,255,0.35)', borderRadius: '0.375rem', color: '#2480ff', background: 'rgba(36,128,255,0.06)' }}>
          <Shield className="w-4 h-4" />
        </div>
        <span style={{ fontSize: '0.875rem', fontFamily: "'Manrope', sans-serif", fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#191c1e' }}>SmartSurv</span>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-4">

        {/* Corner accents */}
        <div className="absolute -top-px -left-px w-10 h-10 border-t-2 border-l-2" style={{ borderColor: '#2480ff' }} />
        <div className="absolute -top-px -right-px w-10 h-10 border-t-2 border-r-2" style={{ borderColor: '#2480ff' }} />
        <div className="absolute -bottom-px -left-px w-10 h-10 border-b-2 border-l-2" style={{ borderColor: '#2480ff' }} />
        <div className="absolute -bottom-px -right-px w-10 h-10 border-b-2 border-r-2" style={{ borderColor: '#2480ff' }} />

        <div className="p-8 relative overflow-hidden"
          style={{ background: '#e0e3e5', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.125rem', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>

          {/* Success State */}
          {success && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 animate-fade-in"
              style={{ background: 'rgba(255,255,255,0.97)' }}>
              <CheckCircle className="w-12 h-12" style={{ color: '#2480ff' }} />
              <p className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Manrope', sans-serif", color: '#191c1e' }}>
                Verification code sent!
              </p>
              <p className="text-[11px]" style={{ color: '#74777d' }}>Check your email for the verification code...</p>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-4"
              style={{ border: '1px solid rgba(36,128,255,0.3)', borderRadius: '0.375rem', color: '#2480ff', background: 'rgba(36,128,255,0.06)' }}>
              <User className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase mb-1"
              style={{ fontFamily: "'Manrope', sans-serif", color: '#191c1e', letterSpacing: '0.08em' }}>
              Create Account
            </h1>
            <p className="text-[11px] tracking-[0.2em]" style={{ color: '#74777d' }}>
              Register for access
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3 py-2.5 animate-fade-in"
              style={{ border: '1px solid rgba(186,26,26,0.25)', background: 'rgba(186,26,26,0.06)', borderRadius: '0.375rem' }}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#ba1a1a' }} />
              <span className="text-[11px] leading-relaxed" style={{ color: '#ba1a1a' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold"
                style={{ color: '#74777d' }}>Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: '#c4c6cc' }} />
                <input id="signup-username" type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={handleFocus} onBlur={handleBlur}
                  className="w-full pl-9 pr-3 py-3 text-sm transition-all duration-200"
                  style={inputStyle} placeholder="Enter username" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold"
                style={{ color: '#74777d' }}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: '#c4c6cc' }} />
                <input id="signup-email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={handleFocus} onBlur={handleBlur}
                  className="w-full pl-9 pr-3 py-3 text-sm transition-all duration-200"
                  style={inputStyle} placeholder="you@example.com" required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] mb-2 font-semibold"
                style={{ color: '#74777d' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: '#c4c6cc' }} />
                <input id="signup-password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={handleFocus} onBlur={handleBlur}
                  className="w-full pl-9 pr-3 py-3 text-sm transition-all duration-200"
                  style={inputStyle} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required />
              </div>
            </div>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading || success}
              className="btn-primary w-full py-3.5 font-bold text-[11px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#2480ff', border: '2px solid #2480ff', color: '#ffffff', borderRadius: '0.375rem' }}
              onMouseEnter={e => { if (!loading && !success) { (e.currentTarget as HTMLButtonElement).style.background = '#1a6fef'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a6fef'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2480ff'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#2480ff'; }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <span className="text-[11px]" style={{ color: '#74777d' }}>Already registered? </span>
            <button
              id="signup-to-login-link"
              onClick={() => navigate('/login')}
              className="text-[11px] font-semibold underline underline-offset-2 transition-colors"
              style={{ color: '#2480ff' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#1a6fef'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2480ff'; }}
            >
              Sign In
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;



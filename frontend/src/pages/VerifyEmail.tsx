import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { API } from '../types/dashboard';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 1800);
      } else {
        const data = await response.json();
        setError(data.detail || 'Verification failed');
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
          style={{ border: '1px solid rgba(36,128,255,0.35)', borderRadius: '0.375rem', color: 'var(--color-primary)', background: 'rgba(36,128,255,0.06)' }}>
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

        {/* Corner accents */}
        <div className="absolute -top-px -left-px w-12 h-12 border-t-2 border-l-2" style={{ borderColor: 'var(--color-primary)' }} />
        <div className="absolute -top-px -right-px w-12 h-12 border-t-2 border-r-2" style={{ borderColor: 'var(--color-primary)' }} />
        <div className="absolute -bottom-px -left-px w-12 h-12 border-b-2 border-l-2" style={{ borderColor: 'var(--color-primary)' }} />
        <div className="absolute -bottom-px -right-px w-12 h-12 border-b-2 border-r-2" style={{ borderColor: 'var(--color-primary)' }} />

        <div className="p-8 relative overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.125rem', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>

          {/* Success State */}
          {success && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 animate-fade-in"
              style={{ background: 'rgba(255,255,255,0.97)' }}>
              <CheckCircle className="w-12 h-12" style={{ color: 'var(--color-primary)' }} />
              <p className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}>Identity Verified!</p>
              <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>Redirecting to login...</p>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-4"
              style={{ border: '1px solid rgba(36,128,255,0.3)', borderRadius: '0.375rem', color: 'var(--color-primary)', background: 'rgba(36,128,255,0.06)' }}>
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase mb-1"
              style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)', letterSpacing: '0.08em' }}>Verify Email</h1>
            <p className="text-[11px] tracking-[0.15em]" style={{ color: 'var(--color-outline)' }}>Enter the code sent to your email</p>
          </div>

          {/* Info */}
          <div className="mb-6 px-3 py-2.5 text-center"
            style={{ border: '1px solid rgba(36,128,255,0.15)', background: 'rgba(36,128,255,0.04)', borderRadius: '0.375rem' }}>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-outline)' }}>
              A 6-digit code was sent to<br />
              <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{email || 'your email'}</span>
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

          <form onSubmit={handleVerify}>
            <label className="block text-[10px] uppercase tracking-[0.15em] mb-3 font-semibold text-center"
              style={{ color: 'var(--color-outline)' }}>
              Verification Code
            </label>

            {/* 6-digit boxes */}
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className="w-11 h-14 text-center text-xl font-bold transition-all duration-200"
                  style={{
                    background: 'var(--color-background)',
                    border: '1px solid rgba(0,0,0,0.12)',
                    color: 'var(--color-primary)',
                    outline: 'none',
                    borderRadius: '0.375rem',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(36,128,255,0.15)'; e.currentTarget.style.background = '#ffffff'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'var(--color-background)'; }}
                />
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 font-bold text-[11px] tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-primary)', border: '2px solid var(--color-primary)', color: '#ffffff', borderRadius: '0.375rem' }}
              onMouseEnter={e => { if (!loading && !success) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary-container)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-primary)'; }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Confirm Identity
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <span className="text-[11px]" style={{ color: 'var(--color-outline)' }}>Wrong account? </span>
            <button
              onClick={() => navigate('/signup')}
              className="text-[11px] font-semibold underline underline-offset-2 transition-colors"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary-container)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
            >
              Back to Signup
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;



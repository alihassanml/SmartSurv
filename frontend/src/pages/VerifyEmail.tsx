import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';

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
      const response = await fetch('http://localhost:8000/api/auth/verify', {
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
      setError('Network error — backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-[#00ff85] font-mono flex items-center justify-center relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,133,0.05) 0%, transparent 70%)' }} />

      {/* Grid background */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(0,255,133,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,133,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Logo */}
      <div
        className="absolute top-6 left-6 flex items-center gap-2.5 cursor-pointer group z-10"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 border border-[rgba(0,255,133,0.4)] flex items-center justify-center group-hover:border-[#00ff85] group-hover:shadow-[0_0_12px_rgba(0,255,133,0.3)] transition-all duration-300">
          <Shield className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold tracking-[0.2em] uppercase group-hover:text-[#00ff85] transition-colors">SmartSurv</span>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-4">

        {/* Corner accents */}
        <div className="absolute -top-px -left-px w-12 h-12 border-t-2 border-l-2 border-[#00ff85]" />
        <div className="absolute -top-px -right-px w-12 h-12 border-t-2 border-r-2 border-[#00ff85]" />
        <div className="absolute -bottom-px -left-px w-12 h-12 border-b-2 border-l-2 border-[#00ff85]" />
        <div className="absolute -bottom-px -right-px w-12 h-12 border-b-2 border-r-2 border-[#00ff85]" />

        <div className="bg-[rgba(12,13,16,0.95)] backdrop-blur-xl border border-[rgba(0,255,133,0.12)] p-8 relative overflow-hidden">

          {/* Success State */}
          {success && (
            <div className="absolute inset-0 z-20 bg-[rgba(12,13,16,0.97)] flex flex-col items-center justify-center gap-4">
              <CheckCircle className="w-12 h-12 text-[#00ff85] animate-glow-pulse" />
              <p className="text-sm font-bold tracking-widest">IDENTITY_VERIFIED</p>
              <p className="text-[10px] text-[#00ff85]/40">Redirecting to login...</p>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 border border-[rgba(0,255,133,0.3)] mb-4 animate-glow-pulse">
              <Mail className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-widest uppercase mb-1">Verify Identity</h1>
            <p className="text-[10px] text-[#00ff85]/30 tracking-[0.3em]">COMM_LINK: AUTHENTICATION</p>
          </div>

          {/* Info */}
          <div className="mb-6 px-3 py-2.5 border border-[rgba(0,255,133,0.15)] bg-[rgba(0,255,133,0.03)]">
            <p className="text-[10px] text-[#00ff85]/50 leading-relaxed text-center">
              A 6-digit verification code was sent to<br />
              <span className="text-[#00ff85]/80 font-bold">{email || 'your email'}</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3 py-2.5 border border-red-500/40 bg-red-950/20">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <span className="text-[11px] text-red-400 leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            <label className="block text-[10px] uppercase tracking-[0.2em] mb-3 text-[#00ff85]/50 text-center">
              Enter Code
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
                  className="w-11 h-14 text-center text-xl font-bold bg-[#0a0b0e] border border-[rgba(0,255,133,0.15)] text-[#00ff85] focus:outline-none focus:border-[#00ff85] focus:shadow-[0_0_0_1px_rgba(0,255,133,0.3)] transition-all duration-200 caret-[#00ff85]"
                />
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 bg-transparent border-2 border-[#00ff85] text-[#00ff85] font-bold text-[11px] tracking-[0.3em] uppercase hover:bg-[#00ff85] hover:text-[#060608] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  VERIFYING...
                </>
              ) : (
                <>
                  CONFIRM_IDENTITY
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-[rgba(0,255,133,0.08)] text-center">
            <span className="text-[10px] text-[#00ff85]/30">WRONG ACCOUNT? </span>
            <button
              onClick={() => navigate('/signup')}
              className="text-[10px] text-[#00ff85]/60 hover:text-[#00ff85] underline underline-offset-2 transition-colors"
            >
              BACK TO SIGNUP
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Lock, ChevronRight, AlertCircle } from 'lucide-react';

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
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', username);
        localStorage.setItem('email', data.email);
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
    <div className="min-h-screen bg-[#060608] text-[#00ff85] font-mono flex items-center justify-center relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,255,133,0.05) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)' }} />

      {/* Grid background */}
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(0,255,133,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,133,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

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

        <div className="bg-[rgba(12,13,16,0.95)] backdrop-blur-xl border border-[rgba(0,255,133,0.12)] p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 border border-[rgba(0,255,133,0.3)] mb-4 animate-glow-pulse">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-widest uppercase mb-1">Authentication</h1>
            <p className="text-[10px] text-[#00ff85]/30 tracking-[0.3em]">ACCESS_LEVEL: REQUIRED</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3 py-2.5 border border-red-500/40 bg-red-950/20 animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              <span className="text-[11px] text-red-400 leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-[#00ff85]/50">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00ff85]/30" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-[#0a0b0e] border border-[rgba(0,255,133,0.15)] pl-9 pr-3 py-3 text-[#00ff85] text-sm focus:outline-none focus:border-[#00ff85] focus:shadow-[0_0_0_1px_rgba(0,255,133,0.3)] transition-all duration-200 placeholder:text-[#00ff85]/20"
                  placeholder="operator_id"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-[#00ff85]/50">
                Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00ff85]/30" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#0a0b0e] border border-[rgba(0,255,133,0.15)] pl-9 pr-3 py-3 text-[#00ff85] text-sm focus:outline-none focus:border-[#00ff85] focus:shadow-[0_0_0_1px_rgba(0,255,133,0.3)] transition-all duration-200 placeholder:text-[#00ff85]/20"
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
              className="btn-primary w-full py-3.5 bg-transparent border-2 border-[#00ff85] text-[#00ff85] font-bold text-[11px] tracking-[0.3em] uppercase hover:bg-[#00ff85] hover:text-[#060608] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 mt-2"
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
          <div className="mt-6 pt-5 border-t border-[rgba(0,255,133,0.08)] text-center">
            <span className="text-[10px] text-[#00ff85]/30">NO CLEARANCE? </span>
            <button
              id="login-to-signup-link"
              onClick={() => navigate('/signup')}
              className="text-[10px] text-[#00ff85]/60 hover:text-[#00ff85] underline underline-offset-2 transition-colors"
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

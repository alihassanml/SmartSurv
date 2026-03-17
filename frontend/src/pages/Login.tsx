import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', username);
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.detail || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-[#00ff00] font-mono items-center justify-center relative overflow-hidden">
      <div className="absolute top-6 left-6 flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => navigate('/')}>
         <Shield className="w-6 h-6" /> <span className="font-bold tracking-widest text-xl">SMARTSURV</span>
      </div>

      <div className="w-full max-w-md p-8 border border-[#1a1a1a] bg-[#0f0f0f] relative z-10">
        <div className="text-center mb-8 border-b border-[#1a1a1a] pb-4">
          <h2 className="text-3xl font-bold uppercase tracking-widest">Authentication</h2>
          <p className="text-xs opacity-50 mt-2">ACCESS_LEVEL: REQUIRED</p>
        </div>

        {error && <div className="mb-4 p-2 bg-red-900/20 border border-red-500 text-red-500 text-xs">{">"} ERROR: {error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#00ff00]/30 p-3 text-[#00ff00] focus:outline-none focus:border-[#00ff00] transition-colors font-mono"
              placeholder="Enter Username..."
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 opacity-70">Passcode</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#00ff00]/30 p-3 text-[#00ff00] focus:outline-none focus:border-[#00ff00] transition-colors font-mono"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-[#0a0a0a] border border-[#00ff00] hover:bg-[#00ff00] hover:text-[#0a0a0a] transition-all duration-300 font-bold tracking-widest uppercase text-sm mt-4"
          >
            [ EXECUTE_LOGIN ]
          </button>
        </form>

        <div className="mt-6 text-center text-xs opacity-50 hover:opacity-100 cursor-pointer" onClick={() => navigate('/signup')}>
          {">"} NO_CLEARANCE? REQUEST_ACCESS (SIGNUP)
        </div>
      </div>
      
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
    </div>
  );
}

export default Login;

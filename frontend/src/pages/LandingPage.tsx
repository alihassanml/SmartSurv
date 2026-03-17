import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, Bell, Activity } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] font-mono selection:bg-[#00ff00] selection:text-[#0a0a0a] overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-widest">
          <Shield className="w-8 h-8" />
          <span>SMARTSURV</span>
        </div>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-[#00ff00] text-[#0a0a0a] hover:bg-transparent hover:text-[#00ff00] border border-[#00ff00] transition-all duration-300 font-bold tracking-widest uppercase text-sm"
              >
                [ ENTER_DASHBOARD ]
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-2 border border-[#00ff00] hover:bg-[#00ff00] hover:text-[#0a0a0a] transition-all duration-300 font-bold tracking-widest uppercase text-sm"
              >
                [ LOGIN ]
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="px-6 py-2 bg-[#00ff00] text-[#0a0a0a] hover:bg-transparent hover:text-[#00ff00] border border-[#00ff00] transition-all duration-300 font-bold tracking-widest uppercase text-sm"
              >
                [ INITIATE ]
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
        <div className="inline-block border border-[#00ff00] px-4 py-1 mb-6 text-xs tracking-widest uppercase animate-pulse">
          SYSTEM_STATUS: ONLINE
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tighter uppercase leading-[1.1]">
          Intelligent Surveillance <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff00] to-emerald-500 stroke-text">
            Automated Reality.
          </span>
        </h1>
        
        <p className="text-[#00ff00]/70 max-w-2xl text-lg mb-12 leading-relaxed">
          SmartSurv is a next-gen AI surveillance system designed to transform traditional CCTV setups into proactive, intelligent, and automated security networks using YOLOv8, 3D CNNs, and real-time data streaming.
        </p>
        
        <div className="font-mono text-sm opacity-50 mb-16">
          <p>{">"} Initialize tracking systems...</p>
          <p>{">"} Loading recognition models... [OK]</p>
          <p>{">"} Audio-visual fusion... [READY]</p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-12 text-left">
          
          <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-6 hover:border-[#00ff00]/50 transition-colors group">
            <Eye className="w-8 h-8 mb-4 text-[#00ff00]/70 group-hover:text-[#00ff00] transition-colors" />
            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Autonomous Detection</h3>
            <p className="text-sm text-[#00ff00]/60">Detects illegal activities like fights, weapon visibility, and restricted smoking instantly using deep learning computer vision.</p>
          </div>

          <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-6 hover:border-[#00ff00]/50 transition-colors group">
            <Activity className="w-8 h-8 mb-4 text-[#00ff00]/70 group-hover:text-[#00ff00] transition-colors" />
            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Person Re-ID</h3>
            <p className="text-sm text-[#00ff00]/60">Upload a reference image. The system scans all live feeds and notifies when the target individual is identified.</p>
          </div>

          <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-6 hover:border-[#00ff00]/50 transition-colors group">
            <Bell className="w-8 h-8 mb-4 text-[#00ff00]/70 group-hover:text-[#00ff00] transition-colors" />
            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Instant Uplink</h3>
            <p className="text-sm text-[#00ff00]/60">Receive instant multi-level alerts via dashboard, WhatsApp, and Email with evidence snapshots and timestamp data.</p>
          </div>

        </div>
      </main>

      {/* Matrix Background Effect (Optional CSS trick) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" style={{ backgroundImage: 'radial-gradient(circle at center, #00ff00 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
    </div>
  );
};

export default LandingPage;

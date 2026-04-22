import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, Bell, BarChart2, Target, Settings,
  Users, Shield, ChevronLeft, ChevronRight, Activity, Video
} from 'lucide-react';

const navItems = [
  { icon: LayoutGrid, label: 'Monitor',   path: '/dashboard' },
  { icon: Video,      label: 'Cameras',   path: '/dashboard/cameras' },
  { icon: Bell,       label: 'Alerts',    path: '/dashboard/alerts' },
  { icon: BarChart2,  label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Target,     label: 'Watchlist', path: '/dashboard/watchlist' },
];

const bottomItems = [
  { icon: Activity, label: 'System Health', path: '/dashboard/system' },
  { icon: Settings, label: 'Settings',      path: '/dashboard/settings' },
  { icon: Users,    label: 'Users',         path: '/dashboard/users' },
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col shrink-0"
      style={{
        background: '#1a1c1f',
        borderRight: '1px solid rgba(176,198,255,0.08)',
        height: '100%',
      }}
    >
      {/* ── Logo header ── */}
      <div className="flex items-center gap-3 px-4 shrink-0"
        style={{ height: '64px', borderBottom: '1px solid rgba(176,198,255,0.08)' }}>
        <div className="w-9 h-9 flex items-center justify-center shrink-0 animate-glow-pulse"
          style={{ border: '1px solid rgba(176,198,255,0.4)', borderRadius: '0.25rem', color: '#b0c6ff' }}>
          <Shield className="w-5 h-5" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap font-bold tracking-[0.18em] uppercase text-sm"
              style={{ fontFamily: "'Manrope', sans-serif", color: '#ccd8ff' }}
            >
              SmartSurv
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapse button ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute flex items-center justify-center w-5 h-5 transition-colors duration-200 z-20"
        style={{
          top: '22px', right: '-10px',
          background: '#282a2d',
          border: '1px solid rgba(176,198,255,0.15)',
          borderRadius: '50%',
          color: '#8c909f',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#b0c6ff'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8c909f'; }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* ── Primary nav ── */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-hidden">
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-left transition-all duration-200 relative group"
              style={{
                borderRadius: '0.25rem',
                background: active ? 'rgba(10,88,202,0.15)' : 'transparent',
                color: active ? '#b0c6ff' : '#8c909f',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#c3c6d6'; (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(10,88,202,0.15)' : 'rgba(176,198,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = active ? '#b0c6ff' : '#8c909f'; (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(10,88,202,0.15)' : 'transparent'; }}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                  style={{ background: '#b0c6ff' }} />
              )}
              <item.icon className="w-4 h-4 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium tracking-wide overflow-hidden whitespace-nowrap"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* ── Bottom section ── */}
      <div className="px-2 pb-4 flex flex-col gap-0.5"
        style={{ borderTop: '1px solid rgba(176,198,255,0.06)', paddingTop: '12px' }}>
        {isAdmin && bottomItems.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-left transition-all duration-200 relative"
              style={{
                borderRadius: '0.25rem',
                background: active ? 'rgba(10,88,202,0.15)' : 'transparent',
                color: active ? '#b0c6ff' : '#8c909f',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#c3c6d6'; (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(10,88,202,0.15)' : 'rgba(176,198,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = active ? '#b0c6ff' : '#8c909f'; (e.currentTarget as HTMLButtonElement).style.background = active ? 'rgba(10,88,202,0.15)' : 'transparent'; }}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                  style={{ background: '#b0c6ff' }} />
              )}
              <item.icon className="w-4 h-4 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium tracking-wide overflow-hidden whitespace-nowrap"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}

      </div>
    </motion.aside>
  );
};

export default Sidebar;

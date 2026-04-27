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
  { icon: Shield,   label: 'Organizations', path: '/dashboard/organization-controls' },
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
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-outline-variant)',
        boxShadow: '2px 0 8px rgba(0,0,0,0.02)',
        height: '100%',
      }}
    >
      {/* --- Logo header --- */}
      <div className="flex items-center gap-3 px-4 shrink-0"
        style={{ height: '64px', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <div className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ border: '1px solid var(--color-outline-variant)', borderRadius: '0.5rem', color: 'var(--color-primary)', background: 'var(--color-surface-container)' }}>
          <Shield className="w-5 h-5" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap font-bold tracking-[0.15em] uppercase text-sm"
              style={{ fontFamily: "'Manrope', sans-serif", color: 'var(--color-on-surface)' }}
            >
              SmartSurv
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* --- Collapse button --- */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute flex items-center justify-center w-5 h-5 transition-colors duration-200 z-20"
        style={{
          top: '22px', right: '-10px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-outline)',
          borderRadius: '50%',
          color: 'var(--color-outline)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-primary)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-outline)'; }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* --- Primary nav --- */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-hidden">
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-left transition-colors duration-200 relative group"
              style={{
                borderRadius: '0px',
                color: active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              }}
            >
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 z-0"
                  style={{ 
                    background: 'var(--color-primary-container)', 
                    borderRadius: '0px',
                    borderLeft: '2px solid var(--color-primary)'
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <item.icon className={`w-4 h-4 shrink-0 z-10 ${active ? 'text-[var(--color-primary)]' : 'group-hover:text-[var(--color-on-surface)]'}`} />
              
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium tracking-wide overflow-hidden whitespace-nowrap z-10"
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

      {/* --- Bottom nav --- */}
      <div className="px-2 pb-4 flex flex-col gap-0.5"
        style={{ borderTop: '1px solid var(--color-outline-variant)', paddingTop: '12px' }}>
        {isAdmin && bottomItems.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-left transition-colors duration-200 relative group"
              style={{
                borderRadius: '0px',
                color: active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              }}
            >
              {active && (
                <motion.div
                  layoutId="active-pill-bottom"
                  className="absolute inset-0 z-0"
                  style={{ 
                    background: 'var(--color-primary-container)', 
                    borderRadius: '0px',
                    borderLeft: '2px solid var(--color-primary)'
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <item.icon className={`w-4 h-4 shrink-0 z-10 ${active ? 'text-[var(--color-primary)]' : 'group-hover:text-[var(--color-on-surface)]'}`} />
              
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium tracking-wide overflow-hidden whitespace-nowrap z-10"
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


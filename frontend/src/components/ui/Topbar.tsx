import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiMenuLine, RiSunLine, RiMoonLine, RiBellLine, RiSearchLine,
  RiUserLine, RiSettings3Line, RiLogoutCircleLine, RiShieldLine,
} from 'react-icons/ri';
import { useAuthStore, useUIStore } from '../../store';
import { notificationService, authService } from '../../services/api';
import { toast } from 'react-toastify';
import type { Notification } from '../../types';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/pipeline':         'Full Pipeline',
  '/upload':           'Upload Image',
  '/enhancement':      'Enhancement',
  '/harris':           'Harris Corner',
  '/sift':             'SIFT Features',
  '/pca':              'PCA Optimize',
  '/recognition':      'Recognition',
  '/profile':          'Profile',
  '/history':          'History',
  '/reports':          'Reports',
  '/settings':         'Settings',
  '/admin':            'Admin Panel',
  '/admin/users':      'Users',
  '/admin/categories': 'Categories',
  '/admin/images':     'Images',
  '/admin/logs':       'Audit Logs',
  '/admin/settings':   'System Settings',
};

const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const {
    darkMode, toggleDarkMode, toggleSidebar,
    unreadCount, notifications, setNotifications, markNotificationRead,
    sidebarOpen, sidebarCollapsed,
  } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    notificationService.getAll()
      .then(res => setNotifications(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    logout(); navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleMarkRead = async (id: string) => {
    try { await notificationService.markRead(id); markNotificationRead(id); } catch { /* ignore */ }
  };
  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      notifications.forEach(n => markNotificationRead(n.id));
      toast.success('All marked as read');
    } catch { /* ignore */ }
  };

  const notifDot: Record<Notification['type'], string> = {
    info: '#818cf8', success: '#4ade80', warning: '#facc15', error: '#f87171',
  };

  const sidebarWidth  = sidebarCollapsed ? 72 : 260;
  const leftOffset    = isMobile ? 0 : (sidebarOpen ? sidebarWidth : 0);
  const pageTitle     = ROUTE_LABELS[location.pathname] ?? 'SmartVision AI';

  const dropdownStyle = {
    background: 'rgba(7, 11, 22, 0.98)',
    border: '1px solid rgba(99,102,241,0.18)',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  };

  return (
    <header
      className="fixed top-0 right-0 h-16 z-20 flex items-center justify-between transition-all duration-300"
      style={{
        left: leftOffset,
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        background: 'rgba(7, 11, 22, 0.88)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors flex-shrink-0"
          aria-label="Toggle sidebar"
          id="toggle-sidebar-btn"
        >
          <RiMenuLine size={19} />
        </button>

        {/* Page title (mobile shows this) */}
        <span className="font-display font-semibold text-slate-300 text-sm md:hidden truncate">{pageTitle}</span>

        {/* Search bar (desktop) */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            minWidth: 220,
          }}
        >
          <RiSearchLine className="text-slate-600 flex-shrink-0" size={15} />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-slate-300 placeholder-slate-700 outline-none flex-1 min-w-0"
          />
          <kbd className="text-[10px] text-slate-700 bg-white/4 px-1.5 py-0.5 rounded border border-white/8 flex-shrink-0">⌘K</kbd>
        </div>

        {/* Breadcrumb (desktop) */}
        <span className="hidden md:block text-slate-500 text-sm font-medium">{pageTitle}</span>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-1">

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
          aria-label={darkMode ? 'Light mode' : 'Dark mode'}
          id="toggle-theme-btn"
        >
          {darkMode ? <RiSunLine size={17} /> : <RiMoonLine size={17} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
            aria-label="Notifications"
            id="notifications-btn"
          >
            <RiBellLine size={17} />
            {unreadCount > 0 && (
              <span className="notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
                style={dropdownStyle}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                  <span className="text-sm font-semibold text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-600 text-sm">No notifications yet</div>
                  ) : (
                    notifications.slice(0, 8).map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`px-4 py-3 border-b border-white/[0.04] cursor-pointer transition-colors hover:bg-white/[0.03] ${!n.is_read ? 'bg-primary-500/[0.04]' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: notifDot[n.type] }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-200 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-700 mt-1">{new Date(n.created_at).toLocaleTimeString()}</p>
                          </div>
                          {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors ml-1"
            aria-label="Profile menu"
            id="profile-menu-btn"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.full_name}</p>
              <p className="text-[10px] text-slate-600 leading-tight capitalize">{user?.role}</p>
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.13 }}
                className="absolute right-0 top-12 w-56 rounded-2xl overflow-hidden z-50"
                style={dropdownStyle}
              >
                <div className="px-4 py-3 border-b border-white/[0.05]">
                  <p className="text-sm font-semibold text-slate-200">{user?.full_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <RiShieldLine size={11} className="text-primary-400" />
                    <span className="text-[10px] text-primary-400 capitalize font-medium">{user?.role}</span>
                  </div>
                </div>
                <div className="p-2">
                  {[
                    { icon: <RiUserLine />, label: 'Profile',  path: '/profile' },
                    { icon: <RiSettings3Line />, label: 'Settings', path: '/settings' },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-white/[0.05]" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-danger-400 hover:bg-danger-500/10 transition-colors"
                  >
                    <RiLogoutCircleLine className="text-base" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

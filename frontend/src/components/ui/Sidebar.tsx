import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine, RiUploadCloud2Line, RiMagicLine, RiParentLine,
  RiKeyLine, RiBarChartLine, RiEyeLine, RiFlowChart,
  RiUserLine, RiHistoryLine, RiFileChartLine, RiSettings3Line,
  RiShieldUserLine, RiTeamLine, RiPriceTagLine, RiFileListLine,
  RiDatabase2Line, RiSteamLine, RiLogoutCircleLine, RiMenuFoldLine,
  RiMenuUnfoldLine,
} from 'react-icons/ri';
import { useAuthStore, useUIStore } from '../../store';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: string | number;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();

  const navGroups: NavGroup[] = useMemo(() => [
    {
      title: 'Overview',
      items: [
        { icon: <RiDashboardLine />, label: 'Dashboard', path: '/dashboard' },
        { icon: <RiFlowChart />, label: 'Full Pipeline', path: '/pipeline' },
      ],
    },
    {
      title: 'CV Modules',
      items: [
        { icon: <RiUploadCloud2Line />, label: 'Upload Image',  path: '/upload' },
        { icon: <RiMagicLine />,        label: 'Enhancement',   path: '/enhancement' },
        { icon: <RiParentLine />,       label: 'Harris Corner', path: '/harris' },
        { icon: <RiKeyLine />,          label: 'SIFT Features', path: '/sift' },
        { icon: <RiBarChartLine />,     label: 'PCA Optimize',  path: '/pca' },
        { icon: <RiEyeLine />,          label: 'Recognition',   path: '/recognition' },
      ],
    },
    {
      title: 'My Workspace',
      items: [
        { icon: <RiUserLine />,      label: 'Profile',  path: '/profile' },
        { icon: <RiHistoryLine />,   label: 'History',  path: '/history' },
        { icon: <RiFileChartLine />, label: 'Reports',  path: '/reports' },
        { icon: <RiSettings3Line />, label: 'Settings', path: '/settings' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { icon: <RiShieldUserLine />, label: 'Admin Panel', path: '/admin',           adminOnly: true },
        { icon: <RiTeamLine />,       label: 'Users',        path: '/admin/users',     adminOnly: true },
        { icon: <RiPriceTagLine />,   label: 'Categories',   path: '/admin/categories',adminOnly: true },
        { icon: <RiDatabase2Line />,  label: 'Images',       path: '/admin/images',    adminOnly: true },
        { icon: <RiFileListLine />,   label: 'Audit Logs',   path: '/admin/logs',      adminOnly: true },
        { icon: <RiSteamLine />,      label: 'System',       path: '/admin/settings',  adminOnly: true },
      ],
    },
  ], []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ } finally {
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const isAdmin = user?.role === 'admin';
  if (!sidebarOpen) return null;

  const collapsed = sidebarCollapsed;
  const width = collapsed ? 72 : 260;

  return (
    <motion.aside
      initial={{ x: -width }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="fixed top-0 left-0 h-full z-30 flex flex-col"
      style={{
        width,
        background: 'rgba(7, 11, 22, 0.97)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo / Header ── */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0 border-b border-white/[0.04]"
        style={{ height: 64 }}
      >
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 overflow-hidden min-w-0"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}
              >
                🔍
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-sm gradient-text leading-tight truncate">SmartVision AI</p>
                <p className="text-[10px] text-slate-600 leading-tight">Object Recognition</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base mx-auto"
            style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}
          >
            🔍
          </div>
        )}
        {!collapsed && (
          <button
            onClick={toggleSidebarCollapsed}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors flex-shrink-0"
            aria-label="Collapse sidebar"
          >
            <RiMenuFoldLine size={15} />
          </button>
        )}
      </div>

      {/* ── User Card ── */}
      {!collapsed && user && (
        <div className="mx-3 mt-3 p-3 rounded-xl flex-shrink-0" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}
            >
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  user.role === 'admin' ? 'bg-danger-400' :
                  user.role === 'researcher' ? 'bg-warning-400' : 'bg-success-400'
                }`} />
                <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" style={{ scrollbarWidth: 'thin' }}>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => !(item.adminOnly && !isAdmin));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-1">
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-700 px-3 pt-3 pb-1.5">
                  {group.title}
                </p>
              )}
              {collapsed && <div className="my-2 mx-3 border-t border-white/[0.04]" />}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={({ isActive }) =>
                      `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0 mx-1' : ''}`
                    }
                    title={collapsed ? item.label : undefined}
                    onClick={() => { if (window.innerWidth < 768) setSidebarOpen(false); }}
                  >
                    <span className="text-[1.05rem] flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="badge-primary text-[10px]">{item.badge}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Expand button (collapsed) ── */}
      {collapsed && (
        <div className="px-2 py-2 border-t border-white/[0.04] flex-shrink-0">
          <button
            onClick={toggleSidebarCollapsed}
            className="w-full p-2 rounded-xl text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors flex justify-center"
            aria-label="Expand sidebar"
          >
            <RiMenuUnfoldLine size={17} />
          </button>
        </div>
      )}

      {/* ── Logout ── */}
      <div className="px-2 pb-3 flex-shrink-0 border-t border-white/[0.04] pt-2">
        <button
          onClick={handleLogout}
          className={`sidebar-item w-full text-danger-500 hover:bg-danger-500/10 hover:text-danger-400 ${collapsed ? 'justify-center px-0 mx-1' : ''}`}
          aria-label="Logout"
          title={collapsed ? 'Logout' : undefined}
        >
          <RiLogoutCircleLine className="text-[1.05rem] flex-shrink-0" />
          {!collapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/ui/Sidebar';
import Topbar from '../components/ui/Topbar';
import { useUIStore } from '../store';

const MainLayout: React.FC = () => {
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sidebarWidth  = sidebarCollapsed ? 72 : 260;
  const contentMargin = isMobile ? 0 : (sidebarOpen ? sidebarWidth : 0);

  return (
    <div className="min-h-screen relative" style={{ background: '#030712' }}>
      {/* Mesh background */}
      <div className="mesh-gradient" aria-hidden="true" />

      {/* Sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content wrapper — shifts right by sidebar width */}
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: contentMargin }}
      >
        {/* Topbar — fixed, offset handled internally */}
        <Topbar />

        {/* Page content — padded below topbar */}
        <main className="flex-1 px-4 md:px-6 lg:px-8 pb-8" style={{ paddingTop: 'calc(64px + 1.5rem)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-[11px] text-slate-700 border-t border-white/[0.04]">
          © 2026 SmartVision AI — Smart Object Recognition Platform
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;

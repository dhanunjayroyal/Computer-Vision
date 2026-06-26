import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  { icon: '🎨', label: 'Image Enhancement',    desc: 'Histogram EQ, denoising, blur, contrast tuning' },
  { icon: '📐', label: 'Harris Corner',         desc: 'Precise and responsive corner feature analysis' },
  { icon: '🔑', label: 'SIFT Extraction',       desc: 'Robust keypoint detection for visual analysis' },
  { icon: '🧠', label: 'PCA + Recognition',     desc: 'Smart classification and feature optimization' },
];

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-shell flex flex-col lg:flex-row relative min-h-screen">
      {/* ── Ambient Blobs ── */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', filter: 'blur(60px)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.09), transparent 70%)', filter: 'blur(60px)' }}
        aria-hidden="true"
      />

      {/* ── Left Panel (desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-start p-16 xl:p-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-xl w-full"
        >
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="brand-mark">🔍</div>
            <div>
              <p className="font-display font-bold text-lg text-slate-100 leading-tight">SmartVision AI</p>
              <p className="text-xs text-slate-500">AI-powered Computer Vision</p>
            </div>
          </div>

          <div className="auth-pill mb-5">AI-powered object recognition platform</div>

          <h1 className="text-5xl xl:text-6xl font-display font-bold gradient-text-aurora leading-tight mb-5">
            See Beyond<br />the Pixel
          </h1>
          <p className="text-lg text-slate-400 mb-10 leading-relaxed">
            Intelligent object recognition with <span className="text-primary-300 font-medium">image enhancement</span> and{' '}
            <span className="text-fuchsia-300 font-medium">feature intelligence</span> built for modern workflows.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="auth-feature-item"
              >
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{f.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tech badges */}
          <div className="flex flex-wrap gap-2 mt-9">
            {['React', 'FastAPI', 'OpenCV', 'SIFT', 'PCA', 'PostgreSQL'].map(tech => (
              <span key={tech} className="badge-primary">{tech}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10 xl:p-16 relative z-10 min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;

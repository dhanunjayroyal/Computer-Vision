import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-surface-950 flex flex-col items-center justify-center z-50">
      {/* Background */}
      <div className="mesh-gradient" aria-hidden="true" />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)',
          }}
        >
          🔍
        </motion.div>

        <div className="text-center">
          <h1 className="text-2xl font-display font-bold gradient-text-aurora mb-1">SmartVision AI</h1>
          <p className="text-sm text-slate-500">Initializing platform...</p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;

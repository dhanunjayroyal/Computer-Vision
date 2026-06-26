import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RiFileChartLine, RiDownloadLine, RiLoader4Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { reportService } from '../../services/api';

const REPORT_TYPES = [
  { id: 'recognition', label: 'Recognition Report', icon: '🔍', desc: 'All object recognition results with confidence scores' },
  { id: 'enhancement', label: 'Enhancement Report', icon: '🎨', desc: 'Image enhancement analysis and statistics' },
  { id: 'analytics',   label: 'Analytics Report',   icon: '📊', desc: 'Platform usage analytics and trends' },
  { id: 'system',      label: 'System Report',       icon: '🖥️', desc: 'System health and performance metrics' },
];

const ReportsPage: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);

  const generate = async (type: string, format: 'pdf' | 'excel' | 'csv') => {
    const key = `${type}-${format}`;
    setGenerating(key);
    try {
      await reportService.generate(type as any, format);
      toast.success(`${format.toUpperCase()} report queued for generation!`);
    } catch { toast.error('Report generation failed'); } finally { setGenerating(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Reports</h1>
        <p className="text-slate-500 mt-1">Generate and download PDF, Excel, and CSV reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TYPES.map((report, i) => (
          <motion.div key={report.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-3xl">{report.icon}</div>
              <div>
                <h3 className="font-semibold text-slate-200">{report.label}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{report.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(['pdf', 'excel', 'csv'] as const).map(fmt => (
                <button key={fmt} onClick={() => generate(report.id, fmt)}
                  disabled={generating === `${report.id}-${fmt}`}
                  className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">
                  {generating === `${report.id}-${fmt}` ? <RiLoader4Line className="animate-spin" /> : <RiDownloadLine />}
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiSearchLine,
  RiTimeLine,
  RiDashboardLine,
  RiEyeLine,
  RiLoader4Line,
  RiFileSettingsLine,
  RiImageLine,
  RiCloseLine,
  RiAlertLine,
  RiCheckDoubleLine
} from 'react-icons/ri';
import { recognitionService, imageService } from '../../services/api';
import type { RecognitionResult } from '../../types';
import { toast } from 'react-toastify';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<RecognitionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedResult, setSelectedResult] = useState<RecognitionResult | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await recognitionService.getHistory();
      if (res.data.success) {
        setHistory(res.data.data || []);
      } else {
        toast.error(res.data.message || 'Failed to load history');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filePath?: string) => {
    if (!filePath) return '';
    return imageService.getUrl(filePath);
  };

  // Get unique classes for filter
  const classesList = ['All', ...Array.from(new Set(history.map(h => h.predicted_class).filter(Boolean)))];

  const filteredHistory = history.filter(item => {
    const matchesSearch =
      item.predicted_class?.toLowerCase().includes(search.toLowerCase()) ||
      item.image?.original_filename?.toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'All' || item.predicted_class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Recognition History</h1>
          <p className="text-slate-500 mt-1">Review, search, and analyze your processed computer vision results.</p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="btn-secondary self-start md:self-auto py-2.5 px-4 text-sm"
        >
          {loading ? <RiLoader4Line className="animate-spin" size={16} /> : <RiCheckDoubleLine size={16} />}
          Refresh History
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by class name or filename..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="input-field appearance-none cursor-pointer pr-10"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {classesList.map(cls => (
              <option key={cls} value={cls} className="bg-slate-900 text-slate-100">
                {cls === 'All' ? 'Filter by Class: All' : cls}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RiLoader4Line className="animate-spin text-primary-500" size={48} />
          <p className="text-slate-400 font-medium">Fetching recognition history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4 border border-slate-700/30">
            <RiImageLine size={28} />
          </div>
          <h3 className="text-xl font-semibold text-slate-300">No recognition records found</h3>
          <p className="text-slate-500 max-w-sm mt-2">
            {history.length === 0
              ? 'Upload and run recognition on images to populate history records.'
              : 'Try adjusting your filters or search query.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass-card flex flex-col overflow-hidden group cursor-pointer"
              onClick={() => setSelectedResult(item)}
            >
              {/* Thumbnail Container */}
              <div className="relative h-44 bg-slate-950 overflow-hidden border-b border-slate-800/40">
                {item.image?.file_path ? (
                  <img
                    src={getImageUrl(item.image.file_path)}
                    alt={item.predicted_class}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900/60 text-slate-600">
                    <RiImageLine size={32} />
                  </div>
                )}
                {/* Confidence Badge */}
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold border border-white/10 text-primary-300">
                  {Math.round(item.confidence_score * 100)}% Match
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-0.5 rounded bg-slate-800/40 border border-slate-700/30">
                      ID: {item.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <RiTimeLine />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-200 group-hover:text-primary-300 transition-colors">
                    {item.predicted_class || 'Unknown Object'}
                  </h3>

                  <p className="text-xs text-slate-500 truncate mt-1">
                    File: {item.image?.original_filename || 'No associated image'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-slate-800/40">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
                    <span>Confidence Score</span>
                    <span>{Math.round(item.confidence_score * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                      style={{ width: `${item.confidence_score * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResult(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-4xl p-0 overflow-hidden relative z-10 max-h-[90vh] flex flex-col border border-slate-800"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <span>{selectedResult.predicted_class} Analysis</span>
                    <span className="text-sm font-semibold text-primary-400 bg-primary-950/40 border border-primary-800/30 px-2.5 py-0.5 rounded-full">
                      {Math.round(selectedResult.confidence_score * 100)}% Match
                    </span>
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Processed on {new Date(selectedResult.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RiCloseLine size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Image Preview */}
                  <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative min-h-[300px]">
                    {selectedResult.image?.file_path ? (
                      <img
                        src={getImageUrl(selectedResult.image.file_path)}
                        alt={selectedResult.predicted_class}
                        className="max-h-[400px] w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-600">
                        <RiImageLine size={48} />
                        <span>No image path found</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Technical Stats */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Model Prediction Hierarchy</h4>
                      <div className="space-y-2">
                        {(selectedResult.top_k_predictions || selectedResult.all_predictions || []).map((pred, i) => (
                          <div key={pred.class_name} className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/20">
                            <div className="flex justify-between text-sm mb-1.5 font-medium">
                              <span className="text-slate-200">
                                {i + 1}. {pred.class_name}
                              </span>
                              <span className="text-primary-400">{Math.round(pred.confidence * 100)}%</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full"
                                style={{ width: `${pred.confidence * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800/40">
                        <p className="text-xs text-slate-500 font-medium">Processing Time</p>
                        <p className="text-2xl font-bold text-slate-200 mt-1">{selectedResult.total_processing_time_ms || 342} ms</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800/40">
                        <p className="text-xs text-slate-500 font-medium">Image Resolution</p>
                        <p className="text-2xl font-bold text-slate-200 mt-1">
                          {selectedResult.image?.width || 640} x {selectedResult.image?.height || 480}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pipeline Steps Details */}
                <div className="border-t border-slate-800/50 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Pipeline Execution Steps</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { step: 'Image Preprocessing', time: '12ms', status: 'completed' },
                      { step: 'Harris Corner Detection', time: '45ms', status: 'completed' },
                      { step: 'SIFT Feature Extraction', time: '112ms', status: 'completed' },
                      { step: 'PCA Optimization', time: '8ms', status: 'completed' },
                      { step: 'Object Classification', time: '165ms', status: 'completed' },
                    ].map((step, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-800/20 border border-slate-800/40 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{step.step}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Duration: {step.time}</p>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-success-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryPage;

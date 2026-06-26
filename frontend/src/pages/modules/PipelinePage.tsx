import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { RiFlowChart, RiLoader4Line, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { imageService, recognitionService } from '../../services/api';
import type { ImageRecord, RecognitionResult } from '../../types';
import { usePipelineStore } from '../../store';

const PIPELINE_STEPS = [
  { id: 'upload',      label: 'Upload & Validate',       icon: '📤', desc: 'Image uploaded and validated' },
  { id: 'enhance',     label: 'Image Enhancement',        icon: '🎨', desc: 'Preprocessing and enhancement' },
  { id: 'preprocess',  label: 'Noise Removal & Normalization', icon: '🔧', desc: 'Image normalization applied' },
  { id: 'harris',      label: 'Harris Corner Detection',  icon: '📐', desc: 'Corner features detected' },
  { id: 'sift',        label: 'SIFT Feature Extraction',  icon: '🔑', desc: 'Keypoints extracted' },
  { id: 'pca',         label: 'PCA Optimization',         icon: '📊', desc: 'Features reduced' },
  { id: 'recognize',   label: 'Object Recognition',       icon: '🔍', desc: 'Object classified' },
];

const PipelinePage: React.FC = () => {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [running, setRunning] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<Record<string, 'pending' | 'running' | 'done' | 'error'>>({});

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] }, maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      const reader = new FileReader(); reader.onload = e => setPreview(e.target?.result as string); reader.readAsDataURL(files[0]);
      try { const res = await imageService.upload(files[0]); setImage(res.data.data!); setResult(null); setStepStatuses({}); toast.success('Image ready!'); } catch { toast.error('Upload failed'); }
    },
  });

  const runPipeline = async () => {
    if (!image) { toast.warning('Upload an image first'); return; }
    setRunning(true);
    setResult(null);

    // Simulate step-by-step progress
    const steps = ['upload', 'enhance', 'preprocess', 'harris', 'sift', 'pca', 'recognize'];
    for (const step of steps) {
      setStepStatuses(prev => ({ ...prev, [step]: 'running' }));
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
      setStepStatuses(prev => ({ ...prev, [step]: 'done' }));
    }

    try {
      const res = await recognitionService.recognizeFull(image.id);
      setResult(res.data.data!);
      toast.success(`🎯 Pipeline complete! Object: ${res.data.data!.predicted_class}`);
    } catch {
      toast.error('Pipeline failed during recognition');
      setStepStatuses(prev => ({ ...prev, recognize: 'error' }));
    } finally {
      setRunning(false);
    }
  };

  const stepColor = (status?: string) => {
    if (status === 'done') return { bg: 'rgba(34,197,94,0.1)', border: '#22c55e', text: '#4ade80' };
    if (status === 'running') return { bg: 'rgba(99,102,241,0.15)', border: '#6366f1', text: '#818cf8' };
    if (status === 'error') return { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', text: '#f87171' };
    return { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', text: '#475569' };
  };

  const completedCount = Object.values(stepStatuses).filter(s => s === 'done').length;
  const progress = (completedCount / PIPELINE_STEPS.length) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Full Processing Pipeline</h1>
        <p className="text-slate-500 mt-1">End-to-end processing: Upload → Enhance → Harris → SIFT → PCA → Recognition in a single automated workflow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload + Steps */}
        <div className="space-y-4">
          <div {...getRootProps()} className={`upload-zone py-8 ${isDragActive ? 'drag-active' : ''}`}>
            <input {...getInputProps()} />
            <RiFlowChart className="text-4xl text-primary-400 mx-auto mb-3" />
            <p className="text-slate-200 font-semibold text-center">Drop Image Here</p>
            <p className="text-sm text-slate-500 mt-1 text-center">or click to browse</p>
          </div>

          {/* Progress */}
          {running || completedCount > 0 ? (
            <div className="glass-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-200">Pipeline Progress</span>
                <span className="text-xs text-primary-400 font-mono">{completedCount}/{PIPELINE_STEPS.length}</span>
              </div>
              <div className="progress-bar mb-3">
                <motion.div className="progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>
          ) : null}

          <motion.button
            onClick={runPipeline}
            disabled={running || !image}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="btn-primary w-full justify-center disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}
          >
            {running ? <><RiLoader4Line className="animate-spin" /> Running Pipeline...</> : <><RiFlowChart /> Launch Full Pipeline</>}
          </motion.button>
        </div>

        {/* Center: Pipeline Steps */}
        <div className="space-y-2">
          {PIPELINE_STEPS.map((step, i) => {
            const status = stepStatuses[step.id];
            const colors = stepColor(status);
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                  {status === 'running' ? <RiLoader4Line className="animate-spin" style={{ color: colors.text }} /> :
                   status === 'done' ? <RiCheckLine style={{ color: colors.text }} /> :
                   status === 'error' ? <RiCloseLine style={{ color: colors.text }} /> :
                   <span>{step.icon}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: status ? '#e2e8f0' : '#64748b' }}>{step.label}</p>
                  {status === 'running' && <p className="text-xs text-primary-400 animate-pulse">Processing...</p>}
                  {status === 'done' && <p className="text-xs text-success-400">{step.desc}</p>}
                  {status === 'error' && <p className="text-xs text-danger-400">Failed</p>}
                  {!status && <p className="text-xs text-slate-700">Waiting...</p>}
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="absolute left-7 mt-8 w-0.5 h-4 -ml-0.5" style={{ background: colors.border }} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {preview && (
            <div className="glass-card">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Input Image</p>
              <img src={preview} alt="Input" className="w-full rounded-xl object-contain max-h-48" />
            </div>
          )}

          {result ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card glow-border">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Final Recognition</p>
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🎯</div>
                <h2 className="text-2xl font-display font-bold text-slate-100">{result.predicted_class}</h2>
                <div className="text-4xl font-bold font-mono mt-2" style={{ color: result.confidence_score >= 0.9 ? '#22c55e' : result.confidence_score >= 0.7 ? '#eab308' : '#ef4444' }}>
                  {(result.confidence_score * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500 mt-1">confidence score</p>
              </div>
              <div className="progress-bar mt-3">
                <motion.div initial={{ width: 0 }} animate={{ width: `${result.confidence_score * 100}%` }} className="progress-fill" />
              </div>
              <p className="text-xs text-slate-600 text-center mt-2">Total: {result.total_processing_time_ms}ms</p>
            </motion.div>
          ) : (
            <div className="glass-card h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">⚡</div>
                <p className="text-slate-500 text-sm">Results will appear here after pipeline completes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipelinePage;

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { RiEyeLine, RiLoader4Line, RiDownloadLine, RiFileChartLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { imageService, recognitionService, reportService } from '../../services/api';
import type { ImageRecord, RecognitionResult } from '../../types';

const RecognitionPage: React.FC = () => {
  const [image, setImage]         = useState<ImageRecord | null>(null);
  const [preview, setPreview]     = useState('');
  const [result, setResult]       = useState<RecognitionResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [fullPipeline, setFullPipeline] = useState(true);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] }, maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      const reader = new FileReader(); reader.onload = e => setPreview(e.target?.result as string); reader.readAsDataURL(files[0]);
      try { const res = await imageService.upload(files[0]); setImage(res.data.data!); setResult(null); toast.success('Image ready for recognition'); } catch { toast.error('Upload failed'); }
    },
  });

  const recognize = async () => {
    if (!image) { toast.warning('Upload an image first'); return; }
    setProcessing(true);
    try {
      const fn = fullPipeline ? recognitionService.recognizeFull : recognitionService.recognize;
      const res = await fn(image.id);
      setResult(res.data.data!);
      toast.success(`🎯 Object recognized: ${res.data.data!.predicted_class} (${(res.data.data!.confidence_score * 100).toFixed(1)}%)`);
    } catch { toast.error('Recognition failed'); } finally { setProcessing(false); }
  };

  const radarData = result?.top_k_predictions?.map(p => ({
    category: p.class_name,
    confidence: parseFloat((p.confidence * 100).toFixed(1)),
  })) || [];

  const confidenceColor = (score: number) => {
    if (score >= 0.9) return '#22c55e';
    if (score >= 0.7) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Object Recognition</h1>
        <p className="text-slate-500 mt-1">AI-powered object classification using SIFT + PCA + Machine Learning with confidence scoring.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div {...getRootProps()} className={`upload-zone py-6 ${isDragActive ? 'drag-active' : ''}`}>
            <input {...getInputProps()} />
            <RiEyeLine className="text-3xl text-primary-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 text-center">Drop or click to upload</p>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <p className="text-sm text-slate-300 font-medium">Full Pipeline</p>
                <p className="text-xs text-slate-600">Enhancement + Harris + SIFT + PCA</p>
              </div>
              <button onClick={() => setFullPipeline(v => !v)}
                className={`w-10 h-5 rounded-full transition-all ${fullPipeline ? 'bg-primary-500' : 'bg-slate-700'}`}>
                <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: fullPipeline ? 'translateX(22px)' : 'translateX(2px)' }} />
              </button>
            </div>
          </div>

          <motion.button
            onClick={recognize}
            disabled={processing || !image}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="btn-primary w-full justify-center disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)' }}
          >
            {processing ? <><RiLoader4Line className="animate-spin" /> Recognizing...</> : <><RiEyeLine /> Recognize Object</>}
          </motion.button>

          {result && (
            <button onClick={async () => {
              try {
                const res = await reportService.generate('recognition', 'pdf', { recognition_id: result.id });
                toast.success('Report generation started');
              } catch { toast.error('Report generation failed'); }
            }} className="btn-secondary w-full justify-center text-sm">
              <RiFileChartLine /> Generate Report
            </button>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image */}
            <div className="glass-card">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Input Image</p>
              {preview ? (
                <img src={preview} alt="Input" className="w-full rounded-xl object-contain max-h-64" />
              ) : (
                <div className="h-64 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="text-center"><div className="text-4xl mb-2">🖼️</div><p className="text-slate-600 text-sm">Upload an image</p></div>
                </div>
              )}
            </div>

            {/* Prediction */}
            <div className="glass-card">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Recognition Result</p>
              {result ? (
                <div className="flex flex-col items-center justify-center h-52 gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-6xl"
                  >🎯</motion.div>
                  <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-slate-100">{result.predicted_class}</h2>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: confidenceColor(result.confidence_score) }} />
                      <span className="text-lg font-bold font-mono" style={{ color: confidenceColor(result.confidence_score) }}>
                        {(result.confidence_score * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500">confidence</span>
                    </div>
                  </div>
                  <div className="w-full progress-bar">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence_score * 100}%` }}
                      className="progress-fill"
                      style={{ background: `linear-gradient(90deg, ${confidenceColor(result.confidence_score)}, ${confidenceColor(result.confidence_score)}88)` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">Processed in {result.total_processing_time_ms}ms</p>
                </div>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <div className="text-center"><div className="text-4xl mb-2">🔍</div><p className="text-slate-600 text-sm">Recognition results appear here</p></div>
                </div>
              )}
            </div>
          </div>

          {/* Top Predictions + Radar */}
          {result && result.top_k_predictions && result.top_k_predictions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card">
                <h3 className="font-semibold text-slate-200 mb-4">Top Predictions</h3>
                <div className="space-y-3">
                  {result.top_k_predictions.map((p, i) => (
                    <div key={p.class_name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 w-4">#{i + 1}</span>
                          <span className="text-sm text-slate-300">{p.class_name}</span>
                        </div>
                        <span className="text-xs font-mono" style={{ color: confidenceColor(p.confidence) }}>
                          {(p.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.confidence * 100}%` }}
                          className="h-full rounded-full"
                          style={{ background: i === 0 ? 'linear-gradient(90deg, #6366f1, #d946ef)' : 'rgba(99,102,241,0.4)' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card">
                <h3 className="font-semibold text-slate-200 mb-2">Confidence Radar</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 10 }} />
                    <Radar name="Confidence" dataKey="confidence" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pipeline Steps */}
          {result && result.processing_pipeline && result.processing_pipeline.length > 0 && (
            <div className="glass-card">
              <h3 className="font-semibold text-slate-200 mb-3">Processing Pipeline</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {result.processing_pipeline.map((step, i) => (
                  <React.Fragment key={step.step}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                      style={{ background: step.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${step.status === 'completed' ? '#22c55e' : '#475569'}` }}>
                      <span className={step.status === 'completed' ? 'text-success-400' : 'text-slate-500'}>
                        {step.status === 'completed' ? '✓' : '○'}
                      </span>
                      <span className={step.status === 'completed' ? 'text-slate-300' : 'text-slate-500'}>{step.step}</span>
                      {step.duration_ms && <span className="text-slate-600">{step.duration_ms}ms</span>}
                    </div>
                    {i < result.processing_pipeline.length - 1 && <span className="text-slate-700">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecognitionPage;

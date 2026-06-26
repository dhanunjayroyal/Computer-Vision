import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RiBarChartLine, RiLoader4Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { imageService, pcaService } from '../../services/api';
import type { PCAParams, PCAResult, ImageRecord } from '../../types';

const PCAPage: React.FC = () => {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [params, setParams] = useState<PCAParams>({ n_components: 50, whiten: false });
  const [result, setResult] = useState<PCAResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] }, maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      try { const res = await imageService.upload(files[0]); setImage(res.data.data!); setResult(null); toast.success('Ready'); } catch { toast.error('Upload failed'); }
    },
  });

  const optimize = async () => {
    if (!image) { toast.warning('Upload image first'); return; }
    setProcessing(true);
    try {
      const res = await pcaService.optimize(image.id, params);
      setResult(res.data.data!);
      toast.success(`PCA reduced ${res.data.data!.original_dims} → ${res.data.data!.reduced_dims} dimensions`);
    } catch { toast.error('PCA failed'); } finally { setProcessing(false); }
  };

  const varianceData = result?.cumulative_variance?.map((v, i) => ({
    component: i + 1,
    variance: parseFloat((v * 100).toFixed(2)),
    explained: parseFloat(((result.explained_variance_ratio[i] || 0) * 100).toFixed(3)),
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">PCA Feature Optimization</h1>
        <p className="text-slate-500 mt-1">Apply Principal Component Analysis to reduce feature dimensionality while preserving maximum variance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <div {...getRootProps()} className="upload-zone py-6">
            <input {...getInputProps()} />
            <RiBarChartLine className="text-3xl text-primary-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 text-center">Upload image</p>
          </div>

          <div className="glass-card space-y-4">
            <h3 className="font-semibold text-slate-200 text-sm">PCA Parameters</h3>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Components: {params.n_components}</label>
              <input type="range" min={2} max={200} step={1} value={params.n_components}
                onChange={e => setParams(p => ({ ...p, n_components: parseInt(e.target.value) }))} className="w-full" />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-sm text-slate-400">Whiten</span>
              <button onClick={() => setParams(p => ({ ...p, whiten: !p.whiten }))}
                className={`w-10 h-5 rounded-full transition-all ${params.whiten ? 'bg-primary-500' : 'bg-slate-700'}`}>
                <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: params.whiten ? 'translateX(22px)' : 'translateX(2px)' }} />
              </button>
            </div>
          </div>

          <button onClick={optimize} disabled={processing || !image} className="btn-primary w-full justify-center disabled:opacity-50">
            {processing ? <><RiLoader4Line className="animate-spin" /> Optimizing...</> : <><RiBarChartLine /> Run PCA</>}
          </button>

          {result && (
            <div className="glass-card space-y-3">
              <h3 className="font-semibold text-slate-200 text-sm">Summary</h3>
              {[
                { label: 'Original Dims', value: result.original_dims },
                { label: 'Reduced Dims', value: result.reduced_dims },
                { label: 'Compression', value: `${(result.compression_ratio * 100).toFixed(1)}%` },
                { label: 'Process Time', value: `${result.processing_time_ms}ms` },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{s.label}</span>
                  <span className="text-primary-400 font-semibold font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="glass-card">
                <h3 className="font-semibold text-slate-200 mb-4">Cumulative Explained Variance</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={varianceData.slice(0, 50)}>
                    <defs>
                      <linearGradient id="pcaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="component" tick={{ fill: '#475569', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: 'rgba(10,14,26,0.95)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12 }} />
                    <Area type="monotone" dataKey="variance" name="Cumulative Variance %" stroke="#6366f1" strokeWidth={2} fill="url(#pcaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card">
                <h3 className="font-semibold text-slate-200 mb-3">Top Component Variance</h3>
                <div className="space-y-2">
                  {result.explained_variance_ratio.slice(0, 10).map((v, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-10">PC{i + 1}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full" style={{ width: `${v * 100 * 5}%`, background: 'linear-gradient(90deg, #6366f1, #d946ef)' }} />
                      </div>
                      <span className="text-xs text-primary-400 font-mono w-14 text-right">{(v * 100).toFixed(3)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-3">📊</div>
                <p className="text-slate-400 font-medium">Run PCA to see variance analysis</p>
                <p className="text-slate-600 text-sm mt-1">Upload an image and click Run PCA</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PCAPage;

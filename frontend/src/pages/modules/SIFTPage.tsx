import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { RiKeyLine, RiLoader4Line, RiDownloadLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { imageService, siftService } from '../../services/api';
import type { SIFTParams, SIFTResult, ImageRecord } from '../../types';

const SIFTPage: React.FC = () => {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [preview, setPreview] = useState('');
  const [params, setParams] = useState<SIFTParams>({ n_features: 500, n_octave_layers: 3, contrast_threshold: 0.04, edge_threshold: 10, sigma: 1.6 });
  const [result, setResult] = useState<SIFTResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] }, maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      new FileReader().onload = e => setPreview(e.target?.result as string);
      const reader = new FileReader(); reader.onload = e => setPreview(e.target?.result as string); reader.readAsDataURL(files[0]);
      try { const res = await imageService.upload(files[0]); setImage(res.data.data!); setResult(null); toast.success('Ready'); } catch { toast.error('Upload failed'); }
    },
  });

  const extract = async () => {
    if (!image) { toast.warning('Upload image first'); return; }
    setProcessing(true);
    try {
      const res = await siftService.extract(image.id, params);
      setResult(res.data.data!);
      toast.success(`SIFT: ${res.data.data!.keypoint_count} keypoints in ${res.data.data!.processing_time_ms}ms`);
    } catch { toast.error('SIFT extraction failed'); } finally { setProcessing(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">SIFT Feature Extraction</h1>
        <p className="text-slate-500 mt-1">Extract Scale-Invariant Feature Transform (SIFT) keypoints and descriptors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <div {...getRootProps()} className="upload-zone py-6">
            <input {...getInputProps()} />
            <RiKeyLine className="text-3xl text-primary-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 text-center">Upload image</p>
          </div>

          <div className="glass-card space-y-4">
            <h3 className="font-semibold text-slate-200 text-sm">SIFT Parameters</h3>
            {[
              { label: `Max Features: ${params.n_features}`, field: 'n_features', min: 100, max: 5000, step: 100 },
              { label: `Octave Layers: ${params.n_octave_layers}`, field: 'n_octave_layers', min: 1, max: 10, step: 1 },
              { label: `Contrast Thresh: ${params.contrast_threshold.toFixed(3)}`, field: 'contrast_threshold', min: 0.01, max: 0.2, step: 0.01 },
              { label: `Edge Threshold: ${params.edge_threshold}`, field: 'edge_threshold', min: 3, max: 50, step: 1 },
              { label: `Sigma: ${params.sigma.toFixed(1)}`, field: 'sigma', min: 0.5, max: 3.0, step: 0.1 },
            ].map(p => (
              <div key={p.field}>
                <label className="text-xs text-slate-400 mb-1 block">{p.label}</label>
                <input type="range" min={p.min} max={p.max} step={p.step}
                  value={params[p.field as keyof SIFTParams] as number}
                  onChange={e => setParams(prev => ({ ...prev, [p.field]: parseFloat(e.target.value) }))}
                  className="w-full" />
              </div>
            ))}
          </div>

          <button onClick={extract} disabled={processing || !image} className="btn-primary w-full justify-center disabled:opacity-50">
            {processing ? <><RiLoader4Line className="animate-spin" /> Extracting...</> : <><RiKeyLine /> Extract Features</>}
          </button>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Original</p>
              {preview ? <img src={preview} alt="Original" className="w-full rounded-xl max-h-64 object-contain" /> :
                <div className="h-64 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}><p className="text-slate-600 text-sm">Upload image</p></div>}
            </div>
            <div className="glass-card">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">SIFT Keypoints</p>
              {result ? (
                <img src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${result.keypoint_image_path}`} alt="SIFT" className="w-full rounded-xl max-h-64 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = preview; }} />
              ) : <div className="h-64 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}><p className="text-slate-600 text-sm">Run extraction</p></div>}
            </div>
          </div>

          {result && (
            <div className="glass-card">
              <h3 className="font-semibold text-slate-200 mb-3">SIFT Results</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Keypoints',    value: result.keypoint_count,         color: '#6366f1' },
                  { label: 'Descriptor Size', value: `${result.descriptor_shape[0]}×${result.descriptor_shape[1]}`, color: '#d946ef' },
                  { label: 'Process Time', value: `${result.processing_time_ms}ms`, color: '#06b6d4' },
                  { label: 'Max Features', value: params.n_features,             color: '#22c55e' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${s.color}` }}>
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Top keypoints table */}
              {result.keypoints && result.keypoints.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2 font-semibold">Top Keypoints</p>
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead><tr>{['X', 'Y', 'Size', 'Angle', 'Response', 'Octave'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {result.keypoints.slice(0, 5).map((kp, i) => (
                          <tr key={i}>
                            <td className="font-mono text-primary-400">{kp.x.toFixed(1)}</td>
                            <td className="font-mono text-primary-400">{kp.y.toFixed(1)}</td>
                            <td className="font-mono text-slate-300">{kp.size.toFixed(2)}</td>
                            <td className="font-mono text-slate-300">{kp.angle.toFixed(1)}°</td>
                            <td className="font-mono text-accent-400">{kp.response.toFixed(4)}</td>
                            <td className="font-mono text-slate-400">{kp.octave}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SIFTPage;

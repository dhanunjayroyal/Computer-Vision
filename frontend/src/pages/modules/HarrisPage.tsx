import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RiParentLine, RiLoader4Line, RiDownloadLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { imageService, harrisService } from '../../services/api';
import type { HarrisParams, HarrisResult, ImageRecord } from '../../types';

const HarrisPage: React.FC = () => {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [preview, setPreview] = useState('');
  const [params, setParams] = useState<HarrisParams>({ block_size: 2, ksize: 3, k: 0.04, threshold: 0.01 });
  const [result, setResult] = useState<HarrisResult | null>(null);
  const [processing, setProcessing] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] }, maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(files[0]);
      try {
        const res = await imageService.upload(files[0]);
        setImage(res.data.data!); setResult(null);
        toast.success('Image ready for Harris detection');
      } catch { toast.error('Upload failed'); }
    },
  });

  const detect = async () => {
    if (!image) { toast.warning('Upload an image first'); return; }
    setProcessing(true);
    try {
      const res = await harrisService.detect(image.id, params);
      setResult(res.data.data!);
      toast.success(`Harris detection: ${res.data.data!.corner_count} corners found in ${res.data.data!.processing_time_ms}ms`);
    } catch { toast.error('Detection failed'); } finally { setProcessing(false); }
  };

  const coordSample = result?.corner_coordinates?.slice(0, 10) || [];
  const histData = result ? [
    { name: 'Corners', value: result.corner_count },
    { name: 'Width',   value: image?.width || 0 },
    { name: 'Height',  value: image?.height || 0 },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Harris Corner Detection</h1>
        <p className="text-slate-500 mt-1">Detect corner features using the Harris Corner Detection algorithm with adjustable parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div {...getRootProps()} className={`upload-zone py-6 ${isDragActive ? 'drag-active' : ''}`}>
            <input {...getInputProps()} />
            <RiParentLine className="text-3xl text-primary-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 text-center">Drop or click to upload image</p>
          </div>

          <div className="glass-card space-y-4">
            <h3 className="font-semibold text-slate-200 text-sm">Harris Parameters</h3>
            {[
              { label: `Block Size: ${params.block_size}`, field: 'block_size', min: 2, max: 10, step: 1 },
              { label: `Sobel Ksize: ${params.ksize}`, field: 'ksize', min: 3, max: 31, step: 2 },
              { label: `Harris k: ${params.k.toFixed(3)}`, field: 'k', min: 0.01, max: 0.1, step: 0.005 },
              { label: `Threshold: ${params.threshold.toFixed(3)}`, field: 'threshold', min: 0.001, max: 0.1, step: 0.001 },
            ].map(p => (
              <div key={p.field}>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-slate-400">{p.label}</label>
                </div>
                <input type="range" min={p.min} max={p.max} step={p.step}
                  value={params[p.field as keyof HarrisParams] as number}
                  onChange={e => setParams(prev => ({ ...prev, [p.field]: parseFloat(e.target.value) }))}
                  className="w-full" />
              </div>
            ))}
          </div>

          <button onClick={detect} disabled={processing || !image}
            className="btn-primary w-full justify-center disabled:opacity-50">
            {processing ? <><RiLoader4Line className="animate-spin" /> Detecting...</> : <><RiParentLine /> Detect Corners</>}
          </button>
          {result && (
            <button onClick={async () => {
              const res = await harrisService.downloadResult(result.id);
              const url = URL.createObjectURL(res.data as Blob);
              const a = document.createElement('a'); a.href = url; a.download = 'harris_result.png'; a.click();
            }} className="btn-secondary w-full justify-center text-sm">
              <RiDownloadLine /> Download Result
            </button>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="glass-card">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Original Image</p>
              {preview ? (
                <img src={preview} alt="Original" className="w-full rounded-xl object-contain max-h-64" />
              ) : (
                <div className="h-64 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-slate-600 text-sm">Upload an image</p>
                </div>
              )}
            </div>

            {/* Harris Result */}
            <div className="glass-card">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Corner Detection</p>
              {result ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${result.corner_image_path}`}
                  alt="Harris Result"
                  className="w-full rounded-xl object-contain max-h-64"
                  onError={(e) => { (e.target as HTMLImageElement).src = preview; }}
                />
              ) : (
                <div className="h-64 flex items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-slate-600 text-sm">Run detection to see result</p>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          {result && (
            <div className="glass-card">
              <h3 className="font-semibold text-slate-200 mb-4">Detection Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Corners Found', value: result.corner_count, color: '#6366f1' },
                  { label: 'Process Time', value: `${result.processing_time_ms}ms`, color: '#d946ef' },
                  { label: 'Image Width',   value: `${image?.width}px`, color: '#06b6d4' },
                  { label: 'Image Height',  value: `${image?.height}px`, color: '#22c55e' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${s.color}` }}>
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Sample coordinates */}
              {coordSample.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-semibold">Sample Corner Coordinates (top 10)</p>
                  <div className="grid grid-cols-5 gap-1">
                    {coordSample.map(([x, y], i) => (
                      <div key={i} className="p-1.5 rounded-lg text-center text-xs font-mono"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                        ({x}, {y})
                      </div>
                    ))}
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

export default HarrisPage;

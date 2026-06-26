import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  RiMagicLine, RiLoader4Line, RiDownloadLine, RiRefreshLine,
  RiSunLine, RiContrastLine, RiSurroundSoundLine, RiEyeLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import { imageService, enhancementService } from '../../services/api';
import type { EnhancementParams, EnhancementResult, ImageRecord } from '../../types';

const defaultParams: EnhancementParams = {
  brightness: 1.0, contrast: 1.0, sharpness: 1.0,
  blur_type: 'none', blur_radius: 3,
  equalize_histogram: false, normalize: false, denoise: false,
  grayscale: false, edge_enhance: false,
  rotation: 0, flip_horizontal: false, flip_vertical: false,
};

const EnhancementPage: React.FC = () => {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string>('');
  const [params, setParams] = useState<EnhancementParams>(defaultParams);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    onDrop: async (files) => {
      if (!files[0]) return;
      const reader = new FileReader();
      reader.onload = e => setOriginalPreview(e.target?.result as string);
      reader.readAsDataURL(files[0]);
      try {
        const res = await imageService.upload(files[0]);
        setImage(res.data.data!);
        setResult(null);
        toast.success('Image uploaded!');
      } catch { toast.error('Upload failed'); }
    },
  });

  const applyEnhancement = async () => {
    if (!image) { toast.warning('Please upload an image first'); return; }
    setProcessing(true);
    try {
      const res = await enhancementService.enhance(image.id, params);
      setResult(res.data.data!);
      toast.success(`Enhancement applied in ${res.data.data!.processing_time_ms}ms`);
    } catch { toast.error('Enhancement failed'); } finally { setProcessing(false); }
  };

  const downloadResult = async () => {
    if (!result) return;
    try {
      const res = await enhancementService.downloadEnhanced(result.id);
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a'); a.href = url; a.download = 'enhanced.png'; a.click();
    } catch { toast.error('Download failed'); }
  };

  const Slider = ({ label, field, min, max, step = 0.1, icon }: { label: string; field: keyof EnhancementParams; min: number; max: number; step?: number; icon?: React.ReactNode }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          {icon && <span className="text-slate-500">{icon}</span>}{label}
        </label>
        <span className="text-xs text-primary-400 font-mono">{(params[field] as number).toFixed(1)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={params[field] as number}
        onChange={e => setParams(p => ({ ...p, [field]: parseFloat(e.target.value) }))}
        className="w-full accent-primary-500" />
    </div>
  );

  const Toggle = ({ label, field }: { label: string; field: keyof EnhancementParams }) => (
    <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <span className="text-sm text-slate-400">{label}</span>
      <button
        onClick={() => setParams(p => ({ ...p, [field]: !p[field] }))}
        className={`w-10 h-5 rounded-full transition-all ${params[field] ? 'bg-primary-500' : 'bg-slate-700'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${params[field] ? 'translate-x-5' : 'translate-x-1'}`} style={{ transform: params[field] ? 'translateX(22px)' : 'translateX(2px)' }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold gradient-text">Image Enhancement</h1>
        <p className="text-slate-500 mt-1">Apply advanced preprocessing: histogram equalization, noise removal, filtering, and normalization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Upload */}
          <div {...getRootProps()} className={`upload-zone py-6 ${isDragActive ? 'drag-active' : ''}`}>
            <input {...getInputProps()} />
            <RiMagicLine className="text-3xl text-primary-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 text-center">Drop or click to select image</p>
          </div>

          {/* Adjustments */}
          <div className="glass-card space-y-4">
            <h3 className="font-semibold text-slate-200 text-sm">Adjustments</h3>
            <Slider label="Brightness" field="brightness" min={0.1} max={3.0} icon={<RiSunLine />} />
            <Slider label="Contrast"   field="contrast"   min={0.1} max={3.0} icon={<RiContrastLine />} />
            <Slider label="Sharpness"  field="sharpness"  min={0.0} max={5.0} icon={<RiEyeLine />} />
            <Slider label="Rotation"   field="rotation"   min={-180} max={180} step={1} icon={<RiSurroundSoundLine />} />
          </div>

          {/* Filters */}
          <div className="glass-card space-y-3">
            <h3 className="font-semibold text-slate-200 text-sm">Filters</h3>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Blur Type</label>
              <select
                className="input-field text-sm"
                value={params.blur_type}
                onChange={e => setParams(p => ({ ...p, blur_type: e.target.value as any }))}
              >
                <option value="none">None</option>
                <option value="gaussian">Gaussian Blur</option>
                <option value="median">Median Blur</option>
                <option value="bilateral">Bilateral Filter</option>
              </select>
            </div>
            {params.blur_type !== 'none' && (
              <Slider label="Blur Radius" field="blur_radius" min={1} max={15} step={2} />
            )}
            <Toggle label="Histogram EQ"     field="equalize_histogram" />
            <Toggle label="Normalize"         field="normalize" />
            <Toggle label="Denoise"           field="denoise" />
            <Toggle label="Grayscale"         field="grayscale" />
            <Toggle label="Edge Enhance"      field="edge_enhance" />
            <Toggle label="Flip Horizontal"   field="flip_horizontal" />
            <Toggle label="Flip Vertical"     field="flip_vertical" />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button onClick={applyEnhancement} disabled={processing || !image}
              className="btn-primary justify-center disabled:opacity-50">
              {processing ? <><RiLoader4Line className="animate-spin" /> Processing...</> : <><RiMagicLine /> Apply Enhancement</>}
            </button>
            <button onClick={() => setParams(defaultParams)} className="btn-secondary justify-center text-sm">
              <RiRefreshLine /> Reset Params
            </button>
            {result && (
              <button onClick={downloadResult} className="btn-success justify-center text-sm">
                <RiDownloadLine /> Download
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3 space-y-4">
          {!image ? (
            <div className="glass-card h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-3">🎨</div>
                <p className="text-slate-400 font-medium">Upload an image to get started</p>
                <p className="text-slate-600 text-sm mt-1">Drag & drop or use the panel on the left</p>
              </div>
            </div>
          ) : (
            <div className="glass-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-200">Before / After Comparison</h3>
                {result && (
                  <div className="flex items-center gap-2">
                    <span className="badge-success">Processing: {result.processing_time_ms}ms</span>
                  </div>
                )}
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-2 text-center font-medium uppercase tracking-wider">Original</p>
                  <img src={originalPreview} alt="Original" className="w-full rounded-xl object-contain max-h-72" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2 text-center font-medium uppercase tracking-wider">Enhanced</p>
                  {result ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}/uploads/${result.enhanced_path}`}
                      alt="Enhanced"
                      className="w-full rounded-xl object-contain max-h-72"
                      onError={(e) => { (e.target as HTMLImageElement).src = originalPreview; }}
                    />
                  ) : (
                    <div className="w-full rounded-xl max-h-72 h-full flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', minHeight: 200 }}>
                      <p className="text-slate-600 text-sm">Apply enhancement to preview</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              {result && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Before Mean', value: result.before_stats.mean.toFixed(2) },
                    { label: 'After Mean',  value: result.after_stats.mean.toFixed(2) },
                    { label: 'Entropy',     value: result.after_stats.entropy.toFixed(3) },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className="text-lg font-bold text-primary-400 font-mono">{s.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image Metadata */}
          {image && (
            <div className="glass-card">
              <h3 className="font-semibold text-slate-200 mb-3 text-sm">Image Metadata</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Width',     value: `${image.width}px` },
                  { label: 'Height',    value: `${image.height}px` },
                  { label: 'Format',    value: image.file_type },
                  { label: 'Size',      value: image.file_size < 1024*1024 ? `${(image.file_size/1024).toFixed(0)}KB` : `${(image.file_size/1024/1024).toFixed(1)}MB` },
                ].map(m => (
                  <div key={m.label} className="p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <p className="text-sm font-semibold text-slate-200 font-mono">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancementPage;

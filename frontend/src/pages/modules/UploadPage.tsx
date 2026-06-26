import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiUploadCloud2Line, RiImageLine, RiDeleteBin6Line, RiCheckLine,
  RiLoader4Line, RiDownloadLine, RiEyeLine, RiFileLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';
import { imageService } from '../../services/api';
import type { ImageRecord } from '../../types';

const UploadPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<ImageRecord[]>([]);

  const onDrop = useCallback((accepted: File[]) => {
    const valid = accepted.filter(f => f.size <= 50 * 1024 * 1024); // 50MB limit
    if (valid.length < accepted.length) {
      toast.warning('Some files exceeded the 50MB limit and were skipped.');
    }
    setFiles(prev => [...prev, ...valid]);
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'] },
    multiple: true,
  });

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadAll = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);
    const results: ImageRecord[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const res = await imageService.upload(files[i], (p) => {
          setProgress(Math.round(((i / files.length) + (p / 100 / files.length)) * 100));
        });
        results.push(res.data.data!);
        toast.success(`✓ ${files[i].name} uploaded`);
      } catch {
        toast.error(`✗ Failed to upload ${files[i].name}`);
      }
    }

    setUploadedImages(prev => [...results, ...prev]);
    setFiles([]);
    setPreviews([]);
    setUploading(false);
    setProgress(100);
    toast.success(`Successfully uploaded ${results.length} image(s)!`);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-100">
          <span className="gradient-text">Image Upload</span>
        </h1>
        <p className="text-slate-500 mt-1">Upload images for processing through the SmartVision pipeline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-3 space-y-4">
          <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}>
            <input {...getInputProps()} id="file-upload-input" />
            <motion.div
              animate={{ scale: isDragActive ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                {isDragActive ? '📂' : <RiUploadCloud2Line className="text-primary-400" />}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-200">
                  {isDragActive ? 'Drop your images here!' : 'Drag & drop images here'}
                </p>
                <p className="text-sm text-slate-500 mt-1">or <span className="text-primary-400 cursor-pointer hover:underline">browse files</span></p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {['JPG', 'PNG', 'BMP', 'TIFF', 'WebP'].map(fmt => (
                  <span key={fmt} className="badge-primary text-xs">{fmt}</span>
                ))}
              </div>
              <p className="text-xs text-slate-600">Maximum file size: 50MB per image</p>
            </motion.div>
          </div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-200">{files.length} file(s) selected</h3>
                  <button onClick={() => { setFiles([]); setPreviews([]); }} className="text-xs text-danger-400 hover:text-danger-300">
                    Clear all
                  </button>
                </div>
                {files.map((file, idx) => (
                  <motion.div
                    key={`${file.name}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <img src={previews[idx]} alt={file.name} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                    </div>
                    <button onClick={() => removeFile(idx)} className="p-1.5 rounded-lg text-slate-600 hover:text-danger-400 hover:bg-danger-500/10 transition-colors">
                      <RiDeleteBin6Line size={16} />
                    </button>
                  </motion.div>
                ))}

                {/* Upload Button */}
                {uploading && (
                  <div className="progress-bar">
                    <motion.div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                )}
                <motion.button
                  onClick={uploadAll}
                  disabled={uploading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn-primary w-full justify-center disabled:opacity-60"
                >
                  {uploading ? (
                    <><RiLoader4Line className="animate-spin" /> Uploading... {progress}%</>
                  ) : (
                    <><RiUploadCloud2Line /> Upload {files.length} Image{files.length > 1 ? 's' : ''}</>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload Stats */}
          <div className="glass-card">
            <h3 className="font-semibold text-slate-200 mb-3">Upload Guidelines</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                '✅ Supported: JPG, PNG, BMP, TIFF, WebP',
                '✅ Max file size: 50 MB per image',
                '✅ Multiple files supported',
                '✅ Images auto-validated on upload',
                '⚠️ Avoid blurry or very dark images',
                '💡 Higher resolution = better accuracy',
              ].map(line => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          {/* Processing Pipeline Info */}
          <div className="glass-card">
            <h3 className="font-semibold text-slate-200 mb-3">After Upload</h3>
            <div className="space-y-2">
              {[
                { step: '1', label: 'Enhancement', icon: '🎨' },
                { step: '2', label: 'Harris Corner', icon: '📐' },
                { step: '3', label: 'SIFT Features', icon: '🔑' },
                { step: '4', label: 'PCA Optimize', icon: '📊' },
                { step: '5', label: 'Recognition', icon: '🔍' },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                    {item.step}
                  </div>
                  <span className="text-sm text-slate-400">{item.icon} {item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-200">Recently Uploaded</h3>
            <span className="badge-success">{uploadedImages.length} images</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {uploadedImages.map((img) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-xl overflow-hidden"
                style={{ aspectRatio: '1' }}
              >
                <img
                  src={imageService.getThumbnail(img.id)}
                  alt={img.original_filename}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200/1e293b/6366f1?text=IMG'; }}
                />
                {/* Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                  style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <button className="p-1.5 rounded-lg glass" title="View" onClick={() => toast.info(`Image ID: ${img.id}`)}>
                    <RiEyeLine size={14} className="text-slate-200" />
                  </button>
                  <button className="p-1.5 rounded-lg glass" title="Download"
                    onClick={async () => {
                      const res = await imageService.download(img.id);
                      const url = URL.createObjectURL(res.data as Blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = img.original_filename; a.click();
                    }}>
                    <RiDownloadLine size={14} className="text-slate-200" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                  <p className="text-xs text-slate-300 truncate">{img.original_filename}</p>
                </div>
                {/* Success badge */}
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-success-500 flex items-center justify-center">
                  <RiCheckLine size={10} className="text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UploadPage;

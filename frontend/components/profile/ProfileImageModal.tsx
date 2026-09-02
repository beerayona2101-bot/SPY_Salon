'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Check, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onSaveAvatar: (imageBase64: string) => Promise<void>;
  onRemoveAvatar: () => Promise<void>;
}

export default function ProfileImageModal({
  isOpen,
  onClose,
  currentAvatar,
  onSaveAvatar,
  onRemoveAvatar
}: ProfileImageModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Invalid file format. Please upload JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please select a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleSave = async () => {
    if (!previewUrl) return;
    setIsSaving(true);
    try {
      // Create canvas to process rotation & zoom crop
      const img = new Image();
      img.src = previewUrl;
      await new Promise(resolve => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 400; // Standard 400x400 full resolution avatar size
      canvas.width = size;
      canvas.height = size;

      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
      }

      const finalBase64 = canvas.toDataURL('image/jpeg', 0.9);
      await onSaveAvatar(finalBase64);
      onClose();
    } catch (err) {
      setError('Failed to process image. Please try another image.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    try {
      await onRemoveAvatar();
      setPreviewUrl(null);
      setSelectedFile(null);
      onClose();
    } catch (err) {
      setError('Failed to remove photo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg glass-card border border-rosegold-500/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-glow-rosegold relative my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-rosegold-400" />
              <h3 className="text-xl font-serif font-bold text-white">Upload Profile Photo</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="user"
            className="hidden"
          />

          {/* Preview & Drag/Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all duration-300 relative flex flex-col items-center justify-center min-h-[220px] ${
              isDragOver
                ? 'border-rosegold-400 bg-rosegold-500/10 scale-[1.01]'
                : 'border-rosegold-500/30 bg-dark-850/80 hover:border-rosegold-500/50'
            }`}
          >
            {previewUrl ? (
              <div className="space-y-4 flex flex-col items-center">
                {/* Circular Avatar Crop Frame */}
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-rosegold-400 shadow-2xl relative bg-dark-900 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Avatar Preview"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>

                <span className="text-[11px] text-gray-400 font-mono">
                  Drag slider to zoom • Click rotate to adjust orientation
                </span>
              </div>
            ) : (
              <div className="space-y-3 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-rosegold-500/20 text-rosegold-400 flex items-center justify-center border border-rosegold-500/30 shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Drag & drop your photo here</p>
                  <p className="text-xs text-gray-400">Supports JPG, JPEG, PNG, WEBP (Max 5MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Image Adjustments Toolbar (Zoom & Rotate) */}
          {previewUrl && (
            <div className="p-4 rounded-2xl bg-dark-900 border border-white/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium flex items-center space-x-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-rosegold-400" />
                  <span>Zoom Level ({Math.round(zoom * 100)}%)</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setZoom(prev => Math.max(1, prev - 0.25))}
                    className="p-1 rounded bg-dark-800 text-gray-300 hover:text-white border border-white/10"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                    className="p-1 rounded bg-dark-800 text-gray-300 hover:text-white border border-white/10"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="w-full accent-rosegold-400 cursor-pointer"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleRotate}
                  className="px-3 py-1.5 rounded-xl bg-dark-800 text-rosegold-300 hover:text-white border border-white/10 flex items-center space-x-1.5 font-bold cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-rosegold-400 font-bold hover:underline cursor-pointer"
                >
                  Choose Different File
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 rounded-2xl bg-dark-800 hover:bg-dark-750 text-white font-bold text-xs border border-white/10 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-rosegold-400" />
              <span>Browse Files</span>
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-3 rounded-2xl bg-dark-800 hover:bg-dark-750 text-white font-bold text-xs border border-white/10 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-rosegold-400" />
              <span>Capture Photo</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            {currentAvatar ? (
              <button
                onClick={handleRemove}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-bold text-xs border border-red-500/20 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-dark-800 text-gray-300 font-bold text-xs border border-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!previewUrl || isSaving}
                className="px-6 py-2.5 rounded-xl rosegold-gradient-bg text-dark-900 font-extrabold text-xs shadow-glow-rosegold hover:scale-105 transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Photo'}</span>
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

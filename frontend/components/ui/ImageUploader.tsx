'use client';

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface ImageUploaderProps {
  initialUrl?: string;
  folder?: string;
  label?: string;
  onUploadSuccess: (url: string) => void;
  className?: string;
}

export default function ImageUploader({
  initialUrl = '',
  folder = 'services',
  label = 'Upload Image',
  onUploadSuccess,
  className = ''
}: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);

      const res = await fetch(`${API_BASE_URL}/upload/single`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success && data.data?.url) {
        const cloudinaryUrl = data.data.url;
        setPreviewUrl(cloudinaryUrl);
        setSuccessMessage('Compressed & saved to Cloudinary!');
        onUploadSuccess(cloudinaryUrl);
      } else {
        setErrorMessage(data.message || 'Cloudinary upload failed.');
      }
    } catch (err: any) {
      setErrorMessage('Failed to connect to image upload server.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    setSuccessMessage(null);
    setErrorMessage(null);
    onUploadSuccess('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-xs text-gray-300 uppercase font-semibold block">
          {label} (Cloudinary & Compressed)
        </label>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-2.5 rounded-xl bg-green-500/20 border border-green-500/40 text-green-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="relative group">
        {previewUrl ? (
          <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-rosegold-500/40 bg-dark-800 shadow-md">
            <img
              src={previewUrl}
              alt="Uploaded Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-rosegold-400 text-xs space-y-2 backdrop-blur-sm">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Compressing & Uploading...</span>
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer bg-dark-800/80 hover:bg-dark-800 hover:border-rosegold-500/50 transition-all p-4 text-center">
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2 text-rosegold-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-semibold">Compressing with Sharp & Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 text-gray-400 group-hover:text-rosegold-300 transition-colors">
                <UploadCloud className="w-8 h-8 text-rosegold-400" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">Click or drag image to upload</p>
                  <p className="text-[10px] text-gray-400">Sharp WebP Compression &bull; Max 10MB</p>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

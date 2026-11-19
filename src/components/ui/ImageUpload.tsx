'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (base64Image: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'any';
  maxSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Foto Profil Jemaat',
  helperText = 'Format: JPG, PNG, WebP (Maks. 5MB). Foto disimpan langsung ke database.',
  aspectRatio = 'square',
  maxSizeMB = 5,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and convert image to Base64
  const processFile = (file: File) => {
    setError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Hanya berkas gambar (JPG, PNG, WebP) yang diperbolehkan.');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran berkas melebihi ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize and compress image
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to compressed JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          onChange(compressedDataUrl);
        } else {
          onChange(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 text-center ${
          isDragging
            ? 'border-navy-600 bg-navy-50/60'
            : value
            ? 'border-emerald-300 bg-emerald-50/20'
            : 'border-slate-200 hover:border-navy-400 bg-slate-50/60 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {value ? (
          <div className="relative group">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-gold-400 shadow-md">
              <img
                src={value}
                alt="Preview Foto"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                Ganti Foto
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-md transition"
              title="Hapus Foto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 rounded-2xl bg-navy-100 text-navy-800 flex items-center justify-center shadow-xs">
              <Camera className="w-6 h-6 text-navy-900" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-950">
                Klik untuk unggah foto jemaat
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                atau seret dan lepas (drag & drop) berkas foto ke sini
              </p>
            </div>
          </div>
        )}

        {helperText && !error && (
          <p className="text-[10px] text-slate-400 leading-tight">
            {helperText}
          </p>
        )}

        {error && (
          <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
      </div>
    </div>
  );
};

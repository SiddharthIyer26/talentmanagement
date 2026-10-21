import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Check,
  X,
  AlertCircle,
  Move,
  Image as ImageIcon
} from 'lucide-react';

interface ProfileImageUploadCropProps {
  currentImageUrl?: string;
  onImageCropped: (dataUrl: string) => void;
  onImageRemoved?: () => void;
  label?: string;
  disabled?: boolean;
}

export const ProfileImageUploadCrop: React.FC<ProfileImageUploadCropProps> = ({
  currentImageUrl,
  onImageCropped,
  onImageRemoved,
  label = 'Profile Photo',
  disabled = false
}) => {
  // Current active preview image (either existing image or newly cropped dataUrl)
  const [activePreview, setActivePreview] = useState<string>(currentImageUrl || '');

  // Cropping Modal / State
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pan & Zoom Transform State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Sync with prop changes if not actively cropping
  useEffect(() => {
    if (!isCropping) {
      setActivePreview(currentImageUrl || '');
    }
  }, [currentImageUrl, isCropping]);

  // Handle file selection & validation
  const handleFileSelect = (file: File) => {
    setValidationError(null);

    // Validate type (JPG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setValidationError('Unsupported file format. Please upload JPG, PNG, or WebP.');
      return;
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setValidationError('File size exceeds 10MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImageSrc(reader.result);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setIsCropping(true);
      }
    };
    reader.onerror = () => {
      setValidationError('Failed to read image file. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
    // Reset input so re-selecting same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  // Open existing image in crop mode
  const handleReCropExisting = () => {
    if (activePreview) {
      setRawImageSrc(activePreview);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsCropping(true);
    }
  };

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if already released
      }
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = 0.1;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + zoomStep, 3));
    } else {
      setZoom(prev => Math.max(prev - zoomStep, 1));
    }
  };

  // Reset Zoom & Pan
  const handleResetTransform = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Render & Apply Crop onto High-Res Offscreen Canvas (512x512)
  const handleApplyCrop = () => {
    if (!imageRef.current || !cropAreaRef.current) return;

    const img = imageRef.current;
    const cropBox = cropAreaRef.current.getBoundingClientRect();

    const outputSize = 512;
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate scaling ratio from displayed cropBox to output canvas
    const scaleRatio = outputSize / cropBox.width;

    // Center coordinates
    ctx.translate(outputSize / 2, outputSize / 2);

    // Apply pan and zoom
    ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio);
    ctx.scale(zoom, zoom);

    // Render image centered
    const displayedWidth = img.clientWidth * scaleRatio;
    const displayedHeight = img.clientHeight * scaleRatio;
    ctx.drawImage(img, -displayedWidth / 2, -displayedHeight / 2, displayedWidth, displayedHeight);

    // Export as high-quality WebP with JPEG fallback
    try {
      let croppedDataUrl = '';
      try {
        croppedDataUrl = canvas.toDataURL('image/webp', 0.88);
      } catch {
        croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      }

      setActivePreview(croppedDataUrl);
      setIsCropping(false);
      setRawImageSrc(null);
      onImageCropped(croppedDataUrl);
    } catch (exportErr: any) {
      console.error('[ProfileImageUploadCrop] Canvas export error:', exportErr);
      setValidationError('Could not crop this external image due to CORS restrictions. Please upload a new image file directly.');
    }
  };

  // Remove Image
  const handleRemoveImage = () => {
    setActivePreview('');
    setIsCropping(false);
    setRawImageSrc(null);
    onImageCropped('');
    if (onImageRemoved) {
      onImageRemoved();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-slate-300 font-semibold text-xs tracking-wide">
          {label}
        </label>
        {activePreview && !isCropping && !disabled && (
          <span className="text-[10px] text-cyan-400 font-mono">1:1 Square & Circular Display</span>
        )}
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* MODE 1: Interactive Cropper View */}
      {isCropping && rawImageSrc ? (
        <div className="bg-[#0b0f17] border border-cyan-500/40 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-tech-border pb-2.5">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-xs">Crop & Reposition Photo</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Move className="w-3 h-3 text-cyan-400" /> Drag to pan • Scroll to zoom
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Main Interactive Square Crop Viewport */}
            <div
              ref={cropAreaRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              className={`w-64 h-64 sm:w-72 sm:h-72 rounded-2xl border-2 border-dashed border-cyan-400/80 bg-black/60 relative overflow-hidden select-none touch-none flex items-center justify-center shadow-inner ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* Subtle Rule-of-Thirds Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-30">
                <div className="border-r border-b border-cyan-400/50" />
                <div className="border-r border-b border-cyan-400/50" />
                <div className="border-b border-cyan-400/50" />
                <div className="border-r border-b border-cyan-400/50" />
                <div className="border-r border-b border-cyan-400/50" />
                <div className="border-b border-cyan-400/50" />
                <div className="border-r border-cyan-400/50" />
                <div className="border-r border-cyan-400/50" />
                <div />
              </div>

              {/* The Image undergoing 2D transform */}
              <img
                ref={imageRef}
                src={rawImageSrc}
                alt="Crop Target"
                crossOrigin="anonymous"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                className="transition-transform duration-75 pointer-events-none"
              />
            </div>

            {/* Live Circular Avatar Preview */}
            <div className="flex flex-col items-center justify-center space-y-2 bg-tech-card border border-tech-border p-4 rounded-2xl w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Live Circle Preview
              </span>
              <div className="w-24 h-24 rounded-full border-2 border-cyan-400/90 overflow-hidden relative shadow-lg shadow-cyan-500/20 bg-black/50 flex items-center justify-center">
                <img
                  src={rawImageSrc}
                  alt="Live Circle Preview"
                  crossOrigin="anonymous"
                  style={{
                    transform: `translate(${pan.x * (96 / (cropAreaRef.current?.clientWidth || 288))}px, ${pan.y * (96 / (cropAreaRef.current?.clientHeight || 288))}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                  className="pointer-events-none"
                />
              </div>
              <span className="text-[9px] text-cyan-400 font-mono">Header & Sidebar View</span>
            </div>
          </div>

          {/* Zoom Slider & Controls */}
          <div className="bg-[#070a11] border border-tech-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(prev - 0.15, 1))}
                className="p-1.5 rounded-lg bg-tech-card hover:bg-slate-800 text-slate-300 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-cyan-400" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="w-28 sm:w-48 accent-cyan-400 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(prev + 0.15, 3))}
                className="p-1.5 rounded-lg bg-tech-card hover:bg-slate-800 text-slate-300 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-cyan-400" />
              </button>
              <span className="text-[11px] font-mono text-cyan-400 w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={handleResetTransform}
              className="px-2.5 py-1.5 rounded-lg bg-tech-card hover:bg-slate-800 border border-tech-border text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Center</span>
            </button>
          </div>

          {/* Action Confirm / Cancel */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-tech-border">
            <button
              type="button"
              onClick={() => {
                setIsCropping(false);
                setRawImageSrc(null);
              }}
              className="px-4 py-2 rounded-xl bg-tech-card hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      ) : (
        /* MODE 2: Normal Image Display & Action Card */
        <div className="bg-[#0b0f17] border border-tech-border rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 transition-all hover:border-tech-border/80">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#070a11] border-2 border-cyan-500/50 p-0.5 overflow-hidden shadow-lg shadow-cyan-500/10 flex items-center justify-center">
              {activePreview ? (
                <img
                  src={activePreview}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => {
                    // Fallback on broken URL
                    setActivePreview(`https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`);
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                  <span className="text-[9px] mt-1">No Image</span>
                </div>
              )}
            </div>

            {/* Circular preview mini badge */}
            <div
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border border-cyan-400 overflow-hidden shadow-md bg-black shrink-0"
              title="Circular Preview"
            >
              {activePreview && (
                <img src={activePreview} alt="Circle Preview" className="w-full h-full object-cover" />
              )}
            </div>
          </div>

          {/* Action Details & Buttons */}
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold text-slate-200">Influencer Profile Image</p>
              <p className="text-[11px] text-slate-400">
                Upload JPG, PNG or WebP (max 10MB). Image is automatically cropped square and synced to Supabase Cloud.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {/* Upload / Replace Button */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>{activePreview ? 'Replace Photo' : 'Upload Photo'}</span>
              </button>

              {/* Crop / Reposition Button (Available if active image exists) */}
              {activePreview && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleReCropExisting}
                  className="px-3 py-1.5 rounded-xl bg-tech-card hover:bg-slate-800 border border-tech-border text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Crop className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Crop / Reposition</span>
                </button>
              )}

              {/* Remove Photo */}
              {activePreview && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={handleRemoveImage}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium text-xs flex items-center gap-1 transition-colors"
                  title="Remove Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

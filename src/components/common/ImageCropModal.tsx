import React, { useState, useRef, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, Move, Check, X, Crop, RefreshCw } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCrop: (croppedBase64: string) => void;
  initialImageUrl?: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  onSaveCrop,
  initialImageUrl,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageUrl || null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialImageUrl) {
      setImageSrc(initialImageUrl);
    }
  }, [initialImageUrl]);

  // Load image onto canvas whenever imageSrc, zoom, or offset changes
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
  }, [imageSrc, zoom, offset]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasSize = 300;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    // Clear
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw background
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw scaled and offset image
    const scaledWidth = img.width * zoom * (canvasSize / Math.max(img.width, img.height));
    const scaledHeight = img.height * zoom * (canvasSize / Math.max(img.width, img.height));

    const drawX = (canvasSize - scaledWidth) / 2 + offset.x;
    const drawY = (canvasSize - scaledHeight) / 2 + offset.y;

    ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

    // Overlay crop mask (circular profile crop circle)
    ctx.fillStyle = 'rgba(11, 15, 23, 0.7)';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Cut out circle in center
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, 120, 0, Math.PI * 2);
    ctx.fill();

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    // Draw cyan border around crop circle
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, 120, 0, Math.PI * 2);
    ctx.stroke();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCropAndSave = () => {
    const img = imageRef.current;
    if (!img) return;

    // Render final cropped image to offscreen canvas
    const outputCanvas = document.createElement('canvas');
    const cropSize = 400; // High resolution output
    outputCanvas.width = cropSize;
    outputCanvas.height = cropSize;

    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    const displayCanvasSize = 300;
    const scaledWidth = img.width * zoom * (displayCanvasSize / Math.max(img.width, img.height));
    const scaledHeight = img.height * zoom * (displayCanvasSize / Math.max(img.width, img.height));

    const drawX = (displayCanvasSize - scaledWidth) / 2 + offset.x;
    const drawY = (displayCanvasSize - scaledHeight) / 2 + offset.y;

    // Scale factors to high-res cropSize
    const cropX = (displayCanvasSize / 2 - 120 - drawX) * (img.width / scaledWidth);
    const cropY = (displayCanvasSize / 2 - 120 - drawY) * (img.height / scaledHeight);
    const cropWidth = 240 * (img.width / scaledWidth);
    const cropHeight = 240 * (img.height / scaledHeight);

    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropSize, cropSize);

    const croppedBase64 = outputCanvas.toDataURL('image/png');
    onSaveCrop(croppedBase64);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-tech-card border border-tech-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
        <div className="flex items-center justify-between border-b border-tech-border pb-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Crop className="w-4 h-4 text-cyan-400" /> Upload & Position Profile Photo
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-[#0b0f17] hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Select Image From Device</span>
          </button>
        </div>

        {/* Canvas Cropper Workspace */}
        {imageSrc ? (
          <div className="space-y-4">
            <div className="relative flex justify-center bg-black/60 rounded-xl p-2 border border-tech-border overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="cursor-move rounded-lg border border-slate-700 shadow-inner"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur text-[10px] text-slate-300 p-1.5 rounded-lg text-center font-mono border border-slate-700 pointer-events-none">
                <Move className="w-3 h-3 inline mr-1 text-cyan-400" /> Click and drag image to position
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-3 bg-[#0b0f17] p-3 rounded-xl border border-tech-border">
              <ZoomOut className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-cyan-300 font-bold w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropAndSave}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Cropped Photo</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 space-y-2 border-2 border-dashed border-tech-border rounded-xl">
            <Upload className="w-8 h-8 mx-auto text-slate-600" />
            <p>Please select an image file from your device to open the crop editor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

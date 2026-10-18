'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCropperProps {
  /** The image file or URL to crop */
  image: File | string;
  /** Aspect ratio: 1 for square (profile), 16/9 for landscape (venture cover) */
  aspectRatio: number;
  /** Called when user confirms the crop */
  onCropComplete: (croppedImageBase64: string) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Output width in pixels */
  outputWidth?: number;
  /** Output quality 0-1 */
  quality?: number;
}

interface Position {
  x: number;
  y: number;
}

export function ImageCropper({
  image,
  aspectRatio,
  onCropComplete,
  onCancel,
  outputWidth = 400,
  quality = 0.9,
}: ImageCropperProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load image
  useEffect(() => {
    if (typeof image === 'string') {
      setImageUrl(image);
    } else {
      const url = URL.createObjectURL(image);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [image]);

  // Calculate initial scale to fit image in crop area
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = containerWidth / aspectRatio;

    // Calculate scale to cover the crop area
    const scaleX = containerWidth / img.naturalWidth;
    const scaleY = containerHeight / img.naturalHeight;
    const initialScale = Math.max(scaleX, scaleY);

    setScale(initialScale);
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

    // Center the image
    const scaledWidth = img.naturalWidth * initialScale;
    const scaledHeight = img.naturalHeight * initialScale;
    setPosition({
      x: (containerWidth - scaledWidth) / 2,
      y: (containerHeight - scaledHeight) / 2,
    });
  }, [aspectRatio]);

  // Mouse/touch handlers for dragging
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  }, [position]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = containerWidth / aspectRatio;
    const scaledWidth = imageSize.width * scale;
    const scaledHeight = imageSize.height * scale;

    // Calculate bounds
    const minX = containerWidth - scaledWidth;
    const minY = containerHeight - scaledHeight;
    const maxX = 0;
    const maxY = 0;

    const newX = Math.min(maxX, Math.max(minX, clientX - dragStart.x));
    const newY = Math.min(maxY, Math.max(minY, clientY - dragStart.y));

    setPosition({ x: newX, y: newY });
  }, [isDragging, dragStart, scale, imageSize, aspectRatio]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => handleDragEnd();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const onTouchEnd = () => handleDragEnd();

  // Zoom handler
  const handleZoom = useCallback((newScale: number) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = containerWidth / aspectRatio;

    // Ensure minimum scale covers crop area
    const minScaleX = containerWidth / imageSize.width;
    const minScaleY = containerHeight / imageSize.height;
    const minScale = Math.max(minScaleX, minScaleY);
    const maxScale = minScale * 4;

    const clampedScale = Math.min(maxScale, Math.max(minScale, newScale));

    // Adjust position to keep image covering crop area
    const scaledWidth = imageSize.width * clampedScale;
    const scaledHeight = imageSize.height * clampedScale;

    const minX = containerWidth - scaledWidth;
    const minY = containerHeight - scaledHeight;

    setScale(clampedScale);
    setPosition(prev => ({
      x: Math.min(0, Math.max(minX, prev.x)),
      y: Math.min(0, Math.max(minY, prev.y)),
    }));
  }, [imageSize, aspectRatio]);

  // Generate cropped image
  const handleCrop = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = containerWidth / aspectRatio;

    // Create canvas
    const outputHeight = outputWidth / aspectRatio;
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate source rectangle in image coordinates
    const sourceX = -position.x / scale;
    const sourceY = -position.y / scale;
    const sourceWidth = containerWidth / scale;
    const sourceHeight = containerHeight / scale;

    // Draw cropped image
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    // Convert to base64
    const base64 = canvas.toDataURL('image/jpeg', quality);
    onCropComplete(base64);
  }, [position, scale, aspectRatio, outputWidth, quality, onCropComplete]);

  const containerHeight = containerRef.current
    ? containerRef.current.clientWidth / aspectRatio
    : 300 / aspectRatio;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-page rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-rule flex items-center justify-between">
          <h3 className="font-semibold text-[15px]">Adjust Image</h3>
          <button
            onClick={onCancel}
            className="text-ink-3 hover:text-ink p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="p-4 bg-ink/5">
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-black cursor-move mx-auto"
            style={{
              width: '100%',
              maxWidth: 400,
              height: containerHeight || 300 / aspectRatio,
              borderRadius: aspectRatio === 1 ? '50%' : '12px',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                className="absolute select-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: 'top left',
                  maxWidth: 'none',
                }}
                draggable={false}
              />
            )}

            {/* Drag hint overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm text-white text-[11px] px-2 py-1 rounded-full opacity-60">
                Drag to reposition
              </div>
            </div>
          </div>
        </div>

        {/* Zoom slider */}
        <div className="px-4 py-3 border-t border-rule">
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35M8 11h6" />
            </svg>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-rule rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:bg-go
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-md"
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35M8 11h6M11 8v6" />
            </svg>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-rule flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[13px] font-medium text-ink-2 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="px-4 py-2 bg-go text-white text-[13px] font-semibold rounded-lg hover:bg-go-deep transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { GalleryViewer } from './GalleryViewer';

interface VentureGalleryProps {
  poster: string | null;
  gallery: string[];
  ventureName: string;
  siteUrl?: string;
}

export function VentureGallery({ poster, gallery, ventureName }: VentureGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Combine poster and gallery into a single array
  const allImages = poster ? [poster, ...gallery] : gallery;

  // No images at all
  if (allImages.length === 0) {
    return null;
  }

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const mainImage = allImages[0];
  const imageCount = allImages.length;

  // Show grid layout only when 4+ images
  const showGrid = imageCount >= 4;

  // For 2-3 images, show +X overlay on main image
  const showMainOverlay = imageCount > 1 && imageCount < 4;
  const mainOverlayCount = imageCount - 1;

  // Right column images for grid layout (indices 1, 2, 3)
  const rightImages = showGrid ? [
    allImages[1],
    allImages[2],
    allImages[3],
  ] : [];

  // Remaining count for grid layout (images beyond the 4 shown)
  const gridRemainingCount = Math.max(0, imageCount - 4);

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className="flex h-[280px]">
          {/* Main Image */}
          <button
            onClick={() => openViewer(0)}
            className={`relative bg-soft overflow-hidden group cursor-pointer ${
              showGrid ? 'w-[70%]' : 'w-full'
            }`}
          >
            <img
              src={mainImage}
              alt={`${ventureName} cover`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-ink text-[13px] font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                {imageCount > 1 ? 'View Gallery' : 'View Image'}
              </span>
            </div>

            {/* +X overlay for 2-3 images */}
            {showMainOverlay && (
              <div className="absolute bottom-3 right-3 bg-go-deep text-white text-[14px] font-semibold px-3 py-1.5 rounded-lg">
                +{mainOverlayCount}
              </div>
            )}
          </button>

          {/* Right Column - only for 4+ images */}
          {showGrid && (
            <div className="w-[30%] flex flex-col">
              {rightImages.map((img, idx) => {
                const isBottom = idx === 2;
                const imageIndex = idx + 1;

                return (
                  <button
                    key={idx}
                    onClick={() => openViewer(imageIndex)}
                    className="relative flex-1 bg-soft overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={img}
                      alt={`${ventureName} photo ${imageIndex + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                    {/* +X overlay on bottom image */}
                    {isBottom && (
                      <div className="absolute bottom-2 right-2 bg-go-deep text-white text-[14px] font-semibold px-3 py-1 rounded-lg">
                        +{gridRemainingCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="flex h-[200px]">
          {/* Main Image */}
          <button
            onClick={() => openViewer(0)}
            className={`relative bg-soft overflow-hidden ${
              showGrid ? 'w-[70%]' : 'w-full'
            }`}
          >
            <img
              src={mainImage}
              alt={`${ventureName} cover`}
              className="w-full h-full object-cover"
            />

            {/* +X overlay for 2-3 images */}
            {showMainOverlay && (
              <div className="absolute bottom-2 right-2 bg-go-deep text-white text-[12px] font-semibold px-2 py-1 rounded-lg">
                +{mainOverlayCount}
              </div>
            )}
          </button>

          {/* Right Column - only for 4+ images */}
          {showGrid && (
            <div className="w-[30%] flex flex-col">
              {rightImages.map((img, idx) => {
                const isBottom = idx === 2;
                const imageIndex = idx + 1;

                return (
                  <button
                    key={idx}
                    onClick={() => openViewer(imageIndex)}
                    className="relative flex-1 bg-soft overflow-hidden"
                  >
                    <img
                      src={img}
                      alt={`${ventureName} photo ${imageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* +X overlay on bottom image */}
                    {isBottom && (
                      <div className="absolute bottom-1 right-1 bg-go-deep text-white text-[11px] font-semibold px-2 py-0.5 rounded">
                        +{gridRemainingCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Gallery Viewer Modal */}
      {viewerOpen && (
        <GalleryViewer
          images={allImages}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

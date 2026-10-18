'use client';

import { useState, useCallback, useRef } from 'react';
import { ImageCropper } from './ImageCropper';

interface GalleryEditorProps {
  poster: string | null;
  gallery: string[];
  onUpdate: (poster: string | null, gallery: string[]) => void;
  maxImages?: number;
}

export function GalleryEditor({
  poster,
  gallery,
  onUpdate,
  maxImages = 10,
}: GalleryEditorProps) {
  const [cropperImage, setCropperImage] = useState<File | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Combine poster and gallery into a single array for display
  const allImages = poster ? [poster, ...gallery] : gallery;
  const canAddMore = allImages.length < maxImages;

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    setCropperImage(file);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  // Handle cropped image
  const handleCropComplete = useCallback((croppedBase64: string) => {
    setCropperImage(null);
    setIsUploading(true);

    // Add to the end of the gallery
    if (!poster) {
      // First image becomes the poster
      onUpdate(croppedBase64, gallery);
    } else {
      // Add to gallery
      onUpdate(poster, [...gallery, croppedBase64]);
    }

    setIsUploading(false);
  }, [poster, gallery, onUpdate]);

  // Handle image removal
  const handleRemove = (index: number) => {
    if (index === 0) {
      // Removing poster - promote first gallery image to poster
      if (gallery.length > 0) {
        const [newPoster, ...restGallery] = gallery;
        onUpdate(newPoster, restGallery);
      } else {
        onUpdate(null, []);
      }
    } else {
      // Removing from gallery
      const newGallery = [...gallery];
      newGallery.splice(index - 1, 1);
      onUpdate(poster, newGallery);
    }
  };

  // Handle drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder the images
    const newAllImages = [...allImages];
    const [removed] = newAllImages.splice(draggedIndex, 1);
    newAllImages.splice(dragOverIndex, 0, removed);

    // Split back into poster and gallery
    const [newPoster, ...newGallery] = newAllImages;
    onUpdate(newPoster || null, newGallery);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div>
      <label className="block text-[13px] font-medium mb-2">
        Photos
        <span className="text-ink-3 font-normal ml-2">
          {allImages.length}/{maxImages} · First image is the main cover
        </span>
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {/* Existing images */}
        {allImages.map((img, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onDragLeave={() => setDragOverIndex(null)}
            className={`relative aspect-[16/9] rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing border-2 transition-all ${
              dragOverIndex === idx
                ? 'border-go border-dashed'
                : draggedIndex === idx
                ? 'opacity-50 border-transparent'
                : 'border-transparent hover:border-rule'
            }`}
          >
            <img
              src={img}
              alt={idx === 0 ? 'Main cover' : `Photo ${idx + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />

            {/* Main badge */}
            {idx === 0 && (
              <div className="absolute top-1 left-1 bg-go text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                Main
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 p-1 bg-dead text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-dead/90"
              title="Remove image"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Drag handle indicator */}
            <div className="absolute bottom-1 left-1 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
              </svg>
            </div>
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <label className={`aspect-[16/9] rounded-lg border-2 border-dashed border-rule flex flex-col items-center justify-center gap-1 transition-colors ${isUploading ? 'bg-soft' : 'hover:border-ink/30 hover:bg-soft/50 cursor-pointer'}`}>
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-go border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-[11px] text-ink-3 font-medium">Add photo</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading || !canAddMore}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-ink-3 mt-2">
        Drag to reorder. The first image appears as the main cover on your venture page.
      </p>

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          aspectRatio={16 / 9}
          outputWidth={1200}
          quality={0.85}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
        />
      )}
    </div>
  );
}

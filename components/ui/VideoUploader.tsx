'use client';

import { useState, useRef } from 'react';
import * as UpChunk from '@mux/upchunk';

interface VideoUploaderProps {
  questionSlug: string;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
  onUploadError?: (error: string) => void;
}

export function VideoUploader({
  questionSlug,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    // Validate file size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
      setError('Video must be under 100MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    onUploadStart?.();

    try {
      // Get signed upload URL from our API
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionSlug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const { uploadUrl } = await res.json();

      // Use UpChunk for resumable upload directly to Mux
      const upload = UpChunk.createUpload({
        endpoint: uploadUrl,
        file,
        chunkSize: 5120, // 5MB chunks
      });

      upload.on('error', (err) => {
        setError(err.detail || 'Upload failed');
        setUploading(false);
        onUploadError?.(err.detail || 'Upload failed');
      });

      upload.on('progress', (progressEvent) => {
        setProgress(Math.round(progressEvent.detail));
      });

      upload.on('success', () => {
        setUploading(false);
        setProgress(100);
        onUploadComplete?.();
        // Reset input
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setUploading(false);
      onUploadError?.(message);
    }
  };

  return (
    <div className="border-2 border-dashed border-rule rounded-xl p-6 text-center">
      {uploading ? (
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-go-tint flex items-center justify-center">
            <svg
              className="w-6 h-6 text-go-deep animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-medium">Uploading...</p>
            <p className="text-[13px] text-ink-2">{progress}%</p>
          </div>
          <div className="w-full max-w-[200px] mx-auto bg-soft rounded-full h-2">
            <div
              className="bg-go h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <label className="cursor-pointer block">
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-12 h-12 mx-auto rounded-full bg-soft flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-ink-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-[14px] font-medium mb-1">Click to upload video</p>
          <p className="text-[13px] text-ink-2">
            MP4, MOV, or WebM · Max 100MB · Under 60 seconds
          </p>
        </label>
      )}

      {error && (
        <p className="mt-4 text-[13px] text-dead">{error}</p>
      )}
    </div>
  );
}

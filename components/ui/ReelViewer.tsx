'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Pitch {
  slug: string;
  name: string;
  pitch: string;
  brand: string;
  poster?: string;
  videoUrl?: string;
  founder: {
    name: string;
    slug: string;
    avatar?: string;
  };
  counters: {
    followers: number;
    likes?: number;
  };
}

interface ReelViewerProps {
  pitches: Pitch[];
  initialIndex: number;
  onClose: () => void;
}

export function ReelViewer({ pitches, initialIndex, onClose }: ReelViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  const currentPitch = pitches[currentIndex];

  // Navigate to next/previous pitch
  const goNext = useCallback(() => {
    if (currentIndex < pitches.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, pitches.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goNext, goPrev]);

  // Handle touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diff = touchStartY.current - touchEndY.current;
    const threshold = 50;

    if (diff > threshold) {
      // Swiped up - go to next
      goNext();
    } else if (diff < -threshold) {
      // Swiped down - go to previous
      goPrev();
    }
  };

  // Handle mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      goNext();
    } else if (e.deltaY < 0) {
      goPrev();
    }
  }, [goNext, goPrev]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {pitches.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Main content area - phone-shaped container */}
      <div className="relative w-full h-full sm:w-[400px] sm:h-[85vh] sm:max-h-[800px] sm:rounded-2xl overflow-hidden bg-ink">
        {/* Video/Coming Soon placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          {currentPitch.videoUrl ? (
            <video
              key={currentPitch.slug}
              src={currentPitch.videoUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              playsInline
              muted
            />
          ) : (
            /* Coming Soon placeholder */
            <div className="w-full h-full bg-gradient-to-b from-ink via-[#1a1a1a] to-ink flex flex-col items-center justify-center text-white">
              {currentPitch.poster ? (
                <Image
                  src={currentPitch.poster}
                  alt={currentPitch.name}
                  fill
                  className="object-cover opacity-30"
                />
              ) : null}
              <div className="relative z-10 flex flex-col items-center">
                {/* Film reel icon */}
                <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center mb-4">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="opacity-60">
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                    <circle cx="8" cy="8" r="2" />
                    <circle cx="16" cy="8" r="2" />
                    <circle cx="8" cy="16" r="2" />
                    <circle cx="16" cy="16" r="2" />
                    <rect x="9" y="9" width="6" height="6" />
                  </svg>
                </div>
                <span className="text-lg font-semibold tracking-wide">Coming Soon</span>
                <span className="text-sm text-white/60 mt-1">Video pitch uploading shortly</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom overlay with venture info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          {/* Venture name and pitch */}
          <Link href={`/v/${currentPitch.slug}`} onClick={onClose}>
            <h3 className="text-white font-bold text-lg">{currentPitch.name}</h3>
            <p className="text-white/80 text-sm mt-1 line-clamp-3">{currentPitch.pitch}</p>
          </Link>

          {/* Founder info */}
          <div className="flex items-center gap-2 mt-3">
            {currentPitch.founder.avatar ? (
              <Image
                src={currentPitch.founder.avatar}
                alt={currentPitch.founder.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: currentPitch.brand }}
              >
                {currentPitch.founder.name.split(' ').map(w => w[0]).join('')}
              </div>
            )}
            <span className="text-white/90 text-sm">{currentPitch.founder.name}</span>
          </div>
        </div>

        {/* Right side action buttons (TikTok style) */}
        <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4">
          {/* Like */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <span className="text-white text-xs font-medium">{currentPitch.counters.likes || currentPitch.counters.followers}</span>
          </button>

          {/* View venture */}
          <Link href={`/v/${currentPitch.slug}`} onClick={onClose} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
            <span className="text-white text-xs">View</span>
          </Link>

          {/* Follow */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-go flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium">Follow</span>
          </button>
        </div>

        {/* Navigation hints */}
        {currentIndex > 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 text-white/40 text-xs flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            Swipe up for previous
          </div>
        )}
        {currentIndex < pitches.length - 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white/40 text-xs flex items-center gap-1 animate-bounce">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        )}
      </div>

      {/* Desktop navigation arrows */}
      <div className="hidden sm:block">
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {currentIndex < pitches.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

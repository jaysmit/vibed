'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ReelViewer } from '@/components/ui/ReelViewer';
import type { Industry } from '@/lib/supabase/types';

interface Pitch {
  slug: string;
  name: string;
  pitch: string;
  brand: string;
  poster?: string;
  videoUrl?: string;
  rung: string;
  industry?: Industry;
  status: string;
  founder: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
  };
  counters: {
    followers: number;
    likes?: number;
    clips: number;
    weekNumber: number;
  };
}

const RUNG_SHORT: Record<string, string> = {
  idea: 'Idea',
  building: 'Building',
  live: 'Live',
  first: '$1',
  growing: 'Growing',
  now: 'Now',
};

export function ElevatorPitchesSection() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasLoaded = useRef(false);

  // Fetch pitches
  const loadPitches = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        pillar: 'recent',
        limit: '6',
        offset: String(offset),
      });

      const res = await fetch(`/api/ventures/feed?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();

      if (data.ventures.length > 0) {
        setPitches((prev) => {
          const existingSlugs = new Set(prev.map((v) => v.slug));
          const newPitches = data.ventures.filter((v: Pitch) => !existingSlugs.has(v.slug));
          return [...prev, ...newPitches];
        });
        setOffset((prev) => prev + data.ventures.length);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading pitches:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset]);

  // Load on mount via intersection observer
  useEffect(() => {
    if (hasLoaded.current) return;

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasLoaded.current) {
          hasLoaded.current = true;
          loadPitches();
        }
      },
      { rootMargin: '100px', threshold: 0 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [loadPitches]);

  // Horizontal scroll detection
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollRight = container.scrollWidth - container.scrollLeft - container.clientWidth;
      if (scrollRight < 200 && hasMore && !isLoading) {
        loadPitches();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadPitches]);

  // Convert vertical wheel to horizontal scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 0) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <section ref={sectionRef} className="py-3 sm:py-5 border-t border-rule">
        <div className="flex items-baseline justify-between mb-2 sm:mb-4">
          <div>
            <h2 className="text-[16px] sm:text-[22px] font-extrabold font-display">Trending Elevator Pitches</h2>
            <p className="text-[11px] sm:text-[13px] text-ink-3 mt-0.5">The best pitches right now</p>
          </div>
          <Link href="/discover" className="text-[11px] sm:text-[13px] text-go-deep hover:underline flex-shrink-0">
            See all &rarr;
          </Link>
        </div>

        <div className="-mx-4 px-4 sm:-mx-6 sm:px-6">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide"
          >
            <div className="flex gap-2.5 sm:gap-4" style={{ width: 'max-content' }}>
              {pitches.map((pitch, index) => (
                <div
                  key={pitch.slug}
                  className="w-[160px] sm:w-[200px] flex-shrink-0 cursor-pointer"
                  onClick={() => openViewer(index)}
                >
                  <PitchCardCompact pitch={pitch} />
                </div>
              ))}

              {/* Load more button */}
              <div className="w-[160px] sm:w-[200px] flex-shrink-0 flex items-center justify-center">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2 text-ink-3">
                    <div className="w-6 h-6 border-2 border-rule border-t-go rounded-full animate-spin" />
                    <span className="text-[11px] sm:text-[13px]">Loading...</span>
                  </div>
                ) : hasMore ? (
                  <button
                    onClick={loadPitches}
                    className="text-[12px] sm:text-[13px] text-go-deep hover:underline px-4 py-8"
                  >
                    {pitches.length === 0 ? 'Load content' : 'Load more'}
                  </button>
                ) : pitches.length > 0 ? (
                  <span className="text-[11px] sm:text-[13px] text-ink-3 px-4">That&apos;s all!</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {pitches.length === 0 && !hasMore && (
          <p className="text-ink-3 text-center py-6 sm:py-10">No pitches yet. Be the first!</p>
        )}
      </section>

      {/* TikTok-style reel viewer */}
      {viewerOpen && (
        <ReelViewer
          pitches={pitches}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

// Compact pitch card for this section
function PitchCardCompact({ pitch }: { pitch: Pitch }) {
  const isDead = pitch.status === 'closed';

  return (
    <div className="bg-page border border-rule rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.045)] transition-all duration-300 ease-out hover:translate-y-[-5px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.11)]">
      {/* Video area - square like Instagram */}
      <div className="aspect-square relative overflow-hidden bg-soft group">
        {/* Poster/thumbnail */}
        {pitch.poster ? (
          <Image
            src={pitch.poster}
            alt={pitch.name}
            fill
            sizes="(max-width: 680px) 50vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-white">
            <div
              className="absolute top-0 right-0 w-1/2 h-1/2 opacity-10"
              style={{
                background: `radial-gradient(circle at top right, ${pitch.brand}, transparent 70%)`,
              }}
            />
          </div>
        )}

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="ml-1 drop-shadow-md">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* One-liner pitch overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
          <div className="h-[36px]">
            <p className="text-[12px] sm:text-[13px] text-white font-medium line-clamp-2 leading-snug">
              {pitch.pitch}
            </p>
          </div>
        </div>

        {/* Top right badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#B03A28">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-[9px] font-bold text-ink">{pitch.counters.likes || pitch.counters.followers}</span>
          </div>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${
            isDead ? 'bg-dead/80 text-white' : 'bg-white/90 text-ink'
          }`}>
            {isDead ? 'Closed' : RUNG_SHORT[pitch.rung] || pitch.rung}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {pitch.founder.avatar ? (
              <Image
                src={pitch.founder.avatar}
                alt={pitch.founder.name}
                width={24}
                height={24}
                style={{ width: 24, height: 24, minWidth: 24, maxWidth: 24 }}
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span
                className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-semibold text-white flex-shrink-0"
                style={{ background: pitch.brand, width: 24, height: 24, minWidth: 24, maxWidth: 24 }}
              >
                {pitch.founder.name.split(' ').map((w) => w[0]).join('')}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] sm:text-[14px] font-bold truncate">{pitch.name}</h3>
              </div>
              <div className="text-[10px] sm:text-[11px] text-ink-3 truncate">
                {pitch.founder.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

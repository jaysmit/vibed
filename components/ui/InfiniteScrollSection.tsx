'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { PitchCard } from './PitchCard';
import { VentureCard } from './VentureCard';
import type { Pillar, Industry } from '@/lib/supabase/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Venture = {
  slug: string;
  name: string;
  pitch: string;
  tagline?: string | null;
  brand: string;
  glyph?: string;
  rung: string;
  industry?: Industry;
  status: string;
  links?: { poster?: string };
  counters: {
    followers: number;
    clips: number;
    weekNumber: number;
    streakWeeks: number;
    likes?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  founder: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    headline?: string;
  };
  promise?: {
    text: string;
    dueAt: string | Date;
    createdAt: string | Date;
  } | null;
  promiseHistory?: Array<{
    kept: boolean;
    text?: string;
    dueAt?: string | Date;
    resolvedAt?: string | Date;
    note?: string;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

interface InfiniteScrollSectionProps {
  title: string;
  description: string;
  linkHref: string;
  pillar: Exclude<Pillar, 'featured'> | 'trending' | 'recent';
  initialVentures: Venture[];
  useFullCards?: boolean;
}

export function InfiniteScrollSection({
  title,
  description,
  linkHref,
  pillar,
  initialVentures,
  useFullCards = false,
}: InfiniteScrollSectionProps) {
  const [ventures, setVentures] = useState<Venture[]>(initialVentures);
  const [isLoading, setIsLoading] = useState(false);
  // Assume there's more to load (user clicks "Load more" to fetch)
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [offset, setOffset] = useState<number>(initialVentures.length); // For trending pagination
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch more ventures
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    // DEBUG: Track load time for each section
    const debugLabel = `[${pillar}] loadMore`;
    console.time(debugLabel);
    console.log(`[${pillar}] Starting fetch... offset=${offset}, cursor=${cursor}`);

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        pillar,
        limit: '4',
      });
      // Use offset for trending, cursor for others
      if (pillar === 'trending') {
        params.set('offset', String(offset));
      } else if (cursor) {
        params.set('cursor', cursor);
      }

      const fetchStart = performance.now();
      const res = await fetch(`/api/ventures/feed?${params}`);
      const fetchEnd = performance.now();
      console.log(`[${pillar}] Fetch took ${(fetchEnd - fetchStart).toFixed(0)}ms`);

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      console.log(`[${pillar}] Got ${data.ventures.length} ventures, hasMore=${data.hasMore}`);

      if (data.ventures.length > 0) {
        // Deduplicate by slug to prevent duplicates
        setVentures((prev) => {
          const existingSlugs = new Set(prev.map((v) => v.slug));
          const newVentures = data.ventures.filter((v: Venture) => !existingSlugs.has(v.slug));
          if (newVentures.length === 0) {
            // All returned ventures are duplicates, stop loading
            console.log(`[${pillar}] All duplicates, stopping`);
            setHasMore(false);
            return prev;
          }
          console.log(`[${pillar}] Added ${newVentures.length} new ventures`);
          return [...prev, ...newVentures];
        });
        setCursor(data.nextCursor);
        if (data.nextOffset !== null && data.nextOffset !== undefined) {
          setOffset(data.nextOffset);
        }
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error(`[${pillar}] Error loading more ventures:`, error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      console.timeEnd(debugLabel);
    }
  }, [pillar, cursor, offset, isLoading, hasMore]);

  // Set initial cursor from initial ventures (not needed for trending - uses offset)
  useEffect(() => {
    if (initialVentures.length > 0 && pillar !== 'trending') {
      // For other pillars, cursor will be set from API response
      // Initial cursor is not set here since we don't have published_at in props
    }
  }, [initialVentures, pillar]);

  // Horizontal scroll detection - load more when user scrolls near the end
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if user has scrolled near the end (within 200px)
      const scrollRight = container.scrollWidth - container.scrollLeft - container.clientWidth;
      if (scrollRight < 200 && hasMore && !isLoading) {
        console.log(`[${pillar}] Scroll triggered load (${scrollRight}px from end)`);
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadMore, pillar]);

  // Convert vertical mouse wheel to horizontal scroll when hovering
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only intercept if there's vertical scroll and container can scroll horizontally
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

  return (
    <section className="py-3 sm:py-5 border-t border-rule">
      <div className="flex items-baseline justify-between mb-2 sm:mb-4">
        <div>
          <h2 className="text-[16px] sm:text-[22px] font-extrabold font-display">{title}</h2>
          <p className="text-[11px] sm:text-[13px] text-ink-3 mt-0.5">{description}</p>
        </div>
        <Link href={linkHref} className="text-[11px] sm:text-[13px] text-go-deep hover:underline flex-shrink-0">
          See all &rarr;
        </Link>
      </div>

      {/* Horizontal scroll with infinite loading - all screen sizes */}
      <div className="-mx-4 px-4 sm:-mx-6 sm:px-6">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
        >
          <div className="flex gap-2.5 sm:gap-4" style={{ width: 'max-content' }}>
            {ventures.map((v, index) =>
              useFullCards ? (
                <div key={v.slug} className="w-[220px] sm:w-[300px] flex-shrink-0">
                  <VentureCard
                    slug={v.slug}
                    name={v.name}
                    pitch={v.pitch}
                    tagline={v.tagline}
                    brand={v.brand}
                    poster={v.links?.poster}
                    rung={v.rung as 'idea' | 'building' | 'live' | 'first' | 'growing' | 'now'}
                    industry={v.industry}
                    status={v.status as 'draft' | 'live' | 'graduated' | 'closed'}
                    founder={v.founder}
                    promise={v.promise ? {
                      text: v.promise.text,
                      dueAt: new Date(v.promise.dueAt),
                      createdAt: new Date(v.promise.createdAt),
                    } : null}
                    promiseHistory={v.promiseHistory}
                    counters={v.counters}
                    priority={index < 2} // LCP optimization: first 2 cards load immediately
                  />
                </div>
              ) : (
                <div key={v.slug} className="w-[160px] sm:w-[200px] flex-shrink-0">
                  <PitchCard
                    slug={v.slug}
                    name={v.name}
                    pitch={v.pitch}
                    brand={v.brand}
                    poster={v.links?.poster}
                    rung={v.rung as 'idea' | 'building' | 'live' | 'first' | 'growing' | 'now'}
                    industry={v.industry}
                    status={v.status as 'draft' | 'live' | 'graduated' | 'closed'}
                    founder={v.founder}
                    counters={v.counters}
                    priority={index < 2} // LCP optimization: first 2 cards load immediately
                  />
                </div>
              )
            )}

            {/* Load more button - manual only, no auto-loading */}
            <div
              ref={loadMoreRef}
              className={`flex-shrink-0 flex items-center justify-center ${useFullCards ? 'w-[220px] sm:w-[300px]' : 'w-[160px] sm:w-[200px]'}`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-2 text-ink-3">
                  <div className="w-6 h-6 border-2 border-rule border-t-go rounded-full animate-spin" />
                  <span className="text-[11px] sm:text-[13px]">Loading...</span>
                </div>
              ) : hasMore ? (
                <button
                  onClick={loadMore}
                  className="text-[12px] sm:text-[13px] text-go-deep hover:underline px-4 py-8"
                >
                  {ventures.length === 0 ? 'Load content' : 'Load more'}
                </button>
              ) : ventures.length > 0 ? (
                <span className="text-[11px] sm:text-[13px] text-ink-3 px-4">That&apos;s all!</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {ventures.length === 0 && !hasMore && (
        <p className="text-ink-3 text-center py-6 sm:py-10">No content yet. Be the first!</p>
      )}
    </section>
  );
}

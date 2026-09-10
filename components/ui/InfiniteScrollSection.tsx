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
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch more ventures
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        pillar,
        limit: '6',
      });
      if (cursor) {
        params.set('cursor', cursor);
      }

      const res = await fetch(`/api/ventures/feed?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();

      if (data.ventures.length > 0) {
        setVentures((prev) => [...prev, ...data.ventures]);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more ventures:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [pillar, cursor, isLoading, hasMore]);

  // Set initial cursor from initial ventures
  useEffect(() => {
    if (initialVentures.length > 0) {
      const last = initialVentures[initialVentures.length - 1];
      if (pillar === 'trending') {
        setCursor(String(last.counters?.followers || 0));
      }
      // For other pillars, we need published_at which isn't in the data
      // The API will handle it
    }
  }, [initialVentures, pillar]);

  // Intersection Observer for infinite scroll (horizontal scroll on mobile)
  useEffect(() => {
    const container = scrollContainerRef.current;
    const loadMoreElement = loadMoreRef.current;
    if (!container || !loadMoreElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      {
        root: container,
        rootMargin: '100px', // Start loading before reaching the end
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoading]);

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
                    brand={v.brand}
                    poster={v.links?.poster}
                    rung={v.rung as 'idea' | 'building' | 'live' | 'first' | 'growing' | 'alumni'}
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
                    rung={v.rung as 'idea' | 'building' | 'live' | 'first' | 'growing' | 'alumni'}
                    industry={v.industry}
                    status={v.status as 'draft' | 'live' | 'graduated' | 'closed'}
                    founder={v.founder}
                    counters={v.counters}
                    priority={index < 2} // LCP optimization: first 2 cards load immediately
                  />
                </div>
              )
            )}

            {/* Load more trigger */}
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
                  Load more
                </button>
              ) : ventures.length > 4 ? (
                <span className="text-[11px] sm:text-[13px] text-ink-3 px-4">That&apos;s all!</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {ventures.length === 0 && (
        <p className="text-ink-3 text-center py-6 sm:py-10">No content yet. Be the first!</p>
      )}
    </section>
  );
}

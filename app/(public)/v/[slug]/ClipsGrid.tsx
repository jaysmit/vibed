'use client';

import { useState } from 'react';
import { VideoPlayer } from '@/components/ui';

interface Clip {
  _id: string;
  playback_id: string | null;
  title: string;
  thumbTime?: number;
  segment_key?: string;
  counters?: {
    views: number;
    likes: number;
    comments: number;
  };
  created_at: string;
}

interface ClipsGridProps {
  clips: Clip[];
  ventureName: string;
}

type SortOption = 'recent' | 'popular' | 'oldest';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'popular', label: 'Most Popular' },
  { key: 'oldest', label: 'Oldest First' },
];

const SEGMENT_LABELS: Record<string, string> = {
  pitch: 'Pitch',
  spark: 'Spark',
  validation: 'Validation',
  proto: 'Prototype',
  build: 'Development',
  beta: 'Beta',
  gtm: 'Go To Market',
  launch: 'Launch',
  first: 'First Sale',
  channel: 'Marketing',
  trouble: 'Challenges',
  money: 'Funding',
  team: 'Team',
  scale: 'Scale',
  next: 'Next',
};

export function ClipsGrid({ clips, ventureName }: ClipsGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique segments from clips
  const segments = [...new Set(clips.map((c) => c.segment_key).filter(Boolean))];

  // Filter clips
  let filteredClips = clips;
  if (filterSegment !== 'all') {
    filteredClips = clips.filter((c) => c.segment_key === filterSegment);
  }

  // Sort clips
  const sortedClips = [...filteredClips].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.counters?.views || 0) - (a.counters?.views || 0);
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div>
      {/* Sort and Filter controls */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-ink-3">{clips.length} clips</span>
          {filterSegment !== 'all' && (
            <span className="text-[11px] bg-heat-tint text-heat px-2 py-0.5 rounded-full">
              {SEGMENT_LABELS[filterSegment] || filterSegment}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          {segments.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-rule rounded-lg hover:border-ink/30 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filter
                {filterSegment !== 'all' && (
                  <span className="w-1.5 h-1.5 bg-heat rounded-full" />
                )}
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-1 bg-page border border-rule rounded-lg shadow-lg py-1 z-20 min-w-[140px]">
                  <button
                    onClick={() => {
                      setFilterSegment('all');
                      setShowFilters(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-[12px] hover:bg-soft ${
                      filterSegment === 'all' ? 'font-semibold text-ink' : 'text-ink-2'
                    }`}
                  >
                    All Clips
                  </button>
                  {segments.map((seg) => (
                    <button
                      key={seg}
                      onClick={() => {
                        setFilterSegment(seg!);
                        setShowFilters(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-[12px] hover:bg-soft ${
                        filterSegment === seg ? 'font-semibold text-ink' : 'text-ink-2'
                      }`}
                    >
                      {SEGMENT_LABELS[seg!] || seg}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-[12px] font-medium border border-rule rounded-lg bg-page cursor-pointer hover:border-ink/30 transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clips grid */}
      {sortedClips.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {sortedClips.map((clip) => (
            <div
              key={clip._id}
              className="aspect-square bg-soft rounded-sm sm:rounded-lg overflow-hidden relative group cursor-pointer"
            >
              {clip.playback_id ? (
                <>
                  <VideoPlayer
                    playbackId={clip.playback_id}
                    title={clip.title}
                    thumbTime={clip.thumbTime}
                  />
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  {/* Stats overlay */}
                  <div className="absolute bottom-1 left-1 flex items-center gap-2 text-white text-[10px] sm:text-[11px] font-semibold drop-shadow-lg">
                    <span className="flex items-center gap-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      {clip.counters?.views || 0}
                    </span>
                    {(clip.counters?.likes || 0) > 0 && (
                      <span className="flex items-center gap-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        {clip.counters?.likes}
                      </span>
                    )}
                  </div>
                  {/* Segment label */}
                  {clip.segment_key && (
                    <div className="absolute top-1 right-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {SEGMENT_LABELS[clip.segment_key] || clip.segment_key}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-ink/5">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-ink-3"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[14px] text-ink-3">
            {filterSegment !== 'all' ? 'No clips in this category' : 'No clips yet'}
          </p>
          {filterSegment !== 'all' && (
            <button
              onClick={() => setFilterSegment('all')}
              className="mt-2 text-[12px] text-go-deep hover:underline"
            >
              Show all clips
            </button>
          )}
        </div>
      )}

      {/* Placeholders if less than 6 clips */}
      {sortedClips.length > 0 && sortedClips.length < 6 && filterSegment === 'all' && (
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-1 sm:mt-2">
          {Array.from({ length: 6 - sortedClips.length }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="aspect-square bg-soft rounded-sm sm:rounded-lg flex items-center justify-center border border-dashed border-rule"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-ink-3"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RUNGS, type Rung } from '@/lib/domain/rungs';
import { INDUSTRIES, INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

const RUNG_LABELS: Record<Rung, string> = {
  idea: 'Idea',
  building: 'Building',
  live: 'Live',
  first: 'First $',
  growing: 'Growing',
  alumni: 'Alumni',
};

const SORT_OPTIONS = [
  { key: 'trending', label: 'Trending' },
  { key: 'recent', label: 'Recent' },
  { key: 'popular', label: 'Popular' },
];

interface DiscoverFiltersProps {
  currentSort: string;
  currentRung: string;
  currentIndustry: string;
  currentContent: string;
  currentMinLikes?: string;
  currentMaxLikes?: string;
  currentMinStreak?: string;
  currentMaxStreak?: string;
}

export function DiscoverFilters({
  currentSort,
  currentRung,
  currentIndustry,
  currentMinLikes = '',
  currentMaxLikes = '',
  currentMinStreak = '',
  currentMaxStreak = '',
}: DiscoverFiltersProps) {
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);

  // Local state for range inputs
  const [minLikes, setMinLikes] = useState(currentMinLikes);
  const [maxLikes, setMaxLikes] = useState(currentMaxLikes);
  const [minStreak, setMinStreak] = useState(currentMinStreak);
  const [maxStreak, setMaxStreak] = useState(currentMaxStreak);

  const buildUrl = (
    sort: string,
    rung: string,
    industry: string,
    minL?: string,
    maxL?: string,
    minS?: string,
    maxS?: string
  ) => {
    const params = new URLSearchParams();
    if (sort !== 'trending') params.set('sort', sort);
    if (rung !== 'all') params.set('rung', rung);
    if (industry !== 'all') params.set('industry', industry);
    if (minL) params.set('minLikes', minL);
    if (maxL) params.set('maxLikes', maxL);
    if (minS) params.set('minStreak', minS);
    if (maxS) params.set('maxStreak', maxS);
    const query = params.toString();
    return `/discover${query ? `?${query}` : ''}`;
  };

  const hasActiveFilters =
    currentRung !== 'all' ||
    currentIndustry !== 'all' ||
    currentMinLikes ||
    currentMaxLikes ||
    currentMinStreak ||
    currentMaxStreak;

  const activeFilterCount = [
    currentRung !== 'all',
    currentIndustry !== 'all',
    currentMinLikes || currentMaxLikes,
    currentMinStreak || currentMaxStreak,
  ].filter(Boolean).length;

  const applyRangeFilters = () => {
    router.push(buildUrl(currentSort, currentRung, currentIndustry, minLikes, maxLikes, minStreak, maxStreak));
  };

  return (
    <div className="mb-6 sm:mb-8">
      {/* Sort (left) and Filter (right) */}
      <div className="flex items-center justify-between">
        {/* Sort Options - inline pills */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-ink-3 font-medium mr-1">Sort:</span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={buildUrl(opt.key, currentRung, currentIndustry, currentMinLikes, currentMaxLikes, currentMinStreak, currentMaxStreak)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                currentSort === opt.key
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink-2 border border-rule hover:border-ink-3'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        {/* Filter Button + Clear */}
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <Link
              href={buildUrl(currentSort, 'all', 'all')}
              className="text-[13px] font-medium text-ink-3 hover:text-ink flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Clear
            </Link>
          )}

          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-[14px] font-semibold transition-colors ${
              hasActiveFilters
                ? 'bg-ink text-white border-ink'
                : 'bg-white border-rule hover:border-ink-3'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-go text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="mt-4 bg-white border border-rule rounded-2xl p-5 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Industry */}
            <div>
              <label className="block text-[12px] text-ink-3 font-semibold uppercase tracking-wide mb-3">
                Industry
              </label>
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={buildUrl(currentSort, currentRung, 'all', currentMinLikes, currentMaxLikes, currentMinStreak, currentMaxStreak)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentIndustry === 'all'
                      ? 'bg-ink text-white'
                      : 'bg-soft text-ink-2 hover:text-ink'
                  }`}
                >
                  All
                </Link>
                {INDUSTRIES.map((ind) => (
                  <Link
                    key={ind}
                    href={buildUrl(currentSort, currentRung, ind, currentMinLikes, currentMaxLikes, currentMinStreak, currentMaxStreak)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                      currentIndustry === ind
                        ? 'bg-ink text-white'
                        : 'bg-soft text-ink-2 hover:text-ink'
                    }`}
                  >
                    {INDUSTRY_LABELS[ind]}
                  </Link>
                ))}
              </div>
            </div>

            {/* Stage */}
            <div>
              <label className="block text-[12px] text-ink-3 font-semibold uppercase tracking-wide mb-3">
                Stage
              </label>
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={buildUrl(currentSort, 'all', currentIndustry, currentMinLikes, currentMaxLikes, currentMinStreak, currentMaxStreak)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentRung === 'all'
                      ? 'bg-go-deep text-white'
                      : 'bg-soft text-ink-2 hover:text-ink'
                  }`}
                >
                  All
                </Link>
                {RUNGS.map((rung) => (
                  <Link
                    key={rung}
                    href={buildUrl(currentSort, rung, currentIndustry, currentMinLikes, currentMaxLikes, currentMinStreak, currentMaxStreak)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                      currentRung === rung
                        ? 'bg-go-deep text-white'
                        : 'bg-soft text-ink-2 hover:text-ink'
                    }`}
                  >
                    {RUNG_LABELS[rung]}
                  </Link>
                ))}
              </div>
            </div>

            {/* Min/Max Likes */}
            <div>
              <label className="block text-[12px] text-ink-3 font-semibold uppercase tracking-wide mb-3">
                Followers
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minLikes}
                  onChange={(e) => setMinLikes(e.target.value)}
                  className="w-24 px-3 py-2 border border-rule rounded-lg text-[14px] focus:outline-none focus:border-ink-3"
                  min="0"
                />
                <span className="text-ink-3">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxLikes}
                  onChange={(e) => setMaxLikes(e.target.value)}
                  className="w-24 px-3 py-2 border border-rule rounded-lg text-[14px] focus:outline-none focus:border-ink-3"
                  min="0"
                />
              </div>
            </div>

            {/* Min/Max Streak */}
            <div>
              <label className="block text-[12px] text-ink-3 font-semibold uppercase tracking-wide mb-3">
                Streak (weeks)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minStreak}
                  onChange={(e) => setMinStreak(e.target.value)}
                  className="w-24 px-3 py-2 border border-rule rounded-lg text-[14px] focus:outline-none focus:border-ink-3"
                  min="0"
                />
                <span className="text-ink-3">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxStreak}
                  onChange={(e) => setMaxStreak(e.target.value)}
                  className="w-24 px-3 py-2 border border-rule rounded-lg text-[14px] focus:outline-none focus:border-ink-3"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Apply Button for range filters */}
          <div className="mt-5 pt-4 border-t border-rule flex justify-end">
            <button
              onClick={applyRangeFilters}
              className="px-5 py-2 bg-ink text-white rounded-full text-[14px] font-semibold hover:bg-[#2a2a2a] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

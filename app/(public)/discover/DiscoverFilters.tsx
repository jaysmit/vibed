'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  { key: 'recent', label: 'Recent', icon: '🕐' },
  { key: 'trending', label: 'Trending', icon: '🔥' },
  { key: 'popular', label: 'Popular', icon: '⭐' },
];

const VIDEO_CATEGORIES = [
  { key: 'pitch', label: 'Pitch', icon: '🎤' },
  { key: 'spark', label: 'Spark', icon: '💡' },
  { key: 'validation', label: 'Valid.', icon: '✅' },
  { key: 'proto', label: 'Proto', icon: '🔧' },
  { key: 'gtm', label: 'GTM', icon: '🚀' },
  { key: 'channel', label: 'Mktg', icon: '📣' },
  { key: 'first', label: 'Sale', icon: '💰' },
  { key: 'trouble', label: 'Hard', icon: '⚡' },
  { key: 'money', label: 'Fund', icon: '💵' },
  { key: 'team', label: 'Team', icon: '👥' },
];

interface DiscoverFiltersProps {
  currentSort: string;
  currentRung: string;
  currentIndustry: string;
  currentContent: string;
}

export function DiscoverFilters({
  currentSort,
  currentRung,
  currentIndustry,
  currentContent,
}: DiscoverFiltersProps) {
  const [openSections, setOpenSections] = useState({
    watch: currentContent !== 'all',
    industry: currentIndustry !== 'all',
    stage: currentRung !== 'all',
  });

  const toggleSection = (section: 'watch' | 'industry' | 'stage') => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const buildUrl = (sort: string, rung: string, industry: string, content: string) => {
    const params = new URLSearchParams();
    if (sort !== 'recent') params.set('sort', sort);
    if (rung !== 'all') params.set('rung', rung);
    if (industry !== 'all') params.set('industry', industry);
    if (content !== 'all') params.set('content', content);
    const query = params.toString();
    return `/discover${query ? `?${query}` : ''}`;
  };

  const hasActiveFilters = currentRung !== 'all' || currentIndustry !== 'all' || currentContent !== 'all';

  return (
    <div className="bg-soft rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
      {/* Sort Row - always visible */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide w-12 flex-shrink-0">Sort</span>
        <div className="flex gap-2 flex-wrap">
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={buildUrl(opt.key, currentRung, currentIndustry, currentContent)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                currentSort === opt.key
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-ink-2 hover:text-ink border border-rule'
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Collapsible filter sections */}
      <div className="border-t border-rule pt-2 space-y-1">
        {/* Watch Content */}
        <div>
          <button
            onClick={() => toggleSection('watch')}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide flex items-center gap-2">
              Watch
              {currentContent !== 'all' && (
                <span className="text-[10px] bg-heat text-white px-1.5 py-0.5 rounded-full normal-case">
                  {VIDEO_CATEGORIES.find(c => c.key === currentContent)?.label}
                </span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-ink-3 transition-transform ${openSections.watch ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {openSections.watch && (
            <div className="pb-2 flex gap-1.5 flex-wrap">
              <Link
                href={buildUrl(currentSort, currentRung, currentIndustry, 'all')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  currentContent === 'all'
                    ? 'bg-heat text-white'
                    : 'bg-white text-ink-3 hover:text-ink border border-rule'
                }`}
              >
                All
              </Link>
              {VIDEO_CATEGORIES.map((cat) => (
                <Link
                  key={cat.key}
                  href={buildUrl(currentSort, currentRung, currentIndustry, cat.key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    currentContent === cat.key
                      ? 'bg-heat text-white'
                      : 'bg-white text-ink-3 hover:text-ink border border-rule'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Industry */}
        <div>
          <button
            onClick={() => toggleSection('industry')}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide flex items-center gap-2">
              Industry
              {currentIndustry !== 'all' && (
                <span className="text-[10px] bg-ink text-white px-1.5 py-0.5 rounded-full normal-case">
                  {INDUSTRY_LABELS[currentIndustry as Industry]}
                </span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-ink-3 transition-transform ${openSections.industry ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {openSections.industry && (
            <div className="pb-2 flex gap-1.5 flex-wrap">
              <Link
                href={buildUrl(currentSort, currentRung, 'all', currentContent)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  currentIndustry === 'all'
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink-3 hover:text-ink border border-rule'
                }`}
              >
                All
              </Link>
              {INDUSTRIES.map((ind) => (
                <Link
                  key={ind}
                  href={buildUrl(currentSort, currentRung, ind, currentContent)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    currentIndustry === ind
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink-3 hover:text-ink border border-rule'
                  }`}
                >
                  {INDUSTRY_LABELS[ind]}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Stage */}
        <div>
          <button
            onClick={() => toggleSection('stage')}
            className="flex items-center justify-between w-full py-2 text-left"
          >
            <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide flex items-center gap-2">
              Stage
              {currentRung !== 'all' && (
                <span className="text-[10px] bg-go-deep text-white px-1.5 py-0.5 rounded-full normal-case">
                  {RUNG_LABELS[currentRung as Rung]}
                </span>
              )}
            </span>
            <svg
              className={`w-4 h-4 text-ink-3 transition-transform ${openSections.stage ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {openSections.stage && (
            <div className="pb-2 flex gap-1.5 flex-wrap">
              <Link
                href={buildUrl(currentSort, 'all', currentIndustry, currentContent)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                  currentRung === 'all'
                    ? 'bg-go-deep text-white'
                    : 'bg-white text-ink-3 hover:text-ink border border-rule'
                }`}
              >
                All
              </Link>
              {RUNGS.map((rung) => (
                <Link
                  key={rung}
                  href={buildUrl(currentSort, rung, currentIndustry, currentContent)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    currentRung === rung
                      ? 'bg-go-deep text-white'
                      : 'bg-white text-ink-3 hover:text-ink border border-rule'
                  }`}
                >
                  {RUNG_LABELS[rung]}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="mt-2 pt-2 border-t border-rule">
          <Link
            href="/discover"
            className="text-[11px] font-medium text-ink-3 hover:text-ink flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Clear all filters
          </Link>
        </div>
      )}
    </div>
  );
}

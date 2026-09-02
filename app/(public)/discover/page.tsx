import Link from 'next/link';
import { VentureCard } from '@/components/ui';
import { getPublishedVentures } from '@/lib/services/ventures-public';
import { RUNGS, type Rung } from '@/lib/domain/rungs';
import { INDUSTRIES, INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

const RUNG_LABELS: Record<Rung, string> = {
  idea: 'Idea Stage',
  building: 'Building',
  live: 'Live Product',
  first: 'First Dollar',
  growing: 'Growing',
  alumni: 'Alumni',
};

const SORT_OPTIONS = [
  { key: 'recent', label: 'Recent', icon: '🕐' },
  { key: 'trending', label: 'Trending', icon: '🔥' },
  { key: 'popular', label: 'Popular', icon: '⭐' },
];

// Video content categories - key journey moments people want to watch
const VIDEO_CATEGORIES = [
  { key: 'pitch', label: 'Elevator Pitch', icon: '🎤', desc: 'The 30-second pitch' },
  { key: 'spark', label: 'The Spark', icon: '💡', desc: 'How it all started' },
  { key: 'validation', label: 'Validation', icon: '✅', desc: 'Testing the idea' },
  { key: 'proto', label: 'Prototype', icon: '🔧', desc: 'First ugly version' },
  { key: 'gtm', label: 'Go To Market', icon: '🚀', desc: 'Launch strategy' },
  { key: 'channel', label: 'Marketing', icon: '📣', desc: 'Finding customers' },
  { key: 'first', label: 'First Sale', icon: '💰', desc: 'First paying customer' },
  { key: 'trouble', label: 'Challenges', icon: '⚡', desc: 'What nearly killed it' },
  { key: 'money', label: 'Funding', icon: '💵', desc: 'Money & runway' },
  { key: 'team', label: 'Team Building', icon: '👥', desc: 'Getting help' },
];

interface PageProps {
  searchParams: Promise<{ sort?: string; rung?: string; industry?: string; content?: string }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentSort = params.sort || 'recent';
  const currentRung = params.rung || 'all';
  const currentIndustry = params.industry || 'all';
  const currentContent = params.content || 'all';

  let ventures = await getPublishedVentures();

  // Filter by rung
  if (currentRung !== 'all' && RUNGS.includes(currentRung as Rung)) {
    ventures = ventures.filter((v) => v.rung === currentRung);
  }

  // Filter by industry
  if (currentIndustry !== 'all' && INDUSTRIES.includes(currentIndustry as Industry)) {
    ventures = ventures.filter((v) => v.industry === currentIndustry);
  }

  // Filter by content type (ventures that have this segment filled)
  if (currentContent !== 'all') {
    ventures = ventures.filter((v) => {
      const segments = v.segments || {};
      const segmentData = segments instanceof Map ? segments.get(currentContent) : segments[currentContent];
      return segmentData?.body;
    });
  }

  // Sort
  if (currentSort === 'popular') {
    ventures = [...ventures].sort((a, b) => b.counters.followers - a.counters.followers);
  } else if (currentSort === 'trending') {
    ventures = [...ventures].sort((a, b) => b.counters.trendingScore - a.counters.trendingScore);
  }

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
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-[26px] sm:text-[32px] font-black tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Discover
        </h1>
        <p className="text-ink-2 text-[14px] sm:text-[16px] mt-1 sm:mt-2">
          Find founders building in public, filtered your way.
        </p>
      </div>

      {/* Filters Panel */}
      <div className="bg-soft rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
        {/* Sort Row */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide w-16 flex-shrink-0">Sort</span>
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.key}
                href={buildUrl(opt.key, currentRung, currentIndustry, currentContent)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  currentSort === opt.key
                    ? 'bg-ink text-white shadow-sm'
                    : 'bg-white text-ink-2 hover:bg-white hover:text-ink border border-rule'
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Video Content Row */}
        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-rule">
          <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide w-16 flex-shrink-0 pt-1.5">Watch</span>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={buildUrl(currentSort, currentRung, currentIndustry, 'all')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                currentContent === 'all'
                  ? 'bg-heat text-white shadow-sm'
                  : 'bg-white text-ink-2 hover:bg-white hover:text-ink border border-rule'
              }`}
            >
              All Content
            </Link>
            {VIDEO_CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                href={buildUrl(currentSort, currentRung, currentIndustry, cat.key)}
                className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  currentContent === cat.key
                    ? 'bg-heat text-white shadow-sm'
                    : 'bg-white text-ink-2 hover:bg-white hover:text-ink border border-rule'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-ink text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {cat.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Industry & Stage Row */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Industry */}
          <div className="flex items-start gap-3">
            <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide w-16 flex-shrink-0 pt-1.5">Industry</span>
            <div className="flex gap-1.5 flex-wrap">
              <Link
                href={buildUrl(currentSort, currentRung, 'all', currentContent)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
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
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                    currentIndustry === ind
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink-3 hover:text-ink border border-rule'
                  }`}
                >
                  {INDUSTRY_LABELS[ind]}
                </Link>
              ))}
            </div>
          </div>

          {/* Stage */}
          <div className="flex items-start gap-3">
            <span className="text-[12px] text-ink-3 font-semibold uppercase tracking-wide w-16 flex-shrink-0 pt-1.5">Stage</span>
            <div className="flex gap-1.5 flex-wrap">
              <Link
                href={buildUrl(currentSort, 'all', currentIndustry, currentContent)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
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
                  className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                    currentRung === rung
                      ? 'bg-go-deep text-white'
                      : 'bg-white text-ink-3 hover:text-ink border border-rule'
                  }`}
                >
                  {RUNG_LABELS[rung]}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-rule">
            <Link
              href="/discover"
              className="text-[12px] font-medium text-ink-3 hover:text-ink flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Clear all filters
            </Link>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <span className="text-[13px] sm:text-[14px] text-ink-3">
          <b className="text-ink font-semibold">{ventures.length}</b> {ventures.length === 1 ? 'venture' : 'ventures'} found
        </span>
        {currentContent !== 'all' && (
          <span className="text-[12px] bg-heat-tint text-heat px-2 py-1 rounded-full font-medium">
            Showing ventures with {VIDEO_CATEGORIES.find(c => c.key === currentContent)?.label} content
          </span>
        )}
      </div>

      {/* Ventures grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {ventures.map((v) => (
          <VentureCard
            key={v.slug}
            slug={v.slug}
            name={v.name}
            pitch={v.pitch}
            brand={v.brand}
            glyph={v.glyph}
            poster={v.links?.poster}
            rung={v.rung}
            industry={v.industry}
            status={v.status}
            founder={v.founder}
            promise={v.promise}
            promiseHistory={v.promiseHistory}
            counters={v.counters}
          />
        ))}
      </div>

      {ventures.length === 0 && (
        <div className="text-center py-16 sm:py-20 max-w-md mx-auto">
          <div className="text-[48px] sm:text-[60px] opacity-20 mb-4">🔍</div>
          <h2 className="text-[20px] sm:text-[24px] font-extrabold font-display">No ventures found</h2>
          <p className="text-ink-2 mt-2 text-[14px] sm:text-base">
            Try adjusting your filters or check back later.
          </p>
          <Link
            href="/discover"
            className="inline-block mt-6 bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-[#2a2a2a] transition-colors text-[14px] sm:text-base"
          >
            Clear filters
          </Link>
        </div>
      )}
    </main>
  );
}

export const metadata = {
  title: 'Discover — Vibed',
  description: 'Find founders building in public. Filter by industry, stage, content type, and sort by trending or popularity.',
};

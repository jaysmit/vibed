import Link from 'next/link';
import { VentureCard } from '@/components/ui';
import { getPublishedVentures } from '@/lib/services/ventures-public';
import { RUNGS, type Rung } from '@/lib/domain/rungs';
import { INDUSTRIES, type Industry } from '@/lib/supabase/types';
import { DiscoverFilters } from './DiscoverFilters';

interface PageProps {
  searchParams: Promise<{
    sort?: string;
    rung?: string;
    industry?: string;
    content?: string;
    minLikes?: string;
    maxLikes?: string;
    minStreak?: string;
    maxStreak?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentSort = params.sort || 'trending';
  const currentRung = params.rung || 'all';
  const currentIndustry = params.industry || 'all';
  const currentContent = params.content || 'all';
  const currentMinLikes = params.minLikes || '';
  const currentMaxLikes = params.maxLikes || '';
  const currentMinStreak = params.minStreak || '';
  const currentMaxStreak = params.maxStreak || '';

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

  // Filter by followers (likes)
  if (currentMinLikes) {
    const min = parseInt(currentMinLikes, 10);
    if (!isNaN(min)) {
      ventures = ventures.filter((v) => (v.counters?.followers || 0) >= min);
    }
  }
  if (currentMaxLikes) {
    const max = parseInt(currentMaxLikes, 10);
    if (!isNaN(max)) {
      ventures = ventures.filter((v) => (v.counters?.followers || 0) <= max);
    }
  }

  // Filter by streak (weeks)
  if (currentMinStreak) {
    const min = parseInt(currentMinStreak, 10);
    if (!isNaN(min)) {
      ventures = ventures.filter((v) => (v.counters?.streakWeeks || 0) >= min);
    }
  }
  if (currentMaxStreak) {
    const max = parseInt(currentMaxStreak, 10);
    if (!isNaN(max)) {
      ventures = ventures.filter((v) => (v.counters?.streakWeeks || 0) <= max);
    }
  }

  // Sort
  if (currentSort === 'popular') {
    ventures = [...ventures].sort((a, b) => (b.counters?.followers || 0) - (a.counters?.followers || 0));
  } else if (currentSort === 'trending') {
    ventures = [...ventures].sort((a, b) => (b.counters?.trendingScore || 0) - (a.counters?.trendingScore || 0));
  }

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

      {/* Sort & Filter Controls */}
      <DiscoverFilters
        currentSort={currentSort}
        currentRung={currentRung}
        currentIndustry={currentIndustry}
        currentContent={currentContent}
        currentMinLikes={currentMinLikes}
        currentMaxLikes={currentMaxLikes}
        currentMinStreak={currentMinStreak}
        currentMaxStreak={currentMaxStreak}
      />

      {/* Results count */}
      <div className="mb-4 sm:mb-6">
        <span className="text-[13px] sm:text-[14px] text-ink-3">
          <b className="text-ink font-semibold">{ventures.length}</b> {ventures.length === 1 ? 'venture' : 'ventures'} found
        </span>
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

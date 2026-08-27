import Link from 'next/link';
import { VentureCard } from '@/components/ui';
import { getPublishedVentures } from '@/lib/services/ventures-public';
import { RUNGS, type Rung } from '@/lib/domain/rungs';

const RUNG_LABELS: Record<Rung, string> = {
  idea: 'Idea',
  building: 'Building',
  live: 'Live',
  first: 'First Dollar',
  growing: 'Growing',
  alumni: 'Alumni',
};

const SORT_OPTIONS = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'trending', label: 'Trending' },
  { key: 'popular', label: 'Most Popular' },
  { key: 'trending-pitches', label: 'Trending Pitches' },
];

interface PageProps {
  searchParams: Promise<{ sort?: string; rung?: string }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentSort = params.sort || 'recent';
  const currentRung = params.rung || 'all';

  let ventures = await getPublishedVentures();

  // Filter by rung
  if (currentRung !== 'all' && RUNGS.includes(currentRung as Rung)) {
    ventures = ventures.filter((v) => v.rung === currentRung);
  }

  // Sort (in production, this would be done in the query)
  if (currentSort === 'popular') {
    ventures = [...ventures].sort((a, b) => b.counters.followers - a.counters.followers);
  } else if (currentSort === 'trending') {
    ventures = [...ventures].sort((a, b) => b.counters.trendingScore - a.counters.trendingScore);
  }
  // 'recent' is default order from getPublishedVentures

  return (
    <main className="max-w-[1180px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-[32px] font-black tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Discover Journeys
        </h1>
        <p className="text-ink-2 text-[16px] mt-2">
          Find founders building in public, filtered your way.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-rule">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-ink-3 font-medium">Sort:</span>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.key}
                href={`/discover?sort=${opt.key}${currentRung !== 'all' ? `&rung=${currentRung}` : ''}`}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  currentSort === opt.key
                    ? 'bg-ink text-white'
                    : 'bg-soft text-ink-2 hover:bg-rule'
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stage filter */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-ink-3 font-medium">Stage:</span>
          <div className="flex gap-1 flex-wrap">
            <Link
              href={`/discover?sort=${currentSort}`}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                currentRung === 'all'
                  ? 'bg-ink text-white'
                  : 'bg-soft text-ink-2 hover:bg-rule'
              }`}
            >
              All
            </Link>
            {RUNGS.map((rung) => (
              <Link
                key={rung}
                href={`/discover?sort=${currentSort}&rung=${rung}`}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  currentRung === rung
                    ? 'bg-ink text-white'
                    : 'bg-soft text-ink-2 hover:bg-rule'
                }`}
              >
                {RUNG_LABELS[rung]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6">
        <span className="text-[14px] text-ink-3">
          {ventures.length} {ventures.length === 1 ? 'journey' : 'journeys'} found
        </span>
      </div>

      {/* Ventures grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ventures.map((v) => (
          <VentureCard
            key={v.slug}
            slug={v.slug}
            name={v.name}
            pitch={v.pitch}
            brand={v.brand}
            glyph={v.glyph}
            rung={v.rung}
            status={v.status}
            founder={v.founder}
            promise={v.promise}
            promiseHistory={v.promiseHistory}
            counters={v.counters}
          />
        ))}
      </div>

      {ventures.length === 0 && (
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="text-[60px] opacity-20 mb-4">🔍</div>
          <h2 className="text-[24px] font-extrabold font-display">No journeys found</h2>
          <p className="text-ink-2 mt-2">
            Try adjusting your filters or check back later.
          </p>
          <Link
            href="/discover"
            className="inline-block mt-6 bg-ink text-white font-semibold px-6 py-3 rounded-full hover:bg-[#2a2a2a] transition-colors"
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
  description: 'Find founders building in public. Filter by stage, sort by trending or popularity.',
};

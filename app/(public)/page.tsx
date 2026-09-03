import Link from 'next/link';
import { VentureCard, PitchCard } from '@/components/ui';
import { getPublishedVentures } from '@/lib/services/ventures-public';
import { getCurrentUserId } from '@/lib/supabase/auth';
import {
  PILLAR_SEGMENTS,
  PILLAR_LABELS,
  PILLAR_DESCRIPTIONS,
  PILLAR_ORDER,
} from '@/lib/domain/pillars';
import type { Pillar } from '@/lib/supabase/types';

// Filter ventures that have content in segments for a given pillar
function getVenturesForPillar(
  ventures: Awaited<ReturnType<typeof getPublishedVentures>>,
  pillar: Exclude<Pillar, 'featured'>
) {
  const segments = PILLAR_SEGMENTS[pillar];
  return ventures
    .filter((v) => {
      // Check if venture has content in any of the pillar's segments
      return segments.some((segKey) => {
        const segment = v.segments[segKey];
        return segment && segment.body && segment.body.trim().length > 0;
      });
    })
    .slice(0, 4);
}

export default async function HomePage() {
  const [ventures, userId] = await Promise.all([
    getPublishedVentures(),
    getCurrentUserId(),
  ]);

  const isLoggedIn = !!userId;

  // Get ventures for each pillar based on segment content
  const pillarVentures = {
    the_idea: getVenturesForPillar(ventures, 'the_idea'),
    building_it: getVenturesForPillar(ventures, 'building_it'),
    getting_customers: getVenturesForPillar(ventures, 'getting_customers'),
    hard_parts: getVenturesForPillar(ventures, 'hard_parts'),
  };

  // Fallback: if a pillar has no ventures with segment content, show any ventures
  for (const pillar of PILLAR_ORDER) {
    if (pillarVentures[pillar].length === 0) {
      pillarVentures[pillar] = ventures.slice(0, 4);
    }
  }

  // Trending ventures (top 4 by followers)
  const trendingVentures = [...ventures]
    .sort((a, b) => (b.counters?.followers || 0) - (a.counters?.followers || 0))
    .slice(0, 4);

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6">
      {/* Hero */}
      <section className="py-5 sm:py-8">
        {isLoggedIn ? (
          // Logged in: standard hero
          <div>
            <h1
              className="text-[clamp(24px,4vw,44px)] font-black tracking-tight leading-[1.04] max-w-[19ch]"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              The overnight success,
              <br />
              <span className="text-go-deep">filmed daily.</span>
            </h1>
            <p className="text-[14px] sm:text-[16px] text-ink-2 mt-2 sm:mt-3 max-w-[52ch]">
              Follow founders from week one. Watch the real story unfold — the breakthroughs, the
              setbacks, and everything they figured out along the way.
            </p>
          </div>
        ) : (
          // Logged out: hero with intro video
          <>
            {/* Mobile: tagline + video only */}
            <div className="sm:hidden">
              <h1
                className="text-[26px] font-black tracking-tight leading-[1.04]"
                style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
              >
                The overnight success,
                <br />
                <span className="text-go-deep">filmed daily.</span>
              </h1>
              <div className="mt-4 aspect-video bg-ink rounded-xl overflow-hidden relative group cursor-pointer">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-medium text-white/90 mt-2">Learn what we&apos;re about</span>
                </div>
              </div>
            </div>

            {/* Desktop: side by side, video matches text height */}
            <div className="hidden sm:flex items-stretch gap-8">
              <div className="flex-1">
                <h1
                  className="text-[clamp(32px,4vw,44px)] font-black tracking-tight leading-[1.04] max-w-[19ch]"
                  style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
                >
                  The overnight success,
                  <br />
                  <span className="text-go-deep">filmed daily.</span>
                </h1>
                <p className="text-[15px] sm:text-[16px] text-ink-2 mt-3 max-w-[52ch]">
                  Follow founders from week one. Watch the real story unfold — the breakthroughs, the
                  setbacks, and everything they figured out along the way.
                </p>
              </div>
              <div className="w-[280px] lg:w-[320px] flex-shrink-0">
                <div className="h-full bg-ink rounded-xl overflow-hidden relative group cursor-pointer">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <span className="text-[12px] font-medium text-white/90 mt-2">Learn what we&apos;re about</span>
                    <span className="text-[10px] text-white/60 mt-0.5">1 min</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* The Idea */}
      <PillarSection
        pillar="the_idea"
        ventures={pillarVentures.the_idea}
        linkHref="/discover?pillar=the_idea"
      />

      {/* Building It */}
      <PillarSection
        pillar="building_it"
        ventures={pillarVentures.building_it}
        linkHref="/discover?pillar=building_it"
      />

      {/* Getting Customers */}
      <PillarSection
        pillar="getting_customers"
        ventures={pillarVentures.getting_customers}
        linkHref="/discover?pillar=getting_customers"
      />

      {/* The Hard Parts - Pivot Points */}
      <PillarSection
        pillar="hard_parts"
        ventures={pillarVentures.hard_parts}
        linkHref="/discover?pillar=hard_parts"
      />

      {/* Trending Ventures */}
      <section className="py-3 sm:py-5 border-t border-rule">
        <div className="flex items-baseline justify-between mb-2 sm:mb-4">
          <div>
            <h2 className="text-[16px] sm:text-[22px] font-extrabold font-display">Trending Ventures</h2>
            <p className="text-[11px] sm:text-[13px] text-ink-3 mt-0.5">The ones everyone&apos;s watching</p>
          </div>
          <Link href="/discover" className="text-[11px] sm:text-[13px] text-go-deep hover:underline flex-shrink-0">
            See all →
          </Link>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2.5" style={{ width: 'max-content' }}>
            {trendingVentures.map((v) => (
              <div key={v.slug} className="w-[220px] flex-shrink-0">
                <VentureCard
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
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:block max-w-[92%]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {trendingVentures.map((v) => (
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
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-white rounded-xl sm:rounded-2xl p-5 sm:p-8 text-center mt-2 mb-2">
        <h2 className="text-[20px] sm:text-[26px] font-extrabold font-display text-white">
          Building something?
        </h2>
        <p className="text-[#BDBDBD] text-[13px] sm:text-[15px] mt-1.5 sm:mt-2 max-w-[46ch] mx-auto">
          Start documenting your venture today. No audience required — just honesty.
        </p>
        <a
          href="/start"
          className="inline-block mt-3 sm:mt-4 bg-go text-[#00301E] font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-[#04B76B] transition-colors text-[13px] sm:text-[15px]"
        >
          Start your venture
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule py-4 sm:py-5 text-[11px] sm:text-[12px] text-ink-3">
        <div className="flex gap-3 sm:gap-4 flex-wrap items-center">
          <span>Vibed — follow founders from week one</span>
          <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
          <span className="ml-auto font-mono">v0.6</span>
        </div>
      </footer>
    </main>
  );
}

// Pillar Section Component
interface PillarSectionProps {
  pillar: Exclude<Pillar, 'featured'>;
  ventures: Awaited<ReturnType<typeof getPublishedVentures>>;
  linkHref: string;
  useFullCards?: boolean;
}

function PillarSection({ pillar, ventures, linkHref, useFullCards = false }: PillarSectionProps) {
  const title = PILLAR_LABELS[pillar];
  const description = PILLAR_DESCRIPTIONS[pillar];

  return (
    <section className="py-3 sm:py-5 border-t border-rule">
      <div className="flex items-baseline justify-between mb-2 sm:mb-4">
        <div>
          <h2 className="text-[16px] sm:text-[22px] font-extrabold font-display">{title}</h2>
          <p className="text-[11px] sm:text-[13px] text-ink-3 mt-0.5">{description}</p>
        </div>
        <Link href={linkHref} className="text-[11px] sm:text-[13px] text-go-deep hover:underline flex-shrink-0">
          See all →
        </Link>
      </div>

      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5" style={{ width: 'max-content' }}>
          {ventures.map((v) =>
            useFullCards ? (
              <div key={v.slug} className="w-[220px] flex-shrink-0">
                <VentureCard
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
              </div>
            ) : (
              <div key={v.slug} className="w-[160px] flex-shrink-0">
                <PitchCard
                  slug={v.slug}
                  name={v.name}
                  pitch={v.pitch}
                  brand={v.brand}
                  poster={v.links?.poster}
                  rung={v.rung}
                  industry={v.industry}
                  status={v.status}
                  founder={v.founder}
                  counters={v.counters}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Desktop: grid layout - max-w-[90%] for ~10% smaller cards */}
      <div className="hidden sm:block max-w-[92%]">
        <div className={`grid ${useFullCards ? 'sm:grid-cols-2' : 'sm:grid-cols-2'} lg:grid-cols-4 gap-3 lg:gap-4`}>
          {ventures.map((v) =>
            useFullCards ? (
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
            ) : (
              <PitchCard
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
                counters={v.counters}
              />
            )
          )}
        </div>
      </div>

      {ventures.length === 0 && (
        <p className="text-ink-3 text-center py-6 sm:py-10">No content yet. Be the first!</p>
      )}
    </section>
  );
}

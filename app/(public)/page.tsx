import Link from 'next/link';
import { InfiniteScrollSection } from '@/components/ui';
import { getTrendingVentures, getRecentVentures, type VentureWithFounder } from '@/lib/services/ventures-public';
import {
  PILLAR_LABELS,
  PILLAR_DESCRIPTIONS,
} from '@/lib/domain/pillars';
import { HeroSection } from './HeroSection';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

// Transform venture for InfiniteScrollSection
function transformVenture(v: VentureWithFounder) {
  return {
    slug: v.slug,
    name: v.name,
    pitch: v.pitch,
    brand: v.brand,
    glyph: v.glyph,
    rung: v.rung,
    industry: v.industry,
    status: v.status,
    links: v.links,
    counters: v.counters,
    founder: v.founder,
    promise: v.promise,
    promiseHistory: v.promiseHistory,
  };
}

export default async function HomePage() {
  // Fetch only what we need - in parallel (no auth check needed - hero handles it client-side)
  const [trendingVentures, recentVentures] = await Promise.all([
    getTrendingVentures(4),
    getRecentVentures(4),
  ]);

  // Use trending ventures as fallback for all pillars (faster than filtering all ventures)
  const pillarVentures = {
    the_idea: trendingVentures.slice(0, 4),
    building_it: trendingVentures.slice(0, 4),
    getting_customers: trendingVentures.slice(0, 4),
    hard_parts: trendingVentures.slice(0, 4),
  };

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6">
      {/* Hero - client component handles auth check */}
      <HeroSection />

      {/* Trending Ventures - TOP SECTION */}
      <InfiniteScrollSection
        title="Trending Ventures"
        description="The ones everyone's watching"
        linkHref="/discover"
        pillar="trending"
        initialVentures={trendingVentures.map(transformVenture)}
        useFullCards
      />

      {/* Most Popular - All ventures sorted by recent */}
      <InfiniteScrollSection
        title="Most Popular"
        description="Recently active ventures"
        linkHref="/discover"
        pillar="recent"
        initialVentures={recentVentures.map(transformVenture)}
        useFullCards
      />

      {/* The Idea */}
      <InfiniteScrollSection
        title={PILLAR_LABELS.the_idea}
        description={PILLAR_DESCRIPTIONS.the_idea}
        linkHref="/discover?pillar=the_idea"
        pillar="the_idea"
        initialVentures={pillarVentures.the_idea.map(transformVenture)}
      />

      {/* Building It */}
      <InfiniteScrollSection
        title={PILLAR_LABELS.building_it}
        description={PILLAR_DESCRIPTIONS.building_it}
        linkHref="/discover?pillar=building_it"
        pillar="building_it"
        initialVentures={pillarVentures.building_it.map(transformVenture)}
      />

      {/* Getting Customers */}
      <InfiniteScrollSection
        title={PILLAR_LABELS.getting_customers}
        description={PILLAR_DESCRIPTIONS.getting_customers}
        linkHref="/discover?pillar=getting_customers"
        pillar="getting_customers"
        initialVentures={pillarVentures.getting_customers.map(transformVenture)}
      />

      {/* The Hard Parts - Pivot Points */}
      <InfiniteScrollSection
        title={PILLAR_LABELS.hard_parts}
        description={PILLAR_DESCRIPTIONS.hard_parts}
        linkHref="/discover?pillar=hard_parts"
        pillar="hard_parts"
        initialVentures={pillarVentures.hard_parts.map(transformVenture)}
      />

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


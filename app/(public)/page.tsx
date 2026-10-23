import Link from 'next/link';
import { InfiniteScrollSection } from '@/components/ui';
import {
  getTrendingVentures,
  type VentureWithFounder,
} from '@/lib/services/ventures-public';
import { HeroSection } from './HeroSection';
import { ElevatorPitchesSection } from './ElevatorPitchesSection';

// Force dynamic rendering to avoid stale cache from build
export const dynamic = 'force-dynamic';

// Transform venture for InfiniteScrollSection
function transformVenture(v: VentureWithFounder) {
  return {
    slug: v.slug,
    name: v.name,
    pitch: v.pitch,
    tagline: v.tagline,
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
  // Fetch trending ventures for the main section (DO NOT TOUCH - working perfectly)
  const trendingVentures = await getTrendingVentures(4);

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6">
      {/* Hero - client component handles auth check */}
      <HeroSection />

      {/* Trending Ventures - has SSR data */}
      <InfiniteScrollSection
        title="Trending Ventures"
        description="The ones everyone's watching"
        linkHref="/discover"
        pillar="trending"
        initialVentures={trendingVentures.map(transformVenture)}
        useFullCards
      />

      {/* Trending Elevator Pitches - TikTok-style reel viewer */}
      <ElevatorPitchesSection />

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


import Link from 'next/link';
import { VentureCard } from '@/components/ui';
import { getPublishedVentures } from '@/lib/services/ventures-public';

export default async function HomePage() {
  const ventures = await getPublishedVentures();

  // For now, use the same ventures for different sections
  // In production, these would be sorted/filtered differently
  const trendingPitches = ventures.slice(0, 4);
  const trendingJourneys = ventures.slice(0, 4);
  const allTimeFavourites = ventures.slice(0, 4);

  return (
    <main className="max-w-[1180px] mx-auto px-6">
      {/* Hero */}
      <section className="py-11">
        <h1
          className="text-[clamp(30px,4.4vw,50px)] font-black tracking-tight leading-[1.04] max-w-[19ch]"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          The overnight success,
          <br />
          <span className="text-go-deep">filmed daily.</span>
        </h1>
        <p className="text-[17px] text-ink-2 mt-[14px] max-w-[52ch]">
          Follow founders from week one. Watch the real story unfold — the breakthroughs, the
          setbacks, and everything they figured out along the way.
        </p>
      </section>

      {/* Trending Elevator Pitches */}
      <section className="py-9 border-t border-rule">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-[24px] font-extrabold font-display">Trending Elevator Pitches</h2>
            <p className="text-[14px] text-ink-3 mt-1">The ideas getting attention right now</p>
          </div>
          <Link href="/discover?sort=trending-pitches" className="text-[14px] text-go-deep hover:underline">
            See all →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trendingPitches.map((v) => (
            <VentureCard
              key={v.slug}
              slug={v.slug}
              name={v.name}
              pitch={v.pitch}
              brand={v.brand}
              glyph={v.glyph}
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

        {trendingPitches.length === 0 && (
          <p className="text-ink-3 text-center py-10">No pitches yet. Be the first!</p>
        )}
      </section>

      {/* Trending Journeys */}
      <section className="py-9 border-t border-rule">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-[24px] font-extrabold font-display">Trending Journeys</h2>
            <p className="text-[14px] text-ink-3 mt-1">Stories people can&apos;t stop following</p>
          </div>
          <Link href="/discover?sort=trending" className="text-[14px] text-go-deep hover:underline">
            See all →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trendingJourneys.map((v) => (
            <VentureCard
              key={v.slug}
              slug={v.slug}
              name={v.name}
              pitch={v.pitch}
              brand={v.brand}
              glyph={v.glyph}
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

        {trendingJourneys.length === 0 && (
          <p className="text-ink-3 text-center py-10">No journeys yet.</p>
        )}
      </section>

      {/* All Time Favourites */}
      <section className="py-9 border-t border-rule">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-[24px] font-extrabold font-display">All Time Favourites</h2>
            <p className="text-[14px] text-ink-3 mt-1">The journeys that inspired the most</p>
          </div>
          <Link href="/discover?sort=popular" className="text-[14px] text-go-deep hover:underline">
            See all →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {allTimeFavourites.map((v) => (
            <VentureCard
              key={v.slug}
              slug={v.slug}
              name={v.name}
              pitch={v.pitch}
              brand={v.brand}
              glyph={v.glyph}
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

        {allTimeFavourites.length === 0 && (
          <p className="text-ink-3 text-center py-10">No favourites yet.</p>
        )}
      </section>

      {/* CTA */}
      <section className="bg-ink text-white rounded-2xl p-10 text-center mb-3">
        <h2 className="text-[30px] font-extrabold font-display text-white">
          Building something?
        </h2>
        <p className="text-[#BDBDBD] mt-[10px] max-w-[46ch] mx-auto">
          Start documenting your journey today. No audience required — just honesty.
        </p>
        <a
          href="/start"
          className="inline-block mt-5 bg-go text-[#00301E] font-semibold px-6 py-3 rounded-full hover:bg-[#04B76B] transition-colors"
        >
          Tell your story
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule py-7 text-[13px] text-ink-3">
        <div className="flex gap-5 flex-wrap items-center">
          <span>Vibed — follow founders from week one</span>
          <span className="ml-auto font-mono">v0.5</span>
        </div>
      </footer>
    </main>
  );
}

import Link from 'next/link';
import { VentureCard, PitchCard } from '@/components/ui';
import { getPublishedVentures } from '@/lib/services/ventures-public';
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
  const ventures = await getPublishedVentures();

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

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6">
      {/* Hero */}
      <section className="py-6 sm:py-11">
        <h1
          className="text-[clamp(26px,4.4vw,50px)] font-black tracking-tight leading-[1.04] max-w-[19ch]"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          The overnight success,
          <br />
          <span className="text-go-deep">filmed daily.</span>
        </h1>
        <p className="text-[15px] sm:text-[17px] text-ink-2 mt-2 sm:mt-[14px] max-w-[52ch]">
          Follow founders from week one. Watch the real story unfold — the breakthroughs, the
          setbacks, and everything they figured out along the way.
        </p>
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

      {/* The Hard Parts */}
      <PillarSection
        pillar="hard_parts"
        ventures={pillarVentures.hard_parts}
        linkHref="/discover?pillar=hard_parts"
        useFullCards
      />

      {/* CTA */}
      <section className="bg-ink text-white rounded-xl sm:rounded-2xl p-6 sm:p-10 text-center mb-3">
        <h2 className="text-[22px] sm:text-[30px] font-extrabold font-display text-white">
          Building something?
        </h2>
        <p className="text-[#BDBDBD] text-[14px] sm:text-base mt-2 sm:mt-[10px] max-w-[46ch] mx-auto">
          Start documenting your venture today. No audience required — just honesty.
        </p>
        <a
          href="/start"
          className="inline-block mt-4 sm:mt-5 bg-go text-[#00301E] font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full hover:bg-[#04B76B] transition-colors text-[14px] sm:text-base"
        >
          Start your venture
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule py-5 sm:py-7 text-[12px] sm:text-[13px] text-ink-3">
        <div className="flex gap-4 sm:gap-5 flex-wrap items-center">
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
    <section className="py-4 sm:py-9 border-t border-rule">
      <div className="flex items-baseline justify-between mb-3 sm:mb-6">
        <div>
          <h2 className="text-[18px] sm:text-[24px] font-extrabold font-display">{title}</h2>
          <p className="text-[12px] sm:text-[14px] text-ink-3 mt-0.5 sm:mt-1">{description}</p>
        </div>
        <Link href={linkHref} className="text-[12px] sm:text-[14px] text-go-deep hover:underline">
          See all →
        </Link>
      </div>

      <div className={`grid ${useFullCards ? 'sm:grid-cols-2' : 'grid-cols-2'} lg:grid-cols-4 gap-3 sm:gap-5`}>
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

      {ventures.length === 0 && (
        <p className="text-ink-3 text-center py-6 sm:py-10">No content yet. Be the first!</p>
      )}
    </section>
  );
}

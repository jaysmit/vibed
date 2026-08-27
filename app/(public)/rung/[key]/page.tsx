import { notFound } from 'next/navigation';
import { Header, VentureCard } from '@/components/ui';
import { getVenturesByRung } from '@/lib/services/ventures-public';
import { RUNGS, type Rung } from '@/lib/domain/rungs';

const RUNG_INFO: Record<Rung, { label: string; description: string }> = {
  idea: { label: 'Idea', description: 'Founders exploring whether this is worth building.' },
  building: { label: 'Building', description: 'Turning the idea into something real.' },
  live: { label: 'Live', description: 'Out in the world, looking for users.' },
  first: { label: 'First dollar', description: 'Someone paid. The first validation that matters.' },
  growing: { label: 'Growing', description: 'Finding what works and doing more of it.' },
  alumni: { label: 'Alumni', description: 'The ones who made it through.' },
};

interface PageProps {
  params: Promise<{ key: string }>;
}

export default async function RungPage({ params }: PageProps) {
  const { key } = await params;

  if (!RUNGS.includes(key as Rung)) {
    notFound();
  }

  const rung = key as Rung;
  const ventures = await getVenturesByRung(rung);
  const info = RUNG_INFO[rung];

  return (
    <>
      <Header />

      <main className="max-w-[1180px] mx-auto px-6 py-10">
        <h1
          className="text-[clamp(28px,4vw,40px)] font-black tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          {info.label}
        </h1>
        <p className="text-[17px] text-ink-2 mt-3 max-w-[56ch]">{info.description}</p>

        {/* Ventures grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[26px] mt-10">
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
            <div className="text-[60px] opacity-20 mb-4">📦</div>
            <h2 className="text-[24px] font-extrabold font-display">No ventures at this stage</h2>
            <p className="text-ink-2 mt-2">Check back soon.</p>
          </div>
        )}
      </main>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { key } = await params;

  if (!RUNGS.includes(key as Rung)) {
    return { title: 'Not Found' };
  }

  const info = RUNG_INFO[key as Rung];
  return {
    title: `${info.label} — Vibed`,
    description: info.description,
  };
}

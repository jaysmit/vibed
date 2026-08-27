import Link from 'next/link';
import { Header, VentureLogo } from '@/components/ui';
import { getClosedVentures } from '@/lib/db/repos';

export const metadata = {
  title: 'Post-mortems — Vibed',
  description: 'What went wrong, and what they learned. Honest retrospectives from founders who closed.',
};

export default async function PostmortemsPage() {
  const ventures = await getClosedVentures();

  return (
    <>
      <Header />

      <main className="max-w-[1180px] mx-auto px-6 py-10">
        {/* Hero */}
        <div className="bg-ink text-white rounded-2xl p-10 mb-[34px]">
          <h1
            className="text-[clamp(27px,4vw,40px)] font-black tracking-tight text-white max-w-[20ch]"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            What went wrong, and what they learned
          </h1>
          <p className="text-[#B4B4B4] mt-3 max-w-[56ch] text-[16px]">
            Not every venture makes it. These founders documented their journeys anyway — and
            shared what they would do differently.
          </p>
        </div>

        {/* Ventures grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[26px]">
          {ventures.map((v) => (
            <Link
              key={v.slug}
              href={`/v/${v.slug}`}
              className="bg-page border border-rule rounded-[14px] overflow-hidden shadow-sm transition-all hover:translate-y-[-4px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)]"
            >
              {/* Poster */}
              <div
                className="relative h-[150px] bg-soft"
                style={{
                  background: `linear-gradient(135deg, ${v.brand}22 0%, transparent 60%)`,
                }}
              >
                <div className="absolute bottom-3 left-3">
                  <VentureLogo glyph={v.glyph} brand={v.brand} size="sm" />
                </div>
              </div>

              {/* Body */}
              <div className="p-[16px_18px_18px]">
                <h3 className="text-[19px] font-bold font-display">{v.name}</h3>
                <p className="text-[15px] leading-relaxed text-ink-2 mt-[9px] border-l-[3px] border-dead pl-[13px]">
                  {v.pitch}
                </p>
                <div className="text-[12px] text-ink-3 mt-3 flex gap-3 flex-wrap">
                  <span>{v.founder.name}</span>
                  <span>·</span>
                  <span>Week {v.counters.weekNumber}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {ventures.length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="text-[60px] opacity-20 mb-4">📖</div>
            <h2 className="text-[24px] font-extrabold font-display">No post-mortems yet</h2>
            <p className="text-ink-2 mt-2">
              Every venture that closes can share their story here.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

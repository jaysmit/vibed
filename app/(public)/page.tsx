import { VentureRail } from '@/components/venture';
import { getPublishedVentures, getFeaturedVenture } from '@/lib/services/ventures-public';

export default async function HomePage() {
  const [ventures, featured] = await Promise.all([
    getPublishedVentures(),
    getFeaturedVenture(),
  ]);

  return (
    <main className="max-w-[1180px] mx-auto px-6">
        {/* Tagline */}
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

          {/* Path stages */}
          <div className="flex items-center gap-[9px] mt-[22px] flex-wrap">
            {['Idea', 'Building', 'Live'].map((stage) => (
              <b
                key={stage}
                className="text-[11.5px] font-semibold tracking-wide uppercase text-ink-2 bg-page border border-rule rounded-full px-[13px] py-1.5 whitespace-nowrap"
              >
                {stage}
              </b>
            ))}
            <i className="text-rule-2 text-[13px]">→</i>
            {['First dollar', 'Growing', 'Alumni'].map((stage) => (
              <b
                key={stage}
                className="text-[11.5px] font-semibold tracking-wide uppercase text-go-deep bg-go-tint border border-go-tint rounded-full px-[13px] py-1.5 whitespace-nowrap"
              >
                {stage}
              </b>
            ))}
          </div>
        </section>

        {/* Featured venture */}
        {featured && (
          <section className="py-9 border-t border-rule">
            <div className="text-[11px] tracking-[0.13em] uppercase font-bold text-go-deep mb-4">
              Featured journey
            </div>
            <div className="grid md:grid-cols-[1.5fr_1fr] gap-9 items-start">
              {/* Featured poster */}
              <div
                className="relative h-[352px] rounded-2xl overflow-hidden bg-soft border border-rule"
                style={{
                  background: `linear-gradient(135deg, ${featured.brand}22 0%, transparent 60%)`,
                }}
              >
                <div className="absolute bottom-4 left-4 z-[3]">
                  <div
                    className="w-[42px] h-[42px] rounded-[13px] grid place-items-center shadow-lg"
                    style={{ background: featured.brand }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-[21px] h-[21px]"
                      style={{
                        stroke: '#fff',
                        fill: 'none',
                        strokeWidth: 1.9,
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                      }}
                    >
                      <path d="M4 10v4M8.5 6.5v11M13 3v18M17.5 7.5v9M21 10.5v3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Featured info */}
              <div>
                <h2
                  className="text-[40px] font-black tracking-tight leading-[1.1] mt-1"
                  style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
                >
                  {featured.name}
                </h2>
                <p className="text-[16.5px] text-ink-2 mt-[9px]">{featured.pitch}</p>

                {/* Quick stats chips */}
                <div className="flex flex-col gap-[7px] mt-[18px]">
                  <a
                    href={`/v/${featured.slug}`}
                    className="flex gap-[10px] items-center bg-page border border-rule rounded-full px-[14px] py-2 text-[13.5px] hover:border-ink hover:translate-x-[3px] transition-all"
                  >
                    <span>📖</span>
                    <span>Read the journey</span>
                    <span className="ml-auto font-mono text-[11px] text-ink-3">
                      {Object.keys(featured.segments || {}).length} segments
                    </span>
                  </a>
                  <a
                    href={`/v/${featured.slug}#clips`}
                    className="flex gap-[10px] items-center bg-page border border-rule rounded-full px-[14px] py-2 text-[13.5px] hover:border-ink hover:translate-x-[3px] transition-all"
                  >
                    <span>🎬</span>
                    <span>Watch the clips</span>
                    <span className="ml-auto font-mono text-[11px] text-ink-3">
                      {featured.counters.clips} clips
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Ventures grid */}
        <section className="py-[42px] border-t border-rule">
          <div className="flex items-baseline gap-[14px] mb-6 flex-wrap">
            <h2 className="text-[27px] font-extrabold font-display">All journeys</h2>
            <span className="text-[14px] text-ink-3">{ventures.length} founders building in public</span>
          </div>

          <VentureRail ventures={ventures} rail="all-journeys" />

          {ventures.length === 0 && (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="text-[60px] opacity-20 mb-4">📦</div>
              <h2 className="text-[28px] font-extrabold font-display">No ventures yet</h2>
              <p className="text-ink-2 mt-2 text-[15.5px]">
                Be the first to share your journey.
              </p>
              <a
                href="/start"
                className="inline-block mt-6 bg-go text-[#00301E] font-semibold px-6 py-3 rounded-full hover:bg-[#04B76B] transition-colors"
              >
                Tell your story
              </a>
            </div>
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

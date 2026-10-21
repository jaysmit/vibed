export default function Loading() {
  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6">
      {/* Hero - static content, loads immediately */}
      <section className="py-5 sm:py-8">
        {/* Mobile layout */}
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
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span className="text-[12px] font-medium text-white/90 mt-2">Learn what we&apos;re about</span>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden sm:block">
          <div className="flex items-stretch gap-12">
            <div className="w-1/2 pr-4">
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
            <div className="w-1/2 pl-4">
              <div className="h-full bg-ink rounded-xl overflow-hidden relative group cursor-pointer aspect-video">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
        </div>
      </section>

      {/* Trending Ventures - static heading */}
      <section className="py-3 sm:py-5 border-t border-rule">
        <div className="flex items-baseline justify-between mb-2 sm:mb-4">
          <div>
            <h2 className="text-[16px] sm:text-[22px] font-extrabold font-display">Trending Ventures</h2>
            <p className="text-[11px] sm:text-[13px] text-ink-3 mt-0.5">The ones everyone&apos;s watching</p>
          </div>
          <span className="text-[11px] sm:text-[13px] text-go-deep">See all →</span>
        </div>
        <div className="flex gap-2.5 sm:gap-4 overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-[220px] sm:w-[300px] flex-shrink-0">
              <div className="aspect-video bg-rule/40 rounded-xl animate-pulse mb-2" />
              <div className="h-5 w-3/4 bg-rule/50 rounded animate-pulse mb-1" />
              <div className="h-4 w-full bg-rule/40 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Other sections - static headings */}
      {[
        { title: 'Trending Elevator Pitches', desc: 'The best pitches right now' },
        { title: 'Spark & Validation', desc: 'How the idea started and got validated' },
        { title: 'Building the Product', desc: 'Development, prototypes, and beta' },
      ].map((section, i) => (
        <section key={i} className="py-3 sm:py-5 border-t border-rule">
          <div className="flex items-baseline justify-between mb-2 sm:mb-4">
            <div>
              <h2 className="text-[16px] sm:text-[22px] font-extrabold font-display">{section.title}</h2>
              <p className="text-[11px] sm:text-[13px] text-ink-3 mt-0.5">{section.desc}</p>
            </div>
            <span className="text-[11px] sm:text-[13px] text-go-deep">See all →</span>
          </div>
          <div className="flex gap-2.5 sm:gap-4 overflow-hidden -mx-4 px-4 sm:-mx-6 sm:px-6">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="w-[160px] sm:w-[200px] flex-shrink-0">
                <div className="aspect-square bg-rule/40 rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-rule/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

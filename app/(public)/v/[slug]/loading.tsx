// Loading skeleton for venture page - shows instantly while data loads
export default function VentureLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="bg-page border-b border-rule">
        <div className="max-w-[1180px] mx-auto">
          <div className="hidden sm:flex">
            {/* Cover placeholder - more visible */}
            <div className="w-1/2 h-[280px] bg-rule/40 animate-pulse" />
            {/* Info placeholder */}
            <div className="w-1/2 px-6 py-8 flex flex-col justify-center">
              <div className="h-8 w-48 bg-rule/50 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-rule/50 rounded animate-pulse mb-4" />
              <div className="flex gap-2">
                <div className="h-10 w-28 bg-ink/20 rounded-lg animate-pulse" />
                <div className="h-10 w-24 bg-rule/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          {/* Mobile */}
          <div className="sm:hidden">
            <div className="w-full h-[200px] bg-rule/40 animate-pulse" />
            <div className="px-4 py-6">
              <div className="h-6 w-40 bg-rule/50 rounded animate-pulse mb-2" />
              <div className="h-4 w-56 bg-rule/50 rounded animate-pulse mb-4" />
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-ink/20 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar - static labels */}
      <div className="bg-page border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-3 space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] sm:text-[12px]">
            <span className="text-ink-3 font-medium">Links:</span>
            <div className="h-5 w-32 bg-rule/50 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] sm:text-[12px]">
            <span className="text-ink-3">Week</span>
            <div className="h-4 w-8 bg-rule/50 rounded animate-pulse" />
            <div className="h-4 w-16 bg-rule/50 rounded animate-pulse" />
            <span className="text-ink-3">followers</span>
            <div className="h-4 w-12 bg-rule/50 rounded animate-pulse" />
            <span className="text-ink-3">clips</span>
          </div>
        </div>
      </div>

      {/* Elevator pitch section - static heading */}
      <div className="bg-soft border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
            <div className="flex-1">
              <h2 className="text-[12px] font-semibold text-ink-3 uppercase tracking-wide mb-4">
                Elevator Pitch
              </h2>
              <div className="space-y-2">
                <div className="h-4 w-full bg-rule/50 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-rule/50 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-rule/50 rounded animate-pulse" />
              </div>
            </div>
            <div className="lg:w-[55%]">
              <div className="aspect-video bg-rule/40 rounded-xl animate-pulse flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink-3/50">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content section - static heading */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6">
        <h2 className="text-[18px] sm:text-[20px] font-bold tracking-tight mb-4"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}>
          The Journey
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-rule/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </>
  );
}

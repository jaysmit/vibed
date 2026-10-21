export default function Loading() {
  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header - static content */}
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-[26px] sm:text-[32px] font-black tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Discover
        </h1>
        <p className="text-ink-2 text-[14px] sm:text-[16px] mt-1 sm:mt-2">
          Find founders building in public, filtered your way.
        </p>
      </div>

      {/* Filters - static labels with loading state */}
      <div className="flex gap-2 flex-wrap mb-6">
        <span className="text-[13px] text-ink-3 mr-2">Sort:</span>
        <div className="h-8 w-24 bg-rule/60 rounded-full animate-pulse" />
        <span className="text-[13px] text-ink-3 ml-4 mr-2">Stage:</span>
        <div className="h-8 w-20 bg-rule/60 rounded-full animate-pulse" />
        <span className="text-[13px] text-ink-3 ml-4 mr-2">Industry:</span>
        <div className="h-8 w-24 bg-rule/60 rounded-full animate-pulse" />
      </div>

      {/* Results count - loading */}
      <div className="mb-4 sm:mb-6">
        <span className="text-[13px] sm:text-[14px] text-ink-3">
          Loading ventures...
        </span>
      </div>

      {/* Grid skeleton - more visible */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-page border border-rule rounded-xl overflow-hidden">
            <div className="aspect-video bg-rule/50 animate-pulse" />
            <div className="p-4">
              <div className="h-5 w-3/4 bg-rule/50 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-rule/50 rounded animate-pulse mb-1" />
              <div className="h-4 w-2/3 bg-rule/50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

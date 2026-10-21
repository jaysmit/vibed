export default function Loading() {
  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Profile header - avatar loading */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-rule/40 animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <div className="h-8 w-48 bg-rule/50 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-rule/40 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-rule/40 rounded animate-pulse mb-4" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 bg-rule/50 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Bio section - static heading */}
      <div className="mb-8">
        <h2 className="text-[14px] font-semibold text-ink-3 uppercase tracking-wide mb-3">About</h2>
        <div className="h-4 w-full bg-rule/40 rounded animate-pulse mb-2" />
        <div className="h-4 w-full bg-rule/40 rounded animate-pulse mb-2" />
        <div className="h-4 w-2/3 bg-rule/40 rounded animate-pulse" />
      </div>

      {/* Ventures section - static heading */}
      <div>
        <h2 className="text-[18px] font-bold mb-4">Ventures</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-page border border-rule rounded-xl overflow-hidden">
              <div className="aspect-video bg-rule/40 animate-pulse" />
              <div className="p-4">
                <div className="h-5 w-3/4 bg-rule/50 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-rule/40 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

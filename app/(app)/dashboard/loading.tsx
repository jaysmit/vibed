export default function Loading() {
  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header - static */}
      <div className="mb-8">
        <h1
          className="text-[26px] sm:text-[32px] font-black tracking-tight"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          Dashboard
        </h1>
        <p className="text-ink-2 text-[14px] sm:text-[16px] mt-1">
          Manage your ventures and track progress.
        </p>
      </div>

      {/* Quick actions - static buttons */}
      <div className="flex gap-3 mb-8">
        <div className="h-10 px-4 bg-go/20 rounded-lg flex items-center">
          <span className="text-[13px] font-semibold text-go-deep">+ New Venture</span>
        </div>
        <div className="h-10 w-28 bg-rule/50 rounded-lg animate-pulse" />
      </div>

      {/* Ventures grid - static heading */}
      <h2 className="text-[18px] font-bold mb-4">Your Ventures</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-page border border-rule rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-rule/40 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-rule/50 rounded animate-pulse mb-1" />
                <div className="h-3 w-20 bg-rule/40 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-4 w-full bg-rule/40 rounded animate-pulse mb-2" />
            <div className="h-4 w-3/4 bg-rule/40 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}

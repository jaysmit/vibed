// Loading skeleton for venture page - shows instantly while data loads
export default function VentureLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className="bg-page border-b border-rule">
        <div className="max-w-[1180px] mx-auto">
          <div className="hidden sm:flex">
            {/* Cover placeholder */}
            <div className="w-1/2 h-[280px] bg-soft animate-pulse" />
            {/* Info placeholder */}
            <div className="w-1/2 px-6 py-8 flex flex-col justify-center">
              <div className="h-8 w-48 bg-soft rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-soft rounded animate-pulse mb-4" />
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-soft rounded-lg animate-pulse" />
                <div className="h-10 w-20 bg-soft rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          {/* Mobile */}
          <div className="sm:hidden">
            <div className="w-full h-[200px] bg-soft animate-pulse" />
            <div className="px-4 py-6">
              <div className="h-6 w-40 bg-soft rounded animate-pulse mb-2" />
              <div className="h-4 w-56 bg-soft rounded animate-pulse mb-4" />
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-soft rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar skeleton */}
      <div className="bg-page border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-16 bg-soft rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Elevator pitch skeleton */}
      <div className="bg-soft border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
            <div className="flex-1">
              <div className="h-4 w-24 bg-rule rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-rule rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-rule rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-rule rounded animate-pulse" />
              </div>
            </div>
            <div className="lg:w-[55%]">
              <div className="aspect-video bg-rule rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6">
        <div className="h-6 w-32 bg-soft rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-soft rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </>
  );
}

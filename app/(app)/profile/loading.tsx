import { cookies } from 'next/headers';
import { Avatar } from '@/components/ui';
import Link from 'next/link';

interface CachedProfile {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  headline?: string;
  location?: string;
}

async function getCachedProfile(): Promise<CachedProfile | null> {
  try {
    const cookieStore = await cookies();
    const profileCookie = cookieStore.get('vibed_profile');
    if (!profileCookie?.value) return null;
    return JSON.parse(decodeURIComponent(profileCookie.value));
  } catch {
    return null;
  }
}

export default async function Loading() {
  const cachedProfile = await getCachedProfile();

  return (
    <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Profile header - shows cached data if available */}
      {cachedProfile ? (
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
          <Avatar
            name={cachedProfile.name}
            imageUrl={cachedProfile.avatar}
            size="profile"
            color="#1F6F5C"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1
                className="text-[22px] sm:text-[32px] font-black tracking-tight"
                style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
              >
                {cachedProfile.name}
              </h1>
              <div className="w-4 h-4 border-2 border-rule border-t-go rounded-full animate-spin" />
            </div>
            {cachedProfile.headline && (
              <p className="text-[14px] sm:text-[16px] text-ink-2 mt-1">{cachedProfile.headline}</p>
            )}
            {cachedProfile.location && (
              <p className="text-[13px] text-ink-3 mt-1 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {cachedProfile.location}
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <Link
                href="/settings"
                className="text-[13px] font-semibold bg-ink text-white px-4 py-2 rounded-lg"
              >
                Edit Profile
              </Link>
              <Link
                href={`/founder/${cachedProfile.slug}`}
                className="text-[13px] font-semibold border border-rule px-4 py-2 rounded-lg"
              >
                View Public Profile
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-rule/40 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-48 bg-rule/50 rounded animate-pulse" />
              <div className="w-4 h-4 border-2 border-rule border-t-go rounded-full animate-spin" />
            </div>
            <div className="h-4 w-64 bg-rule/40 rounded animate-pulse mb-4" />
            <div className="flex gap-2">
              <div className="h-9 w-24 bg-rule/50 rounded-lg animate-pulse" />
              <div className="h-9 w-32 bg-rule/50 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Stats - static labels */}
      <div className="flex gap-8 mb-8 pb-6 border-b border-rule">
        <div className="text-center">
          <div className="h-7 w-8 bg-rule/50 rounded animate-pulse mb-1 mx-auto" />
          <span className="text-[12px] text-ink-3">ventures</span>
        </div>
        <div className="text-center">
          <div className="h-7 w-8 bg-rule/50 rounded animate-pulse mb-1 mx-auto" />
          <span className="text-[12px] text-ink-3">clips</span>
        </div>
        <div className="text-center">
          <div className="h-7 w-8 bg-rule/50 rounded animate-pulse mb-1 mx-auto" />
          <span className="text-[12px] text-ink-3">following</span>
        </div>
      </div>

      {/* Ventures section - static heading */}
      <div className="mb-8">
        <h2 className="text-[18px] font-bold mb-4">Your Ventures</h2>
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

      {/* Following section - static heading */}
      <div>
        <h2 className="text-[18px] font-bold mb-4">Following</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-rule/30 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}

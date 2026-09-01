import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { getVenturesByFounderUserId } from '@/lib/services/ventures';
import { VentureLogo, ProgressRingCompact } from '@/components/ui';
import { calculateCompletion } from '@/lib/domain/standards';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const ventures = await getVenturesByFounderUserId(userId);

  return (
    <main className="max-w-[1000px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-[32px] font-black tracking-tight"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            Dashboard
          </h1>
          <p className="text-ink-2 text-[15px] mt-1">
            Manage your ventures
          </p>
        </div>
        <Link
          href="/start"
          className="bg-go text-[#00301E] font-semibold px-5 py-2.5 rounded-full text-[14px] hover:bg-[#04B76B] transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New venture
        </Link>
      </div>

      {ventures.length > 0 ? (
        <div className="space-y-4">
          {ventures.map((venture) => {
            const completion = calculateCompletion(venture);
            const isDraft = venture.status === 'draft';

            return (
              <Link
                key={venture._id}
                href={`/v/${venture.slug}`}
                className="block bg-page border border-rule rounded-xl p-5 hover:border-ink-3 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <VentureLogo
                    glyph={venture.glyph}
                    brand={venture.brand}
                    size="md"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-[18px] font-bold truncate">{venture.name}</h2>
                      {isDraft ? (
                        <span className="px-2 py-0.5 rounded-full bg-warn-tint text-warn text-[11px] font-semibold">
                          Draft
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-go-tint text-go-deep text-[11px] font-semibold">
                          Live
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-ink-2 mt-1 line-clamp-1">{venture.pitch}</p>

                    {/* Stats row */}
                    <div className="flex items-center gap-6 mt-3 text-[13px]">
                      <div>
                        <span className="text-ink-3">Week</span>{' '}
                        <span className="font-mono font-bold">{venture.counters.weekNumber}</span>
                      </div>
                      <div>
                        <span className="text-ink-3">Followers</span>{' '}
                        <span className="font-mono font-bold">{venture.counters.followers}</span>
                      </div>
                      <div>
                        <span className="text-ink-3">Clips</span>{' '}
                        <span className="font-mono font-bold">{venture.counters.clips}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-3">
                    {isDraft && (
                      <ProgressRingCompact percentage={completion.percentage} />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="text-[60px] opacity-20 mb-4">🚀</div>
          <h2
            className="text-[28px] font-extrabold"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            No ventures yet
          </h2>
          <p className="text-ink-2 mt-2 text-[15px]">
            Start documenting your founder journey. Share your story from day one.
          </p>
          <Link
            href="/start"
            className="inline-block mt-6 bg-go text-[#00301E] font-semibold px-6 py-3 rounded-full hover:bg-[#04B76B] transition-colors"
          >
            Start your venture
          </Link>
        </div>
      )}

      {/* Quick links */}
      {ventures.length > 0 && (
        <div className="mt-10 pt-6 border-t border-rule">
          <h3 className="text-[14px] font-semibold text-ink-3 mb-4">Quick Links</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/profile" className="text-[14px] text-go-deep hover:underline">
              Edit profile →
            </Link>
            <Link href="/following" className="text-[14px] text-go-deep hover:underline">
              Ventures you follow →
            </Link>
            <Link href="/discover" className="text-[14px] text-go-deep hover:underline">
              Discover ventures →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

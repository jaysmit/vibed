import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { Avatar, VentureCard, RungTag } from '@/components/ui';

export default async function ProfilePage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/login');
  }

  const supabase = await createAdminClient();

  // Get founder profile
  const { data: founder } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!founder) {
    redirect('/register');
  }

  // Get user's ventures
  const { data: ventures } = await supabase
    .from('ventures')
    .select('*')
    .eq('founder_id', founder.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Get followed ventures
  const { data: follows } = await supabase
    .from('follows')
    .select('venture_id')
    .eq('user_id', userId);

  const followedVentureIds = follows?.map((f) => f.venture_id) || [];

  // Get followed venture details
  let followedVentures: typeof ventures = [];
  if (followedVentureIds.length > 0) {
    const { data } = await supabase
      .from('ventures')
      .select('*, founders(name, slug)')
      .in('id', followedVentureIds)
      .eq('status', 'live')
      .is('deleted_at', null)
      .limit(6);
    followedVentures = data || [];
  }

  // Get recent activity (clips endorsed, ventures followed)
  const { data: recentActivity } = await supabase
    .from('events')
    .select('type, venture_id, clip_id, created_at, meta')
    .eq('actor_id', userId)
    .in('type', ['clip.like', 'follow.created', 'clip.view_start'])
    .order('created_at', { ascending: false })
    .limit(10);

  // Get venture details for activity
  const activityVentureIds = [...new Set(recentActivity?.map((a) => a.venture_id).filter(Boolean) || [])];
  let activityVentures: Record<string, { name: string; slug: string }> = {};
  if (activityVentureIds.length > 0) {
    const { data } = await supabase
      .from('ventures')
      .select('id, name, slug')
      .in('id', activityVentureIds);
    activityVentures = Object.fromEntries((data || []).map((v) => [v.id, { name: v.name, slug: v.slug }]));
  }

  const hasVentures = ventures && ventures.length > 0;
  const hasFollowing = followedVentures && followedVentures.length > 0;
  const hasActivity = recentActivity && recentActivity.length > 0;

  return (
    <main className="max-w-[900px] mx-auto px-6 py-10">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-10">
        <Avatar name={founder.name} size="xl" color="#1F6F5C" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1
              className="text-[32px] font-black tracking-tight"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              {founder.name}
            </h1>
            <Link
              href="/settings"
              className="p-2 rounded-lg border border-rule hover:bg-soft transition-colors"
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
          {founder.headline && (
            <p className="text-ink-2 text-[16px] mt-1">{founder.headline}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-[14px] text-ink-3">
            {founder.location && (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {founder.location}
              </span>
            )}
            <span>Joined {new Date(founder.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>
          </div>
          {founder.bio && (
            <p className="text-[15px] text-ink-2 mt-4 leading-relaxed max-w-[600px]">{founder.bio}</p>
          )}
        </div>
      </div>

      {/* Your Ventures */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold">Your Ventures</h2>
          <Link
            href="/start"
            className="text-[13px] font-semibold text-go-deep hover:underline flex items-center gap-1"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New venture
          </Link>
        </div>

        {hasVentures ? (
          <div className="grid gap-4">
            {ventures.map((v) => (
              <Link
                key={v.id}
                href={`/v/${v.slug}`}
                className="block bg-page border border-rule rounded-xl p-5 hover:border-ink/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[18px] font-bold">{v.name}</h3>
                      <RungTag rung={v.rung} />
                      {v.status === 'draft' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-warn-tint text-warn rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-ink-2 line-clamp-2">{v.pitch}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-[13px] text-ink-3">
                      {v.counters?.followers || 0} followers
                    </div>
                    <div className="text-[12px] text-ink-3 mt-1">
                      {v.counters?.clips || 0} clips
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-soft border border-rule rounded-xl p-8 text-center">
            <p className="text-ink-2 mb-4">You haven&apos;t started any ventures yet.</p>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-6 py-3 bg-go text-[#00301E] font-semibold rounded-full hover:bg-[#04B76B] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Start your first venture
            </Link>
          </div>
        )}
      </section>

      {/* Following */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold">Following</h2>
          <Link href="/following" className="text-[13px] text-go-deep hover:underline">
            View all →
          </Link>
        </div>

        {hasFollowing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {followedVentures.slice(0, 4).map((v) => {
              const founderData = v.founders as { name: string; slug: string } | { name: string; slug: string }[] | null;
              const founderInfo = Array.isArray(founderData) ? founderData[0] : founderData;
              return (
                <Link
                  key={v.id}
                  href={`/v/${v.slug}`}
                  className="block bg-page border border-rule rounded-xl p-4 hover:border-ink/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[16px] font-bold truncate">{v.name}</h3>
                    <RungTag rung={v.rung} />
                  </div>
                  <p className="text-[13px] text-ink-2 line-clamp-1 mb-2">{v.pitch}</p>
                  <p className="text-[12px] text-ink-3">by {founderInfo?.name || 'Unknown'}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-soft border border-rule rounded-xl p-6 text-center">
            <p className="text-ink-2 text-[14px] mb-3">You&apos;re not following any ventures yet.</p>
            <Link href="/discover" className="text-[13px] text-go-deep font-semibold hover:underline">
              Discover ventures →
            </Link>
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-[20px] font-bold mb-4">Your Activity</h2>

        {hasActivity ? (
          <div className="space-y-3">
            {recentActivity.map((activity, i) => {
              const venture = activity.venture_id ? activityVentures[activity.venture_id] : null;
              const timeAgo = getTimeAgo(activity.created_at);

              let icon: React.ReactNode;
              let text: string;

              switch (activity.type) {
                case 'clip.like':
                  icon = (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-go">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  );
                  text = venture ? `Endorsed a clip from ${venture.name}` : 'Endorsed a clip';
                  break;
                case 'follow.created':
                  icon = (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-heat">
                      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  );
                  text = venture ? `Started following ${venture.name}` : 'Followed a venture';
                  break;
                case 'clip.view_start':
                  icon = (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-3">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  );
                  text = venture ? `Watched a clip from ${venture.name}` : 'Watched a clip';
                  break;
                default:
                  return null;
              }

              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-page border border-rule rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-soft flex items-center justify-center">
                    {icon}
                  </div>
                  <div className="flex-1">
                    {venture ? (
                      <Link href={`/v/${venture.slug}`} className="text-[14px] hover:underline">
                        {text}
                      </Link>
                    ) : (
                      <span className="text-[14px]">{text}</span>
                    )}
                  </div>
                  <span className="text-[12px] text-ink-3">{timeAgo}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-soft border border-rule rounded-xl p-6 text-center">
            <p className="text-ink-2 text-[14px]">No recent activity. Start exploring ventures!</p>
          </div>
        )}
      </section>
    </main>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}

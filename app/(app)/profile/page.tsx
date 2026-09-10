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

  // Get user's ventures with founder info for VentureCard
  const { data: ventures } = await supabase
    .from('ventures')
    .select('*')
    .eq('founder_id', founder.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Get user's clips from their ventures
  const ventureIds = ventures?.map(v => v.id) || [];
  let userClips: Array<{
    id: string;
    playback_id: string | null;
    title: string;
    thumbTime: number;
    segment_key: string;
    counters: { views: number; endorsements: number };
    created_at: string;
    venture: { name: string; slug: string };
  }> = [];

  if (ventureIds.length > 0) {
    const { data: clips } = await supabase
      .from('clips')
      .select('id, playback_id, title, thumbTime, segment_key, counters, created_at, venture_id')
      .in('venture_id', ventureIds)
      .eq('status', 'ready')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8);

    // Map clips with venture info
    const ventureMap = Object.fromEntries((ventures || []).map(v => [v.id, { name: v.name, slug: v.slug }]));
    userClips = (clips || []).map(clip => ({
      ...clip,
      counters: (clip.counters as { views: number; endorsements: number }) || { views: 0, endorsements: 0 },
      venture: ventureMap[clip.venture_id] || { name: 'Unknown', slug: '' },
    }));
  }

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
  const hasClips = userClips && userClips.length > 0;
  const hasFollowing = followedVentures && followedVentures.length > 0;
  const hasActivity = recentActivity && recentActivity.length > 0;

  return (
    <main className="max-w-[900px] mx-auto px-6 py-10">
      {/* Profile header */}
      <div className="relative group flex items-start gap-6 mb-10 p-4 -m-4 rounded-2xl hover:bg-soft/50 transition-colors">
        {/* Edit button - shows on hover */}
        <Link
          href="/settings"
          className="absolute top-4 right-4 p-2 rounded-lg bg-page border border-rule opacity-0 group-hover:opacity-100 hover:bg-soft hover:border-ink/30 transition-all flex items-center gap-1.5 text-[12px] font-medium text-ink-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit profile
        </Link>

        <div className="relative flex-shrink-0">
          <Avatar name={founder.name} imageUrl={founder.links?.avatar} size="profile" color="#1F6F5C" />
          <Link
            href="/settings"
            className="absolute bottom-2 right-2 p-2 rounded-full bg-page border border-rule hover:bg-soft hover:border-ink/30 transition-all shadow-md"
            title="Edit photo"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>
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
          {founder.headline ? (
            <p className="text-ink-2 text-[16px] mt-1">{founder.headline}</p>
          ) : (
            <Link href="/settings" className="text-ink-3 text-[14px] mt-1 hover:text-go-deep hover:underline inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add headline
            </Link>
          )}
          <div className="flex items-center gap-4 mt-3 text-[14px] text-ink-3">
            {founder.location ? (
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {founder.location}
              </span>
            ) : (
              <Link href="/settings" className="hover:text-go-deep hover:underline inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add location
              </Link>
            )}
            <span>Joined {new Date(founder.created_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>
          </div>
          {founder.bio ? (
            <p className="text-[15px] text-ink-2 mt-4 leading-relaxed max-w-[600px]">{founder.bio}</p>
          ) : (
            <Link href="/settings" className="text-ink-3 text-[14px] mt-4 hover:text-go-deep hover:underline inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add bio
            </Link>
          )}

          {/* Social links */}
          {(founder.links?.website || founder.links?.linkedin || founder.links?.twitter || founder.links?.instagram || founder.links?.tiktok) ? (
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {founder.links?.website && (
                <a href={founder.links.website} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-2 hover:text-go-deep flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                  Website
                </a>
              )}
              {founder.links?.linkedin && (
                <a href={founder.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-2 hover:text-go-deep flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              )}
              {founder.links?.twitter && (
                <a href={founder.links.twitter} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-2 hover:text-go-deep flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X
                </a>
              )}
              {founder.links?.instagram && (
                <a href={founder.links.instagram} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-2 hover:text-go-deep flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
              )}
              {founder.links?.tiktok && (
                <a href={founder.links.tiktok} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink-2 hover:text-go-deep flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  TikTok
                </a>
              )}
            </div>
          ) : (
            <Link href="/settings" className="text-ink-3 text-[14px] mt-4 hover:text-go-deep hover:underline inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add social links
            </Link>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ventures.map((v) => (
              <div key={v.id} className="relative group">
                {/* Edit button overlay */}
                <Link
                  href={`/v/${v.slug}/edit`}
                  className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/90 backdrop-blur-sm border border-rule opacity-0 group-hover:opacity-100 hover:bg-soft transition-all shadow-sm"
                  title="Edit venture"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </Link>
                {v.status === 'draft' && (
                  <div className="absolute top-3 left-3 z-10 text-[11px] font-semibold px-2 py-0.5 bg-warn text-white rounded shadow-sm">
                    Draft
                  </div>
                )}
                <VentureCard
                  slug={v.slug}
                  name={v.name}
                  pitch={v.pitch}
                  brand={v.brand}
                  rung={v.rung}
                  status={v.status}
                  poster={(v.links as Record<string, string>)?.poster}
                  founder={{
                    name: founder.name,
                    slug: founder.slug,
                  }}
                  counters={{
                    followers: v.counters?.followers || 0,
                    clips: v.counters?.clips || 0,
                    weekNumber: v.counters?.weekNumber || 1,
                    streakWeeks: v.counters?.streakWeeks || 0,
                  }}
                />
              </div>
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

      {/* Your Clips */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold">Your Clips</h2>
          {hasVentures && (
            <Link
              href={`/v/${ventures[0].slug}/edit?tab=clips`}
              className="text-[13px] font-semibold text-go-deep hover:underline flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Record clip
            </Link>
          )}
        </div>

        {hasClips ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {userClips.map((clip) => (
              <Link
                key={clip.id}
                href={`/v/${clip.venture.slug}?tab=clips`}
                className="group block bg-page border border-rule rounded-xl overflow-hidden hover:border-ink/30 hover:shadow-md transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-ink">
                  {clip.playback_id ? (
                    <img
                      src={`https://image.mux.com/${clip.playback_id}/thumbnail.webp?time=${clip.thumbTime || 0}&width=400`}
                      alt={clip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-3">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                  {/* Views badge */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    {clip.counters.views}
                  </div>
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <h4 className="text-[13px] font-semibold line-clamp-1">{clip.title}</h4>
                  <p className="text-[11px] text-ink-3 mt-0.5">{clip.venture.name}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-soft border border-rule rounded-xl p-6 text-center">
            <p className="text-ink-2 text-[14px] mb-3">You haven&apos;t recorded any clips yet.</p>
            {hasVentures && (
              <Link
                href={`/v/${ventures[0].slug}/edit?tab=clips`}
                className="text-[13px] text-go-deep font-semibold hover:underline"
              >
                Record your first clip →
              </Link>
            )}
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

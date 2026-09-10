import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { RungTag, PromiseClock, Avatar, OwnerSettings, VentureCompletionControls, JourneyAccordion, FollowButton, CheerButton, CommentButton, OwnerActionBar, ShareButton, LikeButton, VentureEndorseButton } from '@/components/ui';
import { VideoPlayer } from '@/components/ui/VideoPlayerLazy';
import { calculateEngagementItems } from '@/lib/domain/engagement';
import { getVentureBySlug, getVentureTeam } from '@/lib/services/ventures-public';
import { getClipsByVenture } from '@/lib/services/clips-public';
import { getCurrentUserIdFast } from '@/lib/supabase/auth';
// Follow state now fetched client-side by FollowButton for faster page loads
import { type SegmentKey, RUNGS, type Rung } from '@/lib/domain/rungs';
import { INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';
import { TimelineProgress } from '@/components/ui/TimelineProgress';
import { calculateCompletion } from '@/lib/domain/standards';
import { VentureContentTabs } from './VentureContentTabs';
import { ElevatorPitchEditable } from './ElevatorPitchEditable';
import { ClipsGrid } from './ClipsGrid';

// Segment definitions with stage groupings
const SEGMENTS: { k: SegmentKey; t: string; p: string; stage: Rung }[] = [
  { k: 'pitch', t: 'The elevator pitch', p: 'What it is, in thirty seconds.', stage: 'idea' },
  { k: 'spark', t: 'The spark', p: 'The moment the problem became worth solving.', stage: 'idea' },
  { k: 'validation', t: 'Validation', p: 'Who you talked to before building anything.', stage: 'idea' },
  { k: 'audience', t: 'Building an audience', p: 'The waitlist, the shortlist, the first people watching.', stage: 'building' },
  { k: 'proto', t: 'Prototype', p: 'The first ugly version.', stage: 'building' },
  { k: 'build', t: 'Development', p: 'Building the real thing.', stage: 'building' },
  { k: 'beta', t: 'Private beta', p: 'First testers and what they broke.', stage: 'live' },
  { k: 'gtm', t: 'Go to market', p: 'Kickstarter, pre-orders, launch strategy.', stage: 'live' },
  { k: 'launch', t: 'Launch day', p: 'What actually happened.', stage: 'live' },
  { k: 'first', t: 'First sale', p: 'The first time a stranger paid.', stage: 'first' },
  { k: 'channel', t: 'Finding a channel', p: 'The thing that started working repeatedly.', stage: 'growing' },
  { k: 'trouble', t: 'What nearly killed it', p: 'The setback you did not see coming.', stage: 'growing' },
  { k: 'money', t: 'Money and runway', p: 'How you are paying for this.', stage: 'growing' },
  { k: 'team', t: 'Getting help', p: 'First hire, contractor or co-founder.', stage: 'growing' },
  { k: 'scale', t: 'Small to big', p: 'What broke when it grew.', stage: 'growing' },
  { k: 'next', t: 'What is next', p: 'The part not written yet.', stage: 'alumni' },
];

const RUNG_LABELS: Record<Rung, string> = {
  idea: 'Idea',
  building: 'Building',
  live: 'Live',
  first: 'First Dollar',
  growing: 'Growing',
  alumni: 'Alumni',
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function VentureProfilePage({ params }: PageProps) {
  const { slug } = await params;

  // Parallel: fetch user and venture at the same time
  // Using getCurrentUserIdFast for speed (local JWT check, no network request)
  const [userId, venture] = await Promise.all([
    getCurrentUserIdFast(),
    getVentureBySlug(slug, null), // Don't pass userId here, check draft access below
  ]);

  if (!venture) {
    notFound();
  }

  // Handle slug redirects
  if ('_redirect' in venture && venture._redirect) {
    redirect(`/v/${venture._redirect}`);
  }

  const isDead = venture.status === 'closed';
  const isOwner = userId && venture.founder.user_id === userId;

  // Draft ventures return 404 for non-owners
  if (venture.status === 'draft' && !isOwner) {
    notFound();
  }

  // Calculate completion for owner view
  const completion = isOwner ? calculateCompletion(venture) : null;

  // Fetch clips and team in parallel - follow status now fetched client-side by FollowButton
  const [allClips, teamMembers] = await Promise.all([
    getClipsByVenture(venture.id),
    getVentureTeam(venture.id),
  ]);

  // Get pitch clip from allClips instead of separate query
  const pitchClip = allClips.find(clip => clip.segment_key === 'pitch') || null;

  // Create a map of clips by segment key for easy lookup
  const clipsBySegment = new Map(
    allClips.map(clip => [clip.segment_key, clip])
  );

  // Get segments
  const segments = venture.segments || {};

  // Get written segments sorted by when they happened (happenedAt) for timeline order
  const writtenSegments = SEGMENTS
    .map((seg) => {
      const content = segments instanceof Map ? segments.get(seg.k) : segments[seg.k];
      return { ...seg, content };
    })
    .filter((seg) => seg.content?.body)
    .sort((a, b) => {
      // Sort by happenedAt first (most recent first), then by updatedAt as fallback
      const dateA = new Date(a.content?.happenedAt || a.content?.updatedAt || a.content?.publishedAt || 0);
      const dateB = new Date(b.content?.happenedAt || b.content?.updatedAt || b.content?.publishedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

  // Get the most recently updated segment
  const latestUpdate = writtenSegments[0];

  // Calculate progress through segments
  const totalSegments = SEGMENTS.length;
  const completedSegments = writtenSegments.length;

  // Get current stage and all completed stages
  const currentRungIndex = RUNGS.indexOf(venture.rung);

  // Build stages data for JourneyAccordion
  const stagesData = RUNGS.map((rung, rungIndex) => {
    const stageSegments = SEGMENTS.filter((s) => s.stage === rung);
    const isPast = rungIndex < currentRungIndex;
    const isCurrent = rung === venture.rung;

    return {
      rung,
      label: RUNG_LABELS[rung],
      isCurrent,
      isPast,
      segments: stageSegments.map((seg) => {
        const content = segments instanceof Map ? segments.get(seg.k) : segments[seg.k];
        const clip = clipsBySegment.get(seg.k);

        return {
          key: seg.k,
          number: SEGMENTS.findIndex((s) => s.k === seg.k) + 1,
          title: seg.t,
          subtitle: seg.p,
          content: content?.body,
          happenedAt: content?.happenedAt,  // When this actually happened (for timeline ordering)
          publishedAt: content?.publishedAt,
          updatedAt: content?.updatedAt,
          clip: clip ? {
            playback_id: clip.playback_id,
            title: clip.title,
            thumbTime: clip.thumbTime,
            durationSec: clip.durationSec,
          } : undefined,
        };
      }),
    };
  });

  // Format relative time
  function formatRelativeTime(date: Date | string) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return then.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  }

  return (
    <>
      {/* Draft banner for owners */}
      {isOwner && venture.status === 'draft' && (
        <div id="venture-draft-banner" className="bg-warn-tint border-b border-warn/30 px-4 sm:px-6 py-2 sm:py-3">
          <div className="max-w-[1180px] mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12px] sm:text-[14px] text-warn font-medium min-w-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="truncate">Draft - only you can see this</span>
            </div>
            <Link
              href={`/v/${venture.slug}/edit`}
              className="text-[12px] sm:text-[13px] font-semibold text-warn hover:underline flex-shrink-0"
            >
              Edit
            </Link>
          </div>
        </div>
      )}

      {/* Owner action bar for published ventures */}
      {isOwner && venture.status === 'live' && (() => {
        const engagementData = calculateEngagementItems(venture.slug, {
          segmentsWithContent: writtenSegments.length,
          totalSegments: SEGMENTS.length,
          clipsCount: allClips.length,
          hasPromise: !!venture.promise,
          promisesKept: (venture.counters as Record<string, number>)?.promisesKept || 0,
          followersCount: venture.counters?.followers || 0,
          hasWebsite: !!venture.links?.site,
          hasPoster: !!venture.links?.poster,
          teamSize: teamMembers.length,
        });
        return (
          <OwnerActionBar
            ventureSlug={venture.slug}
            ventureName={venture.name}
            segments={SEGMENTS.map(seg => ({
              key: seg.k,
              title: seg.t,
              hasContent: !!(segments instanceof Map ? segments.get(seg.k) : segments[seg.k])?.body,
              hasClip: clipsBySegment.has(seg.k),
            }))}
            clipsCount={allClips.length}
            hasPromise={!!venture.promise}
            engagementScore={engagementData.totalScore}
            engagementMax={engagementData.maxScore}
            engagementItems={engagementData.items}
          />
        );
      })()}

      {/* Profile Header with Cover Image */}
      <div id="venture-header" className="bg-page border-b border-rule">
        {/* Mobile: Full-width cover image - clickable to website */}
        {venture.links?.poster && (
          venture.links?.site ? (
            <a
              href={venture.links.site.startsWith('http') ? venture.links.site : `https://${venture.links.site}`}
              target="_blank"
              rel="noopener noreferrer"
              id="venture-cover-mobile"
              className="sm:hidden block w-full h-[200px] bg-soft overflow-hidden relative group"
            >
              <img
                src={venture.links.poster}
                alt={`${venture.name} cover`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-ink text-[12px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Visit Website
                </span>
              </div>
            </a>
          ) : (
            <div id="venture-cover-mobile" className="sm:hidden w-full h-[200px] bg-soft overflow-hidden">
              <img
                src={venture.links.poster}
                alt={`${venture.name} cover`}
                className="w-full h-full object-cover"
              />
            </div>
          )
        )}

        <div className="max-w-[1180px] mx-auto">
          {/* Desktop: 50/50 layout with cover and info */}
          <div id="venture-header-desktop" className="hidden sm:flex">
            {/* Cover image - left side, clickable to website */}
            {venture.links?.poster ? (
              venture.links?.site ? (
                <a
                  href={venture.links.site.startsWith('http') ? venture.links.site : `https://${venture.links.site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="venture-cover-image"
                  className="w-1/2 h-[280px] bg-soft overflow-hidden flex-shrink-0 relative group cursor-pointer"
                >
                  <img
                    src={venture.links.poster}
                    alt={`${venture.name} cover`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm text-ink text-[13px] font-semibold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Visit Website
                    </span>
                  </div>
                </a>
              ) : (
                <div id="venture-cover-image" className="w-1/2 h-[280px] bg-soft overflow-hidden flex-shrink-0">
                  <img
                    src={venture.links.poster}
                    alt={`${venture.name} cover`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            ) : (
              <div className="w-1/2 h-[280px] bg-soft flex-shrink-0" />
            )}

            {/* Venture info - right side */}
            <div id="venture-info-desktop" className="w-1/2 px-6 py-8 flex flex-col justify-center">
              {/* Name and stage */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1
                  className="text-[28px] font-black tracking-tight"
                  style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
                >
                  {venture.name}
                </h1>
                <RungTag rung={venture.rung} isDead={isDead} />
              </div>

              {/* Pitch */}
              <p className="text-[14px] text-ink-2 mb-4 line-clamp-2">{venture.pitch}</p>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {/* Visit Website - most prominent for visitors */}
                {venture.links?.site && (
                  <a
                    href={venture.links.site.startsWith('http') ? venture.links.site : `https://${venture.links.site}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[13px] font-semibold bg-ink text-white px-6 py-2 rounded-lg hover:bg-go-deep transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Visit Website
                  </a>
                )}
                {/* Draft ventures: show completion controls to help publish */}
                {isOwner && completion && venture.status === 'draft' && (
                  <VentureCompletionControls
                    ventureId={venture.id}
                    ventureSlug={venture.slug}
                    percentage={completion.percentage}
                    requirements={completion.requirements}
                    stageRequirements={completion.stageRequirements}
                    status={venture.status}
                  />
                )}
                {/* Owner settings always visible */}
                {isOwner && (
                  <OwnerSettings
                    ventureId={venture.id}
                    ventureSlug={venture.slug}
                    ventureName={venture.name}
                    status={venture.status}
                  />
                )}
                {!isOwner && (
                  <>
                    <FollowButton
                      ventureId={venture.id}
                                            className="px-6 py-2 rounded-lg"
                    />
                    <LikeButton
                      ventureId={venture.id}
                      initialCount={venture.counters?.likes || 0}
                    />
                    <VentureEndorseButton
                      ventureId={venture.id}
                      initialCount={venture.counters?.endorsements || 0}
                    />
                    <ShareButton
                      url={`https://vibed-hazel.vercel.app/v/${venture.slug}`}
                      title={venture.name}
                      description={venture.pitch}
                    />
                  </>
                )}
                {isOwner && venture.status !== 'draft' && (
                  <ShareButton
                    url={`https://vibed-hazel.vercel.app/v/${venture.slug}`}
                    title={venture.name}
                    description={venture.pitch}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Mobile: Venture info below cover */}
          <div id="venture-info-mobile" className="sm:hidden px-4 py-6">
            {/* Name and stage */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1
                className="text-[22px] font-black tracking-tight"
                style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
              >
                {venture.name}
              </h1>
              <RungTag rung={venture.rung} isDead={isDead} />
            </div>

            {/* Pitch */}
            <p className="text-[13px] text-ink-2 mb-4 line-clamp-2">{venture.pitch}</p>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {/* Visit Website - most prominent for visitors */}
              {venture.links?.site && (
                <a
                  href={venture.links.site.startsWith('http') ? venture.links.site : `https://${venture.links.site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold bg-ink text-white px-5 py-2 rounded-lg hover:bg-go-deep transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Visit Website
                </a>
              )}
              {/* Draft ventures: show completion controls to help publish */}
              {isOwner && completion && venture.status === 'draft' && (
                <VentureCompletionControls
                  ventureId={venture.id}
                  ventureSlug={venture.slug}
                  percentage={completion.percentage}
                  requirements={completion.requirements}
                  stageRequirements={completion.stageRequirements}
                  status={venture.status}
                />
              )}
              {/* Owner settings always visible */}
              {isOwner && (
                <OwnerSettings
                  ventureId={venture.id}
                  ventureSlug={venture.slug}
                  ventureName={venture.name}
                  status={venture.status}
                />
              )}
              {!isOwner && (
                <>
                  <FollowButton
                    ventureId={venture.id}
                                        className="px-6 py-2 rounded-lg"
                  />
                  <LikeButton
                    ventureId={venture.id}
                    initialCount={venture.counters?.likes || 0}
                  />
                  <VentureEndorseButton
                    ventureId={venture.id}
                    initialCount={venture.counters?.endorsements || 0}
                  />
                  <ShareButton
                    url={`https://vibed-hazel.vercel.app/v/${venture.slug}`}
                    title={venture.name}
                    description={venture.pitch}
                  />
                </>
              )}
              {isOwner && venture.status !== 'draft' && (
                <ShareButton
                  url={`https://vibed-hazel.vercel.app/v/${venture.slug}`}
                  title={venture.name}
                  description={venture.pitch}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - Key venture info */}
      <div id="venture-stats-bar" className="bg-page border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-3 space-y-3">
          {/* Row 1: Website & Social Links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] sm:text-[12px]">
            <span className="text-ink-3 font-medium">Links:</span>
            {(venture.links?.site || venture.links?.ig || venture.links?.x || venture.links?.tiktok || venture.links?.linkedin) ? (
              <>
                {/* Website */}
                {venture.links?.site && (
                  <a
                    href={venture.links.site.startsWith('http') ? venture.links.site : `https://${venture.links.site}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-go-tint text-go-deep px-2.5 py-1 rounded-full hover:bg-go/20 transition-colors font-semibold"
                    title="Visit website"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    {venture.links.site.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
                {/* Instagram */}
                {venture.links?.ig && (
                  <a
                    href={venture.links.ig.startsWith('http') ? venture.links.ig : `https://${venture.links.ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-soft hover:bg-rule px-2.5 py-1 rounded-full transition-colors"
                    title="Instagram"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
                    </svg>
                    <span className="font-medium">Instagram</span>
                  </a>
                )}
                {/* TikTok */}
                {venture.links?.tiktok && (
                  <a
                    href={venture.links.tiktok.startsWith('http') ? venture.links.tiktok : `https://${venture.links.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-soft hover:bg-rule px-2.5 py-1 rounded-full transition-colors"
                    title="TikTok"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="font-medium">TikTok</span>
                  </a>
                )}
                {/* X/Twitter */}
                {venture.links?.x && (
                  <a
                    href={venture.links.x.startsWith('http') ? venture.links.x : `https://${venture.links.x}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-soft hover:bg-rule px-2.5 py-1 rounded-full transition-colors"
                    title="X / Twitter"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span className="font-medium">X</span>
                  </a>
                )}
                {/* LinkedIn */}
                {venture.links?.linkedin && (
                  <a
                    href={venture.links.linkedin.startsWith('http') ? venture.links.linkedin : `https://${venture.links.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-soft hover:bg-rule px-2.5 py-1 rounded-full transition-colors"
                    title="LinkedIn"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="font-medium">LinkedIn</span>
                  </a>
                )}
              </>
            ) : (
              /* No links - show prompt */
              isOwner ? (
                <Link
                  href={`/v/${venture.slug}/edit?tab=basics`}
                  className="flex items-center gap-1.5 text-go-deep hover:underline font-semibold"
                >
                  Add website & socials →
                </Link>
              ) : (
                <span className="text-ink-3 italic">
                  No links added yet
                </span>
              )
            )}
          </div>

          {/* Row 2: Stats */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] sm:text-[12px]">
            {/* Week count */}
            <div className="flex items-center gap-1.5">
              <span className="text-ink-3">Week</span>
              <span className="font-bold font-mono">{venture.counters.weekNumber}</span>
            </div>

            {/* Followers */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold font-mono">{venture.counters.followers.toLocaleString()}</span>
              <span className="text-ink-3">followers</span>
            </div>

            {/* Clips */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold font-mono">{venture.counters.clips}</span>
              <span className="text-ink-3">clips</span>
            </div>

            {/* Industry/Categories */}
            {((venture.categories && venture.categories.length > 0) || (venture.industry && venture.industry !== 'other')) ? (
              <div className="flex items-center gap-1.5 group relative">
                <span className="text-ink-3">Industry:</span>
                <span className="font-semibold text-heat">
                  {venture.categories && venture.categories.length > 0
                    ? venture.categories.map((cat: Industry) => INDUSTRY_LABELS[cat] || cat).join(', ')
                    : INDUSTRY_LABELS[venture.industry as Industry] || venture.industry}
                </span>
                {isOwner && (
                  <Link
                    href={`/v/${venture.slug}/edit?tab=basics&field=industry`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-go-deep hover:underline ml-1"
                  >
                    Edit
                  </Link>
                )}
              </div>
            ) : isOwner ? (
              <Link
                href={`/v/${venture.slug}/edit?tab=basics&field=industry`}
                className="flex items-center gap-1.5 text-go-deep hover:underline"
              >
                <span className="text-ink-3">Industry:</span>
                <span className="font-semibold">Add industry →</span>
              </Link>
            ) : null}

            {/* Country/Location */}
            {venture.country && (
              <div className="flex items-center gap-1.5">
                <span className="text-ink-3">Location:</span>
                <span className="font-semibold">{venture.country}</span>
              </div>
            )}

            {/* Streak */}
            {venture.counters.streakWeeks > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold font-mono text-go-deep">{venture.counters.streakWeeks}</span>
                <span className="text-ink-3">week streak</span>
              </div>
            )}

            {/* Founded date */}
            {venture.published_at && (
              <div className="flex items-center gap-1.5">
                <span className="text-ink-3">Started:</span>
                <span className="font-semibold">{new Date(venture.published_at).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>
              </div>
            )}

            {/* Founder */}
            <div className="flex items-center gap-1.5">
              <span className="text-ink-3">By</span>
              <Link href={`/founder/${venture.founder.slug}`} className="font-semibold hover:text-go-deep transition-colors">
                {venture.founder.name}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Elevator Pitch Section - Full width, text left, video right */}
      <div id="venture-elevator-pitch" className="bg-soft border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Mobile: Title then video then text */}
          {/* Desktop: Title inline left, video takes up right side spanning full height */}
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
            {/* Left column: Title + Text */}
            <div className="flex-1 lg:order-1">
              <h2 className="text-[12px] font-semibold text-ink-3 uppercase tracking-wide mb-4">
                Elevator Pitch
              </h2>

              {/* Video on mobile only - shows after title */}
              <div className="lg:hidden mb-5">
                {pitchClip?.playback_id ? (
                  <div className="aspect-video rounded-xl overflow-hidden bg-ink/10 shadow-sm">
                    <VideoPlayer
                      playbackId={pitchClip.playback_id}
                      title={`${venture.name} - Elevator Pitch`}
                      thumbTime={pitchClip.thumbTime}
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-rule bg-page">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3 mb-2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span className="text-[12px] font-medium text-ink-3">Pitch Video</span>
                    <span className="text-[11px] text-ink-3 mt-1">Coming soon</span>
                    {isOwner && (
                      <Link
                        href={`/v/${venture.slug}/edit?segment=pitch`}
                        className="mt-3 text-[11px] font-semibold text-go-deep hover:underline"
                      >
                        Upload video →
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <ElevatorPitchEditable
                ventureId={venture.id}
                pitch={venture.pitch}
                problem={venture.problem}
                who={venture.who}
                isOwner={isOwner || false}
              />
            </div>

            {/* Video on desktop - right side, larger */}
            <div className="hidden lg:block w-[55%] lg:order-2 flex-shrink-0">
              {pitchClip?.playback_id ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-ink/10 shadow-md">
                  <VideoPlayer
                    playbackId={pitchClip.playback_id}
                    title={`${venture.name} - Elevator Pitch`}
                    thumbTime={pitchClip.thumbTime}
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-rule bg-page">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3 mb-2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span className="text-[14px] font-medium text-ink-3">Pitch Video</span>
                  <span className="text-[12px] text-ink-3 mt-1">Coming soon</span>
                  {isOwner && (
                    <Link
                      href={`/v/${venture.slug}/edit?segment=pitch`}
                      className="mt-3 text-[12px] font-semibold text-go-deep hover:underline"
                    >
                      Upload video →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div id="venture-main-container" className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">

        {/* Main Content Area - full width */}
        <div id="venture-content-area" className="pb-20">
          {/* Promise & Progress Section */}
          <div id="venture-promise-section" className="overflow-x-hidden">
            {/* Promise Card - Prominent */}
            {venture.promise && !isDead && (
              <div id="active-promise" className="bg-warn-tint border border-warn/30 rounded-[16px] p-5 mb-6">
                <PromiseClock
                  text={venture.promise.text}
                  dueAt={venture.promise.dueAt}
                  createdAt={venture.promise.createdAt}
                  keptHistory={venture.promiseHistory?.map((p) => p.kept) || []}
                  className="mt-0 bg-transparent border-0 p-0"
                />
              </div>
            )}

            {/* Timeline Progress */}
            <TimelineProgress
              currentRung={venture.rung}
              completedSegments={completedSegments}
              totalSegments={totalSegments}
              className="mb-6"
            />

            {/* Tabbed Content: The Journey, Clips, Latest Updates */}
            <div id="venture-tabs-section">
            <VentureContentTabs
              journeyContent={
                <JourneyAccordion
                  stages={stagesData}
                  ventureName={venture.name}
                  isOwner={isOwner || false}
                  ventureSlug={venture.slug}
                />
              }
              clipsContent={
                <ClipsGrid
                  clips={allClips.map((clip) => ({
                    _id: clip._id,
                    playback_id: clip.playback_id || null,
                    title: clip.title,
                    thumbTime: clip.thumbTime,
                    segment_key: clip.segment_key,
                    counters: clip.counters,
                    created_at: clip.created_at,
                  }))}
                  ventureName={venture.name}
                  ventureSlug={venture.slug}
                />
              }
              promisesContent={
                <div className="space-y-6">
                  {/* Currently Building - Active Goal */}
                  {venture.promise && !isDead ? (
                    <div className="bg-go-tint border border-go/30 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-semibold bg-go text-white px-2 py-0.5 rounded-full">
                              BUILDING NOW
                            </span>
                          </div>
                          <p className="text-[18px] font-bold text-ink leading-snug">{venture.promise.text}</p>
                        </div>
                        {/* Deadline badge */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-[11px] text-ink-3 mb-1">Target</div>
                          <div className="text-[14px] font-bold text-go-deep">
                            {new Date(venture.promise.dueAt).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[11px] text-ink-3 mt-1">
                            {Math.max(0, Math.floor((new Date(venture.promise.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days left
                          </div>
                        </div>
                      </div>

                      {/* Encourage section */}
                      <div className="flex items-center gap-3 pt-4 border-t border-go/20">
                        <CheerButton ventureId={venture.id} className="flex-1" />
                        <CommentButton ventureId={venture.id} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-soft border border-rule rounded-xl p-5 text-center">
                      <div className="text-[40px] mb-3">🚀</div>
                      <h3 className="text-[16px] font-bold mb-2">What are they building next?</h3>
                      <p className="text-[13px] text-ink-3 mb-4">
                        No active goal right now. Check back soon or follow to get notified.
                      </p>
                      {isOwner && (
                        <Link
                          href={`/v/${venture.slug}/edit`}
                          className="inline-block text-[13px] font-semibold bg-go text-white py-2 px-5 rounded-lg hover:bg-go-deep transition-colors"
                        >
                          Share what you&apos;re working on →
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Track Record */}
                  {venture.promiseHistory && venture.promiseHistory.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[15px] font-bold">Track Record</h3>
                        <div className="flex items-center gap-3 text-[12px]">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-go"></span>
                            <span className="text-ink-2">{venture.promiseHistory.filter(p => p.kept).length} completed</span>
                          </span>
                          {venture.promiseHistory.filter(p => !p.kept).length > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-dead"></span>
                              <span className="text-ink-3">{venture.promiseHistory.filter(p => !p.kept).length} missed</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-rule" />

                        <div className="space-y-3">
                          {venture.promiseHistory.map((p, i) => (
                            <div key={i} className="flex gap-4 relative">
                              {/* Status dot */}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                                p.kept ? 'bg-go' : 'bg-dead'
                              }`}>
                                {p.kept ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              {/* Content */}
                              <div className="flex-1 bg-page border border-rule rounded-lg p-3">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                    p.kept ? 'bg-go-tint text-go-deep' : 'bg-dead-tint text-dead'
                                  }`}>
                                    {p.kept ? 'COMPLETED' : 'MISSED'}
                                  </span>
                                  <span className="text-[10px] text-ink-3">
                                    {new Date(p.resolvedAt).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-[13px] text-ink">{p.text}</p>
                                {p.note && (
                                  <p className="text-[12px] text-ink-3 mt-2 italic">&quot;{p.note}&quot;</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state when no history */}
                  {(!venture.promiseHistory || venture.promiseHistory.length === 0) && !venture.promise && (
                    <div className="py-6 text-center">
                      <p className="text-[13px] text-ink-3">
                        When {venture.name} sets goals and completes them, their track record will appear here.
                      </p>
                    </div>
                  )}

                  {/* How it works */}
                  <div className="bg-soft rounded-xl p-4">
                    <h3 className="text-[13px] font-bold mb-3 flex items-center gap-2">
                      <span>💡</span> How Progress Works
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3 text-[12px]">
                      <div className="bg-page rounded-lg p-3">
                        <div className="font-bold text-ink mb-1">1. Set a goal</div>
                        <div className="text-ink-3">Share what you&apos;re building with an optional deadline</div>
                      </div>
                      <div className="bg-page rounded-lg p-3">
                        <div className="font-bold text-ink mb-1">2. Get cheers</div>
                        <div className="text-ink-3">Followers encourage you and stay updated</div>
                      </div>
                      <div className="bg-page rounded-lg p-3">
                        <div className="font-bold text-ink mb-1">3. Build track record</div>
                        <div className="text-ink-3">Complete goals to show you ship</div>
                      </div>
                    </div>
                  </div>
                </div>
              }
              updatesContent={
                <div className="space-y-4">
                  {writtenSegments.length > 0 ? (
                    writtenSegments.map((seg) => (
                      <div key={seg.k} className="bg-page border border-rule rounded-xl p-4">
                        <div className="flex items-center gap-2 text-[12px] text-ink-3 mb-2">
                          <span>{formatRelativeTime(seg.content?.updatedAt || seg.content?.publishedAt || new Date())}</span>
                        </div>
                        <h3 className="text-[16px] font-bold mb-1">{seg.t}</h3>
                        <p className="text-[14px] text-ink-2 line-clamp-3">{seg.content?.body}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-ink-3">
                      <p className="text-[14px]">No updates yet</p>
                      <p className="text-[13px] mt-1">Updates will appear as the journey progresses</p>
                    </div>
                  )}
                </div>
              }
            />
            </div>

            {/* Meet the Team Section */}
            <div id="venture-team-section" className="mt-10 pt-8 border-t border-rule">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-[20px] font-bold tracking-tight"
                  style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
                >
                  Meet the Team
                </h2>
                {isOwner && (
                  <Link
                    href={`/v/${venture.slug}/edit`}
                    className="text-[12px] text-go-deep hover:underline"
                  >
                    Manage team →
                  </Link>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Main founder */}
                <Link
                  href={`/founder/${venture.founder.slug}`}
                  className="block bg-page border border-rule rounded-xl p-5 hover:border-ink/20 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex gap-4 items-start">
                    <Avatar
                      name={venture.founder.name}
                      imageUrl={venture.founder.avatar}
                      color={venture.brand}
                      size="xl"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[16px]">{venture.founder.name}</span>
                        <span className="text-[10px] font-semibold bg-go-tint text-go-deep px-1.5 py-0.5 rounded">
                          Founder
                        </span>
                      </div>
                      {/* Headline - the one-liner */}
                      {venture.founder.headline ? (
                        <p className="text-[13px] text-ink-2 mt-1 font-medium">{venture.founder.headline}</p>
                      ) : (
                        <p className="text-[13px] text-ink-3 mt-1 italic">Building something worth watching</p>
                      )}
                      {venture.founder.location && (
                        <p className="text-[12px] text-ink-3 mt-2 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {venture.founder.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {venture.founder.bio ? (
                    <p className="text-[13px] text-ink-2 mt-4 line-clamp-3">{venture.founder.bio}</p>
                  ) : (
                    <p className="text-[13px] text-ink-3 mt-4 italic">No bio yet — ask them what drives them!</p>
                  )}

                  {/* Social links & View profile */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-rule">
                    <div className="flex items-center gap-3">
                      {venture.founder.links?.linkedin && (
                        <a href={venture.founder.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-[#0A66C2] transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      )}
                      {venture.founder.links?.twitter && (
                        <a href={venture.founder.links.twitter} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        </a>
                      )}
                      {venture.founder.links?.instagram && (
                        <a href={venture.founder.links.instagram} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-[#E4405F] transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                      )}
                      {venture.founder.links?.website && (
                        <a href={venture.founder.links.website} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-go-deep transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        </a>
                      )}
                      {!venture.founder.links?.linkedin && !venture.founder.links?.twitter && !venture.founder.links?.instagram && !venture.founder.links?.website && (
                        <span className="text-[11px] text-ink-3 italic">No socials linked yet</span>
                      )}
                    </div>
                    <span className="text-[12px] font-semibold text-go-deep">
                      View full profile →
                    </span>
                  </div>
                </Link>

                {/* Other team members */}
                {teamMembers
                  .filter((m) => m.founder && m.founder.id !== venture.founder.id)
                  .map((member) => (
                    <Link
                      key={member.id}
                      href={`/founder/${member.founder!.slug}`}
                      className="block bg-page border border-rule rounded-xl p-5 hover:border-ink/20 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex gap-4 items-start">
                        <Avatar
                          name={member.founder!.name}
                          imageUrl={member.founder!.avatar}
                          color="#5A2EC4"
                          size="xl"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[16px]">{member.founder!.name}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              member.role === 'partner' ? 'bg-heat-tint text-heat' : 'bg-soft text-ink-2'
                            }`}>
                              {member.role === 'partner' ? 'Partner' : 'Team'}
                            </span>
                          </div>
                          {/* Headline - the one-liner */}
                          {member.founder!.headline ? (
                            <p className="text-[13px] text-ink-2 mt-1 font-medium">{member.founder!.headline}</p>
                          ) : (
                            <p className="text-[13px] text-ink-3 mt-1 italic">Building something worth watching</p>
                          )}
                          {member.founder!.location && (
                            <p className="text-[12px] text-ink-3 mt-2 flex items-center gap-1">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              {member.founder!.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      {member.founder!.bio ? (
                        <p className="text-[13px] text-ink-2 mt-4 line-clamp-3">{member.founder!.bio}</p>
                      ) : (
                        <p className="text-[13px] text-ink-3 mt-4 italic">No bio yet — ask them what drives them!</p>
                      )}

                      {/* Social links & View profile */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-rule">
                        <div className="flex items-center gap-3">
                          {member.founder!.links?.linkedin && (
                            <a href={member.founder!.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-[#0A66C2] transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                          )}
                          {member.founder!.links?.twitter && (
                            <a href={member.founder!.links.twitter} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </a>
                          )}
                          {member.founder!.links?.instagram && (
                            <a href={member.founder!.links.instagram} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-[#E4405F] transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            </a>
                          )}
                          {member.founder!.links?.website && (
                            <a href={member.founder!.links.website} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-go-deep transition-colors">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                              </svg>
                            </a>
                          )}
                          {!member.founder!.links?.linkedin && !member.founder!.links?.twitter && !member.founder!.links?.instagram && !member.founder!.links?.website && (
                            <span className="text-[11px] text-ink-3 italic">No socials linked yet</span>
                          )}
                        </div>
                        <span className="text-[12px] font-semibold text-go-deep">
                          View full profile →
                        </span>
                      </div>
                    </Link>
                  ))}

                {/* Pending invitations (owner only) */}
                {isOwner && teamMembers
                  .filter((m) => m.status === 'pending')
                  .map((member) => (
                    <div
                      key={member.id}
                      className="bg-soft border border-dashed border-rule rounded-xl p-4"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-12 h-12 rounded-full bg-rule flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3">
                            <circle cx="12" cy="7" r="4" />
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[14px] text-ink-3">
                              {member.first_name} {member.last_name}
                            </span>
                            <span className="text-[10px] font-semibold bg-warn-tint text-warn px-1.5 py-0.5 rounded">
                              Pending
                            </span>
                          </div>
                          <p className="text-[12px] text-ink-3 mt-1">Invitation sent</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Empty state for solo founders */}
              {teamMembers.length === 0 && !isOwner && (
                <div className="text-center py-6">
                  <p className="text-[14px] text-ink-3">Solo founder building something awesome</p>
                </div>
              )}

              {/* Encourage adding team for owners */}
              {isOwner && teamMembers.filter((m) => m.founder && m.founder.id !== venture.founder.id).length === 0 && (
                <div className="mt-4 p-4 bg-soft rounded-xl border border-dashed border-rule text-center">
                  <p className="text-[13px] text-ink-2 mb-2">Working with others?</p>
                  <Link
                    href={`/v/${venture.slug}/edit`}
                    className="text-[13px] font-semibold text-go-deep hover:underline"
                  >
                    Add team members →
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const venture = await getVentureBySlug(slug);

  if (!venture) {
    return { title: 'Not Found' };
  }

  return {
    title: `${venture.name} — Vibed`,
    description: venture.pitch,
  };
}

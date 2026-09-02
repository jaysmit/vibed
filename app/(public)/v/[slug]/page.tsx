import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { VentureLogo, RungTag, PromiseClock, Avatar, OwnerSettings, VideoPlayer, VentureCompletionControls, JourneyAccordion, FollowButton } from '@/components/ui';
import { getVentureBySlug } from '@/lib/services/ventures-public';
import { getClipByVentureAndSegment, getClipsByVenture } from '@/lib/services/clips-public';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { isFollowingVenture } from '@/lib/services/follows';
import { type SegmentKey, RUNGS, type Rung } from '@/lib/domain/rungs';
import { INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';
import { TimelineProgress } from '@/components/ui/TimelineProgress';
import { calculateCompletion } from '@/lib/domain/standards';
import { VentureContentTabs } from './VentureContentTabs';

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
  const userId = await getCurrentUserId();
  const venture = await getVentureBySlug(slug, userId);

  if (!venture) {
    notFound();
  }

  // Handle slug redirects
  if ('_redirect' in venture && venture._redirect) {
    redirect(`/v/${venture._redirect}`);
  }

  const isDead = venture.status === 'closed';
  const isGraduated = venture.status === 'graduated';
  const isOwner = userId && venture.founder.user_id === userId;

  // Check if current user is following this venture
  const isFollowing = userId && !isOwner ? await isFollowingVenture(userId, venture.id) : false;

  // Calculate completion for owner view
  const completion = isOwner ? calculateCompletion(venture) : null;

  // Get the elevator pitch video clip and all clips for this venture
  const [pitchClip, allClips] = await Promise.all([
    getClipByVentureAndSegment(venture.id, 'pitch'),
    getClipsByVenture(venture.id),
  ]);

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
        <div className="bg-warn-tint border-b border-warn/30 px-4 sm:px-6 py-2 sm:py-3">
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

      {/* Profile Header - Logo left, info right */}
      <div className="bg-page border-b border-rule">
        <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex gap-5 sm:gap-8 items-start">
            {/* Circular Logo - Left */}
            <VentureLogo
              glyph={venture.glyph}
              brand={venture.brand}
              size="xl"
              className="rounded-full border-4 border-page shadow-lg flex-shrink-0"
            />

            {/* Info - Right */}
            <div className="flex-1 min-w-0">
              {/* Name and stage */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1
                  className="text-[22px] sm:text-[28px] font-black tracking-tight"
                  style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
                >
                  {venture.name}
                </h1>
                <RungTag rung={venture.rung} isDead={isDead} />
              </div>

              {/* Pitch */}
              <p className="text-[13px] sm:text-[14px] text-ink-2 mb-4 line-clamp-2">{venture.pitch}</p>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {isOwner && completion && (
                  <>
                    <VentureCompletionControls
                      ventureId={venture.id}
                      ventureSlug={venture.slug}
                      percentage={completion.percentage}
                      requirements={completion.requirements}
                      status={venture.status}
                    />
                    <OwnerSettings
                      ventureId={venture.id}
                      ventureSlug={venture.slug}
                      ventureName={venture.name}
                      status={venture.status}
                    />
                  </>
                )}
                {!isOwner && (
                  <>
                    <FollowButton
                      ventureId={venture.id}
                      initialFollowing={isFollowing}
                      className="px-6 py-2 rounded-lg"
                    />
                    <button className="text-[13px] font-semibold border border-rule-2 px-6 py-2 rounded-lg hover:border-ink hover:bg-soft transition-colors">
                      Share
                    </button>
                  </>
                )}
                {isOwner && venture.status !== 'draft' && (
                  <button className="text-[13px] font-semibold border border-rule-2 px-6 py-2 rounded-lg hover:border-ink hover:bg-soft transition-colors">
                    Share
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - Key venture info */}
      <div className="bg-page border-b border-rule">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-2 text-[11px] sm:text-[12px]">
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

            {/* Industry */}
            {venture.industry && (
              <div className="flex items-center gap-1.5">
                <span className="text-ink-3">Industry:</span>
                <span className="font-semibold text-heat">{INDUSTRY_LABELS[venture.industry as Industry] || venture.industry}</span>
              </div>
            )}

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
      <div className="bg-soft border-b border-rule">
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
                        href={`/v/${venture.slug}/edit`}
                        className="mt-3 text-[11px] font-semibold text-go-deep hover:underline"
                      >
                        Upload video →
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {venture.pitch && (
                <p className="text-[18px] sm:text-[22px] font-semibold text-ink leading-snug mb-4">
                  {venture.pitch}
                </p>
              )}
              {venture.problem && (
                <div className="text-[14px] sm:text-[15px] text-ink-2 leading-relaxed mb-2">
                  <span className="font-semibold text-ink">The problem:</span> {venture.problem}
                </div>
              )}
              {venture.who && (
                <div className="text-[14px] sm:text-[15px] text-ink-2 leading-relaxed">
                  <span className="font-semibold text-ink">For:</span> {venture.who}
                </div>
              )}
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
                      href={`/v/${venture.slug}/edit`}
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

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start pb-20">
          {/* Main Content */}
          <div className="min-w-0 overflow-x-hidden">
            {/* Promise Card - Prominent */}
            {venture.promise && !isDead && (
              <div className="bg-warn-tint border border-warn/30 rounded-[16px] p-5 mb-6">
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
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {/* Show actual clips first - square like Instagram */}
                  {allClips.map((clip) => (
                    <div key={clip._id} className="aspect-square bg-soft rounded-sm sm:rounded-lg overflow-hidden relative group cursor-pointer">
                      {clip.playback_id ? (
                        <>
                          <VideoPlayer
                            playbackId={clip.playback_id}
                            title={clip.title}
                            thumbTime={clip.thumbTime}
                          />
                          {/* Play icon overlay - Instagram style */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                          {/* Views/likes count */}
                          <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-[10px] sm:text-[11px] font-semibold drop-shadow-lg">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            <span>{clip.counters?.views || 0}</span>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-ink/5">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Show placeholders for remaining slots - square */}
                  {Array.from({ length: Math.max(0, 6 - allClips.length) }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="aspect-square bg-soft rounded-sm sm:rounded-lg flex items-center justify-center border border-dashed border-rule">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  ))}
                </div>
              }
              promisesContent={
                <div className="space-y-4">
                  {/* Current active promise */}
                  {venture.promise && !isDead && (
                    <div className="bg-warn-tint border border-warn/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] font-semibold bg-warn text-white px-2 py-0.5 rounded-full">ACTIVE</span>
                        <span className="text-[12px] text-ink-3">
                          Due {new Date(venture.promise.dueAt).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[16px] font-semibold text-ink mb-3">{venture.promise.text}</p>
                      <div className="flex items-center gap-4">
                        <button className="text-[12px] font-semibold bg-go text-white px-4 py-2 rounded-lg hover:bg-go-deep transition-colors flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                          Cheer them on
                        </button>
                        <span className="text-[12px] text-ink-3">
                          {Math.floor((new Date(venture.promise.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Promise history */}
                  <div>
                    <h3 className="text-[14px] font-bold mb-3">Promise Timeline</h3>
                    {venture.promiseHistory && venture.promiseHistory.length > 0 ? (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-rule" />

                        <div className="space-y-4">
                          {venture.promiseHistory.map((p, i) => (
                            <div key={i} className="flex gap-4 relative">
                              {/* Status dot */}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                                p.kept ? 'bg-go-tint' : 'bg-dead-tint'
                              }`}>
                                {p.kept ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#017A4C" strokeWidth="3">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                ) : (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B03A28" strokeWidth="3">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                              {/* Content */}
                              <div className="flex-1 bg-page border border-rule rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                    p.kept ? 'bg-go-tint text-go-deep' : 'bg-dead-tint text-dead'
                                  }`}>
                                    {p.kept ? 'KEPT' : 'MISSED'}
                                  </span>
                                </div>
                                <p className="text-[13px] text-ink">{(p as {text?: string}).text || 'Promise'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center border-2 border-dashed border-rule rounded-xl">
                        <div className="text-[32px] mb-2">🎯</div>
                        <p className="text-[14px] text-ink-3">No promises made yet</p>
                        <p className="text-[12px] text-ink-3 mt-1">Founders set public deadlines to keep themselves accountable</p>
                        {isOwner && (
                          <Link
                            href={`/v/${venture.slug}/edit`}
                            className="inline-block mt-4 text-[12px] font-semibold text-go-deep hover:underline"
                          >
                            Make your first promise →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rewards section */}
                  <div className="bg-soft rounded-xl p-4 mt-6">
                    <h3 className="text-[14px] font-bold mb-2 flex items-center gap-2">
                      <span>🏆</span> Promise Rewards
                    </h3>
                    <p className="text-[12px] text-ink-2 mb-3">
                      Founders who keep their promises get featured! Cheers from followers count towards rewards.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-page rounded-lg p-2.5 text-center">
                        <div className="font-bold text-go-deep">5+ cheers</div>
                        <div className="text-ink-3">Trending badge</div>
                      </div>
                      <div className="bg-page rounded-lg p-2.5 text-center">
                        <div className="font-bold text-go-deep">10+ kept</div>
                        <div className="text-ink-3">Featured on home</div>
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

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-[88px] lg:self-start flex flex-col gap-4">
            {/* Founder card */}
            <div className="bg-page border border-rule rounded-[14px] p-[18px] shadow-sm">
              <div className="flex gap-3 items-start">
                <Avatar name={venture.founder.name} color={venture.brand} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[17px] font-bold">{venture.founder.name}</div>
                  {venture.founder.location && (
                    <div className="text-[12.5px] text-ink-3">{venture.founder.location}</div>
                  )}
                </div>
              </div>
              {venture.founder.bio && (
                <p className="text-[13px] text-ink-2 mt-3 leading-relaxed">{venture.founder.bio}</p>
              )}
            </div>

            {/* Industry */}
            {venture.industry && (
              <div className="flex items-center gap-2 px-4 py-3 bg-heat-tint rounded-[10px]">
                <span className="text-[12px] text-ink-3">Industry:</span>
                <span className="text-[13px] font-semibold text-heat">
                  {INDUSTRY_LABELS[venture.industry as Industry] || venture.industry}
                </span>
              </div>
            )}

            {/* Links card */}
            {venture.links?.site && (
              <div className="bg-page border border-rule rounded-[14px] p-[18px] shadow-sm">
                <div className="text-[10.5px] tracking-[0.11em] uppercase text-ink-3 font-bold mb-[11px]">
                  Links
                </div>
                <a
                  href={`https://${venture.links.site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full bg-ink text-white rounded-xl p-[14px_15px] hover:bg-go-deep transition-colors"
                >
                  <div className="w-[34px] h-[34px] rounded-lg bg-white/15 grid place-items-center">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <b className="block text-[15px] font-semibold truncate">{venture.links.site}</b>
                    <span className="text-[11.5px] text-white/60">
                      {venture.links.siteStatus === 'live'
                        ? 'Live'
                        : venture.links.siteStatus === 'waitlist'
                        ? 'Waitlist'
                        : venture.links.siteStatus === 'closed'
                        ? 'Closed'
                        : ''}
                    </span>
                  </div>
                  <span className="ml-auto text-white/70">→</span>
                </a>

                {/* Social links */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {venture.links.ig && (
                    <a
                      href={`https://instagram.com/${venture.links.ig}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-[7px] border border-rule rounded-full px-3 py-[7px] text-[12px] text-ink-2 font-medium hover:border-ink hover:text-ink hover:bg-soft transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      @{venture.links.ig}
                    </a>
                  )}
                  {venture.links.x && (
                    <a
                      href={`https://x.com/${venture.links.x}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-[7px] border border-rule rounded-full px-3 py-[7px] text-[12px] text-ink-2 font-medium hover:border-ink hover:text-ink hover:bg-soft transition-colors"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      @{venture.links.x}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Clips preview - square like Instagram */}
            {venture.counters.clips > 0 && (
              <div className="bg-page border border-rule rounded-[14px] p-[18px] shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-bold">Recent Clips</h3>
                  <Link href={`/v/${slug}/clips`} className="text-[12px] text-go-deep hover:underline">
                    See all →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {/* Show actual clips or placeholders - square */}
                  {allClips.slice(0, 3).map((clip) => (
                    <div
                      key={clip._id}
                      className="aspect-square bg-soft rounded-md overflow-hidden relative group cursor-pointer"
                    >
                      {clip.playback_id ? (
                        <>
                          <VideoPlayer
                            playbackId={clip.playback_id}
                            title={clip.title}
                            thumbTime={clip.thumbTime}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Placeholders if less than 3 clips */}
                  {Array.from({ length: Math.max(0, 3 - allClips.length) }).map((_, i) => (
                    <div
                      key={`placeholder-${i}`}
                      className="aspect-square bg-soft rounded-md flex items-center justify-center border border-dashed border-rule"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standards card */}
            {venture.standards && (
              <div className="border border-go-tint bg-go-tint rounded-[14px] p-[16px_18px]">
                <div className="flex items-center gap-2 text-[13.5px] font-bold text-go-deep">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <path d="M22 4L12 14.01l-3-3" />
                  </svg>
                  Standards: {venture.standards.met}/{venture.standards.of}
                </div>
                <ul className="mt-[10px] flex flex-col gap-[5px]">
                  {['Has a pitch', 'Has segments', 'Active promise', 'Posted this week'].map(
                    (item, i) => (
                      <li
                        key={item}
                        className="text-[12.5px] text-go-deep flex gap-2 opacity-90"
                      >
                        <em className="not-italic">{i < (venture.standards?.met ?? 0) ? '✓' : '○'}</em>
                        {item}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {isDead && (
              <div className="border border-dead-tint bg-dead-tint rounded-[14px] p-4 text-center">
                <div className="text-[24px] mb-2">💔</div>
                <div className="text-[14px] font-semibold text-dead">This venture has closed</div>
                <p className="text-[12px] text-ink-2 mt-1">
                  The founder has moved on, but their story remains.
                </p>
              </div>
            )}

            {isGraduated && (
              <div className="border border-go bg-go-tint rounded-[14px] p-4 text-center">
                <div className="text-[24px] mb-2">🎓</div>
                <div className="text-[14px] font-semibold text-go-deep">Graduated!</div>
                <p className="text-[12px] text-ink-2 mt-1">
                  This venture has graduated from the Vibed journey.
                </p>
              </div>
            )}
          </aside>
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

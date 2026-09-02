import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { weeklyDigestEmail, type DigestVenture, type WeeklyDigestData } from '@/lib/email/templates/weekly-digest';
import { founderNudgeEmail, type FounderNudgeData } from '@/lib/email/templates/founder-nudge';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';

// Get current week number of the year
function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

interface UserWithFollows {
  id: string;
  email: string;
  name: string;
  followedVentureIds: string[];
}

/**
 * Get all users who have email notifications enabled and follow at least one venture
 */
async function getUsersForDigest(): Promise<UserWithFollows[]> {
  const supabase = await createAdminClient();

  // Get all follows with user info
  const { data: follows } = await supabase
    .from('follows')
    .select('user_id, venture_id');

  if (!follows || follows.length === 0) return [];

  // Group by user
  const userFollows = new Map<string, string[]>();
  for (const f of follows) {
    const existing = userFollows.get(f.user_id) || [];
    existing.push(f.venture_id);
    userFollows.set(f.user_id, existing);
  }

  // Get user details from auth
  const users: UserWithFollows[] = [];
  for (const [userId, ventureIds] of userFollows) {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    if (userData?.user?.email) {
      users.push({
        id: userId,
        email: userData.user.email,
        name: userData.user.user_metadata?.name || userData.user.email.split('@')[0],
        followedVentureIds: ventureIds,
      });
    }
  }

  return users;
}

/**
 * Get venture updates from the past week
 */
async function getVentureUpdates(ventureIds: string[]): Promise<DigestVenture[]> {
  if (ventureIds.length === 0) return [];

  const supabase = await createAdminClient();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get ventures
  const { data: ventures } = await supabase
    .from('ventures')
    .select('id, name, slug, pitch, rung, updated_at')
    .in('id', ventureIds)
    .eq('status', 'live');

  if (!ventures) return [];

  // Get events from the past week for these ventures
  const { data: events } = await supabase
    .from('events')
    .select('type, venture_id, meta')
    .in('venture_id', ventureIds)
    .gte('created_at', oneWeekAgo)
    .in('type', [
      EVENT_TYPES.VENTURE_RUNG_CHANGED,
      EVENT_TYPES.PROMISE_KEPT,
      EVENT_TYPES.PROMISE_BROKEN,
      EVENT_TYPES.CLIP_PUBLISHED,
      EVENT_TYPES.SEGMENT_PUBLISHED,
    ]);

  // Build digest ventures
  const results: DigestVenture[] = [];

  for (const v of ventures) {
    const ventureEvents = events?.filter((e) => e.venture_id === v.id) || [];
    const rungChanged = ventureEvents.some((e) => e.type === EVENT_TYPES.VENTURE_RUNG_CHANGED);
    const promiseKept = ventureEvents.some((e) => e.type === EVENT_TYPES.PROMISE_KEPT);
    const promiseMissed = ventureEvents.some((e) => e.type === EVENT_TYPES.PROMISE_BROKEN);
    const newClips = ventureEvents.filter((e) => e.type === EVENT_TYPES.CLIP_PUBLISHED).length;

    // Only include if there's activity
    if (!rungChanged && !promiseKept && !promiseMissed && newClips === 0) {
      // Check if updated in past week
      if (new Date(v.updated_at) < new Date(oneWeekAgo)) {
        continue;
      }
    }

    results.push({
      name: v.name,
      slug: v.slug,
      pitch: v.pitch,
      rung: v.rung,
      rungChanged: rungChanged || undefined,
      promiseKept: promiseKept || undefined,
      promiseMissed: promiseMissed || undefined,
      newClips: newClips > 0 ? newClips : undefined,
    });
  }

  return results;
}

/**
 * Get trending ventures (top 3 not already followed)
 */
async function getTrendingVentures(excludeIds: string[]): Promise<DigestVenture[]> {
  const supabase = await createAdminClient();

  let query = supabase
    .from('ventures')
    .select('name, slug, pitch, rung, counters')
    .eq('status', 'live')
    .order('counters->trendingScore', { ascending: false })
    .limit(5);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data: ventures } = await query;

  return (ventures || []).slice(0, 3).map((v) => ({
    name: v.name,
    slug: v.slug,
    pitch: v.pitch,
    rung: v.rung,
  }));
}

/**
 * Get promise updates from the past week
 */
async function getPromiseUpdates(ventureIds: string[]): Promise<{ venture: DigestVenture; kept: boolean }[]> {
  if (ventureIds.length === 0) return [];

  const supabase = await createAdminClient();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from('events')
    .select('type, venture_id')
    .in('venture_id', ventureIds)
    .gte('created_at', oneWeekAgo)
    .in('type', [EVENT_TYPES.PROMISE_KEPT, EVENT_TYPES.PROMISE_BROKEN]);

  if (!events || events.length === 0) return [];

  // Get venture details
  const { data: ventures } = await supabase
    .from('ventures')
    .select('id, name, slug, pitch, rung')
    .in('id', events.map((e) => e.venture_id));

  if (!ventures) return [];

  return events.map((e) => {
    const venture = ventures.find((v) => v.id === e.venture_id);
    if (!venture) return null;
    return {
      venture: {
        name: venture.name,
        slug: venture.slug,
        pitch: venture.pitch,
        rung: venture.rung,
      },
      kept: e.type === EVENT_TYPES.PROMISE_KEPT,
    };
  }).filter((u): u is { venture: DigestVenture; kept: boolean } => u !== null);
}

/**
 * Send weekly digest to all eligible users
 */
export async function sendWeeklyDigests(): Promise<{ sent: number; errors: number }> {
  const users = await getUsersForDigest();
  const weekNumber = getWeekNumber();

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const followedVentures = await getVentureUpdates(user.followedVentureIds);
      const trendingVentures = await getTrendingVentures(user.followedVentureIds);
      const promiseUpdates = await getPromiseUpdates(user.followedVentureIds);

      // Skip if no content
      if (followedVentures.length === 0 && promiseUpdates.length === 0) {
        continue;
      }

      const data: WeeklyDigestData = {
        recipientName: user.name,
        weekNumber,
        followedVentures,
        trendingVentures,
        promiseUpdates,
      };

      const email = weeklyDigestEmail(data);
      const result = await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      if (result.success) {
        sent++;
        await logEvent({
          type: EVENT_TYPES.DIGEST_SENT,
          actorId: user.id,
          meta: { weekNumber, ventureCount: followedVentures.length },
        });
      } else {
        errors++;
      }
    } catch (error) {
      console.error(`Failed to send digest to ${user.email}:`, error);
      errors++;
    }
  }

  return { sent, errors };
}

/**
 * Get founders who haven't updated in X days
 */
async function getIdleFounders(minDays: number = 7): Promise<FounderNudgeData[]> {
  const supabase = await createAdminClient();
  const cutoffDate = new Date(Date.now() - minDays * 24 * 60 * 60 * 1000).toISOString();

  // Get ventures not updated recently
  const { data: ventures } = await supabase
    .from('ventures')
    .select('id, name, slug, rung, updated_at, counters, founder_id, founders(user_id, name)')
    .eq('status', 'live')
    .lt('updated_at', cutoffDate);

  if (!ventures) return [];

  const nudges: FounderNudgeData[] = [];

  for (const v of ventures) {
    const foundersArr = v.founders as { user_id: string; name: string }[] | null;
    const founder = foundersArr?.[0];
    if (!founder) continue;

    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(v.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const counters = v.counters as { followers?: number } | null;

    // Determine suggested action
    let suggestedAction: 'segment' | 'clip' | 'promise' = 'segment';
    if (daysSinceUpdate > 14) {
      suggestedAction = 'clip'; // Quick win for very idle founders
    } else if (daysSinceUpdate > 21) {
      suggestedAction = 'promise'; // Accountability for long-idle founders
    }

    nudges.push({
      founderName: founder.name,
      ventureName: v.name,
      ventureSlug: v.slug,
      daysSinceUpdate,
      followers: counters?.followers || 0,
      suggestedAction,
      currentRung: v.rung,
    });
  }

  return nudges;
}

/**
 * Send nudge emails to idle founders
 */
export async function sendFounderNudges(minDays: number = 7): Promise<{ sent: number; errors: number }> {
  const supabase = await createAdminClient();
  const idleFounders = await getIdleFounders(minDays);

  let sent = 0;
  let errors = 0;

  for (const nudgeData of idleFounders) {
    try {
      // Get founder's email
      const { data: venture } = await supabase
        .from('ventures')
        .select('founders(user_id)')
        .eq('slug', nudgeData.ventureSlug)
        .single();

      const foundersArr = venture?.founders as { user_id: string }[] | null;
      const founder = foundersArr?.[0];
      if (!founder) continue;

      const { data: userData } = await supabase.auth.admin.getUserById(founder.user_id);
      if (!userData?.user?.email) continue;

      const email = founderNudgeEmail(nudgeData);
      const result = await sendEmail({
        to: userData.user.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      if (result.success) {
        sent++;
      } else {
        errors++;
      }
    } catch (error) {
      console.error(`Failed to send nudge for ${nudgeData.ventureName}:`, error);
      errors++;
    }
  }

  return { sent, errors };
}

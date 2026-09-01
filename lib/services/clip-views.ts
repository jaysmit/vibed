import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';
import type { ClipView } from '@/lib/supabase/types';

export interface ViewStats {
  totalViews: number;
  uniqueViewers: number;
  avgWatchPercent: number;
  completionRate: number;
  rewatchRate: number;
  followAfterRate: number;
}

/**
 * Record the start of a clip view
 * Returns the view ID for subsequent updates
 */
export async function recordViewStart(
  clipId: string,
  userId: string | null,
  anonId: string | null,
  sessionId: string | null
): Promise<string> {
  const supabase = await createAdminClient();

  // Get clip to verify exists and get venture_id
  const { data: clip } = await supabase
    .from('clips')
    .select('id, venture_id')
    .eq('id', clipId)
    .is('deleted_at', null)
    .single();

  if (!clip) {
    throw new Error('Clip not found');
  }

  // Check for existing view in this session (for rewatch detection)
  let isRewatch = false;
  if (sessionId) {
    const { data: existingView } = await supabase
      .from('clip_views')
      .select('id')
      .eq('clip_id', clipId)
      .eq('session_id', sessionId)
      .limit(1)
      .single();

    isRewatch = !!existingView;
  }

  // Create view record
  const { data: view, error } = await supabase
    .from('clip_views')
    .insert({
      clip_id: clipId,
      user_id: userId,
      anon_id: anonId,
      session_id: sessionId,
      watch_percent: 0,
      completed: false,
      rewatched: isRewatch,
      followed_venture_after: false,
      endorsed_after: false,
    })
    .select('id')
    .single();

  if (error || !view) {
    throw new Error(`Failed to record view: ${error?.message}`);
  }

  // Increment view counter on clip
  await incrementViewCounter(clipId, isRewatch);

  // Log event
  await logEvent({
    type: EVENT_TYPES.CLIP_VIEW_START,
    actorId: userId || undefined,
    anonId: anonId || undefined,
    ventureId: clip.venture_id,
    clipId,
    meta: { isRewatch },
  });

  return view.id;
}

/**
 * Update watch progress for a view
 */
export async function updateWatchProgress(
  viewId: string,
  watchPercent: number
): Promise<void> {
  const supabase = await createAdminClient();

  const completed = watchPercent >= 90; // Consider 90%+ as complete

  const { data: view } = await supabase
    .from('clip_views')
    .select('clip_id, completed, watch_percent')
    .eq('id', viewId)
    .single();

  if (!view) return;

  // Only update if progress increased
  if (watchPercent <= (view.watch_percent || 0)) return;

  await supabase
    .from('clip_views')
    .update({
      watch_percent: watchPercent,
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', viewId);

  // If just completed, increment complete counter
  if (completed && !view.completed) {
    await incrementCompleteCounter(view.clip_id);

    const { data: clip } = await supabase
      .from('clips')
      .select('venture_id')
      .eq('id', view.clip_id)
      .single();

    if (clip) {
      await logEvent({
        type: EVENT_TYPES.CLIP_COMPLETE,
        ventureId: clip.venture_id,
        clipId: view.clip_id,
        meta: { watchPercent },
      });
    }
  }
}

/**
 * Mark that user followed the venture after watching
 */
export async function markFollowedVentureAfter(viewId: string): Promise<void> {
  const supabase = await createAdminClient();

  const { data: view } = await supabase
    .from('clip_views')
    .select('clip_id, followed_venture_after')
    .eq('id', viewId)
    .single();

  if (!view || view.followed_venture_after) return;

  await supabase
    .from('clip_views')
    .update({
      followed_venture_after: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', viewId);

  // Increment follow-after counter
  await incrementFollowAfterCounter(view.clip_id);
}

/**
 * Mark that user endorsed the clip after watching
 */
export async function markEndorsedAfter(viewId: string): Promise<void> {
  const supabase = await createAdminClient();

  await supabase
    .from('clip_views')
    .update({
      endorsed_after: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', viewId);
}

/**
 * Get view statistics for a clip
 */
export async function getViewStats(clipId: string): Promise<ViewStats> {
  const supabase = await createAdminClient();

  const { data: views } = await supabase
    .from('clip_views')
    .select('user_id, anon_id, watch_percent, completed, rewatched, followed_venture_after')
    .eq('clip_id', clipId);

  if (!views || views.length === 0) {
    return {
      totalViews: 0,
      uniqueViewers: 0,
      avgWatchPercent: 0,
      completionRate: 0,
      rewatchRate: 0,
      followAfterRate: 0,
    };
  }

  // Count unique viewers
  const uniqueIds = new Set<string>();
  for (const v of views) {
    uniqueIds.add(v.user_id || v.anon_id || 'unknown');
  }

  const totalViews = views.length;
  const completedViews = views.filter((v) => v.completed).length;
  const rewatches = views.filter((v) => v.rewatched).length;
  const followedAfter = views.filter((v) => v.followed_venture_after).length;
  const totalWatchPercent = views.reduce((sum, v) => sum + (v.watch_percent || 0), 0);

  return {
    totalViews,
    uniqueViewers: uniqueIds.size,
    avgWatchPercent: Math.round(totalWatchPercent / totalViews),
    completionRate: Math.round((completedViews / totalViews) * 100),
    rewatchRate: Math.round((rewatches / totalViews) * 100),
    followAfterRate: Math.round((followedAfter / totalViews) * 100),
  };
}

/**
 * Get recent views for a clip (for analytics)
 */
export async function getRecentViews(
  clipId: string,
  limit: number = 100
): Promise<ClipView[]> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('clip_views')
    .select('*')
    .eq('clip_id', clipId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []) as ClipView[];
}

/**
 * Find the most recent view for a user/session on a clip
 * Used to link endorsements and follows back to views
 */
export async function findRecentView(
  clipId: string,
  userId: string | null,
  sessionId: string | null
): Promise<string | null> {
  const supabase = await createAdminClient();

  let query = supabase
    .from('clip_views')
    .select('id')
    .eq('clip_id', clipId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  } else {
    return null;
  }

  const { data } = await query.single();
  return data?.id || null;
}

// ============================================
// COUNTER HELPERS (denormalization)
// ============================================

async function incrementViewCounter(clipId: string, isRewatch: boolean) {
  const supabase = await createAdminClient();

  const { data: clip } = await supabase
    .from('clips')
    .select('counters')
    .eq('id', clipId)
    .single();

  if (!clip) return;

  const counters = clip.counters as Record<string, number>;
  const updates: Record<string, number> = {
    ...counters,
    views: (counters.views || 0) + 1,
  };

  if (isRewatch) {
    updates.rewatches = (counters.rewatches || 0) + 1;
  }

  await supabase.from('clips').update({ counters: updates }).eq('id', clipId);
}

async function incrementCompleteCounter(clipId: string) {
  const supabase = await createAdminClient();

  const { data: clip } = await supabase
    .from('clips')
    .select('counters')
    .eq('id', clipId)
    .single();

  if (!clip) return;

  const counters = clip.counters as Record<string, number>;
  await supabase
    .from('clips')
    .update({
      counters: {
        ...counters,
        completes: (counters.completes || 0) + 1,
      },
    })
    .eq('id', clipId);
}

async function incrementFollowAfterCounter(clipId: string) {
  const supabase = await createAdminClient();

  const { data: clip } = await supabase
    .from('clips')
    .select('counters')
    .eq('id', clipId)
    .single();

  if (!clip) return;

  const counters = clip.counters as Record<string, number>;
  await supabase
    .from('clips')
    .update({
      counters: {
        ...counters,
        follows_after: (counters.follows_after || 0) + 1,
      },
    })
    .eq('id', clipId);
}

/**
 * Recalculate average watch percent for a clip
 * Called periodically or on-demand
 */
export async function recalculateAvgWatchPercent(clipId: string): Promise<number> {
  const supabase = await createAdminClient();

  const { data: views } = await supabase
    .from('clip_views')
    .select('watch_percent')
    .eq('clip_id', clipId);

  if (!views || views.length === 0) return 0;

  const avg = Math.round(
    views.reduce((sum, v) => sum + (v.watch_percent || 0), 0) / views.length
  );

  // Update counter
  const { data: clip } = await supabase
    .from('clips')
    .select('counters')
    .eq('id', clipId)
    .single();

  if (clip) {
    const counters = clip.counters as Record<string, number>;
    await supabase
      .from('clips')
      .update({
        counters: {
          ...counters,
          avg_watch_percent: avg,
        },
      })
      .eq('id', clipId);
  }

  return avg;
}

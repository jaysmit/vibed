import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';
import type { EndorsementReason, ClipEndorsement } from '@/lib/supabase/types';

export interface EndorsementStats {
  total: number;
  fromFounders: number;
  byReason: Record<EndorsementReason, number>;
}

/**
 * Endorse a clip (like with optional reason)
 */
export async function endorseClip(
  userId: string,
  clipId: string,
  reason?: EndorsementReason
): Promise<{ success: boolean; alreadyEndorsed?: boolean }> {
  const supabase = await createAdminClient();

  // Get the clip to verify it exists and get venture info
  const { data: clip } = await supabase
    .from('clips')
    .select('id, venture_id')
    .eq('id', clipId)
    .is('deleted_at', null)
    .single();

  if (!clip) {
    throw new Error('Clip not found');
  }

  // Get endorser's founder status (if they have a venture)
  const { data: founder } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', userId)
    .single();

  let founderRung: string | null = null;
  if (founder) {
    // Get their most advanced venture's rung
    const { data: venture } = await supabase
      .from('ventures')
      .select('rung')
      .eq('founder_id', founder.id)
      .eq('status', 'live')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    founderRung = venture?.rung || null;
  }

  // Try to insert endorsement (will fail if already exists due to unique constraint)
  const { error } = await supabase.from('clip_endorsements').insert({
    clip_id: clipId,
    user_id: userId,
    reason: reason || null,
    founder_rung: founderRung,
  });

  if (error) {
    if (error.code === '23505') {
      // Unique violation - already endorsed
      return { success: true, alreadyEndorsed: true };
    }
    throw new Error(`Failed to endorse clip: ${error.message}`);
  }

  // Increment counters on clip
  await incrementClipEndorsementCounters(clipId, founderRung !== null);

  // Log event
  await logEvent({
    type: EVENT_TYPES.CLIP_LIKE,
    actorId: userId,
    ventureId: clip.venture_id,
    clipId,
    meta: { reason, founderRung },
  });

  return { success: true };
}

/**
 * Remove endorsement from a clip
 */
export async function unendorseClip(
  userId: string,
  clipId: string
): Promise<{ success: boolean; wasEndorsed: boolean }> {
  const supabase = await createAdminClient();

  // Get existing endorsement to check founder status
  const { data: existing } = await supabase
    .from('clip_endorsements')
    .select('id, founder_rung')
    .eq('clip_id', clipId)
    .eq('user_id', userId)
    .single();

  if (!existing) {
    return { success: true, wasEndorsed: false };
  }

  // Delete endorsement
  const { error } = await supabase
    .from('clip_endorsements')
    .delete()
    .eq('clip_id', clipId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove endorsement: ${error.message}`);
  }

  // Decrement counters
  await decrementClipEndorsementCounters(clipId, existing.founder_rung !== null);

  // Get clip for event logging
  const { data: clip } = await supabase
    .from('clips')
    .select('venture_id')
    .eq('id', clipId)
    .single();

  if (clip) {
    await logEvent({
      type: EVENT_TYPES.CLIP_UNLIKE,
      actorId: userId,
      ventureId: clip.venture_id,
      clipId,
      meta: {},
    });
  }

  return { success: true, wasEndorsed: true };
}

/**
 * Check if a user has endorsed a clip
 */
export async function hasUserEndorsed(
  userId: string,
  clipId: string
): Promise<boolean> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('clip_endorsements')
    .select('id')
    .eq('clip_id', clipId)
    .eq('user_id', userId)
    .single();

  return !!data;
}

/**
 * Get user's endorsement for a clip (including reason)
 */
export async function getUserEndorsement(
  userId: string,
  clipId: string
): Promise<ClipEndorsement | null> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('clip_endorsements')
    .select('*')
    .eq('clip_id', clipId)
    .eq('user_id', userId)
    .single();

  return data as ClipEndorsement | null;
}

/**
 * Get endorsement statistics for a clip
 */
export async function getEndorsementStats(clipId: string): Promise<EndorsementStats> {
  const supabase = await createAdminClient();

  const { data: endorsements } = await supabase
    .from('clip_endorsements')
    .select('reason, founder_rung')
    .eq('clip_id', clipId);

  if (!endorsements || endorsements.length === 0) {
    return {
      total: 0,
      fromFounders: 0,
      byReason: {
        honest_failure: 0,
        useful_tactics: 0,
        changed_thinking: 0,
        less_alone: 0,
      },
    };
  }

  const stats: EndorsementStats = {
    total: endorsements.length,
    fromFounders: endorsements.filter((e) => e.founder_rung !== null).length,
    byReason: {
      honest_failure: 0,
      useful_tactics: 0,
      changed_thinking: 0,
      less_alone: 0,
    },
  };

  for (const e of endorsements) {
    if (e.reason && e.reason in stats.byReason) {
      stats.byReason[e.reason as EndorsementReason]++;
    }
  }

  return stats;
}

/**
 * Get all endorsements for a clip
 */
export async function getEndorsementsByClip(clipId: string): Promise<ClipEndorsement[]> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('clip_endorsements')
    .select('*')
    .eq('clip_id', clipId)
    .order('created_at', { ascending: false });

  return (data || []) as ClipEndorsement[];
}

/**
 * Check endorsement status for multiple clips (for batch rendering)
 */
export async function getUserEndorsementsForClips(
  userId: string,
  clipIds: string[]
): Promise<Record<string, boolean>> {
  if (clipIds.length === 0) return {};

  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('clip_endorsements')
    .select('clip_id')
    .eq('user_id', userId)
    .in('clip_id', clipIds);

  const result: Record<string, boolean> = {};
  for (const id of clipIds) {
    result[id] = false;
  }
  for (const e of data || []) {
    result[e.clip_id] = true;
  }

  return result;
}

// ============================================
// COUNTER HELPERS (denormalization)
// ============================================

async function incrementClipEndorsementCounters(clipId: string, isFromFounder: boolean) {
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
    likes: (counters.likes || 0) + 1,
  };

  if (isFromFounder) {
    updates.endorsements_from_founders = (counters.endorsements_from_founders || 0) + 1;
  }

  await supabase.from('clips').update({ counters: updates }).eq('id', clipId);
}

async function decrementClipEndorsementCounters(clipId: string, wasFromFounder: boolean) {
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
    likes: Math.max(0, (counters.likes || 0) - 1),
  };

  if (wasFromFounder) {
    updates.endorsements_from_founders = Math.max(
      0,
      (counters.endorsements_from_founders || 0) - 1
    );
  }

  await supabase.from('clips').update({ counters: updates }).eq('id', clipId);
}

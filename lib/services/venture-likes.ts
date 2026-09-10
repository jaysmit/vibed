import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';

/**
 * Like a venture
 */
export async function likeVenture(userId: string, ventureId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  // Check if already liked
  const { data: existing } = await supabase
    .from('venture_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .single();

  if (existing) {
    return false; // Already liked
  }

  // Create like
  const { error } = await supabase.from('venture_likes').insert({
    user_id: userId,
    venture_id: ventureId,
  });

  if (error) {
    console.error('Failed to create like:', error);
    return false;
  }

  // Increment counter on venture
  await updateVentureLikesCount(ventureId, 1);

  // Track event
  await logEvent({
    type: EVENT_TYPES.CLIP_LIKE, // Reusing clip like event type
    actorId: userId,
    ventureId: ventureId,
    meta: { targetType: 'venture' },
  });

  return true;
}

/**
 * Unlike a venture
 */
export async function unlikeVenture(userId: string, ventureId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  // Delete like
  const { data: deleted } = await supabase
    .from('venture_likes')
    .delete()
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .select();

  if (!deleted || deleted.length === 0) {
    return false; // Wasn't liked
  }

  // Decrement counter on venture
  await updateVentureLikesCount(ventureId, -1);

  // Track event
  await logEvent({
    type: EVENT_TYPES.CLIP_UNLIKE, // Reusing clip unlike event type
    actorId: userId,
    ventureId: ventureId,
    meta: { targetType: 'venture' },
  });

  return true;
}

/**
 * Check if user has liked a venture
 */
export async function hasLikedVenture(userId: string, ventureId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('venture_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .single();

  return !!data;
}

/**
 * Get likes count for a venture
 */
export async function getVentureLikesCount(ventureId: string): Promise<number> {
  const supabase = await createAdminClient();

  const { count } = await supabase
    .from('venture_likes')
    .select('id', { count: 'exact', head: true })
    .eq('venture_id', ventureId);

  return count || 0;
}

/**
 * Get all venture IDs liked by a user
 */
export async function getLikedVentureIds(userId: string): Promise<string[]> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('venture_likes')
    .select('venture_id')
    .eq('user_id', userId);

  return (data || []).map((l) => l.venture_id);
}

/**
 * Update the likes counter on a venture
 */
async function updateVentureLikesCount(ventureId: string, delta: number): Promise<void> {
  const supabase = await createAdminClient();

  const { data: venture } = await supabase
    .from('ventures')
    .select('counters')
    .eq('id', ventureId)
    .single();

  if (!venture) return;

  const counters = (venture.counters as Record<string, number>) || {};
  const newLikes = Math.max(0, (counters.likes || 0) + delta);

  await supabase
    .from('ventures')
    .update({
      counters: { ...counters, likes: newLikes },
    })
    .eq('id', ventureId);
}

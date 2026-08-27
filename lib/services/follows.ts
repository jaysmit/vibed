import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';

export async function followVenture(userId: string, ventureId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .single();

  if (existing) {
    return false; // Already following
  }

  // Create follow
  const { error } = await supabase.from('follows').insert({
    user_id: userId,
    venture_id: ventureId,
  });

  if (error) {
    console.error('Failed to create follow:', error);
    return false;
  }

  // Increment counter on venture
  const { data: venture } = await supabase
    .from('ventures')
    .select('counters')
    .eq('id', ventureId)
    .single();

  if (venture) {
    const counters = venture.counters as { followers: number };
    await supabase
      .from('ventures')
      .update({
        counters: { ...venture.counters, followers: (counters.followers || 0) + 1 },
      })
      .eq('id', ventureId);
  }

  // Track event
  await logEvent({
    type: EVENT_TYPES.FOLLOW_CREATED,
    actorId: userId,
    ventureId: ventureId,
    meta: { targetType: 'venture' },
  });

  return true;
}

export async function unfollowVenture(userId: string, ventureId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  // Delete follow
  const { data: deleted } = await supabase
    .from('follows')
    .delete()
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .select();

  if (!deleted || deleted.length === 0) {
    return false; // Wasn't following
  }

  // Decrement counter on venture
  const { data: venture } = await supabase
    .from('ventures')
    .select('counters')
    .eq('id', ventureId)
    .single();

  if (venture) {
    const counters = venture.counters as { followers: number };
    await supabase
      .from('ventures')
      .update({
        counters: { ...venture.counters, followers: Math.max(0, (counters.followers || 0) - 1) },
      })
      .eq('id', ventureId);
  }

  // Track event
  await logEvent({
    type: EVENT_TYPES.FOLLOW_REMOVED,
    actorId: userId,
    ventureId: ventureId,
    meta: { targetType: 'venture' },
  });

  return true;
}

export async function getFollowedVentureIds(userId: string): Promise<string[]> {
  const supabase = await createAdminClient();

  const { data: follows } = await supabase
    .from('follows')
    .select('venture_id')
    .eq('user_id', userId);

  return (follows || []).map((f) => f.venture_id);
}

export async function isFollowingVenture(userId: string, ventureId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  const { data: follow } = await supabase
    .from('follows')
    .select('id')
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .single();

  return !!follow;
}

import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';

export interface CheerWithAuthor {
  id: string;
  venture_id: string;
  user_id: string;
  founder_id: string | null;
  created_at: string;
  author: {
    id: string;
    name: string;
    slug: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Add a cheer to a venture
 */
export async function addCheer(
  userId: string,
  ventureId: string
): Promise<{ success: boolean; cheerId?: string }> {
  const supabase = await createAdminClient();

  // Get user's founder profile (if exists)
  const { data: founder } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', userId)
    .single();

  // Check if already cheered
  const { data: existing } = await supabase
    .from('cheers')
    .select('id')
    .eq('venture_id', ventureId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return { success: true, cheerId: existing.id };
  }

  // Insert cheer
  const { data: cheer, error } = await supabase
    .from('cheers')
    .insert({
      venture_id: ventureId,
      user_id: userId,
      founder_id: founder?.id || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add cheer: ${error.message}`);
  }

  // Increment cheer counter on venture
  await incrementVentureCheerCount(ventureId);

  // Log event
  await logEvent({
    type: EVENT_TYPES.VENTURE_CHEERED,
    actorId: userId,
    ventureId,
    meta: { cheerId: cheer.id },
  });

  return { success: true, cheerId: cheer.id };
}

/**
 * Remove a cheer from a venture
 */
export async function removeCheer(
  userId: string,
  ventureId: string
): Promise<{ success: boolean }> {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('cheers')
    .delete()
    .eq('venture_id', ventureId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove cheer: ${error.message}`);
  }

  // Decrement cheer counter
  await decrementVentureCheerCount(ventureId);

  return { success: true };
}

/**
 * Check if user has cheered a venture
 */
export async function hasUserCheered(
  userId: string,
  ventureId: string
): Promise<boolean> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('cheers')
    .select('id')
    .eq('venture_id', ventureId)
    .eq('user_id', userId)
    .single();

  return !!data;
}

/**
 * Get cheer count for a venture
 */
export async function getCheerCount(ventureId: string): Promise<number> {
  const supabase = await createAdminClient();

  const { count } = await supabase
    .from('cheers')
    .select('id', { count: 'exact', head: true })
    .eq('venture_id', ventureId);

  return count || 0;
}

/**
 * Get recent cheers for a venture with author info
 */
export async function getRecentCheers(
  ventureId: string,
  limit: number = 5
): Promise<CheerWithAuthor[]> {
  const supabase = await createAdminClient();

  const { data: cheers } = await supabase
    .from('cheers')
    .select(`
      *,
      founders (
        id,
        name,
        slug,
        links
      )
    `)
    .eq('venture_id', ventureId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!cheers) return [];

  return cheers.map((cheer) => {
    const founder = cheer.founders as {
      id: string;
      name: string;
      slug: string;
      links: Record<string, string>;
    } | null;

    return {
      id: cheer.id,
      venture_id: cheer.venture_id,
      user_id: cheer.user_id,
      founder_id: cheer.founder_id,
      created_at: cheer.created_at,
      author: founder
        ? {
            id: founder.id,
            name: founder.name,
            slug: founder.slug,
            avatar_url: founder.links?.avatar || null,
          }
        : null,
    };
  });
}

// ============================================
// COUNTER HELPERS
// ============================================

async function incrementVentureCheerCount(ventureId: string) {
  const supabase = await createAdminClient();

  const { data: venture } = await supabase
    .from('ventures')
    .select('counters')
    .eq('id', ventureId)
    .single();

  if (!venture) return;

  const counters = (venture.counters as Record<string, number>) || {};
  await supabase
    .from('ventures')
    .update({
      counters: {
        ...counters,
        cheers: (counters.cheers || 0) + 1,
      },
    })
    .eq('id', ventureId);
}

async function decrementVentureCheerCount(ventureId: string) {
  const supabase = await createAdminClient();

  const { data: venture } = await supabase
    .from('ventures')
    .select('counters')
    .eq('id', ventureId)
    .single();

  if (!venture) return;

  const counters = (venture.counters as Record<string, number>) || {};
  await supabase
    .from('ventures')
    .update({
      counters: {
        ...counters,
        cheers: Math.max(0, (counters.cheers || 0) - 1),
      },
    })
    .eq('id', ventureId);
}

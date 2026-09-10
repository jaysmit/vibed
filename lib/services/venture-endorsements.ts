import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';
import type { VentureEndorsement, VentureEndorsementReason } from '@/lib/supabase/types';
import { getUserTrust, canPerformAction, getEndorsementWeight } from './user-trust';

/**
 * Endorse a venture (trust-gated: requires contributor or champion tier)
 */
export async function endorseVenture(
  userId: string,
  ventureId: string,
  reason?: VentureEndorsementReason
): Promise<{ success: boolean; error?: string; endorsement?: VentureEndorsement }> {
  const supabase = await createAdminClient();

  // Get user's trust tier
  const trust = await getUserTrust(userId);

  // Check if user can endorse
  if (!canPerformAction(trust.tier, 'endorse')) {
    return {
      success: false,
      error: `You need to be a Contributor to endorse ventures. Keep engaging to level up!`,
    };
  }

  // Check if already endorsed
  const { data: existing } = await supabase
    .from('venture_endorsements')
    .select('id')
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .single();

  if (existing) {
    return { success: false, error: 'You have already endorsed this venture' };
  }

  // Get endorsement weight based on tier
  const weight = getEndorsementWeight(trust.tier);

  // Create endorsement
  const { data: endorsement, error } = await supabase
    .from('venture_endorsements')
    .insert({
      user_id: userId,
      venture_id: ventureId,
      reason: reason || null,
      endorser_tier: trust.tier as 'contributor' | 'champion',
      weight,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create endorsement:', error);
    return { success: false, error: 'Failed to create endorsement' };
  }

  // Update venture endorsements counter
  await updateVentureEndorsementsCount(ventureId, weight);

  // Track event
  await logEvent({
    type: EVENT_TYPES.VENTURE_CHEERED, // Reusing cheer event type for endorsements
    actorId: userId,
    ventureId: ventureId,
    meta: {
      action: 'endorsed',
      reason: reason || null,
      tier: trust.tier,
      weight,
    },
  });

  return { success: true, endorsement: endorsement as VentureEndorsement };
}

/**
 * Remove endorsement from a venture
 */
export async function unendorseVenture(userId: string, ventureId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  // Get the endorsement to know its weight
  const { data: endorsement } = await supabase
    .from('venture_endorsements')
    .select('weight')
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .single();

  if (!endorsement) {
    return false; // Wasn't endorsed
  }

  // Delete endorsement
  const { error } = await supabase
    .from('venture_endorsements')
    .delete()
    .eq('user_id', userId)
    .eq('venture_id', ventureId);

  if (error) {
    console.error('Failed to delete endorsement:', error);
    return false;
  }

  // Decrement venture endorsements counter
  await updateVentureEndorsementsCount(ventureId, -endorsement.weight);

  return true;
}

/**
 * Check if user has endorsed a venture
 */
export async function hasEndorsedVenture(userId: string, ventureId: string): Promise<boolean> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('venture_endorsements')
    .select('id')
    .eq('user_id', userId)
    .eq('venture_id', ventureId)
    .single();

  return !!data;
}

/**
 * Get endorsement data for a venture
 */
export async function getVentureEndorsementData(
  ventureId: string
): Promise<{ total: number; weighted: number; byReason: Record<string, number> }> {
  const supabase = await createAdminClient();

  const { data: endorsements } = await supabase
    .from('venture_endorsements')
    .select('reason, weight')
    .eq('venture_id', ventureId);

  if (!endorsements || endorsements.length === 0) {
    return { total: 0, weighted: 0, byReason: {} };
  }

  const byReason: Record<string, number> = {};
  let weighted = 0;

  for (const e of endorsements) {
    weighted += e.weight;
    if (e.reason) {
      byReason[e.reason] = (byReason[e.reason] || 0) + 1;
    }
  }

  return {
    total: endorsements.length,
    weighted,
    byReason,
  };
}

/**
 * Get all venture IDs endorsed by a user
 */
export async function getEndorsedVentureIds(userId: string): Promise<string[]> {
  const supabase = await createAdminClient();

  const { data } = await supabase
    .from('venture_endorsements')
    .select('venture_id')
    .eq('user_id', userId);

  return (data || []).map((e) => e.venture_id);
}

/**
 * Update the endorsements counter on a venture
 */
async function updateVentureEndorsementsCount(ventureId: string, delta: number): Promise<void> {
  const supabase = await createAdminClient();

  const { data: venture } = await supabase
    .from('ventures')
    .select('counters')
    .eq('id', ventureId)
    .single();

  if (!venture) return;

  const counters = (venture.counters as Record<string, number>) || {};
  const newEndorsements = Math.max(0, (counters.endorsements || 0) + delta);

  await supabase
    .from('ventures')
    .update({
      counters: { ...counters, endorsements: newEndorsements },
    })
    .eq('id', ventureId);
}

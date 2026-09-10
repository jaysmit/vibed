import { createAdminClient } from '@/lib/supabase/server';
import type { UserTrust, TrustTier } from '@/lib/supabase/types';
import { TRUST_TIER_REQUIREMENTS } from '@/lib/supabase/types';

/**
 * Calculate the appropriate tier based on user metrics
 */
export function calculateTier(daysActive: number, commentsCount: number, followsCount: number): TrustTier {
  // Check from highest to lowest tier
  if (
    daysActive >= TRUST_TIER_REQUIREMENTS.champion.daysActive &&
    commentsCount >= TRUST_TIER_REQUIREMENTS.champion.comments &&
    followsCount >= TRUST_TIER_REQUIREMENTS.champion.follows
  ) {
    return 'champion';
  }

  if (
    daysActive >= TRUST_TIER_REQUIREMENTS.contributor.daysActive &&
    commentsCount >= TRUST_TIER_REQUIREMENTS.contributor.comments &&
    followsCount >= TRUST_TIER_REQUIREMENTS.contributor.follows
  ) {
    return 'contributor';
  }

  if (
    daysActive >= TRUST_TIER_REQUIREMENTS.member.daysActive &&
    followsCount >= TRUST_TIER_REQUIREMENTS.member.follows
  ) {
    return 'member';
  }

  return 'newcomer';
}

/**
 * Get or create user trust record
 */
export async function getUserTrust(userId: string): Promise<UserTrust> {
  const supabase = await createAdminClient();

  // Try to get existing record
  const { data: existing } = await supabase
    .from('user_trust')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update days_active based on first_active_at
    const firstActive = new Date(existing.first_active_at);
    const now = new Date();
    const daysActive = Math.floor((now.getTime() - firstActive.getTime()) / (1000 * 60 * 60 * 24));

    // Only update if days changed
    if (daysActive !== existing.days_active) {
      const newTier = calculateTier(daysActive, existing.comments_count, existing.follows_count);

      const { data: updated } = await supabase
        .from('user_trust')
        .update({
          days_active: daysActive,
          tier: newTier,
        })
        .eq('user_id', userId)
        .select()
        .single();

      return updated as UserTrust;
    }

    return existing as UserTrust;
  }

  // Create new record
  const { data: created, error } = await supabase
    .from('user_trust')
    .insert({
      user_id: userId,
      first_active_at: new Date().toISOString(),
      days_active: 0,
      comments_count: 0,
      follows_count: 0,
      tier: 'newcomer',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create user trust record:', error);
    // Return a default object if creation fails
    return {
      id: '',
      user_id: userId,
      first_active_at: new Date().toISOString(),
      days_active: 0,
      comments_count: 0,
      follows_count: 0,
      tier: 'newcomer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return created as UserTrust;
}

/**
 * Increment follows count and recalculate tier
 */
export async function incrementFollows(userId: string): Promise<void> {
  const supabase = await createAdminClient();

  // Get current trust or create it
  const trust = await getUserTrust(userId);

  const newFollowsCount = trust.follows_count + 1;
  const newTier = calculateTier(trust.days_active, trust.comments_count, newFollowsCount);

  await supabase
    .from('user_trust')
    .update({
      follows_count: newFollowsCount,
      tier: newTier,
    })
    .eq('user_id', userId);
}

/**
 * Decrement follows count and recalculate tier
 */
export async function decrementFollows(userId: string): Promise<void> {
  const supabase = await createAdminClient();

  const trust = await getUserTrust(userId);

  const newFollowsCount = Math.max(0, trust.follows_count - 1);
  const newTier = calculateTier(trust.days_active, trust.comments_count, newFollowsCount);

  await supabase
    .from('user_trust')
    .update({
      follows_count: newFollowsCount,
      tier: newTier,
    })
    .eq('user_id', userId);
}

/**
 * Increment comments count and recalculate tier
 */
export async function incrementComments(userId: string): Promise<void> {
  const supabase = await createAdminClient();

  const trust = await getUserTrust(userId);

  const newCommentsCount = trust.comments_count + 1;
  const newTier = calculateTier(trust.days_active, newCommentsCount, trust.follows_count);

  await supabase
    .from('user_trust')
    .update({
      comments_count: newCommentsCount,
      tier: newTier,
    })
    .eq('user_id', userId);
}

/**
 * Check if user can perform an action based on their tier
 */
export function canPerformAction(tier: TrustTier, action: 'like' | 'comment' | 'endorse'): boolean {
  switch (action) {
    case 'like':
      // Everyone can like
      return true;
    case 'comment':
      // Members and above can comment
      return tier !== 'newcomer';
    case 'endorse':
      // Contributors and above can endorse
      return tier === 'contributor' || tier === 'champion';
    default:
      return false;
  }
}

/**
 * Get endorsement weight for a tier
 */
export function getEndorsementWeight(tier: TrustTier): 1 | 2 {
  return tier === 'champion' ? 2 : 1;
}

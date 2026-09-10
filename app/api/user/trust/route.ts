import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { getUserTrust, canPerformAction } from '@/lib/services/user-trust';
import { TRUST_TIER_REQUIREMENTS, TRUST_TIER_ABILITIES } from '@/lib/supabase/types';

// GET - Get current user's trust tier and metrics
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const trust = await getUserTrust(userId);

    // Calculate progress to next tier
    let nextTier: string | null = null;
    let progress: { daysActive: number; comments: number; follows: number } | null = null;

    if (trust.tier === 'newcomer') {
      nextTier = 'member';
      progress = {
        daysActive: Math.min(trust.days_active, TRUST_TIER_REQUIREMENTS.member.daysActive),
        comments: trust.comments_count,
        follows: Math.min(trust.follows_count, TRUST_TIER_REQUIREMENTS.member.follows),
      };
    } else if (trust.tier === 'member') {
      nextTier = 'contributor';
      progress = {
        daysActive: Math.min(trust.days_active, TRUST_TIER_REQUIREMENTS.contributor.daysActive),
        comments: Math.min(trust.comments_count, TRUST_TIER_REQUIREMENTS.contributor.comments),
        follows: Math.min(trust.follows_count, TRUST_TIER_REQUIREMENTS.contributor.follows),
      };
    } else if (trust.tier === 'contributor') {
      nextTier = 'champion';
      progress = {
        daysActive: Math.min(trust.days_active, TRUST_TIER_REQUIREMENTS.champion.daysActive),
        comments: Math.min(trust.comments_count, TRUST_TIER_REQUIREMENTS.champion.comments),
        follows: Math.min(trust.follows_count, TRUST_TIER_REQUIREMENTS.champion.follows),
      };
    }

    return NextResponse.json({
      tier: trust.tier,
      daysActive: trust.days_active,
      commentsCount: trust.comments_count,
      followsCount: trust.follows_count,
      abilities: TRUST_TIER_ABILITIES[trust.tier],
      canLike: canPerformAction(trust.tier, 'like'),
      canComment: canPerformAction(trust.tier, 'comment'),
      canEndorse: canPerformAction(trust.tier, 'endorse'),
      nextTier,
      nextTierRequirements: nextTier ? TRUST_TIER_REQUIREMENTS[nextTier as keyof typeof TRUST_TIER_REQUIREMENTS] : null,
      progress,
    });
  } catch (error) {
    console.error('Error getting user trust:', error);
    return NextResponse.json(
      { error: 'Failed to get trust data' },
      { status: 500 }
    );
  }
}

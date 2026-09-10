import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { endorseVenture, unendorseVenture, hasEndorsedVenture, getVentureEndorsementData } from '@/lib/services/venture-endorsements';
import { getUserTrust } from '@/lib/services/user-trust';
import type { VentureEndorsementReason } from '@/lib/supabase/types';

// GET - Check if user has endorsed and get endorsement data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ventureId } = await params;
    const userId = await getCurrentUserId();

    const [data, hasEndorsed, userTrust] = await Promise.all([
      getVentureEndorsementData(ventureId),
      userId ? hasEndorsedVenture(userId, ventureId) : false,
      userId ? getUserTrust(userId) : null,
    ]);

    return NextResponse.json({
      total: data.total,
      weighted: data.weighted,
      byReason: data.byReason,
      hasEndorsed,
      userTier: userTrust?.tier || 'newcomer',
      canEndorse: userTrust ? (userTrust.tier === 'contributor' || userTrust.tier === 'champion') : false,
    });
  } catch (error) {
    console.error('Error getting endorsements:', error);
    return NextResponse.json(
      { error: 'Failed to get endorsements' },
      { status: 500 }
    );
  }
}

// POST - Add an endorsement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: ventureId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason as VentureEndorsementReason | undefined;

    const result = await endorseVenture(userId, ventureId, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, hasEndorsed: false },
        { status: 400 }
      );
    }

    const data = await getVentureEndorsementData(ventureId);

    return NextResponse.json({
      success: true,
      total: data.total,
      weighted: data.weighted,
      hasEndorsed: true,
    });
  } catch (error) {
    console.error('Error adding endorsement:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add endorsement' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an endorsement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: ventureId } = await params;
    const success = await unendorseVenture(userId, ventureId);

    if (!success) {
      return NextResponse.json(
        { error: 'Not endorsed', hasEndorsed: false },
        { status: 400 }
      );
    }

    const data = await getVentureEndorsementData(ventureId);

    return NextResponse.json({
      success: true,
      total: data.total,
      weighted: data.weighted,
      hasEndorsed: false,
    });
  } catch (error) {
    console.error('Error removing endorsement:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove endorsement' },
      { status: 500 }
    );
  }
}

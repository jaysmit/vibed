import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { addCheer, removeCheer, hasUserCheered, getCheerCount, getRecentCheers } from '@/lib/services/cheers';

// GET - Check if user has cheered and get cheer count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ventureId } = await params;
    const userId = await getCurrentUserId();

    const [count, hasCheered, recentCheers] = await Promise.all([
      getCheerCount(ventureId),
      userId ? hasUserCheered(userId, ventureId) : false,
      getRecentCheers(ventureId, 5),
    ]);

    return NextResponse.json({
      count,
      hasCheered,
      recentCheers,
    });
  } catch (error) {
    console.error('Error getting cheers:', error);
    return NextResponse.json(
      { error: 'Failed to get cheers' },
      { status: 500 }
    );
  }
}

// POST - Add a cheer
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
    const result = await addCheer(userId, ventureId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding cheer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add cheer' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a cheer
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
    const result = await removeCheer(userId, ventureId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error removing cheer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove cheer' },
      { status: 500 }
    );
  }
}

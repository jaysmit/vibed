import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { likeVenture, unlikeVenture, hasLikedVenture, getVentureLikesCount } from '@/lib/services/venture-likes';

// GET - Check if user has liked and get like count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ventureId } = await params;
    const userId = await getCurrentUserId();

    const [count, hasLiked] = await Promise.all([
      getVentureLikesCount(ventureId),
      userId ? hasLikedVenture(userId, ventureId) : false,
    ]);

    return NextResponse.json({
      count,
      hasLiked,
    });
  } catch (error) {
    console.error('Error getting likes:', error);
    return NextResponse.json(
      { error: 'Failed to get likes' },
      { status: 500 }
    );
  }
}

// POST - Add a like
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
    const success = await likeVenture(userId, ventureId);

    if (!success) {
      return NextResponse.json(
        { error: 'Already liked', hasLiked: true },
        { status: 400 }
      );
    }

    const count = await getVentureLikesCount(ventureId);

    return NextResponse.json({ success: true, count, hasLiked: true });
  } catch (error) {
    console.error('Error adding like:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add like' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a like
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
    const success = await unlikeVenture(userId, ventureId);

    if (!success) {
      return NextResponse.json(
        { error: 'Not liked', hasLiked: false },
        { status: 400 }
      );
    }

    const count = await getVentureLikesCount(ventureId);

    return NextResponse.json({ success: true, count, hasLiked: false });
  } catch (error) {
    console.error('Error removing like:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove like' },
      { status: 500 }
    );
  }
}

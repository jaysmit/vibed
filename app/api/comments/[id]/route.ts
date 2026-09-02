import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { deleteComment, getReplies } from '@/lib/services/comments';

/**
 * GET /api/comments/[id]
 * Get replies to a comment
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;

  try {
    const replies = await getReplies(commentId);
    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
  }
}

/**
 * DELETE /api/comments/[id]
 * Delete a comment (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: commentId } = await params;

  try {
    await deleteComment(userId, commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete comment';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

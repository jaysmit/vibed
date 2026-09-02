import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createComment, getCommentsByClip } from '@/lib/services/comments';

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  replyToId: z.string().uuid().optional(),
});

/**
 * GET /api/clips/[id]/comments
 * Get comments for a clip
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clipId } = await params;
  const { searchParams } = new URL(req.url);

  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const { comments, total } = await getCommentsByClip(clipId, { limit, offset });

    return NextResponse.json({
      comments,
      total,
      hasMore: offset + comments.length < total,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

/**
 * POST /api/clips/[id]/comments
 * Create a new comment on a clip
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: clipId } = await params;

  try {
    const body = await req.json();
    const parsed = CreateCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const comment = await createComment(userId, {
      clipId,
      content: parsed.data.content,
      replyToId: parsed.data.replyToId,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    const message = error instanceof Error ? error.message : 'Failed to create comment';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createVentureComment, getCommentsByVenture } from '@/lib/services/comments';

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  replyToId: z.string().uuid().optional(),
});

// GET - Get comments for a venture
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ventureId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await getCommentsByVenture(ventureId, { limit, offset });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting venture comments:', error);
    return NextResponse.json(
      { error: 'Failed to get comments' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment on a venture
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
    const body = await request.json();
    const parsed = CreateCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const comment = await createVentureComment(userId, {
      ventureId,
      content: parsed.data.content,
      replyToId: parsed.data.replyToId,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error creating venture comment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    );
  }
}

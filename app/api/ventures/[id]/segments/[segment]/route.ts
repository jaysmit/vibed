import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { updateSegment } from '@/lib/services/ventures';
import { SEGMENT_KEYS } from '@/lib/domain/rungs';
import type { SegmentKey } from '@/lib/domain/rungs';
import { z } from 'zod';

const UpdateSegmentSchema = z.object({
  body: z.string().max(10000),
  happenedAt: z.string().optional(), // ISO date when this actually happened
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; segment: string }> }
) {
  const userId = await getCurrentUserId();
  const { id, segment } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate segment key
  if (!SEGMENT_KEYS.includes(segment as SegmentKey)) {
    return NextResponse.json({ error: 'Invalid segment' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const data = UpdateSegmentSchema.parse(body);

    const result = await updateSegment(
      id,
      userId,
      segment as SegmentKey,
      data
    );

    if (!result) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Update segment error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

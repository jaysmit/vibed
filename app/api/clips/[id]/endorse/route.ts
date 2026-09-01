import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import {
  endorseClip,
  unendorseClip,
  hasUserEndorsed,
  getUserEndorsement,
} from '@/lib/services/endorsements';
import type { EndorsementReason } from '@/lib/supabase/types';

// GET - Check if user has endorsed this clip
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ endorsed: false });
  }

  const { id } = await params;
  const endorsement = await getUserEndorsement(userId, id);

  return NextResponse.json({
    endorsed: !!endorsement,
    reason: endorsement?.reason || null,
  });
}

// POST - Endorse a clip
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let reason: EndorsementReason | undefined;
  try {
    const body = await req.json();
    if (body.reason) {
      const validReasons = ['honest_failure', 'useful_tactics', 'changed_thinking', 'less_alone'];
      if (validReasons.includes(body.reason)) {
        reason = body.reason;
      }
    }
  } catch {
    // No body or invalid JSON - that's fine, reason is optional
  }

  try {
    const result = await endorseClip(userId, id, reason);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to endorse';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE - Remove endorsement
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await unendorseClip(userId, id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove endorsement';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

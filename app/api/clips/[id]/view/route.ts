import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import {
  recordViewStart,
  updateWatchProgress,
  getViewStats,
} from '@/lib/services/clip-views';

// GET - Get view stats for a clip (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const stats = await getViewStats(id);
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get stats';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// POST - Record view start, returns viewId for progress updates
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  let anonId: string | null = null;
  let sessionId: string | null = null;

  try {
    const body = await req.json();
    anonId = body.anonId || null;
    sessionId = body.sessionId || null;
  } catch {
    // No body - that's fine for logged in users
  }

  // Must have either userId or anonId
  if (!userId && !anonId) {
    return NextResponse.json(
      { error: 'Must provide anonId for anonymous views' },
      { status: 400 }
    );
  }

  try {
    const viewId = await recordViewStart(id, userId, anonId, sessionId);
    return NextResponse.json({ viewId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record view';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PATCH - Update watch progress
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Note: The id here is the clip_id, but we need viewId from the body
  // This is a bit awkward but keeps URLs clean

  let viewId: string;
  let watchPercent: number;

  try {
    const body = await req.json();
    viewId = body.viewId;
    watchPercent = body.watchPercent;

    if (!viewId || typeof watchPercent !== 'number') {
      return NextResponse.json(
        { error: 'viewId and watchPercent required' },
        { status: 400 }
      );
    }

    if (watchPercent < 0 || watchPercent > 100) {
      return NextResponse.json(
        { error: 'watchPercent must be 0-100' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    await updateWatchProgress(viewId, watchPercent);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update progress';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

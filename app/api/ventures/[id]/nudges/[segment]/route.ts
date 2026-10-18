import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createCachedAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string; segment: string }>;
}

// GET - check if current user has nudged and get count
export async function GET(request: Request, { params }: RouteParams) {
  const { id: ventureId, segment } = await params;

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ hasNudged: false, count: 0 });
  }

  const supabase = createCachedAdminClient();

  // Get nudge count and check if user has nudged
  const [countResult, userNudgeResult] = await Promise.all([
    supabase.from('segment_nudges')
      .select('id', { count: 'exact', head: true })
      .eq('venture_id', ventureId)
      .eq('segment_key', segment),
    supabase.from('segment_nudges')
      .select('id')
      .eq('venture_id', ventureId)
      .eq('segment_key', segment)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    hasNudged: !!userNudgeResult.data,
    count: countResult.count || 0,
  });
}

// POST - create a nudge
export async function POST(request: Request, { params }: RouteParams) {
  const { id: ventureId, segment } = await params;

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createCachedAdminClient();

  // Check if user is the owner (owners can't nudge their own ventures)
  const { data: venture } = await supabase
    .from('ventures')
    .select('founder_id')
    .eq('id', ventureId)
    .single();

  if (!venture) {
    return NextResponse.json({ error: 'Venture not found' }, { status: 404 });
  }

  // Get founder's user_id
  const { data: founder } = await supabase
    .from('founders')
    .select('user_id')
    .eq('id', venture.founder_id)
    .single();

  if (founder?.user_id === userId) {
    return NextResponse.json({ error: 'Cannot nudge your own venture' }, { status: 400 });
  }

  // Check for existing nudge
  const { data: existing } = await supabase
    .from('segment_nudges')
    .select('id')
    .eq('venture_id', ventureId)
    .eq('segment_key', segment)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Already nudged' }, { status: 400 });
  }

  // Create the nudge
  const { error } = await supabase
    .from('segment_nudges')
    .insert({
      venture_id: ventureId,
      segment_key: segment,
      user_id: userId,
    });

  if (error) {
    console.error('Failed to create nudge:', error);
    return NextResponse.json({ error: 'Failed to create nudge' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

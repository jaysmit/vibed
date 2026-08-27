import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { getClipsByVenture } from '@/lib/services/clips';
import { getVentureByFounderUserId } from '@/lib/services/ventures';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const venture = await getVentureByFounderUserId(userId);

  if (!venture || venture._id !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const clips = await getClipsByVenture(id);

  return NextResponse.json({ clips });
}

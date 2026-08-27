import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getClipsByVenture } from '@/lib/services/clips';
import { getVentureByFounderUserId } from '@/lib/services/ventures';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now();
  console.log('[clips/GET] Starting...');

  const authStart = Date.now();
  const session = await auth();
  console.log(`[clips/GET] Auth took ${Date.now() - authStart}ms`);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const ventureStart = Date.now();
  const venture = await getVentureByFounderUserId(session.user.id);
  console.log(`[clips/GET] Venture query took ${Date.now() - ventureStart}ms`);

  if (!venture || venture._id !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const clipsStart = Date.now();
  const clips = await getClipsByVenture(id);
  console.log(`[clips/GET] Clips query took ${Date.now() - clipsStart}ms`);

  console.log(`[clips/GET] Total: ${Date.now() - start}ms`);

  return NextResponse.json({ clips });
}

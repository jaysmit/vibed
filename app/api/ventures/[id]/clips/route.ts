import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getClipsByVenture } from '@/lib/services/clips';
import { getVentureByFounderUserId } from '@/lib/services/ventures';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const venture = await getVentureByFounderUserId(session.user.id);
  if (!venture || venture._id !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const clips = await getClipsByVenture(id);

  return NextResponse.json({ clips });
}

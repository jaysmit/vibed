import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { publishClip } from '@/lib/services/clips';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const result = await publishClip(id, session.user.id);

  if (!result) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { publishVenture } from '@/lib/services/ventures';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await publishVenture(id, session.user.id);

    if (!result) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

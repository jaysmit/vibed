import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { followVenture, unfollowVenture, isFollowingVenture } from '@/lib/services';
import { z } from 'zod';

const FollowSchema = z.object({
  ventureId: z.string().min(1),
  action: z.enum(['follow', 'unfollow']),
});

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ventureId, action } = FollowSchema.parse(body);

    if (action === 'follow') {
      await followVenture(session.user.id, ventureId);
    } else {
      await unfollowVenture(session.user.id, ventureId);
    }

    const isFollowing = await isFollowingVenture(session.user.id, ventureId);

    return NextResponse.json({ success: true, isFollowing });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ isFollowing: false });
  }

  const { searchParams } = new URL(req.url);
  const ventureId = searchParams.get('ventureId');

  if (!ventureId) {
    return NextResponse.json({ error: 'Missing ventureId' }, { status: 400 });
  }

  const isFollowing = await isFollowingVenture(session.user.id, ventureId);

  return NextResponse.json({ isFollowing });
}

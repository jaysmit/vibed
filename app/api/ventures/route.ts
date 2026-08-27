import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createVenture, getVentureByFounderUserId } from '@/lib/services/ventures';
import { z } from 'zod';

const CreateVentureSchema = z.object({
  founderName: z.string().min(1).max(100),
  founderBio: z.string().max(500).optional(),
  founderLocation: z.string().max(100).optional(),
  ventureName: z.string().min(1).max(100),
  venturePitch: z.string().min(1).max(300),
});

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user already has a venture
    const existing = await getVentureByFounderUserId(session.user.id);
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a venture', ventureSlug: existing.slug },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = CreateVentureSchema.parse(body);

    const result = await createVenture({
      userId: session.user.id,
      name: data.ventureName,
      pitch: data.venturePitch,
      founderName: data.founderName,
      founderBio: data.founderBio,
      founderLocation: data.founderLocation,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Create venture error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  const start = Date.now();
  console.log('[ventures/GET] Starting...');

  const authStart = Date.now();
  const session = await auth();
  console.log(`[ventures/GET] Auth took ${Date.now() - authStart}ms`);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const queryStart = Date.now();
  const venture = await getVentureByFounderUserId(session.user.id);
  console.log(`[ventures/GET] Query took ${Date.now() - queryStart}ms`);

  console.log(`[ventures/GET] Total: ${Date.now() - start}ms`);

  if (!venture) {
    return NextResponse.json({ venture: null });
  }

  return NextResponse.json({ venture });
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createVenture, getVentureByFounderUserId } from '@/lib/services/ventures';
import { z } from 'zod';
import { INDUSTRIES } from '@/lib/supabase/types';

const CreateVentureSchema = z.object({
  founderName: z.string().min(1).max(100),
  founderBio: z.string().max(500).optional(),
  founderLocation: z.string().max(100).optional(),
  ventureName: z.string().min(1).max(100),
  venturePitch: z.string().min(1).max(300),
  ventureIndustry: z.enum(INDUSTRIES),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if user already has a venture
    const existing = await getVentureByFounderUserId(userId);
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a venture', ventureSlug: existing.slug },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = CreateVentureSchema.parse(body);

    const result = await createVenture({
      userId,
      name: data.ventureName,
      pitch: data.venturePitch,
      industry: data.ventureIndustry,
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
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const venture = await getVentureByFounderUserId(userId);

  if (!venture) {
    return NextResponse.json({ venture: null });
  }

  return NextResponse.json({ venture });
}

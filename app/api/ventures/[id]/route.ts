import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { updateVenture, publishVenture, updateRung } from '@/lib/services/ventures';
import { z } from 'zod';
import { RUNGS } from '@/lib/domain/rungs';

const UpdateVentureSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  pitch: z.string().min(1).max(300).optional(),
  problem: z.string().max(1000).optional(),
  who: z.string().max(500).optional(),
  why: z.string().max(500).optional(),
  rung: z.enum(RUNGS).optional(),
  glyph: z.string().max(20).optional(),
  brand: z.string().max(20).optional(),
  links: z.object({
    site: z.string().optional(),
    siteStatus: z.enum(['live', 'waitlist', 'closed', 'none']).optional(),
    ig: z.string().optional(),
    x: z.string().optional(),
    yt: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = UpdateVentureSchema.parse(body);

    // Handle rung change separately
    if (data.rung) {
      await updateRung(id, userId, data.rung);
      delete data.rung;
    }

    // Update other fields
    const result = await updateVenture(id, userId, data);

    if (!result) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Update venture error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  const { id } = await params;
  const url = new URL(req.url);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if this is a publish request
  if (url.pathname.endsWith('/publish')) {
    const result = await publishVenture(id, userId);

    if (!result) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

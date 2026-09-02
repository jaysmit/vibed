import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createPromise, completePromise } from '@/lib/services/ventures';

const createPromiseSchema = z.object({
  text: z.string().min(1).max(500),
  dueAt: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date > new Date();
  }, 'Due date must be in the future'),
});

const completePromiseSchema = z.object({
  kept: z.boolean(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST: Create a new promise
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ventureId } = await context.params;
    const body = await req.json();
    const parsed = createPromiseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createPromise(ventureId, userId, {
      text: parsed.data.text,
      dueAt: parsed.data.dueAt,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create promise' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating promise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Mark promise as complete (kept or missed)
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ventureId } = await context.params;
    const body = await req.json();
    const parsed = completePromiseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await completePromise(ventureId, userId, parsed.data.kept);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to complete promise' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing promise:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

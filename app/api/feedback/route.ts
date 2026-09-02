import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createFeedback, getFeedbackByUser } from '@/lib/services/feedback';
import { FEEDBACK_TYPES } from '@/lib/supabase/types';

const BrowserInfoSchema = z.object({
  browser: z.string(),
  version: z.string(),
  os: z.string(),
  device: z.string(),
  screen: z.string(),
}).optional();

const CreateFeedbackSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  screenshotUrl: z.string().url().optional(),
  pageUrl: z.string().optional(),
  browserInfo: BrowserInfoSchema,
});

/**
 * GET /api/feedback
 * Get user's submitted feedback
 */
export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const feedback = await getFeedbackByUser(userId);
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

/**
 * POST /api/feedback
 * Submit new feedback
 */
export async function POST(req: NextRequest) {
  // User doesn't need to be logged in to submit feedback
  const userId = await getCurrentUserId();

  try {
    const body = await req.json();
    const parsed = CreateFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createFeedback(userId, parsed.data);

    return NextResponse.json({
      success: true,
      feedbackId: result.feedbackId,
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit feedback';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

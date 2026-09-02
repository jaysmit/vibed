import { NextRequest, NextResponse } from 'next/server';
import { sendFounderNudges } from '@/lib/services/digest';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}

/**
 * Founder nudge cron job
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/nudge",
 *     "schedule": "0 10 * * 3"  // Every Wednesday at 10am UTC
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && !verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get min days from query param, default 7
  const url = new URL(req.url);
  const minDays = parseInt(url.searchParams.get('minDays') || '7', 10);

  try {
    console.log(`Starting founder nudge send (minDays: ${minDays})...`);
    const result = await sendFounderNudges(minDays);
    console.log(`Founder nudge complete: ${result.sent} sent, ${result.errors} errors`);

    return NextResponse.json({
      success: true,
      sent: result.sent,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Founder nudge cron error:', error);
    return NextResponse.json(
      { error: 'Failed to send nudges' },
      { status: 500 }
    );
  }
}

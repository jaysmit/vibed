import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyDigests } from '@/lib/services/digest';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  return token === process.env.CRON_SECRET;
}

/**
 * Weekly digest cron job
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/digest",
 *     "schedule": "0 9 * * 1"  // Every Monday at 9am UTC
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production' && !verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Starting weekly digest send...');
    const result = await sendWeeklyDigests();
    console.log(`Weekly digest complete: ${result.sent} sent, ${result.errors} errors`);

    return NextResponse.json({
      success: true,
      sent: result.sent,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Weekly digest cron error:', error);
    return NextResponse.json(
      { error: 'Failed to send digests' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { pingDB } from '@/lib/db/connect';

export async function GET() {
  const dbConnected = await pingDB();

  return NextResponse.json({
    status: 'ok',
    db: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
}

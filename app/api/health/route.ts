import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  let dbConnected = false;

  try {
    const supabase = await createAdminClient();
    const { error } = await supabase.from('founders').select('id').limit(1);
    dbConnected = !error;
  } catch {
    dbConnected = false;
  }

  return NextResponse.json({
    status: 'ok',
    db: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
}

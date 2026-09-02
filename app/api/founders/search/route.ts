import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { searchFounders } from '@/lib/services/team';

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const excludeParam = searchParams.get('exclude') || '';
  const excludeIds = excludeParam.split(',').filter(Boolean);

  if (query.length < 2) {
    return NextResponse.json({ founders: [] });
  }

  try {
    const founders = await searchFounders(query, excludeIds);
    return NextResponse.json({ founders });
  } catch (error) {
    console.error('Search founders error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

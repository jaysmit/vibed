import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PILLAR_SEGMENTS } from '@/lib/domain/pillars';
import type { Pillar } from '@/lib/supabase/types';

// GET /api/ventures/feed - Get paginated ventures for landing page
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pillar = searchParams.get('pillar') as Exclude<Pillar, 'featured'> | 'trending' | 'recent' | null;
  const cursor = searchParams.get('cursor'); // Last venture ID for cursor-based pagination
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

  const supabase = await createClient();

  // Base query for published ventures - use *, founders(*) like other services
  let query = supabase
    .from('ventures')
    .select('*, founders(*)')
    .eq('status', 'live')
    .is('deleted_at', null);

  // Apply cursor for pagination
  if (cursor) {
    // For trending, we can't easily do cursor-based on JSONB, so skip cursor
    if (pillar !== 'trending') {
      query = query.lt('published_at', cursor);
    }
  }

  // Apply ordering
  if (pillar === 'trending') {
    // Sort by followers (in counters JSONB)
    query = query.order('counters->followers', { ascending: false });
  } else {
    // Sort by published date (recent first) - works for both 'recent' and pillar sections
    query = query.order('published_at', { ascending: false });
  }

  // For pillar sections, fetch more than needed for filtering
  // For trending/recent, just fetch the limit
  const isSpecialPillar = pillar === 'trending' || pillar === 'recent';
  query = query.limit(pillar && !isSpecialPillar ? limit * 3 : limit);

  const { data: ventures, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filteredVentures = ventures || [];

  // Filter by pillar segments if needed (skip for trending and recent)
  const isSpecialPillarFilter = pillar === 'trending' || pillar === 'recent';
  if (pillar && !isSpecialPillarFilter && PILLAR_SEGMENTS[pillar]) {
    const segments = PILLAR_SEGMENTS[pillar];
    filteredVentures = filteredVentures.filter((v) => {
      const ventureSegments = v.segments as Record<string, { body?: string }> | null;
      if (!ventureSegments) return false;
      return segments.some((segKey) => {
        const segment = ventureSegments[segKey];
        return segment && segment.body && segment.body.trim().length > 0;
      });
    });
  }

  // Limit to requested amount
  filteredVentures = filteredVentures.slice(0, limit);

  // Determine next cursor
  const lastVenture = filteredVentures[filteredVentures.length - 1];
  let nextCursor: string | null = null;
  if (lastVenture && filteredVentures.length === limit) {
    if (pillar === 'trending') {
      nextCursor = String((lastVenture.counters as Record<string, number>)?.followers || 0);
    } else {
      nextCursor = lastVenture.published_at || null;
    }
  }

  // Transform for frontend
  const transformed = filteredVentures.map((v) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foundersData = v.founders as any;
    // Handle both array and single object cases
    const founder = Array.isArray(foundersData) ? foundersData[0] : foundersData;
    const founderLinks = founder?.links as Record<string, string> | undefined;

    return {
      slug: v.slug,
      name: v.name,
      pitch: v.pitch,
      brand: v.brand,
      glyph: v.glyph,
      rung: v.rung,
      industry: (v as Record<string, unknown>).industry || 'other',
      status: v.status,
      links: v.links,
      counters: v.counters,
      founder: founder ? {
        id: founder.id as string,
        name: founder.name as string,
        slug: founder.slug as string,
        headline: founder.headline as string | undefined,
        avatar: founderLinks?.avatar,
      } : null,
    };
  });

  return NextResponse.json({
    ventures: transformed,
    nextCursor,
    hasMore: filteredVentures.length === limit,
  });
}

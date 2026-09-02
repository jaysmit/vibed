import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createAdminClient();
  const searchPattern = `%${query}%`;

  // Search founders - use textSearch on name only (headline may not exist)
  const { data: founders } = await supabase
    .from('founders')
    .select('id, name, slug, location, links')
    .ilike('name', searchPattern)
    .limit(5);

  // Search ventures (only live or graduated)
  const { data: ventures } = await supabase
    .from('ventures')
    .select('id, name, slug, pitch, glyph, brand, status')
    .is('deleted_at', null)
    .in('status', ['live', 'graduated'])
    .or(`name.ilike.${searchPattern},pitch.ilike.${searchPattern}`)
    .limit(5);

  const results = [
    ...(founders || []).map((f) => ({
      type: 'founder' as const,
      id: f.id,
      name: f.name,
      slug: f.slug,
      subtitle: f.location || undefined,
      imageUrl: f.links?.avatar || undefined,
    })),
    ...(ventures || []).map((v) => ({
      type: 'venture' as const,
      id: v.id,
      name: v.name,
      slug: v.slug,
      subtitle: v.pitch || undefined,
      glyph: v.glyph,
      brand: v.brand,
    })),
  ];

  return NextResponse.json({ results });
}

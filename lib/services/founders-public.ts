import { createCachedAdminClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

// Minimal venture type for profile page - only fields we display
export interface ProfileVenture {
  id: string;
  slug: string;
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  links: Record<string, string | undefined>;
  segments: Record<string, { body?: string; publishedAt?: string; updatedAt?: string }>;
  counters: {
    followers: number;
    clips: number;
    photos: number;
    likes: number;
    endorsements: number;
    comments: number;
    weekNumber: number;
    streakWeeks: number;
    siteClicks30d: number;
    trendingScore: number;
  };
  created_at: string;
  role: string;
  isOwner: boolean;
}

export interface FounderWithVentures {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  headline?: string;
  bio?: string;
  location?: string;
  links?: Record<string, string | undefined>;
  created_at: string;
  ventures: ProfileVenture[];
}

async function _getFounderBySlug(slug: string): Promise<FounderWithVentures | null> {
  const supabase = createCachedAdminClient();

  // Select only needed fields - avatar can be huge (64KB+ base64)
  const { data: founder } = await supabase
    .from('founders')
    .select('id, user_id, name, slug, headline, bio, location, links, created_at')
    .eq('slug', slug)
    .single();

  if (!founder) return null;

  // Parallel queries for own ventures and team memberships
  // Select only fields needed for profile page display
  const ventureFields = 'id, slug, name, pitch, brand, glyph, status, links, segments, counters, created_at';
  const [ownVenturesResult, membershipsResult] = await Promise.all([
    supabase
      .from('ventures')
      .select(ventureFields)
      .eq('founder_id', founder.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('venture_members')
      .select('venture_id, role')
      .eq('founder_id', founder.id)
      .eq('status', 'accepted')
  ]);

  const ownVentures = ownVenturesResult.data || [];
  const memberships = membershipsResult.data || [];

  // Get member ventures if any
  let memberVentures: typeof ownVentures = [];
  if (memberships.length > 0) {
    const ventureIds = memberships
      .map(m => m.venture_id)
      .filter(id => !ownVentures.some(v => v.id === id));

    if (ventureIds.length > 0) {
      const { data } = await supabase
        .from('ventures')
        .select(ventureFields)
        .in('id', ventureIds)
        .is('deleted_at', null);
      memberVentures = data || [];
    }
  }

  // Combine ventures
  const allVentures: ProfileVenture[] = [
    ...ownVentures.map(v => ({ ...v, role: 'founder', isOwner: true } as ProfileVenture)),
    ...memberVentures.map(v => {
      const membership = memberships.find(m => m.venture_id === v.id);
      return { ...v, role: membership?.role || 'member', isOwner: false } as ProfileVenture;
    }),
  ];

  return {
    id: founder.id,
    user_id: founder.user_id,
    name: founder.name,
    slug: founder.slug,
    headline: founder.headline,
    bio: founder.bio,
    location: founder.location,
    links: founder.links,
    created_at: founder.created_at,
    ventures: allVentures,
  };
}

// Cached version - revalidates every 30 seconds
export const getFounderBySlug = unstable_cache(
  _getFounderBySlug,
  ['founder-by-slug'],
  { revalidate: 30, tags: ['founders'] }
);

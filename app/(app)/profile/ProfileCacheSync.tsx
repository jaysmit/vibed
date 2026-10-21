'use client';

import { useEffect } from 'react';
import { setLocalProfile } from '@/lib/hooks/useFounderProfile';

interface ProfileCacheSyncProps {
  founder: {
    id: string;
    name: string;
    slug: string;
    links?: { avatar?: string } | null;
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
  };
}

/**
 * Syncs server-rendered founder data to localStorage
 * This runs on the client after hydration and caches the profile
 * so subsequent visits can show data instantly
 */
export function ProfileCacheSync({ founder }: ProfileCacheSyncProps) {
  useEffect(() => {
    // Cache the founder profile for instant loading next time
    setLocalProfile({
      id: founder.id,
      name: founder.name,
      slug: founder.slug,
      avatar: founder.links?.avatar,
      headline: founder.headline || undefined,
      bio: founder.bio || undefined,
      location: founder.location || undefined,
      links: founder.links as Record<string, string> | undefined,
    });
  }, [founder]);

  // This component doesn't render anything
  return null;
}

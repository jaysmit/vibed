'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CachedFounderProfile {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  headline?: string;
  bio?: string;
  location?: string;
  links?: Record<string, string>;
  cachedAt: number;
}

const CACHE_KEY = 'vibed_founder_profile';
const COOKIE_KEY = 'vibed_profile';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get profile from cookie (works on server and client)
export function getCookieProfile(): CachedFounderProfile | null {
  try {
    // Works on both server and client
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    const match = cookies.match(new RegExp(`${COOKIE_KEY}=([^;]+)`));
    if (!match) return null;
    const decoded = decodeURIComponent(match[1]);
    return JSON.parse(decoded) as CachedFounderProfile;
  } catch {
    return null;
  }
}

// Set profile in cookie (client only, but cookie sent with requests)
export function setCookieProfile(profile: Omit<CachedFounderProfile, 'cachedAt'>) {
  if (typeof document === 'undefined') return;
  try {
    const data = { ...profile, cachedAt: Date.now() };
    // Cookie expires in 7 days, path=/ so it's available everywhere
    const encoded = encodeURIComponent(JSON.stringify(data));
    document.cookie = `${COOKIE_KEY}=${encoded}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  } catch {
    // Ignore
  }
}

export function clearCookieProfile() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
}

// Legacy localStorage functions (kept for migration)
export function getLocalProfile(): CachedFounderProfile | null {
  // Try cookie first, then localStorage
  const cookieProfile = getCookieProfile();
  if (cookieProfile) return cookieProfile;

  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const profile = JSON.parse(cached) as CachedFounderProfile;
    // Migrate to cookie
    setCookieProfile(profile);
    return profile;
  } catch {
    return null;
  }
}

export function setLocalProfile(profile: Omit<CachedFounderProfile, 'cachedAt'>) {
  // Set both cookie and localStorage for compatibility
  setCookieProfile(profile);

  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...profile,
      cachedAt: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}

export function clearLocalProfile() {
  clearCookieProfile();
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }
}

export function useFounderProfile() {
  const [profile, setProfile] = useState<CachedFounderProfile | null>(() => getLocalProfile());
  const [isLoading, setIsLoading] = useState(!profile);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfile = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        clearLocalProfile();
        setProfile(null);
        return null;
      }

      const { data: founder } = await supabase
        .from('founders')
        .select('id, name, slug, links, headline, bio, location')
        .eq('user_id', user.id)
        .single();

      if (founder) {
        const founderLinks = founder.links as Record<string, string> | null;
        const newProfile: CachedFounderProfile = {
          id: founder.id,
          name: founder.name,
          slug: founder.slug,
          avatar: founderLinks?.avatar,
          headline: founder.headline || undefined,
          bio: founder.bio || undefined,
          location: founder.location || undefined,
          links: founderLinks || undefined,
          cachedAt: Date.now(),
        };
        setLocalProfile(newProfile);
        setProfile(newProfile);
        return newProfile;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch founder profile:', error);
      return null;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // On mount, check if cache is stale and refresh
  useEffect(() => {
    const cached = getLocalProfile();
    if (cached) {
      setProfile(cached);
      setIsLoading(false);
      // Refresh in background if stale
      if (Date.now() - cached.cachedAt > CACHE_TTL) {
        fetchProfile(true);
      }
    } else {
      fetchProfile(false);
    }
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    isRefreshing,
    refresh: () => fetchProfile(true),
  };
}

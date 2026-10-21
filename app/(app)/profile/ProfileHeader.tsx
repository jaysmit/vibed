'use client';

import { useFounderProfile } from '@/lib/hooks/useFounderProfile';
import { Avatar } from '@/components/ui';
import Link from 'next/link';

interface ProfileHeaderProps {
  // Server-rendered data (takes precedence when available)
  serverData?: {
    name: string;
    slug: string;
    avatar?: string;
    headline?: string;
    bio?: string;
    location?: string;
  } | null;
}

export function ProfileHeader({ serverData }: ProfileHeaderProps) {
  const { profile: cachedProfile, isRefreshing } = useFounderProfile();

  // Use server data if available, otherwise use cached
  const profile = serverData || cachedProfile;

  if (!profile) {
    // Show loading skeleton
    return (
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-rule/40 animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <div className="h-8 w-48 bg-rule/50 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-rule/40 rounded animate-pulse mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
      <Avatar
        name={profile.name}
        imageUrl={profile.avatar}
        size="2xl"
        className="flex-shrink-0"
      />
      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-[26px] sm:text-[32px] font-black tracking-tight"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            {profile.name}
          </h1>
          {isRefreshing && (
            <div className="w-4 h-4 border-2 border-rule border-t-go rounded-full animate-spin" />
          )}
        </div>
        {profile.headline && (
          <p className="text-[14px] sm:text-[16px] text-ink-2 mt-1">{profile.headline}</p>
        )}
        {profile.location && (
          <p className="text-[13px] text-ink-3 mt-1 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {profile.location}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <Link
            href="/settings"
            className="text-[13px] font-semibold bg-ink text-white px-4 py-2 rounded-lg hover:bg-ink/80 transition-colors"
          >
            Edit Profile
          </Link>
          <Link
            href={`/founder/${profile.slug}`}
            className="text-[13px] font-semibold border border-rule px-4 py-2 rounded-lg hover:bg-soft transition-colors"
          >
            View Public Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

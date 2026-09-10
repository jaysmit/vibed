'use client';

import type { TrustTier } from '@/lib/supabase/types';
import { TRUST_TIER_LABELS } from '@/lib/supabase/types';

interface TrustBadgeProps {
  tier: TrustTier;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const TIER_STYLES: Record<TrustTier, { bg: string; text: string; icon: string }> = {
  newcomer: {
    bg: 'bg-soft',
    text: 'text-ink-3',
    icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z', // info circle
  },
  member: {
    bg: 'bg-soft',
    text: 'text-ink-2',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', // check circle
  },
  contributor: {
    bg: 'bg-heat-tint',
    text: 'text-heat',
    icon: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z', // star
  },
  champion: {
    bg: 'bg-go-tint',
    text: 'text-go-deep',
    icon: 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z', // trophy
  },
};

export function TrustBadge({ tier, showLabel = true, size = 'sm', className = '' }: TrustBadgeProps) {
  const styles = TIER_STYLES[tier];
  const label = TRUST_TIER_LABELS[tier];

  // Don't show badge for newcomers
  if (tier === 'newcomer') {
    return null;
  }

  const iconSize = size === 'sm' ? 10 : 12;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        ${styles.bg} ${styles.text} ${textSize} ${padding}
        ${className}
      `}
      title={`${label} - Community trust tier`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={styles.icon} />
      </svg>
      {showLabel && <span>{label}</span>}
    </span>
  );
}

// Compact version showing just the icon
export function TrustBadgeIcon({ tier, className = '' }: { tier: TrustTier; className?: string }) {
  const styles = TIER_STYLES[tier];

  // Don't show badge for newcomers
  if (tier === 'newcomer') {
    return null;
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center w-5 h-5 rounded-full
        ${styles.bg} ${styles.text}
        ${className}
      `}
      title={`${TRUST_TIER_LABELS[tier]} - Community trust tier`}
    >
      <svg
        width={10}
        height={10}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={styles.icon} />
      </svg>
    </span>
  );
}

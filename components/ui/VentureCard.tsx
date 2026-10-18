'use client';

import Link from 'next/link';
import Image from 'next/image';
import { RungTag } from './RungLadder';
import type { Rung } from '@/lib/domain/rungs';
import { INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

/**
 * VentureCard - Used for displaying ventures in grids (Discover, Landing page)
 * Note: This is different from PitchCard which is used for video clips
 */
interface VentureCardProps {
  slug: string;
  name: string;
  pitch: string;
  tagline?: string | null;  // Short one-liner displayed on cover image
  brand: string;
  rung: Rung;
  industry?: Industry;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  poster?: string;
  founder: {
    name: string;
    slug: string;
    location?: string;
    avatar?: string;
  };
  promise?: {
    text: string;
    dueAt: Date;
    createdAt: Date;
  } | null;
  promiseHistory?: { kept: boolean }[];
  counters: {
    followers: number;
    clips: number;
    weekNumber: number;
    streakWeeks: number;
  };
  isPick?: boolean;
  className?: string;
  /** Set to true for above-the-fold images (first 2-3 cards) */
  priority?: boolean;
}

export function VentureCard({
  slug,
  name,
  pitch,
  tagline,
  brand,
  rung,
  industry,
  status,
  poster,
  founder,
  promise,
  promiseHistory = [],
  counters,
  isPick = false,
  className = '',
  priority = false,
}: VentureCardProps) {
  const isDead = status === 'closed';
  // Show "See more" if pitch is roughly more than 4 lines (~180 chars)
  const needsExpansion = pitch.length > 180;

  return (
    <Link
      href={`/v/${slug}`}
      className={`
        block bg-page border border-rule rounded-[14px] overflow-hidden
        shadow-[0_1px_3px_rgba(0,0,0,0.045)]
        transition-all duration-300 ease-out
        hover:translate-y-[-5px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.11)]
        ${className}
      `}
    >
      {/* Top bar - Follow & View above image */}
      <div className="flex items-center justify-between px-3 py-2 bg-soft/50 border-b border-rule">
        <button
          onClick={(e) => {
            e.preventDefault();
            // Follow logic will be added later
          }}
          className="text-[11px] font-semibold text-ink-2 hover:text-ink transition-colors"
        >
          + Follow
        </button>
        <span className="text-[11px] font-medium text-go-deep">
          View →
        </span>
      </div>

      {/* Poster area - 16:9 aspect ratio for video content */}
      <div className="relative aspect-video bg-soft overflow-hidden">
        {/* Poster image or gradient fallback */}
        {poster ? (
          <Image
            src={poster}
            alt={name}
            fill
            sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 33vw"
            className="object-cover z-[1]"
            priority={priority}
          />
        ) : (
          <div
            className="absolute inset-0 opacity-20 z-[1]"
            style={{
              background: `linear-gradient(135deg, ${brand} 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Badges */}
        {isPick && (
          <div className="absolute top-2 left-2 z-[3] bg-page rounded-full px-2 py-1 text-[10px] font-semibold shadow-sm text-go-deep">
            Pick
          </div>
        )}

        {isDead && (
          <div className="absolute top-2 left-2 z-[3] bg-page rounded-full px-2 py-1 text-[10px] font-semibold shadow-sm text-dead">
            Closed
          </div>
        )}

        {/* Rung tag */}
        <div className="absolute top-2 right-2 z-[3]">
          <RungTag rung={rung} isDead={isDead} size="xs" />
        </div>

        {/* Tagline overlay - compact, bottom of image */}
        {tagline && (
          <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/50 to-transparent pt-5 pb-1.5 px-2">
            <p className="text-white text-[11px] sm:text-[12px] font-semibold leading-tight text-center"
               style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
              {tagline}
            </p>
          </div>
        )}
      </div>

      {/* Card body - fixed height */}
      <div className="p-3 flex flex-col h-[180px]">
        {/* Name & industry */}
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-bold font-display truncate">{name}</h3>
          {industry && (
            <span className="text-[10px] text-heat font-medium flex-shrink-0">{INDUSTRY_LABELS[industry]}</span>
          )}
        </div>

        {/* Description - fixed height with see more */}
        <div className="mt-1.5 flex-1 min-h-0 flex flex-col">
          <p className="text-[13px] text-ink-2 leading-[1.4] line-clamp-3 flex-1">
            {pitch}
          </p>
          {needsExpansion && (
            <span className="text-[12px] font-medium text-go-deep mt-0.5">
              See more
            </span>
          )}
        </div>

        {/* Creator line - pushed to bottom */}
        <div className="text-[12px] text-ink-3 mt-auto pt-2 flex items-center gap-1.5">
          {founder.avatar ? (
            <Image
              data-avatar="venturecard-avatar-image"
              src={founder.avatar}
              alt={founder.name}
              width={16}
              height={16}
              style={{ width: 16, height: 16, minWidth: 16, maxWidth: 16 }}
              className="rounded-full object-cover"
            />
          ) : (
            <span
              data-avatar="venturecard-avatar-initials"
              className="w-4 h-4 rounded-full grid place-items-center text-[8px] font-semibold text-white font-mono"
              style={{ background: brand, width: 16, height: 16, minWidth: 16, maxWidth: 16 }}
            >
              {founder.name
                .split(' ')
                .map((w) => w[0])
                .join('')}
            </span>
          )}
          <span className="truncate">{founder.name}</span>
        </div>

        {/* Meta line */}
        <div className="flex gap-3 text-[10px] text-ink-3">
          <span>
            Wk <b className="text-ink font-medium font-mono">{counters.weekNumber}</b>
          </span>
          <span>
            <b className="text-ink font-medium font-mono">{counters.streakWeeks}</b> streak
          </span>
          <span>
            <b className="text-ink font-medium font-mono">{counters.followers.toLocaleString()}</b> following
          </span>
        </div>
      </div>
    </Link>
  );
}

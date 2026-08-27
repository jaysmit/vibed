import Link from 'next/link';
import { VentureLogo } from './VentureLogo';
import { RungTag } from './RungLadder';
import { PromiseClock } from './PromiseClock';
import type { Rung } from '@/lib/domain/rungs';
import { INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

interface VentureCardProps {
  slug: string;
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  rung: Rung;
  industry?: Industry;
  status: 'draft' | 'live' | 'graduated' | 'closed';
  founder: {
    name: string;
    slug: string;
    location?: string;
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
}

export function VentureCard({
  slug,
  name,
  pitch,
  brand,
  glyph,
  rung,
  industry,
  status,
  founder,
  promise,
  promiseHistory = [],
  counters,
  isPick = false,
  className = '',
}: VentureCardProps) {
  const isDead = status === 'closed';
  const keptHistory = promiseHistory.map((p) => p.kept);

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
      {/* Poster area */}
      <div className="relative h-44 bg-soft overflow-hidden">
        {/* Placeholder gradient art */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${brand} 0%, transparent 60%)`,
          }}
        />

        {/* Badges */}
        {isPick && (
          <div className="absolute top-3 left-3 z-[3] bg-page rounded-full px-[11px] py-[5px] text-[11px] font-semibold shadow-sm flex items-center gap-1.5 text-go-deep">
            <span>✦</span> Editor&apos;s pick
          </div>
        )}

        {isDead && (
          <div className="absolute top-3 left-3 z-[3] bg-page rounded-full px-[11px] py-[5px] text-[11px] font-semibold shadow-sm text-dead">
            Closed
          </div>
        )}

        {/* Rung tag */}
        <div className="absolute top-3 right-3 z-[3]">
          <RungTag rung={rung} isDead={isDead} />
        </div>

        {/* Logo */}
        <div className="absolute left-3 bottom-3 z-[3] shadow-[0_2px_10px_rgba(0,0,0,0.25)] rounded-[13px]">
          <VentureLogo glyph={glyph} brand={brand} size="md" />
        </div>
      </div>

      {/* Card body */}
      <div className="p-[15px_17px_17px]">
        <h3 className="text-[18.5px] font-bold font-display">{name}</h3>
        <p className="text-[13.5px] text-ink-2 mt-1 line-clamp-2">{pitch}</p>

        {/* Creator line */}
        <div className="text-[13px] text-ink-3 mt-[9px] flex items-center gap-[7px]">
          <span
            className="w-5 h-5 rounded-full grid place-items-center text-[9.5px] font-semibold text-white font-mono"
            style={{ background: brand }}
          >
            {founder.name
              .split(' ')
              .map((w) => w[0])
              .join('')}
          </span>
          <span>{founder.name}</span>
          {industry && (
            <>
              <span className="text-rule-2">·</span>
              <span className="text-heat">{INDUSTRY_LABELS[industry]}</span>
            </>
          )}
        </div>

        {/* Promise */}
        {promise && !isDead && (
          <PromiseClock
            text={promise.text}
            dueAt={promise.dueAt}
            createdAt={promise.createdAt}
            keptHistory={keptHistory}
            className="mt-[13px]"
          />
        )}

        {/* Meta line */}
        <div className="flex gap-[14px] mt-3 text-[12px] text-ink-3 flex-wrap">
          <span>
            Week <b className="text-ink font-semibold font-mono">{counters.weekNumber}</b>
          </span>
          <span>
            <b className="text-ink font-semibold font-mono">{counters.streakWeeks}</b> week streak
          </span>
          <span>
            <b className="text-ink font-semibold font-mono">{counters.followers.toLocaleString()}</b>{' '}
            followers
          </span>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-[9px] mt-[13px]">
          <button
            onClick={(e) => {
              e.preventDefault();
              // Follow logic will be added later
            }}
            className="text-[13px] font-semibold border border-rule-2 px-[15px] py-[6px] rounded-full transition-colors hover:border-ink hover:bg-soft"
          >
            Follow
          </button>
          <span className="ml-auto text-[13px] font-semibold text-go-deep">
            See the journey →
          </span>
        </div>
      </div>
    </Link>
  );
}

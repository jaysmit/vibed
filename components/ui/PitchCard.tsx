'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Rung } from '@/lib/domain/rungs';
import { INDUSTRY_LABELS, type Industry } from '@/lib/supabase/types';

interface TeamMember {
  name: string;
  role?: string;
  avatar?: string;
}

interface PitchCardProps {
  slug: string;
  name: string;
  pitch: string;
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
  teamMembers?: TeamMember[];
  counters: {
    followers: number;
    clips: number;
    weekNumber: number;
    likes?: number;
  };
  className?: string;
}

const RUNG_SHORT: Record<Rung, string> = {
  idea: 'Idea',
  building: 'Building',
  live: 'Live',
  first: '$1',
  growing: 'Growing',
  alumni: 'Alumni',
};

export function PitchCard({
  slug,
  name,
  pitch,
  brand,
  rung,
  industry,
  status,
  poster,
  founder,
  teamMembers = [],
  counters,
  className = '',
}: PitchCardProps) {
  const [showTeam, setShowTeam] = useState(false);
  const isDead = status === 'closed';
  const otherMembers = teamMembers.length;

  return (
    <div className={`bg-page border border-rule rounded-[14px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.045)] transition-all duration-300 ease-out hover:translate-y-[-5px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.11)] ${className}`}>
      {/* Video area - square like Instagram */}
      <Link
        href={`/v/${slug}`}
        className="block aspect-square relative overflow-hidden bg-soft group"
      >
        {/* Poster/thumbnail or white with subtle brand accent */}
        {poster ? (
          <img
            src={poster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-white">
            {/* Subtle brand gradient in corner */}
            <div
              className="absolute top-0 right-0 w-1/2 h-1/2 opacity-10"
              style={{
                background: `radial-gradient(circle at top right, ${brand}, transparent 70%)`,
              }}
            />
          </div>
        )}

        {/* Play icon overlay - Instagram style */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="ml-1 drop-shadow-md">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* One-liner pitch overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
          <p className="text-[12px] sm:text-[13px] text-white font-medium line-clamp-2 leading-snug">
            {pitch}
          </p>
        </div>

        {/* Top right: Status, Category, Likes */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {/* Likes */}
          <div className="flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#B03A28">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-[9px] font-bold text-ink">{counters.likes || counters.followers}</span>
          </div>
          {/* Category */}
          {industry && (
            <span className="text-[8px] font-semibold text-ink bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 hidden sm:block">
              {INDUSTRY_LABELS[industry]?.slice(0, 8) || industry}
            </span>
          )}
          {/* Stage */}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${
            isDead
              ? 'bg-dead/80 text-white'
              : 'bg-white/90 text-ink'
          }`}>
            {isDead ? 'Closed' : RUNG_SHORT[rung]}
          </span>
        </div>
      </Link>

      {/* Footer - venture name, founder with team */}
      <div className="p-3 flex items-center justify-between gap-2">
        <Link href={`/v/${slug}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Small avatar */}
            {founder.avatar ? (
              <img
                src={founder.avatar}
                alt={founder.name}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span
                className="w-6 h-6 rounded-full grid place-items-center text-[9px] font-semibold text-white flex-shrink-0"
                style={{ background: brand }}
              >
                {founder.name.split(' ').map((w) => w[0]).join('')}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[13px] sm:text-[14px] font-bold truncate">{name}</h3>
                <span className="text-[10px] text-ink-3 flex-shrink-0">{counters.followers.toLocaleString()} followers</span>
              </div>
              <div
                className="text-[10px] sm:text-[11px] text-ink-3 truncate relative"
                onMouseEnter={() => otherMembers > 0 && setShowTeam(true)}
                onMouseLeave={() => setShowTeam(false)}
              >
                <span>{founder.name}</span>
                {otherMembers > 0 && (
                  <span className="text-ink-2 font-medium cursor-pointer hover:text-ink"> +{otherMembers}</span>
                )}

                {/* Team dropdown on hover */}
                {showTeam && otherMembers > 0 && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-rule rounded-lg shadow-lg p-2 z-10 min-w-[140px]">
                    <div className="text-[9px] text-ink-3 uppercase tracking-wide mb-1.5">Team</div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {founder.avatar ? (
                          <img src={founder.avatar} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <span className="w-4 h-4 rounded-full text-[7px] font-semibold text-white grid place-items-center" style={{ background: brand }}>
                            {founder.name.split(' ').map((w) => w[0]).join('')}
                          </span>
                        )}
                        <span className="text-[10px] font-medium">{founder.name}</span>
                        <span className="text-[8px] text-ink-3">Founder</span>
                      </div>
                      {teamMembers.map((member, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="w-4 h-4 rounded-full" />
                          ) : (
                            <span className="w-4 h-4 rounded-full text-[7px] font-semibold text-white bg-ink-3 grid place-items-center">
                              {member.name.split(' ').map((w) => w[0]).join('')}
                            </span>
                          )}
                          <span className="text-[10px] font-medium">{member.name}</span>
                          {member.role && <span className="text-[8px] text-ink-3">{member.role}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Compact follow button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Follow logic
          }}
          className="text-[10px] sm:text-[11px] font-semibold bg-ink text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-go-deep transition-colors flex-shrink-0"
        >
          Follow
        </button>
      </div>
    </div>
  );
}

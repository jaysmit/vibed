'use client';

import { VentureCard } from '@/components/ui';
import { TrackImpression } from '@/components/tracking';
import type { Rung } from '@/lib/db/models';

interface VentureData {
  slug: string;
  name: string;
  pitch: string;
  brand: string;
  glyph: string;
  rung: Rung;
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
  _id: { toString(): string };
}

interface VentureRailProps {
  ventures: VentureData[];
  rail: string;
}

/**
 * Client component that renders a grid of venture cards with impression tracking
 */
export function VentureRail({ ventures, rail }: VentureRailProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[26px]">
      {ventures.map((v, index) => (
        <TrackImpression
          key={v.slug}
          rail={rail}
          position={index}
          ventureId={v._id.toString()}
        >
          <VentureCard
            slug={v.slug}
            name={v.name}
            pitch={v.pitch}
            brand={v.brand}
            glyph={v.glyph}
            rung={v.rung}
            status={v.status}
            founder={v.founder}
            promise={v.promise}
            promiseHistory={v.promiseHistory}
            counters={v.counters}
          />
        </TrackImpression>
      ))}
    </div>
  );
}

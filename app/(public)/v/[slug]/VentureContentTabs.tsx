'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

interface VentureContentTabsProps {
  journeyContent: ReactNode;
  clipsContent: ReactNode;
  updatesContent: ReactNode;
  promisesContent: ReactNode;
}

export function VentureContentTabs({
  journeyContent,
  clipsContent,
  updatesContent,
  promisesContent,
}: VentureContentTabsProps) {
  const [activeTab, setActiveTab] = useState<'journey' | 'clips' | 'updates' | 'promises'>('journey');

  return (
    <div className="mt-8">
      {/* Tab buttons - evenly spaced */}
      <div className="flex border-b border-rule mb-6">
        <button
          onClick={() => setActiveTab('journey')}
          className={`flex-1 py-3 text-[11px] sm:text-[14px] font-semibold border-b-2 transition-colors text-center ${
            activeTab === 'journey'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          Journey
        </button>
        <button
          onClick={() => setActiveTab('clips')}
          className={`flex-1 py-3 text-[11px] sm:text-[14px] font-semibold border-b-2 transition-colors text-center ${
            activeTab === 'clips'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          Clips
        </button>
        <button
          onClick={() => setActiveTab('promises')}
          className={`flex-1 py-3 text-[11px] sm:text-[14px] font-semibold border-b-2 transition-colors text-center ${
            activeTab === 'promises'
              ? 'border-warn text-warn'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          Promises
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`flex-1 py-3 text-[11px] sm:text-[14px] font-semibold border-b-2 transition-colors text-center ${
            activeTab === 'updates'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          Updates
        </button>
      </div>

      {/* Tab content - min height to prevent layout shift, overflow hidden */}
      <div className="min-h-[300px] overflow-x-hidden">
        {activeTab === 'journey' && journeyContent}
        {activeTab === 'clips' && clipsContent}
        {activeTab === 'promises' && promisesContent}
        {activeTab === 'updates' && updatesContent}
      </div>
    </div>
  );
}

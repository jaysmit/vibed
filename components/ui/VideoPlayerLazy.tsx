'use client';

import dynamic from 'next/dynamic';

// Lazy load the Mux player (54KB) - only loads when component mounts
const VideoPlayer = dynamic(
  () => import('./VideoPlayer').then(mod => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full bg-ink/10 animate-pulse flex items-center justify-center"
        style={{ aspectRatio: '16/9', borderRadius: '12px' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-3">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    ),
  }
);

export { VideoPlayer };

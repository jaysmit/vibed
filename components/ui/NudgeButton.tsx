'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NudgeButtonProps {
  ventureId: string;
  segmentKey: string;
  segmentTitle: string;
  className?: string;
}

export function NudgeButton({ ventureId, segmentKey, segmentTitle, className = '' }: NudgeButtonProps) {
  const [hasNudged, setHasNudged] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Check auth state and existing nudge
  useEffect(() => {
    const checkState = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        // Check if user has already nudged this segment
        try {
          const res = await fetch(`/api/ventures/${ventureId}/nudges/${segmentKey}`);
          if (res.ok) {
            const data = await res.json();
            setHasNudged(data.hasNudged);
            setNudgeCount(data.count);
          }
        } catch {
          // Ignore errors
        }
      }
    };
    checkState();
  }, [ventureId, segmentKey]);

  const handleNudge = async () => {
    if (!isLoggedIn || hasNudged || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/nudges/${segmentKey}`, {
        method: 'POST',
      });

      if (res.ok) {
        setHasNudged(true);
        setNudgeCount(prev => prev + 1);
      }
    } catch {
      console.error('Failed to nudge');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if not logged in or still loading auth state
  if (isLoggedIn === null || !isLoggedIn) {
    return null;
  }

  if (hasNudged) {
    return (
      <div className={`flex items-center gap-2 text-[12px] text-go-deep ${className}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <span>
          {nudgeCount === 1
            ? 'You requested this chapter'
            : `You and ${nudgeCount - 1} ${nudgeCount === 2 ? 'other' : 'others'} requested this`
          }
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleNudge}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-heat/50 bg-heat-tint hover:bg-heat/10 text-[12px] font-medium text-heat transition-colors disabled:opacity-50 ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
      {isLoading ? 'Sending...' : `Request this chapter`}
      {nudgeCount > 0 && (
        <span className="ml-1 text-[10px] bg-heat text-white px-1.5 py-0.5 rounded-full">
          {nudgeCount}
        </span>
      )}
    </button>
  );
}

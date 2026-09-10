'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { TrustTier, VentureEndorsementReason } from '@/lib/supabase/types';
import { VENTURE_ENDORSEMENT_REASON_LABELS } from '@/lib/supabase/types';

interface VentureEndorseButtonProps {
  ventureId: string;
  initialEndorsed?: boolean;
  initialCount?: number;
  userTier?: TrustTier;
  showCount?: boolean;
  className?: string;
}

export function VentureEndorseButton({
  ventureId,
  initialEndorsed = false,
  initialCount = 0,
  userTier: initialTier,
  showCount = true,
  className = '',
}: VentureEndorseButtonProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasEndorsed, setHasEndorsed] = useState(initialEndorsed);
  const [count, setCount] = useState(initialCount);
  const [userTier, setUserTier] = useState<TrustTier>(initialTier || 'newcomer');
  const [canEndorse, setCanEndorse] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  // Fetch initial state from API
  useEffect(() => {
    const fetchEndorseState = async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/endorse`);
        if (res.ok) {
          const data = await res.json();
          setHasEndorsed(data.hasEndorsed);
          setCount(data.total);
          setUserTier(data.userTier);
          setCanEndorse(data.canEndorse);
        }
      } catch (error) {
        console.error('Failed to fetch endorse state:', error);
      }
    };
    fetchEndorseState();
  }, [ventureId]);

  const handleClick = async () => {
    if (isAuthenticated === null) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If already endorsed, remove it
    if (hasEndorsed) {
      // Optimistic update
      setHasEndorsed(false);
      setCount(Math.max(0, count - 1));

      startTransition(async () => {
        try {
          const res = await fetch(`/api/ventures/${ventureId}/endorse`, {
            method: 'DELETE',
          });

          if (!res.ok) {
            // Revert on error
            setHasEndorsed(true);
            setCount(count);
          } else {
            const data = await res.json();
            setCount(data.total);
          }
        } catch {
          // Revert on error
          setHasEndorsed(true);
          setCount(count);
        }
      });
      return;
    }

    // If can't endorse, show tooltip
    if (!canEndorse) {
      return;
    }

    // Show reason picker
    setShowReasonPicker(true);
  };

  const handleEndorse = async (reason?: VentureEndorsementReason) => {
    setShowReasonPicker(false);

    // Optimistic update
    setHasEndorsed(true);
    setCount(count + (userTier === 'champion' ? 2 : 1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/endorse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });

        if (!res.ok) {
          // Revert on error
          setHasEndorsed(false);
          setCount(count);
          const data = await res.json();
          console.error('Endorse error:', data.error);
        } else {
          const data = await res.json();
          setCount(data.total);
        }
      } catch {
        // Revert on error
        setHasEndorsed(false);
        setCount(count);
      }
    });
  };

  // Locked state for users who can't endorse
  if (!canEndorse && !hasEndorsed) {
    return (
      <div className="relative group">
        <button
          disabled
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium
            bg-soft text-ink-3 cursor-not-allowed
            ${className}
          `}
          title="Become a Contributor to endorse ventures"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Endorse</span>
        </button>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
          <div className="bg-ink text-white text-[11px] px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <p className="font-semibold mb-1">Become a Contributor to endorse</p>
            <p className="text-white/70">7 days active, 5 comments, 3 follows</p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-ink rotate-45"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all
          ${hasEndorsed
            ? 'bg-go-tint text-go-deep hover:bg-go/20'
            : 'bg-soft text-ink-2 hover:bg-rule hover:text-ink'
          }
          ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        title={hasEndorsed ? 'Remove endorsement' : 'Endorse this venture'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={hasEndorsed ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        {showCount && <span className="font-mono">{count}</span>}
        {userTier === 'champion' && !hasEndorsed && (
          <span className="text-[10px] bg-heat text-white px-1 py-0.5 rounded ml-1">2x</span>
        )}
      </button>

      {/* Reason picker dropdown */}
      {showReasonPicker && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowReasonPicker(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-rule rounded-xl shadow-lg z-50 min-w-[200px]">
            <div className="p-2">
              <p className="text-[11px] text-ink-3 px-2 py-1 mb-1">Why are you endorsing?</p>
              {Object.entries(VENTURE_ENDORSEMENT_REASON_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleEndorse(key as VentureEndorsementReason)}
                  className="w-full text-left px-3 py-2 text-[13px] rounded-lg hover:bg-soft transition-colors"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => handleEndorse()}
                className="w-full text-left px-3 py-2 text-[13px] text-ink-3 rounded-lg hover:bg-soft transition-colors"
              >
                Just endorse
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

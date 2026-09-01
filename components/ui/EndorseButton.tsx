'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ReasonPicker } from './ReasonPicker';
import type { EndorsementReason } from '@/lib/supabase/types';

interface EndorseButtonProps {
  clipId: string;
  initialEndorsed?: boolean;
  initialCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function EndorseButton({
  clipId,
  initialEndorsed = false,
  initialCount = 0,
  showCount = true,
  size = 'md',
  className = '',
}: EndorseButtonProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isEndorsed, setIsEndorsed] = useState(initialEndorsed);
  const [count, setCount] = useState(initialCount);
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

  // Check initial endorsement status
  useEffect(() => {
    const checkEndorsement = async () => {
      try {
        const res = await fetch(`/api/clips/${clipId}/endorse`);
        if (res.ok) {
          const data = await res.json();
          setIsEndorsed(data.endorsed);
        }
      } catch {
        // Ignore errors, use initial value
      }
    };
    if (isAuthenticated) {
      checkEndorsement();
    }
  }, [clipId, isAuthenticated]);

  const handleClick = async () => {
    if (isAuthenticated === null) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isEndorsed) {
      // Unendorse
      performUnendorse();
    } else {
      // Show reason picker
      setShowReasonPicker(true);
    }
  };

  const performEndorse = async (reason?: EndorsementReason) => {
    // Optimistic update
    setIsEndorsed(true);
    setCount((c) => c + 1);
    setShowReasonPicker(false);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/clips/${clipId}/endorse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });

        if (!res.ok) {
          // Revert on error
          setIsEndorsed(false);
          setCount((c) => c - 1);
        }
      } catch {
        // Revert on error
        setIsEndorsed(false);
        setCount((c) => c - 1);
      }
    });
  };

  const performUnendorse = async () => {
    // Optimistic update
    setIsEndorsed(false);
    setCount((c) => Math.max(0, c - 1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/clips/${clipId}/endorse`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          // Revert on error
          setIsEndorsed(true);
          setCount((c) => c + 1);
        }
      } catch {
        // Revert on error
        setIsEndorsed(true);
        setCount((c) => c + 1);
      }
    });
  };

  const sizeClasses = size === 'sm'
    ? 'gap-1 px-2 py-1 text-[11px]'
    : 'gap-1.5 px-3 py-1.5 text-[13px]';

  const iconSize = size === 'sm' ? 12 : 16;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`
          inline-flex items-center rounded-full font-semibold transition-all
          ${sizeClasses}
          ${isEndorsed
            ? 'bg-dead-tint text-dead'
            : 'bg-soft text-ink-2 hover:bg-rule hover:text-ink'
          }
          ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        title={isEndorsed ? 'Remove endorsement' : 'Endorse this clip'}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill={isEndorsed ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {showCount && (
          <span className="tabular-nums">{count}</span>
        )}
      </button>

      {showReasonPicker && (
        <ReasonPicker
          onSelect={(reason) => performEndorse(reason)}
          onSkip={() => performEndorse()}
          onClose={() => setShowReasonPicker(false)}
        />
      )}
    </>
  );
}

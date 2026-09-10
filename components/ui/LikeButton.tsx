'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LikeButtonProps {
  ventureId: string;
  initialLiked?: boolean;
  initialCount?: number;
  showCount?: boolean;
  className?: string;
}

export function LikeButton({
  ventureId,
  initialLiked = false,
  initialCount = 0,
  showCount = true,
  className = '',
}: LikeButtonProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasLiked, setHasLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

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
    const fetchLikeState = async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/like`);
        if (res.ok) {
          const data = await res.json();
          setHasLiked(data.hasLiked);
          setCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch like state:', error);
      }
    };
    fetchLikeState();
  }, [ventureId]);

  const handleClick = async () => {
    if (isAuthenticated === null) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Optimistic update
    const newHasLiked = !hasLiked;
    const newCount = newHasLiked ? count + 1 : count - 1;
    setHasLiked(newHasLiked);
    setCount(newCount);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/like`, {
          method: newHasLiked ? 'POST' : 'DELETE',
        });

        if (!res.ok) {
          // Revert on error
          setHasLiked(!newHasLiked);
          setCount(count);
        } else {
          const data = await res.json();
          setCount(data.count);
        }
      } catch {
        // Revert on error
        setHasLiked(!newHasLiked);
        setCount(count);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all
        ${hasLiked
          ? 'bg-dead-tint text-dead hover:bg-dead/20'
          : 'bg-soft text-ink-2 hover:bg-rule hover:text-ink'
        }
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={hasLiked ? 'Unlike' : 'Like'}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={hasLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showCount && <span className="font-mono">{count}</span>}
    </button>
  );
}

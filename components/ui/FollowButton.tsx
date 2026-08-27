'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface FollowButtonProps {
  ventureId: string;
  initialFollowing?: boolean;
  className?: string;
}

export function FollowButton({ ventureId, initialFollowing = false, className = '' }: FollowButtonProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  const handleClick = async () => {
    if (isAuthenticated === null) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const action = isFollowing ? 'unfollow' : 'follow';

    // Optimistic update
    setIsFollowing(!isFollowing);

    startTransition(async () => {
      try {
        const res = await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ventureId, action }),
        });

        if (!res.ok) {
          // Revert on error
          setIsFollowing(isFollowing);
        }
      } catch {
        // Revert on error
        setIsFollowing(isFollowing);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`
        px-4 py-2 rounded-full font-semibold text-[13px] transition-all
        ${isFollowing
          ? 'bg-soft border border-rule text-ink hover:bg-page hover:border-ink-3'
          : 'bg-ink text-white hover:bg-[#2a2a2a]'
        }
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

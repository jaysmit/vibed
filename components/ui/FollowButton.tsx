'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
  ventureId: string;
  initialFollowing?: boolean;
  className?: string;
}

export function FollowButton({ ventureId, initialFollowing = false, className = '' }: FollowButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    if (status === 'loading') return;

    if (!session) {
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

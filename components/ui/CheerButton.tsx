'use client';

import { useState, useEffect } from 'react';

interface CheerButtonProps {
  ventureId: string;
  initialCount?: number;
  initialCheered?: boolean;
  className?: string;
}

export function CheerButton({
  ventureId,
  initialCount = 0,
  initialCheered = false,
  className = '',
}: CheerButtonProps) {
  const [hasCheered, setHasCheered] = useState(initialCheered);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Fetch initial state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/cheer`);
        if (res.ok) {
          const data = await res.json();
          setHasCheered(data.hasCheered);
          setCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching cheer state:', error);
      }
    };
    fetchState();
  }, [ventureId]);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (hasCheered) {
        // Remove cheer
        const res = await fetch(`/api/ventures/${ventureId}/cheer`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setHasCheered(false);
          setCount((c) => Math.max(0, c - 1));
        } else {
          const data = await res.json();
          if (data.error === 'Authentication required') {
            // Redirect to login
            window.location.href = `/login?redirect=/v/${ventureId}`;
          }
        }
      } else {
        // Add cheer
        const res = await fetch(`/api/ventures/${ventureId}/cheer`, {
          method: 'POST',
        });
        if (res.ok) {
          setHasCheered(true);
          setCount((c) => c + 1);
          setShowAnimation(true);
          setTimeout(() => setShowAnimation(false), 600);
        } else {
          const data = await res.json();
          if (data.error === 'Authentication required') {
            // Redirect to login
            window.location.href = `/login?redirect=/v/${ventureId}`;
          }
        }
      }
    } catch (error) {
      console.error('Error toggling cheer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`relative text-[13px] font-semibold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
        hasCheered
          ? 'bg-go text-white hover:bg-go-deep'
          : 'bg-go text-white hover:bg-go-deep'
      } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Thumbs up icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={hasCheered ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        className={`transition-transform ${showAnimation ? 'scale-125' : ''}`}
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      <span>{hasCheered ? 'Cheered!' : 'Cheer them on'}</span>
      {count > 0 && (
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px]">
          {count}
        </span>
      )}

      {/* Animation particles */}
      {showAnimation && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(6)].map((_, i) => (
            <span
              key={i}
              className="absolute text-[10px] animate-ping"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.5s',
              }}
            >
              🎉
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

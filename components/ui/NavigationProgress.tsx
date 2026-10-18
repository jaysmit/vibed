'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const completionTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // When navigation completes, animate to 100% then fade out
    if (isNavigating) {
      setIsCompleting(true);
      setProgress(100);

      // After animation completes, hide the bar
      completionTimeout.current = setTimeout(() => {
        setIsNavigating(false);
        setIsCompleting(false);
        setProgress(0);
      }, 300);
    }

    return () => {
      if (completionTimeout.current) {
        clearTimeout(completionTimeout.current);
      }
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isNavigating && !isCompleting) {
      // Start progress animation - only move forward
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // Slow down as we approach 90%
          const increment = Math.max(1, (90 - prev) * 0.1);
          return Math.min(90, prev + increment);
        });
      }, 150);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isNavigating, isCompleting]);

  useEffect(() => {
    // Listen for click events on links
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;

      if (link) {
        const href = link.getAttribute('href');
        // Only show loading for internal navigation
        if (href && href.startsWith('/') && !href.startsWith('//')) {
          // Don't show for same page anchors or current page
          if (!href.startsWith('#') && href !== pathname) {
            // Reset and start fresh
            setIsCompleting(false);
            setProgress(0);
            // Use requestAnimationFrame to ensure the reset happens before starting
            requestAnimationFrame(() => {
              setIsNavigating(true);
              setProgress(5);
            });
          }
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] h-1 bg-rule/30 transition-opacity duration-200 ${isCompleting ? 'opacity-0' : 'opacity-100'}`}>
      <div
        className="h-full bg-go transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: isCompleting ? '200ms' : '150ms'
        }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}

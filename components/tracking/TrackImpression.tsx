'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getAnonId, trackEvent } from './tracker';

interface TrackImpressionProps {
  rail: string;
  position: number;
  ventureId?: string;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
}

/**
 * Wrapper component that fires an impression event when the child comes into view.
 * Uses IntersectionObserver for efficient viewport detection.
 */
export function TrackImpression({
  rail,
  position,
  ventureId,
  children,
  className = '',
  threshold = 0.5, // 50% visibility required
}: TrackImpressionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const hasFired = useRef(false);

  const handleImpression = useCallback(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    trackEvent({
      type: 'rail.impression',
      ventureId,
      meta: {
        rail,
        position,
      },
    });
  }, [rail, position, ventureId]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip if IntersectionObserver not supported
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: fire immediately
      handleImpression();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          handleImpression();
          observer.disconnect();
        }
      },
      {
        threshold,
        // rootMargin: '0px', // Can add margin to fire earlier/later
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleImpression, threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

interface TrackClickProps {
  type: 'rail.click' | 'site_click' | 'social_click';
  rail?: string;
  position?: number;
  ventureId?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Wrapper that tracks clicks before navigating
 */
export function TrackClick({
  type,
  rail,
  position,
  ventureId,
  href,
  children,
  className = '',
  onClick,
}: TrackClickProps) {
  const handleClick = () => {
    trackEvent({
      type,
      ventureId,
      meta: {
        rail,
        position,
        href,
      },
    });
    onClick?.();
  };

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}

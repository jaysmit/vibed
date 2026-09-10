'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  // Show logged-out version by default (with video) - better for first paint
  if (isLoggedIn === null || !isLoggedIn) {
    return (
      <section className="py-5 sm:py-8">
        {/* Mobile: tagline + video only */}
        <div className="sm:hidden">
          <h1
            className="text-[26px] font-black tracking-tight leading-[1.04]"
            style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
          >
            The overnight success,
            <br />
            <span className="text-go-deep">filmed daily.</span>
          </h1>
          <div className="mt-4 aspect-video bg-ink rounded-xl overflow-hidden relative group cursor-pointer">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span className="text-[12px] font-medium text-white/90 mt-2">Learn what we&apos;re about</span>
            </div>
          </div>
        </div>

        {/* Desktop: side by side 50/50 split */}
        <div className="hidden sm:flex items-stretch gap-12">
          <div className="w-1/2 pr-4">
            <h1
              className="text-[clamp(32px,4vw,44px)] font-black tracking-tight leading-[1.04] max-w-[19ch]"
              style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
            >
              The overnight success,
              <br />
              <span className="text-go-deep">filmed daily.</span>
            </h1>
            <p className="text-[15px] sm:text-[16px] text-ink-2 mt-3 max-w-[52ch]">
              Follow founders from week one. Watch the real story unfold — the breakthroughs, the
              setbacks, and everything they figured out along the way.
            </p>
          </div>
          <div className="w-1/2 pl-4">
            <div className="h-full bg-ink rounded-xl overflow-hidden relative group cursor-pointer aspect-video">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span className="text-[12px] font-medium text-white/90 mt-2">Learn what we&apos;re about</span>
                <span className="text-[10px] text-white/60 mt-0.5">1 min</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Logged in: simpler hero
  return (
    <section className="py-5 sm:py-8">
      <div>
        <h1
          className="text-[clamp(24px,4vw,44px)] font-black tracking-tight leading-[1.04] max-w-[19ch]"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          The overnight success,
          <br />
          <span className="text-go-deep">filmed daily.</span>
        </h1>
        <p className="text-[14px] sm:text-[16px] text-ink-2 mt-2 sm:mt-3 max-w-[52ch]">
          Follow founders from week one. Watch the real story unfold — the breakthroughs, the
          setbacks, and everything they figured out along the way.
        </p>
      </div>
    </section>
  );
}

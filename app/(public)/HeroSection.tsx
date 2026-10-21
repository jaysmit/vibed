'use client';

import { useState, useRef } from 'react';

export function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
    // Small delay to ensure video element is rendered
    setTimeout(() => {
      videoRef.current?.play();
    }, 100);
  };

  return (
    <section className="py-5 sm:py-8">
      {/* Mobile layout */}
      <div className="sm:hidden">
        <h1
          className="text-[26px] font-black tracking-tight leading-[1.04]"
          style={{ fontVariationSettings: "'SOFT' 70, 'WONK' 1" }}
        >
          The overnight success,
          <br />
          <span className="text-go-deep">filmed daily.</span>
        </h1>
        <div className="mt-4 aspect-video bg-ink rounded-xl overflow-hidden relative">
          {isPlaying ? (
            <video
              ref={videoRef}
              src="/hero-video.mov"
              className="absolute inset-0 w-full h-full object-cover"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <div className="absolute inset-0 cursor-pointer group" onClick={handlePlay}>
              <img
                src="/hero-thumbnail.png"
                alt="Vibed intro video"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span className="text-[12px] font-medium text-white/90 mt-2">See what we are all about...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:block">
        <div className="flex items-stretch gap-12">
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
            <div className="h-full bg-ink rounded-xl overflow-hidden relative aspect-video">
              {isPlaying ? (
                <video
                  ref={videoRef}
                  src="/hero-video.mov"
                  className="absolute inset-0 w-full h-full object-cover"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <div className="absolute inset-0 cursor-pointer group" onClick={handlePlay}>
                  <img
                    src="/hero-thumbnail.png"
                    alt="Vibed intro video"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <span className="text-[12px] font-medium text-white/90 mt-2">See what we are all about...</span>
                    <span className="text-[10px] text-white/60 mt-0.5">1 min</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import MuxPlayer from '@mux/mux-player-react';

interface VideoPlayerProps {
  playbackId: string;
  title?: string;
  thumbTime?: number;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
}

export function VideoPlayer({
  playbackId,
  title,
  thumbTime = 0,
  autoPlay = false,
  muted = false,
  className = '',
}: VideoPlayerProps) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      metadata={{
        video_title: title || 'Vibed clip',
      }}
      thumbnailTime={thumbTime}
      autoPlay={autoPlay}
      muted={muted}
      className={className}
      style={{
        aspectRatio: '16/9',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
      accentColor="#05CE78"
    />
  );
}

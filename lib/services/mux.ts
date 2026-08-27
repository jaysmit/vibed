import Mux from '@mux/mux-node';

// Initialize Mux client
function getMuxClient() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    throw new Error('MUX_TOKEN_ID and MUX_TOKEN_SECRET must be set');
  }

  return new Mux({ tokenId, tokenSecret });
}

export interface CreateUploadResult {
  uploadId: string;
  uploadUrl: string;
}

export interface AssetInfo {
  assetId: string;
  playbackId: string;
  status: 'preparing' | 'ready' | 'errored';
  duration?: number;
  aspectRatio?: string;
}

/**
 * Create a direct upload URL for client-side video upload
 * Videos go directly from browser to Mux, never through our server
 */
export async function createDirectUpload(
  ventureId: string,
  questionSlug: string
): Promise<CreateUploadResult> {
  const mux = getMuxClient();

  const upload = await mux.video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL || '*',
    new_asset_settings: {
      playback_policy: ['public'],
      // Store metadata for webhook processing
      passthrough: JSON.stringify({ ventureId, questionSlug }),
    } as Parameters<typeof mux.video.uploads.create>[0]['new_asset_settings'],
  });

  if (!upload.url) {
    throw new Error('Failed to get upload URL from Mux');
  }

  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
  };
}

/**
 * Get asset info by ID
 */
export async function getAsset(assetId: string): Promise<AssetInfo | null> {
  const mux = getMuxClient();

  try {
    const asset = await mux.video.assets.retrieve(assetId);

    const playbackId = asset.playback_ids?.[0]?.id;
    if (!playbackId) {
      return null;
    }

    return {
      assetId: asset.id,
      playbackId,
      status: asset.status as 'preparing' | 'ready' | 'errored',
      duration: asset.duration,
      aspectRatio: asset.aspect_ratio,
    };
  } catch {
    return null;
  }
}

/**
 * Get upload by ID to check status and get asset ID
 */
export async function getUpload(uploadId: string) {
  const mux = getMuxClient();

  try {
    const upload = await mux.video.uploads.retrieve(uploadId);
    return {
      uploadId: upload.id,
      status: upload.status,
      assetId: upload.asset_id,
    };
  } catch {
    return null;
  }
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<boolean> {
  const mux = getMuxClient();

  try {
    await mux.video.assets.delete(assetId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get auto-generated transcript/captions for an asset
 * Note: Transcript is typically fetched via webhook (video.asset.track.ready)
 * This is a fallback for manual fetching
 */
export async function getTranscript(assetId: string): Promise<string | null> {
  const mux = getMuxClient();

  try {
    // Get asset info to check for text tracks
    const asset = await mux.video.assets.retrieve(assetId);
    const textTrack = asset.tracks?.find(
      (track) => track.type === 'text' && track.text_type === 'subtitles'
    );

    if (!textTrack?.id) {
      return null;
    }

    return textTrack.id;
  } catch {
    return null;
  }
}

/**
 * Generate a thumbnail URL for an asset
 */
export function getThumbnailUrl(playbackId: string, time = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`;
}

/**
 * Generate an animated GIF preview URL
 */
export function getGifUrl(playbackId: string, start = 0, end = 5): string {
  return `https://image.mux.com/${playbackId}/animated.gif?start=${start}&end=${end}&width=320`;
}

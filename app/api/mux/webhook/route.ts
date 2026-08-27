import { NextRequest, NextResponse } from 'next/server';
import { createClip, updateClipTranscript, getClipByMuxAssetId } from '@/lib/services/clips';
import crypto from 'crypto';

// Mux webhook signature verification
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const parts = signature.split(',');
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  const v1Signature = parts.find((p) => p.startsWith('v1='))?.slice(3);

  if (!timestamp || !v1Signature) return false;

  // Check timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  const payload = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(v1Signature),
    Buffer.from(expectedSignature)
  );
}

interface MuxWebhookEvent {
  type: string;
  data: {
    id: string;
    playback_ids?: { id: string; policy: string }[];
    duration?: number;
    aspect_ratio?: string;
    status?: string;
    passthrough?: string;
    tracks?: {
      type: string;
      text_type?: string;
      language_code?: string;
    }[];
  };
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

  // Get raw body for signature verification
  const body = await req.text();
  const signature = req.headers.get('mux-signature');

  // Verify signature in production
  if (webhookSecret && process.env.NODE_ENV === 'production') {
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error('Invalid Mux webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  try {
    const event: MuxWebhookEvent = JSON.parse(body);
    console.log('Mux webhook:', event.type);

    switch (event.type) {
      case 'video.asset.ready': {
        // Asset is ready for playback
        const { id: assetId, playback_ids, duration, passthrough } = event.data;
        const playbackId = playback_ids?.[0]?.id;

        if (!playbackId || !passthrough) {
          console.error('Missing playbackId or passthrough');
          break;
        }

        // Parse passthrough data
        const { ventureId, questionSlug } = JSON.parse(passthrough);

        // Create clip in database
        await createClip({
          ventureId,
          questionSlug,
          muxAssetId: assetId,
          playbackId,
          durationSec: Math.round(duration || 0),
        });

        console.log('Clip created for asset:', assetId);
        break;
      }

      case 'video.asset.errored': {
        // Asset processing failed
        console.error('Asset processing failed:', event.data.id);
        break;
      }

      case 'video.asset.track.ready': {
        // A track (like captions) is ready
        const track = event.data.tracks?.find(
          (t) => t.type === 'text' && t.text_type === 'subtitles'
        );

        if (track) {
          // Fetch transcript and update clip
          // For now, mark as processing - actual transcript fetch would need additional API call
          const clip = await getClipByMuxAssetId(event.data.id);
          if (clip) {
            // In a real implementation, you'd fetch the actual transcript here
            // For MVP, we'll mark it as ready with empty transcript
            await updateClipTranscript(clip._id, []);
            console.log('Transcript ready for clip:', clip._id);
          }
        }
        break;
      }

      default:
        // Ignore other event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

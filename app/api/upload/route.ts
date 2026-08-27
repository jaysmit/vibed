import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createDirectUpload } from '@/lib/services/mux';
import { getVentureByFounderUserId } from '@/lib/services/ventures';
import { z } from 'zod';

const UploadRequestSchema = z.object({
  questionSlug: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { questionSlug } = UploadRequestSchema.parse(body);

    // Get user's venture
    const venture = await getVentureByFounderUserId(userId);
    if (!venture) {
      return NextResponse.json({ error: 'No venture found' }, { status: 404 });
    }

    // Create direct upload URL
    const upload = await createDirectUpload(venture._id, questionSlug);

    return NextResponse.json({
      uploadId: upload.uploadId,
      uploadUrl: upload.uploadUrl,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

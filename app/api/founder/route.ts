import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CreateFounderSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.string().max(100).nullable().optional(),
});

const UpdateFounderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  headline: z.string().max(150).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  links: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

// Generate a URL-safe slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Check if founder already exists
  const { data: existingFounder } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existingFounder) {
    return NextResponse.json({ error: 'Founder profile already exists' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const data = CreateFounderSchema.parse(body);

    // Generate unique slug
    const baseSlug = generateSlug(data.name);
    let founderSlug = baseSlug;
    let counter = 1;

    while (true) {
      const { data: existing } = await supabase
        .from('founders')
        .select('id')
        .eq('slug', founderSlug)
        .single();

      if (!existing) break;
      founderSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { data: founder, error } = await supabase
      .from('founders')
      .insert({
        user_id: userId,
        name: data.name,
        slug: founderSlug,
        bio: '',
        location: data.location || '',
        links: {},
      })
      .select()
      .single();

    if (error || !founder) {
      return NextResponse.json({ error: 'Failed to create founder profile' }, { status: 500 });
    }

    return NextResponse.json({
      founder: {
        id: founder.id,
        name: founder.name,
        slug: founder.slug,
        location: founder.location,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Create founder error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  const { data: founder } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!founder) {
    return NextResponse.json({ founder: null });
  }

  return NextResponse.json({
    founder: {
      id: founder.id,
      name: founder.name,
      slug: founder.slug,
      headline: founder.headline,
      bio: founder.bio,
      location: founder.location,
      links: founder.links,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Get existing founder
  const { data: founder } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!founder) {
    return NextResponse.json({ error: 'Founder profile not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const data = UpdateFounderSchema.parse(body);

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) updateData.name = data.name;
    if (data.headline !== undefined) updateData.headline = data.headline;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.links) {
      // Clean up empty strings
      updateData.links = {
        linkedin: data.links.linkedin || undefined,
        twitter: data.links.twitter || undefined,
        website: data.links.website || undefined,
      };
    }

    const { error } = await supabase
      .from('founders')
      .update(updateData)
      .eq('id', founder.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Update founder error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

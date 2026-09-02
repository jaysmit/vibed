import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Sample founders data
const sampleFounders = [
  {
    name: 'Sarah Chen',
    slug: 'sarah-chen',
    headline: 'Serial Entrepreneur | 2x Founder | Angel Investor',
    bio: 'Building the future of work. Previously founded TechFlow (acquired 2022). Stanford MBA. Love hiking and bad coffee.',
    location: 'San Francisco, USA',
    links: {
      linkedin: 'https://linkedin.com/in/sarahchen',
      twitter: 'https://x.com/sarahchen',
      website: 'https://sarahchen.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    },
  },
  {
    name: 'Marcus Williams',
    slug: 'marcus-williams',
    headline: 'Fintech Founder | Ex-Goldman | Building Payflow',
    bio: 'Democratising financial services for small businesses. 10 years in banking taught me everything that\'s wrong with it. Now fixing it.',
    location: 'London, UK',
    links: {
      linkedin: 'https://linkedin.com/in/marcuswilliams',
      twitter: 'https://x.com/marcusw',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    },
  },
  {
    name: 'Emma Rodriguez',
    slug: 'emma-rodriguez',
    headline: 'Climate Tech | Forbes 30 Under 30 | Building GreenGrid',
    bio: 'On a mission to make renewable energy accessible to everyone. MIT grad. Runner. Dog mum to two golden retrievers.',
    location: 'Austin, USA',
    links: {
      linkedin: 'https://linkedin.com/in/emmarodriguez',
      website: 'https://greengrid.io',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    },
  },
  {
    name: 'Raj Patel',
    slug: 'raj-patel',
    headline: 'AI/ML Engineer turned Founder | Building Synthia',
    bio: 'Former Google AI researcher. Building AI tools that actually help people instead of replacing them. Dad jokes enthusiast.',
    location: 'Melbourne, Australia',
    links: {
      linkedin: 'https://linkedin.com/in/rajpatel',
      twitter: 'https://x.com/rajpatelai',
      website: 'https://synthia.ai',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    },
  },
  {
    name: 'Lisa Nakamura',
    slug: 'lisa-nakamura',
    headline: 'Health Tech Founder | Doctor turned Entrepreneur',
    bio: '15 years as an ER doctor showed me healthcare is broken. Now building MedConnect to fix patient-doctor communication. Coffee addict.',
    location: 'Tokyo, Japan',
    links: {
      linkedin: 'https://linkedin.com/in/lisanakamura',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
    },
  },
];

// Sample ventures for each founder
const sampleVentures = [
  // Sarah Chen's ventures
  {
    founderSlug: 'sarah-chen',
    name: 'WorkOS',
    slug: 'workos',
    pitch: 'Enterprise-ready authentication and user management for modern SaaS',
    glyph: '🔐',
    brand: '#4F46E5',
    industry: 'saas',
    categories: ['saas', 'tech'],
    country: 'US',
    status: 'live',
    problem: 'Building enterprise auth from scratch takes months and millions. Small teams can\'t compete with big companies on security features.',
    who: 'B2B SaaS founders who need enterprise features like SSO, SCIM, and audit logs to close bigger deals.',
    why: 'They\'re losing enterprise deals because they don\'t have the security features big companies require.',
    rung: 'traction',
  },
  {
    founderSlug: 'sarah-chen',
    name: 'TechFlow',
    slug: 'techflow',
    pitch: 'Workflow automation for technical teams',
    glyph: '⚡',
    brand: '#10B981',
    industry: 'saas',
    categories: ['saas', 'tech'],
    country: 'US',
    status: 'graduated',
    problem: 'Engineers spend 40% of their time on repetitive tasks that could be automated.',
    who: 'Engineering teams at mid-size companies (50-500 employees).',
    why: 'They want to ship faster but are drowning in manual processes.',
    rung: 'exit',
  },
  // Marcus Williams' ventures
  {
    founderSlug: 'marcus-williams',
    name: 'Payflow',
    slug: 'payflow',
    pitch: 'Instant business payments for the gig economy',
    glyph: '💸',
    brand: '#059669',
    industry: 'fintech',
    categories: ['fintech', 'tech'],
    country: 'GB',
    status: 'live',
    problem: 'Freelancers and contractors wait 30-90 days to get paid while clients hold their money.',
    who: 'Freelancers, contractors, and small agencies who invoice businesses.',
    why: 'Cash flow problems kill more small businesses than lack of profit.',
    rung: 'scaling',
  },
  // Emma Rodriguez's ventures
  {
    founderSlug: 'emma-rodriguez',
    name: 'GreenGrid',
    slug: 'greengrid',
    pitch: 'Community solar for apartment dwellers',
    glyph: '☀️',
    brand: '#22C55E',
    industry: 'sustainability',
    categories: ['sustainability', 'tech'],
    country: 'US',
    status: 'live',
    problem: '80% of Americans can\'t install solar panels because they rent or live in apartments.',
    who: 'Environmentally-conscious renters in urban areas who want to use renewable energy.',
    why: 'They care about climate change but have zero options to actually do something about their electricity.',
    rung: 'traction',
  },
  // Raj Patel's ventures
  {
    founderSlug: 'raj-patel',
    name: 'Synthia',
    slug: 'synthia',
    pitch: 'AI assistants that augment your team, not replace them',
    glyph: '🤖',
    brand: '#8B5CF6',
    industry: 'ai',
    categories: ['ai', 'saas'],
    country: 'AU',
    status: 'live',
    problem: 'AI tools promise to replace workers but actually create more work managing and fixing their output.',
    who: 'Knowledge workers in creative and analytical roles.',
    why: 'They want AI to handle the boring parts of their job so they can focus on what they\'re actually good at.',
    rung: 'validation',
  },
  {
    founderSlug: 'raj-patel',
    name: 'DataLens',
    slug: 'datalens',
    pitch: 'Visual analytics for non-technical teams',
    glyph: '📊',
    brand: '#F59E0B',
    industry: 'saas',
    categories: ['saas', 'ai'],
    country: 'AU',
    status: 'closed',
    problem: 'Business teams depend on data analysts for every simple question.',
    who: 'Marketing and sales teams who need quick answers from their data.',
    why: 'They can\'t wait 2 weeks for the data team to answer a simple question.',
    rung: 'idea',
  },
  // Lisa Nakamura's ventures
  {
    founderSlug: 'lisa-nakamura',
    name: 'MedConnect',
    slug: 'medconnect',
    pitch: 'Async healthcare communication that actually works',
    glyph: '🏥',
    brand: '#06B6D4',
    industry: 'health',
    categories: ['health', 'tech'],
    country: 'JP',
    status: 'live',
    problem: 'Patients play phone tag for days to get simple answers from their doctors.',
    who: 'Patients with chronic conditions who need regular communication with their healthcare team.',
    why: 'Poor communication leads to worse health outcomes and unnecessary ER visits.',
    rung: 'traction',
  },
];

export async function POST(req: Request) {
  // Check for a secret key to prevent unauthorized seeding
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== 'seed-vibed-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: string[] = [];

  try {
    // Create founders
    for (const founder of sampleFounders) {
      // Check if founder already exists
      const { data: existing } = await supabase
        .from('founders')
        .select('id')
        .eq('slug', founder.slug)
        .single();

      if (existing) {
        results.push(`Founder ${founder.name} already exists, updating...`);

        // Update founder with new data - try with headline first
        let { error } = await supabase
          .from('founders')
          .update({
            name: founder.name,
            headline: founder.headline,
            bio: founder.bio,
            location: founder.location,
            links: founder.links,
          })
          .eq('slug', founder.slug);

        // If headline column doesn't exist, retry without it
        if (error?.message?.includes('headline')) {
          const result = await supabase
            .from('founders')
            .update({
              name: founder.name,
              bio: founder.bio,
              location: founder.location,
              links: founder.links,
            })
            .eq('slug', founder.slug);
          error = result.error;
        }

        if (error) {
          results.push(`Error updating ${founder.name}: ${error.message}`);
        }
        continue;
      }

      // Create a test user in auth.users first
      const email = `${founder.slug}@demo.vibed.com`;
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        password: 'demo-password-123',
        user_metadata: { name: founder.name },
      });

      if (authError) {
        // User might already exist, try to get them
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (!existingUser) {
          results.push(`Error creating auth user for ${founder.name}: ${authError.message}`);
          continue;
        }

        // Use existing user
        const userId = existingUser.id;

        // Try with headline first, fallback without if column doesn't exist
        const founderData: Record<string, unknown> = {
          user_id: userId,
          name: founder.name,
          slug: founder.slug,
          bio: founder.bio,
          location: founder.location,
          links: founder.links,
        };

        let { error } = await supabase
          .from('founders')
          .insert({ ...founderData, headline: founder.headline })
          .select()
          .single();

        if (error?.message?.includes('headline')) {
          const result = await supabase
            .from('founders')
            .insert(founderData)
            .select()
            .single();
          error = result.error;
        }

        if (error) {
          results.push(`Error creating ${founder.name}: ${error.message}`);
        } else {
          results.push(`Created founder: ${founder.name}`);
        }
        continue;
      }

      const userId = authUser.user.id;

      // Try with headline first, fallback without if column doesn't exist
      const founderData: Record<string, unknown> = {
        user_id: userId,
        name: founder.name,
        slug: founder.slug,
        bio: founder.bio,
        location: founder.location,
        links: founder.links,
      };

      let { error } = await supabase
        .from('founders')
        .insert({ ...founderData, headline: founder.headline })
        .select()
        .single();

      // If headline column doesn't exist, retry without it
      if (error?.message?.includes('headline')) {
        const result = await supabase
          .from('founders')
          .insert(founderData)
          .select()
          .single();
        error = result.error;
      }

      if (error) {
        results.push(`Error creating ${founder.name}: ${error.message}`);
      } else {
        results.push(`Created founder: ${founder.name}`);
      }
    }

    // Create ventures
    for (const venture of sampleVentures) {
      // Get founder ID
      const { data: founder } = await supabase
        .from('founders')
        .select('id')
        .eq('slug', venture.founderSlug)
        .single();

      if (!founder) {
        results.push(`Founder ${venture.founderSlug} not found for venture ${venture.name}`);
        continue;
      }

      // Check if venture already exists
      const { data: existing } = await supabase
        .from('ventures')
        .select('id')
        .eq('slug', venture.slug)
        .single();

      if (existing) {
        results.push(`Venture ${venture.name} already exists, updating...`);

        // Try to update with new fields
        const updateData: Record<string, unknown> = {
          name: venture.name,
          pitch: venture.pitch,
          glyph: venture.glyph,
          brand: venture.brand,
          industry: venture.industry,
          status: venture.status,
          problem: venture.problem,
          who: venture.who,
          why: venture.why,
          rung: venture.rung,
        };

        // Try adding country and categories (may fail if columns don't exist)
        try {
          const { error } = await supabase
            .from('ventures')
            .update({
              ...updateData,
              country: venture.country,
              categories: venture.categories,
            })
            .eq('slug', venture.slug);

          if (error && error.message.includes('column')) {
            // Retry without new columns
            await supabase
              .from('ventures')
              .update(updateData)
              .eq('slug', venture.slug);
          }
        } catch {
          await supabase
            .from('ventures')
            .update(updateData)
            .eq('slug', venture.slug);
        }
        continue;
      }

      // Create venture - start with minimal required fields
      const baseVentureData: Record<string, unknown> = {
        founder_id: founder.id,
        name: venture.name,
        slug: venture.slug,
        slug_history: [],
        pitch: venture.pitch,
        glyph: venture.glyph,
        brand: venture.brand,
        status: venture.status,
        problem: venture.problem,
        who: venture.who,
        why: venture.why,
        rung: venture.rung,
        segments: {},
        links: {},
        counters: {
          followers: Math.floor(Math.random() * 500) + 50,
          clips: Math.floor(Math.random() * 8) + 3, // Ensure at least 3 clips
          photos: Math.floor(Math.random() * 20),
          likes: Math.floor(Math.random() * 200) + 20,
          comments: Math.floor(Math.random() * 50),
          weekNumber: Math.floor(Math.random() * 52) + 1,
          streakWeeks: Math.floor(Math.random() * 12),
          siteClicks30d: Math.floor(Math.random() * 100),
          trendingScore: Math.random() * 100,
        },
        promise: null,
        promise_history: [],
        published_at: venture.status === 'live' || venture.status === 'graduated'
          ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      };

      // Try with all optional columns first
      let { data: newVenture, error } = await supabase
        .from('ventures')
        .insert({
          ...baseVentureData,
          industry: venture.industry,
          country: venture.country,
          categories: venture.categories,
        })
        .select()
        .single();

      // If failed due to missing columns, try without industry
      if (error?.message?.includes('industry')) {
        const result = await supabase
          .from('ventures')
          .insert({
            ...baseVentureData,
            country: venture.country,
            categories: venture.categories,
          })
          .select()
          .single();
        newVenture = result.data;
        error = result.error;
      }

      // If still failing due to country/categories, try without those
      if (error?.message?.includes('column')) {
        const result = await supabase
          .from('ventures')
          .insert(baseVentureData)
          .select()
          .single();
        newVenture = result.data;
        error = result.error;
      }

      if (error) {
        results.push(`Error creating ${venture.name}: ${error.message}`);
      } else {
        results.push(`Created venture: ${venture.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: 'Seed completed',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with ?secret=seed-vibed-2024 to seed sample data'
  });
}

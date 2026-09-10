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
    segments: {
      pitch: {
        body: `Every B2B SaaS founder hits the same wall: a Fortune 500 prospect says "we love your product, but you need SSO and SCIM before we can sign."

Building enterprise auth takes 6-12 months and costs hundreds of thousands. Most startups lose the deal. We've closed $2M in ARR from founders who would have lost those enterprise contracts.

WorkOS is drop-in enterprise infrastructure. Five lines of code gives you SSO, directory sync, and audit logs. We handle the security certifications. You close the deal.

We're charging $500/month per enterprise customer they onboard - they're paying us a fraction of what those contracts are worth. 340 companies are live, 40% month-over-month growth. We're raising to expand our sales team and add compliance features.`,
        happenedAt: '2024-06-15',
      },
      spark: {
        body: 'At my last startup TechFlow, we spent 8 months building SSO just to close one deal. I watched three competitors die because they couldn\'t afford to build it. That\'s broken.',
        happenedAt: '2023-11-01',
      },
    },
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
    segments: {
      pitch: {
        body: `Engineers are expensive. The average salary is $180K, and 40% of their time goes to repetitive tasks: deployments, code reviews, incident response runbooks.

TechFlow automates the boring stuff. Connect your GitHub, Slack, and infrastructure - we learn your workflows and automate them. One customer saved 120 engineering hours per month. That's a full headcount.

We had 2,400 teams using us, $8M ARR, growing 25% quarter over quarter. We were acquired by Atlassian in 2022 for $45M - they wanted our workflow engine for Jira.

This was my first real win. Took 4 years from idea to exit.`,
        happenedAt: '2022-03-20',
      },
      spark: {
        body: 'I was an engineering manager watching my team do the same deployment steps 50 times a week. I wrote a script to automate it. Then another. Then I realised every team had the same problem.',
        happenedAt: '2018-02-10',
      },
    },
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
    segments: {
      pitch: {
        body: `82% of small businesses fail because of cash flow problems. Not because they're unprofitable - because they can't collect what they're owed fast enough.

The average freelancer waits 47 days to get paid. They invoice, then chase, then wait. Meanwhile, they're paying rent on credit cards.

Payflow advances invoices instantly. Freelancer sends invoice through us, gets paid same day. We collect from the client on normal terms. We take 3% - they'd pay more than that in late fees and stress.

We've advanced £12M in invoices. Default rate is 0.3% because we verify clients before advancing. Growing 35% month over month. 8,000 freelancers on the platform.

We're raising £3M to expand across Europe and add a business credit line product.`,
        happenedAt: '2024-04-10',
      },
      spark: {
        body: 'Ten years at Goldman showed me banks don\'t care about small businesses. My sister nearly lost her design agency waiting for a client to pay. The bank wouldn\'t help. I quit the next month.',
        happenedAt: '2022-08-15',
      },
    },
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
    segments: {
      pitch: {
        body: `77 million American households want solar but can't install panels. They rent. They live in apartments. Their roof faces the wrong way.

These people would pay more for clean energy but have literally no option. Until now.

GreenGrid lets anyone subscribe to a local solar farm. You pick a farm in your region, and their power offsets your electric bill. Average customer saves $30/month while going 100% renewable.

We partner with solar farm operators who have excess capacity. They get guaranteed revenue. Customers get cheaper, cleaner power. We take 15% of the savings.

12,000 subscribers across Texas, Arizona, and California. $180K MRR. Unit economics are strong - CAC is $45, LTV is $800.

We're raising to expand to 10 more states and sign more farm partnerships.`,
        happenedAt: '2024-05-22',
      },
      spark: {
        body: 'I moved to Austin, wanted solar, and my landlord said no. Tried three different green energy programs - all were scams or not actually renewable. I figured there had to be a better way.',
        happenedAt: '2023-03-01',
      },
    },
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
    segments: {
      pitch: {
        body: `Everyone's selling AI that "replaces" workers. But talk to anyone using these tools - they spend half their time fixing AI mistakes.

The real opportunity isn't replacement. It's augmentation. Handle the tedious 20% of someone's job so they can focus on the creative 80%.

Synthia is an AI assistant that learns your specific workflows. A lawyer's Synthia handles document discovery and cite-checking. A marketer's Synthia handles data pulls and first-draft reports. It learns what you'd do, and does the boring version.

We're in private beta with 50 users across law, marketing, and consulting. Average user saves 8 hours per week. They're paying $200/month and saying it's underpriced.

We're raising seed funding to build out the platform and expand to more professions.`,
        happenedAt: '2024-07-01',
      },
      spark: {
        body: 'At Google, I built AI that could do incredible things - but it always needed a human to check the output. The magic wasn\'t in replacing people. It was in making them faster.',
        happenedAt: '2024-01-15',
      },
    },
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
    segments: {
      pitch: {
        body: `Marketing teams have a simple question: "Which campaign drove the most revenue last month?" They submit a ticket. Wait two weeks. Get a spreadsheet they don't understand.

DataLens was meant to be natural language analytics. Ask a question in plain English, get a chart.

We built it. The AI worked. But we couldn't get the data integrations right - every company's data is a mess, and cleaning it took more time than the analytics saved.

Shutting down after 8 months. Key lesson: the hard problem wasn't AI, it was data plumbing. Someone should solve that first.`,
        happenedAt: '2023-08-01',
      },
      spark: {
        body: 'I watched marketing teams at Google wait weeks for simple analytics. Thought I could automate it. I was wrong about the approach, not the problem.',
        happenedAt: '2022-12-01',
      },
    },
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
    segments: {
      pitch: {
        body: `I spent 15 years in the ER watching the same thing: patients coming in for problems that a simple message could have prevented. "I wasn't sure if this was normal." "I couldn't reach anyone." "The office said call back Monday."

30% of ER visits are avoidable with better communication. That's $32 billion in wasted healthcare spending annually.

MedConnect is async messaging between patients and care teams - but built for how healthcare actually works. Messages route to the right person. Urgent flags work. It integrates with their existing systems.

We're live in 45 clinics across Japan. Patient satisfaction scores went up 40%. Unnecessary appointments dropped 25%. Clinics pay $500/month per provider.

We're raising to expand across Asia and add AI triage to route messages even faster.`,
        happenedAt: '2024-03-15',
      },
      spark: {
        body: 'A patient died because they couldn\'t reach us over a weekend. A simple question could have saved them. I resigned the next week and started building.',
        happenedAt: '2022-09-20',
      },
    },
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
          segments: venture.segments || {},
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
        segments: venture.segments || {},
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

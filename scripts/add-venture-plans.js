#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Helper to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

// Plans for each venture
const venturePlans = {
  'storyme': {
    // AI picture book for kids - idea stage
    proto: {
      body: `**First Prototype Plan**

Build a minimal working version:
- Set up AI image generation pipeline (Midjourney/DALL-E API)
- Create 3 sample art styles (watercolour, classic fable, enchanted glow)
- Build basic web flow: upload photo → select style → generate 3 sample illustrations
- Manual book layout in InDesign for first orders

Success criteria: Generate 10 sample character illustrations that parents would want in a book.`,
      daysFromNow: 21
    },
    audience: {
      body: `**Building Audience Plan**

Target: Parents of children aged 2-8, gift-giving grandparents

Channels to test:
- Instagram (kid lifestyle, parenting accounts)
- Facebook parenting groups
- Mumsnet / parenting forums
- Local school newsletters

Goal: 200 email sign-ups on shortlist before first ads spend.`,
      daysFromNow: 35
    },
    build: {
      body: `**The Build Plan**

Technical milestones:
- Week 1-2: Photo upload and face detection
- Week 3-4: AI style transfer pipeline
- Week 5-6: Story template system
- Week 7-8: Book preview generator
- Week 9-10: Print integration (Lulu/Printful API)

Stack: Next.js, Replicate API for AI, Stripe for payments.`,
      daysFromNow: 70
    },
    beta: {
      body: `**Beta Testing Plan**

Recruit 20 beta families:
- 10 from shortlist (warm leads)
- 10 from parenting communities (cold)

Test:
- Photo upload quality requirements
- Art style preferences
- Story customisation options
- Delivery experience

Gather testimonials and photos of kids with their books.`,
      daysFromNow: 90
    },
    gtm: {
      body: `**Go-to-Market Plan**

Pricing: $49 for 24-page hardcover (premium positioning)

Launch channels:
1. Email shortlist (expect 20% conversion)
2. Instagram paid ads to parent audiences
3. Gifting angle for grandparents (holiday timing)
4. Affiliate program for parenting bloggers

Target: 100 orders in first month.`,
      daysFromNow: 100
    },
    launch: {
      body: `**Launch Plan**

Soft launch to shortlist first (2 weeks before public).
Gather reviews and testimonials.
Fix any issues with print quality or delivery.

Public launch:
- Product Hunt
- Parenting subreddits (with mod permission)
- Local press (Australian startup story)
- Facebook ads to lookalike audiences`,
      daysFromNow: 110
    }
  },

  'carlogne': {
    // Car vent cologne diffuser - idea stage
    proto: {
      body: `**First Prototype Plan**

Hardware prototype:
- Source 10 stock vent clip housings from Alibaba
- Test 3 different wick/pad materials for scent diffusion
- Create Base No. 1 formula (fixative carrier) in small batch
- Test with 5 different cologne brands for compatibility

Success: Working prototype that holds scent for 2+ weeks in car.`,
      daysFromNow: 28
    },
    audience: {
      body: `**Building Audience Plan**

Target: Men 25-45 who buy premium cologne ($100+)

Channels:
- Fragrance Reddit communities (r/fragrance, r/fragranceswap)
- Instagram cologne enthusiast accounts
- Car detailing communities (they care about interior scent)
- TikTok cologne reviews

Goal: 100 shortlist sign-ups, understand which fragrances are most popular.`,
      daysFromNow: 42
    },
    build: {
      body: `**The Build Plan**

Founders' Batch (100 units):
- Week 1-2: Finalise housing supplier, order 150 units
- Week 3-4: Finalise Base No. 1 formula, source bottles
- Week 5-6: Assembly and quality testing
- Week 7-8: Packaging design and production
- Week 9: Photography and product shots

Keep it simple: stock housing, honest about it being first batch.`,
      daysFromNow: 70
    },
    beta: {
      body: `**Beta Testing Plan**

Send 10 free units to:
- 5 fragrance community members (for honest reviews)
- 3 car detailing YouTubers (for content)
- 2 friends with long commutes (for real-world testing)

Gather:
- Longevity data (how many weeks does scent last?)
- Compatibility notes (which colognes work best?)
- Installation feedback
- Unboxing photos/videos`,
      daysFromNow: 85
    },
    gtm: {
      body: `**Go-to-Market Plan**

Founders' Batch pricing: $79 (housing + Base No. 1 starter)
Refill pricing: $29 for Base No. 1 (3-month supply)

Launch:
1. Email waitlist with numbered limited edition
2. Fragrance Reddit AMA
3. Send to 5 cologne YouTubers
4. Instagram ads to cologne hashtag followers

Target: Sell 100 Founders' Batch in 4 weeks.`,
      daysFromNow: 95
    },
    launch: {
      body: `**Launch Plan**

Founders' Batch launch:
- Numbered units (1-100) for exclusivity
- Handwritten thank you notes
- Early bird pricing locked for life on refills

Track:
- Which cologne pairings customers choose
- Refill reorder rate (this is the real business)
- Customer photos/testimonials for social proof`,
      daysFromNow: 100
    }
  },

  'inner-verse': {
    // AI poetry app - live stage, needs growth plans
    first: {
      body: `**First Dollar Plan**

Monetisation options to test:
1. Premium tier ($4.99/month) - unlimited generations, save history
2. One-time credits pack ($9.99 for 50 poems)
3. Print-on-demand (poem on poster/card)

Start with premium subscription, easiest to implement.
Target: 10 paying subscribers in first month.`,
      daysFromNow: 30
    },
    channel: {
      body: `**Finding Channels Plan**

Test these acquisition channels:
1. TikTok poetry community (short video of poem generation)
2. Instagram poetry accounts (collaborations)
3. Reddit r/poetry, r/writing (share genuinely good outputs)
4. Pinterest (poem images for sharing)
5. Google Ads on "AI poetry generator"

Budget: $200/month across channels, measure CAC for each.`,
      daysFromNow: 45
    },
    money: {
      body: `**Financial Plan**

Current costs:
- Vercel hosting: $20/month
- Anthropic API: ~$50/month at current usage
- Domain: $15/year

Revenue targets:
- Month 1: $50 (10 subscribers)
- Month 3: $250 (50 subscribers)
- Month 6: $500 (100 subscribers)

Break-even at ~20 subscribers. Focus on retention over acquisition.`,
      daysFromNow: 60
    },
    retention: {
      body: `**Keeping Them Plan**

Features to improve retention:
1. Daily poem email (opt-in) - brings users back
2. Poem collections/folders - builds investment
3. Seasonal themes (holidays, seasons)
4. Share to social with branded template
5. "Poem of the day" community feature

Track: 7-day retention, 30-day retention, poems per user.`,
      daysFromNow: 75
    }
  },

  'what-s-next': {
    // Animation/3D test project - needs everything
    validation: {
      body: `**Validation Plan**

Before building more:
1. Define clear use case (is this a tool? A showcase? A learning project?)
2. Talk to 5 potential users about their 3D/animation needs
3. Research competitors in the space
4. Decide: build for others or keep as personal project?

If it's a portfolio piece, that's fine - document what was learned.`,
      daysFromNow: 14
    },
    proto: {
      body: `**Prototype Plan**

If continuing as a product:
- Define 3 core features that differentiate from existing tools
- Build simplest version of each
- Create demo video showing the workflow
- Get feedback from 10 3D artists

Timeline: 4 weeks for functional prototype.`,
      daysFromNow: 42
    },
    audience: {
      body: `**Building Audience Plan**

Target: 3D artists, animators, game developers

Channels:
- Twitter/X 3D art community
- ArtStation
- Polycount forums
- r/blender, r/3Dmodeling
- YouTube tutorials/breakdowns

Goal: 50 people interested in trying the tool.`,
      daysFromNow: 56
    }
  },

  'trueline': {
    // Expense verification for mortgage brokers - building stage
    beta: {
      body: `**Beta Testing Plan**

Recruit 5 mortgage brokers for beta:
- 2 from existing network
- 3 from LinkedIn outreach

Test:
- Document upload flow
- Expense categorisation accuracy
- Report generation
- Integration with existing broker workflows

Gather: Time saved per application, accuracy rate, pain points.`,
      daysFromNow: 21
    },
    gtm: {
      body: `**Go-to-Market Plan**

Pricing: $49/month per broker (or $99/month for team of 3)

Launch to:
1. Beta users (convert at discount)
2. Broker associations/groups
3. LinkedIn ads to mortgage professionals
4. Referral program (1 month free per referral)

Target: 20 paying brokers in first 3 months.`,
      daysFromNow: 45
    },
    launch: {
      body: `**Launch Plan**

Soft launch:
- Convert beta users to paid
- Gather testimonials and case studies
- Refine onboarding based on beta feedback

Public launch:
- Mortgage broker forums/communities
- Industry newsletter sponsorships
- Partnership with broker aggregators`,
      daysFromNow: 60
    },
    firstuser: {
      body: `**First Real User Plan**

Target: One broker using Trueline for real client applications.

Success criteria:
- Processes 10+ applications through the system
- Reports time savings vs manual process
- Willing to provide testimonial
- Willing to refer colleagues

This is the proof point for everything that follows.`,
      daysFromNow: 35
    },
    first: {
      body: `**First Dollar Plan**

Convert first beta user to paid:
- Offer 50% discount for annual commitment
- Include white-glove onboarding
- Weekly check-ins for first month

First paying customer validates the entire model. Document everything.`,
      daysFromNow: 50
    }
  },

  'gamehub': {
    // Multiplayer gaming hub - idea stage
    validation: {
      body: `**Validation Plan**

Answer these questions:
1. What games will the hub support initially?
2. Who is the target player (casual? competitive?)
3. What's the unique value vs Discord, Steam, etc?
4. How will you build initial player community?

Talk to 20 gamers about their multiplayer pain points.`,
      daysFromNow: 14
    },
    proto: {
      body: `**Prototype Plan**

Build MVP with:
- 1 game (choose most popular/easiest to implement)
- Basic matchmaking
- In-game chat
- Player profiles

Tech: Socket.io for real-time, Railway for hosting.
Timeline: 6 weeks.`,
      daysFromNow: 56
    },
    audience: {
      body: `**Building Audience Plan**

Find your first 100 players:
- Gaming Discord servers
- Reddit gaming communities
- Twitch streamers (small ones looking for content)
- University gaming clubs
- Local gaming meetups

Host weekly game nights to build community.`,
      daysFromNow: 70
    },
    build: {
      body: `**The Build Plan**

Phase 1 (Weeks 1-4): Core infrastructure
- User authentication
- Real-time game state sync
- Basic matchmaking

Phase 2 (Weeks 5-8): First game
- Choose game type (party game? strategy?)
- Implement game logic
- Add spectator mode

Phase 3 (Weeks 9-12): Social features
- Friends list
- Chat system
- Leaderboards`,
      daysFromNow: 84
    }
  }
};

async function addPlans() {
  const today = new Date();

  for (const [slug, plans] of Object.entries(venturePlans)) {
    // Get current venture
    const { data: venture, error } = await supabase
      .from('ventures')
      .select('id, segments')
      .eq('slug', slug)
      .single();

    if (error || !venture) {
      console.log(`Skipping ${slug}: not found`);
      continue;
    }

    const segments = venture.segments || {};
    let addedCount = 0;

    // Add planned segments
    for (const [segKey, plan] of Object.entries(plans)) {
      // Skip if segment already has content
      if (segments[segKey]?.body) {
        continue;
      }

      const plannedDate = addDays(today, plan.daysFromNow);
      segments[segKey] = {
        body: plan.body,
        happenedAt: null, // null = planned, not happened yet
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPlanned: true,
        plannedDate: plannedDate
      };
      addedCount++;
    }

    if (addedCount > 0) {
      const { error: updateError } = await supabase
        .from('ventures')
        .update({ segments })
        .eq('id', venture.id);

      if (updateError) {
        console.log(`Error updating ${slug}:`, updateError.message);
      } else {
        console.log(`✅ ${slug}: Added ${addedCount} planned segments`);
      }
    } else {
      console.log(`⏭️  ${slug}: No new segments to add`);
    }
  }
}

addPlans();

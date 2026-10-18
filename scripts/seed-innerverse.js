// Script to create Inner Verse venture under Jake's account
// Run with: node scripts/seed-innerverse.js

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Generate a UUID v4
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const innerVerseVenture = {
  name: 'inner-verse',
  slug: 'inner-verse',
  slug_history: [],
  pitch: 'AI-guided self-reflection that transforms your own words into insight. Answer a powerful question, explore deeper, and discover what you already know — seen from a new perspective.',
  brand: '#8B5CF6',
  glyph: '✨',
  // Note: industry column doesn't exist in DB schema
  // categories: ['health', 'ai'],
  country: 'AU',
  status: 'live',
  rung: 'live',
  problem: "Self-help advice feels generic because it's someone else's answers to your questions. Journaling helps, but you end up reading the same thoughts in the same patterns.",
  who: 'People seeking clarity — at career crossroads, processing relationships, working through creative blocks, or simply wanting to understand themselves better.',
  why: "The best insights don't come from outside — they come from hearing your own thoughts reflected back from new angles. AI can be a mirror, not just an advisor.",
  segments: {
    spark: {
      body: `Most self-help feels like someone else's answers to your questions. I wondered: what if AI could help you find clarity not by giving advice, but by reflecting your own words back — transformed and reframed?

The breakthrough came when I realised therapy works because someone really listens. But good therapy is expensive and hard to access. What if AI could provide that quality of reflection — not as a replacement for therapy, but as a daily practice anyone could use?`,
      happenedAt: '2026-06-15',
    },
    pitch: {
      body: `Inner Verse asks you one powerful question. You write freely. Then AI takes your words and reflects them back from angles you hadn't considered.

No generic advice. No "you should" statements. Just your own truth, seen differently.

"What if the answers you're searching for are already within you?"

The magic is in the transformation. You write about being stuck at work. The reflection might notice you used the word "trapped" three times. It might ask what freedom looks like in your work. It doesn't tell you what to do — it helps you see what you already know.

Three simple steps: Reflect. Explore. Discover. No account needed to start. The friction of signup kills introspection.`,
      happenedAt: '2026-06-01',
    },
    validation: {
      body: `Shared an early version with a few friends going through career uncertainty. One said: "I didn't expect to feel so seen by my own words."

That reaction — being moved by their own reflection — proved the concept worked better than any external advice could.

Another tester said she started crying during the reflection. Not because the AI said anything profound, but because it highlighted patterns in her own words she'd been avoiding.

That's when I knew this was different from other AI tools. It's not about the AI being smart. It's about helping people hear themselves clearly.`,
      happenedAt: '2026-07-01',
    },
    proto: {
      body: `Three steps: Reflect (answer a question), Explore (go deeper), Discover (receive insight).

The magic is in the prompt engineering — getting AI to genuinely transform rather than just summarise. Each response should feel like talking to a wise friend who really listened.

Early versions were too therapist-y. "It sounds like you're feeling..." felt hollow. The breakthrough was framing the AI as a mirror, not a counsellor — it reflects and reframes, never prescribes.

Built with Next.js and Anthropic's Claude API. Dark mode by default because reflection feels more natural in soft light. Minimal UI — the words should be the focus, not the interface.`,
      happenedAt: '2026-07-15',
    },
    build: {
      body: `Stack: Next.js with Anthropic's Claude API for the reflection engine.

Design decisions:
- Dark/light theme toggle (most users prefer dark)
- No accounts required to start — friction kills introspection
- Mobile-first — people reflect in bed, on trains, in quiet moments
- Beautiful typography — if you're reading your own words back, they should look meaningful

The visual aesthetic evolved into something almost spiritual. Floating orbs, breathing rings, stars that pulse at different speeds. It needed to feel alive but calm. Meditative but not woo-woo.

The hardest part was rate limiting without making it feel restrictive. Free users get 2 reflections. Enough to experience the magic, not enough to spam.`,
      happenedAt: '2026-08-01',
    },
    launch: {
      body: `Deployed to Vercel. Kept it simple: land on the page, start reflecting immediately.

The testimonial "I didn't expect to feel so seen by my own words" became the social proof. Because that's exactly the reaction I want people to have.

Launch day was quiet by design. No ProductHunt fanfare. Just shared it with people who I thought needed it. Word spread slowly but meaningfully. The best users came from people sharing it with friends going through something.

Current traffic: a few hundred sessions a day. Not viral numbers, but the engagement is deep. Average session length is 8 minutes. That's real reflection, not bounce.`,
      happenedAt: '2026-08-26',
    },
    trouble: {
      body: `Getting the AI tone right took iteration. Early versions felt too therapist-y or too generic.

"It sounds like you're feeling stressed" — useless.
"Have you considered talking to someone?" — deflecting.
"You mentioned 'stuck' three times. What would movement look like?" — better.

The breakthrough was framing the AI as a mirror, not a counsellor — it reflects and reframes, never prescribes. No "you should" statements. No advice. Just questions and observations.

Another challenge: some users wanted it to solve their problems. They'd write "should I quit my job?" and expect a yes/no. Had to reframe the whole experience: this isn't a decision engine. It's a clarity tool.`,
      happenedAt: '2026-09-01',
    },
    next: {
      body: `Exploring journal mode for recurring reflections. The most powerful insights come from patterns over time, not single sessions.

Maybe themed prompts for specific life moments:
- Career crossroads
- Relationship clarity
- Creative blocks
- Grief processing
- Life transitions

The core insight remains: people don't need more advice — they need help hearing themselves.

Eventually want to add voice input. Speaking is more natural than typing for emotional processing. But that's a bigger technical lift.

For now, focusing on making the core experience as magical as possible. One powerful question. One honest answer. One moment of clarity.`,
      happenedAt: '2026-09-10',
    },
  },
  links: {
    site: 'https://inner-verse.vercel.app',
  },
  counters: {
    followers: 0,
    clips: 0,
    photos: 0,
    likes: 0,
    comments: 0,
    weekNumber: 1,
    streakWeeks: 0,
    siteClicks30d: 0,
    trendingScore: 0,
  },
};

async function seedInnerVerse() {
  console.log('Looking up Jake\'s founder account...');

  // Find Jake's user account
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Failed to list users:', userError);
    process.exit(1);
  }

  const jake = users.find(u => u.email === 'jake_smidders@hotmail.com');
  if (!jake) {
    console.error('Could not find user jake_smidders@hotmail.com');
    process.exit(1);
  }

  console.log('Found Jake:', jake.id);

  // Find or create founder record
  let { data: founder, error: founderError } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', jake.id)
    .single();

  if (founderError && founderError.code !== 'PGRST116') {
    console.error('Error finding founder:', founderError);
    process.exit(1);
  }

  if (!founder) {
    console.log('Creating founder record for Jake...');
    const { data: newFounder, error: createError } = await supabase
      .from('founders')
      .insert({
        id: generateId(),
        user_id: jake.id,
        name: 'Jake Smithers',
        slug: 'jake-smithers',
        slug_history: [],
        headline: 'Building things that help people',
        bio: 'Maker. Builder. Always shipping.',
        location: 'Australia',
        links: {},
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Failed to create founder:', createError);
      process.exit(1);
    }
    founder = newFounder;
  }

  console.log('Founder ID:', founder.id);

  // Check if inner-verse venture already exists
  const { data: existing } = await supabase
    .from('ventures')
    .select('id, slug')
    .eq('slug', 'inner-verse')
    .single();

  if (existing) {
    console.log('inner-verse venture already exists:', existing.id);
    console.log('Updating with new content...');

    const { error: updateError } = await supabase
      .from('ventures')
      .update({
        ...innerVerseVenture,
        founder_id: founder.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Failed to update venture:', updateError);
      process.exit(1);
    }

    console.log('Updated inner-verse venture!');
    console.log('View at: https://vibed-hazel.vercel.app/v/inner-verse');
    return;
  }

  // Create new venture (let DB generate UUID)
  console.log('Creating inner-verse venture...');
  const { data: venture, error: ventureError } = await supabase
    .from('ventures')
    .insert({
      founder_id: founder.id,
      ...innerVerseVenture,
    })
    .select()
    .single();

  if (ventureError) {
    console.error('Failed to create venture:', ventureError);
    process.exit(1);
  }

  console.log('Created inner-verse venture!');
  console.log('ID:', venture.id);
  console.log('View at: https://vibed-hazel.vercel.app/v/inner-verse');
  console.log('\nEdit at: https://vibed-hazel.vercel.app/v/inner-verse/edit');
}

seedInnerVerse().catch(console.error);

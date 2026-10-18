#!/usr/bin/env node
/**
 * Complete Carlogne venture basics and idea stage
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Get venture
  const { data: venture, error } = await supabase
    .from('ventures')
    .select('*')
    .eq('slug', 'carlogne')
    .single();

  if (error || !venture) {
    console.error('❌ Venture not found');
    process.exit(1);
  }

  console.log('✅ Found venture:', venture.name);

  // Prepare updates
  const today = new Date().toISOString().split('T')[0];

  const updates = {
    // Basics
    name: 'Carlogne',
    pitch: 'A car vent diffuser that runs on your own cologne — your signature scent for weeks, not days.',
    country: 'AU',
    categories: ['consumer', 'hardware'],
    rung: 'idea',
    problem: `The "new car smell" was never your signature scent.

You spent $300 on a cologne you love. It's part of who you are — people notice when you walk into a room. But the moment you get in your car, you're hit with a $5 pine tree or some generic "ocean breeze" that smells like an airport bathroom.

Carlogne is a car vent diffuser that runs on YOUR cologne. Load the fragrance you already love, charge it with Base No. 1 (our fixative carrier that replaces the alcohol that makes cologne evaporate too fast), clip it to the vent — and your signature scent lasts for weeks, not days.

We leave the fragrance to the professionals — the brands you already love. We make the technology that keeps it alive in a car.

For people who notice.`,

    // Links (keep existing, add any missing)
    links: {
      ...venture.links,
      site: 'https://carlogne.vercel.app',
      siteStatus: 'live',
    },

    // Segments - Idea Stage
    segments: {
      ...venture.segments,

      // The Problem / Elevator Pitch
      pitch: {
        body: `**The Problem**

Your cologne cost $300. Your car smells like $5.

Every car air freshener on the market does the same thing: mask odours with someone else's idea of "fresh." Pine trees, vanilla beans, "new car smell" — generic scents designed for nobody in particular.

But you already have a scent. You chose it carefully. It's part of your identity. Why should your car smell like anything else?

**The Solution**

Carlogne is a premium car vent diffuser system that works with YOUR cologne — not ours.

The device clips invisibly to your vent. You load it with your own fragrance, mixed with our Base No. 1 carrier formula. The carrier replaces the alcohol in cologne (which evaporates in minutes) with a slow-release fixative that makes the same scent last for weeks.

Same scent. Slower physics.

**Why This Works**

Air fresheners try to be everything to everyone. We do one thing: extend the life of the fragrance you already chose. We're not competing with Dior or Tom Ford. We're making their products work better in your car.`,
        happenedAt: today,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPlanned: false,
      },

      // The Spark
      spark: {
        body: `It started with a complaint that wouldn't go away.

I kept buying air fresheners for my car — must have tried twenty different ones over the years. Little trees, vent clips, those gel things. They'd smell okay for a day, then fade into nothing, or worse, turn into that weird chemical smell that gives you a headache.

Meanwhile, I'd put on my cologne in the morning and people would comment on it all day. "What are you wearing?" It was part of how people knew me.

Then one day I'm sitting in my car, surrounded by the fading smell of "Caribbean Breeze" or whatever, and I thought: why am I paying $300 for cologne I love, then covering it up with a $5 tree that smells like chemicals?

Why can't my car just smell like... me?

I started researching why cologne fades so fast. Turns out it's the alcohol — it's designed to evaporate quickly on warm skin. Great for making an entrance, terrible for a hot car.

The chemistry problem was clear: replace the alcohol carrier with something that releases slower. Keep the fragrance molecules, change the delivery mechanism.

Three months of kitchen experiments later, Base No. 1 was born. A fixative carrier that works with any fragrance. My car finally smelled like my cologne — for weeks, not hours.

Some problems are so obvious once you see them. This was one of those.`,
        happenedAt: today,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPlanned: false,
      },

      // Validation
      validation: {
        body: `**The Founders' Batch Strategy**

Before spending money on custom tooling or big inventory, we're validating demand with a lean founders' batch: 100 numbered kits using stock housings.

The approach:
- **100 units only** — numbered, limited edition
- **Stock housing** — honest about what it is, no pretending we have custom moulds yet
- **Pre-order model** — 6-8 week ship time, automatic refund guarantee
- **"How did you hear about us" tracking** — every order tells us which channels work

**Exposure Gates**

We've set hard limits on personal capital at risk:
- ~$300 maximum before first pre-orders
- ~$400 additional for founders' batch production
- ~$1.8k maximum before revenue proves the model

If we can't sell 100 units with this budget, the idea isn't strong enough. Better to learn that with $300 on the line than $30,000.

**What We're Testing**

1. Will people pay for this? (Pre-orders answer this)
2. Which channels work? (Attribution tracking on every order)
3. Does the product actually deliver? (Founders' batch feedback)
4. Do people reorder Base No. 1? (This is the real business — recurring revenue from refills)

The custom tooling, the perfect finishes, the women's line — all of that waits until 100 real customers prove the concept works.`,
        happenedAt: today,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPlanned: false,
      },
    },
  };

  // Update venture
  const { error: updateError } = await supabase
    .from('ventures')
    .update(updates)
    .eq('id', venture.id);

  if (updateError) {
    console.error('❌ Failed to update:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Updated venture basics');
  console.log('✅ Added pitch segment (The Problem)');
  console.log('✅ Added spark segment (The Spark)');
  console.log('✅ Added validation segment');
  console.log('');
  console.log('🔗 View at: https://vibed-hazel.vercel.app/v/carlogne');
}

main().catch(console.error);

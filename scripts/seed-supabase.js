// Seed script for Supabase
// Run with: node scripts/seed-supabase.js

const { createClient } = require('@supabase/supabase-js');
const seedData = require('../data/seed-ventures.json');

const supabaseUrl = 'https://hhhhqgmmnhmxuzavdcqt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaGhxZ21tbmhteHV6YXZkY3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgyMTQxMiwiZXhwIjoyMTAzMzk3NDEyfQ.oU2j4oABYUh44JTHnbREWo4Jaq7QJF7XtO-6Ad4wWMo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log('Starting seed...\n');

  for (let i = 0; i < seedData.founders.length; i++) {
    const founder = seedData.founders[i];
    const venture = seedData.ventures[i];

    console.log(`Creating: ${founder.name} / ${venture.name}`);

    // Check if venture already exists
    const { data: existingVenture } = await supabase
      .from('ventures')
      .select('id')
      .eq('slug', venture.slug)
      .single();

    if (existingVenture) {
      console.log(`  Venture ${venture.slug} already exists, skipping...`);
      continue;
    }

    // Create a dummy auth user for this founder
    const email = `${founder.slug}@demo.vibed.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'demo123456',
      email_confirm: true
    });

    if (authError) {
      // User might already exist
      if (authError.message.includes('already been registered')) {
        // Get existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === email);
        if (existingUser) {
          console.log(`  Auth user exists, using ID: ${existingUser.id}`);
          await createFounderAndVenture(existingUser.id, founder, venture);
        }
      } else {
        console.error(`  Error creating auth user: ${authError.message}`);
      }
      continue;
    }

    console.log(`  Created auth user: ${email}`);
    await createFounderAndVenture(authData.user.id, founder, venture);
  }

  console.log('\nSeed complete!');
}

async function createFounderAndVenture(userId, founder, venture) {
  // Check if founder already exists for this user
  const { data: existingFounder } = await supabase
    .from('founders')
    .select('id')
    .eq('user_id', userId)
    .single();

  let founderId;

  if (existingFounder) {
    founderId = existingFounder.id;
    console.log(`  Founder exists, using ID: ${founderId}`);
  } else {
    // Insert founder
    const { data: newFounder, error: founderError } = await supabase
      .from('founders')
      .insert({
        user_id: userId,
        name: founder.name,
        slug: founder.slug,
        bio: founder.bio,
        location: founder.location,
        links: {}
      })
      .select()
      .single();

    if (founderError) {
      console.error(`  Error creating founder: ${founderError.message}`);
      return;
    }
    founderId = newFounder.id;
    console.log(`  Created founder: ${founder.slug}`);
  }

  // Calculate random stats
  const weekNumber = Math.floor(Math.random() * 20) + 1;
  const streakWeeks = Math.floor(Math.random() * weekNumber);
  const followers = Math.floor(Math.random() * 500) + 10;

  // Insert venture
  const ventureData = {
    slug: venture.slug,
    founder_id: founderId,
    name: venture.name,
    pitch: venture.pitch,
    brand: venture.brand,
    glyph: venture.glyph,
    rung: venture.rung,
    status: 'live',
    problem: venture.problem,
    who: venture.who,
    why: venture.why,
    links: {},
    segments: venture.segments || {},
    counters: {
      followers: followers,
      clips: Math.floor(Math.random() * 10),
      photos: 0,
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
      weekNumber: weekNumber,
      streakWeeks: streakWeeks,
      siteClicks30d: Math.floor(Math.random() * 200),
      trendingScore: Math.floor(Math.random() * 100)
    },
    published_at: new Date().toISOString()
  };

  // Try with industry column first
  let { data: newVenture, error: ventureError } = await supabase
    .from('ventures')
    .insert({ ...ventureData, industry: venture.industry })
    .select()
    .single();

  // If industry column doesn't exist, try without
  if (ventureError && ventureError.message.includes('industry')) {
    console.log('  Industry column not found, inserting without it...');
    const retry = await supabase
      .from('ventures')
      .insert(ventureData)
      .select()
      .single();
    newVenture = retry.data;
    ventureError = retry.error;
  }

  if (ventureError) {
    console.error(`  Error creating venture: ${ventureError.message}`);
    return;
  }

  console.log(`  Created venture: ${venture.slug} (${venture.rung})`);
}

seed().catch(console.error);

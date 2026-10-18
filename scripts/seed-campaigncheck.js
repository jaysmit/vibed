/**
 * Seed script: Create Campaign Check venture under Jake Smithers
 * Run with: node scripts/seed-campaigncheck.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Creating Campaign Check venture under Jake Smithers...\n');

  // 1. Find Jake Smithers founder
  console.log('1. Finding Jake Smithers founder...');
  const { data: founder, error: founderError } = await supabase
    .from('founders')
    .select('*')
    .eq('slug', 'jake-smithers')
    .single();

  if (founderError || !founder) {
    console.error('   Error: Jake Smithers founder not found');
    process.exit(1);
  }
  console.log(`   Found founder ID: ${founder.id}`);

  // 2. Check if venture already exists
  console.log('\n2. Checking for existing venture...');
  const { data: existingVenture } = await supabase
    .from('ventures')
    .select('*')
    .eq('slug', 'campaigncheck')
    .single();

  if (existingVenture) {
    console.log('   Venture already exists at: https://vibed-hazel.vercel.app/v/campaigncheck');
    process.exit(0);
  }

  // 3. Create Campaign Check venture
  console.log('\n3. Creating Campaign Check venture...');
  const { data: venture, error: ventureError } = await supabase
    .from('ventures')
    .insert({
      slug: 'campaigncheck',
      founder_id: founder.id,
      name: 'Campaign Check',
      pitch: 'Find out if your real estate agent is actually marketing your home.',
      tagline: 'Is your agent really selling your home?',
      brand: '#1F3BFF', // Cobalt blue from the site
      glyph: 'search',
      rung: 'building',
      status: 'live',
      country: 'AU',
      categories: ['proptech', 'consumer'],
      links: {
        site: 'https://campaigncheck.vercel.app',
        siteStatus: 'live'
      },
      segments: {
        pitch: {
          body: 'Campaign Check helps home sellers verify if their real estate agent is actually marketing their property. We scan REA, Domain, and social media to show exactly where your listing appears — and where it doesn\'t.',
          happenedAt: '2026-10-01',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        spark: {
          body: 'After hearing too many stories of agents promising premium marketing packages and delivering the bare minimum, I wanted to create a tool that gives sellers transparency. Many sellers pay thousands for marketing but have no way to verify what they\'re getting.',
          happenedAt: '2026-09-15',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        validation: {
          body: 'Spoke with 20 recent home sellers. 85% had no idea where their listing actually appeared online. Several discovered their "premium" listings were missing from major portals entirely. The pain is real.',
          happenedAt: '2026-09-20',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        build: {
          body: 'Built a crawler that scans REA, Domain, Facebook Marketplace, and agent websites. Users enter their address and get a complete audit of where their listing appears, with screenshots and timestamps.',
          happenedAt: '2026-10-02',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      },
      counters: {
        followers: 0,
        clips: 0,
        photos: 0,
        likes: 0,
        comments: 0,
        weekNumber: 1,
        streakWeeks: 1,
        siteClicks30d: 0,
        trendingScore: 0
      },
      published_at: new Date().toISOString()
    })
    .select()
    .single();

  if (ventureError) {
    console.error('   Error:', ventureError.message);
    process.exit(1);
  }
  console.log(`   Venture ID: ${venture.id}`);

  // 4. Create venture_member record
  console.log('\n4. Creating venture membership...');
  const { error: memberError } = await supabase
    .from('venture_members')
    .insert({
      venture_id: venture.id,
      founder_id: founder.id,
      email: 'jake.smithers@trueline.com.au',
      first_name: 'Jake',
      last_name: 'Smithers',
      role: 'founder',
      status: 'accepted',
      is_master: true,
      accepted_at: new Date().toISOString()
    });

  if (memberError) {
    console.error('   Error:', memberError.message);
  } else {
    console.log('   Membership created');
  }

  console.log('\n Done!\n');
  console.log('Venture URL: https://vibed-hazel.vercel.app/v/campaigncheck');
  console.log('Live site: https://campaigncheck.vercel.app');
}

main().catch(console.error);

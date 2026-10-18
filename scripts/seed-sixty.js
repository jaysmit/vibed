/**
 * Seed script: Update Sixty venture with content
 * Run with: node scripts/seed-sixty.js
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
  console.log('Updating Sixty venture...\n');

  // Get founder
  const { data: founder, error: founderError } = await supabase
    .from('founders')
    .select('*')
    .eq('slug', 'jake-smithers-1')
    .single();

  if (founderError) {
    console.error('Error finding founder:', founderError.message);
    process.exit(1);
  }

  console.log(`Found founder: ${founder.name} (ID: ${founder.id})`);

  // Update venture
  const { data: venture, error: ventureError } = await supabase
    .from('ventures')
    .update({
      brand: '#C8321F', // Sixty's red accent color
      glyph: 'clock',
      rung: 'building',
      status: 'live',
      country: 'AU',
      categories: ['ai', 'creator-tools', 'saas'],
      links: {
        site: 'https://sixty-website.vercel.app',
        siteStatus: 'live',
        github: 'https://github.com/jaysmit/sixty'
      },
      segments: {
        pitch: {
          body: 'Sixty turns your startup idea into a 60-second elevator-pitch video. Answer a few questions, and Sixty writes the story, storyboards every second, and voices it — so you can test demand before you build a thing.',
          happenedAt: '2026-09-20',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        spark: {
          body: 'Every founder knows the pain: you have an idea but no product to show. Investors want a pitch video, Kickstarter needs one, and making one yourself takes days and costs thousands. I wanted to fix that — let AI handle the structure, visuals, and voice so founders can validate ideas faster.',
          happenedAt: '2026-08-01',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        validation: {
          body: 'Talked to 50 founders and indie hackers. The pattern was clear: everyone needs a pitch video, nobody wants to make one. The tools out there give you a blank prompt box and hope. Founders need structure — a proven pitch formula, not prompt engineering.',
          happenedAt: '2026-08-15',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        build: {
          body: 'Built the interview system that extracts the story from founders. Created the 6-beat pitch structure (hook, problem, solution, product, proof, ask). Added the visual storyboard editor so you can edit like a document. Integrated AI voices with preview before rendering.',
          happenedAt: '2026-09-01',
          publishedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        gtm: {
          body: 'Positioning Sixty for three audiences: indie hackers validating ideas before building, crowdfunding campaigns needing pitch videos, and startup founders preparing for investor meetings. Pay-per-render model, no subscription — use it when you need it.',
          happenedAt: '2026-09-15',
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
    .eq('slug', 'sixty')
    .select()
    .single();

  if (ventureError) {
    console.error('Error updating venture:', ventureError.message);
    process.exit(1);
  }

  console.log('Venture updated successfully!');

  // Fix venture_member status
  console.log('\nFixing venture membership...');

  const { error: memberError } = await supabase
    .from('venture_members')
    .upsert({
      venture_id: venture.id,
      founder_id: founder.id,
      email: 'jake_smidders@hotmail.com',
      first_name: 'Jake',
      last_name: 'Smithers',
      role: 'founder',
      status: 'accepted',
      is_master: true,
      accepted_at: new Date().toISOString()
    }, {
      onConflict: 'venture_id,founder_id'
    });

  if (memberError) {
    console.error('Error with membership:', memberError.message);
  } else {
    console.log('Membership fixed');
  }

  console.log('\n✓ Done!');
  console.log(`\nVenture URL: https://vibed-hazel.vercel.app/v/sixty`);
  console.log(`Website: https://sixty-website.vercel.app`);
  console.log(`GitHub: https://github.com/jaysmit/sixty`);
}

main().catch(console.error);

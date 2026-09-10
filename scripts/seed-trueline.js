/**
 * Seed script: Create Jake Smithers founder account and Trueline venture
 * Run with: node scripts/seed-trueline.js
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
  console.log('Creating Jake Smithers account and Trueline venture...\n');

  // 1. Create user in Supabase Auth
  const email = 'jake.smithers@trueline.com.au';
  const password = 'Trueline2026!';

  console.log('1. Creating auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Jake Smithers' }
  });

  if (authError) {
    // Check if user already exists
    if (authError.message.includes('already been registered')) {
      console.log('   User already exists, fetching...');
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        authData.user = existingUser;
      } else {
        console.error('   Error:', authError.message);
        process.exit(1);
      }
    } else {
      console.error('   Error:', authError.message);
      process.exit(1);
    }
  }

  const userId = authData.user.id;
  console.log(`   User ID: ${userId}`);

  // 2. Create founder profile
  console.log('\n2. Creating founder profile...');

  // Check if founder exists
  const { data: existingFounder } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', userId)
    .single();

  let founderId;
  if (existingFounder) {
    console.log('   Founder already exists');
    founderId = existingFounder.id;
  } else {
    const { data: founder, error: founderError } = await supabase
      .from('founders')
      .insert({
        user_id: userId,
        name: 'Jake Smithers',
        slug: 'jake-smithers',
        bio: 'Building Trueline — verified living expenses for mortgage brokers. Making compliance easy.',
        location: 'Melbourne, Australia',
        links: {
          x: 'jakesmithers',
          linkedin: 'jakesmithers'
        }
      })
      .select()
      .single();

    if (founderError) {
      console.error('   Error:', founderError.message);
      process.exit(1);
    }
    founderId = founder.id;
  }
  console.log(`   Founder ID: ${founderId}`);

  // 3. Create Trueline venture
  console.log('\n3. Creating Trueline venture...');

  // Check if venture exists
  const { data: existingVenture } = await supabase
    .from('ventures')
    .select('*')
    .eq('slug', 'trueline')
    .single();

  let ventureId;
  if (existingVenture) {
    console.log('   Venture already exists');
    ventureId = existingVenture.id;
  } else {
    const { data: venture, error: ventureError } = await supabase
      .from('ventures')
      .insert({
        slug: 'trueline',
        founder_id: founderId,
        name: 'Trueline',
        pitch: 'Verified living expenses for mortgage brokers. Making audit compliance effortless.',
        brand: '#1F3BC4', // Trueline's accent blue
        glyph: 'check',
        rung: 'building',
        status: 'live',
        country: 'AU',
        categories: ['fintech', 'saas'],
        links: {
          site: 'https://trueline-rouge.vercel.app',
          siteStatus: 'live'
        },
        segments: {
          pitch: {
            body: 'Trueline helps mortgage brokers verify client living expenses automatically. We scan bank statements, categorize expenses, and generate audit-ready reports in seconds — not hours.',
            happenedAt: '2026-07-15',
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          spark: {
            body: 'After 5 years as a mortgage broker, I spent countless hours manually reviewing client expenses for compliance. Every loan file needed verified living expenses, and the process was painful. I knew there had to be a better way.',
            happenedAt: '2026-06-01',
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          validation: {
            body: 'Interviewed 30 mortgage brokers across Australia. Every single one complained about expense verification. The average broker spends 2-3 hours per client on this. Compliance teams reject 40% of expense summaries on first review.',
            happenedAt: '2026-06-20',
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          build: {
            body: 'Built the core engine using AI to categorize transactions. Integrated with major Australian banks via Open Banking APIs. Created a broker dashboard with drag-and-drop statement upload.',
            happenedAt: '2026-08-01',
            publishedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        counters: {
          followers: 12,
          clips: 0,
          photos: 0,
          likes: 8,
          comments: 3,
          weekNumber: 8,
          streakWeeks: 6,
          siteClicks30d: 47,
          trendingScore: 85
        },
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (ventureError) {
      console.error('   Error:', ventureError.message);
      process.exit(1);
    }
    ventureId = venture.id;
  }
  console.log(`   Venture ID: ${ventureId}`);

  // 4. Create venture_member record (master owner)
  console.log('\n4. Creating venture membership...');

  const { data: existingMember } = await supabase
    .from('venture_members')
    .select('*')
    .eq('venture_id', ventureId)
    .eq('founder_id', founderId)
    .single();

  if (existingMember) {
    console.log('   Membership already exists');
  } else {
    const { error: memberError } = await supabase
      .from('venture_members')
      .insert({
        venture_id: ventureId,
        founder_id: founderId,
        email: email,
        first_name: 'Jake',
        last_name: 'Smithers',
        role: 'founder',
        status: 'accepted',
        is_master: true,
        accepted_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('   Error:', memberError.message);
      // Non-fatal, continue
    } else {
      console.log('   Membership created');
    }
  }

  console.log('\n✓ Done!\n');
  console.log('Login credentials:');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`\nVenture URL: https://vibed-hazel.vercel.app/v/trueline`);
}

main().catch(console.error);

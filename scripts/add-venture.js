#!/usr/bin/env node
/**
 * Add a venture to a user's account
 * Usage: node scripts/add-venture.js <email> <venture-name> [pitch]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function generateBrandColor() {
  const hues = [
    '#1F6F5C', '#B4621A', '#5A2EC4', '#1A5C8A', '#9A2A55',
    '#3D5A2B', '#8A5A1A', '#4A4A8A', '#2A6B8A', '#6B2A5A',
  ];
  return hues[Math.floor(Math.random() * hues.length)];
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/add-venture.js <email> <venture-name> [pitch]');
    process.exit(1);
  }

  const [email, ventureName, pitch = ''] = args;

  console.log(`\n🔍 Looking up user: ${email}`);

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('❌ Failed to list users:', userError.message);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === email);
  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.id}`);

  // Find or create founder profile
  let { data: founder, error: founderError } = await supabase
    .from('founders')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (founderError && founderError.code !== 'PGRST116') {
    console.error('❌ Failed to query founders:', founderError.message);
    process.exit(1);
  }

  if (!founder) {
    console.log('📝 Creating founder profile...');
    const founderSlug = generateSlug(user.user_metadata?.name || email.split('@')[0]);

    const { data: newFounder, error: createError } = await supabase
      .from('founders')
      .insert({
        user_id: user.id,
        name: user.user_metadata?.name || email.split('@')[0],
        slug: founderSlug,
        bio: '',
        location: '',
        links: {},
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create founder:', createError.message);
      process.exit(1);
    }
    founder = newFounder;
    console.log(`✅ Created founder: ${founder.slug}`);
  } else {
    console.log(`✅ Found founder: ${founder.name} (${founder.slug})`);
  }

  // Check if venture already exists
  const ventureBaseSlug = generateSlug(ventureName);
  let ventureSlug = ventureBaseSlug;
  let counter = 1;

  while (true) {
    const { data: existing } = await supabase
      .from('ventures')
      .select('id')
      .eq('slug', ventureSlug)
      .single();

    if (!existing) break;
    ventureSlug = `${ventureBaseSlug}-${counter}`;
    counter++;
  }

  console.log(`\n📝 Creating venture: ${ventureName} (slug: ${ventureSlug})`);

  // Create venture
  const { data: venture, error: ventureError } = await supabase
    .from('ventures')
    .insert({
      slug: ventureSlug,
      founder_id: founder.id,
      name: ventureName,
      pitch: pitch,
      brand: generateBrandColor(),
      glyph: 'wave',
      rung: 'idea',
      status: 'draft',
      links: {},
      segments: {},
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
    })
    .select()
    .single();

  if (ventureError) {
    console.error('❌ Failed to create venture:', ventureError.message);
    process.exit(1);
  }

  // Add venture_members entry for the founder
  const { error: memberError } = await supabase
    .from('venture_members')
    .insert({
      venture_id: venture.id,
      founder_id: founder.id,
      role: 'founder',
      status: 'active',
      is_master: true,
    });

  if (memberError) {
    console.log('⚠️ Could not add venture member (may not be required):', memberError.message);
  }

  console.log(`\n✅ SUCCESS!`);
  console.log(`\n🎉 Venture created:`);
  console.log(`   Name: ${venture.name}`);
  console.log(`   Slug: ${venture.slug}`);
  console.log(`   URL: https://vibed-hazel.vercel.app/v/${venture.slug}`);
  console.log(`   Status: ${venture.status} (draft)`);
  console.log(`\n📝 To publish, edit and complete the venture at:`);
  console.log(`   https://vibed-hazel.vercel.app/v/${venture.slug}/edit`);
}

main().catch(console.error);

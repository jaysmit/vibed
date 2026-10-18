// Script to move GameHub venture to Jake's account
// Run with: node scripts/move-gamehub.js

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

async function moveGameHub() {
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

  // Find Jake's founder record
  const { data: founder, error: founderError } = await supabase
    .from('founders')
    .select('id, name')
    .eq('user_id', jake.id)
    .single();

  if (founderError || !founder) {
    console.error('Could not find founder record for Jake:', founderError);
    process.exit(1);
  }

  console.log('Jake\'s founder ID:', founder.id, '(' + founder.name + ')');

  // Find GameHub venture
  const { data: gamehub, error: gamehubError } = await supabase
    .from('ventures')
    .select('id, name, slug, founder_id')
    .or('name.ilike.%gamehub%,name.ilike.%trueline%')
    .single();

  if (gamehubError) {
    // Try searching by slug
    const { data: bySlug, error: slugError } = await supabase
      .from('ventures')
      .select('id, name, slug, founder_id')
      .ilike('slug', '%gamehub%')
      .single();

    if (slugError || !bySlug) {
      console.error('Could not find GameHub venture');
      console.log('Listing all ventures...');

      const { data: allVentures } = await supabase
        .from('ventures')
        .select('id, name, slug, founder_id');

      console.log('Ventures in database:');
      allVentures?.forEach(v => console.log(`  - ${v.name} (${v.slug})`));
      process.exit(1);
    }

    console.log('Found GameHub by slug:', bySlug.name, '- ID:', bySlug.id);

    if (bySlug.founder_id === founder.id) {
      console.log('GameHub is already under Jake\'s account!');
      console.log('View at: https://vibed-hazel.vercel.app/v/' + bySlug.slug);
      return;
    }

    // Update the venture
    const { error: updateError } = await supabase
      .from('ventures')
      .update({ founder_id: founder.id })
      .eq('id', bySlug.id);

    if (updateError) {
      console.error('Failed to update venture:', updateError);
      process.exit(1);
    }

    console.log('Moved GameHub to Jake\'s account!');
    console.log('View at: https://vibed-hazel.vercel.app/v/' + bySlug.slug);
    return;
  }

  console.log('Found GameHub:', gamehub.name, '- ID:', gamehub.id);

  if (gamehub.founder_id === founder.id) {
    console.log('GameHub is already under Jake\'s account!');
    console.log('View at: https://vibed-hazel.vercel.app/v/' + gamehub.slug);
    return;
  }

  // Update the venture's founder_id
  const { error: updateError } = await supabase
    .from('ventures')
    .update({ founder_id: founder.id })
    .eq('id', gamehub.id);

  if (updateError) {
    console.error('Failed to update venture:', updateError);
    process.exit(1);
  }

  console.log('Moved GameHub to Jake\'s account!');
  console.log('View at: https://vibed-hazel.vercel.app/v/' + gamehub.slug);
}

moveGameHub().catch(console.error);

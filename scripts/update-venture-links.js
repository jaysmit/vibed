#!/usr/bin/env node
/**
 * Update venture links
 * Usage: node scripts/update-venture-links.js <venture-slug> <site-url>
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/update-venture-links.js <venture-slug> <site-url>');
    process.exit(1);
  }

  const [slug, siteUrl] = args;

  // Get venture
  const { data: venture, error } = await supabase
    .from('ventures')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !venture) {
    console.error('❌ Venture not found:', slug);
    process.exit(1);
  }

  // Update links
  const links = venture.links || {};
  links.site = siteUrl;
  links.siteStatus = 'live';

  const { error: updateError } = await supabase
    .from('ventures')
    .update({ links })
    .eq('id', venture.id);

  if (updateError) {
    console.error('❌ Failed to update:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Updated ${slug} with site: ${siteUrl}`);
}

main().catch(console.error);

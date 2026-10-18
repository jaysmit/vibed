#!/usr/bin/env node
/**
 * Set venture cover image from a file
 * Usage: node scripts/set-venture-cover.js <venture-slug> <image-file-or-dataurl>
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node scripts/set-venture-cover.js <venture-slug> <image-file-or-dataurl-file>');
    process.exit(1);
  }

  const [slug, imagePath] = args;

  // Read the image/dataurl
  let imageData;
  const fileContent = fs.readFileSync(imagePath, 'utf8').trim();

  if (fileContent.startsWith('data:image')) {
    // It's already a data URL
    imageData = fileContent;
  } else {
    // It's an image file, convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    imageData = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  }

  console.log(`📷 Image data length: ${imageData.length} chars`);

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

  console.log(`✅ Found venture: ${venture.name}`);

  // Update links with poster
  const links = venture.links || {};
  links.poster = imageData;

  const { error: updateError } = await supabase
    .from('ventures')
    .update({ links })
    .eq('id', venture.id);

  if (updateError) {
    console.error('❌ Failed to update:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Set cover image for ${slug}`);
  console.log(`🔗 View at: https://vibed-hazel.vercel.app/v/${slug}`);
}

main().catch(console.error);

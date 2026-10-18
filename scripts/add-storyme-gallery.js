#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const storyMeDir = path.join('..', 'custom stories', 'StoryMe_images');

async function imageToBase64(inputPath, width = 1200) {
  const buffer = await sharp(inputPath)
    .resize(width, null, { withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return 'data:image/jpeg;base64,' + buffer.toString('base64');
}

async function main() {
  // Get venture
  const { data: venture, error } = await supabase
    .from('ventures')
    .select('id, links')
    .eq('slug', 'storyme')
    .single();

  if (error || !venture) {
    console.error('Venture not found');
    process.exit(1);
  }

  console.log('Found venture:', venture.id);

  // Images to add to gallery (best showcase images)
  const galleryImages = [
    { file: 'styles billboard.png', desc: 'Style showcase - multiple art styles' },
    { file: 'style-enchanted-glow.png', desc: 'Enchanted glow style' },
    { file: 'style-watercolour.png', desc: 'Watercolour dream style' },
    { file: 'style-classic-fable.png', desc: 'Classic fable style' },
    { file: 'style-clay.png', desc: 'Clay stop-motion style' },
    { file: 'lego.png', desc: 'Brick world style' },
    { file: 'purchase - bundle.png', desc: 'Treasure chest gift set' },
    { file: 'crew - hero image better.png', desc: 'Hero image with characters' },
  ];

  const gallery = [];

  for (const img of galleryImages) {
    const inputPath = path.join(storyMeDir, img.file);
    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping ${img.file} - not found`);
      continue;
    }

    console.log(`Processing ${img.file}...`);
    const dataUrl = await imageToBase64(inputPath);
    gallery.push(dataUrl);
    console.log(`  Added (${Math.round(dataUrl.length/1024)}KB)`);
  }

  // Update venture links with gallery
  const links = venture.links || {};

  // Keep poster, add gallery
  if (gallery.length > 0) {
    // First image becomes poster if no poster exists
    if (!links.poster) {
      links.poster = gallery[0];
      console.log('Set first image as poster');
    }
    links.gallery = gallery;
  }

  const { error: updateError } = await supabase
    .from('ventures')
    .update({ links })
    .eq('id', venture.id);

  if (updateError) {
    console.error('Failed to update:', updateError.message);
    process.exit(1);
  }

  console.log(`\n✅ Added ${gallery.length} images to gallery`);
  console.log('View at: https://vibed-hazel.vercel.app/v/storyme');
}

main().catch(console.error);

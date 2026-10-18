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

async function imageToBase64(inputPath, width = 800) {
  const buffer = await sharp(inputPath)
    .resize(width, null, { withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return 'data:image/jpeg;base64,' + buffer.toString('base64');
}

async function main() {
  const { data: venture } = await supabase
    .from('ventures')
    .select('id, links')
    .eq('slug', 'storyme')
    .single();

  if (!venture) {
    console.error('Venture not found');
    process.exit(1);
  }

  const links = venture.links || {};
  const gallery = links.gallery || [];

  // Add crew images
  const crewImages = [
    path.join('..', 'custom stories', 'StoryMe_images', 'crew - boy.png'),
    path.join('..', 'custom stories', 'StoryMe_images', 'crew - grandma.png'),
    path.join('..', 'custom stories', 'StoryMe_images', 'crew - younger boy.png')
  ];

  for (const img of crewImages) {
    if (fs.existsSync(img)) {
      console.log('Adding:', path.basename(img));
      const dataUrl = await imageToBase64(img, 600);
      gallery.push(dataUrl);
      console.log('  Size:', Math.round(dataUrl.length / 1024), 'KB');
    } else {
      console.log('Not found:', img);
    }
  }

  links.gallery = gallery;

  const { error } = await supabase
    .from('ventures')
    .update({ links })
    .eq('id', venture.id);

  if (error) {
    console.error('Update failed:', error.message);
  } else {
    console.log('\nGallery now has', gallery.length, 'images');
  }
}

main().catch(console.error);

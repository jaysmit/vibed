// Update ventures and founders with Unsplash images (stored in links JSON)
// Run with: node scripts/update-images.js

const { createClient } = require('@supabase/supabase-js');
const seedData = require('../data/seed-ventures.json');

const supabaseUrl = 'https://hhhhqgmmnhmxuzavdcqt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaGhxZ21tbmhteHV6YXZkY3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzgyMTQxMiwiZXhwIjoyMTAzMzk3NDEyfQ.oU2j4oABYUh44JTHnbREWo4Jaq7QJF7XtO-6Ad4wWMo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateImages() {
  console.log('Updating images in links JSON...\n');

  for (let i = 0; i < seedData.founders.length; i++) {
    const founder = seedData.founders[i];
    const venture = seedData.ventures[i];

    console.log(`Updating: ${founder.name} / ${venture.name}`);

    // Get current founder links and add avatar
    const { data: founderData } = await supabase
      .from('founders')
      .select('links')
      .eq('slug', founder.slug)
      .single();

    if (founderData) {
      const newLinks = { ...(founderData.links || {}), avatar: founder.avatar };
      const { error: founderError } = await supabase
        .from('founders')
        .update({ links: newLinks })
        .eq('slug', founder.slug);

      if (founderError) {
        console.error(`  Error updating founder: ${founderError.message}`);
      } else {
        console.log(`  Updated founder avatar in links`);
      }
    }

    // Get current venture links and add poster
    const { data: ventureData } = await supabase
      .from('ventures')
      .select('links')
      .eq('slug', venture.slug)
      .single();

    if (ventureData) {
      const newLinks = { ...(ventureData.links || {}), poster: venture.poster };
      const { error: ventureError } = await supabase
        .from('ventures')
        .update({ links: newLinks })
        .eq('slug', venture.slug);

      if (ventureError) {
        console.error(`  Error updating venture: ${ventureError.message}`);
      } else {
        console.log(`  Updated venture poster in links`);
      }
    }
  }

  console.log('\nDone!');
}

updateImages().catch(console.error);

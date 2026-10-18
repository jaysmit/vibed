/**
 * Add creative taglines to all ventures
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Creative taglines - catchy phrases to capture curiosity
const TAGLINES = {
  'sixty': 'Your idea, sold in sixty seconds.',
  'storyme': 'Every child deserves to be the hero.',
  'carlogne': "The 'new car' smell was never your signature scent.",
  'inner-verse': 'The answers you seek are already inside you.',
  'what-s-next': 'Your next adventure is one click away.',
  'trueline': "Because trust shouldn't take hours to verify.",
  'gamehub': 'Your friends are waiting. Game on.',
};

async function main() {
  console.log('Adding taglines to ventures...\n');

  for (const [slug, tagline] of Object.entries(TAGLINES)) {
    const { data, error } = await supabase
      .from('ventures')
      .update({ tagline })
      .eq('slug', slug)
      .select('name, tagline')
      .single();

    if (error) {
      console.log(`❌ ${slug}: ${error.message}`);
    } else if (data) {
      console.log(`✅ ${data.name}: "${data.tagline}"`);
    } else {
      console.log(`⚠️ ${slug}: Not found`);
    }
  }

  console.log('\n✓ Done! View at https://vibed-hazel.vercel.app');
}

main().catch(console.error);

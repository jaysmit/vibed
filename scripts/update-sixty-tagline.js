/**
 * Update Sixty venture with tagline
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await supabase
    .from('ventures')
    .update({ tagline: 'Your idea, sold in sixty seconds.' })
    .eq('slug', 'sixty')
    .select()
    .single();

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('Updated Sixty tagline:', data.tagline);
  console.log('View at: https://vibed-hazel.vercel.app/v/sixty');
}

main().catch(console.error);

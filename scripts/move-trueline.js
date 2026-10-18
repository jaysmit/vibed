// Script to move Trueline venture to Jake's account
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function moveTrueline() {
  const founderId = 'eb0f9719-c8b0-46b7-b81a-281daa86e3e9'; // Jake's founder ID

  const { data: trueline, error } = await supabase
    .from('ventures')
    .select('id, name, slug, founder_id')
    .ilike('slug', '%trueline%')
    .single();

  if (error || !trueline) {
    console.log('Could not find Trueline:', error?.message);
    return;
  }

  console.log('Found:', trueline.name, '- ID:', trueline.id);

  if (trueline.founder_id === founderId) {
    console.log('Trueline is already under Jake\'s account!');
    console.log('View at: https://vibed-hazel.vercel.app/v/' + trueline.slug);
    return;
  }

  const { error: updateError } = await supabase
    .from('ventures')
    .update({ founder_id: founderId })
    .eq('id', trueline.id);

  if (updateError) {
    console.log('Failed:', updateError.message);
    return;
  }

  console.log('Moved Trueline to Jake\'s account!');
  console.log('View at: https://vibed-hazel.vercel.app/v/' + trueline.slug);
}

moveTrueline();

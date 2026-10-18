#!/usr/bin/env node
/**
 * Migration script: Rename 'scale' segment to 'whatbroke'
 *
 * This script copies any existing 'scale' segment data to the 'whatbroke' key
 * in the segments JSONB column. It preserves the original 'scale' data as a backup.
 *
 * Run with: node scripts/migrate-scale-to-whatbroke.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('Starting migration: scale → whatbroke\n');

  // Get all ventures that have a 'scale' segment
  const { data: ventures, error: fetchError } = await supabase
    .from('ventures')
    .select('id, name, segments')
    .not('segments', 'is', null);

  if (fetchError) {
    console.error('Failed to fetch ventures:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${ventures.length} ventures with segments\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const venture of ventures) {
    const segments = venture.segments || {};

    // Check if venture has 'scale' segment
    if (!segments.scale) {
      continue;
    }

    // Check if 'whatbroke' already exists
    if (segments.whatbroke) {
      console.log(`⏭️  ${venture.name}: 'whatbroke' already exists, skipping`);
      skippedCount++;
      continue;
    }

    // Copy scale data to whatbroke
    const updatedSegments = {
      ...segments,
      whatbroke: segments.scale,
      // Keep 'scale' as backup, prefixed with underscore
      _scale_backup: segments.scale,
    };

    // Remove the original 'scale' key
    delete updatedSegments.scale;

    const { error: updateError } = await supabase
      .from('ventures')
      .update({ segments: updatedSegments })
      .eq('id', venture.id);

    if (updateError) {
      console.error(`❌ ${venture.name}: Failed to update -`, updateError.message);
      errorCount++;
    } else {
      console.log(`✅ ${venture.name}: Migrated 'scale' → 'whatbroke'`);
      migratedCount++;
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`Migrated: ${migratedCount}`);
  console.log(`Skipped (already has whatbroke): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('Done!\n');
}

migrate().catch(console.error);

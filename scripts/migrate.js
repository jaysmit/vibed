#!/usr/bin/env node
/**
 * Database migration runner
 * Usage: node scripts/migrate.js [migration-file.sql]
 *
 * Requires SUPABASE_ACCESS_TOKEN in .env.local
 * Get it from: https://supabase.com/dashboard/account/tokens
 */

const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

// Load env
require('dotenv').config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'hhhhqgmmnhmxuzavdcqt';

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not found in .env.local');
  console.error('');
  console.error('Get it from: https://supabase.com/dashboard/account/tokens');
  console.error('');
  console.error('Add to .env.local:');
  console.error('  SUPABASE_ACCESS_TOKEN=sbp_xxxxx...');
  process.exit(1);
}

async function runMigration(sqlFile) {
  console.log(`🚀 Running migration: ${sqlFile}`);

  try {
    // Use Supabase CLI with access token
    execSync(
      `npx supabase db query --linked --project-ref ${PROJECT_REF} -f "${sqlFile}"`,
      {
        env: { ...process.env, SUPABASE_ACCESS_TOKEN: ACCESS_TOKEN },
        stdio: 'inherit'
      }
    );
    console.log(`✅ Migration complete!`);
  } catch (err) {
    console.error(`❌ Migration failed`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run all pending migrations
    const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      await runMigration(join(migrationsDir, file));
    }
  } else {
    // Run specific migration
    await runMigration(args[0]);
  }
}

main();

/**
 * Simple script to apply migrations via Supabase Studio SQL Editor instructions
 * Since direct SQL execution via API is limited, this provides the SQL to execute
 */

const fs = require('fs');
const path = require('path');

console.log('📋 Multi-Tenancy Migrations Application Guide\n');
console.log('Since Supabase CLI has limitations for direct SQL execution,');
console.log('please apply these migrations via Supabase Studio SQL Editor:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const migrations = [
  {
    file: path.join(__dirname, '../supabase/migrations/20260128000000_create_organizations_and_subscriptions.sql'),
    name: 'Create Organizations and Subscriptions',
  },
  {
    file: path.join(__dirname, '../supabase/migrations/20260128000001_extend_rls_for_multitenancy.sql'),
    name: 'Extend RLS for Multi-Tenancy',
  },
];

for (const migration of migrations) {
  if (fs.existsSync(migration.file)) {
    console.log(`\n📄 Migration: ${migration.name}`);
    console.log(`   File: ${path.basename(migration.file)}`);
    console.log(`   ──────────────────────────────────────────────────────────`);
    const sql = fs.readFileSync(migration.file, 'utf8');
    console.log(sql);
    console.log(`\n   ──────────────────────────────────────────────────────────\n`);
  }
}

console.log('\n💡 Instructions:');
console.log('   1. Open Supabase Studio: http://127.0.0.1:54323');
console.log('   2. Navigate to SQL Editor');
console.log('   3. Copy and paste each migration SQL above');
console.log('   4. Click "Run" to execute');
console.log('   5. Verify tables were created in Table Editor\n');

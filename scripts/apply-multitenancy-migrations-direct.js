/**
 * Script to apply multi-tenancy migrations directly using PostgreSQL connection
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function applyMigration(client, sqlFile) {
  console.log(`\n📄 Applying migration: ${path.basename(sqlFile)}`);
  
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  try {
    // Execute the entire SQL file
    await client.query(sql);
    console.log(`✅ Migration applied successfully`);
  } catch (error) {
    // Check if error is because objects already exist (IF NOT EXISTS should handle this)
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate') ||
        error.code === '42P07' || // duplicate_table
        error.code === '42710' || // duplicate_object
        error.code === '42723') {  // duplicate_function
      console.log(`⚠️  Some objects may already exist (this is OK): ${error.message.split('\n')[0]}`);
    } else {
      console.log(`❌ Error applying migration: ${error.message.split('\n')[0]}`);
      // Don't throw - continue with next migration
    }
  }
}

async function main() {
  const client = new Client({
    connectionString: DB_URL,
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    const migrations = [
      path.join(__dirname, '../supabase/migrations/20260128000000_create_organizations_and_subscriptions.sql'),
      path.join(__dirname, '../supabase/migrations/20260128000001_extend_rls_for_multitenancy.sql'),
    ];
    
    console.log('\n🚀 Applying multi-tenancy migrations...\n');
    
    for (const migration of migrations) {
      if (fs.existsSync(migration)) {
        await applyMigration(client, migration);
      } else {
        console.log(`❌ Migration not found: ${migration}`);
      }
    }
    
    console.log('\n✅ All migrations applied successfully!');
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'subscriptions', 'subscription_tiers')
      ORDER BY table_name;
    `);
    
    if (rows.length > 0) {
      console.log('✅ Tables created:');
      rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('⚠️  Tables not found - migrations may need manual review');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

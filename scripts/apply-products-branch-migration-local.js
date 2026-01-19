#!/usr/bin/env node

/**
 * Script to apply products branch_id migration to LOCAL Supabase database
 * 
 * Usage:
 *   node scripts/apply-products-branch-migration-local.js
 * 
 * This script connects directly to the local Supabase instance.
 * 
 * Environment Variables (recommended):
 *   - SUPABASE_SERVICE_ROLE_KEY: Service role key from local Supabase
 * 
 * To get your local Supabase service role key:
 *   1. Run: npm run supabase:status
 *   2. Copy the "service_role key" value
 *   3. Add it to your .env.local file as SUPABASE_SERVICE_ROLE_KEY
 * 
 * The SUPABASE_SERVICE_ROLE_KEY is required for security best practices.
 * Get it by running: npm run supabase:status
 */

require('dotenv').config({ path: '.env.local' })

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

async function applyMigrations() {
  // Use local Supabase connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  
  // Get service role key from environment variable (required for security best practices)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required')
    console.error('\nTo get your local Supabase service role key:')
    console.error('  1. Run: npm run supabase:status')
    console.error('  2. Copy the "service_role key" value')
    console.error('  3. Add it to your .env.local file:')
    console.error('     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here')
    console.error('\nThis ensures credentials are not hardcoded in the repository.')
    process.exit(1)
  }

  console.log('📦 Loading migration file...')
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251217000000_add_branch_id_to_products.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: Migration file not found at ${migrationPath}`)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('🔌 Connecting to local Supabase...')
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  })

  console.log('🚀 Executing migrations...')
  
  try {
    // Split the SQL into individual statements
    // We need to handle multi-line statements properly
    const statements = migrationSQL
      .split(/;\s*(?=\n|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/))

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim().length === 0) continue
      
      // Skip comment-only lines
      if (statement.match(/^--/)) continue
      
      try {
        // Execute using RPC if available, otherwise use direct query
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          // Check if it's a "function not found" error - we'll need to use a different approach
          if (error.message.includes('Could not find the function')) {
            console.log(`  ⚠️  RPC not available, trying alternative method for statement ${i + 1}...`)
            
            // Try using the REST API directly
            try {
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': serviceRoleKey,
                  'Authorization': `Bearer ${serviceRoleKey}`
                },
                body: JSON.stringify({ sql: statement + ';' })
              })

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || response.statusText)
              }
              
              console.log(`  ✅ Executed statement ${i + 1}: ${statement.substring(0, 60)}...`)
              successCount++
            } catch (fetchErr) {
              // If RPC doesn't work, we need to use psql or Supabase Studio
              console.error(`  ❌ Cannot execute statement ${i + 1} automatically`)
              console.error(`     Statement: ${statement.substring(0, 100)}...`)
              console.error(`     Error: ${fetchErr.message}`)
              console.error(`\n💡 Please execute this migration manually in Supabase Studio:`)
              console.error(`    1. Open: http://127.0.0.1:54323 (Local Supabase Studio)`)
              console.error(`    2. Go to SQL Editor`)
              console.error(`    3. Copy the entire file: ${migrationPath}`)
              console.error(`    4. Paste and execute`)
              errorCount++
            }
          } else if (error.message.includes('already exists') || 
                     error.message.includes('does not exist') ||
                     error.message.includes('duplicate') ||
                     error.message.includes('IF NOT EXISTS')) {
            console.log(`  ⚠️  Skipped (already applied): ${statement.substring(0, 60)}...`)
            successCount++
          } else {
            console.error(`  ❌ Error in statement ${i + 1}: ${error.message}`)
            console.error(`     Statement: ${statement.substring(0, 100)}...`)
            errorCount++
          }
        } else {
          console.log(`  ✅ Executed statement ${i + 1}: ${statement.substring(0, 60)}...`)
          successCount++
        }
      } catch (err) {
        console.error(`  ❌ Failed to execute statement ${i + 1}: ${err.message}`)
        errorCount++
      }
    }

    if (errorCount > 0 && successCount === 0) {
      console.log('\n❌ Migration failed. Please execute manually in Supabase Studio:')
      console.log('   1. Open: http://127.0.0.1:54323')
      console.log('   2. Go to SQL Editor')
      console.log(`   3. Copy contents of: ${migrationPath}`)
      console.log('   4. Paste and execute')
      process.exit(1)
    }

    console.log('\n✅ Migration completed!')
    console.log(`   Success: ${successCount} statements`)
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} statements`)
    }

    // Verify column was added
    console.log('\n🔍 Verifying column...')
    const { data, error: verifyError } = await supabase
      .from('products')
      .select('branch_id')
      .limit(1)

    if (verifyError) {
      if (verifyError.code === '42703') {
        console.error('❌ Column still not found. Please run the SQL manually in Supabase Studio.')
        console.error('   Open: http://127.0.0.1:54323')
        console.error(`   File location: ${migrationPath}`)
        process.exit(1)
      } else {
        // Other errors might be OK (like no rows)
        console.log('⚠️  Verification query returned:', verifyError.message)
        console.log('   This might be OK if the table is empty. Please verify manually.')
      }
    } else {
      console.log('✅ Column verified successfully!')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('\n💡 Alternative: Run the SQL manually in Supabase Studio')
    console.error('   1. Open: http://127.0.0.1:54323')
    console.error(`   2. Copy the contents of: ${migrationPath}`)
    console.error('   3. Paste and execute')
    process.exit(1)
  }
}

applyMigrations().catch(console.error)

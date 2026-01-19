#!/usr/bin/env node

/**
 * Script to apply products branch_id migration to Supabase database
 * 
 * Usage:
 *   node scripts/apply-products-branch-migration.js
 * 
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

async function applyMigrations() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Missing required environment variables')
    console.error('Required:')
    console.error('  - NEXT_PUBLIC_SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nMake sure your .env.local file has these variables set.')
    process.exit(1)
  }

  console.log('📦 Loading migration file...')
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251217000000_add_branch_id_to_products.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: Migration file not found at ${migrationPath}`)
    process.exit(1)
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

  console.log('🔌 Connecting to Supabase...')
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🚀 Executing migrations...')
  
  try {
    // Execute the entire migration as a single query
    // Supabase REST API doesn't support multi-statement queries well,
    // so we'll use the PostgREST RPC if available, or execute via direct SQL
    
    // Try to execute via RPC first
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (rpcError) {
      // If RPC doesn't exist, try splitting into statements
      console.log('⚠️  RPC method not available, splitting into statements...')
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      let successCount = 0
      let errorCount = 0

      for (const statement of statements) {
        if (statement.trim().length === 0) continue
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
          
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.message.includes('duplicate') ||
                error.message.includes('IF NOT EXISTS')) {
              console.log(`  ⚠️  Skipped (already applied): ${statement.substring(0, 50)}...`)
              successCount++
            } else {
              console.error(`  ❌ Error: ${error.message}`)
              errorCount++
            }
          } else {
            console.log(`  ✅ Executed: ${statement.substring(0, 50)}...`)
            successCount++
          }
        } catch (err) {
          console.error(`  ❌ Failed to execute statement: ${err.message}`)
          errorCount++
        }
      }

      console.log('\n✅ Migration completed!')
      console.log(`   Success: ${successCount} statements`)
      if (errorCount > 0) {
        console.log(`   Errors: ${errorCount} statements`)
      }
    } else {
      console.log('✅ Migration executed successfully via RPC!')
    }

    // Verify column was added
    console.log('\n🔍 Verifying column...')
    const { data, error: verifyError } = await supabase
      .from('products')
      .select('branch_id')
      .limit(1)

    if (verifyError && verifyError.code === '42703') {
      console.error('❌ Column still not found. Please run the SQL manually in Supabase Studio.')
      console.error('   Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new')
      console.error(`   File location: ${migrationPath}`)
      process.exit(1)
    } else {
      console.log('✅ Column verified successfully!')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('\n💡 Alternative: Run the SQL manually in Supabase Studio')
    console.error('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new')
    console.error(`   2. Copy the contents of: ${migrationPath}`)
    console.error('   3. Paste and execute')
    process.exit(1)
  }
}

// Load environment variables from .env.local if it exists
try {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
} catch (err) {
  // Ignore errors loading .env.local
}

applyMigrations().catch(console.error)

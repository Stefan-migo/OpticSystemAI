#!/usr/bin/env node

/**
 * Script to apply chat migrations to Supabase database
 * 
 * Usage:
 *   node scripts/apply-chat-migrations.js
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
  const migrationPath = path.join(__dirname, 'apply-chat-migrations.sql')
  
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
    // Split the SQL into individual statements
    // Remove comments and empty lines, then split by semicolons
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    let successCount = 0
    let errorCount = 0

    for (const statement of statements) {
      if (statement.trim().length === 0) continue
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate')) {
            console.log(`  ⚠️  Skipped (already applied): ${statement.substring(0, 50)}...`)
          } else {
            console.error(`  ❌ Error: ${error.message}`)
            errorCount++
          }
        } else {
          successCount++
        }
      } catch (err) {
        // Try direct SQL execution via REST API
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ sql: statement })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            if (errorData.message?.includes('already exists') || 
                errorData.message?.includes('does not exist')) {
              console.log(`  ⚠️  Skipped (already applied): ${statement.substring(0, 50)}...`)
            } else {
              console.error(`  ❌ Error: ${errorData.message || response.statusText}`)
              errorCount++
            }
          } else {
            successCount++
          }
        } catch (fetchErr) {
          console.error(`  ❌ Failed to execute statement: ${fetchErr.message}`)
          errorCount++
        }
      }
    }

    console.log('\n✅ Migration completed!')
    console.log(`   Success: ${successCount} statements`)
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} statements`)
    }

    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    const { data: tables, error: tablesError } = await supabase
      .from('chat_sessions')
      .select('id')
      .limit(1)

    if (tablesError && tablesError.code === 'PGRST205') {
      console.error('❌ Tables still not found. Please run the SQL manually in Supabase Studio.')
      console.error('   Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new')
      console.error(`   File location: ${migrationPath}`)
      process.exit(1)
    } else {
      console.log('✅ Tables verified successfully!')
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

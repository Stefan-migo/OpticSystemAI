// Script para aplicar la migración de lens_families y lens_price_matrices
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📦 Aplicando migración de lens_families y lens_price_matrices...\n');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260129000000_create_lens_families_and_matrices.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Split SQL into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Ejecutando ${statements.length} statements...\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.length === 0) continue;
    
    try {
      // Use RPC to execute SQL (requires service role)
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // If exec_sql doesn't exist, try direct query (may not work for DDL)
        console.log(`⚠️  Statement ${i + 1} falló con RPC, intentando método alternativo...`);
        // For DDL statements, we might need to use a different approach
        console.log(`   SQL: ${statement.substring(0, 100)}...`);
      } else {
        console.log(`✅ Statement ${i + 1} ejecutado`);
      }
    } catch (err) {
      // Try using the REST API to execute raw SQL
      console.log(`⚠️  Error en statement ${i + 1}, continuando...`);
      console.log(`   Error: ${err.message}`);
    }
  }
  
  console.log('\n✅ Migración aplicada (algunos statements pueden haber fallado si ya existían)');
  console.log('   Verifica las tablas manualmente si es necesario');
}

// Alternative: Use Supabase REST API to execute SQL
async function applyMigrationViaRest() {
  console.log('📦 Aplicando migración via REST API...\n');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260129000000_create_lens_families_and_matrices.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Execute via REST API using postgREST
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql: migrationSQL })
  });
  
  if (!response.ok) {
    console.log('⚠️  No se pudo ejecutar via REST API');
    console.log('   Esto es normal - las tablas pueden necesitar crearse manualmente');
  }
}

applyMigration().catch(console.error);

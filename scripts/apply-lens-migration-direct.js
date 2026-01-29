// Script para aplicar la migración de lens_families directamente
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
  },
  db: {
    schema: 'public'
  }
});

async function applyMigration() {
  console.log('📦 Aplicando migración de lens_families y lens_price_matrices...\n');
  
  try {
    // Check if tables already exist
    const { data: familiesCheck } = await supabase
      .from('lens_families')
      .select('id')
      .limit(1);
    
    if (familiesCheck !== null) {
      console.log('✅ Las tablas ya existen');
      return;
    }
  } catch (err) {
    // Tables don't exist, continue
    console.log('ℹ️  Las tablas no existen, creándolas...\n');
  }
  
  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260129000000_create_lens_families_and_matrices.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // For Supabase, we need to use the REST API or execute via SQL
  // Since we can't execute DDL via REST, we'll create the tables using the client
  // But first, let's try to use the Supabase management API
  
  console.log('⚠️  No se puede ejecutar DDL directamente desde el cliente JavaScript');
  console.log('   Por favor, ejecuta la migración manualmente usando:');
  console.log('   1. npx supabase migration up --local');
  console.log('   2. O aplica el SQL directamente en la base de datos');
  console.log('\n   El archivo de migración está en:');
  console.log(`   ${migrationPath}`);
  
  // Try to verify tables exist after manual application
  console.log('\n🔍 Verificando si las tablas existen...');
  
  try {
    const { error: checkError } = await supabase
      .from('lens_families')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST205') {
      console.log('❌ Las tablas NO existen aún');
      console.log('   Necesitas aplicar la migración manualmente');
    } else {
      console.log('✅ Las tablas existen!');
    }
  } catch (err) {
    console.log('❌ Error verificando tablas:', err.message);
  }
}

applyMigration().catch(console.error);

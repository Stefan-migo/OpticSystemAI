
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    const { data, error } = await supabase.rpc('get_table_policies', { tname: 'prescriptions' });
    // If get_table_policies doesn't exist, we'll try a raw pg query if possible.
    // Actually, let's just use pg_policies view
    const { data: policies, error: polError } = await supabase.from('pg_policies').select('*').eq('tablename', 'prescriptions');
    // Wait, pg_policies might not be accessible via postgrest.

    // Let's just try to query as a normal user in the debug script by signing in if possible,
    // or just trust the migrations.
    console.log('PolError:', polError);
    console.log('Policies:', policies);
}

checkPolicies();

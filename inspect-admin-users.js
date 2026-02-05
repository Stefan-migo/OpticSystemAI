
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const { data, error } = await supabase.from('admin_users').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Admin User Sample:', data[0]);
        console.log('Fields:', Object.keys(data[0] || {}));
    }
}

inspectSchema();

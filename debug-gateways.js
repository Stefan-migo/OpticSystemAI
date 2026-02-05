
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGateways() {
    const { data, error } = await supabase.from('payment_gateways_config').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Gateways:', data);
    }
}

checkGateways();

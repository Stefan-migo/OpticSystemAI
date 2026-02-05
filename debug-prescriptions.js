
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPrescriptionCols() {
    const { data, error } = await supabase.from('prescriptions').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        console.log('Prescription columns:', Object.keys(data[0] || {}));
    }
}

checkPrescriptionCols();

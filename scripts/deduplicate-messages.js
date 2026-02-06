const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    console.log('Fetching messages...');
    const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    console.log(`Scanning ${messages.length} messages for duplicates...`);

    const seen = new Map();
    const toDelete = [];

    for (const msg of messages) {
        // Generate a unique fingerprint for the message content context
        // We trim content to handle potential whitespace differences
        const contentHash = msg.content ? msg.content.substring(0, 100) + msg.content.length : 'empty';
        const key = `${msg.session_id}-${msg.role}-${contentHash}`;

        if (seen.has(key)) {
            const existing = seen.get(key);
            const date1 = new Date(msg.created_at);
            const date2 = new Date(existing.created_at);
            const timeDiff = Math.abs(date1 - date2);

            // If same content, same role, same session, and created within 10 seconds -> DUPLICATE
            // We accept 10s window because sometimes network/server lag separates the saves
            if (timeDiff < 10000 && msg.content === existing.content) {
                toDelete.push(msg.id);
                // Keep the one that was created first (or last? usually keep first is safer)
                // actually, we are iterating in ascending order, so 'existing' is the older one.
                // We delete 'msg' which is the newer duplicate.
            } else {
                // If content is same but time is far apart, maybe user repeated themselves?
                // Let's assume valid repetition.
                // Update seen to most recent if we want to catch triples relative to the NEWEST?
                // No, keep the ORIGINAL as the anchor to delete subsequent duplicates.
            }
        } else {
            seen.set(key, msg);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} duplicate messages to delete.`);

        // Delete in chunks of 100 to avoid request size limits
        const chunkSize = 100;
        for (let i = 0; i < toDelete.length; i += chunkSize) {
            const chunk = toDelete.slice(i, i + chunkSize);
            const { error: deleteError } = await supabase
                .from('chat_messages')
                .delete()
                .in('id', chunk);

            if (deleteError) {
                console.error('Error deleting chunk:', deleteError);
            } else {
                console.log(`Deleted chunk ${Math.ceil((i + 1) / chunkSize)}/${Math.ceil(toDelete.length / chunkSize)}`);
            }
        }
        console.log('Cleanup complete.');
    } else {
        console.log('No duplicates found.');
    }
}

run();

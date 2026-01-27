# 🔧 Chat Migrations - Instructions

The error you're seeing (`Could not find the table 'public.chat_sessions'`) means the chat tables haven't been created in your Supabase database yet.

## Option 1: Supabase Studio (Recommended for Remote Supabase)

1. **Open Supabase Studio**:
   - Go to your Supabase dashboard: https://supabase.com/dashboard
   - Select your project
   - Click on **SQL Editor** in the left sidebar

2. **Run the Migration**:
   - Click **New Query**
   - Open the file: `scripts/apply-chat-migrations.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

3. **Verify**:
   - Go to **Table Editor** in the left sidebar
   - You should now see `chat_sessions` and `chat_messages` tables

## Option 2: Local Supabase (If using local development)

If you're using local Supabase, simply run:

```bash
npm run supabase:reset
```

This will apply all migrations including the chat tables.

## Option 3: Command Line (If you have psql access)

```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/apply-chat-migrations.sql
```

## Verification

After running the migration, try using the chat again. The error should be resolved.

## Troubleshooting

If you still see errors:

1. Check that the tables exist in Supabase Studio → Table Editor
2. Verify RLS policies are enabled (should be automatic)
3. Check the browser console for any new error messages

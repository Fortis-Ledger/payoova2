# Manual Deployment Guide for Supabase Setup

Since some SQL statements couldn't be executed automatically through the API, you'll need to manually execute them in the Supabase dashboard.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/cyziqbvwibeqstcdgmgb
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

## Step 2: Execute Schema (Tables and Functions)

1. Open the file `consolidated_schema.sql`
2. Copy the **entire contents** of the file
3. Paste it into the SQL Editor
4. Click **Run** to execute

**Note:** If you get any errors about existing objects, that's normal - some parts were already deployed.

## Step 3: Execute RLS Policies

1. Open the file `consolidated_policies.sql`
2. Copy the **entire contents** of the file
3. Paste it into a new SQL Editor query
4. Click **Run** to execute

## Step 4: Execute Configuration

1. Open the file `consolidated_config.sql`
2. Copy the **entire contents** of the file
3. Paste it into a new SQL Editor query
4. Click **Run** to execute

## Step 5: Verify Deployment

After executing all SQL files, run this test command:

```bash
node ./supabase/test_complete_setup.js
```

## Expected Tables

After successful deployment, you should have these tables:
- `users`
- `user_profiles`
- `wallets`
- `transactions`
- `cards`
- `card_transactions`
- `kyc_documents`
- `notifications`
- `audit_logs`
- `system_settings`
- `exchange_rates`
- `supported_currencies`
- `supported_cryptocurrencies`

## Troubleshooting

### If you get "relation already exists" errors:
- This is normal and expected
- The error means the table/function already exists
- Continue with the next SQL file

### If you get permission errors:
- Make sure you're logged in as the project owner
- Check that you're in the correct project

### If tables still don't appear:
- Wait 1-2 minutes for the schema cache to refresh
- Try refreshing the Supabase dashboard
- Run the test script again

## Next Steps

Once all SQL files are executed successfully:
1. Run the test script to verify everything works
2. Update your application configuration if needed
3. Start using your new Supabase project!

---

**Important:** Keep your environment variables secure and never commit them to version control.
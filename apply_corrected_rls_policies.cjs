require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
  try {
    console.log(`\n🔧 ${description}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log(`❌ ${description} failed:`, error.message);
      return false;
    } else {
      console.log(`✅ ${description} completed successfully`);
      return true;
    }
  } catch (err) {
    console.log(`❌ ${description} failed:`, err.message);
    return false;
  }
}

async function applyCorrectedRLSPolicies() {
  console.log('🚀 Applying corrected RLS policies to fix infinite recursion...');
  
  // Step 1: Drop all existing problematic policies
  const dropPolicies = [
    'DROP POLICY IF EXISTS "Users can view own profile" ON public.users;',
    'DROP POLICY IF EXISTS "Users can update own profile" ON public.users;',
    'DROP POLICY IF EXISTS "Allow user creation" ON public.users;',
    'DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;',
    'DROP POLICY IF EXISTS "Users can create own wallets" ON public.wallets;',
    'DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;',
    'DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;',
    'DROP POLICY IF EXISTS "Users can create transactions from own wallets" ON public.transactions;',
    'DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;',
    'DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;'
  ];
  
  for (const sql of dropPolicies) {
    await executeSQL(sql, `Dropping existing policy`);
  }
  
  // Step 2: Drop problematic functions if they exist
  const dropFunctions = [
    'DROP FUNCTION IF EXISTS public.get_user_id();',
    'DROP FUNCTION IF EXISTS public.is_user_owner(uuid);',
    'DROP FUNCTION IF EXISTS public.user_owns_wallet(uuid);'
  ];
  
  for (const sql of dropFunctions) {
    await executeSQL(sql, `Dropping problematic function`);
  }
  
  // Step 3: Create corrected RLS policies using direct auth.uid() checks
  const newPolicies = [
    // Users table policies
    `CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (id = auth.uid());`,
    
    `CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (id = auth.uid())
        WITH CHECK (id = auth.uid() AND role = OLD.role);`,
    
    `CREATE POLICY "Allow user creation" ON public.users
        FOR INSERT WITH CHECK (id = auth.uid());`,
    
    // Wallets table policies
    `CREATE POLICY "Users can view own wallets" ON public.wallets
        FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));`,
    
    `CREATE POLICY "Users can create own wallets" ON public.wallets
        FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));`,
    
    `CREATE POLICY "Users can update own wallets" ON public.wallets
        FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));`,
    
    // Transactions table policies
    `CREATE POLICY "Users can view own transactions" ON public.transactions
        FOR SELECT USING (
            from_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
            OR to_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
        );`,
    
    `CREATE POLICY "Users can create transactions from own wallets" ON public.transactions
        FOR INSERT WITH CHECK (
            from_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
        );`,
    
    `CREATE POLICY "Users can update own transactions" ON public.transactions
        FOR UPDATE USING (
            from_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
            OR to_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
        );`
  ];
  
  let successCount = 0;
  for (const sql of newPolicies) {
    const success = await executeSQL(sql, `Creating corrected RLS policy`);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Summary: ${successCount}/${newPolicies.length} policies created successfully`);
  
  if (successCount === newPolicies.length) {
    console.log('\n🎉 All corrected RLS policies applied successfully!');
    console.log('✅ The infinite recursion issue should now be resolved.');
    return true;
  } else {
    console.log('\n⚠️  Some policies failed to apply. Check the errors above.');
    return false;
  }
}

// Run the fix
if (require.main === module) {
  applyCorrectedRLSPolicies()
    .then((success) => {
      if (success) {
        console.log('\n🚀 Next step: Test the application to verify the fix!');
        process.exit(0);
      } else {
        console.log('\n❌ Fix incomplete. Please check errors and try manual application.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Failed to apply corrected RLS policies:', error);
      process.exit(1);
    });
}

module.exports = { applyCorrectedRLSPolicies };
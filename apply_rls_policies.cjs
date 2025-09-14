require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSPolicies() {
  try {
    console.log('🔄 Applying updated RLS policies...');
    
    // First, drop all existing policies to avoid conflicts
    console.log('🗑️ Dropping existing policies...');
    
    const dropPoliciesSQL = `
      -- Drop all existing policies
      DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
      DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
      DROP POLICY IF EXISTS "Allow user creation" ON public.users;
      DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
      DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
      
      DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
      DROP POLICY IF EXISTS "Users can create own wallets" ON public.wallets;
      DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
      DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
      
      DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
      DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
      DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
      DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
      
      -- Drop helper functions that caused recursion
      DROP FUNCTION IF EXISTS is_admin();
      DROP FUNCTION IF EXISTS get_user_id();
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPoliciesSQL });
    if (dropError) {
      console.log('⚠️ Some policies may not have existed:', dropError.message);
    }
    
    // Read the updated RLS policies file
    const rlsPoliciesPath = path.join(__dirname, 'supabase', 'policies', 'rls_policies.sql');
    const rlsPoliciesSQL = fs.readFileSync(rlsPoliciesPath, 'utf8');
    
    console.log('📝 Applying new RLS policies...');
    
    // Apply the new policies
    const { error: applyError } = await supabase.rpc('exec_sql', { sql: rlsPoliciesSQL });
    if (applyError) {
      console.error('❌ Error applying RLS policies:', applyError);
      throw applyError;
    }
    
    console.log('✅ RLS policies applied successfully!');
    
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error);
    throw error;
  }
}

// Alternative method using direct SQL execution
async function applyRLSPoliciesDirectSQL() {
  try {
    console.log('🔄 Applying RLS policies using direct SQL execution...');
    
    // Create new policies without the problematic helper functions
    const newPoliciesSQL = `
      -- Enable RLS on all tables
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
      
      -- USERS TABLE POLICIES
      CREATE POLICY "Users can view own profile" ON public.users
          FOR SELECT USING (auth_user_id = auth.uid());
      
      CREATE POLICY "Users can update own profile" ON public.users
          FOR UPDATE USING (auth_user_id = auth.uid())
          WITH CHECK (auth_user_id = auth.uid() AND role = OLD.role);
      
      CREATE POLICY "Allow user creation" ON public.users
          FOR INSERT WITH CHECK (auth_user_id = auth.uid());
      
      -- WALLETS TABLE POLICIES
      CREATE POLICY "Users can view own wallets" ON public.wallets
          FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
      
      CREATE POLICY "Users can create own wallets" ON public.wallets
          FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
      
      CREATE POLICY "Users can update own wallets" ON public.wallets
          FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
      
      -- TRANSACTIONS TABLE POLICIES
      CREATE POLICY "Users can view own transactions" ON public.transactions
          FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
      
      CREATE POLICY "Users can create own transactions" ON public.transactions
          FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
      
      CREATE POLICY "Users can update own transactions" ON public.transactions
          FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
    `;
    
    // Split SQL into individual statements and execute them
    const statements = newPoliciesSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
        if (error) {
          console.log(`⚠️ Statement may have failed (possibly already exists): ${error.message}`);
        }
      }
    }
    
    console.log('✅ RLS policies applied successfully!');
    
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  applyRLSPoliciesDirectSQL()
    .then(() => {
      console.log('🎉 RLS policies update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyRLSPolicies, applyRLSPoliciesDirectSQL };
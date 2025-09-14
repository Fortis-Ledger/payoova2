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

async function checkTableStructure() {
  try {
    console.log('🔍 Checking users table structure by attempting operations...');
    
    // Try to select from users table to see what happens
    console.log('\n1. Testing basic select...');
    const { data: selectData, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('❌ Select error:', selectError.message);
    } else {
      console.log('✅ Select successful, table exists');
      if (selectData && selectData.length > 0) {
        console.log('📋 Sample row structure:', Object.keys(selectData[0]));
      }
    }
    
    // Try to get current user info
    console.log('\n2. Testing auth.uid() access...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth accessible');
      console.log('🔑 Current user ID:', authData?.user?.id || 'No user');
    }
    
    // Test different RLS policy approaches
    console.log('\n3. Testing RLS policy approaches...');
    
    // Test approach 1: auth_user_id = auth.uid()
    console.log('\nTesting: auth_user_id = auth.uid()');
    const { data: test1, error: error1 } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', 'test');
    
    if (error1) {
      console.log('❌ auth_user_id approach failed:', error1.message);
      if (error1.message.includes('column "auth_user_id" does not exist')) {
        console.log('💡 Column auth_user_id does not exist');
      }
    } else {
      console.log('✅ auth_user_id column exists');
    }
    
    // Test approach 2: id = auth.uid()
    console.log('\nTesting: id = auth.uid()');
    const { data: test2, error: error2 } = await supabase
      .from('users')
      .select('*')
      .eq('id', 'test');
    
    if (error2) {
      console.log('❌ id approach failed:', error2.message);
    } else {
      console.log('✅ id column exists and accessible');
    }
    
    // Check what columns we can filter by
    console.log('\n4. Testing column existence...');
    const testColumns = ['id', 'auth_user_id', 'user_id', 'email', 'name'];
    
    for (const column of testColumns) {
      try {
        const { error } = await supabase
          .from('users')
          .select('*')
          .eq(column, 'test')
          .limit(0);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`❌ Column '${column}' does not exist`);
        } else {
          console.log(`✅ Column '${column}' exists`);
        }
      } catch (e) {
        console.log(`❌ Column '${column}' test failed:`, e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to check table structure:', error);
  }
}

// Run the check
if (require.main === module) {
  checkTableStructure()
    .then(() => {
      console.log('\n🎉 Table structure check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkTableStructure };
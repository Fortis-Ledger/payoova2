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

async function checkUsersTableSchema() {
  try {
    console.log('🔍 Checking users table schema...');
    
    // Query to get table schema information
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (error) {
      console.error('❌ Error querying schema:', error);
      return;
    }
    
    console.log('📋 Users table columns:');
    console.table(data);
    
    // Check specifically for auth-related columns
    const authColumns = data.filter(col => 
      col.column_name.includes('auth') || 
      col.column_name === 'id'
    );
    
    console.log('\n🔑 Auth-related columns:');
    authColumns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Check if auth_user_id exists
    const hasAuthUserId = data.some(col => col.column_name === 'auth_user_id');
    const hasId = data.some(col => col.column_name === 'id');
    
    console.log('\n✅ Column analysis:');
    console.log(`- auth_user_id exists: ${hasAuthUserId}`);
    console.log(`- id exists: ${hasId}`);
    
    if (hasAuthUserId) {
      console.log('\n💡 Use "auth_user_id = auth.uid()" in RLS policies');
    } else if (hasId) {
      console.log('\n💡 Use "id = auth.uid()" in RLS policies');
    } else {
      console.log('\n⚠️ No suitable auth column found!');
    }
    
  } catch (error) {
    console.error('❌ Failed to check schema:', error);
  }
}

// Also check if the users table exists and has any data
async function checkUsersTableExists() {
  try {
    console.log('\n🔍 Checking if users table exists and has structure...');
    
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error accessing users table:', error);
      return;
    }
    
    console.log(`✅ Users table exists with ${count} rows`);
    
  } catch (error) {
    console.error('❌ Users table access failed:', error);
  }
}

// Run the checks
if (require.main === module) {
  Promise.all([
    checkUsersTableSchema(),
    checkUsersTableExists()
  ])
  .then(() => {
    console.log('\n🎉 Schema check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Schema check failed:', error);
    process.exit(1);
  });
}

module.exports = { checkUsersTableSchema, checkUsersTableExists };
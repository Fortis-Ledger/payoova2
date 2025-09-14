// Test Supabase connection and database access
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase connection...');
  console.log('🔗 URL:', supabaseUrl);
  console.log('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Health check failed:', healthError);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Check if users table exists and is accessible
    console.log('\n2. Testing users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users table access failed:', usersError);
      return;
    }
    
    console.log('✅ Users table accessible');
    console.log('📊 Found', users?.length || 0, 'users');
    
    // Test 3: Check auth session
    console.log('\n3. Testing auth session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError);
      return;
    }
    
    console.log('✅ Session check successful');
    console.log('🔐 Current session:', session ? 'Authenticated' : 'Not authenticated');
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSupabaseConnection();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function deployPolicies() {
  try {
    console.log('🔒 Starting RLS policies deployment...');
    
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Read the policies file
    const policiesSQL = fs.readFileSync('./supabase/consolidated_policies.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = policiesSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} policy statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      if (statement.trim() === ';') continue;
      
      console.log(`⚡ Executing policy ${i + 1}/${statements.length}`);
      
      try {
        // Try to execute via REST API
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (!response.ok) {
          console.log(`⚠️  Policy ${i + 1} needs manual execution:`);
          console.log(statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Policy ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Policy ${i + 1} error (may need manual execution):`, err.message);
      }
    }
    
    console.log('\n🎉 RLS policies deployment completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your Supabase dashboard Authentication > Policies to verify RLS policies');
    console.log('2. If some policies failed, copy them from consolidated_policies.sql and run manually');
    console.log('3. Run the configuration deployment next');
    
  } catch (error) {
    console.error('❌ RLS policies deployment failed:', error);
    console.log('\n🔧 Manual deployment required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and paste the contents of ./supabase/consolidated_policies.sql');
    console.log('4. Execute the SQL manually');
  }
}

deployPolicies();
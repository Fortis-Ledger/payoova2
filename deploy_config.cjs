const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function deployConfig() {
  try {
    console.log('⚙️ Starting configuration deployment...');
    
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Read the config file
    const configSQL = fs.readFileSync('./supabase/consolidated_config.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = configSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} configuration statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      if (statement.trim() === ';') continue;
      
      console.log(`⚡ Executing config ${i + 1}/${statements.length}`);
      
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
          console.log(`⚠️  Config ${i + 1} needs manual execution:`);
          console.log(statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Config ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Config ${i + 1} error (may need manual execution):`, err.message);
      }
    }
    
    console.log('\n🎉 Configuration deployment completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your Supabase dashboard to verify configuration is applied');
    console.log('2. If some configs failed, copy them from consolidated_config.sql and run manually');
    console.log('3. Run the test script to verify everything works');
    
  } catch (error) {
    console.error('❌ Configuration deployment failed:', error);
    console.log('\n🔧 Manual deployment required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and paste the contents of ./supabase/consolidated_config.sql');
    console.log('4. Execute the SQL manually');
  }
}

deployConfig();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function deploySchema() {
  try {
    console.log('🚀 Starting schema deployment...');
    
    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Read the schema file
    const schemaSQL = fs.readFileSync('./supabase/consolidated_schema.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      if (statement.trim() === ';') continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
      
      try {
        const { data, error } = await supabase
          .from('_temp_sql_execution')
          .select('*')
          .limit(0);
        
        // Use raw SQL execution through the REST API
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
          // Try alternative approach with direct SQL
          console.log(`⚠️  Statement ${i + 1} needs manual execution:`);
          console.log(statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} error (may need manual execution):`, err.message);
      }
    }
    
    console.log('\n🎉 Schema deployment completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check your Supabase dashboard to verify tables were created');
    console.log('2. If some statements failed, copy them from consolidated_schema.sql and run manually in SQL Editor');
    console.log('3. Run the RLS policies deployment next');
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error);
    console.log('\n🔧 Manual deployment required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and paste the contents of ./supabase/consolidated_schema.sql');
    console.log('4. Execute the SQL manually');
  }
}

deploySchema();
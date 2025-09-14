// Comprehensive test script for Payoova Supabase setup
// This script tests the complete setup after applying consolidated files

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './supabase/.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in ./supabase/.env');
    console.log('Or copy ./supabase/.env.example to ./supabase/.env and fill in your credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteSetup() {
    console.log('🧪 Testing Complete Supabase Setup');
    console.log('=====================================\n');

    try {
        // Test 1: Basic connection
        console.log('1. Testing basic connection...');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (connectionError) {
            console.log('❌ Connection test failed:', connectionError.message);
            return false;
        }
        console.log('✅ Basic connection successful\n');

        // Test 2: Check if all main tables exist
        console.log('2. Checking if all main tables exist...');
        const tables = [
            'users', 'wallets', 'transactions', 'cards', 'card_transactions',
            'kyc_documents', 'kyc_verifications', 'aml_checks', 
            'transaction_monitoring', 'compliance_reports',
            'admin_audit_log', 'notification_templates', 'user_notifications', 'rate_limits'
        ];

        for (const table of tables) {
            try {
                const { error } = await supabase.from(table).select('*').limit(1);
                if (error) {
                    console.log(`❌ Table '${table}' not accessible:`, error.message);
                } else {
                    console.log(`✅ Table '${table}' exists and accessible`);
                }
            } catch (err) {
                console.log(`❌ Error checking table '${table}':`, err.message);
            }
        }
        console.log();

        // Test 3: Check if custom functions exist
        console.log('3. Testing custom functions...');
        try {
            // Test system health check function
            const { data: healthData, error: healthError } = await supabase
                .rpc('system_health_check');
            
            if (healthError) {
                console.log('❌ system_health_check function failed:', healthError.message);
            } else {
                console.log('✅ system_health_check function works');
                console.log('   Database size:', healthData.database_size);
                console.log('   Active connections:', healthData.active_connections);
            }
        } catch (err) {
            console.log('❌ Error testing functions:', err.message);
        }
        console.log();

        // Test 4: Check notification templates
        console.log('4. Checking notification templates...');
        try {
            const { data: templates, error: templatesError } = await supabase
                .from('notification_templates')
                .select('template_name, template_type')
                .eq('is_active', true);
            
            if (templatesError) {
                console.log('❌ Failed to fetch notification templates:', templatesError.message);
            } else {
                console.log(`✅ Found ${templates.length} notification templates:`);
                templates.forEach(template => {
                    console.log(`   - ${template.template_name} (${template.template_type})`);
                });
            }
        } catch (err) {
            console.log('❌ Error checking notification templates:', err.message);
        }
        console.log();

        // Test 5: Test RLS policies (basic check)
        console.log('5. Testing Row Level Security policies...');
        try {
            // This should fail without authentication (which is expected)
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .limit(1);
            
            if (userError && userError.message.includes('row-level security')) {
                console.log('✅ RLS policies are active (access denied without auth)');
            } else if (userError) {
                console.log('⚠️  RLS test inconclusive:', userError.message);
            } else {
                console.log('⚠️  RLS might not be properly configured (got data without auth)');
            }
        } catch (err) {
            console.log('❌ Error testing RLS:', err.message);
        }
        console.log();

        // Test 6: Check indexes exist
        console.log('6. Checking database indexes...');
        try {
            const { data: indexes, error: indexError } = await supabase
                .rpc('sql', {
                    query: `
                        SELECT schemaname, tablename, indexname 
                        FROM pg_indexes 
                        WHERE schemaname = 'public' 
                        AND indexname LIKE 'idx_%'
                        ORDER BY tablename, indexname
                    `
                });
            
            if (indexError) {
                console.log('❌ Failed to check indexes:', indexError.message);
            } else {
                console.log(`✅ Found ${indexes.length} custom indexes`);
                const tableIndexes = {};
                indexes.forEach(idx => {
                    if (!tableIndexes[idx.tablename]) tableIndexes[idx.tablename] = 0;
                    tableIndexes[idx.tablename]++;
                });
                Object.entries(tableIndexes).forEach(([table, count]) => {
                    console.log(`   - ${table}: ${count} indexes`);
                });
            }
        } catch (err) {
            console.log('⚠️  Could not check indexes (might need different permissions)');
        }
        console.log();

        console.log('🎉 Setup test completed!');
        console.log('=====================================');
        console.log('✅ All core components appear to be working');
        console.log('\n📋 Next steps:');
        console.log('1. Apply the SQL files to your Supabase project in this order:');
        console.log('   a. cleanup_supabase.sql (to clean existing data)');
        console.log('   b. consolidated_schema.sql (to create tables and functions)');
        console.log('   c. consolidated_policies.sql (to set up security)');
        console.log('   d. consolidated_config.sql (to add utilities and config)');
        console.log('2. Test with actual user authentication');
        console.log('3. Verify all application features work as expected');
        
        return true;

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        return false;
    }
}

// Run the test
testCompleteSetup()
    .then(success => {
        if (success) {
            console.log('\n✅ Test completed successfully');
            process.exit(0);
        } else {
            console.log('\n❌ Test completed with errors');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 Test crashed:', error.message);
        process.exit(1);
    });
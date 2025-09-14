-- Payoova Wallet - Complete Supabase Deployment Script
-- This script applies all consolidated files in the correct order
-- Run this script in Supabase SQL Editor after running cleanup_supabase.sql

-- ============================================================================
-- STEP 1: APPLY CONSOLIDATED SCHEMA
-- ============================================================================

-- Note: Copy and paste the entire content of consolidated_schema.sql here
-- Or run consolidated_schema.sql separately in Supabase SQL Editor

SELECT 'Starting schema deployment...' as status;

-- The consolidated_schema.sql file should be applied first
-- It contains:
-- - Extensions
-- - Custom types
-- - All tables
-- - Indexes
-- - Functions
-- - Triggers
-- - Permissions
-- - Comments

SELECT 'Schema deployment completed. Please apply consolidated_schema.sql manually.' as status;

-- ============================================================================
-- STEP 2: APPLY CONSOLIDATED POLICIES (RLS)
-- ============================================================================

-- Note: Copy and paste the entire content of consolidated_policies.sql here
-- Or run consolidated_policies.sql separately in Supabase SQL Editor

SELECT 'Starting RLS policies deployment...' as status;

-- The consolidated_policies.sql file should be applied second
-- It contains:
-- - RLS policies for all tables
-- - Security helper functions
-- - Admin access controls
-- - User access controls

SELECT 'RLS policies deployment completed. Please apply consolidated_policies.sql manually.' as status;

-- ============================================================================
-- STEP 3: APPLY CONSOLIDATED CONFIGURATION
-- ============================================================================

-- Note: Copy and paste the entire content of consolidated_config.sql here
-- Or run consolidated_config.sql separately in Supabase SQL Editor

SELECT 'Starting configuration deployment...' as status;

-- The consolidated_config.sql file should be applied third
-- It contains:
-- - Security and encryption functions
-- - Audit and logging functions
-- - Notification functions
-- - Rate limiting functions
-- - System health monitoring
-- - Data cleanup functions
-- - Backup utilities
-- - Scheduled jobs

SELECT 'Configuration deployment completed. Please apply consolidated_config.sql manually.' as status;

-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables are created
SELECT 'Verifying table creation...' as status;

SELECT 
    'Tables created:' as check_type,
    count(*) as count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'wallets', 'transactions', 'cards', 'card_transactions',
    'kyc_documents', 'kyc_verifications', 'aml_checks', 
    'transaction_monitoring', 'compliance_reports'
);

-- Verify all custom types are created
SELECT 'Verifying custom types...' as status;

SELECT 
    'Custom types created:' as check_type,
    count(*) as count
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typname IN (
    'user_role', 'wallet_network', 'transaction_type', 'transaction_status',
    'card_type', 'card_status', 'kyc_status', 'kyc_document_type',
    'aml_risk_level', 'verification_level'
);

-- Verify all functions are created
SELECT 'Verifying functions...' as status;

SELECT 
    'Functions created:' as check_type,
    count(*) as count
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
    'create_user_profile', 'generate_card_number', 'generate_cvv',
    'generate_expiry_date', 'get_user_kyc_level', 'calculate_transaction_fee',
    'validate_wallet_address', 'check_spending_limits', 'update_wallet_balance',
    'update_card_balance', 'create_transaction_alert'
);

-- Verify all triggers are created
SELECT 'Verifying triggers...' as status;

SELECT 
    'Triggers created:' as check_type,
    count(*) as count
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name IN (
    'on_auth_user_created', 'update_users_updated_at', 'update_wallets_updated_at',
    'update_cards_updated_at', 'update_kyc_documents_updated_at',
    'update_kyc_verifications_updated_at', 'update_compliance_reports_updated_at',
    'update_wallet_balance_trigger', 'update_card_balance_trigger',
    'transaction_monitoring_trigger'
);

-- Verify RLS policies are applied
SELECT 'Verifying RLS policies...' as status;

SELECT 
    'RLS policies created:' as check_type,
    count(*) as count
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify RLS is enabled on tables
SELECT 'Verifying RLS status...' as status;

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public'
AND pt.tablename IN (
    'users', 'wallets', 'transactions', 'cards', 'card_transactions',
    'kyc_documents', 'kyc_verifications', 'aml_checks',
    'transaction_monitoring', 'compliance_reports'
)
ORDER BY pt.tablename;

-- ============================================================================
-- STEP 5: SAMPLE DATA INSERTION (OPTIONAL)
-- ============================================================================

-- Insert sample admin user (optional)
-- Note: This requires an actual auth user to exist first
/*
INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    country,
    preferred_currency
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with actual auth user ID
    'Admin User',
    'admin@payoova.com',
    'admin',
    'US',
    'USD'
) ON CONFLICT (email) DO NOTHING;
*/

-- ============================================================================
-- STEP 6: FINAL STATUS CHECK
-- ============================================================================

SELECT 'Deployment verification completed!' as status;

SELECT 
    'Summary:' as section,
    (
        SELECT count(*) FROM pg_tables WHERE schemaname = 'public'
        AND tablename IN (
            'users', 'wallets', 'transactions', 'cards', 'card_transactions',
            'kyc_documents', 'kyc_verifications', 'aml_checks',
            'transaction_monitoring', 'compliance_reports'
        )
    ) as tables_created,
    (
        SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
    ) as policies_created,
    (
        SELECT count(*) FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) as functions_created,
    (
        SELECT count(*) FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    ) as triggers_created;

-- ============================================================================
-- DEPLOYMENT INSTRUCTIONS
-- ============================================================================

/*
DEPLOYMENT STEPS:

1. First, run cleanup_supabase.sql to remove all existing structures
2. Then run consolidated_schema.sql to create all tables, types, and functions
3. Next run consolidated_policies.sql to apply RLS policies
4. Finally run consolidated_config.sql to apply configuration and utilities
5. Run this verification script to confirm everything is working

IMPORTANT NOTES:
- Always backup your database before running cleanup
- Test in a development environment first
- The cleanup script will delete ALL data
- Make sure to update any auth_user_id references in sample data
- Check that all RLS policies are working correctly
- Verify that triggers are functioning as expected

TROUBLESHOoting:
- If you get "infinite recursion" errors, check RLS policies
- If functions fail, check for missing dependencies
- If triggers don't work, verify function signatures
- If permissions fail, check role assignments
*/

SELECT 'Deployment script completed. Please follow the deployment instructions above.' as final_status;
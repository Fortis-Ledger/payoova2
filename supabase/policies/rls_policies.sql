-- Payoova Wallet - Row Level Security (RLS) Policies
-- This file contains all RLS policies to secure data access in Supabase

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aml_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's profile ID
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM public.users 
        WHERE auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid() AND role = OLD.role);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin());

-- Admins can update any user
CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (is_admin());

-- Allow user creation during signup
CREATE POLICY "Allow user creation" ON public.users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- WALLETS TABLE POLICIES
-- Users can view their own wallets
CREATE POLICY "Users can view own wallets" ON public.wallets
    FOR SELECT USING (user_id = get_user_id());

-- Users can create their own wallets
CREATE POLICY "Users can create own wallets" ON public.wallets
    FOR INSERT WITH CHECK (user_id = get_user_id());

-- Users can update their own wallets
CREATE POLICY "Users can update own wallets" ON public.wallets
    FOR UPDATE USING (user_id = get_user_id());

-- Admins can view all wallets
CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR SELECT USING (is_admin());

-- TRANSACTIONS TABLE POLICIES
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (user_id = get_user_id());

-- Users can create their own transactions
CREATE POLICY "Users can create own transactions" ON public.transactions
    FOR INSERT WITH CHECK (user_id = get_user_id());

-- Users can update their own transactions (limited fields)
CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (user_id = get_user_id())
    WITH CHECK (user_id = get_user_id());

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (is_admin());

-- Admins can update any transaction
CREATE POLICY "Admins can update any transaction" ON public.transactions
    FOR UPDATE USING (is_admin());

-- CARDS TABLE POLICIES
-- Users can view their own cards
CREATE POLICY "Users can view own cards" ON public.cards
    FOR SELECT USING (user_id = get_user_id());

-- Users can create their own cards
CREATE POLICY "Users can create own cards" ON public.cards
    FOR INSERT WITH CHECK (user_id = get_user_id());

-- Users can update their own cards
CREATE POLICY "Users can update own cards" ON public.cards
    FOR UPDATE USING (user_id = get_user_id());

-- Admins can view all cards
CREATE POLICY "Admins can view all cards" ON public.cards
    FOR SELECT USING (is_admin());

-- Admins can update any card
CREATE POLICY "Admins can update any card" ON public.cards
    FOR UPDATE USING (is_admin());

-- CARD TRANSACTIONS TABLE POLICIES
-- Users can view their own card transactions
CREATE POLICY "Users can view own card transactions" ON public.card_transactions
    FOR SELECT USING (user_id = get_user_id());

-- Users can create their own card transactions
CREATE POLICY "Users can create own card transactions" ON public.card_transactions
    FOR INSERT WITH CHECK (user_id = get_user_id());

-- Admins can view all card transactions
CREATE POLICY "Admins can view all card transactions" ON public.card_transactions
    FOR SELECT USING (is_admin());

-- KYC DOCUMENTS TABLE POLICIES
-- Users can view their own KYC documents
CREATE POLICY "Users can view own kyc documents" ON public.kyc_documents
    FOR SELECT USING (user_id = get_user_id());

-- Users can create their own KYC documents
CREATE POLICY "Users can create own kyc documents" ON public.kyc_documents
    FOR INSERT WITH CHECK (user_id = get_user_id());

-- Users can update their own KYC documents (limited)
CREATE POLICY "Users can update own kyc documents" ON public.kyc_documents
    FOR UPDATE USING (user_id = get_user_id() AND status = 'pending');

-- Admins can view all KYC documents
CREATE POLICY "Admins can view all kyc documents" ON public.kyc_documents
    FOR SELECT USING (is_admin());

-- Admins can update any KYC document
CREATE POLICY "Admins can update any kyc document" ON public.kyc_documents
    FOR UPDATE USING (is_admin());

-- KYC VERIFICATIONS TABLE POLICIES
-- Users can view their own KYC verifications
CREATE POLICY "Users can view own kyc verifications" ON public.kyc_verifications
    FOR SELECT USING (user_id = get_user_id());

-- Users can create their own KYC verifications
CREATE POLICY "Users can create own kyc verifications" ON public.kyc_verifications
    FOR INSERT WITH CHECK (user_id = get_user_id());

-- Users can update their own KYC verifications (limited)
CREATE POLICY "Users can update own kyc verifications" ON public.kyc_verifications
    FOR UPDATE USING (user_id = get_user_id() AND status = 'pending');

-- Admins can view all KYC verifications
CREATE POLICY "Admins can view all kyc verifications" ON public.kyc_verifications
    FOR SELECT USING (is_admin());

-- Admins can update any KYC verification
CREATE POLICY "Admins can update any kyc verification" ON public.kyc_verifications
    FOR UPDATE USING (is_admin());

-- AML CHECKS TABLE POLICIES
-- Users can view their own AML checks
CREATE POLICY "Users can view own aml checks" ON public.aml_checks
    FOR SELECT USING (user_id = get_user_id());

-- Only admins can create AML checks
CREATE POLICY "Admins can create aml checks" ON public.aml_checks
    FOR INSERT WITH CHECK (is_admin());

-- Only admins can update AML checks
CREATE POLICY "Admins can update aml checks" ON public.aml_checks
    FOR UPDATE USING (is_admin());

-- Admins can view all AML checks
CREATE POLICY "Admins can view all aml checks" ON public.aml_checks
    FOR SELECT USING (is_admin());

-- TRANSACTION MONITORING TABLE POLICIES
-- Users can view their own transaction monitoring records
CREATE POLICY "Users can view own transaction monitoring" ON public.transaction_monitoring
    FOR SELECT USING (user_id = get_user_id());

-- Only system/admins can create monitoring records
CREATE POLICY "Admins can create transaction monitoring" ON public.transaction_monitoring
    FOR INSERT WITH CHECK (is_admin());

-- Only admins can update monitoring records
CREATE POLICY "Admins can update transaction monitoring" ON public.transaction_monitoring
    FOR UPDATE USING (is_admin());

-- Admins can view all monitoring records
CREATE POLICY "Admins can view all transaction monitoring" ON public.transaction_monitoring
    FOR SELECT USING (is_admin());

-- COMPLIANCE REPORTS TABLE POLICIES
-- Only admins can access compliance reports
CREATE POLICY "Admins can view compliance reports" ON public.compliance_reports
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can create compliance reports" ON public.compliance_reports
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update compliance reports" ON public.compliance_reports
    FOR UPDATE USING (is_admin());

-- ADDITIONAL SECURITY FUNCTIONS

-- Function to check if user owns a wallet
CREATE OR REPLACE FUNCTION user_owns_wallet(wallet_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.wallets 
        WHERE id = wallet_id 
        AND user_id = get_user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a card
CREATE OR REPLACE FUNCTION user_owns_card(card_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.cards 
        WHERE id = card_id 
        AND user_id = get_user_id()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check transaction limits
CREATE OR REPLACE FUNCTION check_transaction_limits(user_id UUID, amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    daily_total DECIMAL;
    monthly_total DECIMAL;
    user_verification_level verification_level;
BEGIN
    -- Get user's verification level
    SELECT kv.verification_level INTO user_verification_level
    FROM public.kyc_verifications kv
    WHERE kv.user_id = check_transaction_limits.user_id
    AND kv.status = 'approved'
    ORDER BY kv.approved_at DESC
    LIMIT 1;
    
    -- Calculate daily total
    SELECT COALESCE(SUM(t.amount), 0) INTO daily_total
    FROM public.transactions t
    WHERE t.user_id = check_transaction_limits.user_id
    AND t.created_at >= CURRENT_DATE
    AND t.status = 'confirmed';
    
    -- Calculate monthly total
    SELECT COALESCE(SUM(t.amount), 0) INTO monthly_total
    FROM public.transactions t
    WHERE t.user_id = check_transaction_limits.user_id
    AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND t.status = 'confirmed';
    
    -- Check limits based on verification level
    CASE user_verification_level
        WHEN 'basic' THEN
            RETURN (daily_total + amount <= 1000) AND (monthly_total + amount <= 10000);
        WHEN 'intermediate' THEN
            RETURN (daily_total + amount <= 5000) AND (monthly_total + amount <= 50000);
        WHEN 'advanced' THEN
            RETURN (daily_total + amount <= 25000) AND (monthly_total + amount <= 250000);
        ELSE
            RETURN (daily_total + amount <= 500) AND (monthly_total + amount <= 2000);
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments
COMMENT ON FUNCTION is_admin() IS 'Check if current user has admin role';
COMMENT ON FUNCTION get_user_id() IS 'Get current user profile ID from auth.uid()';
COMMENT ON FUNCTION user_owns_wallet(UUID) IS 'Check if current user owns specified wallet';
COMMENT ON FUNCTION user_owns_card(UUID) IS 'Check if current user owns specified card';
COMMENT ON FUNCTION check_transaction_limits(UUID, DECIMAL) IS 'Validate transaction against user limits based on KYC level';
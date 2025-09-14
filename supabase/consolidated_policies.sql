-- Payoova Wallet - Consolidated RLS Policies for Supabase
-- This file contains all Row Level Security policies for data access control
-- Created by consolidating multiple policy files for easier management

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

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

-- ============================================================================
-- CORE TABLE POLICIES
-- ============================================================================

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Wallets table policies
CREATE POLICY "Users can view own wallets" ON public.wallets
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own wallets" ON public.wallets
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own wallets" ON public.wallets
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own wallets" ON public.wallets
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Transactions table policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Cards table policies
CREATE POLICY "Users can view own cards" ON public.cards
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own cards" ON public.cards
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own cards" ON public.cards
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own cards" ON public.cards
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Card transactions table policies
CREATE POLICY "Users can view own card transactions" ON public.card_transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own card transactions" ON public.card_transactions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own card transactions" ON public.card_transactions
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- ============================================================================
-- KYC AND AML POLICIES
-- ============================================================================

-- KYC Documents table policies
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own KYC documents" ON public.kyc_documents
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own KYC documents" ON public.kyc_documents
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- KYC Verifications table policies
CREATE POLICY "Users can view own KYC verifications" ON public.kyc_verifications
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own KYC verifications" ON public.kyc_verifications
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own KYC verifications" ON public.kyc_verifications
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- AML Checks table policies
CREATE POLICY "Users can view own AML checks" ON public.aml_checks
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own AML checks" ON public.aml_checks
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own AML checks" ON public.aml_checks
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Transaction Monitoring table policies
CREATE POLICY "Users can view own transaction monitoring" ON public.transaction_monitoring
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own transaction monitoring" ON public.transaction_monitoring
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own transaction monitoring" ON public.transaction_monitoring
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- ============================================================================
-- SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user ID from auth
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM public.users 
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' FROM public.users 
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns wallet
CREATE OR REPLACE FUNCTION user_owns_wallet(wallet_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS(
            SELECT 1 FROM public.wallets w
            JOIN public.users u ON w.user_id = u.id
            WHERE w.id = wallet_id AND u.auth_user_id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns card
CREATE OR REPLACE FUNCTION user_owns_card(card_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS(
            SELECT 1 FROM public.cards c
            JOIN public.users u ON c.user_id = u.id
            WHERE c.id = card_id AND u.auth_user_id = auth.uid()
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN POLICIES (FIXED - NO RECURSION)
-- ============================================================================

-- Admin policies for users table
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (is_admin());

-- Admin policies for wallets table
CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all wallets" ON public.wallets
    FOR UPDATE USING (is_admin());

-- Admin policies for transactions table
CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all transactions" ON public.transactions
    FOR UPDATE USING (is_admin());

-- Admin policies for cards table
CREATE POLICY "Admins can view all cards" ON public.cards
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all cards" ON public.cards
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert cards" ON public.cards
    FOR INSERT WITH CHECK (is_admin());

-- Admin policies for card transactions table
CREATE POLICY "Admins can view all card transactions" ON public.card_transactions
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all card transactions" ON public.card_transactions
    FOR UPDATE USING (is_admin());

-- Admin policies for KYC documents
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all KYC documents" ON public.kyc_documents
    FOR UPDATE USING (is_admin());

-- Admin policies for KYC verifications
CREATE POLICY "Admins can view all KYC verifications" ON public.kyc_verifications
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all KYC verifications" ON public.kyc_verifications
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert KYC verifications" ON public.kyc_verifications
    FOR INSERT WITH CHECK (is_admin());

-- Admin policies for AML checks
CREATE POLICY "Admins can view all AML checks" ON public.aml_checks
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all AML checks" ON public.aml_checks
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert AML checks" ON public.aml_checks
    FOR INSERT WITH CHECK (is_admin());

-- Admin policies for transaction monitoring
CREATE POLICY "Admins can view all transaction monitoring" ON public.transaction_monitoring
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all transaction monitoring" ON public.transaction_monitoring
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert transaction monitoring" ON public.transaction_monitoring
    FOR INSERT WITH CHECK (is_admin());

-- Admin policies for compliance reports
CREATE POLICY "Admins can view all compliance reports" ON public.compliance_reports
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all compliance reports" ON public.compliance_reports
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert compliance reports" ON public.compliance_reports
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can delete compliance reports" ON public.compliance_reports
    FOR DELETE USING (is_admin());

-- ============================================================================
-- SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user owns a specific wallet
CREATE OR REPLACE FUNCTION user_owns_wallet(wallet_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.wallets w
        JOIN public.users u ON w.user_id = u.id
        WHERE w.id = wallet_id AND u.auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a specific card
CREATE OR REPLACE FUNCTION user_owns_card(card_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.cards c
        JOIN public.users u ON c.user_id = u.id
        WHERE c.id = card_id AND u.auth_user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check transaction limits based on KYC level
CREATE OR REPLACE FUNCTION check_transaction_limits(user_id UUID, amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    kyc_level verification_level;
    daily_limit DECIMAL;
    monthly_limit DECIMAL;
    daily_total DECIMAL;
    monthly_total DECIMAL;
BEGIN
    -- Get user's KYC level
    kyc_level := get_user_kyc_level(user_id);
    
    -- Set limits based on KYC level
    CASE kyc_level
        WHEN 'basic' THEN
            daily_limit := 1000;
            monthly_limit := 5000;
        WHEN 'intermediate' THEN
            daily_limit := 10000;
            monthly_limit := 50000;
        WHEN 'advanced' THEN
            daily_limit := 100000;
            monthly_limit := 500000;
        ELSE
            daily_limit := 500;
            monthly_limit := 2000;
    END CASE;
    
    -- Calculate current daily total
    SELECT COALESCE(SUM(t.amount), 0) INTO daily_total
    FROM public.transactions t
    WHERE t.user_id = check_transaction_limits.user_id
    AND t.transaction_type = 'send'
    AND t.status = 'confirmed'
    AND t.created_at >= CURRENT_DATE;
    
    -- Calculate current monthly total
    SELECT COALESCE(SUM(t.amount), 0) INTO monthly_total
    FROM public.transactions t
    WHERE t.user_id = check_transaction_limits.user_id
    AND t.transaction_type = 'send'
    AND t.status = 'confirmed'
    AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Check limits
    IF (daily_total + amount) > daily_limit THEN
        RETURN FALSE;
    END IF;
    
    IF (monthly_total + amount) > monthly_limit THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION user_owns_wallet(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_card(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_transaction_limits(UUID, DECIMAL) TO authenticated;

-- ============================================================================
-- POLICY COMMENTS
-- ============================================================================

COMMENT ON POLICY "Users can view own profile" ON public.users IS 'Allow users to view their own profile data';
COMMENT ON POLICY "Users can view own wallets" ON public.wallets IS 'Allow users to view their own wallets';
COMMENT ON POLICY "Users can view own transactions" ON public.transactions IS 'Allow users to view their own transaction history';
COMMENT ON POLICY "Users can view own cards" ON public.cards IS 'Allow users to view their own cards';
COMMENT ON POLICY "Users can view own card transactions" ON public.card_transactions IS 'Allow users to view their own card transaction history';
COMMENT ON POLICY "Users can view own KYC documents" ON public.kyc_documents IS 'Allow users to view their own KYC documents';
COMMENT ON POLICY "Users can view own KYC verifications" ON public.kyc_verifications IS 'Allow users to view their own KYC verification status';
COMMENT ON POLICY "Users can view own AML checks" ON public.aml_checks IS 'Allow users to view their own AML check results';
COMMENT ON POLICY "Users can view own transaction monitoring" ON public.transaction_monitoring IS 'Allow users to view monitoring alerts for their transactions';

COMMENT ON POLICY "Admins can view all users" ON public.users IS 'Allow admin users to view all user profiles';
COMMENT ON POLICY "Admins can view all wallets" ON public.wallets IS 'Allow admin users to view all wallets';
COMMENT ON POLICY "Admins can view all transactions" ON public.transactions IS 'Allow admin users to view all transactions';
COMMENT ON POLICY "Admins can view all cards" ON public.cards IS 'Allow admin users to view all cards';
COMMENT ON POLICY "Admins can view all card transactions" ON public.card_transactions IS 'Allow admin users to view all card transactions';
COMMENT ON POLICY "Admins can view all KYC documents" ON public.kyc_documents IS 'Allow admin users to view all KYC documents';
COMMENT ON POLICY "Admins can view all KYC verifications" ON public.kyc_verifications IS 'Allow admin users to view all KYC verifications';
COMMENT ON POLICY "Admins can view all AML checks" ON public.aml_checks IS 'Allow admin users to view all AML checks';
COMMENT ON POLICY "Admins can view all transaction monitoring" ON public.transaction_monitoring IS 'Allow admin users to view all transaction monitoring alerts';
COMMENT ON POLICY "Admins can view all compliance reports" ON public.compliance_reports IS 'Allow admin users to view all compliance reports';

-- ============================================================================
-- END OF CONSOLIDATED POLICIES
-- ============================================================================
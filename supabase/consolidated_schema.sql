-- Payoova Wallet - Consolidated Database Schema for Supabase
-- This file contains all database tables, types, functions, and triggers
-- Created by consolidating multiple schema files for easier management

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Core types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE wallet_network AS ENUM ('ethereum', 'polygon', 'bsc', 'bitcoin');
CREATE TYPE transaction_type AS ENUM ('send', 'receive');
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');

-- Card types
CREATE TYPE card_type AS ENUM ('virtual', 'physical');
CREATE TYPE card_status AS ENUM ('active', 'frozen', 'cancelled', 'pending');
CREATE TYPE shipping_status AS ENUM ('processing', 'shipped', 'delivered');
CREATE TYPE card_transaction_type AS ENUM ('purchase', 'refund', 'load', 'fee');
CREATE TYPE card_transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- KYC and AML types
CREATE TYPE kyc_document_type AS ENUM ('passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement');
CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'expired');
CREATE TYPE aml_risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE aml_check_status AS ENUM ('pending', 'passed', 'failed', 'manual_review');
CREATE TYPE verification_level AS ENUM ('basic', 'intermediate', 'advanced');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Profile information
    phone VARCHAR(20),
    date_of_birth DATE,
    country VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Preferences
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    notification_preferences JSONB DEFAULT '{}',
    security_preferences JSONB DEFAULT '{}'
);

-- Wallets table
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    network wallet_network NOT NULL,
    address VARCHAR(42) NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    balance DECIMAL(36, 18) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    name VARCHAR(100),
    description TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMP WITH TIME ZONE
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(66) UNIQUE,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount DECIMAL(36, 18) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    network wallet_network NOT NULL,
    transaction_type transaction_type NOT NULL,
    status transaction_status DEFAULT 'pending',
    
    -- Gas and fees
    gas_fee DECIMAL(36, 18),
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    
    -- Block information
    block_number BIGINT,
    block_hash VARCHAR(66),
    transaction_index INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    notes TEXT,
    internal_reference VARCHAR(100),
    exchange_rate DECIMAL(20, 8),
    usd_value DECIMAL(15, 2)
);

-- ============================================================================
-- CARD TABLES
-- ============================================================================

-- Cards table
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Card details
    card_type card_type NOT NULL,
    card_name VARCHAR(100) NOT NULL,
    card_number VARCHAR(19) UNIQUE NOT NULL,
    expiry_date VARCHAR(5) NOT NULL, -- MM/YY format
    cvv VARCHAR(4) NOT NULL,
    
    -- Financial details
    balance DECIMAL(15, 2) DEFAULT 0.00,
    spending_limit DECIMAL(15, 2) DEFAULT 1000.00,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status and metadata
    status card_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Physical card specific fields
    shipping_address JSONB,
    shipping_status shipping_status,
    tracking_number VARCHAR(100),
    
    -- Security and settings
    is_locked BOOLEAN DEFAULT FALSE,
    pin_hash VARCHAR(255),
    daily_limit DECIMAL(15, 2),
    monthly_limit DECIMAL(15, 2),
    
    -- Statistics
    total_transactions INTEGER DEFAULT 0,
    total_spent DECIMAL(15, 2) DEFAULT 0.00,
    last_transaction_at TIMESTAMP WITH TIME ZONE
);

-- Card transactions table
CREATE TABLE public.card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type card_transaction_type NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description VARCHAR(255) NOT NULL,
    
    -- Merchant information
    merchant_name VARCHAR(100),
    merchant_category VARCHAR(50),
    merchant_location VARCHAR(100),
    
    -- Transaction metadata
    status card_transaction_status DEFAULT 'completed',
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    authorization_code VARCHAR(20),
    
    -- Timestamps
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Security and tracking
    ip_address INET,
    user_agent TEXT,
    
    -- Additional data
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- KYC AND AML TABLES
-- ============================================================================

-- KYC Documents table
CREATE TABLE public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Document details
    document_type kyc_document_type NOT NULL,
    document_number VARCHAR(100),
    document_country VARCHAR(3), -- ISO country code
    document_expiry DATE,
    
    -- File storage
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_hash VARCHAR(64), -- SHA-256 hash for integrity
    
    -- Status and verification
    status kyc_status DEFAULT 'pending',
    verification_notes TEXT,
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT FALSE
);

-- KYC Verification table
CREATE TABLE public.kyc_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(3), -- ISO country code
    
    -- Address information
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(3) NOT NULL, -- ISO country code
    
    -- Verification details
    verification_level verification_level DEFAULT 'basic',
    status kyc_status DEFAULT 'pending',
    risk_score INTEGER DEFAULT 0, -- 0-100 scale
    
    -- Review information
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional data
    source_of_funds TEXT,
    occupation VARCHAR(100),
    annual_income DECIMAL(15, 2),
    purpose_of_account TEXT,
    
    -- Compliance flags
    is_pep BOOLEAN DEFAULT FALSE, -- Politically Exposed Person
    sanctions_check_passed BOOLEAN DEFAULT FALSE,
    enhanced_due_diligence BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    verification_data JSONB DEFAULT '{}',
    external_verification_id VARCHAR(100)
);

-- AML Checks table
CREATE TABLE public.aml_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    
    -- Check details
    check_type VARCHAR(50) NOT NULL, -- 'sanctions', 'pep', 'adverse_media', etc.
    risk_level aml_risk_level DEFAULT 'low',
    status aml_check_status DEFAULT 'pending',
    
    -- Results
    score INTEGER DEFAULT 0, -- 0-100 risk score
    matches_found INTEGER DEFAULT 0,
    false_positive BOOLEAN DEFAULT FALSE,
    
    -- External service data
    external_service VARCHAR(100), -- e.g., 'ComplyAdvantage', 'Refinitiv'
    external_reference VARCHAR(100),
    external_response JSONB,
    
    -- Review information
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Transaction Monitoring table
CREATE TABLE public.transaction_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Monitoring details
    rule_triggered VARCHAR(100) NOT NULL,
    risk_score INTEGER DEFAULT 0,
    alert_level aml_risk_level DEFAULT 'low',
    
    -- Alert information
    is_suspicious BOOLEAN DEFAULT FALSE,
    requires_investigation BOOLEAN DEFAULT FALSE,
    auto_blocked BOOLEAN DEFAULT FALSE,
    
    -- Investigation details
    investigated_by UUID REFERENCES public.users(id),
    investigated_at TIMESTAMP WITH TIME ZONE,
    investigation_notes TEXT,
    resolution VARCHAR(100), -- 'cleared', 'escalated', 'reported'
    
    -- Reporting
    sar_filed BOOLEAN DEFAULT FALSE, -- Suspicious Activity Report
    sar_reference VARCHAR(100),
    sar_filed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional data
    monitoring_data JSONB DEFAULT '{}',
    external_alerts JSONB DEFAULT '{}'
);

-- Compliance Reports table
CREATE TABLE public.compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Report details
    report_type VARCHAR(50) NOT NULL, -- 'sar', 'ctr', 'kyc_summary', etc.
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- Content
    report_data JSONB NOT NULL,
    file_url TEXT,
    file_hash VARCHAR(64),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'acknowledged'
    
    -- Submission details
    submitted_by UUID REFERENCES public.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    submission_reference VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Wallets table indexes
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_network ON public.wallets(network);
CREATE INDEX idx_wallets_address ON public.wallets(address);
CREATE INDEX idx_wallets_is_primary ON public.wallets(is_primary);

-- Transactions table indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_hash ON public.transactions(transaction_hash);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_network ON public.transactions(network);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_from_address ON public.transactions(from_address);
CREATE INDEX idx_transactions_to_address ON public.transactions(to_address);

-- Cards table indexes
CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_status ON public.cards(status);
CREATE INDEX idx_cards_type ON public.cards(card_type);

-- Card transactions table indexes
CREATE INDEX idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX idx_card_transactions_user_id ON public.card_transactions(user_id);
CREATE INDEX idx_card_transactions_status ON public.card_transactions(status);
CREATE INDEX idx_card_transactions_created_at ON public.card_transactions(created_at DESC);
CREATE INDEX idx_card_transactions_reference ON public.card_transactions(reference_number);

-- KYC/AML table indexes
CREATE INDEX idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_status ON public.kyc_documents(status);
CREATE INDEX idx_kyc_documents_type ON public.kyc_documents(document_type);
CREATE INDEX idx_kyc_documents_created_at ON public.kyc_documents(created_at DESC);

CREATE INDEX idx_kyc_verifications_user_id ON public.kyc_verifications(user_id);
CREATE INDEX idx_kyc_verifications_status ON public.kyc_verifications(status);
CREATE INDEX idx_kyc_verifications_level ON public.kyc_verifications(verification_level);
CREATE INDEX idx_kyc_verifications_submitted_at ON public.kyc_verifications(submitted_at DESC);
CREATE INDEX idx_kyc_verifications_country ON public.kyc_verifications(country);

CREATE INDEX idx_aml_checks_user_id ON public.aml_checks(user_id);
CREATE INDEX idx_aml_checks_transaction_id ON public.aml_checks(transaction_id);
CREATE INDEX idx_aml_checks_status ON public.aml_checks(status);
CREATE INDEX idx_aml_checks_risk_level ON public.aml_checks(risk_level);
CREATE INDEX idx_aml_checks_created_at ON public.aml_checks(created_at DESC);

CREATE INDEX idx_transaction_monitoring_transaction_id ON public.transaction_monitoring(transaction_id);
CREATE INDEX idx_transaction_monitoring_user_id ON public.transaction_monitoring(user_id);
CREATE INDEX idx_transaction_monitoring_alert_level ON public.transaction_monitoring(alert_level);
CREATE INDEX idx_transaction_monitoring_suspicious ON public.transaction_monitoring(is_suspicious);
CREATE INDEX idx_transaction_monitoring_created_at ON public.transaction_monitoring(created_at DESC);

CREATE INDEX idx_compliance_reports_type ON public.compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_status ON public.compliance_reports(status);
CREATE INDEX idx_compliance_reports_period ON public.compliance_reports(report_period_start, report_period_end);
CREATE INDEX idx_compliance_reports_created_at ON public.compliance_reports(created_at DESC);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create a new user profile after auth signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique card number
CREATE OR REPLACE FUNCTION generate_card_number()
RETURNS TEXT AS $$
DECLARE
    card_number TEXT;
    is_unique BOOLEAN := FALSE;
BEGIN
    WHILE NOT is_unique LOOP
        -- Generate 16-digit card number starting with 4 (Visa-like)
        card_number := '4' || LPAD(FLOOR(RANDOM() * 999999999999999)::TEXT, 15, '0');
        
        -- Check if number is unique
        SELECT NOT EXISTS(
            SELECT 1 FROM public.cards WHERE card_number = generate_card_number.card_number
        ) INTO is_unique;
    END LOOP;
    
    RETURN card_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate CVV
CREATE OR REPLACE FUNCTION generate_cvv()
RETURNS TEXT AS $$
BEGIN
    RETURN LPAD(FLOOR(RANDOM() * 999 + 1)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate card expiry date (3 years from now)
CREATE OR REPLACE FUNCTION generate_expiry_date()
RETURNS TEXT AS $$
BEGIN
    RETURN TO_CHAR(CURRENT_DATE + INTERVAL '3 years', 'MM/YY');
END;
$$ LANGUAGE plpgsql;

-- Function to get user's KYC level
CREATE OR REPLACE FUNCTION get_user_kyc_level(user_id UUID)
RETURNS verification_level AS $$
DECLARE
    kyc_level verification_level;
BEGIN
    SELECT kv.verification_level INTO kyc_level
    FROM public.kyc_verifications kv
    WHERE kv.user_id = get_user_kyc_level.user_id
    AND kv.status = 'approved'
    ORDER BY kv.approved_at DESC
    LIMIT 1;
    
    RETURN COALESCE(kyc_level, 'basic');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate transaction fees
CREATE OR REPLACE FUNCTION calculate_transaction_fee(
    amount DECIMAL,
    network wallet_network,
    transaction_type transaction_type
)
RETURNS DECIMAL AS $$
DECLARE
    base_fee DECIMAL := 0;
    percentage_fee DECIMAL := 0;
    final_fee DECIMAL;
BEGIN
    -- Set base fees by network
    CASE network
        WHEN 'ethereum' THEN
            base_fee := 0.001; -- ETH
            percentage_fee := 0.005; -- 0.5%
        WHEN 'polygon' THEN
            base_fee := 0.01; -- MATIC
            percentage_fee := 0.003; -- 0.3%
        WHEN 'bsc' THEN
            base_fee := 0.001; -- BNB
            percentage_fee := 0.003; -- 0.3%
        WHEN 'bitcoin' THEN
            base_fee := 0.0001; -- BTC
            percentage_fee := 0.01; -- 1%
        ELSE
            base_fee := 0.001;
            percentage_fee := 0.005;
    END CASE;
    
    -- Calculate final fee
    final_fee := base_fee + (amount * percentage_fee);
    
    -- Minimum fee of $1 equivalent
    IF final_fee < 1 THEN
        final_fee := 1;
    END IF;
    
    RETURN final_fee;
END;
$$ LANGUAGE plpgsql;

-- Function to validate wallet address format
CREATE OR REPLACE FUNCTION validate_wallet_address(address TEXT, network wallet_network)
RETURNS BOOLEAN AS $$
BEGIN
    CASE network
        WHEN 'ethereum', 'polygon', 'bsc' THEN
            -- Ethereum-style addresses (0x + 40 hex characters)
            RETURN address ~ '^0x[a-fA-F0-9]{40}$';
        WHEN 'bitcoin' THEN
            -- Bitcoin addresses (various formats)
            RETURN address ~ '^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$' OR
                   address ~ '^bc1[a-z0-9]{39,59}$';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to check spending limits
CREATE OR REPLACE FUNCTION check_spending_limits(card_id UUID, amount DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    card_record RECORD;
    daily_spent DECIMAL;
    monthly_spent DECIMAL;
BEGIN
    -- Get card record
    SELECT * INTO card_record FROM public.cards WHERE id = check_spending_limits.card_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if card has sufficient balance
    IF card_record.balance < amount THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate daily spending
    SELECT COALESCE(SUM(ct.amount), 0) INTO daily_spent
    FROM public.card_transactions ct
    WHERE ct.card_id = check_spending_limits.card_id
    AND ct.transaction_type IN ('purchase', 'fee')
    AND ct.status = 'completed'
    AND ct.transaction_date >= CURRENT_DATE;
    
    -- Calculate monthly spending
    SELECT COALESCE(SUM(ct.amount), 0) INTO monthly_spent
    FROM public.card_transactions ct
    WHERE ct.card_id = check_spending_limits.card_id
    AND ct.transaction_type IN ('purchase', 'fee')
    AND ct.status = 'completed'
    AND ct.transaction_date >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- Check daily limit
    IF card_record.daily_limit IS NOT NULL AND (daily_spent + amount) > card_record.daily_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Check monthly limit
    IF card_record.monthly_limit IS NOT NULL AND (monthly_spent + amount) > card_record.monthly_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Check spending limit
    IF (daily_spent + amount) > card_record.spending_limit THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Function to update wallet balance after transaction
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
    wallet_record RECORD;
BEGIN
    -- Get wallet record
    SELECT * INTO wallet_record FROM public.wallets WHERE id = NEW.wallet_id;
    
    IF NEW.transaction_type = 'receive' THEN
        -- Add to balance for incoming transactions
        UPDATE public.wallets 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.wallet_id;
    ELSIF NEW.transaction_type = 'send' THEN
        -- Subtract from balance for outgoing transactions
        UPDATE public.wallets 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.wallet_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update card balance after card transaction
CREATE OR REPLACE FUNCTION update_card_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'load' THEN
        -- Add to card balance
        UPDATE public.cards 
        SET balance = balance + NEW.amount,
            updated_at = NOW(),
            total_transactions = total_transactions + 1,
            last_transaction_at = NOW()
        WHERE id = NEW.card_id;
    ELSIF NEW.transaction_type IN ('purchase', 'fee') THEN
        -- Subtract from card balance
        UPDATE public.cards 
        SET balance = balance - NEW.amount,
            updated_at = NOW(),
            total_transactions = total_transactions + 1,
            total_spent = total_spent + NEW.amount,
            last_transaction_at = NOW()
        WHERE id = NEW.card_id;
    ELSIF NEW.transaction_type = 'refund' THEN
        -- Add refund to card balance
        UPDATE public.cards 
        SET balance = balance + NEW.amount,
            updated_at = NOW(),
            total_transactions = total_transactions + 1,
            total_spent = total_spent - NEW.amount,
            last_transaction_at = NOW()
        WHERE id = NEW.card_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create transaction monitoring alert
CREATE OR REPLACE FUNCTION create_transaction_alert()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    daily_total DECIMAL;
    alert_level aml_risk_level := 'low';
    requires_investigation BOOLEAN := FALSE;
BEGIN
    -- Get user record
    SELECT * INTO user_record FROM public.users WHERE id = NEW.user_id;
    
    -- Calculate daily transaction total
    SELECT COALESCE(SUM(t.amount), 0) INTO daily_total
    FROM public.transactions t
    WHERE t.user_id = NEW.user_id
    AND t.created_at >= CURRENT_DATE
    AND t.status = 'confirmed';
    
    -- Determine alert level based on amount and patterns
    IF NEW.amount > 50000 THEN
        alert_level := 'critical';
        requires_investigation := TRUE;
    ELSIF NEW.amount > 10000 OR daily_total > 25000 THEN
        alert_level := 'high';
        requires_investigation := TRUE;
    ELSIF NEW.amount > 5000 OR daily_total > 10000 THEN
        alert_level := 'medium';
    END IF;
    
    -- Create monitoring record if alert level is medium or higher
    IF alert_level != 'low' THEN
        INSERT INTO public.transaction_monitoring (
            transaction_id,
            user_id,
            rule_triggered,
            risk_score,
            alert_level,
            requires_investigation,
            monitoring_data
        ) VALUES (
            NEW.id,
            NEW.user_id,
            'large_transaction_alert',
            CASE alert_level
                WHEN 'critical' THEN 90
                WHEN 'high' THEN 70
                WHEN 'medium' THEN 50
                ELSE 20
            END,
            alert_level,
            requires_investigation,
            jsonb_build_object(
                'transaction_amount', NEW.amount,
                'daily_total', daily_total,
                'currency', NEW.currency,
                'network', NEW.network
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically create user profile on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON public.kyc_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON public.compliance_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update wallet balance when transaction is confirmed
CREATE OR REPLACE TRIGGER update_wallet_balance_trigger
    AFTER UPDATE OF status ON public.transactions
    FOR EACH ROW
    WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
    EXECUTE FUNCTION update_wallet_balance();

-- Trigger to update card balance and statistics
CREATE OR REPLACE TRIGGER update_card_balance_trigger
    AFTER INSERT ON public.card_transactions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_card_balance();

-- Trigger for transaction monitoring
CREATE OR REPLACE TRIGGER transaction_monitoring_trigger
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_alert();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.wallets IS 'Cryptocurrency wallets for different networks';
COMMENT ON TABLE public.transactions IS 'Blockchain transactions history';
COMMENT ON TABLE public.cards IS 'Virtual and physical debit cards';
COMMENT ON TABLE public.card_transactions IS 'Card transaction history';
COMMENT ON TABLE public.kyc_documents IS 'KYC document uploads and verification status';
COMMENT ON TABLE public.kyc_verifications IS 'User identity verification records';
COMMENT ON TABLE public.aml_checks IS 'Anti-money laundering screening results';
COMMENT ON TABLE public.transaction_monitoring IS 'Transaction monitoring and suspicious activity alerts';
COMMENT ON TABLE public.compliance_reports IS 'Regulatory compliance reports and submissions';

-- Function comments
COMMENT ON FUNCTION create_user_profile() IS 'Automatically create user profile when auth user is created';
COMMENT ON FUNCTION generate_card_number() IS 'Generate unique 16-digit card number';
COMMENT ON FUNCTION update_wallet_balance() IS 'Update wallet balance when transaction is confirmed';
COMMENT ON FUNCTION check_spending_limits(UUID, DECIMAL) IS 'Validate card transaction against spending limits';
COMMENT ON FUNCTION get_user_kyc_level(UUID) IS 'Get user KYC verification level';
COMMENT ON FUNCTION calculate_transaction_fee(DECIMAL, wallet_network, transaction_type) IS 'Calculate transaction fees based on network and amount';
COMMENT ON FUNCTION validate_wallet_address(TEXT, wallet_network) IS 'Validate wallet address format for specific network';

-- ============================================================================
-- END OF CONSOLIDATED SCHEMA
-- ============================================================================
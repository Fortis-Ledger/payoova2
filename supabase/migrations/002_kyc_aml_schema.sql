-- Payoova Wallet - KYC and AML Schema for Supabase
-- This file contains tables for Know Your Customer and Anti-Money Laundering compliance

-- Create KYC and AML specific types
CREATE TYPE kyc_document_type AS ENUM ('passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement');
CREATE TYPE kyc_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'expired');
CREATE TYPE aml_risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE aml_check_status AS ENUM ('pending', 'passed', 'failed', 'manual_review');
CREATE TYPE verification_level AS ENUM ('basic', 'intermediate', 'advanced');

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

-- Create indexes for KYC/AML tables
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

-- Apply updated_at triggers
CREATE TRIGGER update_kyc_documents_updated_at BEFORE UPDATE ON public.kyc_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON public.kyc_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON public.compliance_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.kyc_documents IS 'KYC document uploads and verification status';
COMMENT ON TABLE public.kyc_verifications IS 'User identity verification records';
COMMENT ON TABLE public.aml_checks IS 'Anti-money laundering screening results';
COMMENT ON TABLE public.transaction_monitoring IS 'Transaction monitoring and suspicious activity alerts';
COMMENT ON TABLE public.compliance_reports IS 'Regulatory compliance reports and submissions';
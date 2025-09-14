-- Payoova Wallet - Consolidated Supabase Configuration
-- This file contains all Supabase backend configurations, settings, and utilities
-- Created by consolidating multiple configuration files for easier management

-- ============================================================================
-- SUPABASE CONFIGURATION SETTINGS
-- ============================================================================

-- Set timezone
SET timezone = 'UTC';

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- SECURITY AND ENCRYPTION FUNCTIONS
-- ============================================================================

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key_name TEXT DEFAULT 'default')
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- In production, this should use a proper key management system
    -- For now, using a simple approach with environment variables
    encryption_key := COALESCE(
        current_setting('app.encryption_key', true),
        'default_encryption_key_change_in_production'
    );
    
    RETURN encode(
        encrypt(
            data::bytea,
            encryption_key::bytea,
            'aes'
        ),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key_name TEXT DEFAULT 'default')
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    encryption_key := COALESCE(
        current_setting('app.encryption_key', true),
        'default_encryption_key_change_in_production'
    );
    
    RETURN convert_from(
        decrypt(
            decode(encrypted_data, 'base64'),
            encryption_key::bytea,
            'aes'
        ),
        'UTF8'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL; -- Return NULL if decryption fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash passwords/PINs securely
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$ LANGUAGE plpgsql;

-- Function to verify passwords/PINs
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN crypt(password, hash) = hash;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUDIT AND LOGGING FUNCTIONS
-- ============================================================================

-- Admin action logging table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES public.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional context
    session_id VARCHAR(100),
    request_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'
);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    action_type VARCHAR(100),
    table_name VARCHAR(100) DEFAULT NULL,
    record_id UUID DEFAULT NULL,
    old_values JSONB DEFAULT NULL,
    new_values JSONB DEFAULT NULL,
    additional_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    SELECT id INTO current_user_id
    FROM public.users
    WHERE auth_user_id = auth.uid();
    
    -- Insert audit log entry
    INSERT INTO public.admin_audit_log (
        admin_user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        metadata
    ) VALUES (
        current_user_id,
        action_type,
        table_name,
        record_id,
        old_values,
        new_values,
        additional_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTIFICATION AND COMMUNICATION FUNCTIONS
-- ============================================================================

-- Notification types and preferences table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) UNIQUE NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'in_app'
    subject_template TEXT,
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Array of variable names used in template
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    
    -- Status tracking
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery channels
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,
    send_push BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=urgent
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to create user notification
CREATE OR REPLACE FUNCTION create_user_notification(
    target_user_id UUID,
    notification_type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    data JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    send_email BOOLEAN DEFAULT FALSE,
    send_sms BOOLEAN DEFAULT FALSE,
    send_push BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.user_notifications (
        user_id,
        notification_type,
        title,
        message,
        data,
        priority,
        send_email,
        send_sms,
        send_push
    ) VALUES (
        target_user_id,
        notification_type,
        title,
        message,
        data,
        priority,
        send_email,
        send_sms,
        send_push
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RATE LIMITING AND SECURITY FUNCTIONS
-- ============================================================================

-- Rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP address, user ID, etc.
    action VARCHAR(100) NOT NULL, -- 'login', 'transaction', 'api_call', etc.
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
    
    UNIQUE(identifier, action, window_start)
);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    identifier VARCHAR(255),
    action VARCHAR(100),
    max_attempts INTEGER DEFAULT 10,
    window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate window start time
    window_start := DATE_TRUNC('hour', NOW()) + 
                   (EXTRACT(MINUTE FROM NOW())::INTEGER / window_minutes) * 
                   (window_minutes || ' minutes')::INTERVAL;
    
    -- Get or create rate limit record
    INSERT INTO public.rate_limits (identifier, action, window_start, expires_at)
    VALUES (
        identifier,
        action,
        window_start,
        window_start + (window_minutes || ' minutes')::INTERVAL
    )
    ON CONFLICT (identifier, action, window_start)
    DO UPDATE SET count = rate_limits.count + 1
    RETURNING count INTO current_count;
    
    -- Check if limit exceeded
    RETURN current_count <= max_attempts;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SYSTEM HEALTH AND MONITORING
-- ============================================================================

-- System health check function
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    db_size TEXT;
    active_connections INTEGER;
    table_stats JSONB;
BEGIN
    -- Get database size
    SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
    
    -- Get active connections
    SELECT count(*) INTO active_connections
    FROM pg_stat_activity
    WHERE state = 'active';
    
    -- Get table statistics
    SELECT jsonb_object_agg(schemaname || '.' || tablename, row_count)
    INTO table_stats
    FROM (
        SELECT 
            schemaname,
            tablename,
            n_tup_ins + n_tup_upd + n_tup_del as row_count
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY row_count DESC
        LIMIT 10
    ) t;
    
    -- Build result
    result := jsonb_build_object(
        'timestamp', NOW(),
        'database_size', db_size,
        'active_connections', active_connections,
        'table_statistics', table_stats,
        'status', 'healthy'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'timestamp', NOW(),
            'status', 'error',
            'error_message', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATA CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS JSONB AS $$
DECLARE
    cleanup_stats JSONB;
    expired_notifications INTEGER;
    expired_rate_limits INTEGER;
    old_audit_logs INTEGER;
BEGIN
    -- Clean up expired notifications
    DELETE FROM public.user_notifications
    WHERE expires_at < NOW()
    AND is_read = TRUE;
    GET DIAGNOSTICS expired_notifications = ROW_COUNT;
    
    -- Clean up expired rate limits
    DELETE FROM public.rate_limits
    WHERE expires_at < NOW();
    GET DIAGNOSTICS expired_rate_limits = ROW_COUNT;
    
    -- Clean up old audit logs (keep last 90 days)
    DELETE FROM public.admin_audit_log
    WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS old_audit_logs = ROW_COUNT;
    
    -- Build cleanup statistics
    cleanup_stats := jsonb_build_object(
        'timestamp', NOW(),
        'expired_notifications_deleted', expired_notifications,
        'expired_rate_limits_deleted', expired_rate_limits,
        'old_audit_logs_deleted', old_audit_logs
    );
    
    RETURN cleanup_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BACKUP AND RECOVERY UTILITIES
-- ============================================================================

-- Function to create data export for user
CREATE OR REPLACE FUNCTION export_user_data(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_data JSONB;
    user_profile JSONB;
    user_wallets JSONB;
    user_transactions JSONB;
    user_cards JSONB;
    user_kyc JSONB;
BEGIN
    -- Get user profile
    SELECT to_jsonb(u.*) INTO user_profile
    FROM public.users u
    WHERE u.id = target_user_id;
    
    -- Get user wallets
    SELECT jsonb_agg(to_jsonb(w.*)) INTO user_wallets
    FROM public.wallets w
    WHERE w.user_id = target_user_id;
    
    -- Get user transactions
    SELECT jsonb_agg(to_jsonb(t.*)) INTO user_transactions
    FROM public.transactions t
    WHERE t.user_id = target_user_id;
    
    -- Get user cards
    SELECT jsonb_agg(to_jsonb(c.*)) INTO user_cards
    FROM public.cards c
    WHERE c.user_id = target_user_id;
    
    -- Get user KYC data
    SELECT jsonb_build_object(
        'documents', (
            SELECT jsonb_agg(to_jsonb(kd.*))
            FROM public.kyc_documents kd
            WHERE kd.user_id = target_user_id
        ),
        'verifications', (
            SELECT jsonb_agg(to_jsonb(kv.*))
            FROM public.kyc_verifications kv
            WHERE kv.user_id = target_user_id
        )
    ) INTO user_kyc;
    
    -- Combine all data
    user_data := jsonb_build_object(
        'export_timestamp', NOW(),
        'user_id', target_user_id,
        'profile', user_profile,
        'wallets', COALESCE(user_wallets, '[]'::jsonb),
        'transactions', COALESCE(user_transactions, '[]'::jsonb),
        'cards', COALESCE(user_cards, '[]'::jsonb),
        'kyc_data', COALESCE(user_kyc, '{}'::jsonb)
    );
    
    RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for audit and logging tables
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_table_record ON public.admin_audit_log(table_name, record_id);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_priority ON public.user_notifications(priority DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_expires_at ON public.user_notifications(expires_at);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- ============================================================================
-- TRIGGERS FOR AUDIT TABLES
-- ============================================================================

-- Apply updated_at triggers to new tables
CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PERMISSIONS AND SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies for admin audit log (only admins can view)
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for notification templates (only admins can manage)
CREATE POLICY "Admins can manage notification templates" ON public.notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policies for user notifications (users can view their own)
CREATE POLICY "Users can view own notifications" ON public.user_notifications
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own notifications" ON public.user_notifications
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- Policies for rate limits (system use only)
CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL USING (TRUE); -- This will be restricted by function security

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_audit_log TO authenticated;
GRANT SELECT ON public.notification_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO authenticated;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION encrypt_sensitive_data(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_sensitive_data(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action(VARCHAR, VARCHAR, UUID, JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB, INTEGER, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(VARCHAR, VARCHAR, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION system_health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;

-- ============================================================================
-- DEFAULT NOTIFICATION TEMPLATES
-- ============================================================================

-- Insert default notification templates
INSERT INTO public.notification_templates (template_name, template_type, subject_template, body_template, variables) VALUES
('welcome_email', 'email', 'Welcome to Payoova Wallet!', 'Hello {{user_name}}, welcome to Payoova Wallet! Your account has been successfully created.', '["user_name"]'),
('transaction_confirmed', 'push', 'Transaction Confirmed', 'Your {{transaction_type}} of {{amount}} {{currency}} has been confirmed.', '["transaction_type", "amount", "currency"]'),
('card_transaction', 'push', 'Card Transaction', 'Card transaction of {{amount}} {{currency}} at {{merchant_name}}.', '["amount", "currency", "merchant_name"]'),
('kyc_approved', 'email', 'KYC Verification Approved', 'Congratulations! Your KYC verification has been approved. You can now access all features.', '[]'),
('kyc_rejected', 'email', 'KYC Verification Rejected', 'Your KYC verification was rejected. Reason: {{rejection_reason}}. Please resubmit your documents.', '["rejection_reason"]'),
('security_alert', 'email', 'Security Alert', 'Security alert: {{alert_message}}. If this wasn''t you, please contact support immediately.', '["alert_message"]'),
('low_balance', 'push', 'Low Balance Alert', 'Your {{wallet_type}} balance is low: {{balance}} {{currency}}.', '["wallet_type", "balance", "currency"]'),
('large_transaction', 'email', 'Large Transaction Alert', 'A large transaction of {{amount}} {{currency}} was processed on your account.', '["amount", "currency"]')
ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- SCHEDULED JOBS (CRON-LIKE FUNCTIONS)
-- ============================================================================

-- Note: These would typically be set up using pg_cron extension or external schedulers
-- Function to run daily maintenance
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS JSONB AS $$
DECLARE
    cleanup_result JSONB;
    health_result JSONB;
BEGIN
    -- Run cleanup
    SELECT cleanup_expired_data() INTO cleanup_result;
    
    -- Run health check
    SELECT system_health_check() INTO health_result;
    
    -- Log maintenance run
    PERFORM log_admin_action(
        'daily_maintenance',
        NULL,
        NULL,
        NULL,
        jsonb_build_object(
            'cleanup_result', cleanup_result,
            'health_result', health_result
        )
    );
    
    RETURN jsonb_build_object(
        'maintenance_timestamp', NOW(),
        'cleanup_result', cleanup_result,
        'health_result', health_result,
        'status', 'completed'
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for administrative actions';
COMMENT ON TABLE public.notification_templates IS 'Templates for various notification types';
COMMENT ON TABLE public.user_notifications IS 'User notifications and alerts';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting tracking for security';

COMMENT ON FUNCTION encrypt_sensitive_data(TEXT, TEXT) IS 'Encrypt sensitive data using AES encryption';
COMMENT ON FUNCTION decrypt_sensitive_data(TEXT, TEXT) IS 'Decrypt sensitive data encrypted with encrypt_sensitive_data';
COMMENT ON FUNCTION hash_password(TEXT) IS 'Hash passwords using bcrypt with salt';
COMMENT ON FUNCTION verify_password(TEXT, TEXT) IS 'Verify password against bcrypt hash';
COMMENT ON FUNCTION log_admin_action(VARCHAR, VARCHAR, UUID, JSONB, JSONB, JSONB) IS 'Log administrative actions for audit trail';
COMMENT ON FUNCTION create_user_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB, INTEGER, BOOLEAN, BOOLEAN, BOOLEAN) IS 'Create notification for user';
COMMENT ON FUNCTION check_rate_limit(VARCHAR, VARCHAR, INTEGER, INTEGER) IS 'Check and enforce rate limits';
COMMENT ON FUNCTION system_health_check() IS 'Perform system health check and return status';
COMMENT ON FUNCTION cleanup_expired_data() IS 'Clean up expired data and return statistics';
COMMENT ON FUNCTION export_user_data(UUID) IS 'Export all user data for GDPR compliance';
COMMENT ON FUNCTION daily_maintenance() IS 'Run daily maintenance tasks';

-- ============================================================================
-- END OF CONSOLIDATED CONFIGURATION
-- ============================================================================
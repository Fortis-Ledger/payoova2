-- Payoova Wallet - Database Functions
-- This file contains custom database functions for business logic

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

-- Trigger to automatically create user profile on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

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

-- Trigger to update wallet balance when transaction is confirmed
CREATE OR REPLACE TRIGGER update_wallet_balance_trigger
    AFTER UPDATE OF status ON public.transactions
    FOR EACH ROW
    WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
    EXECUTE FUNCTION update_wallet_balance();

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

-- Trigger to update card balance and statistics
CREATE OR REPLACE TRIGGER update_card_balance_trigger
    AFTER INSERT ON public.card_transactions
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION update_card_balance();

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

-- Trigger for transaction monitoring
CREATE OR REPLACE TRIGGER transaction_monitoring_trigger
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_alert();

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

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(encrypt(data::bytea, key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN convert_from(decrypt(decode(encrypted_data, 'base64'), key::bytea, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    admin_id UUID,
    action_type TEXT,
    target_table TEXT,
    target_id UUID,
    action_data JSONB
)
RETURNS VOID AS $$
BEGIN
    -- This would typically insert into an audit log table
    -- For now, we'll use a simple notification
    PERFORM pg_notify('admin_action', jsonb_build_object(
        'admin_id', admin_id,
        'action_type', action_type,
        'target_table', target_table,
        'target_id', target_id,
        'action_data', action_data,
        'timestamp', NOW()
    )::text);
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

-- Comments for documentation
COMMENT ON FUNCTION create_user_profile() IS 'Automatically create user profile when auth user is created';
COMMENT ON FUNCTION generate_card_number() IS 'Generate unique 16-digit card number';
COMMENT ON FUNCTION update_wallet_balance() IS 'Update wallet balance when transaction is confirmed';
COMMENT ON FUNCTION check_spending_limits(UUID, DECIMAL) IS 'Validate card transaction against spending limits';
COMMENT ON FUNCTION get_user_kyc_level(UUID) IS 'Get user KYC verification level';
COMMENT ON FUNCTION calculate_transaction_fee(DECIMAL, wallet_network, transaction_type) IS 'Calculate transaction fees based on network and amount';
COMMENT ON FUNCTION validate_wallet_address(TEXT, wallet_network) IS 'Validate wallet address format for specific network';
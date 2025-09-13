-- Payoova Wallet - Initial Database Schema for Supabase
-- This file contains all the core tables for the crypto wallet application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE wallet_network AS ENUM ('ethereum', 'polygon', 'bsc', 'bitcoin');
CREATE TYPE transaction_type AS ENUM ('send', 'receive');
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');
CREATE TYPE card_type AS ENUM ('virtual', 'physical');
CREATE TYPE card_status AS ENUM ('active', 'frozen', 'cancelled', 'pending');
CREATE TYPE shipping_status AS ENUM ('processing', 'shipped', 'delivered');
CREATE TYPE card_transaction_type AS ENUM ('purchase', 'refund', 'load', 'fee');
CREATE TYPE card_transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

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

-- Create indexes for better performance
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_network ON public.wallets(network);
CREATE INDEX idx_wallets_address ON public.wallets(address);
CREATE INDEX idx_wallets_is_primary ON public.wallets(is_primary);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_hash ON public.transactions(transaction_hash);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_network ON public.transactions(network);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_from_address ON public.transactions(from_address);
CREATE INDEX idx_transactions_to_address ON public.transactions(to_address);

CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_status ON public.cards(status);
CREATE INDEX idx_cards_type ON public.cards(card_type);

CREATE INDEX idx_card_transactions_card_id ON public.card_transactions(card_id);
CREATE INDEX idx_card_transactions_user_id ON public.card_transactions(user_id);
CREATE INDEX idx_card_transactions_status ON public.card_transactions(status);
CREATE INDEX idx_card_transactions_created_at ON public.card_transactions(created_at DESC);
CREATE INDEX idx_card_transactions_reference ON public.card_transactions(reference_number);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.wallets IS 'Cryptocurrency wallets for different networks';
COMMENT ON TABLE public.transactions IS 'Blockchain transactions history';
COMMENT ON TABLE public.cards IS 'Virtual and physical debit cards';
COMMENT ON TABLE public.card_transactions IS 'Card transaction history';
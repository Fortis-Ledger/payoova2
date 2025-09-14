-- Enum types (skip creation if they already exist)
DO $$ BEGIN
    CREATE TYPE "public"."aml_check_status" AS ENUM('pending', 'passed', 'failed', 'manual_review');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."aml_risk_level" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."card_status" AS ENUM('active', 'inactive', 'blocked', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."card_transaction_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."card_transaction_type" AS ENUM('purchase', 'withdrawal', 'refund', 'fee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."card_type" AS ENUM('virtual', 'physical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."kyc_document_type" AS ENUM('passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'confirmed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."transaction_type" AS ENUM('send', 'receive', 'swap', 'stake', 'unstake', 'bridge');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."verification_level" AS ENUM('basic', 'intermediate', 'advanced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."wallet_network" AS ENUM('ethereum', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'optimism');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE "aml_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid,
	"check_type" varchar(50) NOT NULL,
	"risk_level" "aml_risk_level" DEFAULT 'low',
	"status" "aml_check_status" DEFAULT 'pending',
	"score" integer DEFAULT 0,
	"matches_found" integer DEFAULT 0,
	"false_positive" boolean DEFAULT false,
	"external_service" varchar(100),
	"external_reference" varchar(100),
	"external_response" jsonb,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "card_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "card_transaction_type" NOT NULL,
	"status" "card_transaction_status" DEFAULT 'pending',
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"exchange_rate" numeric(10, 6),
	"crypto_amount" numeric(36, 18),
	"crypto_currency" varchar(20),
	"merchant_name" varchar(255),
	"merchant_category" varchar(100),
	"merchant_country" varchar(3),
	"authorization_code" varchar(20),
	"reference_number" varchar(50),
	"provider_transaction_id" varchar(100),
	"is_online" boolean DEFAULT false,
	"is_contactless" boolean DEFAULT false,
	"decline_reason" varchar(255),
	"location" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_type" "card_type" NOT NULL,
	"status" "card_status" DEFAULT 'inactive',
	"card_number" varchar(19),
	"card_number_last4" varchar(4),
	"cardholder_name" varchar(100),
	"expiry_month" integer,
	"expiry_year" integer,
	"cvv" varchar(4),
	"pin" varchar(6),
	"daily_limit" numeric(15, 2) DEFAULT '1000.00',
	"monthly_limit" numeric(15, 2) DEFAULT '10000.00',
	"daily_spent" numeric(15, 2) DEFAULT '0.00',
	"monthly_spent" numeric(15, 2) DEFAULT '0.00',
	"is_contactless" boolean DEFAULT true,
	"is_online_enabled" boolean DEFAULT true,
	"is_atm_enabled" boolean DEFAULT true,
	"is_frozen" boolean DEFAULT false,
	"linked_wallet_id" uuid,
	"provider_card_id" varchar(100),
	"provider_data" jsonb DEFAULT '{}',
	"shipping_address" jsonb,
	"activated_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "compliance_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_type" varchar(50) NOT NULL,
	"report_period_start" date NOT NULL,
	"report_period_end" date NOT NULL,
	"report_data" jsonb NOT NULL,
	"file_url" text,
	"file_hash" varchar(64),
	"status" varchar(20) DEFAULT 'draft',
	"submitted_by" uuid,
	"submitted_at" timestamp with time zone,
	"submission_reference" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"document_type" "kyc_document_type" NOT NULL,
	"document_number" varchar(100),
	"document_country" varchar(3),
	"document_expiry" date,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"file_hash" varchar(64),
	"status" "kyc_status" DEFAULT 'pending',
	"verification_notes" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}',
	"is_primary" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "kyc_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"date_of_birth" date NOT NULL,
	"nationality" varchar(3),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state_province" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(3) NOT NULL,
	"verification_level" "verification_level" DEFAULT 'basic',
	"status" "kyc_status" DEFAULT 'pending',
	"risk_score" integer DEFAULT 0,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"rejection_reason" text,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"approved_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"source_of_funds" text,
	"occupation" varchar(100),
	"annual_income" numeric(15, 2),
	"purpose_of_account" text,
	"is_pep" boolean DEFAULT false,
	"sanctions_check_passed" boolean DEFAULT false,
	"enhanced_due_diligence" boolean DEFAULT false,
	"verification_data" jsonb DEFAULT '{}',
	"external_verification_id" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "transaction_monitoring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rule_triggered" varchar(100) NOT NULL,
	"risk_score" integer DEFAULT 0,
	"alert_level" "aml_risk_level" DEFAULT 'low',
	"is_suspicious" boolean DEFAULT false,
	"requires_investigation" boolean DEFAULT false,
	"auto_blocked" boolean DEFAULT false,
	"investigated_by" uuid,
	"investigated_at" timestamp with time zone,
	"investigation_notes" text,
	"resolution" varchar(100),
	"sar_filed" boolean DEFAULT false,
	"sar_reference" varchar(100),
	"sar_filed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"resolved_at" timestamp with time zone,
	"monitoring_data" jsonb DEFAULT '{}',
	"external_alerts" jsonb DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid,
	"type" "transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending',
	"from_address" varchar(255),
	"to_address" varchar(255),
	"amount" numeric(36, 18) NOT NULL,
	"fee" numeric(36, 18) DEFAULT '0',
	"gas_price" numeric(36, 18),
	"gas_limit" numeric(36, 18),
	"gas_used" numeric(36, 18),
	"nonce" integer,
	"block_number" numeric(20, 0),
	"block_hash" varchar(66),
	"transaction_hash" varchar(66),
	"transaction_index" integer,
	"network" "wallet_network" NOT NULL,
	"token_address" varchar(255),
	"token_symbol" varchar(20),
	"token_decimals" integer,
	"confirmations" integer DEFAULT 0,
	"is_internal" boolean DEFAULT false,
	"description" text,
	"tags" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now(),
	"confirmed_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"phone_number" varchar(20),
	"date_of_birth" date,
	"nationality" varchar(3),
	"role" "user_role" DEFAULT 'user',
	"is_email_verified" boolean DEFAULT false,
	"is_phone_verified" boolean DEFAULT false,
	"is_kyc_verified" boolean DEFAULT false,
	"kyc_level" integer DEFAULT 0,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" varchar(32),
	"last_login_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"profile_picture_url" text,
	"preferred_language" varchar(10) DEFAULT 'en',
	"preferred_currency" varchar(3) DEFAULT 'USD',
	"timezone" varchar(50) DEFAULT 'UTC',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"network" "wallet_network" NOT NULL,
	"address" varchar(255) NOT NULL,
	"private_key_encrypted" text,
	"public_key" text,
	"balance" numeric(36, 18) DEFAULT '0',
	"native_balance" numeric(36, 18) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"is_primary" boolean DEFAULT false,
	"label" varchar(100),
	"derivation_path" varchar(100),
	"wallet_index" integer DEFAULT 0,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
ALTER TABLE "aml_checks" ADD CONSTRAINT "aml_checks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aml_checks" ADD CONSTRAINT "aml_checks_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aml_checks" ADD CONSTRAINT "aml_checks_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_linked_wallet_id_wallets_id_fk" FOREIGN KEY ("linked_wallet_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_reports" ADD CONSTRAINT "compliance_reports_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_monitoring" ADD CONSTRAINT "transaction_monitoring_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_monitoring" ADD CONSTRAINT "transaction_monitoring_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_monitoring" ADD CONSTRAINT "transaction_monitoring_investigated_by_users_id_fk" FOREIGN KEY ("investigated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
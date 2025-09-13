import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, integer, jsonb, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'super_admin']);
export const walletNetworkEnum = pgEnum('wallet_network', ['ethereum', 'bitcoin', 'polygon', 'bsc', 'arbitrum', 'optimism']);
export const transactionTypeEnum = pgEnum('transaction_type', ['send', 'receive', 'swap', 'stake', 'unstake', 'bridge']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'confirmed', 'failed', 'cancelled']);
export const cardTypeEnum = pgEnum('card_type', ['virtual', 'physical']);
export const cardStatusEnum = pgEnum('card_status', ['active', 'inactive', 'blocked', 'expired']);
export const cardTransactionTypeEnum = pgEnum('card_transaction_type', ['purchase', 'withdrawal', 'refund', 'fee']);
export const cardTransactionStatusEnum = pgEnum('card_transaction_status', ['pending', 'completed', 'failed', 'cancelled']);
export const kycDocumentTypeEnum = pgEnum('kyc_document_type', ['passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement']);
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'under_review', 'approved', 'rejected', 'expired']);
export const amlRiskLevelEnum = pgEnum('aml_risk_level', ['low', 'medium', 'high', 'critical']);
export const amlCheckStatusEnum = pgEnum('aml_check_status', ['pending', 'passed', 'failed', 'manual_review']);
export const verificationLevelEnum = pgEnum('verification_level', ['basic', 'intermediate', 'advanced']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  dateOfBirth: date('date_of_birth'),
  nationality: varchar('nationality', { length: 3 }),
  role: userRoleEnum('role').default('user'),
  isEmailVerified: boolean('is_email_verified').default(false),
  isPhoneVerified: boolean('is_phone_verified').default(false),
  isKycVerified: boolean('is_kyc_verified').default(false),
  kycLevel: integer('kyc_level').default(0),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: varchar('two_factor_secret', { length: 32 }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  profilePictureUrl: text('profile_picture_url'),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('en'),
  preferredCurrency: varchar('preferred_currency', { length: 3 }).default('USD'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata').default({}),
});

// Wallets table
export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  network: walletNetworkEnum('network').notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  privateKeyEncrypted: text('private_key_encrypted'),
  publicKey: text('public_key'),
  balance: decimal('balance', { precision: 36, scale: 18 }).default('0'),
  nativeBalance: decimal('native_balance', { precision: 36, scale: 18 }).default('0'),
  isActive: boolean('is_active').default(true),
  isPrimary: boolean('is_primary').default(false),
  label: varchar('label', { length: 100 }),
  derivationPath: varchar('derivation_path', { length: 100 }),
  walletIndex: integer('wallet_index').default(0),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata').default({}),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  walletId: uuid('wallet_id').references(() => wallets.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').default('pending'),
  fromAddress: varchar('from_address', { length: 255 }),
  toAddress: varchar('to_address', { length: 255 }),
  amount: decimal('amount', { precision: 36, scale: 18 }).notNull(),
  fee: decimal('fee', { precision: 36, scale: 18 }).default('0'),
  gasPrice: decimal('gas_price', { precision: 36, scale: 18 }),
  gasLimit: decimal('gas_limit', { precision: 36, scale: 18 }),
  gasUsed: decimal('gas_used', { precision: 36, scale: 18 }),
  nonce: integer('nonce'),
  blockNumber: decimal('block_number', { precision: 20, scale: 0 }),
  blockHash: varchar('block_hash', { length: 66 }),
  transactionHash: varchar('transaction_hash', { length: 66 }),
  transactionIndex: integer('transaction_index'),
  network: walletNetworkEnum('network').notNull(),
  tokenAddress: varchar('token_address', { length: 255 }),
  tokenSymbol: varchar('token_symbol', { length: 20 }),
  tokenDecimals: integer('token_decimals'),
  confirmations: integer('confirmations').default(0),
  isInternal: boolean('is_internal').default(false),
  description: text('description'),
  tags: jsonb('tags').default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
});

// Cards table
export const cards = pgTable('cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  cardType: cardTypeEnum('card_type').notNull(),
  status: cardStatusEnum('status').default('inactive'),
  cardNumber: varchar('card_number', { length: 19 }),
  cardNumberLast4: varchar('card_number_last4', { length: 4 }),
  cardholderName: varchar('cardholder_name', { length: 100 }),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  cvv: varchar('cvv', { length: 4 }),
  pin: varchar('pin', { length: 6 }),
  dailyLimit: decimal('daily_limit', { precision: 15, scale: 2 }).default('1000.00'),
  monthlyLimit: decimal('monthly_limit', { precision: 15, scale: 2 }).default('10000.00'),
  dailySpent: decimal('daily_spent', { precision: 15, scale: 2 }).default('0.00'),
  monthlySpent: decimal('monthly_spent', { precision: 15, scale: 2 }).default('0.00'),
  isContactless: boolean('is_contactless').default(true),
  isOnlineEnabled: boolean('is_online_enabled').default(true),
  isAtmEnabled: boolean('is_atm_enabled').default(true),
  isFrozen: boolean('is_frozen').default(false),
  linkedWalletId: uuid('linked_wallet_id').references(() => wallets.id, { onDelete: 'set null' }),
  providerCardId: varchar('provider_card_id', { length: 100 }),
  providerData: jsonb('provider_data').default('{}'),
  shippingAddress: jsonb('shipping_address'),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata').default({}),
});

// Card Transactions table
export const cardTransactions = pgTable('card_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  cardId: uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: cardTransactionTypeEnum('type').notNull(),
  status: cardTransactionStatusEnum('status').default('pending'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 10, scale: 6 }),
  cryptoAmount: decimal('crypto_amount', { precision: 36, scale: 18 }),
  cryptoCurrency: varchar('crypto_currency', { length: 20 }),
  merchantName: varchar('merchant_name', { length: 255 }),
  merchantCategory: varchar('merchant_category', { length: 100 }),
  merchantCountry: varchar('merchant_country', { length: 3 }),
  authorizationCode: varchar('authorization_code', { length: 20 }),
  referenceNumber: varchar('reference_number', { length: 50 }),
  providerTransactionId: varchar('provider_transaction_id', { length: 100 }),
  isOnline: boolean('is_online').default(false),
  isContactless: boolean('is_contactless').default(false),
  declineReason: varchar('decline_reason', { length: 255 }),
  location: jsonb('location'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
});

// KYC Documents table
export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  documentType: kycDocumentTypeEnum('document_type').notNull(),
  documentNumber: varchar('document_number', { length: 100 }),
  documentCountry: varchar('document_country', { length: 3 }),
  documentExpiry: date('document_expiry'),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  fileHash: varchar('file_hash', { length: 64 }),
  status: kycStatusEnum('status').default('pending'),
  verificationNotes: text('verification_notes'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata').default('{}'),
  isPrimary: boolean('is_primary').default(false),
});

// KYC Verifications table
export const kycVerifications = pgTable('kyc_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  middleName: varchar('middle_name', { length: 100 }),
  dateOfBirth: date('date_of_birth').notNull(),
  nationality: varchar('nationality', { length: 3 }),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 3 }).notNull(),
  verificationLevel: verificationLevelEnum('verification_level').default('basic'),
  status: kycStatusEnum('status').default('pending'),
  riskScore: integer('risk_score').default(0),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  sourceOfFunds: text('source_of_funds'),
  occupation: varchar('occupation', { length: 100 }),
  annualIncome: decimal('annual_income', { precision: 15, scale: 2 }),
  purposeOfAccount: text('purpose_of_account'),
  isPep: boolean('is_pep').default(false),
  sanctionsCheckPassed: boolean('sanctions_check_passed').default(false),
  enhancedDueDiligence: boolean('enhanced_due_diligence').default(false),
  verificationData: jsonb('verification_data').default('{}'),
  externalVerificationId: varchar('external_verification_id', { length: 100 }),
});

// AML Checks table
export const amlChecks = pgTable('aml_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  checkType: varchar('check_type', { length: 50 }).notNull(),
  riskLevel: amlRiskLevelEnum('risk_level').default('low'),
  status: amlCheckStatusEnum('status').default('pending'),
  score: integer('score').default(0),
  matchesFound: integer('matches_found').default(0),
  falsePositive: boolean('false_positive').default(false),
  externalService: varchar('external_service', { length: 100 }),
  externalReference: varchar('external_reference', { length: 100 }),
  externalResponse: jsonb('external_response'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'),
});

// Transaction Monitoring table
export const transactionMonitoring = pgTable('transaction_monitoring', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  ruleTriggered: varchar('rule_triggered', { length: 100 }).notNull(),
  riskScore: integer('risk_score').default(0),
  alertLevel: amlRiskLevelEnum('alert_level').default('low'),
  isSuspicious: boolean('is_suspicious').default(false),
  requiresInvestigation: boolean('requires_investigation').default(false),
  autoBlocked: boolean('auto_blocked').default(false),
  investigatedBy: uuid('investigated_by').references(() => users.id),
  investigatedAt: timestamp('investigated_at', { withTimezone: true }),
  investigationNotes: text('investigation_notes'),
  resolution: varchar('resolution', { length: 100 }),
  sarFiled: boolean('sar_filed').default(false),
  sarReference: varchar('sar_reference', { length: 100 }),
  sarFiledAt: timestamp('sar_filed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  monitoringData: jsonb('monitoring_data').default('{}'),
  externalAlerts: jsonb('external_alerts').default('{}'),
});

// Compliance Reports table
export const complianceReports = pgTable('compliance_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportType: varchar('report_type', { length: 50 }).notNull(),
  reportPeriodStart: date('report_period_start').notNull(),
  reportPeriodEnd: date('report_period_end').notNull(),
  reportData: jsonb('report_data').notNull(),
  fileUrl: text('file_url'),
  fileHash: varchar('file_hash', { length: 64 }),
  status: varchar('status', { length: 20 }).default('draft'),
  submittedBy: uuid('submitted_by').references(() => users.id),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  submissionReference: varchar('submission_reference', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  metadata: jsonb('metadata').default('{}'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  transactions: many(transactions),
  cards: many(cards),
  cardTransactions: many(cardTransactions),
  kycDocuments: many(kycDocuments),
  kycVerifications: many(kycVerifications),
  amlChecks: many(amlChecks),
  transactionMonitoring: many(transactionMonitoring),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  linkedCards: many(cards),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  amlChecks: many(amlChecks),
  monitoring: many(transactionMonitoring),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  user: one(users, {
    fields: [cards.userId],
    references: [users.id],
  }),
  linkedWallet: one(wallets, {
    fields: [cards.linkedWalletId],
    references: [wallets.id],
  }),
  transactions: many(cardTransactions),
}));

export const cardTransactionsRelations = relations(cardTransactions, ({ one }) => ({
  card: one(cards, {
    fields: [cardTransactions.cardId],
    references: [cards.id],
  }),
  user: one(users, {
    fields: [cardTransactions.userId],
    references: [users.id],
  }),
}));

export const kycDocumentsRelations = relations(kycDocuments, ({ one }) => ({
  user: one(users, {
    fields: [kycDocuments.userId],
    references: [users.id],
  }),
  verifiedBy: one(users, {
    fields: [kycDocuments.verifiedBy],
    references: [users.id],
  }),
}));

export const kycVerificationsRelations = relations(kycVerifications, ({ one }) => ({
  user: one(users, {
    fields: [kycVerifications.userId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [kycVerifications.reviewedBy],
    references: [users.id],
  }),
}));

export const amlChecksRelations = relations(amlChecks, ({ one }) => ({
  user: one(users, {
    fields: [amlChecks.userId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [amlChecks.transactionId],
    references: [transactions.id],
  }),
  reviewedBy: one(users, {
    fields: [amlChecks.reviewedBy],
    references: [users.id],
  }),
}));

export const transactionMonitoringRelations = relations(transactionMonitoring, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionMonitoring.transactionId],
    references: [transactions.id],
  }),
  user: one(users, {
    fields: [transactionMonitoring.userId],
    references: [users.id],
  }),
  investigatedBy: one(users, {
    fields: [transactionMonitoring.investigatedBy],
    references: [users.id],
  }),
}));

export const complianceReportsRelations = relations(complianceReports, ({ one }) => ({
  submittedBy: one(users, {
    fields: [complianceReports.submittedBy],
    references: [users.id],
  }),
}));

// Export all table types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type CardTransaction = typeof cardTransactions.$inferSelect;
export type NewCardTransaction = typeof cardTransactions.$inferInsert;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type NewKycDocument = typeof kycDocuments.$inferInsert;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type NewKycVerification = typeof kycVerifications.$inferInsert;
export type AmlCheck = typeof amlChecks.$inferSelect;
export type NewAmlCheck = typeof amlChecks.$inferInsert;
export type TransactionMonitoring = typeof transactionMonitoring.$inferSelect;
export type NewTransactionMonitoring = typeof transactionMonitoring.$inferInsert;
export type ComplianceReport = typeof complianceReports.$inferSelect;
export type NewComplianceReport = typeof complianceReports.$inferInsert;
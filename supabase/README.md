# Payoova Wallet - Supabase Database Migration

This folder contains all the necessary files to migrate the Payoova Wallet application from Flask/SQLite to Supabase (PostgreSQL) with authentication.

## 📁 Folder Structure

```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql      # Core tables (users, wallets, transactions, cards)
│   └── 002_kyc_aml_schema.sql      # KYC/AML compliance tables
├── policies/
│   └── rls_policies.sql            # Row Level Security policies
├── functions/
│   └── database_functions.sql      # Custom database functions and triggers
├── supabase-config.js              # Supabase client configuration
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `payoova-wallet`
5. Enter database password (save this securely)
6. Select region closest to your users
7. Click "Create new project"

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env` in your project root:
   ```bash
   cp supabase/.env.example .env
   ```

2. Fill in your Supabase credentials:
   - Go to Project Settings > API
   - Copy Project URL and Anon Key
   - Update `.env` file with your values

### 3. Run Database Migrations

Execute the SQL files in order in your Supabase SQL Editor:

#### Step 1: Core Schema
```sql
-- Copy and paste content from migrations/001_initial_schema.sql
```

#### Step 2: KYC/AML Schema
```sql
-- Copy and paste content from migrations/002_kyc_aml_schema.sql
```

#### Step 3: Database Functions
```sql
-- Copy and paste content from functions/database_functions.sql
```

#### Step 4: Security Policies
```sql
-- Copy and paste content from policies/rls_policies.sql
```

### 4. Configure Authentication

1. Go to Authentication > Settings
2. Configure email templates (optional)
3. Set up OAuth providers if needed
4. Configure redirect URLs for your app

### 5. Set up Storage (for KYC documents)

1. Go to Storage
2. Create a new bucket: `payoova-documents`
3. Set bucket to private
4. Configure RLS policies for document access

### 6. Install Dependencies

Add Supabase to your React Native project:

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

### 7. Update Your App Configuration

1. Copy `supabase-config.js` to your `src/config/` directory
2. Update import paths as needed
3. Replace existing database calls with Supabase calls

## 📊 Database Schema Overview

### Core Tables

- **users**: User profiles (extends Supabase auth.users)
- **wallets**: Cryptocurrency wallets for different networks
- **transactions**: Blockchain transaction history
- **cards**: Virtual and physical debit cards
- **card_transactions**: Card transaction history

### Compliance Tables

- **kyc_documents**: KYC document uploads
- **kyc_verifications**: Identity verification records
- **aml_checks**: Anti-money laundering screening
- **transaction_monitoring**: Suspicious activity monitoring
- **compliance_reports**: Regulatory reports

### Key Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Real-time subscriptions**: Live updates for transactions and balances
- **Automatic triggers**: Balance updates, monitoring alerts
- **Custom functions**: Business logic in the database
- **Audit logging**: Track admin actions and changes

## 🔐 Security Features

### Row Level Security Policies

- Users can only view/modify their own data
- Admins have elevated permissions
- Automatic user profile creation on signup
- Transaction and spending limit validation

### Data Encryption

- Sensitive data encrypted at rest
- Private keys encrypted with user-specific keys
- Secure storage for KYC documents

### Compliance

- KYC verification levels (basic, intermediate, advanced)
- AML transaction monitoring
- Suspicious activity reporting
- Regulatory compliance tracking

## 🔄 Migration from Flask Backend

### Data Migration Steps

1. **Export existing data** from SQLite/PostgreSQL
2. **Transform data** to match new schema
3. **Import data** using Supabase client or SQL
4. **Verify data integrity** and relationships
5. **Update application code** to use Supabase

### Code Changes Required

1. **Authentication**: Replace JWT with Supabase Auth
2. **Database queries**: Replace SQLAlchemy with Supabase client
3. **Real-time updates**: Implement Supabase subscriptions
4. **File uploads**: Use Supabase Storage for KYC documents
5. **Admin functions**: Update admin panel to use Supabase

## 📱 React Native Integration

### Key Components to Update

1. **AuthContext**: Replace with Supabase Auth
2. **WalletContext**: Use Supabase for wallet data
3. **API calls**: Replace REST API with Supabase client
4. **Real-time updates**: Implement subscriptions
5. **File uploads**: Use Supabase Storage

### Example Usage

```javascript
import { supabase, supabaseHelpers } from './config/supabase-config';

// Get user profile
const { user, profile } = await supabaseHelpers.getCurrentUserProfile();

// Get user wallets
const wallets = await supabaseHelpers.getUserWallets(profile.id);

// Subscribe to real-time updates
const unsubscribe = supabaseHelpers.subscribeToUserData(
  profile.id,
  (type, payload) => {
    console.log('Real-time update:', type, payload);
  }
);
```

## 🧪 Testing

### Test Data Setup

1. Create test users with different KYC levels
2. Generate sample transactions and wallets
3. Test RLS policies with different user roles
4. Verify real-time subscriptions work correctly

### Security Testing

1. Verify users can't access other users' data
2. Test admin permissions and restrictions
3. Validate spending limits and transaction monitoring
4. Check KYC verification workflows

## 📈 Performance Optimization

### Database Indexes

- All foreign keys are indexed
- Common query patterns have composite indexes
- Time-based queries use descending indexes

### Query Optimization

- Use select() to limit returned columns
- Implement pagination for large datasets
- Use real-time subscriptions sparingly
- Cache frequently accessed data

## 🔧 Maintenance

### Regular Tasks

1. **Monitor database performance**
2. **Review and update RLS policies**
3. **Backup compliance data**
4. **Update KYC verification levels**
5. **Generate compliance reports**

### Scaling Considerations

- Monitor database connections
- Implement connection pooling
- Consider read replicas for analytics
- Archive old transaction data

## 🆘 Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Check user permissions and policy conditions
2. **Connection Issues**: Verify environment variables and network
3. **Real-time Not Working**: Check subscription setup and filters
4. **Migration Errors**: Verify foreign key relationships

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 📞 Contact

For questions about this migration or implementation:

- Review the code comments in each SQL file
- Check the Supabase documentation
- Test changes in a development environment first

---

**Note**: This migration provides a complete, secure, and scalable backend for the Payoova Wallet application using Supabase. All sensitive operations are protected by RLS policies, and the schema supports both basic wallet functionality and advanced compliance features.
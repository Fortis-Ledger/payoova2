# Drizzle ORM Setup for Payoova Wallet

This guide explains how to use Drizzle ORM with your Supabase database.

## 📁 Files Created

- `src/db/schema.ts` - Complete database schema with all tables and relations
- `src/db/index.ts` - Database connection and exports
- `drizzle.config.ts` - Drizzle Kit configuration
- Updated `package.json` with Drizzle scripts

## 🚀 Quick Start

### 1. Environment Setup

Make sure your `.env` file has the correct `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 2. Available Scripts

```bash
# Generate migration files from schema
npm run db:generate

# Push schema directly to database (for development)
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database browser)
npm run db:studio

# Check schema for issues
npm run db:check

# Drop all tables (⚠️ DESTRUCTIVE)
npm run db:drop
```

### 3. Push Schema to Supabase

To push your schema to Supabase:

```bash
# Option 1: Direct push (recommended for development)
npm run db:push

# Option 2: Generate and run migrations
npm run db:generate
npm run db:migrate
```

## 📊 Database Schema Overview

The schema includes all tables from your SQL migrations:

### Core Tables
- **users** - User accounts and profiles
- **wallets** - Cryptocurrency wallets
- **transactions** - All transaction records
- **cards** - Virtual and physical cards
- **card_transactions** - Card transaction history

### KYC/AML Tables
- **kyc_documents** - Document uploads
- **kyc_verifications** - Identity verification records
- **aml_checks** - Anti-money laundering checks
- **transaction_monitoring** - Transaction monitoring alerts
- **compliance_reports** - Regulatory reports

### Features
- ✅ All PostgreSQL enums defined
- ✅ Foreign key relationships
- ✅ TypeScript types auto-generated
- ✅ Drizzle relations for easy queries
- ✅ JSONB fields for flexible data
- ✅ UUID primary keys
- ✅ Timestamps with timezone

## 💻 Usage Examples

### Basic Queries

```typescript
import { db, users, wallets, transactions } from './src/db';
import { eq, desc } from 'drizzle-orm';

// Get user with wallets
const userWithWallets = await db.query.users.findFirst({
  where: eq(users.email, 'user@example.com'),
  with: {
    wallets: true,
  },
});

// Get recent transactions
const recentTransactions = await db
  .select()
  .from(transactions)
  .orderBy(desc(transactions.createdAt))
  .limit(10);

// Insert new user
const newUser = await db.insert(users).values({
  email: 'newuser@example.com',
  firstName: 'John',
  lastName: 'Doe',
}).returning();
```

### Complex Queries with Relations

```typescript
// Get user with all related data
const fullUserData = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    wallets: {
      with: {
        transactions: {
          orderBy: desc(transactions.createdAt),
          limit: 5,
        },
      },
    },
    cards: {
      with: {
        transactions: {
          orderBy: desc(cardTransactions.createdAt),
          limit: 5,
        },
      },
    },
    kycVerifications: true,
  },
});
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Error**: Verify your `DATABASE_URL` is correct
2. **Permission Error**: Ensure your database user has proper permissions
3. **Schema Conflicts**: Use `npm run db:drop` to reset (⚠️ destructive)

### Useful Commands

```bash
# Check if schema is in sync
npm run db:check

# View your database in browser
npm run db:studio

# Generate TypeScript types only
npm run db:generate
```

## 📚 Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Supabase + Drizzle Guide](https://orm.drizzle.team/learn/tutorials/drizzle-with-supabase)

---

**Note**: The schema is based on your existing SQL migrations and includes all tables, enums, and relationships. You can now use Drizzle ORM for type-safe database operations!
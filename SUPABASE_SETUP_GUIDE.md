# Supabase Setup Guide for Payoova Crypto Wallet

This guide will help you set up Supabase with Google OAuth for smooth platform operation including sign-in and sign-up functionality.

## 🚀 Required Supabase APIs and Services

### Core Supabase Services Needed:

1. **Database** - PostgreSQL database for storing user data, wallets, transactions
2. **Authentication** - User authentication with Google OAuth
3. **Storage** - File storage for KYC documents and user uploads
4. **Real-time** - Live updates for transactions and wallet balances
5. **Edge Functions** - Server-side logic for complex operations
6. **Row Level Security (RLS)** - Data protection and access control

## 📋 Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/Login with GitHub
4. Click "New Project"
5. Choose your organization
6. Fill in project details:
   - **Name**: `payoova-wallet`
   - **Database Password**: Use a strong password
   - **Region**: Choose closest to your users
7. Click "Create new project"

### 2. Get Supabase Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values to your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Go to **Settings** → **Database**
4. Copy the connection string:
   ```env
   SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres
   ```

### 3. Set Up Google OAuth

#### A. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. Create OAuth 2.0 credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client IDs**
   - Choose **Web application**
   - Add authorized redirect URIs:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```
   - Copy **Client ID** and **Client Secret**

#### B. Supabase Auth Configuration

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click **Enable**
3. Enter your Google OAuth credentials:
   - **Client ID**: Your Google Client ID
   - **Client Secret**: Your Google Client Secret
4. Click **Save**

#### C. Update Environment Variables

Add to your `.env` file:
```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase Auth Configuration
SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=true
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret
```

### 4. Database Setup

#### A. Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Run the migration files in order:
   - First: `supabase/migrations/001_initial_schema.sql`
   - Second: `supabase/migrations/002_kyc_aml_schema.sql`
   - Third: `supabase/functions/database_functions.sql`
   - Fourth: `supabase/policies/rls_policies.sql`

#### B. Set Up Storage

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket:
   - **Name**: `documents`
   - **Public**: `false` (private bucket for KYC documents)
3. Set up storage policies for secure file access

### 5. Configure Real-time

1. Go to **Database** → **Replication**
2. Enable real-time for these tables:
   - `users`
   - `wallets`
   - `transactions`
   - `cards`
   - `card_transactions`

### 6. Environment Configuration

Your complete `.env` file should include:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Supabase Auth
SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=true
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-google-client-secret

# Storage
SUPABASE_STORAGE_URL=https://your-project-id.supabase.co/storage/v1
VITE_SUPABASE_STORAGE_BUCKET=documents
```

## 🧪 Testing the Setup

### 1. Start the Application

```bash
npm run dev
```

### 2. Test Supabase Integration

Visit: `http://localhost:5173/supabase-test`

This page will show:
- ✅ All context providers loaded
- ✅ Supabase connection status
- ✅ Available methods for each service

### 3. Test Google OAuth

1. Go to the login page
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify user is created in Supabase Auth dashboard

## 🔧 Required Supabase Features

### Authentication Features:
- ✅ Email/Password authentication
- ✅ Google OAuth provider
- ✅ JWT token management
- ✅ User sessions
- ✅ Password reset

### Database Features:
- ✅ PostgreSQL database
- ✅ Row Level Security (RLS)
- ✅ Real-time subscriptions
- ✅ Custom functions
- ✅ Triggers and constraints

### Storage Features:
- ✅ File upload/download
- ✅ Private buckets
- ✅ Access policies
- ✅ File metadata

### API Features:
- ✅ REST API
- ✅ GraphQL API (optional)
- ✅ Real-time API
- ✅ Edge Functions

## 🛡️ Security Configuration

### 1. Row Level Security Policies

Ensure RLS is enabled on all tables:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ... for all tables
```

### 2. API Key Security

- **Anon Key**: Safe for frontend use
- **Service Role Key**: Keep secret, server-side only
- **JWT Secret**: Used for token verification

### 3. CORS Configuration

In Supabase dashboard → **Settings** → **API**:
- Add your domain to allowed origins
- Configure for development: `http://localhost:5173`
- Configure for production: `https://your-domain.com`

## 🚀 Production Deployment

### 1. Environment Variables

Update production environment with:
- Production Supabase URL
- Production Google OAuth credentials
- Production domain in CORS settings

### 2. Database Optimization

- Enable connection pooling
- Set up database backups
- Monitor performance metrics

### 3. Security Hardening

- Review and test all RLS policies
- Enable audit logging
- Set up monitoring and alerts

## 📞 Support and Troubleshooting

### Common Issues:

1. **Google OAuth not working**:
   - Check redirect URIs in Google Console
   - Verify client ID/secret in Supabase
   - Ensure Google+ API is enabled

2. **Database connection issues**:
   - Verify connection string format
   - Check database password
   - Ensure IP allowlisting if needed

3. **Real-time not working**:
   - Enable replication for tables
   - Check RLS policies
   - Verify subscription setup

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

## ✅ Checklist

Before going live, ensure:

- [ ] Supabase project created and configured
- [ ] Google OAuth set up and tested
- [ ] Database migrations run successfully
- [ ] RLS policies implemented and tested
- [ ] Storage bucket created and configured
- [ ] Real-time subscriptions enabled
- [ ] Environment variables set correctly
- [ ] Application tested with `/supabase-test` route
- [ ] Google sign-in/sign-up working
- [ ] Production environment configured

Once all items are checked, your Payoova crypto wallet will run smoothly with Supabase backend and Google OAuth authentication! 🎉
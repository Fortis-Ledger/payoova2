# Supabase Migration Guide for Payoova Wallet

This guide provides step-by-step instructions for migrating from Flask/SQLite backend to Supabase.

## 🚀 Quick Start

### 1. Supabase Project Setup

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com/dashboard
   # Create new project
   # Note down your project URL and anon key
   ```

2. **Set Environment Variables**
   ```bash
   # Copy the example file
   cp supabase/.env.example .env
   
   # Update with your Supabase credentials
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 2. Database Migration

1. **Run Schema Migrations**
   ```sql
   -- In Supabase SQL Editor, run in order:
   -- 1. supabase/migrations/001_initial_schema.sql
   -- 2. supabase/migrations/002_kyc_aml_schema.sql
   ```

2. **Apply RLS Policies**
   ```sql
   -- Run in Supabase SQL Editor:
   -- supabase/policies/rls_policies.sql
   ```

3. **Create Database Functions**
   ```sql
   -- Run in Supabase SQL Editor:
   -- supabase/functions/database_functions.sql
   ```

### 3. Authentication Setup

1. **Configure Auth Providers**
   - Go to Authentication > Settings in Supabase Dashboard
   - Enable Email/Password authentication
   - Configure any social providers if needed
   - Set up email templates

2. **Update Auth URLs**
   - Site URL: `your-app-url`
   - Redirect URLs: Add your app's redirect URLs

### 4. Storage Setup

1. **Create Storage Buckets**
   ```sql
   -- Create buckets for file uploads
   INSERT INTO storage.buckets (id, name, public)
   VALUES 
     ('kyc-documents', 'kyc-documents', false),
     ('profile-images', 'profile-images', true);
   ```

2. **Set Storage Policies**
   ```sql
   -- Allow users to upload their own KYC documents
   CREATE POLICY "Users can upload own KYC documents" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Allow users to view their own KYC documents
   CREATE POLICY "Users can view own KYC documents" ON storage.objects
   FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

## 📱 Frontend Migration

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

### 2. Update App.js

```javascript
// Replace old context providers with new Supabase ones
import { SupabaseAuthProvider } from './src/contexts/SupabaseAuthContext';
import { WalletProvider } from './src/contexts/SupabaseWalletContext';
import { UserProvider } from './src/contexts/SupabaseUserContext';
import { KYCProvider } from './src/contexts/SupabaseKYCContext';
import { CardProvider } from './src/contexts/SupabaseCardContext';

export default function App() {
  return (
    <SupabaseAuthProvider>
      <UserProvider>
        <WalletProvider>
          <KYCProvider>
            <CardProvider>
              {/* Your app components */}
            </CardProvider>
          </KYCProvider>
        </WalletProvider>
      </UserProvider>
    </SupabaseAuthProvider>
  );
}
```

### 3. Update Component Imports

```javascript
// Old imports
// import { useAuth } from './contexts/AuthContext';
// import { useWallet } from './contexts/WalletContext';

// New imports
import { useAuth } from './contexts/SupabaseAuthContext';
import { useWallet } from './contexts/SupabaseWalletContext';
import { useUser } from './contexts/SupabaseUserContext';
import { useKYC } from './contexts/SupabaseKYCContext';
import { useCard } from './contexts/SupabaseCardContext';
```

## 🔄 Data Migration

### 1. Export Existing Data

```python
# Run this script to export data from Flask/SQLite
python scripts/export_data.py
```

### 2. Import to Supabase

```javascript
// Use the migration script
node scripts/import_to_supabase.js
```

### 3. Verify Data Integrity

```sql
-- Check user count
SELECT COUNT(*) FROM users;

-- Check wallet count
SELECT COUNT(*) FROM wallets;

-- Check transaction count
SELECT COUNT(*) FROM transactions;
```

## 🧪 Testing

### 1. Test Authentication

```javascript
// Test sign up
const { signUp } = useAuth();
const result = await signUp('test@example.com', 'password123');

// Test sign in
const { signIn } = useAuth();
const result = await signIn('test@example.com', 'password123');
```

### 2. Test Wallet Operations

```javascript
// Test wallet creation
const { createWallet } = useWallet();
const wallet = await createWallet('ethereum', 'My ETH Wallet');

// Test transaction
const { sendTransaction } = useWallet();
const tx = await sendTransaction(walletId, toAddress, amount, 'ETH', 'ethereum');
```

### 3. Test KYC Flow

```javascript
// Test document upload
const { uploadKYCDocument } = useKYC();
const doc = await uploadKYCDocument('ID_CARD', file);

// Test KYC submission
const { submitKYCForVerification } = useKYC();
const verification = await submitKYCForVerification(personalInfo);
```

### 4. Test Card Operations

```javascript
// Test card creation
const { createCard } = useCard();
const card = await createCard('VIRTUAL', walletId, 'My Virtual Card');

// Test card loading
const { loadMoneyToCard } = useCard();
const transaction = await loadMoneyToCard(cardId, 100, sourceWalletId);
```

## 🔒 Security Checklist

### 1. Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Users can only access their own data
- ✅ Admin functions are properly protected
- ✅ Sensitive data is encrypted

### 2. Authentication
- ✅ Strong password requirements
- ✅ Email verification enabled
- ✅ Session management configured
- ✅ JWT secrets are secure

### 3. API Security
- ✅ Service role key is protected
- ✅ Anon key has limited permissions
- ✅ Rate limiting is configured
- ✅ CORS is properly set up

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```
   Error: Invalid JWT
   Solution: Check your Supabase URL and keys in .env
   ```

2. **RLS Policy Errors**
   ```
   Error: Row level security policy violation
   Solution: Ensure user is authenticated and policies are correct
   ```

3. **Storage Upload Errors**
   ```
   Error: Storage bucket not found
   Solution: Create storage buckets and set proper policies
   ```

4. **Real-time Subscription Errors**
   ```
   Error: Subscription failed
   Solution: Check if real-time is enabled for your tables
   ```

### Debug Mode

```javascript
// Enable debug mode in supabase-config.js
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true
  }
});
```

## 📊 Performance Optimization

### 1. Database Indexes

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_cards_user_id ON cards(user_id);
```

### 2. Query Optimization

```javascript
// Use select() to limit returned columns
const { data } = await supabase
  .from('transactions')
  .select('id, amount, created_at, status')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);
```

### 3. Caching Strategy

```javascript
// Cache frequently accessed data
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache user profile
const cacheUserProfile = async (profile) => {
  await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
};

// Get cached profile
const getCachedProfile = async () => {
  const cached = await AsyncStorage.getItem('userProfile');
  return cached ? JSON.parse(cached) : null;
};
```

## 🔄 Rollback Plan

If you need to rollback to the Flask backend:

1. **Keep Flask Backend Running**
   - Don't shut down Flask server immediately
   - Keep database backups

2. **Switch Context Providers**
   ```javascript
   // Revert to old context providers in App.js
   import { AuthProvider } from './src/contexts/AuthContext';
   import { WalletProvider } from './src/contexts/WalletContext';
   ```

3. **Update Environment Variables**
   ```bash
   # Switch back to Flask API endpoints
   API_BASE_URL=http://localhost:5000
   ```

## 📞 Support

If you encounter issues during migration:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the error logs in Supabase Dashboard
3. Check the browser console for client-side errors
4. Verify your environment variables
5. Ensure all migrations have been run successfully

## 🎉 Post-Migration

After successful migration:

1. **Monitor Performance**
   - Check Supabase Dashboard for usage metrics
   - Monitor API response times
   - Watch for any error patterns

2. **Update Documentation**
   - Update API documentation
   - Update deployment guides
   - Update team onboarding docs

3. **Cleanup**
   - Remove old Flask backend files (after confirming stability)
   - Remove old database files
   - Update CI/CD pipelines

4. **Celebrate! 🎊**
   - You've successfully migrated to a modern, scalable backend!
   - Enjoy the benefits of real-time updates, automatic scaling, and built-in security.
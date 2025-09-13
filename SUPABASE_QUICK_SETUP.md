# 🚀 Supabase Quick Setup - Essential APIs

## Required Supabase APIs for Payoova

### 1. **Authentication API** 🔐
```javascript
// Sign up with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
const { error } = await supabase.auth.signOut()
```

### 2. **Database API** 💾
```javascript
// Insert user data
const { data, error } = await supabase
  .from('users')
  .insert([{ email, full_name, auth_id }])

// Get user wallets
const { data, error } = await supabase
  .from('wallets')
  .select('*')
  .eq('user_id', userId)

// Real-time subscriptions
const subscription = supabase
  .channel('transactions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions'
  }, (payload) => {
    console.log('New transaction:', payload)
  })
  .subscribe()
```

### 3. **Storage API** 📁
```javascript
// Upload KYC document
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`kyc/${userId}/passport.jpg`, file)

// Get file URL
const { data } = supabase.storage
  .from('documents')
  .getPublicUrl('kyc/user123/passport.jpg')
```

## Essential Environment Variables

```env
# 🔑 REQUIRED - Get from Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 🔑 REQUIRED - Get from Google Cloud Console
VITE_GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

# 🔑 REQUIRED - Database Connection
SUPABASE_DB_URL=postgresql://postgres:[password]@db.your-project-id.supabase.co:5432/postgres
```

## 🎯 5-Minute Setup Steps

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → "New Project"
2. Name: `payoova-wallet`
3. Set strong database password
4. Choose region closest to users

### Step 2: Get API Keys
1. Dashboard → **Settings** → **API**
2. Copy `URL` and `anon public` key
3. Copy `service_role secret` key

### Step 3: Setup Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/) → New Project
2. **APIs & Services** → **Credentials** → **OAuth 2.0 Client ID**
3. Authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret

### Step 4: Configure Supabase Auth
1. Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Google**
3. Enter Google Client ID and Secret
4. Save

### Step 5: Run Database Setup
1. Dashboard → **SQL Editor**
2. Run migration files:
   ```sql
   -- Run supabase/migrations/001_initial_schema.sql
   -- Run supabase/migrations/002_kyc_aml_schema.sql
   -- Run supabase/functions/database_functions.sql
   -- Run supabase/policies/rls_policies.sql
   ```

### Step 6: Test Setup
1. Start app: `npm run dev`
2. Visit: `http://localhost:5173/supabase-test`
3. Test Google sign-in

## ✅ Success Indicators

**Your platform will run smoothly when you see:**

- ✅ Supabase connection: **Connected**
- ✅ Google OAuth: **Working**
- ✅ Database: **Tables created**
- ✅ Storage: **Bucket ready**
- ✅ Real-time: **Subscriptions active**

## 🔧 Core APIs Used by Payoova

| Feature | Supabase API | Purpose |
|---------|--------------|----------|
| **User Auth** | `auth.signInWithOAuth()` | Google sign-in/sign-up |
| **User Data** | `from('users').select()` | Profile management |
| **Wallets** | `from('wallets').insert()` | Crypto wallet creation |
| **Transactions** | `from('transactions').insert()` | Transaction logging |
| **KYC Docs** | `storage.upload()` | Document verification |
| **Cards** | `from('cards').select()` | Virtual card management |
| **Real-time** | `channel().on()` | Live updates |
| **Security** | Row Level Security | Data protection |

## 🚨 Critical Configuration

**For Google Sign-in to work:**
```env
# These MUST match exactly
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**For smooth operation:**
```env
# Enable real-time features
VITE_SUPABASE_REALTIME_ENABLED=true

# Storage configuration
VITE_SUPABASE_STORAGE_BUCKET=documents

# Security
SUPABASE_JWT_SECRET=your-jwt-secret
```

## 🎉 Ready to Go!

Once configured, your Payoova platform will have:
- 🔐 **Secure Google Authentication**
- 💾 **PostgreSQL Database**
- 📁 **File Storage for KYC**
- ⚡ **Real-time Updates**
- 🛡️ **Row-level Security**
- 🚀 **Production-ready APIs**

**Test URL:** `http://localhost:5173/supabase-test`

---

*Need help? Check the full setup guide: `SUPABASE_SETUP_GUIDE.md`*
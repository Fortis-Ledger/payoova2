# Manual RLS Policy Fix for Infinite Recursion

The infinite recursion error is caused by problematic helper functions in the RLS policies. Follow these steps to fix it:

## 🚨 URGENT: Apply These SQL Commands in Supabase SQL Editor

### Step 1: Drop Problematic Functions and Policies

Go to your Supabase Dashboard → SQL Editor and run this SQL:

```sql
-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can create own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

-- Drop the problematic helper functions that cause infinite recursion
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_user_id();
```

### Step 2: Create New Safe Policies

After dropping the old policies, run this SQL to create new safe policies:

```sql
-- Enable RLS on tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES (safe, no recursion)
-- Using 'id' column which contains the auth user ID
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND role = OLD.role);

CREATE POLICY "Allow user creation" ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());

-- WALLETS TABLE POLICIES (safe, no recursion)
CREATE POLICY "Users can view own wallets" ON public.wallets
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can create own wallets" ON public.wallets
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update own wallets" ON public.wallets
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE id = auth.uid()));

-- TRANSACTIONS TABLE POLICIES (safe, no recursion)
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (
        from_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
        OR to_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
    );

CREATE POLICY "Users can create transactions from own wallets" ON public.transactions
    FOR INSERT WITH CHECK (
        from_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
    );

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (
        from_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
        OR to_wallet_id IN (SELECT id FROM public.wallets WHERE user_id IN (SELECT id FROM public.users WHERE id = auth.uid()))
    );
```

### Step 3: Verify the Fix

After applying the policies, test the connection:

```bash
node test_supabase_connection.js
```

## 🔍 What Was Wrong?

The original RLS policies had helper functions `is_admin()` and `get_user_id()` that:
1. Were called from within RLS policies
2. Tried to query the same tables that the policies were protecting
3. This created infinite recursion when PostgreSQL tried to evaluate the policies

## ✅ The Fix

1. **Removed helper functions** that caused recursion
2. **Used direct `auth.uid()` checks** instead of helper functions
3. **Simplified policy logic** to avoid circular dependencies
4. **Removed admin policies** that relied on problematic functions

## 📝 Notes

- Admin access should now be handled at the application level using the service role key
- The new policies are simpler but still secure
- Users can only access their own data
- No more infinite recursion!

## 🚀 After Fixing

Once the policies are applied:
1. Test the Supabase connection
2. Start the React app
3. Verify user registration and login work
4. Check that the infinite loading screen is resolved
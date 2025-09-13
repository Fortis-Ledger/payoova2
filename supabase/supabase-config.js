// Supabase Configuration for Payoova Wallet
// This file contains the Supabase client setup and configuration

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Custom storage adapter for React Native
const customStorageAdapter = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in AsyncStorage:', error);
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
    }
  },
};

// Supabase client options
const supabaseOptions = {
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': `payoova-wallet-${Platform.OS}`,
    },
  },
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Database table names (for consistency)
export const TABLES = {
  USERS: 'users',
  WALLETS: 'wallets',
  TRANSACTIONS: 'transactions',
  CARDS: 'cards',
  CARD_TRANSACTIONS: 'card_transactions',
  KYC_DOCUMENTS: 'kyc_documents',
  KYC_VERIFICATIONS: 'kyc_verifications',
  AML_CHECKS: 'aml_checks',
  TRANSACTION_MONITORING: 'transaction_monitoring',
  COMPLIANCE_REPORTS: 'compliance_reports',
};

// Database enums (for type safety)
export const ENUMS = {
  USER_ROLE: {
    USER: 'user',
    ADMIN: 'admin',
  },
  WALLET_NETWORK: {
    ETHEREUM: 'ethereum',
    POLYGON: 'polygon',
    BSC: 'bsc',
    BITCOIN: 'bitcoin',
  },
  TRANSACTION_TYPE: {
    SEND: 'send',
    RECEIVE: 'receive',
  },
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },
  CARD_TYPE: {
    VIRTUAL: 'virtual',
    PHYSICAL: 'physical',
  },
  CARD_STATUS: {
    ACTIVE: 'active',
    FROZEN: 'frozen',
    CANCELLED: 'cancelled',
    PENDING: 'pending',
  },
  KYC_STATUS: {
    PENDING: 'pending',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
  },
  VERIFICATION_LEVEL: {
    BASIC: 'basic',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
  },
  AML_RISK_LEVEL: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
};

// Helper functions for common operations
export const supabaseHelpers = {
  // Get current user profile
  getCurrentUserProfile: async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('No authenticated user');
      }

      const { data: profile, error: profileError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      return { user, profile };
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  },

  // Check if user is admin
  isAdmin: async () => {
    try {
      const { profile } = await supabaseHelpers.getCurrentUserProfile();
      return profile?.role === ENUMS.USER_ROLE.ADMIN;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  // Get user's wallets
  getUserWallets: async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.WALLETS)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user wallets:', error);
      throw error;
    }
  },

  // Get user's transactions
  getUserTransactions: async (userId, limit = 50, offset = 0) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select(`
          *,
          wallets:wallet_id(network, address)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  },

  // Get user's cards
  getUserCards: async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.CARDS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user cards:', error);
      throw error;
    }
  },

  // Subscribe to real-time updates
  subscribeToUserData: (userId, callback) => {
    const channels = [];

    // Subscribe to transactions
    const transactionChannel = supabase
      .channel('user-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.TRANSACTIONS,
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback('transaction', payload);
        }
      )
      .subscribe();

    // Subscribe to wallets
    const walletChannel = supabase
      .channel('user-wallets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.WALLETS,
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback('wallet', payload);
        }
      )
      .subscribe();

    // Subscribe to cards
    const cardChannel = supabase
      .channel('user-cards')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.CARDS,
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback('card', payload);
        }
      )
      .subscribe();

    channels.push(transactionChannel, walletChannel, cardChannel);

    // Return unsubscribe function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  },

  // Handle errors consistently
  handleError: (error, context = '') => {
    console.error(`Supabase error ${context}:`, error);
    
    // Common error handling
    if (error?.code === 'PGRST116') {
      return { error: 'No data found', code: 'NOT_FOUND' };
    }
    
    if (error?.code === '23505') {
      return { error: 'Duplicate entry', code: 'DUPLICATE' };
    }
    
    if (error?.code === '42501') {
      return { error: 'Permission denied', code: 'PERMISSION_DENIED' };
    }
    
    return { error: error?.message || 'Unknown error', code: 'UNKNOWN' };
  },
};

// Export default client
export default supabase;
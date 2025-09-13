import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  console.error('Required variables:')
  console.error('- VITE_SUPABASE_URL')
  console.error('- VITE_SUPABASE_ANON_KEY')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'payoova-wallet'
    }
  }
})

// Auth configuration
export const authConfig = {
  redirectTo: `${window.location.origin}/auth/callback`,
  providers: {
    google: {
      scopes: 'email profile'
    }
  }
}

// Storage configuration
export const storageConfig = {
  buckets: {
    documents: 'documents',
    avatars: 'avatars'
  },
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: {
    documents: ['pdf', 'jpg', 'jpeg', 'png'],
    avatars: ['jpg', 'jpeg', 'png', 'webp']
  }
}

// Database enums (for type safety)
export const ENUMS = {
  USER_ROLE: {
    USER: 'user',
    ADMIN: 'admin',
  },
  USER_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    PENDING: 'pending',
    DELETED: 'deleted',
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
  CARD_TRANSACTION_TYPE: {
    LOAD: 'load',
    PURCHASE: 'purchase',
    WITHDRAWAL: 'withdrawal',
  },
  CARD_TRANSACTION_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },
  KYC_STATUS: {
    NOT_STARTED: 'not_started',
    PENDING: 'pending',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
  },
  DOCUMENT_TYPE: {
    ID_CARD: 'id_card',
    PASSPORT: 'passport',
    DRIVERS_LICENSE: 'drivers_license',
    PROOF_OF_ADDRESS: 'proof_of_address',
  },
  DOCUMENT_STATUS: {
    UPLOADED: 'uploaded',
    SUBMITTED: 'submitted',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
  },
  AML_STATUS: {
    PENDING: 'pending',
    CLEAR: 'clear',
    FLAGGED: 'flagged',
  },
  VERIFICATION_LEVEL: {
    BASIC: 'basic',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
  },
};

// Database table names
export const TABLES = {
  users: 'users',
  wallets: 'wallets',
  transactions: 'transactions',
  cards: 'cards',
  cardTransactions: 'card_transactions',
  kycDocuments: 'kyc_documents',
  kycVerifications: 'kyc_verifications',
  amlChecks: 'aml_checks'
}

// Real-time channels
export const channels = {
  transactions: 'transactions',
  wallets: 'wallets',
  cards: 'cards',
  notifications: 'notifications'
}

// Helper functions
export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    return false
  }
  return true
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authConfig.redirectTo,
      scopes: authConfig.providers.google.scopes
    }
  })
  
  if (error) {
    console.error('Error signing in with Google:', error)
    return { success: false, error }
  }
  
  return { success: true, data }
}

// Connection test
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
      return { connected: false, error: error.message }
    }
    return { connected: true, message: 'Successfully connected to Supabase' }
  } catch (err) {
    console.error('Supabase connection test error:', err)
    return { connected: false, error: err.message }
  }
}

export default supabase
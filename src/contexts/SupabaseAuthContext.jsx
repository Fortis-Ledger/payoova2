// Supabase AuthContext for Payoova Wallet
// This replaces the custom JWT authentication with Supabase Auth

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getUser, signOut, signInWithGoogle, ENUMS, TABLES } from '../config/supabase-config';

// Create Auth Context
const AuthContext = createContext({});

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session) {
          await handleSignIn(session);
        } else if (event === 'SIGNED_OUT') {
          await handleSignOut();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          setUser(session.user);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Initialize authentication state
  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing auth...');
      setLoading(true);
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        // Don't return early - still need to set loading to false
      } else if (session) {
        console.log('✅ Session found, handling sign in...');
        await handleSignIn(session);
      } else {
        console.log('ℹ️ No session found, user not authenticated');
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
    } finally {
      console.log('✅ Auth initialization complete, setting loading to false');
      setLoading(false);
    }
  };

  // Handle successful sign in
  const handleSignIn = async (session) => {
    try {
      console.log('🔄 Handling sign in for user:', session.user.id);
      setSession(session);
      setUser(session.user);

      // Get user profile
      console.log('🔍 Fetching user profile...');
      const { data: userProfile, error } = await supabase
        .from(TABLES.users)
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('👤 User profile not found, creating new profile...');
          await createUserProfile(session.user);
          return;
        }
      } else {
        console.log('✅ User profile found:', userProfile);
        setProfile(userProfile);
        setIsAdmin(userProfile.role === 'admin');
        
        // Store user data locally
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
      }
    } catch (error) {
      console.error('Error handling sign in:', error);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsAdmin(false);
      
      // Clear local storage
      localStorage.removeItem('userProfile');
      localStorage.removeItem('walletData');
      localStorage.removeItem('transactionHistory');
    } catch (error) {
      console.error('Error handling sign out:', error);
    }
  };

  // Create user profile after signup
  const createUserProfile = async (authUser) => {
    try {
      console.log('👤 Creating user profile for:', authUser.email);
      const newProfile = {
        auth_user_id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email,
        role: 'user',
        is_active: true,
        preferred_currency: 'USD',
        notification_preferences: {},
        security_preferences: {}
      };

      console.log('📝 Inserting profile data:', newProfile);
      const { data, error } = await supabase
        .from(TABLES.users)
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting user profile:', error);
        throw error;
      }

      console.log('✅ User profile created successfully:', data);
      setProfile(data);
      setIsAdmin(data.role === 'admin');
      
      // Store user data locally
      localStorage.setItem('userProfile', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || email,
            ...userData
          }
        }
      });

      if (error) {
        throw error;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('Check your email - We sent you a confirmation link. Please check your email and click the link to verify your account.');
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Password Reset',
        'Check your email for a password reset link.'
      );

      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Password updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (!profile) {
        throw new Error('No user profile found');
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
      localStorage.setItem('userProfile', JSON.stringify(data));
      
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  // Update auth user metadata
  const updateAuthUser = async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Update auth user error:', error);
      return { data: null, error };
    }
  };

  // Check if user has required KYC level
  const hasRequiredKYCLevel = async (requiredLevel = 'basic') => {
    try {
      if (!profile) return false;

      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('verification_level, status')
        .eq('user_id', profile.id)
        .eq('status', ENUMS.KYC_STATUS.APPROVED)
        .order('approved_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return false;

      const levels = ['basic', 'intermediate', 'advanced'];
      const userLevelIndex = levels.indexOf(data.verification_level);
      const requiredLevelIndex = levels.indexOf(requiredLevel);

      return userLevelIndex >= requiredLevelIndex;
    } catch (error) {
      console.error('Error checking KYC level:', error);
      return false;
    }
  };

  // Get user's KYC status
  const getKYCStatus = async () => {
    try {
      if (!profile) return null;

      const { data, error } = await supabase
        .from('kyc_verifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting KYC status:', error);
      return null;
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    try {
      if (!user) return;

      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(userProfile);
      setIsAdmin(userProfile.role === ENUMS.USER_ROLE.ADMIN);
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      
      return userProfile;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    // State
    user,
    profile,
    session,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    
    // Auth methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    
    // Profile methods
    updateProfile,
    updateAuthUser,
    refreshUserData,
    
    // KYC methods
    hasRequiredKYCLevel,
    getKYCStatus,
    
    // Utility methods
    createUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
// Supabase UserContext for Payoova Wallet
// This replaces custom user management with Supabase database operations

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, ENUMS, TABLES } from '../config/supabase-config';
import { useAuth } from './SupabaseAuthContext';

// Create User Context
const UserContext = createContext({});

// Custom hook to use user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// User Provider Component
export const UserProvider = ({ children }) => {
  const { profile, isAuthenticated, isAdmin } = useAuth();
  
  // State
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [adminLogs, setAdminLogs] = useState([]);
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  // Initialize user data when authenticated as admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      initializeAdminData();
      setupRealtimeSubscription();
    } else {
      clearAdminData();
    }

    return () => {
      if (realtimeSubscription) {
        realtimeSubscription();
      }
    };
  }, [isAuthenticated, isAdmin]);

  // Initialize admin data
  const initializeAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsers(),
        loadUserStats(),
        loadAdminLogs()
      ]);
    } catch (error) {
      console.error('Error initializing admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription for admin
  const setupRealtimeSubscription = () => {
    if (!isAdmin) return;

    const unsubscribe = supabaseHelpers.subscribeToAdminData(
      (type, payload) => {
        console.log('Real-time admin update:', type, payload);
        
        switch (type) {
          case 'user':
            handleUserUpdate(payload);
            break;
          case 'admin_log':
            handleAdminLogUpdate(payload);
            break;
          default:
            break;
        }
      }
    );

    setRealtimeSubscription(() => unsubscribe);
  };

  // Handle real-time user updates
  const handleUserUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setUsers(prevUsers => {
      switch (eventType) {
        case 'INSERT':
          return [...prevUsers, newRecord];
        case 'UPDATE':
          return prevUsers.map(user => 
            user.id === newRecord.id ? newRecord : user
          );
        case 'DELETE':
          return prevUsers.filter(user => user.id !== oldRecord.id);
        default:
          return prevUsers;
      }
    });

    // Refresh stats when user data changes
    loadUserStats();
  };

  // Handle real-time admin log updates
  const handleAdminLogUpdate = (payload) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      setAdminLogs(prevLogs => [newRecord, ...prevLogs]);
    }
  };

  // Load all users (admin only)
  const loadUsers = async (limit = 100, offset = 0) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          wallets:${TABLES.WALLETS}(count),
          transactions:${TABLES.TRANSACTIONS}(count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      if (offset === 0) {
        setUsers(data);
      } else {
        setUsers(prev => [...prev, ...data]);
      }

      return data;
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  // Load user statistics
  const loadUserStats = async () => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get user counts by status
      const { data: userCounts, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('status')
        .not('status', 'is', null);

      if (userError) {
        throw userError;
      }

      // Get KYC verification stats
      const { data: kycStats, error: kycError } = await supabase
        .from(TABLES.KYC_VERIFICATIONS)
        .select('status')
        .not('status', 'is', null);

      if (kycError) {
        throw kycError;
      }

      // Get transaction stats
      const { data: transactionStats, error: txError } = await supabase
        .from(TABLES.TRANSACTIONS)
        .select('status, amount')
        .not('status', 'is', null);

      if (txError) {
        throw txError;
      }

      // Calculate statistics
      const stats = {
        totalUsers: userCounts.length,
        activeUsers: userCounts.filter(u => u.status === ENUMS.USER_STATUS.ACTIVE).length,
        suspendedUsers: userCounts.filter(u => u.status === ENUMS.USER_STATUS.SUSPENDED).length,
        pendingUsers: userCounts.filter(u => u.status === ENUMS.USER_STATUS.PENDING).length,
        
        totalKycSubmissions: kycStats.length,
        approvedKyc: kycStats.filter(k => k.status === ENUMS.KYC_STATUS.APPROVED).length,
        pendingKyc: kycStats.filter(k => k.status === ENUMS.KYC_STATUS.PENDING).length,
        rejectedKyc: kycStats.filter(k => k.status === ENUMS.KYC_STATUS.REJECTED).length,
        
        totalTransactions: transactionStats.length,
        confirmedTransactions: transactionStats.filter(t => t.status === ENUMS.TRANSACTION_STATUS.CONFIRMED).length,
        pendingTransactions: transactionStats.filter(t => t.status === ENUMS.TRANSACTION_STATUS.PENDING).length,
        failedTransactions: transactionStats.filter(t => t.status === ENUMS.TRANSACTION_STATUS.FAILED).length,
        
        totalVolume: transactionStats
          .filter(t => t.status === ENUMS.TRANSACTION_STATUS.CONFIRMED)
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
        
        lastUpdated: new Date().toISOString()
      };

      setUserStats(stats);
      return stats;
    } catch (error) {
      console.error('Error loading user stats:', error);
      throw error;
    }
  };

  // Load admin logs
  const loadAdminLogs = async (limit = 50, offset = 0) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          *,
          admin:${TABLES.USERS}!admin_logs_admin_id_fkey(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      if (offset === 0) {
        setAdminLogs(data);
      } else {
        setAdminLogs(prev => [...prev, ...data]);
      }

      return data;
    } catch (error) {
      console.error('Error loading admin logs:', error);
      throw error;
    }
  };

  // Update user status
  const updateUserStatus = async (userId, status, reason = null) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      setLoading(true);

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log admin action
      await logAdminAction('UPDATE_USER_STATUS', {
        target_user_id: userId,
        old_status: users.find(u => u.id === userId)?.status,
        new_status: status,
        reason
      });

      Alert.alert('Success', 'User status updated successfully!');
      return data;
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', 'Failed to update user status');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Suspend user
  const suspendUser = async (userId, reason) => {
    try {
      await updateUserStatus(userId, ENUMS.USER_STATUS.SUSPENDED, reason);
      
      // Additional suspension actions could be added here
      // e.g., freeze wallets, cancel pending transactions
      
      return true;
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  };

  // Activate user
  const activateUser = async (userId, reason) => {
    try {
      await updateUserStatus(userId, ENUMS.USER_STATUS.ACTIVE, reason);
      return true;
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  };

  // Delete user (soft delete)
  const deleteUser = async (userId, reason) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      setLoading(true);

      // Soft delete by updating status
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({ 
          status: ENUMS.USER_STATUS.DELETED,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log admin action
      await logAdminAction('DELETE_USER', {
        target_user_id: userId,
        reason
      });

      Alert.alert('Success', 'User deleted successfully!');
      return data;
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get user details
  const getUserDetails = async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          wallets:${TABLES.WALLETS}(*),
          transactions:${TABLES.TRANSACTIONS}(*),
          kyc_verifications:${TABLES.KYC_VERIFICATIONS}(*),
          cards:${TABLES.CARDS}(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  };

  // Search users
  const searchUsers = async (query, filters = {}) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      let queryBuilder = supabase
        .from(TABLES.USERS)
        .select(`
          *,
          wallets:${TABLES.WALLETS}(count),
          transactions:${TABLES.TRANSACTIONS}(count)
        `);

      // Apply search query
      if (query) {
        queryBuilder = queryBuilder.or(
          `email.ilike.%${query}%,full_name.ilike.%${query}%,phone.ilike.%${query}%`
        );
      }

      // Apply filters
      if (filters.status) {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }
      if (filters.role) {
        queryBuilder = queryBuilder.eq('role', filters.role);
      }
      if (filters.dateFrom) {
        queryBuilder = queryBuilder.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        queryBuilder = queryBuilder.lte('created_at', filters.dateTo);
      }

      const { data, error } = await queryBuilder
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  };

  // Update user profile (admin)
  const updateUserProfile = async (userId, updates) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      setLoading(true);

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log admin action
      await logAdminAction('UPDATE_USER_PROFILE', {
        target_user_id: userId,
        updates
      });

      Alert.alert('Success', 'User profile updated successfully!');
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      Alert.alert('Error', 'Failed to update user profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Log admin action
  const logAdminAction = async (action, details = {}) => {
    try {
      if (!profile || !isAdmin) {
        return;
      }

      const logData = {
        admin_id: profile.id,
        action,
        details,
        ip_address: null, // Would be populated by backend
        user_agent: null, // Would be populated by backend
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('admin_logs')
        .insert([logData]);

      if (error) {
        console.error('Error logging admin action:', error);
      }
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  // Export user data
  const exportUserData = async (userId) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const userData = await getUserDetails(userId);
      
      // Log admin action
      await logAdminAction('EXPORT_USER_DATA', {
        target_user_id: userId
      });

      return userData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  };

  // Clear admin data
  const clearAdminData = () => {
    setUsers([]);
    setUserStats({});
    setAdminLogs([]);
    
    if (realtimeSubscription) {
      realtimeSubscription();
      setRealtimeSubscription(null);
    }
  };

  // Get user by email
  const getUserByEmail = async (email) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  };

  // Get users by status
  const getUsersByStatus = (status) => {
    return users.filter(user => user.status === status);
  };

  // Get recent users
  const getRecentUsers = (days = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return users.filter(user => 
      new Date(user.created_at) >= cutoffDate
    );
  };

  // Context value
  const value = {
    // State
    users,
    userStats,
    adminLogs,
    loading,
    
    // User management methods
    loadUsers,
    getUserDetails,
    searchUsers,
    updateUserProfile,
    updateUserStatus,
    suspendUser,
    activateUser,
    deleteUser,
    
    // Statistics methods
    loadUserStats,
    
    // Admin methods
    loadAdminLogs,
    logAdminAction,
    exportUserData,
    
    // Utility methods
    getUserByEmail,
    getUsersByStatus,
    getRecentUsers,
    
    // Data refresh
    initializeAdminData,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
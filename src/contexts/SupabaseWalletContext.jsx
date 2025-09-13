// Supabase WalletContext for Payoova Wallet
// This replaces the custom wallet management with Supabase database operations

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, ENUMS, TABLES } from '../config/supabase-config';
import { useAuth } from './SupabaseAuthContext';
import { ethers } from 'ethers';

// Create Wallet Context
const WalletContext = createContext({});

// Custom hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Wallet Provider Component
export const WalletProvider = ({ children }) => {
  const { profile, isAuthenticated } = useAuth();
  
  // State
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({});
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  // Initialize wallet data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && profile) {
      initializeWalletData();
      setupRealtimeSubscription();
    } else {
      clearWalletData();
    }

    return () => {
      if (realtimeSubscription) {
        realtimeSubscription();
      }
    };
  }, [isAuthenticated, profile]);

  // Initialize wallet data
  const initializeWalletData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadWallets(),
        loadTransactions(),
      ]);
    } catch (error) {
      console.error('Error initializing wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  const setupRealtimeSubscription = () => {
    if (!profile) return;

    const unsubscribe = supabaseHelpers.subscribeToUserData(
      profile.id,
      (type, payload) => {
        console.log('Real-time wallet update:', type, payload);
        
        switch (type) {
          case 'wallet':
            handleWalletUpdate(payload);
            break;
          case 'transaction':
            handleTransactionUpdate(payload);
            break;
          default:
            break;
        }
      }
    );

    setRealtimeSubscription(() => unsubscribe);
  };

  // Handle real-time wallet updates
  const handleWalletUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setWallets(prevWallets => {
      switch (eventType) {
        case 'INSERT':
          return [...prevWallets, newRecord];
        case 'UPDATE':
          return prevWallets.map(wallet => 
            wallet.id === newRecord.id ? newRecord : wallet
          );
        case 'DELETE':
          return prevWallets.filter(wallet => wallet.id !== oldRecord.id);
        default:
          return prevWallets;
      }
    });
  };

  // Handle real-time transaction updates
  const handleTransactionUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setTransactions(prevTransactions => {
      switch (eventType) {
        case 'INSERT':
          return [newRecord, ...prevTransactions];
        case 'UPDATE':
          return prevTransactions.map(tx => 
            tx.id === newRecord.id ? newRecord : tx
          );
        case 'DELETE':
          return prevTransactions.filter(tx => tx.id !== oldRecord.id);
        default:
          return prevTransactions;
      }
    });

    // Update balances if transaction is confirmed
    if (newRecord && newRecord.status === ENUMS.TRANSACTION_STATUS.CONFIRMED) {
      refreshWalletBalance(newRecord.wallet_id);
    }
  };

  // Load user wallets
  const loadWallets = async () => {
    try {
      if (!profile) return;

      const userWallets = await supabaseHelpers.getUserWallets(profile.id);
      setWallets(userWallets);
      
      // Set primary wallet as selected if none selected
      if (!selectedWallet && userWallets.length > 0) {
        const primaryWallet = userWallets.find(w => w.is_primary) || userWallets[0];
        setSelectedWallet(primaryWallet);
      }
      
      // Load balances for all wallets
      await loadWalletBalances(userWallets);
      
      // Cache wallets locally
      localStorage.setItem('walletData', JSON.stringify(userWallets));
      
      return userWallets;
    } catch (error) {
      console.error('Error loading wallets:', error);
      throw error;
    }
  };

  // Load wallet balances
  const loadWalletBalances = async (walletsToLoad = wallets) => {
    try {
      const balancePromises = walletsToLoad.map(async (wallet) => {
        try {
          // For now, use the balance from database
          // In production, you might want to fetch from blockchain
          return {
            walletId: wallet.id,
            balance: wallet.balance,
            network: wallet.network
          };
        } catch (error) {
          console.error(`Error loading balance for wallet ${wallet.id}:`, error);
          return {
            walletId: wallet.id,
            balance: '0',
            network: wallet.network
          };
        }
      });

      const balanceResults = await Promise.all(balancePromises);
      const newBalances = {};
      
      balanceResults.forEach(({ walletId, balance, network }) => {
        newBalances[walletId] = {
          balance,
          network,
          lastUpdated: new Date().toISOString()
        };
      });

      setBalances(newBalances);
      return newBalances;
    } catch (error) {
      console.error('Error loading wallet balances:', error);
      throw error;
    }
  };

  // Load user transactions
  const loadTransactions = async (limit = 50, offset = 0) => {
    try {
      if (!profile) return;

      const userTransactions = await supabaseHelpers.getUserTransactions(
        profile.id,
        limit,
        offset
      );
      
      if (offset === 0) {
        setTransactions(userTransactions);
      } else {
        setTransactions(prev => [...prev, ...userTransactions]);
      }
      
      // Cache recent transactions locally
      if (offset === 0) {
        localStorage.setItem('transactionHistory', JSON.stringify(userTransactions));
      }
      
      return userTransactions;
    } catch (error) {
      console.error('Error loading transactions:', error);
      throw error;
    }
  };

  // Create new wallet
  const createWallet = async (network, name = null) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      setLoading(true);

      // Generate new wallet
      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;
      const privateKey = wallet.privateKey;

      // Encrypt private key (in production, use proper encryption)
      const encryptedPrivateKey = await encryptPrivateKey(privateKey, profile.id);

      // Check if this should be the primary wallet
      const isPrimary = wallets.length === 0;

      const walletData = {
        user_id: profile.id,
        network,
        address,
        encrypted_private_key: encryptedPrivateKey,
        balance: '0',
        name: name || `${network.charAt(0).toUpperCase() + network.slice(1)} Wallet`,
        is_primary: isPrimary,
        is_active: true
      };

      const { data, error } = await supabase
        .from(TABLES.WALLETS)
        .insert([walletData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setWallets(prev => [...prev, data]);
      
      if (isPrimary) {
        setSelectedWallet(data);
      }

      Alert.alert('Success', 'Wallet created successfully!');
      return data;
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send transaction
  const sendTransaction = async (walletId, toAddress, amount, currency, network) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      setLoading(true);

      // Validate inputs
      if (!toAddress || !amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid transaction parameters');
      }

      // Get wallet
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check balance
      const walletBalance = balances[walletId]?.balance || '0';
      if (parseFloat(walletBalance) < parseFloat(amount)) {
        throw new Error('Insufficient balance');
      }

      // Create transaction record
      const transactionData = {
        user_id: profile.id,
        wallet_id: walletId,
        from_address: wallet.address,
        to_address: toAddress,
        amount: parseFloat(amount),
        currency,
        network,
        transaction_type: ENUMS.TRANSACTION_TYPE.SEND,
        status: ENUMS.TRANSACTION_STATUS.PENDING,
        gas_fee: 0, // Calculate actual gas fee
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .insert([transactionData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // In production, you would:
      // 1. Get the encrypted private key
      // 2. Decrypt it
      // 3. Create and sign the blockchain transaction
      // 4. Broadcast to the network
      // 5. Update the transaction with the hash

      // For now, simulate successful transaction
      setTimeout(async () => {
        await updateTransactionStatus(data.id, ENUMS.TRANSACTION_STATUS.CONFIRMED, {
          transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          block_number: Math.floor(Math.random() * 1000000),
          confirmed_at: new Date().toISOString()
        });
      }, 3000);

      Alert.alert('Success', 'Transaction submitted successfully!');
      return data;
    } catch (error) {
      console.error('Error sending transaction:', error);
      Alert.alert('Error', error.message || 'Failed to send transaction');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update transaction status
  const updateTransactionStatus = async (transactionId, status, additionalData = {}) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRANSACTIONS)
        .update({
          status,
          ...additionalData
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  };

  // Refresh wallet balance
  const refreshWalletBalance = async (walletId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.WALLETS)
        .select('balance')
        .eq('id', walletId)
        .single();

      if (error) {
        throw error;
      }

      setBalances(prev => ({
        ...prev,
        [walletId]: {
          ...prev[walletId],
          balance: data.balance,
          lastUpdated: new Date().toISOString()
        }
      }));

      return data.balance;
    } catch (error) {
      console.error('Error refreshing wallet balance:', error);
      throw error;
    }
  };

  // Set primary wallet
  const setPrimaryWallet = async (walletId) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      // Update all wallets to not primary
      await supabase
        .from(TABLES.WALLETS)
        .update({ is_primary: false })
        .eq('user_id', profile.id);

      // Set selected wallet as primary
      const { data, error } = await supabase
        .from(TABLES.WALLETS)
        .update({ is_primary: true })
        .eq('id', walletId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      setWallets(prev => prev.map(wallet => ({
        ...wallet,
        is_primary: wallet.id === walletId
      })));

      setSelectedWallet(data);
      return data;
    } catch (error) {
      console.error('Error setting primary wallet:', error);
      throw error;
    }
  };

  // Clear wallet data
  const clearWalletData = () => {
    setWallets([]);
    setTransactions([]);
    setBalances({});
    setSelectedWallet(null);
    
    if (realtimeSubscription) {
      realtimeSubscription();
      setRealtimeSubscription(null);
    }
  };

  // Encrypt private key (simplified - use proper encryption in production)
  const encryptPrivateKey = async (privateKey, userId) => {
    // In production, use proper encryption with user-specific keys
    // This is a simplified example
    const encoder = new TextEncoder();
    const data = encoder.encode(privateKey + userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Get wallet by address
  const getWalletByAddress = (address) => {
    return wallets.find(wallet => 
      wallet.address.toLowerCase() === address.toLowerCase()
    );
  };

  // Get transactions for specific wallet
  const getWalletTransactions = (walletId) => {
    return transactions.filter(tx => tx.wallet_id === walletId);
  };

  // Calculate total portfolio value
  const getTotalPortfolioValue = () => {
    return Object.values(balances).reduce((total, { balance }) => {
      return total + parseFloat(balance || 0);
    }, 0);
  };

  // Context value
  const value = {
    // State
    wallets,
    transactions,
    balances,
    selectedWallet,
    loading,
    
    // Wallet methods
    createWallet,
    loadWallets,
    setPrimaryWallet,
    refreshWalletBalance,
    
    // Transaction methods
    sendTransaction,
    loadTransactions,
    updateTransactionStatus,
    
    // Utility methods
    getWalletByAddress,
    getWalletTransactions,
    getTotalPortfolioValue,
    setSelectedWallet,
    
    // Data refresh
    initializeWalletData,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
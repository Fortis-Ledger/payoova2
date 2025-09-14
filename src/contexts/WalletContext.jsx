
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cryptoAPI } from '../services/cryptoApi';
// import io from 'socket.io-client'; // Temporarily disabled until dependency is resolved

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  // const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [autoGenAttempted, setAutoGenAttempted] = useState(false);

  // Fetch real-time prices for cryptocurrencies
  const fetchPrices = async (walletList = wallets) => {
    try {
      setLoading(true);
      
      // Use the real crypto API service
      const priceData = await cryptoAPI.getPrices();
      
      if (priceData) {
        setPrices(priceData);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      // Set fallback prices
      setPrices({
        BTC: { price: 45000, change24h: 2.5 },
        ETH: { price: 3200, change24h: 1.8 },
        MATIC: { price: 0.85, change24h: -0.5 },
        BNB: { price: 320, change24h: 0.8 }
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch gas prices
  const fetchGasPrices = async () => {
    try {
      const gasData = await cryptoAPI.getGasPrices();
      return gasData;
    } catch (error) {
      console.error('Error fetching gas prices:', error);
      return {
        slow: 20,
        standard: 25,
        fast: 35,
        instant: 50
      };
    }
  };

  // Legacy fetch method for backward compatibility
  const legacyFetchPrices = async (walletList = wallets) => {
    try {
      const symbols = [...new Set(walletList.map(wallet => {
        const networkCurrencyMap = {
          'ethereum': 'ETH',
          'polygon': 'MATIC',
          'bsc': 'BNB',
          'arbitrum': 'ETH',
          'optimism': 'ETH'
        };
        return networkCurrencyMap[wallet.network] || 'ETH';
      }))].filter(Boolean);

      if (symbols.length === 0) return;

      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ symbols, vs_currency: 'usd' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPrices(data.prices || {});
        }
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  // Fetch transaction history for a specific network
  const fetchTransactionHistory = async (network, sync = false) => {
    try {
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      const syncParam = sync ? '?sync=true' : '';
      const response = await fetch(`${apiBase}/api/wallet/history/${network}${syncParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTransactions(prev => {
            // Merge new transactions with existing ones, avoiding duplicates
            const existingHashes = new Set(prev.map(tx => tx.transaction_hash));
            const newTransactions = data.transactions.filter(tx => !existingHashes.has(tx.transaction_hash));
            return [...newTransactions, ...prev].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          });
          return { success: true, transactions: data.transactions };
        }
      }
      return { success: false, error: 'Failed to fetch transaction history' };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return { success: false, error: error.message };
    }
  };

  // Sync transactions from blockchain
  const syncTransactions = async (network) => {
    try {
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/wallet/sync-transactions/${network}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh transaction history after sync
          await fetchTransactionHistory(network);
          return { success: true, message: data.message };
        }
      }
      return { success: false, error: 'Failed to sync transactions' };
    } catch (error) {
      console.error('Error syncing transactions:', error);
      return { success: false, error: error.message };
    }
  };

  // Initialize WebSocket connection - Temporarily disabled
  /*
  useEffect(() => {
    if (user && token) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        // Subscribe to balance updates
        const networks = ['ethereum', 'polygon', 'bsc'];
        newSocket.emit('subscribe_balance_updates', { networks });
        newSocket.emit('subscribe_transaction_updates');
      });

      newSocket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setConnected(false);
      });

      newSocket.on('balance_update', (data) => {
        console.log('Balance update received:', data);
        setBalances(prev => ({
          ...prev,
          [data.network]: {
            ...prev[data.network],
            [data.address]: data.balance
          }
        }));
      });

      newSocket.on('transaction_update', (data) => {
        console.log('Transaction update received:', data);
        setTransactions(prev => prev.map(tx => 
          tx.id === data.transaction.id 
            ? { ...tx, ...data.transaction }
            : tx
        ));
      });

      newSocket.on('new_transaction', (data) => {
        console.log('New transaction received:', data);
        setTransactions(prev => [data.transaction, ...prev]);
        
        // Update balance if needed
        if (data.balance_update) {
          setBalances(prev => ({
            ...prev,
            [data.balance_update.network]: {
              ...prev[data.balance_update.network],
              [data.balance_update.address]: data.balance_update.balance
            }
          }));
        }
      });

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);
  */

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getNetworkSymbol = (network) => {
    const symbols = {
      ethereum: 'ETH',
      polygon: 'MATIC',
      bsc: 'BNB'
    };
    return symbols[network] || network.toUpperCase();
  };

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/wallet/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWallets(data.wallets || []);
          
          // Update balances
          const newBalances = {};
          data.wallets?.forEach(wallet => {
            newBalances[wallet.network] = wallet.balance || '0';
          });
          setBalances(newBalances);
          
          // Fetch real-time prices for portfolio calculation
          await fetchPrices(data.wallets || []);
        } else {
          console.error('Failed to fetch wallets:', data.error);
        }
      } else {
        console.error('Failed to fetch wallets:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWallet = async (network) => {
    try {
      setLoading(true);
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/wallet/create/${network}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh wallets list
          await fetchWallets();
          return { success: true, wallet: data.wallet };
        } else {
          return { success: false, error: data.error };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || 'Failed to create wallet' };
      }
    } catch (error) {
      console.error('Error generating wallet:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    try {
      setLoading(true);
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/wallet/refresh-balances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setBalances(data.balances);
        
        // Update wallets with new balances
        setWallets(prev => prev.map(wallet => ({
          ...wallet,
          balance: data.balances[wallet.network] || wallet.balance
        })));
      }
    } catch (error) {
      console.error('Error refreshing balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendCrypto = async (transactionData) => {
    try {
      setLoading(true);
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/wallet/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add transaction to local state
          setTransactions(prev => [data.transaction, ...prev]);
          // Refresh balances
          await refreshBalances();
          return { success: true, transaction: data.transaction };
        } else {
          return { success: false, error: data.error };
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || 'Transaction failed' };
      }
    } catch (error) {
      console.error('Error sending crypto:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const estimateGasFee = async (fromAddress, toAddress, amount, network) => {
    try {
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/wallet/estimate-gas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_address: fromAddress,
          to_address: toAddress,
          amount: amount,
          network: network
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error estimating gas fee:', error);
      return { success: false, error: 'Failed to estimate gas fee' };
    }
  };

  // Fetch wallets and balances on component mount and when user/token changes
  useEffect(() => {
    if (user && token) {
      fetchWallets();
      // Fetch prices every 30 seconds
      const priceInterval = setInterval(() => {
        fetchPrices();
      }, 30000);
      
      return () => clearInterval(priceInterval);
    }
  }, [user, token]);

  // Initial price fetch
  useEffect(() => {
    if (wallets.length > 0) {
      fetchPrices();
    }
  }, [wallets]);

  // Helper functions for components
  const getBalanceByNetwork = (network) => {
    return balances[network] || '0';
  };

  const getPriceBySymbol = (symbol) => {
    return prices[symbol] || { price: 0, change_24h: 0 };
  };

  const loadTransactions = async (filters = {}) => {
    try {
      setLoading(true);
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
      
      // Build query parameters (convert "all" to empty string for backend)
      const params = new URLSearchParams();
      if (filters.network && filters.network !== 'all') params.append('network', filters.network);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.per_page) params.append('per_page', filters.per_page);

      // If no network specified or "all" selected, fetch from all networks
      if ((!filters.network || filters.network === 'all') && wallets.length > 0) {
        let allTransactions = [];
        let totalPages = 1;
        
        for (const wallet of wallets) {
          const result = await fetchTransactionHistory(wallet.network, filters.sync);
          if (result.success) {
            allTransactions = [...allTransactions, ...result.transactions];
          }
        }
        
        // Sort by date
        allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setTransactions(allTransactions);
        return {
          success: true,
          transactions: allTransactions,
          pagination: {
            page: filters.page || 1,
            per_page: filters.per_page || 20,
            total: allTransactions.length,
            pages: totalPages
          }
        };
      } else if (filters.network && filters.network !== 'all') {
        return await fetchTransactionHistory(filters.network, filters.sync);
      }
      
      return { success: true, transactions: [], pagination: { page: 1, per_page: 20, total: 0, pages: 1 } };
    } catch (error) {
      console.error('Error loading transactions:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate wallets for new users
  const autoGenerateWallets = async () => {
    if (!user || wallets.length > 0) return;
    
    const networks = ['ethereum', 'polygon', 'bsc'];
    const results = [];
    
    for (const network of networks) {
      try {
        const result = await generateWallet(network);
        results.push({ network, success: result.success, error: result.error });
      } catch (error) {
        results.push({ network, success: false, error: error.message });
      }
    }
    
    return results;
  };

  // Auto-generate wallets when user first logs in
  useEffect(() => {
    if (user && token && wallets.length === 0 && !loading) {
      const timer = setTimeout(() => {
        autoGenerateWallets();
      }, 2000); // Wait 2 seconds after login to auto-generate
      
      return () => clearTimeout(timer);
    }
  }, [user, token, wallets.length, loading]);

  const value = {
    wallets,
    balances,
    transactions,
    prices,
    loading,
    connected,
    generateWallet,
    refreshBalances,
    sendCrypto,
    estimateGasFee,
    fetchTransactionHistory,
    syncTransactions,
    fetchPrices,
    loadTransactions,
    getBalanceByNetwork,
    getPriceBySymbol,
    autoGenerateWallets
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

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
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({});

  // Load wallets when user is authenticated
  useEffect(() => {
    if (user && token) {
      loadWallets();
      loadBalances();
      loadPrices();
    } else {
      setWallets([]);
      setBalances({});
      setTransactions([]);
    }
  }, [user, token]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/wallet/list');
      if (response.data.success) {
        setWallets(response.data.wallets);
        setBalances(response.data.balances);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async () => {
    try {
      const response = await axios.get('/api/wallet/balances');
      if (response.data.success) {
        setBalances(response.data.balances);
      }
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  const loadPrices = async () => {
    try {
      const response = await axios.get('/api/wallet/prices');
      if (response.data.success) {
        setPrices(response.data.prices);
      }
    } catch (error) {
      console.error('Failed to load prices:', error);
    }
  };

  const generateWallet = async (network) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/wallet/generate', { network });

      if (response.data.success) {
        // Reload wallets after generation
        await loadWallets();
        return { success: true, wallet: response.data.wallet };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to generate wallet';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const sendCrypto = async (transactionData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/wallet/send', transactionData);

      if (response.data.success) {
        // Reload wallets and transactions after sending
        await loadWallets();
        await loadTransactions();
        return { success: true, transaction: response.data.transaction };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Transaction failed';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/api/wallet/transactions?${params}`);

      if (response.data.success) {
        setTransactions(response.data.transactions);
        return { success: true, transactions: response.data.transactions, pagination: response.data.pagination };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to load transactions';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    await loadBalances();
    await loadPrices();
  };

  const getWalletByNetwork = (network) => {
    return wallets.find(wallet => wallet.network === network);
  };

  const getBalanceByNetwork = (network) => {
    return balances[network] || '0';
  };

  const getPriceBySymbol = (symbol) => {
    return prices[symbol] || { price: 0, change_24h: 0 };
  };

  const value = {
    wallets,
    balances,
    transactions,
    prices,
    loading,
    generateWallet,
    sendCrypto,
    loadTransactions,
    refreshBalances,
    getWalletByNetwork,
    getBalanceByNetwork,
    getPriceBySymbol
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

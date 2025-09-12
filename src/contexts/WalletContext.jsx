
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
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
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/wallet/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWallets(data.wallets);
          
          // Extract balances
          const balanceMap = {};
          data.wallets.forEach(wallet => {
            balanceMap[wallet.network] = wallet.balance;
          });
          setBalances(balanceMap);
        }
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
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/wallet/create/${network}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchWallets(); // Refresh wallets list
        return { success: true, wallet: data.wallet };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error generating wallet:', error);
      return { success: false, error: 'Failed to generate wallet' };
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    try {
      setLoading(true);
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/wallet/refresh-balances`, {
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
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/wallet/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_address: transactionData.fromAddress,
          to_address: transactionData.toAddress,
          amount: transactionData.amount,
          network: transactionData.network
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add transaction to local state
        setTransactions(prev => [data.transaction, ...prev]);
        
        // Refresh balances after sending
        setTimeout(() => refreshBalances(), 2000);
        
        return { success: true, transaction: data.transaction };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Error sending crypto:', error);
      return { success: false, error: 'Failed to send transaction' };
    } finally {
      setLoading(false);
    }
  };

  const estimateGasFee = async (fromAddress, toAddress, amount, network) => {
    try {
      const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/wallet/estimate-gas`, {
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

  const value = {
    wallets,
    balances,
    transactions,
    prices,
    loading,
    connected,
    fetchWallets,
    generateWallet,
    refreshBalances,
    sendCrypto,
    estimateGasFee
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

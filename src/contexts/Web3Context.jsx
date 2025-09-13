import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Create Web3 Context
const Web3Context = createContext();

// Custom hook to use Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Web3 Provider Component
export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create provider and signer
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      // Get balance
      const accountBalance = await web3Provider.getBalance(accounts[0]);
      const formattedBalance = ethers.utils.formatEther(accountBalance);

      // Update state
      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setBalance(formattedBalance);
      setChainId(network.chainId);

      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setBalance('0');
    setChainId(null);
    setError(null);
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (err) {
      console.error('Error switching network:', err);
      setError('Failed to switch network');
      return false;
    }
  };

  // Get token balance
  const getTokenBalance = async (tokenAddress, decimals = 18) => {
    if (!provider || !account) return '0';

    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );

      const balance = await tokenContract.balanceOf(account);
      return ethers.utils.formatUnits(balance, decimals);
    } catch (err) {
      console.error('Error getting token balance:', err);
      return '0';
    }
  };

  // Send transaction
  const sendTransaction = async (to, amount, gasLimit = 21000) => {
    if (!signer) throw new Error('Wallet not connected');

    try {
      const tx = await signer.sendTransaction({
        to,
        value: ethers.utils.parseEther(amount.toString()),
        gasLimit,
      });

      return tx;
    } catch (err) {
      console.error('Error sending transaction:', err);
      throw err;
    }
  };

  // Update balance
  const updateBalance = async () => {
    if (!provider || !account) return;

    try {
      const accountBalance = await provider.getBalance(account);
      const formattedBalance = ethers.utils.formatEther(accountBalance);
      setBalance(formattedBalance);
    } catch (err) {
      console.error('Error updating balance:', err);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        updateBalance();
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(parseInt(chainId, 16));
      updateBalance();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (err) {
        console.error('Auto-connect failed:', err);
      }
    };

    autoConnect();
  }, []);

  const value = {
    // State
    account,
    provider,
    signer,
    balance,
    chainId,
    isConnecting,
    error,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),

    // Methods
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getTokenBalance,
    sendTransaction,
    updateBalance,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export default Web3Context;
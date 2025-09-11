import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wallet, 
  Send, 
  Download, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  ExternalLink,
  RefreshCw,
  LogOut,
  History,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { wallets, balances, loading, generateWallet, refreshBalances } = useWallet();
  const [showBalances, setShowBalances] = useState(true);
  const [generatingWallet, setGeneratingWallet] = useState(false);

  const networks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500', icon: '⟠' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500', icon: '⬟' },
    { id: 'bsc', name: 'BSC', symbol: 'BNB', color: 'bg-yellow-500', icon: '◆' }
  ];

  const handleGenerateWallet = async (network) => {
    setGeneratingWallet(true);
    const result = await generateWallet(network);
    if (result.success) {
      // Success handled by context
    } else {
      alert(result.error);
    }
    setGeneratingWallet(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatAddress = (address) => {
    if (!address) return 'No wallet';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    if (!balance || balance === '0') return '0.000000';
    return parseFloat(balance).toFixed(6);
  };

  const getTotalPortfolioValue = () => {
    // This would calculate total USD value in a real app
    return '$12,345.67';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Payoova</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                Live
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.name}</span>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <div className="mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Portfolio Overview</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your total crypto holdings
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowBalances(!showBalances)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={refreshBalances}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-white">
                  {showBalances ? getTotalPortfolioValue() : '••••••'}
                </div>
                <div className="text-green-400 flex items-center justify-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+$234.56 (+1.94%) today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link to="/send">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-semibold">Send Crypto</div>
                  <div className="text-gray-400 text-sm">Transfer to any address</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/receive">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-white font-semibold">Receive Crypto</div>
                  <div className="text-gray-400 text-sm">Get your wallet address</div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/transactions">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <History className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-white font-semibold">Transactions</div>
                  <div className="text-gray-400 text-sm">View transaction history</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Wallets */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Your Wallets</CardTitle>
                <CardDescription className="text-gray-400">
                  Multi-network crypto wallets
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {networks.map((network) => {
              const wallet = wallets.find(w => w.network === network.id);
              const balance = balances[network.id] || '0';
              
              return (
                <div key={network.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 ${network.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                        {network.icon}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{network.name}</div>
                        <div className="text-gray-400 text-sm">
                          {wallet ? formatAddress(wallet.address) : 'No wallet'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {showBalances ? `${formatBalance(balance)} ${network.symbol}` : '••••••'}
                      </div>
                      <div className="text-gray-400 text-sm">≈ $0.00 USD</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      {wallet && (
                        <>
                          <Button
                            onClick={() => copyToClipboard(wallet.address)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {!wallet && (
                      <Button
                        onClick={() => handleGenerateWallet(network.id)}
                        disabled={generatingWallet}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Wallet
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;


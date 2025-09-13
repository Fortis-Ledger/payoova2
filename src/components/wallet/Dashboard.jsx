import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle,
  CreditCard,
  Home,
  Settings,
  Gift,
  MoreHorizontal,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Shield,
  Globe,
  Star,
  Clock,
  Bell,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useWallet } from '../../contexts/WalletContext';


const Dashboard = () => {
  const { user, logout } = useAuth();
  const { wallets, balances, prices, loading, generateWallet, refreshBalances, fetchPrices } = useWallet();

  const [showBalances, setShowBalances] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [balanceAnimation, setBalanceAnimation] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (balances) {
      setBalanceAnimation(true);
      const timeout = setTimeout(() => setBalanceAnimation(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [balances]);

  const getTotalPortfolioValue = () => {
    let totalValue = 0;
    const networkCurrencyMap = {
      'ethereum': 'ETH',
      'polygon': 'MATIC', 
      'bsc': 'BNB'
    };
    
    // Add wallet balances
    wallets.forEach(wallet => {
      const balance = parseFloat(balances[wallet.network] || '0');
      const currency = networkCurrencyMap[wallet.network];
      const price = prices[currency]?.price || 0;
      totalValue += balance * price;
    });
    
    return totalValue > 0 ? totalValue.toFixed(2) : '0.00';
  };

  const actionButtons = [
    { 
      icon: Download, 
      label: 'Receive', 
      color: 'from-green-500 to-emerald-600', 
      textColor: 'text-white', 
      to: '/receive',
      description: 'Get crypto instantly'
    },
    { 
      icon: Send, 
      label: 'Send', 
      color: 'from-blue-500 to-cyan-600', 
      textColor: 'text-white', 
      to: '/send',
      description: 'Transfer worldwide'
    },
    { 
      icon: TrendingUp, 
      label: 'Earn', 
      color: 'from-purple-500 to-pink-600', 
      textColor: 'text-white', 
      to: '/advanced-features',
      description: 'Coming soon'
    },
    { 
      icon: MoreHorizontal, 
      label: 'More', 
      color: 'from-gray-600 to-gray-700', 
      textColor: 'text-white', 
      to: '/settings',
      description: 'Explore features'
    }
  ];

  const getNetworkAssets = () => {
    const networkInfo = {
      'ethereum': { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'from-blue-400 to-blue-600' },
      'polygon': { symbol: 'MATIC', name: 'Polygon', icon: '⬟', color: 'from-purple-400 to-purple-600' },
      'bsc': { symbol: 'BNB', name: 'BNB Chain', icon: '◆', color: 'from-yellow-400 to-yellow-600' }
    };
    
    return wallets.map(wallet => {
      const info = networkInfo[wallet.network] || { symbol: 'UNKNOWN', name: 'Unknown', icon: '?', color: 'from-gray-400 to-gray-600' };
      const balance = balances[wallet.network] || '0';
      const currency = info.symbol;
      const price = prices[currency]?.price || 0;
      const value = (parseFloat(balance) * price).toFixed(2);
      
      return {
        ...info,
        balance: parseFloat(balance).toFixed(4),
        value: `${value} USD`,
        network: wallet.network,
        address: wallet.address
      };
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const quickStats = [
    { label: 'Networks', value: wallets.length, icon: Globe, color: 'text-blue-400' },
    { label: 'Security', value: '100%', icon: Shield, color: 'text-green-400' },
    { label: 'Uptime', value: '99.9%', icon: Clock, color: 'text-purple-400' }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-10 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute top-1/3 left-1/4 w-60 h-60 bg-green-500/5 rounded-full blur-2xl"
          animate={{
            rotate: [0, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between p-6 border-b border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-4">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, -2, 2, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Wallet className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">PAYOOVA</div>
              <div className="text-xs text-gray-400">{formatTime()}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
                onClick={() => {
                  refreshBalances();
                  fetchPrices();
                }}
              >
                <motion.div
                  animate={loading ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Bell className="w-5 h-5" />
              </Button>
            </motion.div>

          </div>
        </motion.div>

        {/* Main Content */}
        <div className="p-6 pb-24">


          {/* Greeting Section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Crypto Explorer'}! 👋
            </h1>
            <p className="text-gray-400">
              Ready to explore the crypto universe?
            </p>
          </motion.div>

          {/* Balance Section */}
          <motion.div 
            className="text-center py-8 mb-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-gray-400 text-sm">Total Portfolio Value</span>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setShowBalances(!showBalances)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 p-1 hover:text-white transition-colors duration-200"
                >
                  {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </motion.div>
            </div>
            
            <motion.div 
              className="relative"
              animate={balanceAnimation ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {showBalances ? `$${getTotalPortfolioValue()}` : '••••••'}
              </div>
              <div className="text-gray-400 text-sm flex items-center justify-center">
                <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
                <span className="text-green-400">Your crypto journey starts here</span>
              </div>
            </motion.div>

            {/* Animated Balance Circle */}
            <motion.div 
              className="mx-auto mt-6 w-32 h-32 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-blue-500/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full border-4 border-purple-500/30"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Wallet className="w-8 h-8 text-blue-400" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="grid grid-cols-2 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {actionButtons.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                >
                  <Link to={action.to}>
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className={`w-6 h-6 ${action.textColor}`} />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold">{action.label}</div>
                            <div className="text-gray-400 text-sm">{action.description}</div>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Quick Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            {quickStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm text-center">
                    <CardContent className="p-4">
                      <IconComponent className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                      <div className="text-white font-bold text-lg">{stat.value}</div>
                      <div className="text-gray-400 text-xs">{stat.label}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Cards Coming Soon Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            whileHover={{ scale: 1.02 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <CreditCard className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-lg">Crypto Cards Coming Soon! 🚀</div>
                    <div className="text-gray-300 text-sm">Spend your crypto anywhere with our upcoming card features</div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Crypto Assets */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Your Wallets</h3>
              <Link to="/wallets">
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                  View All
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence>
                {getNetworkAssets().length > 0 ? (
                  getNetworkAssets().map((asset, index) => (
                    <motion.div
                      key={asset.network}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 bg-gradient-to-r ${asset.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                                {asset.icon}
                              </div>
                              <div>
                                <div className="text-white font-semibold">{asset.symbol}</div>
                                <div className="text-gray-400 text-sm">{asset.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">{asset.balance}</div>
                              <div className="text-gray-400 text-sm">≈ ${asset.value}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm border-dashed">
                      <CardContent className="p-8 text-center">
                        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-gray-400 mb-4">No wallets found</div>
                        <Button 
                          onClick={generateWallet}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                          disabled={loading}
                        >
                          {loading ? 'Creating...' : 'Create Your First Wallet'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* DeFi Features Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            whileHover={{ scale: 1.02 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-green-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <TrendingUp className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-lg">DeFi & Staking Coming Soon! 🌟</div>
                    <div className="text-gray-300 text-sm">Earn passive income with our upcoming DeFi features</div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    Soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-semibold">Recent Activity</h3>
              <Link to="/transactions">
                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                  View All
                </Button>
              </Link>
            </div>
            
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm border-dashed">
              <CardContent className="p-8 text-center">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2">No transactions yet</div>
                <div className="text-gray-500 text-sm">Your transaction history will appear here</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Navigation */}
        <motion.div 
          className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/10 z-50"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.2 }}
        >
          <div className="grid grid-cols-4 py-3">
            <Link to="/dashboard" className="flex flex-col items-center py-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <Home className="w-6 h-6 text-blue-500 mb-1" />
                <span className="text-blue-500 text-xs font-medium">Home</span>
              </motion.div>
            </Link>
            <Link to="/cards" className="flex flex-col items-center py-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center relative"
              >
                <CreditCard className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-gray-400 text-xs">Cards</span>
                <Badge className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded-full scale-75">
                  Soon
                </Badge>
              </motion.div>
            </Link>
            <Link to="/advanced-features" className="flex flex-col items-center py-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center relative"
              >
                <TrendingUp className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-gray-400 text-xs">DeFi</span>
                <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full scale-75">
                  Soon
                </Badge>
              </motion.div>
            </Link>
            <Link to="/settings" className="flex flex-col items-center py-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <Settings className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-gray-400 text-xs">Settings</span>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;


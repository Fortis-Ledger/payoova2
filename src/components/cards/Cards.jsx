import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  ArrowLeft,
  Smartphone,
  Globe,
  Shield,
  Zap,
  Clock,
  Star,
  TrendingUp,
  Lock,
  Settings,
  Wifi,
  Nfc,
  Eye,
  Copy,
  Download,
  Plus,
  RefreshCw,
  Home,
  Gift,
  MoreHorizontal,
  Sparkles,
  Calendar,
  Bell,
  ArrowRight
} from 'lucide-react';
// Card types for selection
const cardTypes = [
  {
    id: 'virtual',
    name: 'Virtual Card',
    description: 'Instant digital card for online payments',
    icon: Smartphone,
    features: ['Instant activation', 'Online payments', 'Mobile wallet integration', 'Secure transactions'],
    comingSoon: true
  },
  {
    id: 'physical',
    name: 'Physical Card',
    description: 'Premium metal card for in-store and online use',
    icon: CreditCard,
    features: ['Contactless payments', 'ATM withdrawals', 'Global acceptance', 'Premium metal design'],
    comingSoon: true
  }
];

const cardFeatures = [
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Your cards are protected with advanced encryption and fraud monitoring'
  },
  {
    icon: Globe,
    title: 'Global Acceptance',
    description: 'Use your cards anywhere Visa is accepted worldwide'
  },
  {
    icon: Zap,
    title: 'Instant Transactions',
    description: 'Real-time payments with instant notifications'
  },
  {
    icon: Lock,
    title: 'Complete Control',
    description: 'Freeze, unfreeze, and manage your cards instantly'
  }
];

const Cards = () => {
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleCardTypeSelect = (cardType) => {
    setSelectedCardType(cardType);
  };

  const handleApplyCard = () => {
    setShowComingSoon(true);
  };

  const renderCardDesign = (type, isPreview = false) => {
    const isVirtual = type === 'virtual';
    return (
      <div className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 overflow-hidden ${
        isPreview ? 'w-full h-48' : 'w-80 h-48'
      } shadow-2xl border border-gray-700`}>


        {/* Card Content */}
        <div className="relative z-10 h-full flex flex-col justify-between">
          {/* Top Section */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-white text-lg font-bold tracking-wide">PAYOOVA</div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mt-1">
                {isVirtual ? 'VIRTUAL CARD' : 'PHYSICAL CARD'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
              {isVirtual ? (
                <Wifi className="w-4 h-4 text-black" />
              ) : (
                <Nfc className="w-4 h-4 text-black" />
              )}
            </div>
          </div>



          {/* Bottom Section */}
          <div className="flex justify-between items-end">
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide">CARD HOLDER</div>
              <div className="text-white text-sm font-medium tracking-wide">YOUR NAME</div>
            </div>
            <div className="text-right">
               <div className="text-gray-400 text-xs uppercase tracking-wide">EXPIRES</div>
               <div className="text-white text-sm font-medium tracking-wide">MM/YY</div>
             </div>
          </div>
        </div>




      </div>
    );
  };

  // Card Selection View
  if (showCardSelection) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-800">
          <Button 
            variant="ghost" 
            onClick={() => setShowCardSelection(false)}
            className="text-white p-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6">Choose Card</h1>
          
          {/* Card Type Tabs */}
          <div className="flex bg-gray-800 rounded-full p-1 mb-8">
            <button 
              onClick={() => handleCardTypeSelect(cardTypes[0])}
              className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-colors ${
                selectedCardType?.id === 'virtual' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400'
              }`}
            >
              Virtual Card
            </button>
            <button 
              onClick={() => handleCardTypeSelect(cardTypes[1])}
              className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-colors ${
                selectedCardType?.id === 'physical' 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-400'
              }`}
            >
              Physical Card
            </button>
          </div>

          {/* Card Preview */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {selectedCardType?.id === 'physical' ? (
                // Physical Card Design
                <div className="w-80 h-48 bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-8 h-6 bg-gray-300 rounded-sm"></div>
                  <div className="text-white text-right transform rotate-90 absolute right-4 top-1/2 -translate-y-1/2 font-bold text-lg tracking-wider">
                    PAYOOVA
                  </div>
                  <div className="absolute bottom-4 left-4 text-white font-bold text-lg">
                    VISA
                  </div>
                </div>
              ) : (
                // Virtual Card Design
                <div className="w-80 h-48 bg-gradient-to-br from-gray-800 to-black rounded-2xl p-6 relative overflow-hidden border border-gray-600">
                  <div className="text-white text-right transform rotate-90 absolute right-4 top-1/2 -translate-y-1/2 font-bold text-lg tracking-wider">
                    PAYOOVA
                  </div>
                  <div className="absolute bottom-4 left-4 text-white font-bold text-lg">
                    VISA
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">G</span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedCardType?.id === 'virtual' && (
                <div className="absolute bottom-2 right-2 text-xs text-blue-400 flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                  Customizable
                </div>
              )}
            </div>
          </div>

          {/* Card Info */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2">
              {selectedCardType?.id === 'physical' ? 'Physical Card' : 'Virtual Card'}
            </h2>
            <p className="text-gray-400">
              {selectedCardType?.id === 'physical' 
                ? 'Tap and Pay, ATM withdrawal' 
                : 'Pay contactless online or in-store'}
            </p>
          </div>

          {/* Apply Button */}
          <Button 
            onClick={handleApplyCard}
            className="w-full bg-white text-black font-semibold py-4 rounded-full text-lg hover:bg-gray-100"
          >
            Apply Card • Coming Soon
          </Button>
        </div>
      </div>
    );
  }

  // Main Cards Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Cards</h1>
            <p className="text-gray-400 mt-1">Manage your digital payment cards</p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                <Bell className="w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => {
                  setSelectedCardType(cardTypes[0]);
                  setShowCardSelection(true);
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Get Card
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Coming Soon Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mb-8"
        >
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
            >
              <CreditCard className="w-12 h-12 text-white" />
            </motion.div>
            
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Premium Cards Coming Soon
              </h2>
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            
            <p className="text-gray-300 text-lg mb-6 max-w-md mx-auto">
              Get ready for the future of digital payments with our premium virtual and physical cards
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-blue-400 mb-8">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Expected Launch: Q2 2024</span>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={() => setShowComingSoon(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl text-lg font-semibold"
              >
                Notify Me
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Features Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6 mb-8"
        >
          <h3 className="text-xl font-semibold mb-6 text-center">What's Coming</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Smartphone,
                title: "Virtual Cards",
                description: "Instant digital cards for online payments",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: CreditCard,
                title: "Physical Cards",
                description: "Premium metal cards for everyday use",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Shield,
                title: "Advanced Security",
                description: "Bank-level encryption and fraud protection",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Globe,
                title: "Global Acceptance",
                description: "Use anywhere Visa is accepted worldwide",
                color: "from-orange-500 to-red-500"
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Transactions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-semibold">Transactions</h3>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-400">
                <Download className="w-4 h-4" />
              </Button>
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          {/* Transactions - Empty State */}
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">No Transactions Yet</h3>
            <p className="text-gray-400 text-sm mb-4">
              Your card transactions will appear here once you start using your cards.
            </p>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
        <div className="grid grid-cols-4 py-2">
          <Link to="/dashboard" className="flex flex-col items-center py-2">
            <Home className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-gray-400 text-xs">Home</span>
          </Link>
          <Link to="/cards" className="flex flex-col items-center py-2">
            <CreditCard className="w-6 h-6 text-red-500 mb-1" />
            <span className="text-red-500 text-xs font-medium">Card</span>
          </Link>
          <Link to="/advanced-features" className="flex flex-col items-center py-2">
            <Gift className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-gray-400 text-xs">Benefits</span>
          </Link>
          <Link to="/settings" className="flex flex-col items-center py-2">
            <Settings className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-gray-400 text-xs">Hub</span>
          </Link>
        </div>
      </div>

      {/* Coming Soon Modal */}
      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowComingSoon(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-3xl p-8 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                
                <h3 className="text-3xl font-bold text-white mb-4">
                  Get Early Access
                </h3>
                <p className="text-gray-300 text-lg">
                  Be among the first to experience our revolutionary card platform
                </p>
              </div>

              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Zap, title: "Instant Activation", color: "from-yellow-500 to-orange-500" },
                    { icon: Shield, title: "Bank Security", color: "from-green-500 to-emerald-500" },
                    { icon: Globe, title: "Global Access", color: "from-blue-500 to-cyan-500" },
                    { icon: Bell, title: "Real-time Alerts", color: "from-purple-500 to-pink-500" }
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="bg-slate-700/50 rounded-2xl p-4 text-center"
                      >
                        <div className={`w-10 h-10 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-white text-sm font-medium">{feature.title}</p>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="bg-slate-700/30 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-semibold">Launch Timeline</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Beta Testing</span>
                      <span className="text-blue-400">Q1 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Public Launch</span>
                      <span className="text-green-400">Q2 2024</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => {
                      // Here you would save notification preferences
                      setShowComingSoon(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 rounded-2xl text-lg font-semibold"
                  >
                    <Bell className="w-5 h-5 mr-2" />
                    Notify Me When Ready
                  </Button>
                </motion.div>
                
                <Button
                  onClick={() => setShowComingSoon(false)}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white hover:bg-white/10 py-3 rounded-2xl"
                >
                  Maybe Later
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cards;

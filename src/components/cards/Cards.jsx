import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CreditCard,
  Plus,
  ArrowLeft,
  Smartphone,
  Globe,
  Shield,
  Zap,
  Clock,
  Star,
  TrendingUp,
  Lock,
  Eye,
  Settings,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Mock card data for Redot Pay-like design
const mockCards = [
  {
    id: 1,
    name: 'Payoova Virtual Card',
    type: 'virtual',
    cardNumber: '4532 **** **** 1234',
    balance: 2450.00,
    currency: 'USD',
    status: 'active',
    gradient: 'from-blue-500 to-purple-600',
    icon: Smartphone
  },
  {
    id: 2,
    name: 'Payoova Physical Card',
    type: 'physical',
    cardNumber: '4532 **** **** 5678',
    balance: 1200.00,
    currency: 'USD',
    status: 'coming_soon',
    gradient: 'from-purple-500 to-pink-600',
    icon: CreditCard
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
  const { user } = useAuth();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const handleCardClick = (card) => {
    if (card.status === 'coming_soon') {
      setShowComingSoon(true);
    } else {
      setSelectedCard(card);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/dashboard" className="flex items-center space-x-3 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Payoova <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Cards</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Spend your crypto anywhere with our virtual and physical cards.
            Bank-level security meets crypto convenience.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {mockCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Card
                key={card.id}
                className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                onClick={() => handleCardClick(card)}
              >
                <CardContent className="p-8">
                  {/* Card Visual */}
                  <div className={`relative bg-gradient-to-br ${card.gradient} rounded-2xl p-6 mb-6 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                    {/* Card Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-4 right-4 w-12 h-12 border-2 border-white/30 rounded-full"></div>
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-white/30 rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full"></div>
                    </div>

                    {/* Card Content */}
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-white/80 text-sm">Payoova</div>
                            <div className="text-white font-semibold">{card.type === 'virtual' ? 'Virtual' : 'Physical'}</div>
                          </div>
                        </div>
                        <div className="text-white/60 text-sm">
                          {card.status === 'coming_soon' ? 'Coming Soon' : 'Active'}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-white font-mono text-lg tracking-wider">
                          {card.cardNumber}
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-white/60 text-xs uppercase tracking-wide">Balance</div>
                            <div className="text-white text-2xl font-bold">
                              ${card.balance.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white/60 text-xs uppercase tracking-wide">Valid Thru</div>
                            <div className="text-white font-mono">12/28</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">{card.name}</h3>
                      {card.status === 'active' ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          Coming Soon
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-400">
                      {card.type === 'virtual'
                        ? 'Perfect for online shopping and digital payments. Instant activation and complete control.'
                        : 'Physical card for in-store purchases and ATM withdrawals. Premium metal design with contactless payments.'
                      }
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Shield className="w-4 h-4" />
                          <span>Secure</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Globe className="w-4 h-4" />
                          <span>Global</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span>Instant</span>
                        </div>
                      </div>

                      {card.status === 'active' ? (
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-yellow-400 hover:text-yellow-300">
                          <Clock className="w-4 h-4 mr-2" />
                          Notify Me
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Why Choose Payoova Cards?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-white/10 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-2">$2.4B+</div>
                <div className="text-gray-400">Total Volume Processed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">150K+</div>
                <div className="text-gray-400">Active Cardholders</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-gray-400">Uptime Guarantee</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Dialog */}
        <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl">Coming Soon!</DialogTitle>
              <DialogDescription className="text-center text-gray-400">
                Physical cards are currently in development. We're working hard to bring you the best crypto card experience.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">What to expect:</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>Premium metal card design</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>Global acceptance at 50M+ merchants</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span>Cashback rewards on every purchase</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>Advanced security features</span>
                  </li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowComingSoon(false)}
                  className="flex-1 text-gray-400 hover:text-white"
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                  onClick={() => setShowComingSoon(false)}
                >
                  Notify Me When Ready
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Cards;

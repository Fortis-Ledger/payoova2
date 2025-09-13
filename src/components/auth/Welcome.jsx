import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Smartphone,
  Lock,
  TrendingUp,
  Star,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Welcome = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your crypto is protected with military-grade encryption",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Send and receive crypto in seconds, not minutes",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Access your funds anywhere, anytime, worldwide",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const walletAnimation = {
    initial: { scale: 0.8, opacity: 0, rotateY: -30 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      rotateY: 0,
      transition: { 
        duration: 1.2, 
        ease: "easeOut",
        delay: 0.3
      }
    }
  };

  const floatingAnimation = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseAnimation = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-60 h-60 bg-cyan-500/5 rounded-full blur-2xl"
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

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Header */}
        <motion.div 
          className="flex items-center space-x-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
            {...pulseAnimation}
          >
            <Wallet className="w-7 h-7 text-white" />
          </motion.div>
          <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            PAYOOVA
          </span>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
            v2.0
          </Badge>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Animated Wallet Illustration */}
          <motion.div 
            className="relative mx-auto w-64 h-64 mb-8"
            {...walletAnimation}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl shadow-2xl border border-gray-600"
              {...floatingAnimation}
            >
              {/* Wallet Card Design */}
              <div className="absolute inset-4 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 rounded-2xl p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-white/80 text-xs font-medium">PAYOOVA</div>
                    <div className="text-white/60 text-xs mt-1">Digital Vault</div>
                  </div>
                  <motion.div 
                    className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <Lock className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-white/60 text-xs">•••• •••• •••• 0079</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-white/80 text-xs">Balance</div>
                      <div className="text-white font-bold text-lg">$24.50</div>
                    </div>
                    <div className="text-white font-bold text-lg">₿</div>
                  </div>
                </div>
              </div>
              
              {/* Floating Dollar Sign */}
              <motion.div 
                className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm"
                animate={{
                  y: [-5, 5, -5],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                $
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Title and Description */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <h1 className="text-4xl font-bold leading-tight">
              Your Secure{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Digital Vault
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Simple & secure crypto wallet for the modern world
            </p>
          </motion.div>

          {/* Features Carousel */}
          <motion.div 
            className="h-20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                className="flex items-center space-x-3 text-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${features[currentStep].color} flex items-center justify-center`}>
                  <features[currentStep].icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">{features[currentStep].title}</div>
                  <div className="text-sm text-gray-400">{features[currentStep].description}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="space-y-4 pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <Link to="/signup">
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                size="lg"
              >
                Launch your crypto journey!
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            <Link to="/login">
              <Button 
                variant="outline" 
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white py-4 rounded-2xl transition-all duration-300"
                size="lg"
              >
                Log in
              </Button>
            </Link>
          </motion.div>

          {/* Feature Indicators */}
          <motion.div 
            className="flex justify-center space-x-2 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            {features.map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? 'bg-blue-500 w-6' : 'bg-gray-600'
                }`}
                animate={{
                  scale: index === currentStep ? 1.2 : 1
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Bottom Text */}
        <motion.p 
          className="text-center text-gray-500 text-sm mt-8 max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          Fly high with a PAYOOVA account - secure, fast, and easy transactions anytime, anywhere!
        </motion.p>
      </div>
    </div>
  );
};

export default Welcome;
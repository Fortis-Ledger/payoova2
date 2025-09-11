import React from 'react';
import { Wallet } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <div className="absolute inset-0 w-16 h-16 border-2 border-blue-500/30 rounded-lg animate-spin mx-auto"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Payoova</h2>
          <p className="text-gray-400">Loading your wallet...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;


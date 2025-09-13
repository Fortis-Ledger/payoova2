import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/wallet/Dashboard';
import SendCrypto from './components/wallet/SendCrypto';
import ReceiveCrypto from './components/wallet/ReceiveCrypto';
import TransactionHistory from './components/wallet/TransactionHistory';
import AdvancedFeatures from './components/wallet/AdvancedFeatures';
import Cards from './components/cards/Cards';
import KYCVerification from './components/kyc/KYCVerification';
import UserSettings from './components/user/UserSettings';
import AdminPanel from './components/admin/AdminPanel';
import AdminAnalytics from './components/admin/AdminAnalytics';
import TestRunner from './components/common/TestRunner';
import SupabaseTest from './test/SupabaseTest';
import MobileNavigation from './components/common/MobileNavigation';
import LoadingScreen from './components/common/LoadingScreen';

// Supabase Context
import { AuthProvider, useAuth } from './contexts/SupabaseAuthContext.jsx';
import { WalletProvider } from './contexts/SupabaseWalletContext.jsx';
import { UserProvider } from './contexts/SupabaseUserContext.jsx';
import { KYCProvider } from './contexts/SupabaseKYCContext.jsx';
import { CardProvider } from './contexts/SupabaseCardContext.jsx';
import { Web3Provider } from './contexts/Web3Context';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Admin routes
  if (user && user.role === 'admin') {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // User routes
  if (user) {
    return (
      <Web3Provider>
        <WalletProvider>
          <UserProvider>
            <KYCProvider>
              <CardProvider>
                <MobileNavigation />
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/send" element={<SendCrypto />} />
                  <Route path="/receive" element={<ReceiveCrypto />} />
                  <Route path="/transactions" element={<TransactionHistory />} />
                  <Route path="/cards" element={<Cards />} />
                  <Route path="/advanced-features" element={<AdvancedFeatures />} />
                  <Route path="/kyc" element={<KYCVerification />} />
                  <Route path="/settings" element={<UserSettings />} />
                  <Route path="/test-runner" element={<TestRunner />} />
                  <Route path="/supabase-test" element={<SupabaseTest />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </CardProvider>
            </KYCProvider>
          </UserProvider>
        </WalletProvider>
      </Web3Provider>
    );
  }

  // Public routes (not authenticated)
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="dark min-h-screen bg-background text-foreground">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;


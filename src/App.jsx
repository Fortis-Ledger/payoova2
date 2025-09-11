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
import AdminPanel from './components/admin/AdminPanel';
import AdminAnalytics from './components/admin/AdminAnalytics';
import TestRunner from './components/common/TestRunner';
import MobileNavigation from './components/common/MobileNavigation';
import LoadingScreen from './components/common/LoadingScreen';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';

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
      <WalletProvider>
        <MobileNavigation />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send" element={<SendCrypto />} />
          <Route path="/receive" element={<ReceiveCrypto />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/advanced-features" element={<AdvancedFeatures />} />
          <Route path="/test-runner" element={<TestRunner />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </WalletProvider>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;


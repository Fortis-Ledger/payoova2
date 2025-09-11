import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Wallet,
  Send,
  Download,
  History,
  Settings,
  Menu,
  Home,
  User,
  Shield,
  LogOut,
  Bell,
  Smartphone,
  FileText,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/send', label: 'Send Crypto', icon: Send },
    { path: '/receive', label: 'Receive', icon: Download },
    { path: '/transactions', label: 'History', icon: History },
    { path: '/cards', label: 'My Cards', icon: CreditCard },
    { path: '/kyc', label: 'KYC/AML', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminItems = [
    { path: '/admin/dashboard', label: 'Admin Dashboard', icon: Shield },
    { path: '/admin/users', label: 'Users', icon: User },
    { path: '/admin/transactions', label: 'Transactions', icon: History },
    { path: '/admin/kyc', label: 'KYC/AML Admin', icon: FileText },
    { path: '/admin/analytics', label: 'Analytics', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigation = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Payoova</span>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              Live
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Bell className="w-5 h-5" />
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-slate-900 border-white/10">
                <SheetHeader>
                  <SheetTitle className="text-white flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>{user?.name}</span>
                  </SheetTitle>
                  <SheetDescription className="text-gray-400">
                    {user?.email}
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-8 space-y-6">
                  {/* User Navigation */}
                  {user?.role !== 'admin' && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                        <Wallet className="w-4 h-4" />
                        <span>Wallet</span>
                      </h3>
                      <div className="space-y-2">
                        {navigationItems.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={handleNavigation}
                              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                isActive(item.path)
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <IconComponent className="w-5 h-5" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Admin Navigation */}
                  {user?.role === 'admin' && (
                    <div>
                      <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </h3>
                      <div className="space-y-2">
                        {adminItems.map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={handleNavigation}
                              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                isActive(item.path)
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <IconComponent className="w-5 h-5" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Additional Features */}
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center space-x-2">
                      <Smartphone className="w-4 h-4" />
                      <span>Features</span>
                    </h3>
                    <div className="space-y-2">
                      <Link
                        to="/advanced-features"
                        onClick={handleNavigation}
                        className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Advanced Features</span>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                          New
                        </Badge>
                      </Link>
                      <Link
                        to="/test-runner"
                        onClick={handleNavigation}
                        className="flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Shield className="w-5 h-5" />
                        <span>API Tests</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          Dev
                        </Badge>
                      </Link>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="pt-6 border-t border-white/10">
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-white/10">
        <div className="flex items-center justify-around p-2">
          {navigationItems.slice(0, 4).map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer for fixed navigation */}
      <div className="lg:hidden h-16" /> {/* Top spacer */}
      <div className="lg:hidden h-20" /> {/* Bottom spacer */}
    </>
  );
};

export default MobileNavigation;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Settings,
  Save,
  User,
  Mail,
  Shield,
  Bell,
  Globe,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';

const UserSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Profile Settings
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    timezone: 'UTC',
    language: 'en',
    
    // Security Settings
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    
    // Privacy Settings
    profileVisibility: 'private',
    dataSharing: false,
    
    // Notification Settings
    transactionAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
    
    // Display Settings
    theme: 'dark',
    currency: 'USD',
    hideBalances: false
  });

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Settings saved successfully!');
    } catch (error) {
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">Settings</span>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className={`mb-6 ${
            message.includes('success') ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}>
            {message.includes('success') ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertDescription className={
              message.includes('success') ? 'text-green-400' : 'text-red-400'
            }>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-input border-border text-foreground"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security & Privacy
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage your account security and privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Two-Factor Authentication</Label>
                  <p className="text-muted-foreground text-sm">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(checked) => handleInputChange('twoFactorEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Hide Wallet Balances</Label>
                  <p className="text-muted-foreground text-sm">Hide balance amounts in the interface</p>
                </div>
                <Switch
                  checked={settings.hideBalances}
                  onCheckedChange={(checked) => handleInputChange('hideBalances', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Data Sharing</Label>
                  <p className="text-muted-foreground text-sm">Allow anonymous usage data collection</p>
                </div>
                <Switch
                  checked={settings.dataSharing}
                  onCheckedChange={(checked) => handleInputChange('dataSharing', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose how you want to be notified about account activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Email Notifications</Label>
                  <p className="text-muted-foreground text-sm">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Transaction Alerts</Label>
                  <p className="text-muted-foreground text-sm">Get notified about wallet transactions</p>
                </div>
                <Switch
                  checked={settings.transactionAlerts}
                  onCheckedChange={(checked) => handleInputChange('transactionAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Security Alerts</Label>
                  <p className="text-muted-foreground text-sm">Important security notifications</p>
                </div>
                <Switch
                  checked={settings.securityAlerts}
                  onCheckedChange={(checked) => handleInputChange('securityAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">SMS Notifications</Label>
                  <p className="text-muted-foreground text-sm">Receive notifications via SMS</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Display & Language
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Customize your interface preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-foreground">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => handleInputChange('language', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-foreground">Display Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="BTC">BTC (₿)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Shield,
  Mail,
  Database,
  Key,
  Globe,
  Clock,
  DollarSign
} from 'lucide-react';
import axios from 'axios';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // Security Settings
    jwt_expiry_hours: 24,
    bcrypt_rounds: 12,
    rate_limit_requests: 100,
    rate_limit_window: 900,

    // Email Settings
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',

    // Blockchain Settings
    ethereum_rpc_url: 'https://mainnet.infura.io/v3/demo',
    polygon_rpc_url: 'https://polygon-mainnet.infura.io/v3/demo',
    bsc_rpc_url: 'https://bsc-dataseed.binance.org/',
    infura_project_id: '',

    // API Keys
    coingecko_api_key: '',

    // System Settings
    maintenance_mode: false,
    debug_mode: false,
    log_level: 'INFO'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, this would load from backend
      // For now, we'll use default values
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage('');

      // In a real app, this would save to backend
      // For now, we'll simulate saving
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-gray-400">Configure platform settings and preferences</p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {message && (
        <Alert className={`${
          message.includes('success')
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          {message.includes('success') ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription className={
            message.includes('success') ? 'text-green-400' : 'text-red-400'
          }>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Security Settings */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure authentication and security parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="jwt_expiry" className="text-white">JWT Token Expiry (hours)</Label>
              <Input
                id="jwt_expiry"
                type="number"
                value={settings.jwt_expiry_hours}
                onChange={(e) => handleInputChange('jwt_expiry_hours', parseInt(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bcrypt_rounds" className="text-white">Bcrypt Rounds</Label>
              <Input
                id="bcrypt_rounds"
                type="number"
                value={settings.bcrypt_rounds}
                onChange={(e) => handleInputChange('bcrypt_rounds', parseInt(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_limit_requests" className="text-white">Rate Limit Requests</Label>
              <Input
                id="rate_limit_requests"
                type="number"
                value={settings.rate_limit_requests}
                onChange={(e) => handleInputChange('rate_limit_requests', parseInt(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate_limit_window" className="text-white">Rate Limit Window (seconds)</Label>
              <Input
                id="rate_limit_window"
                type="number"
                value={settings.rate_limit_window}
                onChange={(e) => handleInputChange('rate_limit_window', parseInt(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Email Configuration
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure SMTP settings for email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="smtp_host" className="text-white">SMTP Host</Label>
              <Input
                id="smtp_host"
                type="text"
                value={settings.smtp_host}
                onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_port" className="text-white">SMTP Port</Label>
              <Input
                id="smtp_port"
                type="number"
                value={settings.smtp_port}
                onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_user" className="text-white">SMTP Username</Label>
              <Input
                id="smtp_user"
                type="email"
                value={settings.smtp_user}
                onChange={(e) => handleInputChange('smtp_user', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_pass" className="text-white">SMTP Password</Label>
              <Input
                id="smtp_pass"
                type="password"
                value={settings.smtp_pass}
                onChange={(e) => handleInputChange('smtp_pass', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Settings */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Blockchain Configuration
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure RPC endpoints and blockchain connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ethereum_rpc" className="text-white">Ethereum RPC URL</Label>
              <Input
                id="ethereum_rpc"
                type="url"
                value={settings.ethereum_rpc_url}
                onChange={(e) => handleInputChange('ethereum_rpc_url', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="polygon_rpc" className="text-white">Polygon RPC URL</Label>
              <Input
                id="polygon_rpc"
                type="url"
                value={settings.polygon_rpc_url}
                onChange={(e) => handleInputChange('polygon_rpc_url', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bsc_rpc" className="text-white">BSC RPC URL</Label>
              <Input
                id="bsc_rpc"
                type="url"
                value={settings.bsc_rpc_url}
                onChange={(e) => handleInputChange('bsc_rpc_url', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="infura_project_id" className="text-white">Infura Project ID</Label>
              <Input
                id="infura_project_id"
                type="text"
                value={settings.infura_project_id}
                onChange={(e) => handleInputChange('infura_project_id', e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Key className="w-5 h-5 mr-2" />
            API Keys
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure third-party API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="coingecko_api" className="text-white">CoinGecko API Key</Label>
            <Input
              id="coingecko_api"
              type="password"
              value={settings.coingecko_api_key}
              onChange={(e) => handleInputChange('coingecko_api_key', e.target.value)}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Enter your CoinGecko API key"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            System Configuration
          </CardTitle>
          <CardDescription className="text-gray-400">
            General system settings and maintenance options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Maintenance Mode</Label>
              <p className="text-gray-400 text-sm">Enable maintenance mode to disable user access</p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => handleInputChange('maintenance_mode', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Debug Mode</Label>
              <p className="text-gray-400 text-sm">Enable debug logging and error details</p>
            </div>
            <Switch
              checked={settings.debug_mode}
              onCheckedChange={(checked) => handleInputChange('debug_mode', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="log_level" className="text-white">Log Level</Label>
            <Select value={settings.log_level} onValueChange={(value) => handleInputChange('log_level', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEBUG">Debug</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;

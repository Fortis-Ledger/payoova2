import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  Globe, 
  TrendingUp, 
  Zap, 
  Settings,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const AdvancedFeatures = () => {
  const [features, setFeatures] = useState({
    twoFactor: false,
    biometric: false,
    multiSig: false,
    hardwareWallet: false,
    autoBackup: true,
    priceAlerts: false
  });

  const [priceAlert, setPriceAlert] = useState({
    coin: 'ETH',
    price: '',
    condition: 'above'
  });

  const toggleFeature = (feature) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const advancedFeaturesList = [
    {
      id: 'twoFactor',
      name: 'Two-Factor Authentication',
      description: 'Add an extra layer of security with 2FA',
      icon: Shield,
      status: features.twoFactor ? 'enabled' : 'disabled',
      premium: false
    },
    {
      id: 'biometric',
      name: 'Biometric Authentication',
      description: 'Use fingerprint or face recognition',
      icon: Smartphone,
      status: features.biometric ? 'enabled' : 'disabled',
      premium: false
    },
    {
      id: 'multiSig',
      name: 'Multi-Signature Wallet',
      description: 'Require multiple signatures for transactions',
      icon: Shield,
      status: features.multiSig ? 'enabled' : 'disabled',
      premium: true
    },
    {
      id: 'hardwareWallet',
      name: 'Hardware Wallet Support',
      description: 'Connect Ledger or Trezor devices',
      icon: Settings,
      status: features.hardwareWallet ? 'enabled' : 'disabled',
      premium: true
    },
    {
      id: 'autoBackup',
      name: 'Automatic Backup',
      description: 'Encrypted cloud backup of wallet data',
      icon: Globe,
      status: features.autoBackup ? 'enabled' : 'disabled',
      premium: false
    },
    {
      id: 'priceAlerts',
      name: 'Price Alerts',
      description: 'Get notified when prices hit your targets',
      icon: TrendingUp,
      status: features.priceAlerts ? 'enabled' : 'disabled',
      premium: false
    }
  ];

  const getStatusBadge = (status, premium) => {
    if (premium && status === 'disabled') {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Premium</Badge>;
    }
    
    return status === 'enabled' 
      ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
      : <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Disabled</Badge>;
  };

  const getStatusIcon = (status) => {
    return status === 'enabled' 
      ? <CheckCircle className="w-5 h-5 text-green-400" />
      : <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Advanced Features</h1>
          <p className="text-gray-400">Enhance your wallet security and functionality</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {advancedFeaturesList.map((feature) => {
            const IconComponent = feature.icon;
            
            return (
              <Card key={feature.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-lg">{feature.name}</CardTitle>
                        <p className="text-gray-400 text-sm">{feature.description}</p>
                      </div>
                    </div>
                    {getStatusIcon(feature.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(feature.status, feature.premium)}
                    <Button
                      onClick={() => toggleFeature(feature.id)}
                      disabled={feature.premium && feature.status === 'disabled'}
                      size="sm"
                      variant={feature.status === 'enabled' ? 'destructive' : 'default'}
                      className={feature.status === 'enabled' 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                      }
                    >
                      {feature.status === 'enabled' ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Price Alerts Configuration */}
        {features.priceAlerts && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span>Price Alert Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">Cryptocurrency</Label>
                  <select 
                    value={priceAlert.coin}
                    onChange={(e) => setPriceAlert(prev => ({...prev, coin: e.target.value}))}
                    className="w-full mt-1 p-2 bg-white/10 border border-white/20 rounded-md text-white"
                  >
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="MATIC">Polygon (MATIC)</option>
                    <option value="BNB">Binance Coin (BNB)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-white">Price Target</Label>
                  <Input
                    type="number"
                    placeholder="Enter price"
                    value={priceAlert.price}
                    onChange={(e) => setPriceAlert(prev => ({...prev, price: e.target.value}))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <Label className="text-white">Condition</Label>
                  <select 
                    value={priceAlert.condition}
                    onChange={(e) => setPriceAlert(prev => ({...prev, condition: e.target.value}))}
                    className="w-full mt-1 p-2 bg-white/10 border border-white/20 rounded-md text-white"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Set Price Alert
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Tips */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Info className="w-5 h-5 text-blue-400" />
              <span>Security Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Shield className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-400">
                  <strong>Enable 2FA:</strong> Add two-factor authentication for enhanced security.
                </AlertDescription>
              </Alert>
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <Zap className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  <strong>Hardware Wallet:</strong> Consider using a hardware wallet for large amounts.
                </AlertDescription>
              </Alert>
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">
                  <strong>Regular Backups:</strong> Keep your wallet backed up and recovery phrases secure.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedFeatures;

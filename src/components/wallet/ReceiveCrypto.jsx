import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Download,
  Copy,
  CheckCircle,
  QrCode,
  Wallet,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';

const ReceiveCrypto = () => {
  const { wallets, getBalanceByNetwork, generateWallet, loading } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);

  const networks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500', icon: '⟠' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500', icon: '⬟' },
    { id: 'bsc', name: 'BSC', symbol: 'BNB', color: 'bg-yellow-500', icon: '◆' }
  ];

  // Update selected wallet when network changes
  useEffect(() => {
    if (selectedNetwork) {
      const wallet = wallets.find(w => w.network === selectedNetwork);
      setSelectedWallet(wallet);

      if (wallet) {
        // Generate QR code for the wallet address
        generateQRCode(wallet.address, selectedNetwork);
      }
    } else {
      setSelectedWallet(null);
      setQrCode('');
    }
  }, [selectedNetwork, wallets]);

  const generateQRCode = async (address, network) => {
    try {
      // In a real app, this would call the backend QR service
      // For now, we'll use a placeholder QR code URL
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(address)}`;
      setQrCode(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `payoova-${selectedNetwork}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatAddress = (address) => {
    if (!address) return 'No wallet available';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (address, network) => {
    const explorers = {
      ethereum: 'https://etherscan.io/address/',
      polygon: 'https://polygonscan.com/address/',
      bsc: 'https://bscscan.com/address/'
    };
    return explorers[network] + address;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Receive Crypto</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Network Selection and Address Display */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Select Network</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose which network to receive cryptocurrency on
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => {
                      const wallet = wallets.find(w => w.network === network.id);
                      return (
                        <SelectItem key={network.id} value={network.id}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 ${network.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                              {network.icon}
                            </div>
                            <div>
                              <div className="font-medium">{network.name}</div>
                              <div className="text-sm text-gray-500">
                                {wallet ? 'Wallet available' : 'No wallet - generate first'}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {!selectedNetwork && (
                  <Alert className="bg-blue-500/10 border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-400">
                      Select a network to view your receiving address
                    </AlertDescription>
                  </Alert>
                )}

                {selectedNetwork && !selectedWallet && (
                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-400 space-y-2">
                      <div>No wallet found for this network. Please generate a wallet first.</div>
                      <Button
                        onClick={async () => {
                          const result = await generateWallet(selectedNetwork);
                          if (!result.success) {
                            alert(result.error);
                          }
                        }}
                        disabled={loading}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Generate {networks.find(n => n.id === selectedNetwork)?.name} Wallet
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {selectedWallet && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Your Receiving Address</CardTitle>
                  <CardDescription className="text-gray-400">
                    Share this address to receive cryptocurrency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Address</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        Active
                      </Badge>
                    </div>
                    <div className="font-mono text-white text-sm break-all">
                      {selectedWallet.address}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => copyToClipboard(selectedWallet.address)}
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => window.open(getExplorerUrl(selectedWallet.address, selectedNetwork), '_blank')}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-400 text-sm">
                      Current Balance: <span className="text-white font-semibold">
                        {parseFloat(getBalanceByNetwork(selectedNetwork) || '0').toFixed(6)} {networks.find(n => n.id === selectedNetwork)?.symbol}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* QR Code Display */}
          <div className="space-y-6">
            {selectedWallet && qrCode && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">QR Code</CardTitle>
                  <CardDescription className="text-gray-400">
                    Scan with any crypto wallet app
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg">
                      <img
                        src={qrCode}
                        alt="Wallet QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={downloadQRCode}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>
            )}

            {!selectedWallet && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <QrCode className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">No Wallet Selected</h3>
                  <p className="text-gray-400 text-center">
                    Select a network above to view your QR code and receiving address
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Security Notice */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Security Notice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400 text-sm">
                    Only share this address with trusted senders
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400 text-sm">
                    Verify the address before sending large amounts
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400 text-sm">
                    Keep your wallet secure and never share private keys
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* All Wallets Overview */}
        <div className="mt-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">All Your Wallets</CardTitle>
              <CardDescription className="text-gray-400">
                Quick access to all your receiving addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {networks.map((network) => {
                  const wallet = wallets.find(w => w.network === network.id);
                  const balance = getBalanceByNetwork(network.id);

                  return (
                    <div
                      key={network.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedNetwork(network.id)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-8 h-8 ${network.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                          {network.icon}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{network.name}</div>
                          <div className="text-gray-400 text-sm">{network.symbol}</div>
                        </div>
                      </div>

                      {wallet ? (
                        <div>
                          <div className="text-white text-sm font-mono mb-1">
                            {formatAddress(wallet.address)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            Balance: {parseFloat(balance || '0').toFixed(6)} {network.symbol}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">
                          No wallet generated
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReceiveCrypto;

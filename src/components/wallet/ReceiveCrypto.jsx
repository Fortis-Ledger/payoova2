import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle,
  Share2
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import QRCode from 'qrcode';

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
      
      if (wallet?.address) {
        generateQRCode(wallet.address, selectedNetwork);
      }
    } else {
      setSelectedWallet(null);
      setQrCode('');
    }
  }, [selectedNetwork, wallets]);

  const generateQRCode = async (address, network) => {
    try {
      // Generate proper QR code with address
      const qrDataURL = await QRCode.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCode(qrDataURL);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-10 right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Header */}
      <motion.div 
        className="relative z-10 border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-slate-700/50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </motion.div>
              </Link>
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center"
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Download className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white">Receive Crypto</h1>
                  <p className="text-sm text-gray-400">Generate address & QR code</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
                  <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700/50">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {networks.map((network) => {
                      const wallet = wallets.find(w => w.network === network.id);
                      return (
                        <SelectItem key={network.id} value={network.id} className="text-white hover:bg-slate-700">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 ${network.color} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                              {network.icon}
                            </div>
                            <div>
                              <div className="font-medium">{network.name}</div>
                              <div className="text-sm text-gray-400">
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

            <AnimatePresence>
              {selectedWallet && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <QrCode className="w-5 h-5 text-blue-400" />
                        <span>Your Receiving Address</span>
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Share this address to receive {networks.find(n => n.id === selectedNetwork)?.name} cryptocurrency
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div 
                        className="p-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg border border-slate-500/30"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-400 text-sm font-medium">Address</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <div className="font-mono text-white text-sm break-all bg-slate-900/50 p-3 rounded border border-slate-600/30">
                          {selectedWallet.address}
                        </div>
                      </motion.div>

                      <div className="flex flex-wrap gap-2">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                        </motion.div>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* QR Code Display */}
          <div className="space-y-6">
            <AnimatePresence>
              {selectedWallet && qrCode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-slate-800/50 border-slate-600/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center space-x-2">
                        <QrCode className="w-5 h-5 text-green-400" />
                        <span>QR Code</span>
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Scan with any crypto wallet app to send funds
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <motion.div 
                        className="flex justify-center"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-6 bg-white rounded-xl shadow-lg">
                          <img
                            src={qrCode}
                            alt="Wallet QR Code"
                            className="w-48 h-48"
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={downloadQRCode}
                          className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download QR Code
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!selectedWallet && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-slate-800/30 border-slate-600/30 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <QrCode className="w-16 h-16 text-gray-400 mb-4" />
                      </motion.div>
                      <h3 className="text-white text-lg font-semibold mb-2">No Wallet Selected</h3>
                      <p className="text-gray-400 text-center">
                        Select a network above to view your QR code and receiving address
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Security Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border-slate-600/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <motion.div
                      animate={{
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                    <span>Security Notice</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <motion.div 
                    className="flex items-start space-x-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-400 text-sm">
                      Only share this address with trusted senders
                    </p>
                  </motion.div>
                  <motion.div 
                    className="flex items-start space-x-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-400 text-sm">
                      Verify the address before sending large amounts
                    </p>
                  </motion.div>
                  <motion.div 
                    className="flex items-start space-x-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-400 text-sm">
                      Keep your wallet secure and never share private keys
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* All Wallets Overview */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-700/40 border-slate-600/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Wallet className="w-5 h-5 text-blue-400" />
                </motion.div>
                <span>All Your Wallets</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Quick access to all your receiving addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {networks.map((network, index) => {
                  const wallet = wallets.find(w => w.network === network.id);
                  const balance = getBalanceByNetwork(network.id);

                  return (
                    <motion.div
                      key={network.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:bg-slate-600/40 transition-all cursor-pointer backdrop-blur-sm"
                      onClick={() => {
                        setSelectedNetwork(network.id);
                      }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <motion.div 
                          className={`w-8 h-8 ${network.color} rounded-lg flex items-center justify-center text-white font-bold`}
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          {network.icon}
                        </motion.div>
                        <div>
                          <div className="text-white font-semibold">{network.name}</div>
                          <div className="text-gray-400 text-sm">{network.symbol}</div>
                        </div>
                      </div>

                      {wallet ? (
                        <div>
                          <div className="text-white text-sm font-mono mb-1 bg-slate-900/50 p-2 rounded border border-slate-600/30">
                            {formatAddress(wallet.address)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            Balance: {parseFloat(balance || '0').toFixed(6)} {network.symbol}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <div className="text-gray-400 text-sm mb-2">No wallet generated</div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                generateWallet(network.id);
                              }}
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            >
                              Generate
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ReceiveCrypto;

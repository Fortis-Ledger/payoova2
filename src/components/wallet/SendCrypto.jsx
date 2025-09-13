import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle,
  Wallet,
  DollarSign,
  Clock,
  ExternalLink,
  QrCode,
  Camera,
  Copy,
  Scan,
  Zap,
  Shield
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/SupabaseAuthContext';

import { cryptoAPI } from '../../services/cryptoApi';

const SendCrypto = () => {
  const { user } = useAuth();
  const { wallets, balances, sendCrypto, loading, getBalanceByNetwork, getPriceBySymbol, estimateGasFee } = useWallet();


  const [formData, setFormData] = useState({
    fromNetwork: '',
    toAddress: '',
    amount: '',
    currency: '',
    gasFee: '0'
  });

  const [selectedWallet, setSelectedWallet] = useState(null);
  const [estimatedGas, setEstimatedGas] = useState('0');
  const [totalCost, setTotalCost] = useState('0');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Network, 2: Enter Details, 3: Confirm

  const networks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
    { id: 'bsc', name: 'BSC', symbol: 'BNB', color: 'bg-yellow-500' }
  ];

  // Update selected wallet when network changes
  useEffect(() => {
    if (formData.fromNetwork) {
      const wallet = wallets.find(w => w.network === formData.fromNetwork);
      setSelectedWallet(wallet);
      setFormData(prev => ({
        ...prev,
        currency: wallet ? networks.find(n => n.id === formData.fromNetwork)?.symbol || '' : ''
      }));
    } else {
      setSelectedWallet(null);
    }
  }, [formData.fromNetwork, wallets]);

  // Calculate estimated gas and total cost
  useEffect(() => {
    const calculateGas = async () => {
      if (formData.amount && selectedWallet && formData.toAddress) {
        try {
          // Use real crypto API for gas estimation
          const gasData = await cryptoAPI.getGasPrices();
          let gasFee = 0;
          
          if (formData.fromNetwork === 'ethereum') {
            // Calculate ETH gas fee: gasPrice * gasLimit
            const gasPrice = gasData.ethereum?.standard || 20; // gwei
            const gasLimit = 21000; // standard transfer
            gasFee = (gasPrice * gasLimit) / 1e9; // convert to ETH
          } else if (formData.fromNetwork === 'polygon') {
            gasFee = gasData.polygon?.standard || 0.001;
          } else if (formData.fromNetwork === 'bsc') {
            gasFee = gasData.bsc?.standard || 0.0001;
          }
          
          setEstimatedGas(gasFee.toFixed(6));
          setTotalCost((parseFloat(formData.amount) + gasFee).toFixed(6));
        } catch (error) {
          console.error('Gas estimation error:', error);
          // Fallback to mock estimation
          const baseGas = formData.fromNetwork === 'ethereum' ? 0.001 : 0.0001;
          const gasFee = (parseFloat(formData.amount) * 0.01) + baseGas;
          setEstimatedGas(gasFee.toFixed(6));
          setTotalCost((parseFloat(formData.amount) + gasFee).toFixed(6));
        }
      } else {
        setEstimatedGas('0');
        setTotalCost('0');
      }
    };

    const debounceTimer = setTimeout(calculateGas, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.amount, selectedWallet, formData.fromNetwork, formData.toAddress]);

  const validateAddress = (address) => {
    // Basic Ethereum address validation
    return address && address.startsWith('0x') && address.length === 42;
  };

  const validateAmount = (amount) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;

    const balance = parseFloat(getBalanceByNetwork(formData.fromNetwork));
    const totalRequired = numAmount + parseFloat(estimatedGas);

    return totalRequired <= balance;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!selectedWallet) {
      setError('Please select a wallet to send from');
      return;
    }

    if (!validateAddress(formData.toAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    if (!validateAmount(formData.amount)) {
      setError('Insufficient balance or invalid amount');
      return;
    }

    setSending(true);

    try {
      // Use internal wallet system for all transactions
      const result = await sendCrypto({
        fromAddress: selectedWallet.address,
        toAddress: formData.toAddress,
        amount: formData.amount,
        network: formData.fromNetwork,
        currency: formData.currency
      });

      if (result.success) {
        setSuccess(`Transaction sent successfully! Hash: ${result.transaction.transaction_hash}`);
        // Reset form
        setFormData({
          fromNetwork: '',
          toAddress: '',
          amount: '',
          currency: '',
          gasFee: '0'
        });
        setSelectedWallet(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Transaction failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatBalance = (balance) => {
    return parseFloat(balance || '0').toFixed(6);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white">Send Crypto</h1>
                  <p className="text-sm text-gray-400">Transfer your digital assets securely</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Indicator */}
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  step >= stepNumber
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-slate-700 text-gray-400'
                }`}
                whileHover={{ scale: 1.1 }}
                animate={step === stepNumber ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: step === stepNumber ? Infinity : 0 }}
              >
                {stepNumber}
              </motion.div>
              {stepNumber < 3 && (
                <div className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
                  step > stepNumber ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-slate-700'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mb-8">
          <motion.h2 
            className="text-2xl font-bold text-white mb-2"
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && 'Select Network & Wallet'}
            {step === 2 && 'Enter Transfer Details'}
            {step === 3 && 'Confirm Transaction'}
          </motion.h2>
          <motion.p 
            className="text-gray-400"
            key={`desc-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {step === 1 && 'Choose the network and wallet to send from'}
            {step === 2 && 'Specify recipient address and amount'}
            {step === 3 && 'Review and confirm your transaction'}
          </motion.p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <Alert className="bg-red-500/10 border-red-500/20 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <Alert className="bg-green-500/10 border-green-500/20 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          {step === 1 && (
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Select Network & Wallet</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose the blockchain network and wallet to send from
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  {/* Network Selection */}
                  <div className="space-y-4">
                    <Label className="text-white text-lg font-semibold">Choose Network</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {networks.map((network) => {
                        const wallet = wallets.find(w => w.network === network.id);
                        const isSelected = formData.fromNetwork === network.id;
                        return (
                          <motion.div
                            key={network.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500/10' 
                                : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                            }`}
                            onClick={() => setFormData({...formData, fromNetwork: network.id, currency: network.symbol})}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 ${network.color} rounded-full flex items-center justify-center`}>
                                <span className="text-white text-sm font-bold">{network.symbol[0]}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-white font-semibold">{network.name}</h3>
                                <p className="text-gray-400 text-sm">
                                  {wallet ? `${formatBalance(wallet.balance)} ${network.symbol}` : 'No wallet'}
                                </p>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                                >
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {formData.fromNetwork && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end"
                    >
                      <Button
                        onClick={() => setStep(2)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
                      >
                        Continue
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    </motion.div>
                  )}

                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Send className="w-5 h-5" />
                    <span>Enter Transfer Details</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Specify recipient address and amount to send
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Recipient Address */}
                  <div className="space-y-3">
                    <Label className="text-white text-lg font-semibold">Recipient Address</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="0x... or ENS domain"
                        value={formData.toAddress}
                        onChange={(e) => setFormData({...formData, toAddress: e.target.value})}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 pr-24"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowQRScanner(true)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                        >
                          <QrCode className="w-4 h-4 text-blue-400" />
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigator.clipboard.readText().then(text => setFormData({...formData, toAddress: text}))}
                          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-purple-400" />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Supports Ethereum addresses and ENS domains</span>
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="space-y-3">
                    <Label className="text-white text-lg font-semibold">Amount</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.000001"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400 pr-20 text-lg"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {formData.currency || 'ETH'}
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedWallet && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Available Balance:</span>
                        <span className="text-white font-semibold">
                          {formatBalance(selectedWallet.balance)} {formData.currency}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      {['25%', '50%', '75%', 'Max'].map((percentage) => (
                        <motion.button
                          key={percentage}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (selectedWallet) {
                              const balance = parseFloat(selectedWallet.balance);
                              let amount;
                              switch(percentage) {
                                case '25%': amount = balance * 0.25; break;
                                case '50%': amount = balance * 0.5; break;
                                case '75%': amount = balance * 0.75; break;
                                case 'Max': amount = balance * 0.95; break; // Leave some for gas
                                default: amount = 0;
                              }
                              setFormData({...formData, amount: amount.toFixed(6)});
                            }
                          }}
                          className="flex-1 py-2 px-3 bg-slate-700/30 hover:bg-slate-600/50 border border-slate-600 rounded-lg text-gray-300 hover:text-white transition-all"
                        >
                          {percentage}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Transaction Summary */}
                  {/* Gas Fee Estimation */}
                  {formData.amount && selectedWallet && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-slate-700/30 border-slate-600">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400 flex items-center space-x-1">
                                <Zap className="w-3 h-3" />
                                <span>Amount:</span>
                              </span>
                              <span className="text-white font-semibold">{formData.amount} {formData.currency}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Estimated Gas Fee:</span>
                              </span>
                              <span className="text-white">{estimatedGas} {formData.currency}</span>
                            </div>
                            <div className="border-t border-slate-600 pt-3">
                              <div className="flex justify-between font-semibold">
                                <span className="text-gray-300">Total Cost:</span>
                                <span className="text-white text-lg">{totalCost} {formData.currency}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    
                    {formData.toAddress && formData.amount && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Button
                          onClick={() => setStep(3)}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8"
                        >
                          Review Transaction
                          <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                        </Button>
                      </motion.div>
                    )}
                  </div>

                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Confirm Transaction</span>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Review all details before sending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Transaction Summary */}
                  <div className="bg-slate-700/30 rounded-xl p-6 space-y-4">
                    <div className="text-center">
                      <motion.div
                        className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      >
                        <Send className="w-8 h-8 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-2">{formData.amount} {formData.currency}</h3>
                      <p className="text-gray-400">You are sending</p>
                    </div>
                    
                    <div className="space-y-3 border-t border-slate-600 pt-4">
                      <div className="flex justify-between">
                        <span className="text-gray-400">From:</span>
                        <span className="text-white font-mono text-sm">
                          {selectedWallet?.address.slice(0, 6)}...{selectedWallet?.address.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">To:</span>
                        <span className="text-white font-mono text-sm">
                          {formData.toAddress.slice(0, 6)}...{formData.toAddress.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Network:</span>
                        <span className="text-white">
                          {networks.find(n => n.id === formData.fromNetwork)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Gas Fee:</span>
                        <span className="text-white">{estimatedGas} {formData.currency}</span>
                      </div>
                      <div className="border-t border-slate-600 pt-3">
                        <div className="flex justify-between text-lg font-semibold">
                          <span className="text-gray-300">Total:</span>
                          <span className="text-white">{totalCost} {formData.currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Warning */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-amber-400 font-semibold mb-1">Important</h4>
                        <p className="text-amber-200 text-sm">
                          This transaction cannot be reversed. Please verify all details are correct.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="flex-1 border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Edit
                    </Button>
                    
                    <motion.div className="flex-1">
                      <Button
                        onClick={handleSubmit}
                        disabled={sending || loading}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3"
                      >
                        {sending ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 mr-2"
                            >
                              <Clock className="w-4 h-4" />
                            </motion.div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Confirm & Send
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* QR Scanner Modal */}
        <AnimatePresence>
          {showQRScanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowQRScanner(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                    <Camera className="w-6 h-6" />
                    <span>Scan QR Code</span>
                  </h3>
                  <Button
                    onClick={() => setShowQRScanner(false)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
                
                <div className="bg-slate-700 rounded-xl p-8 text-center mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4"
                  >
                    <Scan className="w-12 h-12 text-white" />
                  </motion.div>
                  <p className="text-gray-300 mb-2">Position QR code in camera view</p>
                  <p className="text-gray-500 text-sm">Camera access required for scanning</p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      // Simulate QR scan - in real app, this would use camera
                      const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b';
                      setFormData({...formData, toAddress: mockAddress});
                      setShowQRScanner(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                  
                  <Button
                    onClick={() => setShowQRScanner(false)}
                    variant="outline"
                    className="w-full border-slate-600 text-gray-300 hover:text-white hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SendCrypto;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';

const SendCrypto = () => {
  const { user } = useAuth();
  const { wallets, balances, sendCrypto, loading, getBalanceByNetwork, getPriceBySymbol } = useWallet();

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
    if (formData.amount && selectedWallet) {
      // Mock gas estimation - in real app this would come from API
      const baseGas = formData.fromNetwork === 'ethereum' ? 0.001 : 0.0001;
      const gasFee = (parseFloat(formData.amount) * 0.01) + baseGas; // 1% fee + base gas
      setEstimatedGas(gasFee.toFixed(6));
      setTotalCost((parseFloat(formData.amount) + gasFee).toFixed(6));
    } else {
      setEstimatedGas('0');
      setTotalCost('0');
    }
  }, [formData.amount, selectedWallet, formData.fromNetwork]);

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
      setError('Transaction failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatBalance = (balance) => {
    return parseFloat(balance || '0').toFixed(6);
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
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Send Crypto</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Send Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Send Cryptocurrency</CardTitle>
                <CardDescription className="text-gray-400">
                  Transfer crypto to any wallet address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert className="bg-red-500/10 border-red-500/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-400">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* From Wallet Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="fromNetwork" className="text-white">From Wallet</Label>
                    <Select
                      value={formData.fromNetwork}
                      onValueChange={(value) => setFormData({...formData, fromNetwork: value})}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select wallet to send from" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets.map((wallet) => {
                          const network = networks.find(n => n.id === wallet.network);
                          return (
                            <SelectItem key={wallet.id} value={wallet.network}>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 ${network?.color} rounded-full`} />
                                <span>{network?.name} - {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                                <Badge variant="secondary" className="ml-auto">
                                  {formatBalance(wallet.balance)} {network?.symbol}
                                </Badge>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* To Address */}
                  <div className="space-y-2">
                    <Label htmlFor="toAddress" className="text-white">Recipient Address</Label>
                    <Input
                      id="toAddress"
                      type="text"
                      placeholder="0x..."
                      value={formData.toAddress}
                      onChange={(e) => setFormData({...formData, toAddress: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />
                    <p className="text-xs text-gray-400">
                      Enter a valid Ethereum address starting with 0x
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-white">Amount</Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        step="0.000001"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-16"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {formData.currency || 'ETH'}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Summary */}
                  {formData.amount && selectedWallet && (
                    <Card className="bg-white/5 border-white/10">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Amount:</span>
                            <span className="text-white">{formData.amount} {formData.currency}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Estimated Gas Fee:</span>
                            <span className="text-white">{estimatedGas} {formData.currency}</span>
                          </div>
                          <div className="border-t border-white/10 pt-3">
                            <div className="flex justify-between font-semibold">
                              <span className="text-gray-400">Total:</span>
                              <span className="text-white">{totalCost} {formData.currency}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    disabled={sending || loading}
                  >
                    {sending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Sending Transaction...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send {formData.currency || 'Crypto'}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Balances Sidebar */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Your Balances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {networks.map((network) => {
                  const wallet = wallets.find(w => w.network === network.id);
                  const balance = getBalanceByNetwork(network.id);

                  return (
                    <div key={network.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${network.color} rounded-lg flex items-center justify-center`}>
                          <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{network.name}</div>
                          <div className="text-gray-400 text-xs">
                            {wallet ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'No wallet'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">
                          {formatBalance(balance)}
                        </div>
                        <div className="text-gray-400 text-xs">{network.symbol}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Security Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400 text-sm">Always verify the recipient address</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400 text-sm">Double-check amounts before sending</p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-400 text-sm">Keep sufficient balance for gas fees</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendCrypto;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Search,
  Filter,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';

const TransactionHistory = () => {
  const { transactions, loadTransactions, loading, wallets } = useWallet();
  const [filters, setFilters] = useState({
    network: 'all',
    status: 'all',
    type: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const networks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
    { id: 'bsc', name: 'BSC', symbol: 'BNB', color: 'bg-yellow-500' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500' },
    { value: 'failed', label: 'Failed', color: 'bg-red-500' }
  ];

  const typeOptions = [
    { value: 'send', label: 'Sent' },
    { value: 'receive', label: 'Received' }
  ];

  useEffect(() => {
    loadTransactionData();
  }, [filters, currentPage]);

  const loadTransactionData = async () => {
    try {
      console.log('Loading transactions with filters:', filters);
      const result = await loadTransactions({
        ...filters,
        page: currentPage,
        per_page: 20
      });

      console.log('Transaction load result:', result);
      if (result.success) {
        setTotalPages(result.pagination?.pages || 1);
        console.log('Transactions loaded:', result.transactions?.length || 0);
      } else {
        console.error('Failed to load transactions:', result.error);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getNetworkInfo = (networkId) => {
    return networks.find(n => n.id === networkId) || { name: networkId, symbol: 'ETH', color: 'bg-gray-500' };
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'bg-gray-500' };
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || '0').toFixed(6);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getExplorerUrl = (txHash, network) => {
    const explorers = {
      ethereum: 'https://etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      bsc: 'https://bscscan.com/tx/'
    };
    return explorers[network] + txHash;
  };

  const getTransactionIcon = (type) => {
    return type === 'send' ? ArrowUpRight : ArrowDownLeft;
  };

  const getTransactionColor = (type) => {
    return type === 'send' ? 'text-red-400' : 'text-green-400';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
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
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Transaction History</span>
              </div>
            </div>
            <Button
              onClick={loadTransactionData}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="bg-card border-border backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-foreground">Filter Transactions</CardTitle>
            <CardDescription className="text-muted-foreground">
              Search and filter your transaction history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by hash or address..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Select value={filters.network} onValueChange={(value) => handleFilterChange('network', value)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="All Networks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Networks</SelectItem>
                  {networks.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => {
                  setFilters({ network: 'all', status: 'all', type: 'all', search: '' });
                  setCurrentPage(1);
                }}
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="bg-card border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Transactions</CardTitle>
            <CardDescription className="text-muted-foreground">
              {transactions.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-foreground text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-muted-foreground mb-4">
                   {Object.entries(filters).some(([key, value]) => key === 'search' ? value : value !== 'all') ? 'Try adjusting your filters to see more results' : 'You haven\'t made any transactions yet'}
                 </p>
                 {!Object.entries(filters).some(([key, value]) => key === 'search' ? value : value !== 'all') && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Get started by:</p>
                    <div className="flex justify-center space-x-4">
                      <Link to="/send">
                        <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                          Send Crypto
                        </Button>
                      </Link>
                      <Link to="/receive">
                        <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                          Receive Crypto
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const networkInfo = getNetworkInfo(tx.network);
                  const statusInfo = getStatusInfo(tx.status);
                  const TxIcon = getTransactionIcon(tx.transaction_type);
                  const txColor = getTransactionColor(tx.transaction_type);

                  return (
                    <div key={tx.id} className="p-4 bg-card/50 rounded-lg border border-border hover:bg-accent transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 ${networkInfo.color} rounded-lg flex items-center justify-center`}>
                            <TxIcon className={`w-5 h-5 text-white ${txColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-foreground font-semibold">
                                {tx.transaction_type === 'send' ? 'Sent' : 'Received'}
                              </span>
                              <Badge className={`${statusInfo.color} text-white`}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {formatDate(tx.created_at)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`text-lg font-semibold ${txColor}`}>
                            {tx.transaction_type === 'send' ? '-' : '+'}
                            {formatAmount(tx.amount)} {tx.currency}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {networkInfo.name}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">From:</span>
                          <span className="text-white ml-2 font-mono">
                            {formatAddress(tx.from_address)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">To:</span>
                          <span className="text-white ml-2 font-mono">
                            {formatAddress(tx.to_address)}
                          </span>
                        </div>
                        {tx.transaction_hash && (
                          <div className="md:col-span-2">
                            <span className="text-gray-400">Hash:</span>
                            <span className="text-white ml-2 font-mono break-all">
                              {formatAddress(tx.transaction_hash)}
                            </span>
                            <Button
                              onClick={() => window.open(getExplorerUrl(tx.transaction_hash, tx.network), '_blank')}
                              variant="ghost"
                              size="sm"
                              className="ml-2 text-gray-400 hover:text-white"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {tx.gas_fee && (
                          <div>
                            <span className="text-gray-400">Gas Fee:</span>
                            <span className="text-white ml-2">
                              {formatAmount(tx.gas_fee)} {tx.currency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-6">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <span className="text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionHistory;

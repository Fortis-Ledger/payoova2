import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Filter,
  Activity,
  ExternalLink,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    network: '',
    status: '',
    type: '',
    user_id: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  });

  const networks = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
    { id: 'bsc', name: 'BSC', symbol: 'BNB', color: 'bg-yellow-500' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500', icon: Clock },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-500', icon: CheckCircle },
    { value: 'failed', label: 'Failed', color: 'bg-red-500', icon: XCircle }
  ];

  const typeOptions = [
    { value: 'send', label: 'Send' },
    { value: 'receive', label: 'Receive' }
  ];

  useEffect(() => {
    loadTransactions();
  }, [filters, pagination.page]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page
      });

      const response = await axios.get(`/api/admin/transactions?${params}`);
      if (response.data.success) {
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportTransactions = async (format = 'csv') => {
    try {
      setExporting(true);
      const response = await axios.get(`/api/admin/export/transactions?format=${format}`);

      if (response.data.success) {
        if (format === 'csv') {
          // Create and download CSV file
          const blob = new Blob([response.data.csv_data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = response.data.filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } else {
          // For Excel, the backend should handle the download
          window.open(response.request.responseURL, '_blank');
        }
      }
    } catch (error) {
      console.error('Failed to export transactions:', error);
      alert('Failed to export transactions');
    } finally {
      setExporting(false);
    }
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

  const getNetworkInfo = (networkId) => {
    return networks.find(n => n.id === networkId) || { name: networkId, symbol: 'ETH', color: 'bg-gray-500' };
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'bg-gray-500', icon: Clock };
  };

  const getTransactionIcon = (type) => {
    return type === 'send' ? ArrowUpRight : ArrowDownLeft;
  };

  const getTransactionColor = (type) => {
    return type === 'send' ? 'text-red-400' : 'text-green-400';
  };

  const getExplorerUrl = (txHash, network) => {
    const explorers = {
      ethereum: 'https://etherscan.io/tx/',
      polygon: 'https://polygonscan.com/tx/',
      bsc: 'https://bscscan.com/tx/'
    };
    return explorers[network] + txHash;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Management</h1>
          <p className="text-gray-400">Monitor all platform transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => exportTransactions('csv')}
            disabled={exporting}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button
            onClick={() => exportTransactions('excel')}
            disabled={exporting}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button
            onClick={loadTransactions}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by hash or address..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <Select value={filters.network} onValueChange={(value) => handleFilterChange('network', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Networks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Networks</SelectItem>
                {networks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    {network.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {typeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setFilters({ network: '', status: '', type: '', search: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">All Transactions ({pagination.total})</CardTitle>
          <CardDescription className="text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-gray-400">
                {Object.values(filters).some(v => v) ? 'Try adjusting your filters' : 'No transactions in the system'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const networkInfo = getNetworkInfo(tx.network);
                const statusInfo = getStatusInfo(tx.status);
                const StatusIcon = statusInfo.icon;
                const TxIcon = getTransactionIcon(tx.transaction_type);
                const txColor = getTransactionColor(tx.transaction_type);

                return (
                  <div key={tx.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 ${networkInfo.color} rounded-lg flex items-center justify-center`}>
                          <TxIcon className={`w-5 h-5 text-white ${txColor}`} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-semibold">
                              {tx.transaction_type === 'send' ? 'Sent' : 'Received'}
                            </span>
                            <Badge className={`${statusInfo.color} text-white`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge variant="secondary" className="bg-white/10 text-white">
                              {networkInfo.name}
                            </Badge>
                          </div>
                          <div className="text-gray-400 text-sm">
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
                          Gas: {formatAmount(tx.gas_fee)} {tx.currency}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">User:</span>
                        <div className="text-white font-medium">{tx.user_name}</div>
                        <div className="text-gray-400 text-xs">{tx.user_email}</div>
                      </div>

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
                    </div>

                    {tx.transaction_hash && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-400 text-sm">Transaction Hash:</span>
                            <span className="text-white ml-2 font-mono text-sm break-all">
                              {formatAddress(tx.transaction_hash)}
                            </span>
                          </div>
                          <Button
                            onClick={() => window.open(getExplorerUrl(tx.transaction_hash, tx.network), '_blank')}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        {tx.block_number && (
                          <div className="text-gray-400 text-xs mt-1">
                            Block: {tx.block_number}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-6">
              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.has_prev}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <span className="text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>

              <Button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.has_next}
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
  );
};

export default AdminTransactions;

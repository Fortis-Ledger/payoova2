import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Wallet,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard stats
      const statsResponse = await axios.get(`/api/admin/dashboard?days=${timeRange}`);
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Load analytics
      const analyticsResponse = await axios.get(`/api/admin/analytics?days=${timeRange}`);
      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.analytics);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getPercentageChange = (current, previous) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
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
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Platform overview and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats?.total_users)}</p>
                <p className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +{stats?.new_users || 0} new
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats?.active_users)}</p>
                <p className="text-gray-400 text-sm">
                  {stats?.total_users ? ((stats.active_users / stats.total_users) * 100).toFixed(1) : 0}% active
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Wallets</p>
                <p className="text-2xl font-bold text-white">{formatNumber(stats?.total_wallets)}</p>
                <p className="text-gray-400 text-sm">
                  Avg {stats?.total_users ? (stats.total_wallets / stats.total_users).toFixed(1) : 0} per user
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats?.total_volume)}</p>
                <p className="text-green-400 text-sm flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12.5%
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Transaction Overview</CardTitle>
            <CardDescription className="text-gray-400">
              Transaction statistics and status breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Transactions</span>
              <span className="text-white font-semibold">{formatNumber(stats?.total_transactions)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Recent Transactions</span>
              <span className="text-white font-semibold">{formatNumber(stats?.recent_transactions)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-400">Pending Transactions</span>
              <span className="text-yellow-400 font-semibold">{formatNumber(stats?.pending_transactions)}</span>
            </div>

            {/* Status Breakdown */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-white font-semibold mb-3">Transaction Status</h4>
              {stats?.transaction_status && Object.entries(stats.transaction_status).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    {status === 'confirmed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                    {status === 'failed' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    <span className="text-gray-400 capitalize">{status}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    {formatNumber(count)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Network Distribution</CardTitle>
            <CardDescription className="text-gray-400">
              Wallets by blockchain network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.networks && Object.entries(stats.networks).map(([network, count]) => (
                <div key={network} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      network === 'ethereum' ? 'bg-blue-500' :
                      network === 'polygon' ? 'bg-purple-500' :
                      network === 'bsc' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    <span className="text-white capitalize">{network}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">{formatNumber(count)}</span>
                    <div className="w-20 bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          network === 'ethereum' ? 'bg-blue-500' :
                          network === 'polygon' ? 'bg-purple-500' :
                          network === 'bsc' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}
                        style={{
                          width: `${stats.total_wallets ? (count / stats.total_wallets) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-gray-400">
            Latest platform activity and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">New User Registrations</p>
                  <p className="text-gray-400 text-sm">+{stats?.new_users || 0} users in the last {timeRange} days</p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Transaction Volume</p>
                  <p className="text-gray-400 text-sm">{formatCurrency(stats?.total_volume)} processed</p>
                </div>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400">
                Growing
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Pending Transactions</p>
                  <p className="text-gray-400 text-sm">{stats?.pending_transactions || 0} transactions awaiting confirmation</p>
                </div>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400">
                Monitor
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

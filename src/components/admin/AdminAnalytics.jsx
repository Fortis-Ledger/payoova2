import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Activity,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Zap,
  Globe
} from 'lucide-react';
import axios from 'axios';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
    fetchSystemMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`/api/admin/analytics?days=${timeRange.replace('d', '')}`);
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await axios.get('/api/admin/system-metrics');
      if (response.data.success) {
        setSystemMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real data states - replace mock data with actual API calls
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [transactionVolumeData, setTransactionVolumeData] = useState([]);
  const [networkDistributionData, setNetworkDistributionData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    uptime: '0%',
    avgResponseTime: '0ms',
    errorRate: '0%',
    activeConnections: 0
  });

  // TODO: Implement real data fetching
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API calls
        // const userGrowth = await fetchUserGrowthData();
        // const transactionVolume = await fetchTransactionVolumeData();
        // const networkDistribution = await fetchNetworkDistributionData();
        // const metrics = await fetchPerformanceMetrics();
        
        // For now, set empty data
        setUserGrowthData([]);
        setTransactionVolumeData([]);
        setNetworkDistributionData([]);
        setPerformanceMetrics({
          uptime: '0%',
          avgResponseTime: '0ms',
          errorRate: '0%',
          activeConnections: 0
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const getHealthStatus = (status) => {
    const statusConfig = {
      healthy: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', icon: CheckCircle },
      warning: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: AlertCircle },
      critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: AlertCircle }
    };
    
    return statusConfig[status] || statusConfig.warning;
  };

  const StatCard = ({ title, value, change, icon: Icon, trend }) => (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            {change && (
              <div className={`flex items-center mt-2 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                <span className="text-sm">{change}</span>
              </div>
            )}
          </div>
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Real-time system metrics and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button
            onClick={() => {
              fetchAnalytics();
              fetchSystemMetrics();
            }}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{mockPerformanceMetrics.uptime}</div>
              <div className="text-gray-400 text-sm">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{performanceMetrics.avgResponseTime}</div>
              <div className="text-gray-400 text-sm">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{performanceMetrics.errorRate}</div>
              <div className="text-gray-400 text-sm">Error Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{performanceMetrics.activeConnections}</div>
              <div className="text-gray-400 text-sm">Active Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value="1,247"
          change="+12.5%"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Active Wallets"
          value="892"
          change="+8.2%"
          icon={Wallet}
          trend="up"
        />
        <StatCard
          title="Total Volume"
          value="$2.4M"
          change="+15.3%"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Transactions"
          value="5,432"
          change="+22.1%"
          icon={Activity}
          trend="up"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="active" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Network Distribution */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Network Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={networkDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}%`}
                >
                  {networkDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Volume Chart */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={transactionVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="volume" fill="#8B5CF6" />
              <Bar dataKey="transactions" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span>Security Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                <strong>All systems operational.</strong> No security threats detected in the last 24 hours.
              </AlertDescription>
            </Alert>
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Zap className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                <strong>Rate limiting active.</strong> 23 IPs temporarily blocked for excessive requests.
              </AlertDescription>
            </Alert>
            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <Globe className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-400">
                <strong>Geographic monitoring.</strong> 5 login attempts from unusual locations detected.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;

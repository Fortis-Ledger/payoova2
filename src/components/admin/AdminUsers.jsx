import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Wallet,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
    has_next: false,
    has_prev: false
  });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [filters, pagination.page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        per_page: pagination.per_page
      });

      const response = await axios.get(`/api/admin/users?${params}`);
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setActionLoading(userId);
      const response = await axios.post(`/api/admin/users/${userId}/toggle-status`);

      if (response.data.success) {
        // Update user status in local state
        setUsers(prev => prev.map(user =>
          user.id === userId
            ? { ...user, is_active: !user.is_active }
            : user
        ));
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadgeColor = (role) => {
    return role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400';
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">Manage platform users and their accounts</p>
        </div>
        <Button
          onClick={loadUsers}
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => {
                setFilters({ search: '', status: '', role: '' });
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

      {/* Users List */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Users ({pagination.total})</CardTitle>
          <CardDescription className="text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-gray-400">
                {Object.values(filters).some(v => v) ? 'Try adjusting your filters' : 'No users in the system'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-white font-semibold">{user.name}</h3>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusBadgeColor(user.is_active)}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-gray-400 text-sm">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {user.email}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* User Stats */}
                      <div className="text-center">
                        <div className="text-white font-semibold">{user.wallet_count || 0}</div>
                        <div className="text-gray-400 text-xs flex items-center">
                          <Wallet className="w-3 h-3 mr-1" />
                          Wallets
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-white font-semibold">{user.transaction_count || 0}</div>
                        <div className="text-gray-400 text-xs flex items-center">
                          <Activity className="w-3 h-3 mr-1" />
                          Transactions
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-white font-semibold">
                          ${user.total_volume ? user.total_volume.toFixed(2) : '0.00'}
                        </div>
                        <div className="text-gray-400 text-xs">Volume</div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          disabled={actionLoading === user.id || user.role === 'admin'}
                          variant={user.is_active ? "destructive" : "default"}
                          size="sm"
                          className={user.is_active
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          }
                        >
                          {actionLoading === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : user.is_active ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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

export default AdminUsers;

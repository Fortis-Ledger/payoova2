import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  FileText, 
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import axios from 'axios';

const KYCAdmin = () => {
  const { token } = useAuth();
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [verificationLevel, setVerificationLevel] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState('kyc');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingVerifications();
    fetchFlaggedTransactions();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      const response = await axios.get('/api/admin/kyc/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPendingVerifications(response.data.verifications);
      }
    } catch (error) {
      console.error('Failed to fetch pending verifications:', error);
      setError('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedTransactions = async () => {
    try {
      const response = await axios.get('/api/admin/aml/flagged', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFlaggedTransactions(response.data.flagged_transactions);
      }
    } catch (error) {
      console.error('Failed to fetch flagged transactions:', error);
    }
  };

  const handleApproveKYC = async (verificationId) => {
    try {
      const response = await axios.post(`/api/admin/kyc/${verificationId}/approve`, {
        level: verificationLevel,
        notes: reviewNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('KYC verification approved successfully');
        fetchPendingVerifications();
        setSelectedVerification(null);
        setReviewNotes('');
        setVerificationLevel(1);
      } else {
        setError(response.data.error || 'Failed to approve verification');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to approve verification');
    }
  };

  const handleRejectKYC = async (verificationId) => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      const response = await axios.post(`/api/admin/kyc/${verificationId}/reject`, {
        reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('KYC verification rejected');
        fetchPendingVerifications();
        setSelectedVerification(null);
        setRejectionReason('');
      } else {
        setError(response.data.error || 'Failed to reject verification');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reject verification');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getRiskBadge = (riskScore) => {
    let color = 'bg-green-100 text-green-800';
    let text = 'Low Risk';
    
    if (riskScore >= 0.7) {
      color = 'bg-red-100 text-red-800';
      text = 'High Risk';
    } else if (riskScore >= 0.4) {
      color = 'bg-yellow-100 text-yellow-800';
      text = 'Medium Risk';
    }

    return (
      <Badge className={color}>
        {text} ({(riskScore * 100).toFixed(1)}%)
      </Badge>
    );
  };

  const filteredVerifications = pendingVerifications.filter(verification =>
    verification.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${verification.first_name} ${verification.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = flaggedTransactions.filter(transaction =>
    transaction.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.transaction_hash?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">KYC/AML Administration</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users, emails, transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'kyc', label: 'KYC Verifications', icon: User, count: pendingVerifications.length },
            { id: 'aml', label: 'Flagged Transactions', icon: AlertTriangle, count: flaggedTransactions.length }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <Badge className="bg-red-100 text-red-800 ml-2">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* KYC Verifications Tab */}
      {activeTab === 'kyc' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verification List */}
          <Card>
            <CardHeader>
              <CardTitle>Pending KYC Verifications</CardTitle>
              <CardDescription>
                Review and approve user identity verifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredVerifications.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending verifications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVerifications.map((verification) => (
                    <div 
                      key={verification.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedVerification?.id === verification.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedVerification(verification)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">
                          {verification.first_name} {verification.last_name}
                        </h4>
                        {getStatusBadge(verification.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Email:</strong> {verification.user_email}</p>
                        <p><strong>Nationality:</strong> {verification.nationality}</p>
                        <p><strong>Submitted:</strong> {new Date(verification.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVerification(verification);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verification Details */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Details</CardTitle>
              <CardDescription>
                Review user information and make approval decision
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedVerification ? (
                <div className="space-y-6">
                  {/* User Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">User Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Full Name</Label>
                        <p className="font-medium">
                          {selectedVerification.first_name} {selectedVerification.last_name}
                        </p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="font-medium">{selectedVerification.user_email}</p>
                      </div>
                      <div>
                        <Label>Nationality</Label>
                        <p className="font-medium">{selectedVerification.nationality}</p>
                      </div>
                      <div>
                        <Label>Verification Level</Label>
                        <p className="font-medium">Level {selectedVerification.verification_level}</p>
                      </div>
                    </div>
                  </div>

                  {/* Review Actions */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Review Actions</h3>
                    
                    <div>
                      <Label htmlFor="verification_level">Verification Level</Label>
                      <select
                        id="verification_level"
                        value={verificationLevel}
                        onChange={(e) => setVerificationLevel(parseInt(e.target.value))}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      >
                        <option value={1}>Level 1 - Basic</option>
                        <option value={2}>Level 2 - Enhanced</option>
                        <option value={3}>Level 3 - Premium</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="review_notes">Review Notes</Label>
                      <Textarea
                        id="review_notes"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add notes about this verification..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApproveKYC(selectedVerification.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          const reason = prompt('Please provide a rejection reason:');
                          if (reason) {
                            setRejectionReason(reason);
                            handleRejectKYC(selectedVerification.id);
                          }
                        }}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a verification to review</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* AML Flagged Transactions Tab */}
      {activeTab === 'aml' && (
        <Card>
          <CardHeader>
            <CardTitle>Flagged Transactions</CardTitle>
            <CardDescription>
              Review transactions flagged by AML monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No flagged transactions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">Transaction #{transaction.transaction_id}</h4>
                        <p className="text-sm text-gray-600">{transaction.user_email}</p>
                      </div>
                      {getRiskBadge(transaction.risk_score)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label>Amount</Label>
                        <p className="font-medium">${transaction.amount}</p>
                      </div>
                      <div>
                        <Label>Network</Label>
                        <p className="font-medium">{transaction.network}</p>
                      </div>
                      <div>
                        <Label>Hash</Label>
                        <p className="font-mono text-xs">
                          {transaction.transaction_hash?.substring(0, 10)}...
                        </p>
                      </div>
                      <div>
                        <Label>Flagged</Label>
                        <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {transaction.large_amount && (
                        <Badge className="bg-orange-100 text-orange-800">Large Amount</Badge>
                      )}
                      {transaction.high_risk_country && (
                        <Badge className="bg-red-100 text-red-800">High Risk Country</Badge>
                      )}
                      {transaction.velocity_breach && (
                        <Badge className="bg-purple-100 text-purple-800">Velocity Breach</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KYCAdmin;

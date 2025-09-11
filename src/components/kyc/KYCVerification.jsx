import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, XCircle, Clock, AlertTriangle, Upload, User, MapPin, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const KYCVerification = () => {
  const { user, token } = useAuth();
  const [kycStatus, setKycStatus] = useState(null);
  const [amlStatus, setAmlStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('status');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nationality: '',
    country_of_residence: '',
    document_type: 'passport',
    document_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchKYCStatus();
    fetchAMLStatus();
    fetchDocuments();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await axios.get('/api/kyc/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setKycStatus(response.data.kyc_status);
      }
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    }
  };

  const fetchAMLStatus = async () => {
    try {
      const response = await axios.get('/api/aml/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAmlStatus(response.data.aml_status);
      }
    } catch (error) {
      console.error('Failed to fetch AML status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/kyc/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/kyc/verify', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('KYC verification submitted successfully. Please wait for review.');
        fetchKYCStatus();
        setActiveTab('status');
      } else {
        setError(response.data.error || 'Failed to submit KYC verification');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit KYC verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunAMLScreen = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/aml/screen', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess('AML screening completed successfully.');
        fetchAMLStatus();
      } else {
        setError(response.data.error || 'AML screening failed');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'AML screening failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status, verified = false) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      under_review: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
      not_screened: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, text: 'Not Screened' },
      clear: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Clear' },
      hit: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Hit Detected' }
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

  const getRiskLevelColor = (riskScore) => {
    if (riskScore >= 0.7) return 'text-red-600';
    if (riskScore >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">KYC & AML Compliance</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'status', label: 'Status Overview', icon: User },
            { id: 'verify', label: 'Submit Verification', icon: FileText },
            { id: 'documents', label: 'Documents', icon: Upload }
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

      {/* Status Overview Tab */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* KYC Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                KYC Verification Status
              </CardTitle>
              <CardDescription>
                Know Your Customer verification status and details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                {kycStatus && getStatusBadge(kycStatus.status, kycStatus.verified)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Verification Level:</span>
                <span className="text-sm text-gray-600">
                  Level {kycStatus?.level || 0}
                </span>
              </div>

              {kycStatus?.verified_at && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Verified At:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(kycStatus.verified_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              {kycStatus?.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Expires At:</span>
                  <span className="text-sm text-gray-600">
                    {new Date(kycStatus.expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              {!kycStatus?.verified && (
                <Button 
                  onClick={() => setActiveTab('verify')}
                  className="w-full"
                >
                  Start KYC Verification
                </Button>
              )}
            </CardContent>
          </Card>

          {/* AML Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                AML Screening Status
              </CardTitle>
              <CardDescription>
                Anti-Money Laundering screening results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                {amlStatus && getStatusBadge(amlStatus.status)}
              </div>

              {amlStatus?.risk_score !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Risk Score:</span>
                  <span className={`text-sm font-medium ${getRiskLevelColor(amlStatus.risk_score)}`}>
                    {(amlStatus.risk_score * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              {amlStatus?.sanctions_hit !== undefined && (
                <div className="space-y-2">
                  <span className="font-medium">Screening Results:</span>
                  <div className="grid grid-cols-1 gap-1 text-sm">
                    <div className="flex justify-between">
                      <span>Sanctions:</span>
                      <span className={amlStatus.sanctions_hit ? 'text-red-600' : 'text-green-600'}>
                        {amlStatus.sanctions_hit ? 'Hit' : 'Clear'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>PEP:</span>
                      <span className={amlStatus.pep_hit ? 'text-red-600' : 'text-green-600'}>
                        {amlStatus.pep_hit ? 'Hit' : 'Clear'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adverse Media:</span>
                      <span className={amlStatus.adverse_media_hit ? 'text-red-600' : 'text-green-600'}>
                        {amlStatus.adverse_media_hit ? 'Hit' : 'Clear'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {kycStatus?.verified && amlStatus?.status === 'not_screened' && (
                <Button 
                  onClick={handleRunAMLScreen}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? 'Running Screening...' : 'Run AML Screening'}
                </Button>
              )}

              {!kycStatus?.verified && (
                <p className="text-sm text-gray-500">
                  Complete KYC verification first to run AML screening
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification Form Tab */}
      {activeTab === 'verify' && (
        <Card>
          <CardHeader>
            <CardTitle>Submit KYC Verification</CardTitle>
            <CardDescription>
              Please provide accurate information for identity verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitKYC} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      placeholder="e.g., United States"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country_of_residence">Country of Residence</Label>
                    <Input
                      id="country_of_residence"
                      value={formData.country_of_residence}
                      onChange={(e) => handleInputChange('country_of_residence', e.target.value)}
                      placeholder="e.g., United States"
                    />
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="document_type">Document Type</Label>
                    <Select 
                      value={formData.document_type} 
                      onValueChange={(value) => handleInputChange('document_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="document_number">Document Number</Label>
                    <Input
                      id="document_number"
                      value={formData.document_number}
                      onChange={(e) => handleInputChange('document_number', e.target.value)}
                      placeholder="Document number"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={formData.address_line1}
                      onChange={(e) => handleInputChange('address_line1', e.target.value)}
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={formData.address_line2}
                      onChange={(e) => handleInputChange('address_line2', e.target.value)}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="State or Province"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => handleInputChange('postal_code', e.target.value)}
                        placeholder="Postal code"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Submitting...' : 'Submit KYC Verification'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>KYC Documents</CardTitle>
            <CardDescription>
              View your uploaded KYC documents and their verification status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No documents uploaded yet</p>
                <Button 
                  onClick={() => setActiveTab('verify')}
                  className="mt-4"
                >
                  Submit Verification
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                    
                    {doc.verified_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        Verified: {new Date(doc.verified_at).toLocaleDateString()}
                      </p>
                    )}
                    
                    {doc.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {doc.rejection_reason}
                        </p>
                      </div>
                    )}
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

export default KYCVerification;

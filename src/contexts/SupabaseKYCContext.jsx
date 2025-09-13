// Supabase KYC/AML Context for Payoova Wallet
// This handles KYC verification and AML compliance using Supabase

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, storageConfig, ENUMS, TABLES } from '../config/supabase-config';
import { useAuth } from './SupabaseAuthContext';

// Create KYC Context
const KYCContext = createContext({});

// Custom hook to use KYC context
export const useKYC = () => {
  const context = useContext(KYCContext);
  if (!context) {
    throw new Error('useKYC must be used within a KYCProvider');
  }
  return context;
};

// KYC Provider Component
export const KYCProvider = ({ children }) => {
  const { profile, isAuthenticated, isAdmin } = useAuth();
  
  // State
  const [kycStatus, setKycStatus] = useState(null);
  const [kycDocuments, setKycDocuments] = useState([]);
  const [kycVerifications, setKycVerifications] = useState([]);
  const [amlChecks, setAmlChecks] = useState([]);
  const [complianceReports, setComplianceReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  // Initialize KYC data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && profile) {
      initializeKYCData();
      setupRealtimeSubscription();
    } else {
      clearKYCData();
    }

    return () => {
      if (realtimeSubscription) {
        realtimeSubscription();
      }
    };
  }, [isAuthenticated, profile]);

  // Initialize KYC data
  const initializeKYCData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserKYCStatus(),
        loadKYCDocuments(),
        loadKYCVerifications(),
        loadAMLChecks(),
        isAdmin && loadComplianceReports()
      ].filter(Boolean));
    } catch (error) {
      console.error('Error initializing KYC data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  const setupRealtimeSubscription = () => {
    if (!profile) return;

    const unsubscribe = supabaseHelpers.subscribeToKYCData(
      profile.id,
      (type, payload) => {
        console.log('Real-time KYC update:', type, payload);
        
        switch (type) {
          case 'kyc_document':
            handleKYCDocumentUpdate(payload);
            break;
          case 'kyc_verification':
            handleKYCVerificationUpdate(payload);
            break;
          case 'aml_check':
            handleAMLCheckUpdate(payload);
            break;
          default:
            break;
        }
      }
    );

    setRealtimeSubscription(() => unsubscribe);
  };

  // Handle real-time KYC document updates
  const handleKYCDocumentUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setKycDocuments(prevDocs => {
      switch (eventType) {
        case 'INSERT':
          return [...prevDocs, newRecord];
        case 'UPDATE':
          return prevDocs.map(doc => 
            doc.id === newRecord.id ? newRecord : doc
          );
        case 'DELETE':
          return prevDocs.filter(doc => doc.id !== oldRecord.id);
        default:
          return prevDocs;
      }
    });
  };

  // Handle real-time KYC verification updates
  const handleKYCVerificationUpdate = (payload) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      setKycVerifications(prevVerifications => {
        const existing = prevVerifications.find(v => v.id === newRecord.id);
        if (existing) {
          return prevVerifications.map(v => 
            v.id === newRecord.id ? newRecord : v
          );
        } else {
          return [newRecord, ...prevVerifications];
        }
      });

      // Update KYC status if this is the user's verification
      if (newRecord.user_id === profile.id) {
        setKycStatus(newRecord.status);
      }
    }
  };

  // Handle real-time AML check updates
  const handleAMLCheckUpdate = (payload) => {
    const { eventType, new: newRecord } = payload;
    
    if (eventType === 'INSERT') {
      setAmlChecks(prevChecks => [newRecord, ...prevChecks]);
    }
  };

  // Load user KYC status
  const loadUserKYCStatus = async () => {
    try {
      if (!profile) return;

      const { data, error } = await supabase
        .from(TABLES.KYC_VERIFICATIONS)
        .select('status')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const status = data?.status || ENUMS.KYC_STATUS.NOT_STARTED;
      setKycStatus(status);
      
      // Cache status locally
      localStorage.setItem('kycStatus', status);
      
      return status;
    } catch (error) {
      console.error('Error loading KYC status:', error);
      throw error;
    }
  };

  // Load KYC documents
  const loadKYCDocuments = async () => {
    try {
      if (!profile) return;

      const { data, error } = await supabase
        .from(TABLES.KYC_DOCUMENTS)
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setKycDocuments(data);
      return data;
    } catch (error) {
      console.error('Error loading KYC documents:', error);
      throw error;
    }
  };

  // Load KYC verifications
  const loadKYCVerifications = async () => {
    try {
      if (!profile) return;

      let query = supabase
        .from(TABLES.KYC_VERIFICATIONS)
        .select(`
          *,
          user:${TABLES.USERS}(email, full_name)
        `);

      // If not admin, only load user's own verifications
      if (!isAdmin) {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(isAdmin ? 100 : 10);

      if (error) {
        throw error;
      }

      setKycVerifications(data);
      return data;
    } catch (error) {
      console.error('Error loading KYC verifications:', error);
      throw error;
    }
  };

  // Load AML checks
  const loadAMLChecks = async () => {
    try {
      if (!profile) return;

      let query = supabase
        .from(TABLES.AML_CHECKS)
        .select(`
          *,
          user:${TABLES.USERS}(email, full_name)
        `);

      // If not admin, only load user's own checks
      if (!isAdmin) {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(isAdmin ? 100 : 10);

      if (error) {
        throw error;
      }

      setAmlChecks(data);
      return data;
    } catch (error) {
      console.error('Error loading AML checks:', error);
      throw error;
    }
  };

  // Load compliance reports (admin only)
  const loadComplianceReports = async () => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from(TABLES.COMPLIANCE_REPORTS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setComplianceReports(data);
      return data;
    } catch (error) {
      console.error('Error loading compliance reports:', error);
      throw error;
    }
  };

  // Upload KYC document
  const uploadKYCDocument = async (documentType, file) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setUploadProgress({ [documentType]: 0 });

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${profile.id}/${documentType}_${Date.now()}.${fileExtension}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress({ [documentType]: 50 });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);

      // Save document record to database
      const documentData = {
        user_id: profile.id,
        document_type: documentType,
        file_name: file.name,
        file_path: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        status: ENUMS.DOCUMENT_STATUS.UPLOADED,
        uploaded_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.KYC_DOCUMENTS)
        .insert([documentData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUploadProgress({ [documentType]: 100 });
      
      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[documentType];
          return newProgress;
        });
      }, 2000);

      Alert.alert('Success', 'Document uploaded successfully!');
      return data;
    } catch (error) {
      console.error('Error uploading KYC document:', error);
      Alert.alert('Error', 'Failed to upload document. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Submit KYC for verification
  const submitKYCForVerification = async (personalInfo) => {
    try {
      if (!profile) {
        throw new Error('User not authenticated');
      }

      // Check if required documents are uploaded
      const requiredDocs = [ENUMS.DOCUMENT_TYPE.ID_CARD, ENUMS.DOCUMENT_TYPE.PROOF_OF_ADDRESS];
      const uploadedDocs = kycDocuments.map(doc => doc.document_type);
      const missingDocs = requiredDocs.filter(doc => !uploadedDocs.includes(doc));

      if (missingDocs.length > 0) {
        throw new Error(`Missing required documents: ${missingDocs.join(', ')}`);
      }

      setLoading(true);

      // Create KYC verification record
      const verificationData = {
        user_id: profile.id,
        status: ENUMS.KYC_STATUS.PENDING,
        personal_info: personalInfo,
        submitted_at: new Date().toISOString(),
        documents_count: kycDocuments.length
      };

      const { data, error } = await supabase
        .from(TABLES.KYC_VERIFICATIONS)
        .insert([verificationData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update document status to submitted
      await supabase
        .from(TABLES.KYC_DOCUMENTS)
        .update({ status: ENUMS.DOCUMENT_STATUS.SUBMITTED })
        .eq('user_id', profile.id)
        .eq('status', ENUMS.DOCUMENT_STATUS.UPLOADED);

      setKycStatus(ENUMS.KYC_STATUS.PENDING);
      Alert.alert('Success', 'KYC submitted for verification!');
      return data;
    } catch (error) {
      console.error('Error submitting KYC:', error);
      Alert.alert('Error', error.message || 'Failed to submit KYC');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Approve KYC (admin only)
  const approveKYC = async (verificationId, notes = null) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      setLoading(true);

      const { data, error } = await supabase
        .from(TABLES.KYC_VERIFICATIONS)
        .update({
          status: ENUMS.KYC_STATUS.APPROVED,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes
        })
        .eq('id', verificationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update user KYC status
      await supabase
        .from(TABLES.USERS)
        .update({ kyc_status: ENUMS.KYC_STATUS.APPROVED })
        .eq('id', data.user_id);

      Alert.alert('Success', 'KYC approved successfully!');
      return data;
    } catch (error) {
      console.error('Error approving KYC:', error);
      Alert.alert('Error', 'Failed to approve KYC');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reject KYC (admin only)
  const rejectKYC = async (verificationId, reason) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      setLoading(true);

      const { data, error } = await supabase
        .from(TABLES.KYC_VERIFICATIONS)
        .update({
          status: ENUMS.KYC_STATUS.REJECTED,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', verificationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update user KYC status
      await supabase
        .from(TABLES.USERS)
        .update({ kyc_status: ENUMS.KYC_STATUS.REJECTED })
        .eq('id', data.user_id);

      Alert.alert('Success', 'KYC rejected.');
      return data;
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      Alert.alert('Error', 'Failed to reject KYC');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Run AML check
  const runAMLCheck = async (userId, checkType = 'TRANSACTION') => {
    try {
      if (!isAdmin && userId !== profile.id) {
        throw new Error('Unauthorized');
      }

      const amlData = {
        user_id: userId,
        check_type: checkType,
        status: ENUMS.AML_STATUS.PENDING,
        initiated_by: profile.id,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.AML_CHECKS)
        .insert([amlData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // In production, this would trigger external AML service
      // For now, simulate check completion
      setTimeout(async () => {
        await supabase
          .from(TABLES.AML_CHECKS)
          .update({
            status: ENUMS.AML_STATUS.CLEAR,
            completed_at: new Date().toISOString(),
            risk_score: Math.floor(Math.random() * 30), // Low risk score
            result_details: { automated_check: true, risk_level: 'low' }
          })
          .eq('id', data.id);
      }, 5000);

      return data;
    } catch (error) {
      console.error('Error running AML check:', error);
      throw error;
    }
  };

  // Generate compliance report (admin only)
  const generateComplianceReport = async (reportType, dateRange) => {
    try {
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      setLoading(true);

      // Generate report data based on type
      let reportData = {};
      
      switch (reportType) {
        case 'KYC_SUMMARY':
          reportData = await generateKYCSummaryReport(dateRange);
          break;
        case 'AML_SUMMARY':
          reportData = await generateAMLSummaryReport(dateRange);
          break;
        case 'TRANSACTION_MONITORING':
          reportData = await generateTransactionMonitoringReport(dateRange);
          break;
        default:
          throw new Error('Invalid report type');
      }

      const reportRecord = {
        report_type: reportType,
        generated_by: profile.id,
        date_range: dateRange,
        report_data: reportData,
        generated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(TABLES.COMPLIANCE_REPORTS)
        .insert([reportRecord])
        .select()
        .single();

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Compliance report generated successfully!');
      return data;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      Alert.alert('Error', 'Failed to generate compliance report');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Generate KYC summary report
  const generateKYCSummaryReport = async (dateRange) => {
    const { data, error } = await supabase
      .from(TABLES.KYC_VERIFICATIONS)
      .select('status, created_at')
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    if (error) throw error;

    const summary = {
      total: data.length,
      approved: data.filter(k => k.status === ENUMS.KYC_STATUS.APPROVED).length,
      pending: data.filter(k => k.status === ENUMS.KYC_STATUS.PENDING).length,
      rejected: data.filter(k => k.status === ENUMS.KYC_STATUS.REJECTED).length,
      dateRange
    };

    return summary;
  };

  // Generate AML summary report
  const generateAMLSummaryReport = async (dateRange) => {
    const { data, error } = await supabase
      .from(TABLES.AML_CHECKS)
      .select('status, risk_score, created_at')
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    if (error) throw error;

    const summary = {
      total: data.length,
      clear: data.filter(a => a.status === ENUMS.AML_STATUS.CLEAR).length,
      flagged: data.filter(a => a.status === ENUMS.AML_STATUS.FLAGGED).length,
      pending: data.filter(a => a.status === ENUMS.AML_STATUS.PENDING).length,
      averageRiskScore: data.reduce((sum, a) => sum + (a.risk_score || 0), 0) / data.length,
      dateRange
    };

    return summary;
  };

  // Generate transaction monitoring report
  const generateTransactionMonitoringReport = async (dateRange) => {
    const { data, error } = await supabase
      .from(TABLES.TRANSACTION_MONITORING)
      .select('alert_type, risk_level, created_at')
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);

    if (error) throw error;

    const summary = {
      totalAlerts: data.length,
      highRisk: data.filter(t => t.risk_level === 'HIGH').length,
      mediumRisk: data.filter(t => t.risk_level === 'MEDIUM').length,
      lowRisk: data.filter(t => t.risk_level === 'LOW').length,
      alertTypes: data.reduce((acc, t) => {
        acc[t.alert_type] = (acc[t.alert_type] || 0) + 1;
        return acc;
      }, {}),
      dateRange
    };

    return summary;
  };

  // Clear KYC data
  const clearKYCData = () => {
    setKycStatus(null);
    setKycDocuments([]);
    setKycVerifications([]);
    setAmlChecks([]);
    setComplianceReports([]);
    setUploadProgress({});
    
    if (realtimeSubscription) {
      realtimeSubscription();
      setRealtimeSubscription(null);
    }
  };

  // Check if KYC is required for action
  const isKYCRequired = (action) => {
    const kycRequiredActions = [
      'SEND_LARGE_AMOUNT',
      'WITHDRAW_FIAT',
      'CREATE_CARD',
      'BUSINESS_ACCOUNT'
    ];
    
    return kycRequiredActions.includes(action) && 
           kycStatus !== ENUMS.KYC_STATUS.APPROVED;
  };

  // Get KYC completion percentage
  const getKYCCompletionPercentage = () => {
    const requiredSteps = [
      'PERSONAL_INFO',
      'ID_DOCUMENT',
      'PROOF_OF_ADDRESS',
      'SELFIE_VERIFICATION'
    ];
    
    const completedSteps = kycDocuments.map(doc => doc.document_type);
    const personalInfoComplete = kycVerifications.some(v => v.personal_info);
    
    let completed = completedSteps.length;
    if (personalInfoComplete) completed += 1;
    
    return Math.round((completed / requiredSteps.length) * 100);
  };

  // Context value
  const value = {
    // State
    kycStatus,
    kycDocuments,
    kycVerifications,
    amlChecks,
    complianceReports,
    loading,
    uploadProgress,
    
    // KYC methods
    uploadKYCDocument,
    submitKYCForVerification,
    loadUserKYCStatus,
    loadKYCDocuments,
    
    // Admin KYC methods
    approveKYC,
    rejectKYC,
    loadKYCVerifications,
    
    // AML methods
    runAMLCheck,
    loadAMLChecks,
    
    // Compliance methods
    generateComplianceReport,
    loadComplianceReports,
    
    // Utility methods
    isKYCRequired,
    getKYCCompletionPercentage,
    
    // Data refresh
    initializeKYCData,
  };

  return (
    <KYCContext.Provider value={value}>
      {children}
    </KYCContext.Provider>
  );
};

export default KYCContext;
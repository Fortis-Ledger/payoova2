import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useWallet } from '../contexts/SupabaseWalletContext';
import { useUser } from '../contexts/SupabaseUserContext';
import { useKYC } from '../contexts/SupabaseKYCContext';
import { useCard } from '../contexts/SupabaseCardContext';

const SupabaseTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);

  // Context hooks
  const auth = useAuth();
  const wallet = useWallet();
  const user = useUser();
  const kyc = useKYC();
  const card = useCard();

  useEffect(() => {
    const runTests = async () => {
      const results = {};

      try {
        // Test Auth Context
        results.auth = {
          loaded: !!auth,
          user: auth?.user || null,
          loading: auth?.loading || false,
          methods: {
            signIn: typeof auth?.signIn === 'function',
            signOut: typeof auth?.signOut === 'function',
            signUp: typeof auth?.signUp === 'function'
          }
        };

        // Test Wallet Context
        results.wallet = {
          loaded: !!wallet,
          wallets: wallet?.wallets || [],
          transactions: wallet?.transactions || [],
          methods: {
            createWallet: typeof wallet?.createWallet === 'function',
            sendTransaction: typeof wallet?.sendTransaction === 'function',
            loadWallets: typeof wallet?.loadWallets === 'function'
          }
        };

        // Test User Context
        results.user = {
          loaded: !!user,
          users: user?.users || [],
          stats: user?.stats || {},
          methods: {
            loadUsers: typeof user?.loadUsers === 'function',
            updateUserStatus: typeof user?.updateUserStatus === 'function',
            searchUsers: typeof user?.searchUsers === 'function'
          }
        };

        // Test KYC Context
        results.kyc = {
          loaded: !!kyc,
          kycStatus: kyc?.kycStatus || null,
          documents: kyc?.documents || [],
          methods: {
            uploadDocument: typeof kyc?.uploadDocument === 'function',
            submitKYC: typeof kyc?.submitKYC === 'function',
            checkKYCRequired: typeof kyc?.checkKYCRequired === 'function'
          }
        };

        // Test Card Context
        results.card = {
          loaded: !!card,
          cards: card?.cards || [],
          transactions: card?.cardTransactions || [],
          methods: {
            createCard: typeof card?.createCard === 'function',
            loadMoney: typeof card?.loadMoney === 'function',
            processPayment: typeof card?.processPayment === 'function'
          }
        };

        setTestResults(results);
      } catch (error) {
        console.error('Test error:', error);
        setTestResults({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    runTests();
  }, [auth, wallet, user, kyc, card]);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Supabase Context Test</h2>
        <p>Running tests...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Supabase Context Test Results</h2>
      
      {testResults.error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {testResults.error}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(testResults).map(([contextName, result]) => (
            <div key={contextName} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 capitalize">
                {contextName} Context
                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                  result.loaded ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.loaded ? 'Loaded' : 'Failed'}
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Data:</h4>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify({
                      user: result.user,
                      wallets: result.wallets?.length || 0,
                      transactions: result.transactions?.length || 0,
                      users: result.users?.length || 0,
                      stats: result.stats,
                      kycStatus: result.kycStatus,
                      documents: result.documents?.length || 0,
                      cards: result.cards?.length || 0
                    }, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Methods:</h4>
                  <div className="space-y-1">
                    {result.methods && Object.entries(result.methods).map(([method, available]) => (
                      <div key={method} className="flex items-center">
                        <span className={`w-3 h-3 rounded-full mr-2 ${
                          available ? 'bg-green-500' : 'bg-red-500'
                        }`}></span>
                        <span className="text-sm">{method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Next Steps:</h3>
        <ul className="text-sm space-y-1">
          <li>• Set up your Supabase project and add environment variables</li>
          <li>• Run the database migrations in your Supabase dashboard</li>
          <li>• Configure Row Level Security policies</li>
          <li>• Test authentication and data operations</li>
        </ul>
      </div>
    </div>
  );
};

export default SupabaseTest;
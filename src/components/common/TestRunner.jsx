import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import axios from 'axios';

const TestRunner = () => {
  const [tests, setTests] = useState([]);
  const [running, setRunning] = useState(false);

  const testSuites = [
    {
      name: 'Authentication Tests',
      tests: [
        { name: 'User Registration', endpoint: '/api/auth/signup', method: 'POST' },
        { name: 'User Login', endpoint: '/api/auth/login', method: 'POST' },
        { name: 'Token Verification', endpoint: '/api/auth/verify', method: 'GET' }
      ]
    },
    {
      name: 'Wallet Tests',
      tests: [
        { name: 'Create Wallet', endpoint: '/api/wallet/create/ethereum', method: 'POST' },
        { name: 'Get Balance', endpoint: '/api/wallet/balance/ethereum', method: 'GET' },
        { name: 'Get Wallet List', endpoint: '/api/wallet/list', method: 'GET' }
      ]
    },
    {
      name: 'Health Tests',
      tests: [
        { name: 'API Health Check', endpoint: '/api/health', method: 'GET' },
        { name: 'Database Connection', endpoint: '/api/health', method: 'GET' }
      ]
    }
  ];

  const runTests = async () => {
    setRunning(true);
    const results = [];

    for (const suite of testSuites) {
      for (const test of suite.tests) {
        try {
          const startTime = Date.now();
          
          let response;
          if (test.method === 'GET') {
            response = await axios.get(test.endpoint);
          } else {
            // Data for POST requests
            if (test.endpoint.includes('signup')) {
              const email = `test${Date.now()}@test.com`;
              const creds = { name: 'Test User', email, password: 'test123' };
              response = await axios.post(test.endpoint, creds);
              // Save credentials globally for subsequent login
              window.__lastTestUser = { email, password: 'test123' };
            } else if (test.endpoint.includes('login')) {
              const creds = window.__lastTestUser || { email: 'nonexistent@test.com', password: 'wrong' };
              response = await axios.post(test.endpoint, creds);
            } else {
              response = await axios.post(test.endpoint, {});
            }
          }

          const duration = Date.now() - startTime;
          
          results.push({
            suite: suite.name,
            name: test.name,
            status: 'passed',
            duration,
            response: response.status
          });
        } catch (error) {
          results.push({
            suite: suite.name,
            name: test.name,
            status: 'failed',
            duration: 0,
            error: error.response?.data?.message || error.message
          });
        }
      }
    }

    setTests(results);
    setRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      passed: 'bg-green-500/20 text-green-400 border-green-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      running: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };

    return (
      <Badge className={variants[status] || variants.running}>
        {status}
      </Badge>
    );
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">API Test Runner</CardTitle>
              <CardDescription className="text-gray-400">
                Automated testing for Payoova APIs
              </CardDescription>
            </div>
            <Button
              onClick={runTests}
              disabled={running}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {running ? 'Running Tests...' : 'Run Tests'}
            </Button>
          </div>
        </CardHeader>

        {tests.length > 0 && (
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{passedTests}</div>
                <div className="text-gray-400 text-sm">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{failedTests}</div>
                <div className="text-gray-400 text-sm">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalTests}</div>
                <div className="text-gray-400 text-sm">Total</div>
              </div>
            </div>

            <div className="space-y-3">
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="text-white font-medium">{test.name}</div>
                      <div className="text-gray-400 text-sm">{test.suite}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {test.duration > 0 && (
                      <span className="text-gray-400 text-sm">{test.duration}ms</span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
            </div>

            {failedTests > 0 && (
              <Alert className="mt-4 bg-red-500/10 border-red-500/20">
                <XCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400">
                  {failedTests} test(s) failed. Check the results above for details.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default TestRunner;

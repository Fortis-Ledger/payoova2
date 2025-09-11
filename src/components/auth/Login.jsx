import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    
    const result = await login('demo@payoova.com', 'demo123');
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <div className="space-y-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Payoova</span>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              v2.0
            </Badge>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Your Gateway to
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Digital Finance
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Secure crypto wallet with multi-network support. Send, receive, and manage 
              your digital assets with bank-grade security.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-white font-semibold">Multi-Network</div>
              <div className="text-gray-400 text-sm">Ethereum, Polygon, BSC</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-white font-semibold">Secure</div>
              <div className="text-gray-400 text-sm">Bank-grade encryption</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-white font-semibold">Real-time</div>
              <div className="text-gray-400 text-sm">Live balance tracking</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
              <div className="text-white font-semibold">Easy</div>
              <div className="text-gray-400 text-sm">Simple interface</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
              <CardDescription className="text-gray-400">
                Sign in to access your crypto wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-900 px-2 text-gray-400">or</span>
                </div>
              </div>

              <Button 
                onClick={handleDemoLogin}
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/10"
                disabled={loading}
              >
                Try Demo Account
              </Button>

              <div className="text-center">
                <Link 
                  to="/signup"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Don't have an account? Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;


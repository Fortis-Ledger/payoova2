import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Shield, Zap, Globe, Users } from 'lucide-react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { signInWithGoogle } from '../../config/supabase-config';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBenefit, setCurrentBenefit] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBenefit((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  const { signup } = useAuth();

  const handleGoogleSignup = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google signup error:', error);
      setError('Google signup failed. Please try again.');
    }
  };

  const handleAppleSignup = () => {
    // Apple signup not implemented with Supabase yet
    setError('Apple signup is not available at the moment.');
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    const result = await signup(formData.name, formData.email, formData.password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const benefits = [
    { icon: Shield, title: "Bank-Grade Security", desc: "Your crypto is protected with military-grade encryption", color: "from-blue-500 to-cyan-500" },
    { icon: Zap, title: "Lightning Fast", desc: "Send and receive crypto in seconds worldwide", color: "from-yellow-500 to-orange-500" },
    { icon: Globe, title: "Multi-Network Support", desc: "Ethereum, Polygon, BSC and more networks", color: "from-green-500 to-emerald-500" },
    { icon: Users, title: "Join Thousands", desc: "Trusted by crypto enthusiasts globally", color: "from-purple-500 to-pink-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/3 w-60 h-60 bg-green-500/5 rounded-full blur-2xl"
          animate={{
            rotate: [0, 360]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Wallet className="w-7 h-7 text-white" />
              </motion.div>
              <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">PAYOOVA</span>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
                v2.0
              </Badge>
            </motion.div>
            
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Create an account{' '}
                <motion.span 
                  className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  →
                </motion.span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Join the future of digital finance. Create your secure crypto wallet and start your journey today.
              </p>
            </motion.div>

            {/* Animated Benefits */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBenefit}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${benefits[currentBenefit].color} flex items-center justify-center`}>
                      {React.createElement(benefits[currentBenefit].icon, { className: "w-6 h-6 text-white" })}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-lg">{benefits[currentBenefit].title}</div>
                      <div className="text-gray-400">{benefits[currentBenefit].desc}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Benefit Indicators */}
              <div className="flex justify-center space-x-2">
                {benefits.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentBenefit ? 'bg-blue-500 w-6' : 'bg-gray-600'
                    }`}
                    animate={{
                      scale: index === currentBenefit ? 1.2 : 1
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Signup Form */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm shadow-2xl">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <CardTitle className="text-2xl text-white mb-2">Create Account</CardTitle>
                  <CardDescription className="text-gray-400">
                    Start your crypto journey today
                  </CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert className="bg-red-500/10 border-red-500/20">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-400">
                          {error}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Social Signup Buttons */}
                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black/50 px-2 text-gray-400">Sign up with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignup}
                        className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAppleSignup}
                        className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Apple
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black/50 px-2 text-gray-400">Or create account with email</span>
                  </div>
                </div>

                <motion.form 
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  <motion.div 
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      required
                    />
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      required
                    />
                  </motion.div>
                  
                  <motion.div 
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white transition-colors duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white transition-colors duration-200"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:shadow-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : null}
                      {loading ? 'Creating Account...' : 'Create Account'}
                      {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </motion.div>
                </motion.form>

                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.1 }}
                >
                  <Link 
                    to="/login"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    Already have an account? <span className="text-blue-400 hover:text-blue-300">Sign in</span>
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;


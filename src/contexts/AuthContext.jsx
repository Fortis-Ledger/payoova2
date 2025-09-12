import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios base URL from environment
  useEffect(() => {
    const apiBase = import.meta?.env?.VITE_API_URL || import.meta?.env?.VITE_API_BASE || 'http://localhost:5000';
    axios.defaults.baseURL = apiBase;
    console.log('API Base URL configured:', apiBase);
  }, []);

  // Set up axios defaults with Auth0 token
  useEffect(() => {
    const setupAuth = async () => {
      if (isAuthenticated) {
        try {
          const accessToken = await getAccessTokenSilently();
          setToken(accessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          // Sync user data with backend
          if (auth0User) {
            const userData = {
              id: auth0User.sub,
              name: auth0User.name,
              email: auth0User.email,
              role: 'user' // Default role, can be updated from backend
            };
            setUser(userData);

            // Optionally sync with backend
            try {
              await axios.post('/api/auth/sync-user', userData);
            } catch (error) {
              console.error('User sync error:', error);
            }
          }
        } catch (error) {
          console.error('Error getting access token:', error);
        }
      } else {
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(isLoading);
    };

    setupAuth();
  }, [isAuthenticated, isLoading, auth0User, getAccessTokenSilently]);

  const login = async () => {
    try {
      await loginWithRedirect();
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  const signup = async () => {
    try {
      await loginWithRedirect({
        screen_hint: 'signup'
      });
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed' };
    }
  };

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, setAuthToken, getAuthToken } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const response = await authAPI.verifyToken();
          if (response.valid) {
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, remove it
            logout();
          }
        } catch (error) {
          // Token verification failed, remove it
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      if (response.token && response.user) {
        setAuthToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Login successful!');
        return { success: true, user: response.user };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.token && response.user) {
        setAuthToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(response.user));
        toast.success('Registration successful!');
        return { success: true, user: response.user };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (isAuthenticated) {
        await authAPI.logout();
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const changePassword = async (passwords) => {
    try {
      setLoading(true);
      const response = await authAPI.changePassword(passwords);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
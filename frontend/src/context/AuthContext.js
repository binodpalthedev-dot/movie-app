import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const didFetch = useRef(false);
  const isLoading = useRef(false);

  useEffect(() => {
    if (didFetch.current || isLoading.current) return;
    
    didFetch.current = true;
    isLoading.current = true;

    const fetchUser = async () => {
      try {
        const data = await authService.getMe();
        setUser(data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setInitializing(false);
        isLoading.current = false;
      }
    };

    fetchUser();
  }, []);

  const signIn = async (email, password, remember) => {
    try {
      const data = await authService.login({ email, password, remember });
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // API call fail ho bhi jaye to local state clear kar do
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      // Reset refs for potential re-login
      didFetch.current = false;
      isLoading.current = false;
    }
  };

  // Manual refresh function
  const refreshAuth = async () => {
    if (isLoading.current) return;
    
    isLoading.current = true;
    try {
      const data = await authService.getMe();
      setUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth refresh failed:', error);
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      isLoading.current = false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      initializing, 
      signIn, 
      signOut,
      refreshAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
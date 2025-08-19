import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isLoading = useRef(false);

  // Improved cookie check function
  const hasJWTCookie = () => {
    if (typeof document === 'undefined') return false;
    return document.cookie
      .split(';')
      .some(cookie => cookie.trim().startsWith('jwt=') && cookie.trim().length > 4);
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (isLoading.current) return;
      
      isLoading.current = true;
      
      try {
        // Check if JWT cookie exists
        if (!hasJWTCookie()) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        // Attempt to fetch user data
        const data = await authService.getMe();
        if (data && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setUser(null);
        setIsAuthenticated(false);
        
        // If auth fails, clear any invalid cookies
        if (hasJWTCookie()) {
          try {
            await authService.logout();
          } catch (logoutError) {
            console.error('Failed to clear invalid session:', logoutError);
          }
        }
      } finally {
        setInitializing(false);
        isLoading.current = false;
      }
    };

    initializeAuth();
  }, []); // Remove didFetch dependency

  const signIn = async (email, password, remember) => {
    try {
      const data = await authService.login({ email, password, remember });
      if (data && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }
      return data;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Manual refresh function
  const refreshAuth = async () => {
    if (isLoading.current) return;
    
    isLoading.current = true;
    try {
      if (!hasJWTCookie()) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const data = await authService.getMe();
      if (data && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      isLoading.current = false;
    }
  };

  // Listen for storage events to sync auth across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_change') {
        refreshAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
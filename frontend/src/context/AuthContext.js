import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isLoading = useRef(false);
  const justLoggedIn = useRef(false); // Track recent login

  // Check if JWT cookie exists
  const hasJWTCookie = () => {
    if (typeof document === 'undefined') return false;
    return document.cookie.split(';').some(cookie => 
      cookie.trim().startsWith('jwt=') && cookie.trim().length > 4
    );
  };

  useEffect(() => {
    if (isLoading.current) return;
    
    // Skip getMe call if user just logged in
    if (justLoggedIn.current) {
      justLoggedIn.current = false;
      setInitializing(false);
      return;
    }
    
    isLoading.current = true;

    const fetchUser = async () => {
      try {
        // Only make API call if cookie exists
        if (!hasJWTCookie()) {
          setUser(null);
          setIsAuthenticated(false);
          setInitializing(false);
          isLoading.current = false;
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
        console.error('Auth check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setInitializing(false);
        isLoading.current = false;
      }
    };

    fetchUser();
  }, []); // didFetch.current hataya

  const signIn = async (email, password, remember) => {
    try {
      const data = await authService.login({ email, password, remember });
      if (data && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        justLoggedIn.current = true; // Set flag to skip next getMe call
      }
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
      setUser(null);
      setIsAuthenticated(false);
      isLoading.current = false;
      justLoggedIn.current = false; // Reset flag on logout
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
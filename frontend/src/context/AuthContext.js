import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isLoading = useRef(false);
  const justLoggedIn = useRef(false);

  const hasJWTCookie = () => {
    if (typeof document === 'undefined') return false;
    const cookies = document.cookie;
    console.log('All cookies:', cookies);
    
    const hasJWT = cookies.split(';').some(cookie => {
      const trimmed = cookie.trim();
      console.log('Checking cookie:', trimmed);
      return trimmed.startsWith('jwt=') && trimmed.length > 4;
    });
    
    console.log('Has JWT cookie:', hasJWT);
    return hasJWT;
  };

  // AuthContext mein useEffect update kar
useEffect(() => {
  if (isLoading.current) return;
  
  if (justLoggedIn.current) {
    justLoggedIn.current = false;
    setInitializing(false);
    return;
  }
  
  isLoading.current = true;

  const fetchUser = async () => {
    try {
      if (!hasJWTCookie()) {
        console.log('No JWT cookie found');
        setUser(null);
        setIsAuthenticated(false);
        setInitializing(false);
        isLoading.current = false;
        return;
      }

      console.log('Making getMe API call...');
      const data = await authService.getMe();
      console.log('getMe response:', data);
      
      if (data && data.user) {
        console.log('Setting user:', data.user);
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        console.log('No user data in response');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Cookie hai but API fail ho rahi - don't logout immediately
      if (hasJWTCookie()) {
        console.log('Cookie exists but API failed, keeping logged in state');
        setIsAuthenticated(true); // Keep logged in if cookie exists
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
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
      if (data && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        justLoggedIn.current = true;
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
      justLoggedIn.current = false;
    }
  };

  const refreshAuth = async () => {
    if (isLoading.current) return;
    
    isLoading.current = true;
    try {
      const jwtCookie = hasJWTCookie();
      if (!jwtCookie) {
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
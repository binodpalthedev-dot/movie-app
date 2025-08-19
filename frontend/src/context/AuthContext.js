// context/AuthContext.js
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
        console.log("Checking authentication...");
        const data = await authService.getMe(); 
        console.log("User data received:", data);

        const userData = data.user || data;
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);

        localStorage.removeItem("token");
        sessionStorage.removeItem("token");

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
      console.log("Signing in with:", email);
      const data = await authService.login({ email, password, remember });
      console.log("Login successful:", data);

      setUser(data.user);
      setIsAuthenticated(true);

      if (data.token) {
        if (remember) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }
      }

      return data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("Logging out...");
      await authService.logout();
      console.log("Logout API success");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      setUser(null);
      setIsAuthenticated(false);

      didFetch.current = false;
      isLoading.current = false;
    }
  };

  const refreshAuth = async () => {
    if (isLoading.current) return;

    isLoading.current = true;
    try {
      console.log("Refreshing auth...");
      const data = await authService.getMe();
      console.log("Refresh response:", data);

      const userData = data.user || data;
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Auth refresh failed:", error);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      isLoading.current = false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        initializing,
        signIn,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
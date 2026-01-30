import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuthState, saveAuthState, clearAuthState, verifyPin } from '@/lib/auth';
import { storePin, fetchEntries } from '@/lib/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check stored auth state on mount
    const initAuth = async () => {
      const authenticated = checkAuthState();
      if (authenticated) {
        // Re-store PIN for API calls and fetch data
        storePin('9494');
        await fetchEntries();
      }
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (verifyPin(pin)) {
      // Store PIN for Google Sheets API calls
      storePin(pin);
      saveAuthState();
      setIsAuthenticated(true);
      
      // Fetch data from Google Sheets after login
      await fetchEntries();
      
      return { success: true };
    }
    return { 
      success: false, 
      error: 'The PIN is wrong. Call the owner now – 9398927019' 
    };
  };

  const logout = () => {
    clearAuthState();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * AuthContext — global JWT auth state using React Context.
 * Wraps the whole app so any component can read user + login/logout.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, AuthResponse } from '../api/ledgerApi';

interface AuthContextValue {
  user: AuthResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage token on page refresh
  useEffect(() => {
    const restore = async () => {
      if (authApi.isLoggedIn()) {
        try {
          const me = await authApi.me();
          setUser(me);
        } catch {
          authApi.clearToken();
        }
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    authApi.saveToken(data.token);
    setUser(data);
  };

  const register = async (email: string, password: string, username: string) => {
    const data = await authApi.register({ email, password, username });
    authApi.saveToken(data.token);
    setUser(data);
  };

  const logout = () => {
    authApi.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

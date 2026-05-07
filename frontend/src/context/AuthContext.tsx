/**
 * AuthContext --- global JWT auth state using React Context.
 * Wraps the whole app so any component can read user + login/logout.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, LoginResponse } from '../api/ledgerApi';

/** Shape of the user object exposed to the UI. */
export interface AuthUser {
    email: string;
    fullName: string;
    role: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    /**
     * Register a new account. Backend does NOT auto-login on register,
     * so this performs a follow-up login() call to populate the session.
     */
  register: (fullName: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session from localStorage token on page refresh
    useEffect(() => {
          const restore = async () => {
                  if (authApi.isLoggedIn()) {
                            try {
                                        const me = await authApi.me();
                                        setUser({ email: me.email, fullName: me.fullName, role: me.role });
                            } catch {
                                        authApi.clearToken();
                            }
                  }
                  setIsLoading(false);
          };
          restore();
    }, []);

    const applyLoginResponse = (data: LoginResponse) => {
          authApi.saveToken(data.token);
          setUser({ email: data.email, fullName: data.fullName, role: data.role });
    };

    const login = async (email: string, password: string) => {
          const data = await authApi.login({ email, password });
          applyLoginResponse(data);
    };

    const register = async (fullName: string, email: string, password: string, role: string = 'Viewer') => {
          // Backend register returns 201 with user info but NO token.
          // Immediately log in so the new user has an active session.
          await authApi.register({ fullName, email, password, role });
          const loginData = await authApi.login({ email, password });
          applyLoginResponse(loginData);
    };

    const logout = () => {
          authApi.clearToken();
          setUser(null);
    };

    return (
          <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
          </AuthContext.Provider>AuthContext.Provider>
        );
};

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

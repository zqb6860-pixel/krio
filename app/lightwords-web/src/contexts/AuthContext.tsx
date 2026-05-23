'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email?: string;
  phone?: string;
  username: string;
  avatar?: string;
  level: number;
  experience: number;
  coins: number;
  hearts: number;
  streak: number;
  settings: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginByPhone: (phone: string, code: string) => Promise<void>;
  loginByWechat: (code: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  registerByPhone: (phone: string, code: string, username: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getProfile()
        .then(setUser)
        .catch(() => { localStorage.removeItem('token'); })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(data.user);
  };

  const loginByPhone = async (phone: string, code: string) => {
    const data = await api.loginByPhone(phone, code);
    setUser(data.user);
  };

  const loginByWechat = async (code: string) => {
    const data = await api.loginByWechat(code);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await api.register(username, email, password);
    setUser(data.user);
  };

  const registerByPhone = async (phone: string, code: string, username: string, password?: string) => {
    const data = await api.registerByPhone(phone, code, username, password);
    setUser(data.user);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const profile = await api.getProfile();
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn: !!user,
      login,
      loginByPhone,
      loginByWechat,
      register,
      registerByPhone,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

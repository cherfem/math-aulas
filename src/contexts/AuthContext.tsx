import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types';
import { findUserByEmail, registerUser } from '../utils/storage';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('math_session');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const found = await findUserByEmail(email);
    if (!found || found.password !== password) {
      setIsLoading(false);
      throw new Error('E-mail ou senha inválidos.');
    }
    setUser(found);
    sessionStorage.setItem('math_session', JSON.stringify(found));
    setIsLoading(false);
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    const newUser = await registerUser(data);
    setUser(newUser);
    sessionStorage.setItem('math_session', JSON.stringify(newUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('math_session');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

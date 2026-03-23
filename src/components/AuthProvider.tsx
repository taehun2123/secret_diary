'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstTimeSetup: boolean | null;
  login: (password: string, username?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch auth status first (checking if NO user exists)
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsFirstTimeSetup(!data.hasUser);
        }
      })
      .catch(err => console.error(err));

    // Check for existing token on mount
    const savedToken = localStorage.getItem('diary_auth_token');
    if (savedToken) {
      // Verify token is still valid
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.valid) {
            setToken(savedToken);
            if (data.user?.username) setUsername(data.user.username);
          } else {
            localStorage.removeItem('diary_auth_token');
            setUsername(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('diary_auth_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (password: string, newUsername?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, username: newUsername }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        if (data.user?.username) setUsername(data.user.username);
        setIsFirstTimeSetup(false);
        localStorage.setItem('diary_auth_token', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error?.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('diary_auth_token');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        isAuthenticated: !!token,
        isLoading,
        isFirstTimeSetup,
        login,
        logout,
      }}
    >
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

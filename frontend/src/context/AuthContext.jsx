/**
 * AI VOICE INDIA — Authentication Context
 * Provides user auth state to the entire app.
 * Reads/stores JWT from localStorage, validates against /api/auth/me.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, fetchCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Initial auth check

  // On mount — restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('aiv_token');
    if (stored) {
      fetchCurrentUser(stored)
        .then((userData) => {
          setToken(stored);
          setUser(userData);
        })
        .catch(() => {
          // Token is invalid/expired — clear it
          localStorage.removeItem('aiv_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginUser({ email, password });
    localStorage.setItem('aiv_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    localStorage.setItem('aiv_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('aiv_token');
    setToken(null);
    setUser(null);
  }, []);

  /**
   * updateUser — merge partial user data into the current user state.
   * Used by VoiceStudio after a successful generation to update
   * characters_used and characters_remaining without a full re-fetch.
   */
  const updateUser = useCallback((partialUser) => {
    setUser(prev => prev ? { ...prev, ...partialUser } : prev);
  }, []);

  /**
   * refreshUser — re-fetch full user data from /api/auth/me.
   * Called when we want authoritative usage numbers from the backend.
   */
  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem('aiv_token');
    if (!stored) return;
    try {
      const userData = await fetchCurrentUser(stored);
      setUser(userData);
    } catch {
      // Token expired — logout
      localStorage.removeItem('aiv_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
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

/**
 * AI VOICE INDIA — Theme Context
 * Manages dark/light theme switching with localStorage persistence.
 * Sets data-theme attribute on <html> element.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'aiv_theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return 'dark';
  });

  // Apply theme attribute to <html> whenever it changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, 'dark');
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setDark = useCallback(() => setTheme('dark'), []);
  const setLight = useCallback(() => setTheme('light'), []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setDark, setLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

import React, { useState } from 'react';
import {
  Mic, Globe, Volume2, Layers, HelpCircle, LogOut, User,
  CreditCard, Sun, Moon, Zap, Menu, X, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeTab, setActiveTab, healthData }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const planName = (user?.plan || 'free').toUpperCase();
  const charactersUsed = user?.characters_used ?? 0;
  const characterLimit = user?.character_limit ?? 5000;
  const charactersRemaining = user?.characters_remaining ?? Math.max(0, characterLimit - charactersUsed);

  const navItems = [
    { id: 'studio',       label: 'Voice Studio',     icon: Mic },
    { id: 'upgrade',      label: 'Pricing / Upgrade', icon: CreditCard },
    { id: 'voices',       label: 'Voice Library',    icon: Volume2 },
    { id: 'languages',    label: 'Languages',        icon: Globe },
    { id: 'how-it-works', label: 'How It Works',     icon: HelpCircle },
    { id: 'about',        label: 'About',            icon: Layers },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="navbar-header">
        <div className="container navbar-container">
          {/* ── Top Row: Hamburger + Logo + User Controls ── */}
          <div className="navbar-top-row">
            {/* Left: Hamburger button (mobile) + Brand Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <button
                type="button"
                className="hamburger-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                title="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div
                onClick={() => handleNavClick('studio')}
                className="navbar-brand"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', minWidth: 0 }}
              >
                {/* Logo icon with soundwaves */}
                <div className="navbar-logo-icon">
                  <Mic size={17} color="var(--saffron-primary)" />
                </div>

                <div className="navbar-brand-text">
                  <div className="navbar-brand-title">
                    AI VOICE INDIA
                  </div>
                  <div className="navbar-brand-sub">
                    Natural AI voices
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Plan Info + Character Counter + Theme Toggle + User + Logout */}
            <div className="navbar-right">
              {isAuthenticated && user ? (
                <>
                  {/* Character Counter Badge (Desktop / Tablet) */}
                  <div
                    onClick={() => handleNavClick('upgrade')}
                    className="navbar-char-badge"
                    title="Remaining generation characters. Click to view upgrade plans."
                  >
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: charactersRemaining <= 0 ? '#ef4444' : (charactersRemaining < 50 ? '#f59e0b' : '#10b981'),
                      flexShrink: 0
                    }} />
                    <span>
                      <strong>{charactersRemaining.toLocaleString()}</strong> / {characterLimit.toLocaleString()}
                    </span>
                  </div>

                  {/* Plan Badge & Upgrade Button */}
                  <button
                    onClick={() => handleNavClick('upgrade')}
                    id="navbar-upgrade-btn"
                    className="navbar-plan-badge"
                    title="View or Upgrade Plan"
                  >
                    <Zap size={11} />
                    <span>{planName}</span>
                  </button>

                  {/* Compact User Chip */}
                  <div
                    className="navbar-user-chip"
                    onClick={() => handleNavClick('upgrade')}
                    title={`Logged in as ${user.name || user.email}`}
                  >
                    <div className="user-avatar-circle">
                      <User size={12} color="var(--text-primary)" />
                    </div>
                    <span className="navbar-username">
                      {user.name || 'User'}
                    </span>
                    <ChevronDown size={11} className="navbar-user-chevron" />
                  </div>
                </>
              ) : (
                <div className="navbar-auth-buttons">
                  <button
                    onClick={() => handleNavClick('login')}
                    className="btn-signin-nav"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavClick('register')}
                    className="btn-signup-nav"
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Theme Toggle Button (Light / Dark) */}
              <button
                id="theme-toggle-btn"
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun size={15} color="#FFA333" />
                ) : (
                  <Moon size={15} color="#6366f1" />
                )}
              </button>

              {/* Logout Icon Button */}
              {isAuthenticated && (
                <button
                  id="navbar-logout"
                  className="navbar-logout-btn"
                  onClick={logout}
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={14} />
                  <span className="logout-text">Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Desktop Navigation Tabs ── */}
          <nav className="navbar-nav navbar-nav-desktop">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={isActive ? 'nav-active' : ''}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="navbar-logo-icon" style={{ width: '32px', height: '32px' }}>
                  <Mic size={16} color="var(--saffron-primary)" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                  AI VOICE INDIA
                </div>
              </div>
              <button
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile User Profile Section */}
            {isAuthenticated && user && (
              <div className="mobile-drawer-user">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="user-avatar-circle" style={{ width: '36px', height: '36px' }}>
                    <User size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="mobile-drawer-stats">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Characters remaining:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{charactersRemaining.toLocaleString()} / {characterLimit.toLocaleString()}</strong>
                  </div>
                  <button
                    onClick={() => handleNavClick('upgrade')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'linear-gradient(135deg, #FF8A00 0%, #FF512F 100%)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Zap size={13} />
                    <span>Plan: {planName} — Upgrade / Refill</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <div className="mobile-drawer-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} color={isActive ? 'var(--saffron-primary)' : 'var(--text-muted)'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Drawer Footer with Auth & Dev Mode */}
            <div className="mobile-drawer-footer">
              {!isAuthenticated ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <button
                    onClick={() => handleNavClick('login')}
                    className="btn-secondary"
                    style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => handleNavClick('register')}
                    className="btn-primary"
                    style={{ width: '100%', padding: '10px', justifyContent: 'center', background: 'var(--saffron-primary)', color: '#fff' }}
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '10px', justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <LogOut size={15} />
                  <span>Log Out of Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


import React from 'react';
import {
  Mic, Globe, Volume2, Layers, HelpCircle, LogOut, User,
  CreditCard, Sun, Moon, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ activeTab, setActiveTab, healthData }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const planName = (user?.plan || 'free').toUpperCase();
  const charactersUsed = user?.characters_used ?? 0;
  const characterLimit = user?.character_limit ?? 200;
  const charactersRemaining = user?.characters_remaining ?? Math.max(0, characterLimit - charactersUsed);

  const navItems = [
    { id: 'studio',       label: 'Voice Studio',     icon: Mic },
    { id: 'upgrade',      label: 'Pricing / Upgrade', icon: CreditCard },
    { id: 'voices',       label: 'Voice Library',    icon: Volume2 },
    { id: 'languages',    label: 'Languages',        icon: Globe },
    { id: 'how-it-works', label: 'How It Works',     icon: HelpCircle },
    { id: 'about',        label: 'About',            icon: Layers },
  ];

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* ── Top Row: Logo + User Controls ── */}
        <div className="navbar-top-row">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('studio')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
          >
            {/* Logo icon */}
            <div style={{
              width: '36px', height: '36px',
              borderRadius: '9px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Mic size={18} color="var(--saffron-primary)" />
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.1rem',
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}>
                AI VOICE INDIA
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                fontWeight: 400,
                letterSpacing: '0.03em',
              }}>
                Natural AI voices
              </div>
            </div>
          </div>

          {/* Right: Plan Info + Character Counter + Theme Toggle + User + Logout */}
          <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isAuthenticated && user ? (
              <>
                {/* Character Counter Badge */}
                <div
                  onClick={() => setActiveTab('upgrade')}
                  title="Remaining generation characters. Click to view upgrade plans."
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: charactersRemaining <= 0 ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-card)',
                    border: `1px solid ${charactersRemaining <= 0 ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-medium)'}`,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: charactersRemaining <= 0 ? '#ef4444' : 'var(--text-primary)',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: charactersRemaining <= 0 ? '#ef4444' : (charactersRemaining < 50 ? '#f59e0b' : '#10b981'),
                  }} />
                  <span>
                    <strong>{charactersRemaining}</strong> / {characterLimit} chars
                  </span>
                </div>

                {/* Plan Badge & Upgrade Button */}
                <button
                  onClick={() => setActiveTab('upgrade')}
                  id="navbar-upgrade-btn"
                  title="View or Upgrade Plan"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 11px',
                    borderRadius: 'var(--radius-full)',
                    background: planName === 'BASIC' || planName === 'FREE' ? 'linear-gradient(135deg, #FF8A00 0%, #FF512F 100%)' : 'var(--bg-card)',
                    color: planName === 'BASIC' || planName === 'FREE' ? '#FFFFFF' : 'var(--text-primary)',
                    border: planName === 'BASIC' || planName === 'FREE' ? 'none' : '1px solid var(--border-medium)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    boxShadow: planName === 'BASIC' || planName === 'FREE' ? '0 2px 10px rgba(255, 138, 0, 0.3)' : 'none',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <Zap size={12} />
                  <span>{planName}</span>
                </button>

                {/* User chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'rgba(125,125,125,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={12} color="var(--text-primary)" />
                  </div>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)',
                    maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user.name}
                  </span>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('login')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, #FF8A00 0%, #FF512F 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(255, 138, 0, 0.3)',
                    transition: 'all 0.18s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = ''}
                >
                  Sign Up
                </button>
              </>
            )}

            {/* Theme Toggle Button (Light / Dark) */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              aria-label="Toggle Theme"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {theme === 'dark' ? (
                <Sun size={16} color="#FFA333" />
              ) : (
                <Moon size={16} color="#6366f1" />
              )}
            </button>

            {/* Logout */}
            {isAuthenticated && (
              <button
                id="navbar-logout"
                onClick={logout}
                title="Logout"
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <LogOut size={13} />
                <span className="logout-text">Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <nav className="navbar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
  );
}

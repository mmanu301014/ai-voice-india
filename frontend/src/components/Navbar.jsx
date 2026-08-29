import React from 'react';
import { Mic, Globe, Volume2, Layers, HelpCircle, LogOut, User, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, healthData }) {
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = [
    { id: 'studio',       label: 'Voice Studio',     icon: Mic },
    { id: 'pricing',      label: 'Plans & Pricing',  icon: CreditCard },
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
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Mic size={18} color="#FFFFFF" />
            </div>

            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.1rem',
                letterSpacing: '-0.01em',
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}>
                AI VOICE INDIA
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.45)',
                fontWeight: 400,
                letterSpacing: '0.03em',
              }}>
                Natural AI voices
              </div>
            </div>
          </div>

          {/* Right: User + Logout */}
          <div className="navbar-right">
            {isAuthenticated && user && (
              <>
                {/* User chip */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={13} color="#FFFFFF" />
                  </div>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF',
                    maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user.name}
                  </span>
                  {/* Plan badge */}
                  <span
                    onClick={e => { e.stopPropagation(); setActiveTab('pricing'); }}
                    style={{
                      fontSize: '0.64rem', fontWeight: 700,
                      padding: '2px 7px', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                    title="View current plan & subscription"
                  >
                    {user.plan || 'FREE'}
                  </span>
                </div>

                {/* Logout */}
                <button
                  id="navbar-logout"
                  onClick={logout}
                  title="Logout"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: '0.78rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </>
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

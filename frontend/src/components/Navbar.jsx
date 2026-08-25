import React from 'react';
import { Mic, Globe, Volume2, Layers, HelpCircle, LogOut, User, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, healthData }) {
  const { user, logout, isAuthenticated } = useAuth();

  const navItems = [
    { id: 'studio', label: 'Voice Studio', icon: Mic },
    { id: 'pricing', label: 'Plans & Pricing', icon: CreditCard },
    { id: 'voices', label: 'Voice Library', icon: Volume2 },
    { id: 'languages', label: 'Languages', icon: Globe },
    { id: 'how-it-works', label: 'How it Works', icon: HelpCircle },
    { id: 'about', label: 'About', icon: Layers }
  ];

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Top row / Logo + Right side on mobile */}
        <div className="navbar-top-row">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF9933 0%, #138808 100%)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: '#0D1117',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Mic size={20} color="#FF9933" />
              </div>
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(90deg, #FFFFFF 0%, #FFA333 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  whiteSpace: 'nowrap'
                }}>
                  AI VOICE INDIA
                </span>
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                letterSpacing: '0.02em'
              }}>
                Natural AI voices
              </div>
            </div>
          </div>

          {/* Right side: Status + User for top row */}
          <div className="navbar-right">
            {/* Status Indicator - desktop only */}
            <div className="status-badge-desktop" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 208, 132, 0.08)',
              border: '1px solid rgba(0, 208, 132, 0.2)',
              fontSize: '0.75rem',
              color: '#4EEDA3',
              fontWeight: 500
            }}>

              <span></span>
            </div>

            {/* User info + Logout */}
            {isAuthenticated && user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* User avatar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 138, 0, 0.08)',
                  border: '1px solid rgba(255, 138, 0, 0.2)',
                }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF9933, #FF512F)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={12} color="#fff" />
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#FFA333',
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {user.name}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('pricing');
                    }}
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: (user.plan === 'pro') ? 'rgba(255, 138, 0, 0.2)' : (user.plan === 'basic') ? 'rgba(0, 210, 255, 0.2)' : 'rgba(0, 208, 132, 0.2)',
                      color: (user.plan === 'pro') ? '#FFA333' : (user.plan === 'basic') ? '#00D2FF' : '#4EEDA3',
                      border: (user.plan === 'pro') ? '1px solid rgba(255, 138, 0, 0.4)' : (user.plan === 'basic') ? '1px solid rgba(0, 210, 255, 0.4)' : '1px solid rgba(0, 208, 132, 0.4)',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                    title="View current plan & subscription"
                  >
                    {user.plan || 'FREE'}
                  </span>
                </div>

                {/* Logout button */}
                <button
                  id="navbar-logout"
                  onClick={logout}
                  title="Logout"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#FCA5A5',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'linear-gradient(135deg, rgba(255, 138, 0, 0.2) 0%, rgba(255, 81, 47, 0.2) 100%)' : 'transparent',
                  color: isActive ? '#FFA333' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  border: isActive ? '1px solid rgba(255, 138, 0, 0.3)' : '1px solid transparent'
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

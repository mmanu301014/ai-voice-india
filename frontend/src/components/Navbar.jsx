import React from 'react';
import { Mic, Globe, Sparkles, Volume2, ShieldCheck, Layers, HelpCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, healthData }) {
  const navItems = [
    { id: 'studio', label: 'Voice Studio', icon: Mic },
    { id: 'voices', label: 'Voice Library', icon: Volume2 },
    { id: 'languages', label: 'Languages', icon: Globe },
    { id: 'how-it-works', label: 'How it Works', icon: HelpCircle },
    { id: 'about', label: 'About', icon: Layers }
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      backgroundColor: 'rgba(7, 9, 14, 0.88)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('studio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF9933 0%, #138808 100%)',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#0D1117',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Mic size={22} color="#FF9933" />
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
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #FFFFFF 0%, #FFA333 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                AI VOICE INDIA
              </span>
              <span className="badge badge-saffron" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                ₹0 FREE
              </span>
            </div>
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
              letterSpacing: '0.02em'
            }}>
              Natural AI voices, made for India
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '4px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
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
                  gap: '8px',
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
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
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
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00D084',
              boxShadow: '0 0 8px #00D084'
            }}></span>
            <span>Free Development Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * AI VOICE INDIA — Navbar
 * Updated Header & Navigation matching reference design:
 *   Left:   [ Soundwave logo | AI Voice India ]  Home  Languages ▾  Pricing ▾  About  Help?
 *   Right:  Login → (dark pill with arrow) | character badge + user chip when authenticated
 *
 * Preserves all existing auth, logout, character counter, theme, and mobile responsiveness.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, User, Zap, X, ChevronDown, Layers, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ── Soundwave logo icon ──────────────────────────────────────────────────────
function SoundwaveLogo() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect x="2"  y="11" width="3.8" height="10" rx="1.9" fill="currentColor" />
      <rect x="8"  y="7"  width="3.8" height="18" rx="1.9" fill="currentColor" />
      <rect x="14" y="3"  width="3.8" height="26" rx="1.9" fill="currentColor" />
      <rect x="20" y="7"  width="3.8" height="18" rx="1.9" fill="currentColor" />
      <rect x="26" y="11" width="3.8" height="10" rx="1.9" fill="currentColor" />
    </svg>
  );
}

// ── Arrow icon for Login button ───────────────────────────────────────────────
function ArrowRightIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── 12 Required Languages ───────────────────────────────────────────────────
const NAV_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
];

// ── Pricing Tiers for Dropdown ──────────────────────────────────────────────
const NAV_PRICING_PLANS = [
  { id: 'basic', name: 'Basic Creator', price: '₹99', chars: '1,000 chars / mo' },
  { id: 'pro', name: 'Pro Creator', price: '₹199', chars: '1,000 chars / mo' },
  { id: 'premium', name: 'Premium Creator', price: '₹999', chars: '5,000 chars / mo' },
];

export default function Navbar({ activeTab, setActiveTab, healthData, onLogout, setSelectedLang }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  // Accordion states for mobile drawer
  const [mobileLangOpen, setMobileLangOpen] = useState(false);
  const [mobilePricingOpen, setMobilePricingOpen] = useState(false);

  const navRef = useRef(null);

  // Click outside & Escape key handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setLanguagesOpen(false);
        setPricingOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLanguagesOpen(false);
        setPricingOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const planName = (user?.plan || 'free').toUpperCase();
  const charactersUsed = user?.characters_used ?? 0;
  const characterLimit = user?.character_limit ?? 5000;
  const charactersRemaining =
    user?.characters_remaining ?? Math.max(0, characterLimit - charactersUsed);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    if (onLogout) onLogout();
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setLanguagesOpen(false);
    setPricingOpen(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLanguageSelect = (langCode) => {
    if (setSelectedLang) {
      setSelectedLang(langCode);
    }
    setLanguagesOpen(false);
    setMobileMenuOpen(false);
    if (isAuthenticated) {
      setActiveTab('studio');
    } else {
      setActiveTab('languages');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isHomeActive = activeTab === 'home' || activeTab === 'studio';
  const isLanguagesActive = activeTab === 'languages';
  const isPricingActive = activeTab === 'upgrade' || activeTab === 'pricing';
  const isAboutActive = activeTab === 'about';
  const isHelpActive = activeTab === 'how-it-works';

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          MAIN NAVBAR — Matches reference design layout
          [ Logo ]  Home  Languages ▾  Pricing ▾  About  Help?    [ Login → ]
          ═══════════════════════════════════════════════════════ */}
      <header className="lp-navbar" ref={navRef}>
        <div className="lp-navbar-inner">

          {/* ── Left flex group: Logo + Navigation Links ── */}
          <div className="lp-navbar-left">
            {/* Mobile-only Hamburger Icon on FAR LEFT */}
            <button
              type="button"
              className="lp-hamburger-left"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X size={22} color="#000000" /> : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="#000000" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            <div
              className="lp-navbar-brand"
              onClick={() => handleNavClick(isAuthenticated ? 'studio' : 'home')}
              title="AI Voice India — Home"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNavClick(isAuthenticated ? 'studio' : 'home')}
            >
              <SoundwaveLogo />
              <span className="lp-brand-text">AI Voice India</span>
            </div>

            <nav className="lp-navbar-nav" aria-label="Main navigation">
              {/* Home */}
              <button
                className={`lp-nav-link${isHomeActive ? ' lp-nav-link--active' : ''}`}
                onClick={() => handleNavClick(isAuthenticated ? 'studio' : 'home')}
                id="nav-home-btn"
              >
                Home
              </button>

              {/* Languages ▾ */}
              <div className="lp-dropdown-wrapper">
                <button
                  className={`lp-nav-link${isLanguagesActive || languagesOpen ? ' lp-nav-link--active' : ''}`}
                  onClick={() => {
                    setLanguagesOpen(!languagesOpen);
                    setPricingOpen(false);
                  }}
                  id="nav-languages-btn"
                  aria-haspopup="true"
                  aria-expanded={languagesOpen}
                >
                  Languages
                  <ChevronDown size={14} className={`lp-nav-chevron ${languagesOpen ? 'is-open' : ''}`} />
                </button>

                {languagesOpen && (
                  <div className="lp-dropdown-menu lp-languages-dropdown" role="menu" aria-label="Languages dropdown">
                    <div className="lp-dropdown-grid">
                      {NAV_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          className="lp-dropdown-item lp-lang-item"
                          onClick={() => handleLanguageSelect(lang.code)}
                          role="menuitem"
                        >
                          <span className="lp-lang-name">{lang.name}</span>
                          <span className="lp-lang-native">{lang.nativeName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="lp-dropdown-wrapper">
                <button
                  className={`lp-nav-link${isPricingActive ? ' lp-nav-link--active' : ''}`}
                  onClick={() => handleNavClick('pricing')}
                  id="nav-pricing-btn"
                >
                  Pricing
                </button>
              </div>

              {/* About */}
              <button
                className={`lp-nav-link${isAboutActive ? ' lp-nav-link--active' : ''}`}
                onClick={() => handleNavClick('about')}
                id="nav-about-btn"
              >
                About
              </button>

              {/* Help? */}
              <button
                className={`lp-nav-link${isHelpActive ? ' lp-nav-link--active' : ''}`}
                onClick={() => handleNavClick('how-it-works')}
                id="nav-help-btn"
              >
                Help?
              </button>
            </nav>
          </div>

          {/* ── Right flex group: Auth / Login button ── */}
          <div className="lp-navbar-right">

            {isAuthenticated && user ? (
              /* ── Logged-in state ── */
              <>
                {/* Character counter */}
                <div
                  className="lp-char-badge"
                  onClick={() => handleNavClick('upgrade')}
                  title="Remaining characters — click to upgrade"
                >
                  <span
                    className="lp-char-dot"
                    style={{
                      background:
                        charactersRemaining <= 0
                          ? '#ef4444'
                          : charactersRemaining < 50
                          ? '#f59e0b'
                          : '#10b981',
                    }}
                  />
                  <span>
                    <strong>{charactersRemaining.toLocaleString()}</strong>
                    {' '}/ {characterLimit.toLocaleString()}
                  </span>
                </div>

                {/* Plan badge */}
                <button
                  className="lp-plan-badge"
                  onClick={() => handleNavClick('upgrade')}
                  id="navbar-upgrade-btn"
                  title="View or Upgrade Plan"
                >
                  <Zap size={11} />
                  <span>{planName}</span>
                </button>

                {/* User chip */}
                <div
                  className="lp-user-chip"
                  onClick={() => handleNavClick('upgrade')}
                  title={`Logged in as ${user.name || user.email}`}
                >
                  <div className="lp-user-avatar">
                    <User size={12} />
                  </div>
                  <span className="lp-user-name">{user.name || 'User'}</span>
                  <ChevronDown size={11} style={{ opacity: 0.6 }} />
                </div>

                {/* Logout */}
                <button
                  id="navbar-logout"
                  className="lp-logout-btn"
                  onClick={handleLogout}
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={14} />
                  <span className="lp-logout-text">Logout</span>
                </button>
              </>
            ) : (
              /* ── Logged-out state: Mobile actions + Desktop login ── */
              <>
                {/* Mobile-only header right buttons: Free Trial + Log in */}
                <div className="lp-mobile-header-actions">
                  <button
                    className="lp-btn-mobile-trial"
                    onClick={() => handleNavClick('register')}
                    title="Free Trial"
                  >
                    Free Trial
                  </button>
                  <button
                    className="lp-btn-mobile-login"
                    onClick={() => handleNavClick('login')}
                    title="Log in"
                  >
                    Log in
                  </button>
                </div>

                {/* Desktop Login button */}
                <button
                  className="lp-btn-login lp-desktop-only"
                  onClick={() => handleNavClick('login')}
                  id="nav-login-btn"
                  title="Login to AI Voice India"
                >
                  Login
                  <ArrowRightIcon size={14} color="#ffffff" />
                </button>
              </>
            )}

            {/* Default desktop hamburger (hidden on mobile unauthenticated view) */}
            <button
              type="button"
              className="lp-hamburger lp-hamburger-default"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X size={20} /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          MOBILE NAVIGATION DRAWER
          ═══════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SoundwaveLogo />
                <span className="lp-brand-text">AI Voice India</span>
              </div>
              <button
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile user profile if authenticated */}
            {isAuthenticated && user && (
              <div className="mobile-drawer-user">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="user-avatar-circle" style={{ width: '36px', height: '36px' }}>
                    <User size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: 700, fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {user.name || 'User'}
                    </div>
                    <div style={{
                      fontSize: '0.74rem', color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="mobile-drawer-stats">
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.78rem', marginBottom: '6px'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Characters remaining:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {charactersRemaining.toLocaleString()} / {characterLimit.toLocaleString()}
                    </strong>
                  </div>
                  <button
                    onClick={() => handleNavClick('upgrade')}
                    style={{
                      width: '100%', padding: '8px',
                      background: 'linear-gradient(135deg, #FF8A00 0%, #FF512F 100%)',
                      border: 'none', borderRadius: 'var(--radius-sm)',
                      color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 700,
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <Zap size={13} />
                    <span>Plan: {planName} — Upgrade / Refill</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mobile nav links: Home, Languages, Pricing, About, Help, Login */}
            <div className="mobile-drawer-nav">
              {/* Home */}
              <button
                className={`mobile-nav-link ${isHomeActive ? 'active' : ''}`}
                onClick={() => handleNavClick(isAuthenticated ? 'studio' : 'home')}
              >
                <span>Home</span>
              </button>

              {/* Languages accordion */}
              <div>
                <button
                  className={`mobile-nav-link ${isLanguagesActive ? 'active' : ''}`}
                  onClick={() => setMobileLangOpen(!mobileLangOpen)}
                >
                  <span>Languages</span>
                  <ChevronDown
                    size={14}
                    style={{
                      marginLeft: 'auto',
                      transform: mobileLangOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
                {mobileLangOpen && (
                  <div className="mobile-subnav-list">
                    {NAV_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        className="mobile-subnav-item"
                        onClick={() => handleLanguageSelect(lang.code)}
                      >
                        <span>{lang.name}</span>
                        <span className="lp-lang-native">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing */}
              <button
                className={`mobile-nav-link ${isPricingActive ? 'active' : ''}`}
                onClick={() => handleNavClick('pricing')}
              >
                <span>Pricing</span>
              </button>

              {/* About */}
              <button
                className={`mobile-nav-link ${isAboutActive ? 'active' : ''}`}
                onClick={() => handleNavClick('about')}
              >
                <span>About</span>
              </button>

              {/* Help */}
              <button
                className={`mobile-nav-link ${isHelpActive ? 'active' : ''}`}
                onClick={() => handleNavClick('how-it-works')}
              >
                <span>Help</span>
              </button>

              {/* Login */}
              {!isAuthenticated && (
                <button
                  className="mobile-nav-link"
                  style={{ fontWeight: 700, color: '#111827' }}
                  onClick={() => handleNavClick('login')}
                >
                  <span>Login</span>
                  <ArrowRightIcon size={14} />
                </button>
              )}
            </div>

            {/* Mobile drawer footer */}
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
                    style={{
                      width: '100%', padding: '10px', justifyContent: 'center',
                      background: 'var(--saffron-primary)', color: '#fff'
                    }}
                  >
                    Sign Up Free
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{
                    width: '100%', padding: '10px', justifyContent: 'center',
                    color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)'
                  }}
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


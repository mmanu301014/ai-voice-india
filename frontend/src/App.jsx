import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import DemoBanner from './components/DemoBanner';
import Hero from './components/Hero';
import VoiceStudio from './components/VoiceStudio';
import VoiceLibrary from './components/VoiceLibrary';
import LanguagesShowcase from './components/LanguagesShowcase';
import HowItWorks from './components/HowItWorks';
import AboutView from './components/AboutView';
import PricingView from './components/PricingView';
import UpgradeView from './components/UpgradeView';
import Login from './components/Login';
import Register from './components/Register';
import { fetchHealth, fetchVoices } from './services/api';

function MainApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [healthData, setHealthData] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [initialMode, setInitialMode] = useState('youtube');
  const [initialStyle, setInitialStyle] = useState('Storytelling');
  const [openLangModal, setOpenLangModal] = useState(false);
  const [openVoiceModal, setOpenVoiceModal] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    fetchHealth().then(setHealthData).catch(console.error);
    fetchVoices().then((res) => {
      if (res && res.voices) setVoices(res.voices);
    }).catch(console.error);

    // Initial route check for /pricing or #pricing
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/pricing' || hash === '#pricing') {
      setActiveTab('pricing');
    }
  }, []);

  // ── After auth resolves, decide initial view ─────────────────────────────
  // If user is already authenticated on load → go straight to studio
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && activeTab === 'home') {
        setActiveTab('studio');
      }
    }
  }, [loading, isAuthenticated]);

  const handleSelectLanguageFromShowcase = (langCode) => {
    setSelectedLang(langCode);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVoiceFromLibrary = (voice) => {
    setSelectedLang(voice.language);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenUpgrade = () => {
    setActiveTab('upgrade');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── LOGIN PAGE ────────────────────────────────────────────────────────────
  if (activeTab === 'login') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#000000' }}>
        <button
          onClick={() => setActiveTab('home')}
          style={{
            position: 'absolute', top: '20px', left: '20px', zIndex: 10,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF', padding: '8px 16px', borderRadius: '999px',
            fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          ← Back
        </button>
        <Login
          onSwitchToRegister={() => setActiveTab('register')}
          onSuccess={() => {
            setActiveTab('studio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // ── REGISTER PAGE ─────────────────────────────────────────────────────────
  if (activeTab === 'register') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#000000' }}>
        <button
          onClick={() => setActiveTab('home')}
          style={{
            position: 'absolute', top: '20px', left: '20px', zIndex: 10,
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF', padding: '8px 16px', borderRadius: '999px',
            fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          ← Back
        </button>
        <Register
          onSwitchToLogin={() => setActiveTab('login')}
          onSuccess={() => {
            setActiveTab('studio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  // ── MAIN APP (Authenticated users — Studio + all tabs) ────────────────────
  const isDashboardView = activeTab === 'studio' || activeTab === 'home';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      backgroundColor: '#0D1117', color: '#F0F6FC'
    }}>
      {/* Show Navbar & DemoBanner only on secondary subpages */}
      {!isDashboardView && (
        <>
          <Navbar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
            }}
            healthData={healthData}
            onLogout={() => setActiveTab('home')}
            setSelectedLang={setSelectedLang}
          />
          <DemoBanner healthData={healthData} />
        </>
      )}

      {/* Main Content */}
      <main style={{ flex: 1 }}>

        {/* ── VOICE STUDIO (Default dashboard view matching reference image) ── */}
        {isDashboardView && (
          <VoiceStudio
            voices={voices}
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
            initialMode={initialMode}
            initialStyle={initialStyle}
            onOpenUpgrade={handleOpenUpgrade}
            setActiveTab={setActiveTab}
          />
        )}

        {(activeTab === 'upgrade' || activeTab === 'pricing') && (
          <div>
            <PricingView
              onOpenStudio={() => {
                setActiveTab('studio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              setActiveTab={setActiveTab}
            />
          </div>
        )}

        {activeTab === 'voices' && (
          <div style={{ paddingTop: '32px' }}>
            <VoiceLibrary
              voices={voices}
              onSelectVoice={handleSelectVoiceFromLibrary}
            />
          </div>
        )}

        {activeTab === 'languages' && (
          <div style={{ paddingTop: '32px' }}>
            <LanguagesShowcase
              voices={voices}
              onSelectLanguage={handleSelectLanguageFromShowcase}
            />
          </div>
        )}

        {activeTab === 'how-it-works' && (
          <div style={{ paddingTop: '32px' }}>
            <HowItWorks onOpenStudio={() => {
              setActiveTab('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} />
          </div>
        )}

        {activeTab === 'about' && (
          <div style={{ paddingTop: '32px' }}>
            <AboutView />
          </div>
        )}
      </main>

      {/* Show site footer only on secondary subpages */}
      {!isDashboardView && (
        <footer className="site-footer">
          <div className="container footer-content" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)'
          }}>
            <div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>AI VOICE INDIA</span>{' '}
              — Natural AI voices, made for India.
            </div>
            <div className="footer-links" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <button onClick={() => { setActiveTab('studio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }}>Voice Studio</button>
              <button onClick={() => { setActiveTab('upgrade'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }}>Plans & Pricing</button>
              <button onClick={() => { setActiveTab('voices'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }}>Voice Library</button>
              <button onClick={() => { setActiveTab('languages'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }}>Languages</button>
              <button onClick={() => { setActiveTab('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }}>About</button>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Natural Indian Speech · Zero Cost Dev Mode
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', backgroundColor: '#000000', color: '#FFFFFF',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '24px', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '12px', color: '#FF8A00' }}>AI VOICE INDIA</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px', maxWidth: '500px' }}>
            An unexpected error occurred while loading the studio. Click below to reload.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{
              padding: '10px 24px', borderRadius: '999px',
              background: 'linear-gradient(135deg, #FF8A00 0%, #FF512F 100%)',
              border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Reload AI Voice Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

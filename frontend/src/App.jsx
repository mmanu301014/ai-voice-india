import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import DemoBanner from './components/DemoBanner';
import Hero from './components/Hero';
import VoiceStudio from './components/VoiceStudio';
import CreatorShowcase from './components/CreatorShowcase';
import VoiceLibrary from './components/VoiceLibrary';
import LanguagesShowcase from './components/LanguagesShowcase';
import HowItWorks from './components/HowItWorks';
import AboutView from './components/AboutView';
import PricingView from './components/PricingView';
import Login from './components/Login';
import Register from './components/Register';
import { fetchHealth, fetchVoices } from './services/api';

// ── Inner app — only rendered when authenticated ──────────────────────────
function AuthenticatedApp() {
  const [activeTab, setActiveTab] = useState('studio');
  const [healthData, setHealthData] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [initialMode, setInitialMode] = useState('youtube');
  const [initialStyle, setInitialStyle] = useState('Storytelling');

  useEffect(() => {
    fetchHealth().then(setHealthData).catch(console.error);
    fetchVoices().then((res) => {
      if (res && res.voices) setVoices(res.voices);
    }).catch(console.error);
  }, []);

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

  const handleSelectModeFromShowcase = (modeId) => {
    setInitialMode(modeId);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStyleFromShowcase = (styleId) => {
    setInitialStyle(styleId);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthData={healthData}
      />

      {/* ₹0 Zero-Cost Mode Banner */}
      <DemoBanner healthData={healthData} />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {activeTab === 'studio' && (
          <>
            <Hero onGetStarted={() => { }} />
            <VoiceStudio
              voices={voices}
              selectedLang={selectedLang}
              setSelectedLang={setSelectedLang}
              initialMode={initialMode}
              initialStyle={initialStyle}
            />
            <CreatorShowcase
              onSelectMode={handleSelectModeFromShowcase}
              onSelectStyle={handleSelectStyleFromShowcase}
            />
          </>
        )}

        {activeTab === 'pricing' && (
          <div style={{ paddingTop: '32px' }}>
            <PricingView onOpenStudio={() => {
              setActiveTab('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} />
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

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-content" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.4)'
        }}>
          <div>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>AI VOICE INDIA</span>{' '}
            — Natural AI voices, made for India.
          </div>

          <div className="footer-links" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => { setActiveTab('studio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Voice Studio</button>
            <button onClick={() => { setActiveTab('pricing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Plans &amp; Pricing</button>
            <button onClick={() => { setActiveTab('voices'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Voice Library</button>
            <button onClick={() => { setActiveTab('languages'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Languages</button>
            <button onClick={() => { setActiveTab('how-it-works'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>How it Works</button>
            <button onClick={() => { setActiveTab('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>About</button>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
            Natural Indian Speech · Zero Cost Dev Mode
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Auth gate — shows Login/Register or the full app ─────────────────────
function AppRouter() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  // Loading spinner while we validate stored token
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 138, 0, 0.15)',
            borderTopColor: '#FF8A00',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Loading AI Voice India…
          </div>
        </div>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login'
      ? <Login onSwitchToRegister={() => setAuthView('register')} />
      : <Register onSwitchToLogin={() => setAuthView('login')} />;
  }

  return <AuthenticatedApp />;
}

// ── Root export — wraps everything in AuthProvider ────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

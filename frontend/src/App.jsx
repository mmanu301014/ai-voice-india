import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DemoBanner from './components/DemoBanner';
import Hero from './components/Hero';
import VoiceStudio from './components/VoiceStudio';
import CreatorShowcase from './components/CreatorShowcase';
import VoiceLibrary from './components/VoiceLibrary';
import LanguagesShowcase from './components/LanguagesShowcase';
import HowItWorks from './components/HowItWorks';
import AboutView from './components/AboutView';
import { fetchHealth, fetchVoices } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [healthData, setHealthData] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedLang, setSelectedLang] = useState('en');
  const [initialMode, setInitialMode] = useState('youtube');
  const [initialStyle, setInitialStyle] = useState('Storytelling');

  useEffect(() => {
    // Initial fetch of health and voices
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
            <Hero onGetStarted={() => {}} />
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
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(7, 9, 14, 0.95)',
        padding: '36px 0',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            <span style={{ color: '#F8FAFC', fontWeight: 700 }}>AI VOICE INDIA</span> — Natural AI voices, made for India.
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => { setActiveTab('studio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              Voice Studio
            </button>
            <button 
              onClick={() => { setActiveTab('voices'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              Voice Library
            </button>
            <button 
              onClick={() => { setActiveTab('languages'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              16 Languages
            </button>
            <button 
              onClick={() => { setActiveTab('how-it-works'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              How it Works
            </button>
            <button 
              onClick={() => { setActiveTab('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              About
            </button>
          </div>

          <div style={{ color: '#00D084', fontSize: '0.8rem', fontWeight: 600 }}>
            ₹0 Free Dev Mode • Zero Cards • Indian Regional Speech
          </div>
        </div>
      </footer>
    </div>
  );
}

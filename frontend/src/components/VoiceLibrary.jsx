import React, { useState } from 'react';
import { Volume2, Sparkles, Play, Square, RefreshCw, Info } from 'lucide-react';
import { INDIAN_LANGUAGES } from '../data/languages';
import { useWebSpeechVoices } from '../hooks/useWebSpeechVoices';

export default function VoiceLibrary({ voices = [], onSelectVoice }) {
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedLang, setSelectedLang] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    allRawVoices,
    isSpeaking,
    previewingVoiceId,
    previewVoice,
    stopVoice,
    refreshVoices
  } = useWebSpeechVoices(selectedLang === 'all' ? 'en' : selectedLang);

  // Format all browser voices for library display
  const browserFormattedVoices = allRawVoices.map((v) => {
    const isIndian = v.lang.toLowerCase().includes('-in') || v.lang.toLowerCase().includes('_in');
    return {
      id: `webspeech-${v.name}-${v.lang}`,
      name: v.name,
      rawVoice: v,
      language: v.lang.split('-')[0].toLowerCase(),
      language_name: v.lang,
      region: isIndian ? 'India (Device)' : 'Device Voice',
      gender: v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('heera') ? 'Female' :
              v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('ravi') ? 'Male' : null,
      style: isIndian ? 'Indian Regional Voice' : 'Device System Voice',
      preview_text: 'Hello! Namaste from AI Voice India.',
      is_neural: false,
      is_free: true,
      provider: 'Web Speech API'
    };
  });

  // Combine backend voices and browser voices without duplicate names
  const allCombinedVoices = [
    ...voices,
    ...browserFormattedVoices.filter(bv => !voices.some(v => v.name.toLowerCase() === bv.name.toLowerCase()))
  ];

  const filteredVoices = allCombinedVoices.filter((v) => {
    const matchesGender = selectedGender === 'all' || (v.gender && v.gender.toLowerCase() === selectedGender.toLowerCase());
    const matchesLang = selectedLang === 'all' || v.language === selectedLang || v.language === 'all';
    const matchesSearch = !searchQuery || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (v.language_name && v.language_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.style && v.style.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGender && matchesLang && matchesSearch;
  });

  const handlePreview = (voice, e) => {
    if (e) e.stopPropagation();
    if (isSpeaking && previewingVoiceId === voice.id) {
      stopVoice();
      return;
    }
    const sampleText = voice.preview_text || 'Namaste! Welcome to AI Voice India.';
    previewVoice(voice, sampleText);
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>
          Indian AI Voice Catalog
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Explore authentic neural and device voices crafted specifically for Indian regional languages, dialects, and speaking styles.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{
        padding: '18px 24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            placeholder="Search by voice name, language or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(7, 9, 14, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#F8FAFC',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Gender Filter */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'Male', 'Female'].map((gender) => (
            <button
              key={gender}
              onClick={() => setSelectedGender(gender)}
              className="btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                background: selectedGender === gender ? 'rgba(255, 138, 0, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                borderColor: selectedGender === gender ? 'rgba(255, 138, 0, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                color: selectedGender === gender ? '#FFA333' : 'var(--text-secondary)'
              }}
            >
              {gender === 'all' ? 'All Genders' : gender}
            </button>
          ))}
        </div>

        {/* Language Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(7, 9, 14, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#F8FAFC',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            <option value="all">All Languages ({INDIAN_LANGUAGES.length})</option>
            {INDIAN_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.nativeName})
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Voices */}
        <button
          onClick={refreshVoices}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          title="Refresh real voices from browser/device"
        >
          <RefreshCw size={14} />
          <span>Refresh Voices</span>
        </button>
      </div>

      {/* Voice Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filteredVoices.map((voice) => {
          const isThisSpeaking = isSpeaking && previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              className="glass-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC', marginBottom: '2px' }}>
                      {voice.name}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#00D2FF', fontWeight: 500 }}>
                      {voice.language_name || 'Indian Language'} • {voice.region || 'India'}
                    </div>
                  </div>

                  {voice.gender && (
                    <span className={`badge ${voice.gender === 'Female' ? 'badge-saffron' : 'badge-cyan'}`}>
                      {voice.gender}
                    </span>
                  )}
                </div>

                {/* Style & Tags */}
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '14px'
                }}>
                  Speaking Style: <strong style={{ color: '#F8FAFC' }}>{voice.style || 'Natural Regional'}</strong>
                </div>

                {/* Sample snippet */}
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '18px',
                  borderLeft: '2px solid var(--saffron-primary)'
                }}>
                  "{voice.preview_text || 'Sample speech output'}"
                </div>
              </div>

              {/* Bottom buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => handlePreview(voice, e)}
                  className="btn-secondary"
                  style={{
                    flex: '0 0 auto',
                    background: isThisSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: isThisSpeaking ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                    color: isThisSpeaking ? '#FCA5A5' : 'var(--text-primary)'
                  }}
                >
                  {isThisSpeaking ? <Square size={14} fill="#EF4444" /> : <Play size={14} />}
                  <span>{isThisSpeaking ? 'Stop' : 'Preview'}</span>
                </button>

                <button
                  onClick={() => onSelectVoice(voice)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Sparkles size={15} color="#FFA333" />
                  <span>Use in Studio</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVoices.length === 0 && (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          No voices matched your search filter. Try selecting "All Languages".
        </div>
      )}
    </div>
  );
}

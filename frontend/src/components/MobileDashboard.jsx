import React, { useState, useRef, useEffect } from 'react';
import {
  Globe, Mic, FileText, Copy, Trash2, Check, Download,
  Play, Pause, RefreshCw, AlertCircle, X, Search, User, Menu,
  Home, FileCheck, Crown, Code, Sparkles, Wand2, Clock, Headphones, Settings, LogOut
} from 'lucide-react';
import UpgradeModal from './UpgradeModal';

// Exact Soundwave / Equalizer icon matching reference image for Voice Control
function EqualizerSlidersIcon({ size = 18, color = '#F0F6FC' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 3V21M12 3V21M20 3V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="9" r="2.5" fill={color} />
      <circle cx="12" cy="15" r="2.5" fill={color} />
      <circle cx="20" cy="10" r="2.5" fill={color} />
    </svg>
  );
}

// Waveform heights matching visual distribution in reference screenshot
const MOBILE_WAVE_BARS = [
  25, 45, 65, 80, 50, 70, 95, 60, 40, 60, 85, 75, 55, 35, 65, 80, 95, 70, 50, 65,
  85, 40, 60, 75, 90, 55, 35, 70, 80, 65, 50, 75, 90, 60, 40, 70, 85, 55, 30, 45
];

export default function MobileDashboard({
  user,
  token,
  handleSignOut,
  mobileMenuOpen,
  setMobileMenuOpen,
  activeMenuTab,
  setActiveMenuTab,
  setActiveModal,
  setActiveTab,
  availableLanguages = [],
  currentLangObj,
  selectedLang,
  setSelectedLang,
  combinedVoiceList = [],
  activeVoiceMeta,
  selectedVoiceId,
  setSelectedVoiceId,
  hasSelectedLang,
  setHasSelectedLang,
  hasSelectedVoice,
  setHasSelectedVoice,
  getCleanLangName,
  getCleanVoiceName,
  text,
  setText,
  charCount,
  copiedText,
  handleCopyText,
  handleDeleteText,
  speed,
  setSpeed,
  pitch,
  setPitch,
  volume,
  setVolume,
  handleGenerate,
  isGenerating,
  generationResult,
  errorMessage,
  setErrorMessage,
  handleSaveVoice,
  showUpgradeModal,
  setShowUpgradeModal,
  onOpenUpgrade
}) {
  // Mobile Modal Dropdown States
  const [showLangModal, setShowLangModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [voiceSearch, setVoiceSearch] = useState('');

  // Audio Player State for Mobile
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const audioUrl = generationResult?.audio_url;

  // Sync audio source when generationResult changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
        setDuration(audioRef.current.duration);
      }
    }
  }, [audioUrl]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioUrl) {
      if (text.trim() && !isGenerating) {
        handleGenerate();
      }
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleWaveformClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filtered lists for modals
  const filteredLanguages = availableLanguages.filter((l) => {
    if (!l) return false;
    if (!langSearch.trim()) return true;
    const q = langSearch.toLowerCase().trim();
    return (
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.nativeName && l.nativeName.toLowerCase().includes(q)) ||
      (l.code && l.code.toLowerCase().includes(q))
    );
  });

  const filteredVoices = combinedVoiceList.filter((v) => {
    if (!v) return false;
    if (!voiceSearch.trim()) return true;
    const q = voiceSearch.toLowerCase().trim();
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.gender && v.gender.toLowerCase().includes(q)) ||
      (v.id && String(v.id).toLowerCase().includes(q))
    );
  });

  return (
    <div className="mobile-dashboard-wrapper">
      {/* ── Upgrade Modal ── */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            if (onOpenUpgrade) onOpenUpgrade();
          }}
          remainingChars={user?.characters_remaining ?? 0}
        />
      )}

      {/* ── Hidden Audio Element for Playback ── */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onCanPlayThrough={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {/* ── TOP HEADER ── */}
      <header className="mobile-top-header">
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open Navigation Menu"
        >
          <Menu size={24} color="#FFFFFF" />
        </button>

        <button
          type="button"
          className="mobile-signout-btn"
          onClick={handleSignOut}
          aria-label="Sign out"
        >
          <User size={15} color="#FFFFFF" />
          <span>Sign out</span>
        </button>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="mobile-content-container">

        {/* ── HERO SECTION ── */}
        <section className="mobile-hero-section">
          {/* Peacock Logo with Glowing Blue Aura */}
          <div className="mobile-peacock-wrap">
            <div className="mobile-peacock-glow" />
            <img
              src="/peacock-logo-transparent.png"
              alt="AI Voice India Peacock"
              className="mobile-peacock-img"
            />
          </div>

          <h1 className="mobile-hero-heading">
            <span>Create something </span>
            <span className="mobile-text-blue">new today</span>
          </h1>

          <p className="mobile-hero-subtitle">
            Ask any question, generate voiceover scripts, or choose an example prompt below.
          </p>
        </section>

        {/* ── LANGUAGE & VOICE SELECTORS (2 CARDS IN A ROW) ── */}
        <div className="mobile-selectors-row">
          {/* Language Card */}
          <div className="mobile-card mobile-selector-card">
            <div className="mobile-selector-header">
              <Globe size={16} color="#E2E8F0" />
              <span>Language</span>
            </div>
            <button
              type="button"
              className="mobile-select-trigger"
              onClick={() => {
                setShowLangModal(true);
                setShowVoiceModal(false);
              }}
            >
              <span className="mobile-select-val">
                {hasSelectedLang ? getCleanLangName(currentLangObj) : 'Select language'}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Voice Card */}
          <div className="mobile-card mobile-selector-card">
            <div className="mobile-selector-header">
              <Mic size={16} color="#E2E8F0" />
              <span>Voice</span>
            </div>
            <button
              type="button"
              className="mobile-select-trigger"
              onClick={() => {
                setShowVoiceModal(true);
                setShowLangModal(false);
              }}
            >
              <span className="mobile-select-val">
                {hasSelectedVoice && activeVoiceMeta?.name
                  ? getCleanVoiceName(activeVoiceMeta)
                  : (combinedVoiceList.length === 0 && hasSelectedLang ? 'No voice' : 'Select voice')}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── ENTER YOUR TEXT CARD ── */}
        <div className="mobile-card mobile-text-card">
          <div className="mobile-text-header">
            <div className="mobile-text-title">
              <FileText size={17} color="#E2E8F0" />
              <span>Enter your text</span>
            </div>
            <div className="mobile-text-actions">
              <button
                type="button"
                className="mobile-tc-btn"
                onClick={handleCopyText}
                title="Copy text"
              >
                {copiedText ? <Check size={14} color="#38BDF8" /> : <Copy size={14} color="#CBD5E1" />}
                <span>{copiedText ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                className="mobile-tc-btn"
                onClick={handleDeleteText}
                title="Delete text"
              >
                <Trash2 size={14} color="#CBD5E1" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="mobile-textarea-wrap">
            <textarea
              className="mobile-textarea"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder="Type or paste your text here..."
              maxLength={1000}
              id="mobile-input-textarea"
            />
          </div>

          <div className="mobile-counter-row">
            <span>{charCount}/1000</span>
          </div>
        </div>

        {/* Error Notification if any */}
        {errorMessage && (
          <div className="mobile-error-banner">
            <AlertCircle size={16} color="#F87171" style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '0.82rem', color: '#F87171' }}>{errorMessage}</span>
            <X
              size={14}
              color="#F87171"
              style={{ cursor: 'pointer', flexShrink: 0 }}
              onClick={() => setErrorMessage('')}
            />
          </div>
        )}

        {/* ── VOICE CONTROL CARD ── */}
        <div className="mobile-card mobile-voice-control-card">
          <div className="mobile-vc-title">
            <EqualizerSlidersIcon size={18} color="#F0F6FC" />
            <span>Voice control</span>
          </div>

          {/* Speed Slider */}
          <div className="mobile-slider-block">
            <div className="mobile-slider-top-row">
              <span>Speed</span>
              <span className="mobile-slider-val">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="mobile-range-slider"
              style={{
                background: `linear-gradient(to right, #007AFF 0%, #007AFF ${((speed - 0.5) / 1.5) * 100}%, #1E293B ${((speed - 0.5) / 1.5) * 100}%, #1E293B 100%)`
              }}
              aria-label="Speed"
            />
            <div className="mobile-slider-bottom-row">
              <span>0.5x</span>
            </div>
          </div>

          {/* Pitch Slider */}
          <div className="mobile-slider-block">
            <div className="mobile-slider-top-row">
              <span>Pitch</span>
              <span className="mobile-slider-val">{pitch.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="mobile-range-slider"
              style={{
                background: `linear-gradient(to right, #007AFF 0%, #007AFF ${((pitch - 0.5) / 1.5) * 100}%, #1E293B ${((pitch - 0.5) / 1.5) * 100}%, #1E293B 100%)`
              }}
              aria-label="Pitch"
            />
            <div className="mobile-slider-bottom-row">
              <span>0.5x</span>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="mobile-slider-block">
            <div className="mobile-slider-top-row">
              <span>Volume</span>
              <span className="mobile-slider-val">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="mobile-range-slider"
              style={{
                background: `linear-gradient(to right, #007AFF 0%, #007AFF ${volume}%, #1E293B ${volume}%, #1E293B 100%)`
              }}
              aria-label="Volume"
            />
            <div className="mobile-slider-bottom-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Generate Voice Button */}
          <button
            type="button"
            className="mobile-generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            id="mobile-btn-generate-voice"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="spin-animation" color="#FFFFFF" />
                <span>Generating Voice...</span>
              </>
            ) : (
              <>
                <Mic size={18} color="#FFFFFF" />
                <span>Generate Voice</span>
              </>
            )}
          </button>
        </div>

        {/* ── GENERATED VOICE CARD ── */}
        <div className="mobile-card mobile-audio-card">
          <div className="mobile-audio-top">
            <button
              type="button"
              className="mobile-play-circle-btn"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause generated audio' : 'Play generated audio'}
              disabled={isGenerating}
            >
              {isPlaying ? (
                <Pause size={14} fill="#FFFFFF" color="#FFFFFF" />
              ) : (
                <Play size={14} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: '2px' }} />
              )}
            </button>
            <span className="mobile-audio-label">Generated Voice</span>
          </div>

          {/* Waveform Bars Scrubber */}
          <div
            className="mobile-waveform-area"
            onClick={handleWaveformClick}
            title={audioUrl ? 'Scrub audio' : 'Generate voice to play'}
          >
            {MOBILE_WAVE_BARS.map((heightPercent, index) => {
              const barRatio = index / MOBILE_WAVE_BARS.length;
              const currentRatio = duration > 0 ? currentTime / duration : 0;
              const isPlayed = audioUrl && barRatio <= currentRatio;
              return (
                <div
                  key={index}
                  className={`mobile-wave-bar ${isPlayed ? 'played' : ''}`}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>

          {/* Bottom row: Time on left, Download MP3 on right */}
          <div className="mobile-audio-bottom">
            <span className="mobile-audio-time-text">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
              type="button"
              className="mobile-download-btn"
              onClick={handleSaveVoice}
              disabled={!audioUrl}
              style={{ opacity: audioUrl ? 1 : 0.6 }}
              title={audioUrl ? 'Download MP3' : 'Generate voice first to download'}
            >
              <Download size={13} color="#FFFFFF" />
              <span>Download MP3</span>
            </button>
          </div>
        </div>

      </main>

      {/* ── LANGUAGE SELECTION MODAL (BOTTOM SHEET / POPUP) ── */}
      {showLangModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowLangModal(false)}>
          <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <span className="mobile-modal-title">Select Language</span>
              <button
                type="button"
                className="mobile-modal-close"
                onClick={() => setShowLangModal(false)}
              >
                <X size={18} color="#8B949E" />
              </button>
            </div>

            <div className="mobile-modal-search">
              <Search size={15} color="#8B949E" />
              <input
                type="text"
                placeholder="Search language (e.g. Hindi, English)..."
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mobile-modal-list">
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLang === lang.code && hasSelectedLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    className={`mobile-modal-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (setSelectedLang) setSelectedLang(lang.code);
                      setHasSelectedLang(true);
                      setHasSelectedVoice(false);
                      setSelectedVoiceId('');
                      setShowLangModal(false);
                    }}
                  >
                    <span>{getCleanLangName(lang)}</span>
                    {isSelected && <Check size={16} color="#38BDF8" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── VOICE SELECTION MODAL (BOTTOM SHEET / POPUP) ── */}
      {showVoiceModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowVoiceModal(false)}>
          <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <span className="mobile-modal-title">Select Voice</span>
              <button
                type="button"
                className="mobile-modal-close"
                onClick={() => setShowVoiceModal(false)}
              >
                <X size={18} color="#8B949E" />
              </button>
            </div>

            <div className="mobile-modal-search">
              <Search size={15} color="#8B949E" />
              <input
                type="text"
                placeholder="Search voice name or gender..."
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="mobile-modal-list">
              {filteredVoices.length > 0 ? (
                filteredVoices.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id && hasSelectedVoice;
                  return (
                    <button
                      key={voice.id || voice.name}
                      type="button"
                      className={`mobile-modal-item ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedVoiceId(voice.id || '');
                        setHasSelectedVoice(true);
                        setShowVoiceModal(false);
                      }}
                    >
                      <span>{getCleanVoiceName(voice)}</span>
                      {isSelected && <Check size={16} color="#38BDF8" />}
                    </button>
                  );
                })
              ) : (
                <div style={{ padding: '24px 14px', fontSize: '0.85rem', color: '#8B949E', textAlign: 'center' }}>
                  {voiceSearch
                    ? `No voices matching "${voiceSearch}"`
                    : `Native ${currentLangObj?.name || 'this language'} AI voice is currently under development.`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE NAVIGATION DRAWER ── */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  AI VOICE INDIA
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} color="#CBD5E1" />
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              <button
                type="button"
                className={`mobile-drawer-btn ${activeMenuTab === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenuTab('home');
                  setActiveModal(null);
                  setMobileMenuOpen(false);
                }}
              >
                <Home size={18} />
                <span>Home</span>
              </button>

              <button
                type="button"
                className={`mobile-drawer-btn ${activeMenuTab === 'pdf' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenuTab('pdf');
                  setActiveModal(null);
                  setMobileMenuOpen(false);
                }}
              >
                <FileCheck size={18} />
                <span>PDF to Voice</span>
              </button>

              <button
                type="button"
                className="mobile-drawer-btn"
                onClick={() => {
                  if (setActiveTab) setActiveTab('pricing');
                  else setActiveModal('pricing');
                  setMobileMenuOpen(false);
                }}
              >
                <Crown size={18} />
                <span>Upgrade</span>
              </button>

              <button
                type="button"
                className="mobile-drawer-btn"
                onClick={() => {
                  setActiveModal('api');
                  setMobileMenuOpen(false);
                }}
              >
                <Code size={18} />
                <span>API Access</span>
              </button>

              <div style={{ height: '1px', background: '#1E293B', margin: '8px 0' }} />

              <span style={{ fontSize: '0.72rem', color: '#64748B', paddingLeft: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI Tools
              </span>

              <button
                type="button"
                className={`mobile-drawer-btn ${activeMenuTab === 'ai-assistant' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenuTab('ai-assistant');
                  setActiveModal(null);
                  setMobileMenuOpen(false);
                }}
              >
                <Sparkles size={18} />
                <span>AI Assistant</span>
              </button>

              <button
                type="button"
                className={`mobile-drawer-btn ${activeMenuTab === 'voice-effects' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenuTab('voice-effects');
                  setActiveModal(null);
                  setMobileMenuOpen(false);
                }}
              >
                <Wand2 size={18} />
                <span>Voice Effects</span>
              </button>

              <div style={{ height: '1px', background: '#1E293B', margin: '8px 0' }} />

              <button
                type="button"
                className="mobile-drawer-btn"
                onClick={() => {
                  setActiveModal('creations');
                  setMobileMenuOpen(false);
                }}
              >
                <Clock size={18} />
                <span>History</span>
              </button>

              <button
                type="button"
                className={`mobile-drawer-btn ${activeMenuTab === 'help' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenuTab('help');
                  setActiveModal(null);
                  setMobileMenuOpen(false);
                }}
              >
                <Headphones size={18} />
                <span>Help & Support</span>
              </button>

              <button
                type="button"
                className={`mobile-drawer-btn ${activeMenuTab === 'settings' ? 'active' : ''}`}
                onClick={() => {
                  setActiveMenuTab('settings');
                  setActiveModal(null);
                  setMobileMenuOpen(false);
                }}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>

              <div style={{ height: '1px', background: '#1E293B', margin: '14px 0 8px 0' }} />

              <button
                type="button"
                className="mobile-drawer-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                style={{ color: '#F87171' }}
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

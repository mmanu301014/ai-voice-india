import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Globe, Mic, FileText, Copy, Trash2, Check, Download,
  Play, Pause, RefreshCw, AlertCircle, X, Search, User, Menu,
  Home, FileCheck, Crown, Code, Sparkles, Wand2, Clock, Headphones, Settings, LogOut,
  ChevronDown
} from 'lucide-react';
import UpgradeModal from './UpgradeModal';

// ── Equalizer Sliders Icon ───────────────────────────────────────────────────
function EqualizerSlidersIcon({ size = 18, color = '#C9D1D9' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 3V21M12 3V21M20 3V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="9" r="2.5" fill={color} />
      <circle cx="12" cy="15" r="2.5" fill={color} />
      <circle cx="20" cy="10" r="2.5" fill={color} />
    </svg>
  );
}

// ── Soundwave Logo Icon ──────────────────────────────────────────────────────
function SoundwaveIcon({ size = 20, color = '#2F81F7' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="11" width="3.8" height="10" rx="1.9" fill={color} />
      <rect x="8" y="7" width="3.8" height="18" rx="1.9" fill={color} />
      <rect x="14" y="3" width="3.8" height="26" rx="1.9" fill={color} />
      <rect x="20" y="7" width="3.8" height="18" rx="1.9" fill={color} />
      <rect x="26" y="11" width="3.8" height="10" rx="1.9" fill={color} />
    </svg>
  );
}

// ── Waveform heights ─────────────────────────────────────────────────────────
const MOBILE_WAVE_BARS = [
  22, 42, 65, 80, 50, 72, 95, 60, 38, 58, 85, 75, 52, 33, 65, 80, 95, 70, 48, 62,
  85, 38, 58, 75, 90, 52, 33, 70, 80, 62, 48, 72, 90, 58, 38, 68, 85, 52, 28, 42
];

// ── Slider fill style helper ─────────────────────────────────────────────────
function sliderFill(value, min, max) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return {
    background: `linear-gradient(to right, #2F81F7 0%, #2F81F7 ${pct}%, #21262d ${pct}%, #21262d 100%)`
  };
}

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
  // ── Modal / Search States ──────────────────────────────────────────────────
  const [showLangModal, setShowLangModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [voiceSearch, setVoiceSearch] = useState('');

  // ── Audio Player State ─────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef(null);

  const audioUrl = generationResult?.audio_url;

  // Reset player state when audio URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioReady(false);
  }, [audioUrl]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [volume]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (!isNaN(d) && isFinite(d) && d > 0) {
        setDuration(d);
        setAudioReady(true);
      }
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      const d = audioRef.current.duration;
      if (!isNaN(d) && isFinite(d) && d > 0) {
        setDuration(d);
        if (!audioReady) setAudioReady(true);
      }
    }
  }, [audioReady]);

  const togglePlay = () => {
    if (!audioUrl) {
      if (text.trim() && !isGenerating && hasSelectedLang && hasSelectedVoice) {
        handleGenerate();
      }
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('[AudioPlayer] Play failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleWaveformClick = (e) => {
    if (!audioRef.current || !duration || !audioReady) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    try {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = generationResult?.filename || 'ai-voice-india.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('[Download] Failed:', err);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ── Filtered lists for modals ──────────────────────────────────────────────
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

  // ── Derived display values ─────────────────────────────────────────────────
  const selectedLangName = hasSelectedLang && currentLangObj
    ? getCleanLangName(currentLangObj)
    : 'Select language';

  const selectedVoiceName = hasSelectedVoice && activeVoiceMeta?.name
    ? getCleanVoiceName(activeVoiceMeta)
    : (combinedVoiceList.length === 0 && hasSelectedLang ? 'No voices' : 'Select voice');

  const charLimit = 1000;
  const safeCharCount = typeof charCount === 'number' ? charCount : (text ? text.length : 0);
  const charNearLimit = safeCharCount > charLimit * 0.85;
  const charAtLimit = safeCharCount >= charLimit;
  const currentRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="mob-wrapper">
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

      {/* ── Hidden Audio Element ── */}
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
            if (audioRef.current) audioRef.current.currentTime = 0;
          }}
          onError={() => { setIsPlaying(false); setAudioReady(false); }}
        />
      )}

      {/* ═══ TOP HEADER ══════════════════════════════════════════════ */}
      <header className="mob-header">
        <button
          type="button"
          className="mob-icon-btn"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={20} color="#C9D1D9" />
        </button>

        <div className="mob-header-brand">
          <SoundwaveIcon size={17} color="#2F81F7" />
          <span className="mob-header-brand-text">AI VOICE INDIA</span>
        </div>

        <button
          type="button"
          className="mob-signout-btn"
          onClick={handleSignOut}
          aria-label="Sign out"
        >
          <User size={13} color="#C9D1D9" />
          <span>Sign out</span>
        </button>
      </header>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════════ */}
      <main className="mob-content">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="mob-hero">
          <div className="mob-peacock-wrap">
            <div className="mob-peacock-glow" />
            <img
              src="/peacock-logo-transparent.png"
              alt="AI Voice India"
              className="mob-peacock-img"
            />
          </div>
          <div className="mob-hero-text">
            <h1 className="mob-hero-heading">
              Create something <span className="mob-accent-blue">new today</span>
            </h1>
            <p className="mob-hero-subtitle">
              Generate premium AI voiceovers in Indian languages.
            </p>
          </div>
        </section>

        {/* ── SELECTORS ROW ─────────────────────────────────────────── */}
        <div className="mob-selectors-row">
          {/* Language */}
          <div className="mob-card mob-selector-card">
            <div className="mob-selector-label">
              <Globe size={13} color="#8B949E" />
              <span>Language</span>
            </div>
            <button
              type="button"
              className="mob-select-btn"
              onClick={() => { setShowLangModal(true); setShowVoiceModal(false); }}
              aria-haspopup="listbox"
            >
              <span className="mob-select-val" title={selectedLangName}>{selectedLangName}</span>
              <ChevronDown size={13} color="#64748B" strokeWidth={2.5} />
            </button>
          </div>

          {/* Voice */}
          <div className="mob-card mob-selector-card">
            <div className="mob-selector-label">
              <Mic size={13} color="#8B949E" />
              <span>Voice</span>
            </div>
            <button
              type="button"
              className="mob-select-btn"
              onClick={() => { setShowVoiceModal(true); setShowLangModal(false); }}
              disabled={!hasSelectedLang}
              aria-haspopup="listbox"
              title={!hasSelectedLang ? 'Select a language first' : selectedVoiceName}
            >
              <span className="mob-select-val">{selectedVoiceName}</span>
              <ChevronDown size={13} color="#64748B" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── TEXT INPUT CARD ───────────────────────────────────────── */}
        <div className="mob-card mob-text-card">
          <div className="mob-text-card-header">
            <div className="mob-card-title">
              <FileText size={15} color="#8B949E" />
              <span>Your text</span>
            </div>
            <div className="mob-text-actions">
              <button
                type="button"
                className="mob-action-btn"
                onClick={handleCopyText}
                disabled={!text}
                aria-label="Copy text to clipboard"
              >
                {copiedText
                  ? <><Check size={12} color="#38BDF8" /><span>Copied</span></>
                  : <><Copy size={12} color="#C9D1D9" /><span>Copy</span></>
                }
              </button>
              <button
                type="button"
                className="mob-action-btn mob-action-btn--danger"
                onClick={handleDeleteText}
                disabled={!text}
                aria-label="Clear all text"
              >
                <Trash2 size={12} color="#F87171" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="mob-textarea-wrap">
            <textarea
              id="mob-text-input"
              className="mob-textarea"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, charLimit))}
              placeholder="Type or paste your text here to generate speech…"
              maxLength={charLimit}
              rows={5}
              aria-label="Text to convert to speech"
            />
          </div>

          <div className="mob-char-row">
            <span className={`mob-char-count${charAtLimit ? ' at-limit' : charNearLimit ? ' near-limit' : ''}`}>
              {safeCharCount}/{charLimit}
            </span>
          </div>
        </div>

        {/* ── ERROR BANNER ─────────────────────────────────────────── */}
        {errorMessage && (
          <div className="mob-error-banner" role="alert">
            <AlertCircle size={14} color="#F87171" style={{ flexShrink: 0 }} />
            <span className="mob-error-text">{errorMessage}</span>
            <button
              type="button"
              className="mob-error-close"
              onClick={() => setErrorMessage('')}
              aria-label="Dismiss error"
            >
              <X size={13} color="#F87171" />
            </button>
          </div>
        )}

        {/* ── VOICE CONTROLS CARD ──────────────────────────────────── */}
        <div className="mob-card mob-controls-card">
          <div className="mob-card-title mob-controls-title">
            <EqualizerSlidersIcon size={16} color="#C9D1D9" />
            <span>Voice Controls</span>
          </div>

          {/* Speed */}
          <div className="mob-slider-block">
            <div className="mob-slider-header">
              <span className="mob-slider-label">Speed</span>
              <span className="mob-slider-val">{speed.toFixed(1)}×</span>
            </div>
            <input
              type="range" min="0.5" max="2.0" step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="mob-slider"
              style={sliderFill(speed, 0.5, 2.0)}
              aria-label="Speech speed"
              aria-valuemin={0.5} aria-valuemax={2.0} aria-valuenow={speed}
            />
            <div className="mob-slider-range"><span>0.5×</span><span>2.0×</span></div>
          </div>

          {/* Pitch */}
          <div className="mob-slider-block">
            <div className="mob-slider-header">
              <span className="mob-slider-label">Pitch</span>
              <span className="mob-slider-val">{pitch.toFixed(1)}×</span>
            </div>
            <input
              type="range" min="0.5" max="2.0" step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="mob-slider"
              style={sliderFill(pitch, 0.5, 2.0)}
              aria-label="Speech pitch"
              aria-valuemin={0.5} aria-valuemax={2.0} aria-valuenow={pitch}
            />
            <div className="mob-slider-range"><span>0.5×</span><span>2.0×</span></div>
          </div>

          {/* Volume */}
          <div className="mob-slider-block">
            <div className="mob-slider-header">
              <span className="mob-slider-label">Volume</span>
              <span className="mob-slider-val">{volume}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="1"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="mob-slider"
              style={sliderFill(volume, 0, 100)}
              aria-label="Playback volume"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={volume}
            />
            <div className="mob-slider-range"><span>0%</span><span>100%</span></div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            id="mob-btn-generate"
            className="mob-generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <><RefreshCw size={17} className="spin-animation" color="#FFFFFF" /><span>Generating…</span></>
            ) : (
              <><Mic size={17} color="#FFFFFF" /><span>Generate Voice</span></>
            )}
          </button>
        </div>

        {/* ── GENERATED AUDIO CARD ─────────────────────────────────── */}
        <div className="mob-card mob-audio-card">
          <div className="mob-audio-header">
            <button
              type="button"
              className={`mob-play-btn${isPlaying ? ' playing' : ''}`}
              onClick={togglePlay}
              disabled={isGenerating}
              aria-label={isPlaying ? 'Pause audio' : (audioUrl ? 'Play audio' : 'Generate voice first')}
            >
              {isPlaying
                ? <Pause size={16} fill="#FFFFFF" color="#FFFFFF" />
                : <Play size={16} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: '2px' }} />
              }
            </button>
            <div className="mob-audio-meta">
              <span className="mob-audio-title">Generated Voice</span>
              {audioUrl && audioReady && <span className="mob-audio-status mob-audio-status--ready">Ready</span>}
              {audioUrl && !audioReady && <span className="mob-audio-status">Loading…</span>}
              {!audioUrl && <span className="mob-audio-status">Generate to play</span>}
            </div>
          </div>

          {/* Waveform Scrubber */}
          <div
            className={`mob-waveform${!audioUrl ? ' mob-waveform--empty' : ''}`}
            onClick={handleWaveformClick}
            role="slider"
            aria-label="Audio position"
            aria-valuenow={Math.round(currentRatio * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={audioUrl ? 0 : -1}
          >
            {MOBILE_WAVE_BARS.map((h, i) => {
              const isPlayed = !!audioUrl && (i / MOBILE_WAVE_BARS.length) <= currentRatio;
              return (
                <div
                  key={i}
                  className={`mob-wave-bar${isPlayed ? ' played' : ''}`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>

          {/* Time + Download */}
          <div className="mob-audio-footer">
            <span className="mob-time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              type="button"
              className="mob-download-btn"
              onClick={handleDownloadAudio}
              disabled={!audioUrl || !audioReady}
              aria-label="Download MP3"
              title={audioUrl ? 'Download MP3' : 'Generate voice first'}
            >
              <Download size={13} color="#FFFFFF" />
              <span>Download MP3</span>
            </button>
          </div>
        </div>

      </main>

      {/* ═══ LANGUAGE MODAL ═══════════════════════════════════════════════════ */}
      {showLangModal && (
        <div
          className="mob-modal-overlay"
          onClick={() => { setShowLangModal(false); setLangSearch(''); }}
          aria-modal="true" role="dialog"
        >
          <div className="mob-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mob-modal-handle" />
            <div className="mob-modal-header">
              <span className="mob-modal-title">Select Language</span>
              <button
                type="button"
                className="mob-modal-close-btn"
                onClick={() => { setShowLangModal(false); setLangSearch(''); }}
                aria-label="Close"
              >
                <X size={18} color="#8B949E" />
              </button>
            </div>

            <div className="mob-modal-search">
              <Search size={14} color="#8B949E" />
              <input
                type="text"
                placeholder="Search languages…"
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                autoFocus
              />
              {langSearch && (
                <button type="button" className="mob-search-clear" onClick={() => setLangSearch('')} aria-label="Clear">
                  <X size={12} color="#8B949E" />
                </button>
              )}
            </div>

            <div className="mob-modal-list" role="listbox">
              {filteredLanguages.length > 0 ? filteredLanguages.map((lang) => {
                const isSelected = selectedLang === lang.code && hasSelectedLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`mob-modal-item${isSelected ? ' active' : ''}`}
                    onClick={() => {
                      if (setSelectedLang) setSelectedLang(lang.code);
                      setHasSelectedLang(true);
                      setHasSelectedVoice(false);
                      setSelectedVoiceId('');
                      setShowLangModal(false);
                      setLangSearch('');
                    }}
                  >
                    <span className="mob-modal-item-main">
                      <span className="mob-modal-item-name">{getCleanLangName(lang)}</span>
                      {lang.nativeName && <span className="mob-modal-item-native">{lang.nativeName}</span>}
                    </span>
                    {isSelected && <Check size={15} color="#2F81F7" style={{ flexShrink: 0 }} />}
                  </button>
                );
              }) : (
                <div className="mob-modal-empty">No languages matching &quot;{langSearch}&quot;</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ VOICE MODAL ══════════════════════════════════════════════════════ */}
      {showVoiceModal && (
        <div
          className="mob-modal-overlay"
          onClick={() => { setShowVoiceModal(false); setVoiceSearch(''); }}
          aria-modal="true" role="dialog"
        >
          <div className="mob-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mob-modal-handle" />
            <div className="mob-modal-header">
              <span className="mob-modal-title">Select Voice</span>
              <button
                type="button"
                className="mob-modal-close-btn"
                onClick={() => { setShowVoiceModal(false); setVoiceSearch(''); }}
                aria-label="Close"
              >
                <X size={18} color="#8B949E" />
              </button>
            </div>

            <div className="mob-modal-search">
              <Search size={14} color="#8B949E" />
              <input
                type="text"
                placeholder="Search voice or gender…"
                value={voiceSearch}
                onChange={(e) => setVoiceSearch(e.target.value)}
                autoFocus
              />
              {voiceSearch && (
                <button type="button" className="mob-search-clear" onClick={() => setVoiceSearch('')} aria-label="Clear">
                  <X size={12} color="#8B949E" />
                </button>
              )}
            </div>

            <div className="mob-modal-list" role="listbox">
              {filteredVoices.length > 0 ? filteredVoices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id && hasSelectedVoice;
                return (
                  <button
                    key={voice.id || voice.name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`mob-modal-item${isSelected ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedVoiceId(voice.id || '');
                      setHasSelectedVoice(true);
                      setShowVoiceModal(false);
                      setVoiceSearch('');
                    }}
                  >
                    <span className="mob-modal-item-main">
                      <span className="mob-modal-item-name">{getCleanVoiceName(voice)}</span>
                      {voice.gender && (
                        <span className={`mob-voice-badge${voice.gender === 'Female' ? ' female' : ' male'}`}>
                          {voice.gender}
                        </span>
                      )}
                    </span>
                    {isSelected && <Check size={15} color="#2F81F7" style={{ flexShrink: 0 }} />}
                  </button>
                );
              }) : (
                <div className="mob-modal-empty">
                  {voiceSearch
                    ? `No voices matching "${voiceSearch}"`
                    : `Native ${currentLangObj?.name || 'this language'} AI voice is under development.`
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ NAVIGATION DRAWER ════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          className="mob-drawer-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-modal="true" role="dialog"
        >
          <div className="mob-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="mob-drawer-header">
              <div className="mob-drawer-brand">
                <SoundwaveIcon size={20} color="#2F81F7" />
                <span className="mob-drawer-brand-text">AI VOICE INDIA</span>
              </div>
              <button
                type="button"
                className="mob-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} color="#8B949E" />
              </button>
            </div>

            {/* User info strip */}
            {user && (
              <div className="mob-drawer-user">
                <div className="mob-drawer-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={14} color="#8B949E" />}
                </div>
                <div className="mob-drawer-user-info">
                  <span className="mob-drawer-user-name">
                    {user.name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="mob-drawer-user-credits">
                    {typeof user.characters_remaining === 'number'
                      ? `${user.characters_remaining.toLocaleString()} chars left`
                      : 'Credits loading…'
                    }
                  </span>
                </div>
              </div>
            )}

            <div className="mob-drawer-divider" />

            <nav className="mob-drawer-nav" aria-label="Main navigation">
              {[
                { id: 'home', label: 'Home', Icon: Home },
                { id: 'pdf', label: 'PDF to Voice', Icon: FileCheck },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`mob-drawer-btn${activeMenuTab === id ? ' active' : ''}`}
                  onClick={() => { setActiveMenuTab(id); setActiveModal(null); setMobileMenuOpen(false); }}
                >
                  <Icon size={17} /><span>{label}</span>
                </button>
              ))}

              <button
                type="button"
                className="mob-drawer-btn"
                onClick={() => {
                  if (setActiveTab) setActiveTab('pricing');
                  else setActiveModal('pricing');
                  setMobileMenuOpen(false);
                }}
              >
                <Crown size={17} /><span>Upgrade Plan</span>
              </button>

              <button
                type="button"
                className="mob-drawer-btn"
                onClick={() => { setActiveModal('api'); setMobileMenuOpen(false); }}
              >
                <Code size={17} /><span>API Access</span>
              </button>

              <div className="mob-drawer-divider" />
              <span className="mob-drawer-section-label">AI Tools</span>

              {[
                { id: 'ai-assistant', label: 'AI Assistant', Icon: Sparkles },
                { id: 'voice-effects', label: 'Voice Effects', Icon: Wand2 },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`mob-drawer-btn${activeMenuTab === id ? ' active' : ''}`}
                  onClick={() => { setActiveMenuTab(id); setActiveModal(null); setMobileMenuOpen(false); }}
                >
                  <Icon size={17} /><span>{label}</span>
                </button>
              ))}

              <div className="mob-drawer-divider" />

              <button
                type="button"
                className="mob-drawer-btn"
                onClick={() => { setActiveModal('creations'); setMobileMenuOpen(false); }}
              >
                <Clock size={17} /><span>History</span>
              </button>

              {[
                { id: 'help', label: 'Help & Support', Icon: Headphones },
                { id: 'settings', label: 'Settings', Icon: Settings },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`mob-drawer-btn${activeMenuTab === id ? ' active' : ''}`}
                  onClick={() => { setActiveMenuTab(id); setActiveModal(null); setMobileMenuOpen(false); }}
                >
                  <Icon size={17} /><span>{label}</span>
                </button>
              ))}

              <div className="mob-drawer-divider" />

              <button
                type="button"
                className="mob-drawer-btn mob-drawer-btn--signout"
                onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
              >
                <LogOut size={17} /><span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

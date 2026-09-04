import React, { useState, useEffect } from 'react';
import {
  Mic, Sparkles, Volume2, Settings2, Play, Square, RefreshCw,
  Trash2, Copy, Check, Sliders, Globe, Layers, AlertCircle, Info,
  Video, Smartphone, BookOpen, GraduationCap, Radio, Megaphone, RotateCcw,
  Search, Zap, Download, X, Edit3, ChevronRight, VolumeX
} from 'lucide-react';
import { INDIAN_LANGUAGES } from '../data/languages';
import { CREATOR_MODES, VOICE_STYLES } from '../data/creatorModes';
import { generateSpeech, normalizeText } from '../services/api';
import { useWebSpeechVoices } from '../hooks/useWebSpeechVoices';
import { useAuth } from '../context/AuthContext';
import AudioPlayer from './AudioPlayer';
import UpgradeModal from './UpgradeModal';

export default function VoiceStudio({
  voices = [],
  selectedLang,
  setSelectedLang,
  initialMode = null,
  initialStyle = null,
  onOpenUpgrade = null,
  openLangModal = false,
  setOpenLangModal = null,
  openVoiceModal = false,
  setOpenVoiceModal = null
}) {
  const { user, token, updateUser } = useAuth();

  // Hook for real device/browser Web Speech API voices
  const {
    allRawVoices,
    availableVoicesForLang: browserVoices,
    isSpeaking,
    previewingVoiceId,
    previewVoice,
    stopVoice,
    refreshVoices,
    isSupported: isWebSpeechSupported
  } = useWebSpeechVoices(selectedLang);

  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [selectedMode, setSelectedMode] = useState(initialMode || 'youtube');
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0.0);
  const [style, setStyle] = useState(initialStyle || 'Storytelling');
  const [enableNormalization, setEnableNormalization] = useState(true);
  const [searchLangQuery, setSearchLangQuery] = useState('');
  const [showMobileLangModal, setShowMobileLangModal] = useState(false);
  const [showMobileVoiceModal, setShowMobileVoiceModal] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Sync external modal triggers if passed
  useEffect(() => {
    if (openLangModal) {
      setShowMobileLangModal(true);
      if (setOpenLangModal) setOpenLangModal(false);
    }
  }, [openLangModal, setOpenLangModal]);

  useEffect(() => {
    if (openVoiceModal) {
      setShowMobileVoiceModal(true);
      if (setOpenVoiceModal) setOpenVoiceModal(false);
    }
  }, [openVoiceModal, setOpenVoiceModal]);

  // Plan & character allowance calculations — updated to 5,000 chars everywhere
  const rawPlan = (user?.plan || 'basic').toLowerCase();
  const planId = rawPlan === 'free' ? 'basic' : rawPlan;
  const isBasicPlan = planId === 'basic';
  const isFreePlan = isBasicPlan;
  const charactersUsed = user?.characters_used ?? 0;
  const characterLimit = user?.character_limit ?? 5000;
  const charactersRemaining = user?.characters_remaining ?? Math.max(0, characterLimit - charactersUsed);
  const charCount = text.length;
  const isOverLimit = charCount > characterLimit;
  const isZeroRemaining = charactersRemaining <= 0;

  // Current language object
  const currentLangObj = INDIAN_LANGUAGES.find(l => l.code === selectedLang) || INDIAN_LANGUAGES[0];

  // Filtered languages for navigation
  const filteredLanguages = INDIAN_LANGUAGES.filter(lang => {
    if (!searchLangQuery.trim()) return true;
    const q = searchLangQuery.toLowerCase().trim();
    return (
      lang.name.toLowerCase().includes(q) ||
      (lang.nativeName && lang.nativeName.toLowerCase().includes(q)) ||
      (lang.code && lang.code.toLowerCase().includes(q)) ||
      (lang.bcp47 && lang.bcp47.toLowerCase().includes(q)) ||
      (lang.region && lang.region.toLowerCase().includes(q))
    );
  });

  // Current mode object
  const currentModeObj = CREATOR_MODES.find(m => m.id === selectedMode) || CREATOR_MODES[0];

  // Backend neural voices for current language
  const backendVoicesForLang = voices.filter(v => v.language === selectedLang || v.language === 'all');

  // Combined real available voice pool
  const combinedVoiceList = [
    ...browserVoices,
    ...backendVoicesForLang.filter(bv => !browserVoices.some(wv => wv.name.toLowerCase() === bv.name.toLowerCase()))
  ];

  // Sync selected voice when language or voice list changes
  useEffect(() => {
    if (combinedVoiceList.length > 0) {
      const exists = combinedVoiceList.some(v => v.id === selectedVoiceId);
      if (!exists) {
        setSelectedVoiceId(combinedVoiceList[0].id);
      }
    } else {
      setSelectedVoiceId('');
    }
  }, [selectedLang, browserVoices, voices]);

  // Sync initial mode/style props if updated externally
  useEffect(() => {
    if (initialMode) handleSelectMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialStyle) setStyle(initialStyle);
  }, [initialStyle]);

  const activeVoiceMeta = combinedVoiceList.find(v => v.id === selectedVoiceId) || combinedVoiceList[0];

  // Mode Selection Handler
  const handleSelectMode = (modeId) => {
    setSelectedMode(modeId);
    const m = CREATOR_MODES.find(item => item.id === modeId);
    if (m) {
      setStyle(m.suggestedStyle);
      setSpeed(m.suggestedSpeed);
      setPitch(m.suggestedPitch || 0.0);
    }
  };

  // Reset Settings to Defaults
  const handleResetSettings = () => {
    setSpeed(currentLangObj?.defaultSpeed || 1.0);
    setPitch(currentLangObj?.defaultPitch || 0.0);
    setStyle('Natural');
    setSelectedMode('youtube');
    setEnableNormalization(true);
  };

  const handlePreview = (voiceToPreview, e) => {
    if (e) e.stopPropagation();

    // If already previewing this voice, stop it
    if (isSpeaking && previewingVoiceId === voiceToPreview.id) {
      stopVoice();
      return;
    }

    const previewSnippet = text && text.trim() ? text.trim().slice(0, 140) : (currentLangObj?.sample || 'Namaste, welcome to AI Voice India');
    previewVoice(voiceToPreview, previewSnippet, speed, pitch);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter some text to generate speech.');
      return;
    }

    // Client-side guard for 5000 char maximum
    if (charCount > 5000) {
      setErrorMessage(`Text length (${charCount} characters) exceeds the maximum allowed limit of 5,000 characters.`);
      return;
    }

    // Client-side guard for users exceeding remaining allowance
    if (isZeroRemaining && user) {
      setShowUpgradeModal(true);
      setErrorMessage(`Your ${characterLimit} characters have been used. Please upgrade or refill to continue.`);
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const result = await generateSpeech({
        text: text.trim(),
        language: selectedLang,
        voiceId: selectedVoiceId || (activeVoiceMeta ? activeVoiceMeta.id : ''),
        speed,
        pitch,
        style,
        normalizeText: enableNormalization,
        token
      });

      setGenerationResult(result);

      // Refresh remaining character count upon successful generation
      if (result && result.usage) {
        updateUser(result.usage);
      }
    } catch (err) {
      if (err.code === 'FREE_LIMIT_REACHED' || err.code === 'CHARACTER_LIMIT_EXCEEDED') {
        setShowUpgradeModal(true);
        setErrorMessage(err.message || 'Character limit reached.');
      } else {
        console.warn('Backend generation error:', err);
        setErrorMessage(err.message || 'Something went wrong while generating the audio. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setErrorMessage('');
    stopVoice();
  };

  // Human-readable labels for slider values
  const getSpeedLabel = (s) => {
    if (s <= 0.75) return 'Slow';
    if (s >= 1.4) return 'Fast';
    if (s > 1.05) return 'Brisk';
    if (s < 0.95) return 'Gentle';
    return 'Normal';
  };

  const getPitchLabel = (p) => {
    if (p <= -0.3) return 'Deep';
    if (p < -0.05) return 'Lower';
    if (p >= 0.3) return 'High';
    if (p > 0.05) return 'Higher';
    return 'Default';
  };

  return (
    <div className="container studio-container" style={{ paddingBottom: '60px' }}>

      {/* Upgrade Modal shown when limit is reached */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => {
            setShowUpgradeModal(false);
            if (onOpenUpgrade) onOpenUpgrade();
          }}
          remainingChars={charactersRemaining}
        />
      )}

      {/* CREATOR MODES BAR (Responsive horizontally scrollable) */}
      <div className="creator-mode-bar" style={{ marginBottom: '20px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div className="mode-bar-inner">
          {CREATOR_MODES.map((m) => {
            const isSelected = selectedMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectMode(m.id)}
                className={`mode-tab-btn${isSelected ? ' active' : ''}`}
              >
                <span>{m.name}</span>
              </button>
            );
          })}
          <div className="mode-tag-label" style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', paddingRight: '8px' }}>
            {currentModeObj.tag}
          </div>
        </div>
      </div>

      {/* Mobile Active Language & Voice Quick Chips */}
      <div className="mobile-quick-selector-row">
        <button
          type="button"
          className="mobile-quick-chip"
          onClick={() => setShowMobileLangModal(true)}
          title="Change language"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="var(--saffron-primary)" />
            <span style={{ fontWeight: 600 }}>{currentLangObj.name}</span>
            {currentLangObj.nativeName && (
              <span style={{ opacity: 0.65, fontSize: '0.74rem' }}>({currentLangObj.nativeName})</span>
            )}
          </div>
          <ChevronRight size={14} style={{ opacity: 0.5 }} />
        </button>

        <button
          type="button"
          className="mobile-quick-chip"
          onClick={() => setShowMobileVoiceModal(true)}
          title="Change voice"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <Volume2 size={14} color="#00D084" />
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeVoiceMeta ? activeVoiceMeta.name : 'Select Voice'}
            </span>
          </div>
          <ChevronRight size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
        </button>
      </div>

      {/* MAIN STUDIO LAYOUT (3-Column Desktop | Single-Column Mobile Card Flow) */}
      <div className="studio-grid-3col">

        {/* ── 1. LEFT COLUMN (Desktop): Languages Panel ── */}
        <div className="studio-languages-panel desktop-only-panel">
          <div className="studio-lang-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="#FF9933" />
              <h2 style={{ fontSize: '1.02rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
                Languages
              </h2>
            </div>
            <span className="badge badge-saffron" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>
              {INDIAN_LANGUAGES.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="studio-lang-search-wrapper">
            <Search size={14} className="studio-lang-search-icon" />
            <input
              type="text"
              placeholder="Search languages..."
              value={searchLangQuery}
              onChange={(e) => setSearchLangQuery(e.target.value)}
              className="studio-lang-search-input"
              aria-label="Search languages"
            />
          </div>

          {/* Vertical Scrollable Language List */}
          <div className="studio-lang-list">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      stopVoice();
                      setSelectedLang(lang.code);
                    }}
                    className={`studio-lang-item ${isSelected ? 'active' : ''}`}
                    title={`${lang.name} (${lang.nativeName})`}
                  >
                    <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: isSelected ? 600 : 500 }}>{lang.name}</span>
                      {lang.nativeName && (
                        <span style={{ fontSize: '0.74rem', opacity: 0.65, marginLeft: '6px' }}>
                          {lang.nativeName}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={15} className="lang-check-icon" style={{ flexShrink: 0, marginLeft: '6px' }} />
                    )}
                  </button>
                );
              })
            ) : (
              <div style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No language found
              </div>
            )}
          </div>
        </div>

        {/* ── 2. CENTER & PRIMARY COLUMN: Text Editor & Controls & Output ── */}
        <div className="studio-center-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%' }}>

          {/* CARD 1: Text Input */}
          <div className="glass-card studio-card text-input-card">
            <div className="text-card-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <Edit3 size={17} color="var(--saffron-primary)" style={{ flexShrink: 0 }} />
                <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  1. Enter Your Text ({currentLangObj.name})
                </h2>
              </div>

              {/* Action buttons (Copy & Clear compact) */}
              <div className="text-card-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={handleCopy}
                  className="btn-secondary btn-compact"
                  title="Copy text"
                >
                  {copied ? <Check size={13} color="#00D084" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleClear}
                  className="btn-secondary btn-compact"
                  title="Clear text"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Unicode Textarea */}
            <div className="textarea-wrapper" style={{ position: 'relative' }}>
              <textarea
                id="studio-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Enter your ${currentLangObj.name} text here...`}
                rows={6}
                maxLength={5000}
                className="studio-textarea"
              />
              {/* Character Limit Counter Display */}
              <div className="char-counter-bottom-right">
                <span style={{ color: charCount > 5000 ? '#ef4444' : 'var(--text-muted)' }}>
                  {charCount} / 5000
                </span>
              </div>
            </div>

            {/* Sample Prompts for this Language (if available) */}
            {currentLangObj?.prompts && currentLangObj.prompts.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  Quick Samples ({currentLangObj.nativeName}):
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {currentLangObj.prompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setText(p)}
                      className="btn-secondary btn-sample-chip"
                    >
                      {idx === 0 ? '👋 Welcome Greeting' : idx === 1 ? '🎥 Video Script' : idx === 2 ? '🎧 Support' : '📖 Story'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CARD 2 (Mobile Flow): Speech Controls */}
          <div className="glass-card studio-card speech-controls-card">
            <div className="speech-controls-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={17} color="#FFA333" />
                <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  2. Speech Controls
                </h2>
              </div>
              <button
                onClick={handleResetSettings}
                className="btn-secondary btn-compact"
                title="Reset to default pitch and speed"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>

            <div className="sliders-container" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Speed Slider */}
              <div className="slider-group">
                <div className="slider-label-row">
                  <span className="slider-label-title">
                    Speech Speed <Info size={13} style={{ opacity: 0.6 }} />
                  </span>
                </div>
                <div className="slider-input-wrapper">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    aria-label="Speech Speed"
                    className="touch-slider"
                  />
                </div>
                <div className="slider-value-display">
                  <div className="slider-val-primary">{speed.toFixed(1)}x</div>
                  <div className="slider-val-sub">{getSpeedLabel(speed)}</div>
                </div>
              </div>

              {/* Pitch Slider */}
              <div className="slider-group">
                <div className="slider-label-row">
                  <span className="slider-label-title">
                    Pitch <Info size={13} style={{ opacity: 0.6 }} />
                  </span>
                </div>
                <div className="slider-input-wrapper">
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.05"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    aria-label="Voice Pitch"
                    className="touch-slider"
                  />
                </div>
                <div className="slider-value-display">
                  <div className="slider-val-primary">{pitch === 0 ? '0' : (pitch > 0 ? `+${pitch.toFixed(1)}` : pitch.toFixed(1))}</div>
                  <div className="slider-val-sub">{getPitchLabel(pitch)}</div>
                </div>
              </div>

              {/* Speaking Style Selector (Collapsible / Compact) */}
              <div className="style-selector-row">
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 500 }}>
                  Speaking Style &amp; Emotion
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{ width: '100%', fontSize: '0.84rem' }}
                >
                  {VOICE_STYLES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.description})
                    </option>
                  ))}
                </select>
              </div>

              {/* Text Normalization Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                marginTop: '-4px'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Indian Text Normalization
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Auto-expand ₹, Lakhs, Crores, dates
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableNormalization}
                  onChange={(e) => setEnableNormalization(e.target.checked)}
                  style={{ width: '17px', height: '17px', accentColor: 'var(--saffron-primary)', cursor: 'pointer' }}
                />
              </div>

              {/* GENERATE BUTTON (Full width, bold, high touch height) */}
              <button
                id="btn-generate-voice"
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className="btn-generate-voice-main"
                title="Generate Indian AI Voice Speech"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={18} className="spin-animation" />
                    <span>Synthesizing Voice...</span>
                  </>
                ) : (
                  <>
                    <div className="btn-soundwave-icon">
                      <span></span><span></span><span></span><span></span>
                    </div>
                    <span>Generate Voice</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Error Alert if any */}
          {errorMessage && (
            <div className="studio-error-banner" style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '0.86rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={17} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
              {isZeroRemaining && (
                <button
                  onClick={() => onOpenUpgrade ? onOpenUpgrade() : setShowUpgradeModal(true)}
                  style={{
                    background: '#FF8A00',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  Upgrade
                </button>
              )}
            </div>
          )}

          {/* CARD 3: Generated Voice Output */}
          <div className="glass-card studio-card generated-voice-card">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={17} color="var(--emerald-primary)" />
                <h2 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  3. Generated Voice
                </h2>
              </div>

              {/* Download Button on Top Right */}
              {generationResult && generationResult.audio_url ? (
                <a
                  href={generationResult.audio_url}
                  download={generationResult.filename || 'ai-voice-india.mp3'}
                  className="download-icon-btn active"
                  title="Download MP3 Audio"
                  aria-label="Download Audio"
                >
                  <Download size={16} />
                </a>
              ) : (
                <div
                  className="download-icon-btn disabled"
                  title="Generate audio first to download"
                >
                  <Download size={16} />
                </div>
              )}
            </div>

            {/* If audio generated, show the full playable audio player */}
            {generationResult && generationResult.success ? (
              <AudioPlayer
                audioUrl={generationResult.audio_url}
                filename={generationResult.filename}
                voiceMeta={activeVoiceMeta}
                characterCount={generationResult.character_count}
                providerUsed={generationResult.provider}
                generationTime={generationResult.generation_time_sec}
              />
            ) : (
              /* Idle Waveform Placeholder State (Matches Reference Mock) */
              <div className="generated-voice-placeholder">
                <div className="placeholder-waveform">
                  <span className="dash"></span>
                  <span className="dash"></span>
                  <span className="dash"></span>
                  <span className="peak peak-1"></span>
                  <span className="peak peak-2"></span>
                  <span className="peak peak-3"></span>
                  <span className="peak peak-2"></span>
                  <span className="dash"></span>
                  <span className="dash"></span>
                  <span className="peak peak-1"></span>
                  <span className="peak peak-3"></span>
                  <span className="peak peak-2"></span>
                  <span className="peak peak-1"></span>
                  <span className="dash"></span>
                  <span className="dash"></span>
                  <span className="dash"></span>
                </div>
                <p className="placeholder-text">
                  Your generated voice will appear here
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ── 3. RIGHT COLUMN (Desktop): Voice Library & Voice Details ── */}
        <div className="studio-voices-panel desktop-only-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%' }}>

          <div className="glass-card studio-card" style={{ padding: '18px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={18} color="#00D084" />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Voice Selection ({combinedVoiceList.length})
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={refreshVoices}
                  className="btn-secondary btn-compact"
                  title="Refresh device and browser voices"
                >
                  <RefreshCw size={12} />
                  <span>Refresh</span>
                </button>
                <span className="badge badge-emerald" style={{ fontSize: '0.66rem' }}>
                  {currentLangObj.bcp47 || currentLangObj.code}
                </span>
              </div>
            </div>

            {/* Currently Active Voice */}
            {activeVoiceMeta && (
              <div style={{
                background: 'linear-gradient(90deg, rgba(255, 138, 0, 0.1) 0%, var(--bg-card) 100%)',
                border: '1px solid rgba(255, 138, 0, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--saffron-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Active Voice
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeVoiceMeta.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {activeVoiceMeta.style || 'Natural Regional'} • {activeVoiceMeta.region || 'India'}
                  </div>
                </div>

                <button
                  onClick={(e) => handlePreview(activeVoiceMeta, e)}
                  className="btn-secondary btn-compact"
                  style={{
                    background: isSpeaking && previewingVoiceId === activeVoiceMeta.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 138, 0, 0.2)',
                    borderColor: isSpeaking && previewingVoiceId === activeVoiceMeta.id ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 138, 0, 0.4)',
                    color: isSpeaking && previewingVoiceId === activeVoiceMeta.id ? '#ef4444' : '#FF8A00'
                  }}
                >
                  {isSpeaking && previewingVoiceId === activeVoiceMeta.id ? (
                    <Square size={11} fill="#EF4444" />
                  ) : (
                    <Play size={11} fill="#FFA333" />
                  )}
                  <span>{isSpeaking && previewingVoiceId === activeVoiceMeta.id ? 'Stop' : 'Preview'}</span>
                </button>
              </div>
            )}

            {/* Real Voice Cards Scroll List */}
            <div className="voice-cards-scroll">
              {combinedVoiceList.length > 0 ? (
                combinedVoiceList.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id;
                  const isThisSpeaking = isSpeaking && previewingVoiceId === voice.id;

                  return (
                    <div
                      key={voice.id}
                      onClick={() => setSelectedVoiceId(voice.id)}
                      className={`glass-card ${isSelected ? '' : 'glass-card-interactive'}`}
                      style={{
                        padding: '10px 12px',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(255, 138, 0, 0.12) 0%, var(--bg-card) 100%)'
                          : 'var(--bg-card)',
                        border: isSelected
                          ? '1px solid rgba(255, 138, 0, 0.5)'
                          : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{ fontWeight: 600, color: isSelected ? '#FF8A00' : 'var(--text-primary)', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {voice.name}
                          </span>
                          {voice.gender && (
                            <span className={`badge ${voice.gender === 'Female' ? 'badge-saffron' : 'badge-cyan'}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              {voice.gender}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handlePreview(voice, e)}
                          className="btn-secondary btn-compact"
                          style={{
                            padding: '3px 6px',
                            fontSize: '0.7rem',
                            background: isThisSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 138, 0, 0.15)',
                            borderColor: isThisSpeaking ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 138, 0, 0.3)',
                            color: isThisSpeaking ? '#ef4444' : '#FF8A00'
                          }}
                        >
                          {isThisSpeaking ? <Square size={10} fill="#EF4444" /> : <Play size={10} fill="#FFA333" />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>{voice.style || 'Natural'} • {voice.region || 'India'}</span>
                        <span style={{ fontSize: '0.68rem', color: voice.isNativeDeviceVoice ? '#00D084' : 'var(--text-muted)' }}>
                          {voice.isNativeDeviceVoice ? '⚡ Native' : 'Cloud'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No voices loaded for {currentLangObj.name}.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ── MOBILE LANGUAGE BOTTOM SHEET / MODAL ── */}
      {showMobileLangModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowMobileLangModal(false)}>
          <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="var(--saffron-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Select Language ({INDIAN_LANGUAGES.length})
                </h3>
              </div>
              <button
                className="mobile-modal-close"
                onClick={() => setShowMobileLangModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '12px 16px 0 16px' }}>
              <div className="studio-lang-search-wrapper" style={{ marginBottom: '8px' }}>
                <Search size={14} className="studio-lang-search-icon" />
                <input
                  type="text"
                  placeholder="Search 20+ Indian Languages..."
                  value={searchLangQuery}
                  onChange={(e) => setSearchLangQuery(e.target.value)}
                  className="studio-lang-search-input"
                  autoFocus
                />
              </div>
            </div>

            <div className="mobile-modal-list">
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      stopVoice();
                      setSelectedLang(lang.code);
                      setShowMobileLangModal(false);
                    }}
                    className={`mobile-lang-row ${isSelected ? 'active' : ''}`}
                  >
                    <div>
                      <div style={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.92rem', color: isSelected ? 'var(--saffron-primary)' : 'var(--text-primary)' }}>
                        {lang.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {lang.nativeName} • {lang.region}
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={18} color="var(--saffron-primary)" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE VOICE BOTTOM SHEET / MODAL ── */}
      {showMobileVoiceModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowMobileVoiceModal(false)}>
          <div className="mobile-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={18} color="#00D084" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Select Voice for {currentLangObj.name}
                </h3>
              </div>
              <button
                className="mobile-modal-close"
                onClick={() => setShowMobileVoiceModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-modal-list" style={{ maxHeight: '60vh', padding: '12px 16px' }}>
              {combinedVoiceList.length > 0 ? (
                combinedVoiceList.map((voice) => {
                  const isSelected = selectedVoiceId === voice.id;
                  const isThisSpeaking = isSpeaking && previewingVoiceId === voice.id;

                  return (
                    <div
                      key={voice.id}
                      onClick={() => {
                        setSelectedVoiceId(voice.id);
                        setShowMobileVoiceModal(false);
                      }}
                      className={`mobile-voice-row ${isSelected ? 'active' : ''}`}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--saffron-primary)' : 'var(--text-primary)', fontSize: '0.92rem' }}>
                            {voice.name}
                          </span>
                          {voice.gender && (
                            <span className={`badge ${voice.gender === 'Female' ? 'badge-saffron' : 'badge-cyan'}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                              {voice.gender}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {voice.style || 'Natural'} • {voice.isNativeDeviceVoice ? '⚡ Native Device Voice' : 'Cloud Neural Voice'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={(e) => handlePreview(voice, e)}
                          className="btn-secondary btn-compact"
                          style={{
                            padding: '6px 10px',
                            background: isThisSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 138, 0, 0.15)',
                            borderColor: isThisSpeaking ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 138, 0, 0.3)',
                            color: isThisSpeaking ? '#ef4444' : '#FF8A00'
                          }}
                        >
                          {isThisSpeaking ? <Square size={12} fill="#EF4444" /> : <Play size={12} fill="#FFA333" />}
                          <span>{isThisSpeaking ? 'Stop' : 'Preview'}</span>
                        </button>
                        {isSelected && <Check size={18} color="var(--saffron-primary)" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No voices available for {currentLangObj.name}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

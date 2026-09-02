import React, { useState, useEffect } from 'react';
import {
  Mic, Sparkles, Volume2, Settings2, Play, Square, RefreshCw,
  Trash2, Copy, Check, Sliders, Globe, Layers, AlertCircle, Info,
  Video, Smartphone, BookOpen, GraduationCap, Radio, Megaphone, RotateCcw,
  Search, Zap
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
  onOpenUpgrade = null
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

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Plan & character allowance calculations
  const rawPlan = (user?.plan || 'basic').toLowerCase();
  const planId = rawPlan === 'free' ? 'basic' : rawPlan;
  const isBasicPlan = planId === 'basic';
  const isFreePlan = isBasicPlan;
  const charactersUsed = user?.characters_used ?? 0;
  const characterLimit = user?.character_limit ?? (planId === 'business' ? 5000 : planId === 'pro' ? 1000 : 200);
  const charactersRemaining = user?.characters_remaining ?? Math.max(0, characterLimit - charactersUsed);
  const charCount = text.length;
  const isOverLimit = charCount > charactersRemaining;
  const isZeroRemaining = charactersRemaining <= 0;

  // Current language object
  const currentLangObj = INDIAN_LANGUAGES.find(l => l.code === selectedLang) || INDIAN_LANGUAGES[0];

  // Filtered languages for the vertical sidebar navigation
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

  // Mode Selection Handler: Adjusts style, speed, and helper tip
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

    const previewSnippet = text && text.trim() ? text.trim().slice(0, 140) : (currentLangObj?.sample || 'Namaste');
    previewVoice(voiceToPreview, previewSnippet, speed, pitch);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter some text to generate speech.');
      return;
    }

    // Client-side guard for FREE users exceeding remaining allowance
    if (isZeroRemaining) {
      setShowUpgradeModal(true);
      setErrorMessage(`Your ${characterLimit} free characters have been used. Please upgrade to continue.`);
      return;
    }

    if (isOverLimit) {
      setShowUpgradeModal(true);
      setErrorMessage(`You have only ${charactersRemaining} free characters remaining. Your text has ${charCount} characters.`);
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
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setErrorMessage('');
    stopVoice();
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estSeconds = Math.max(1, Math.round((wordCount / 2.5) / speed));

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>

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

      {/* CREATOR MODES BAR */}
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
          <div style={{ marginLeft: 'auto', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', paddingRight: '8px' }}>
            {currentModeObj.tag}
          </div>
        </div>
      </div>

      {/* MAIN STUDIO LAYOUT (3-Column Desktop: Left Languages Sidebar | Center Text Editor | Right Voice Library & Settings) */}
      <div className="studio-grid-3col">

        {/* 1. LEFT COLUMN: Permanent Full-Height Languages Navigation Sidebar */}
        <div className="studio-languages-panel">
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
              <div style={{
                padding: '16px 8px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}>
                No language found
              </div>
            )}
          </div>
        </div>

        {/* 2. CENTER COLUMN: Text Editor and Generated Audio Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%' }}>

          {/* 1. Text Input Card */}
          <div className="glass-card" style={{ padding: '20px' }}>

            {/* Plan Character Allowance Indicator Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: isZeroRemaining ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              border: `1px solid ${isZeroRemaining ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-sm)',
              marginBottom: '14px',
              fontSize: '0.82rem',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: isZeroRemaining
                    ? '#ef4444'
                    : planId === 'business' ? '#00C4F0' : planId === 'pro' ? '#A855F7' : '#FF8A00',
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  {planId === 'business' ? 'BUSINESS PLAN' : planId === 'pro' ? 'PRO PLAN' : 'BASIC CREATOR'}
                </span>
                <span style={{ fontWeight: 600, color: isZeroRemaining ? '#ef4444' : 'var(--text-primary)' }}>
                  {charactersRemaining.toLocaleString()} / {characterLimit.toLocaleString()} characters remaining this month
                </span>
              </div>
              <button
                onClick={() => onOpenUpgrade ? onOpenUpgrade() : setShowUpgradeModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: planId === 'business' ? '#00C4F0' : planId === 'pro' ? '#A855F7' : '#FF8A00',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'inherit'
                }}
              >
                <Zap size={12} />
                {planId === 'business' ? 'Manage Plan' : 'Upgrade Plan'}
              </button>
            </div>

            <div className="text-card-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Mic size={18} color="var(--saffron-primary)" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  1. Enter Your Text ({currentLangObj.name})
                </h2>
              </div>

              {/* Action buttons */}
              <div className="text-card-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={handleCopy}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                  title="Copy text"
                >
                  {copied ? <Check size={14} color="#00D084" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleClear}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                  title="Clear text"
                >
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Large Unicode Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Enter your ${currentLangObj.name} text here...`}
                rows={8}
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  fontSize: '1.05rem',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Over-limit inline alert */}
            {isOverLimit && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                <span>Your text has {charCount} chars, which exceeds your remaining {charactersRemaining} free chars.</span>
                <button
                  onClick={() => onOpenUpgrade ? onOpenUpgrade() : setShowUpgradeModal(true)}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Upgrade Now
                </button>
              </div>
            )}

            {/* Mode Tip Banner */}
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              background: 'rgba(0, 210, 255, 0.05)',
              border: '1px solid rgba(0, 210, 255, 0.15)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: '#00D2FF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Info size={14} />
              <span>{currentModeObj.creatorTip}</span>
            </div>

            {/* Sample Prompts for this Language (only if configured) */}
            {currentLangObj?.prompts && currentLangObj.prompts.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  ({currentLangObj.nativeName}):
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {currentLangObj.prompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setText(p)}
                      className="btn-secondary"
                      style={{
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {idx === 0 ? '👋 Welcome Greeting' : idx === 1 ? '🎥 Video Script' : idx === 2 ? '🎧 Support' : '📖 Story'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <div>
                <span style={{ color: isOverLimit ? '#ef4444' : 'inherit', fontWeight: isOverLimit ? 700 : 'normal' }}>
                  {charCount} {isFreePlan ? `/ ${charactersRemaining} remaining free chars` : 'characters'}
                </span> • <span>{wordCount} words</span>
              </div>
              <div>
                <span>~{estSeconds}s</span>
              </div>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '0.9rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0 }} />
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
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  Upgrade Now
                </button>
              )}
            </div>
          )}

          {/* Generation Result Player */}
          {generationResult && generationResult.success && (
            <AudioPlayer
              audioUrl={generationResult.audio_url}
              filename={generationResult.filename}
              voiceMeta={activeVoiceMeta}
              characterCount={generationResult.character_count}
              providerUsed={generationResult.provider}
              generationTime={generationResult.generation_time_sec}
            />
          )}

        </div>

        {/* 3. RIGHT COLUMN: Select Voice & Natural Voice Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%' }}>

          {/* 2. Select Voice Card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={18} color="#00D084" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  2. Select Voice ({combinedVoiceList.length})
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={refreshVoices}
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  title="Refresh device and browser voices"
                >
                  <RefreshCw size={13} />
                  <span>Refresh</span>
                </button>

                <span className="badge badge-emerald">
                  {currentLangObj.bcp47 || currentLangObj.code}
                </span>
              </div>
            </div>

            {/* Currently Active Selected Voice Display */}
            {activeVoiceMeta && (
              <div style={{
                background: 'linear-gradient(90deg, rgba(255, 138, 0, 0.1) 0%, var(--bg-card) 100%)',
                border: '1px solid rgba(255, 138, 0, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--saffron-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                    Active Selected Voice
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                    {activeVoiceMeta.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {activeVoiceMeta.style || 'Natural Regional'} • {activeVoiceMeta.region || 'India'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={(e) => handlePreview(activeVoiceMeta, e)}
                    className="btn-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      background: isSpeaking && previewingVoiceId === activeVoiceMeta.id ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 138, 0, 0.2)',
                      borderColor: isSpeaking && previewingVoiceId === activeVoiceMeta.id ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 138, 0, 0.4)',
                      color: isSpeaking && previewingVoiceId === activeVoiceMeta.id ? '#ef4444' : '#FF8A00'
                    }}
                  >
                    {isSpeaking && previewingVoiceId === activeVoiceMeta.id ? (
                      <>
                        <Square size={12} fill="#EF4444" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} fill="#FFA333" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Available Voices Subheader */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              fontWeight: 600,
              marginBottom: '10px',
              padding: '0 2px'
            }}>
              <span>Available Voices ({combinedVoiceList.length})</span>
              <span style={{ color: '#00D2FF' }}>{currentLangObj.name}</span>
            </div>

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
                        padding: '12px 14px',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(255, 138, 0, 0.12) 0%, var(--bg-card) 100%)'
                          : 'var(--bg-card)',
                        border: isSelected
                          ? '1px solid rgba(255, 138, 0, 0.5)'
                          : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: isSelected ? '#FF8A00' : 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {voice.name}
                          </span>

                          {/* Gender Badge */}
                          {voice.gender && (
                            <span className={`badge ${voice.gender === 'Female' ? 'badge-saffron' : 'badge-cyan'}`} style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                              {voice.gender}
                            </span>
                          )}

                          {/* Status Badge: Indian Regional vs Fallback */}
                          <span
                            className={`badge ${voice.isIndianVoice && !voice.isFallback ? 'badge-emerald' : 'badge-cyan'}`}
                            style={{ fontSize: '0.63rem', padding: '1px 6px' }}
                          >
                            {voice.statusLabel || (voice.isIndianVoice ? 'Indian Voice' : 'Fallback')}
                          </span>
                        </div>

                        {/* Preview / Stop Button */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => handlePreview(voice, e)}
                            className="btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              background: isThisSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 138, 0, 0.15)',
                              borderColor: isThisSpeaking ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 138, 0, 0.3)',
                              color: isThisSpeaking ? '#ef4444' : '#FF8A00'
                            }}
                            title="Play audio preview"
                          >
                            {isThisSpeaking ? (
                              <>
                                <Square size={11} fill="#EF4444" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Play size={11} fill="#FFA333" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)'
                      }}>
                        <span>{voice.style || 'Natural'} • {voice.region || 'India'}</span>
                        <span style={{ fontSize: '0.7rem', color: voice.isNativeDeviceVoice ? '#00D084' : 'var(--text-muted)' }}>
                          {voice.isNativeDeviceVoice ? '⚡ Native' : 'Cloud'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  No voices loaded for {currentLangObj.name}. Click refresh to detect voices.
                </div>
              )}
            </div>
          </div>

          {/* 3. Natural Speech Controls (Pitch, Speed, Emotion, Normalization) */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings2 size={18} color="#FFA333" />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  3. Speech Controls
                </h2>
              </div>
              <button
                onClick={handleResetSettings}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                title="Reset to default pitch, speed and style"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Style / Emotion Selector */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Speaking Style &amp; Emotion
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem' }}
                >
                  {VOICE_STYLES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.description})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed Slider */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}>
                  <span>Speech Speed</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px'
                }}>
                  <span>0.5x Slow</span>
                  <span>1.0x Normal</span>
                  <span>2.0x Fast</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}>
                  <span>Voice Pitch</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {pitch > 0 ? `+${pitch}` : pitch}
                  </span>
                </div>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px'
                }}>
                  <span>Deeper</span>
                  <span>Default</span>
                  <span>Higher</span>
                </div>
              </div>

              {/* Normalization toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Indian Text Normalization
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Auto format ₹, Lakhs, Crores, dates &amp; abbreviations
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableNormalization}
                  onChange={(e) => setEnableNormalization(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--saffron-primary)', cursor: 'pointer' }}
                />
              </div>

            </div>
          </div>

          {/* 5. GENERATE BUTTON */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="btn-generate"
            style={{ width: '100%', padding: '16px', fontSize: '1.05rem' }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="spin-animation" />
                <span>Synthesizing Voice...</span>
              </>
            ) : isZeroRemaining ? (
              <>
                <Zap size={18} />
                <span>Upgrade to Generate Voices</span>
              </>
            ) : (
              <>
                <span>Generate Indian AI Voice</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}

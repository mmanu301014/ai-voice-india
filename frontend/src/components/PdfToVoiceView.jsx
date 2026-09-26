import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, UploadCloud, Globe, Mic, Search, Check, ChevronDown,
  Play, Pause, Square, Download, RefreshCw, AlertCircle, X,
  FileCheck, Sparkles, Volume2, VolumeX, RotateCcw, Trash2
} from 'lucide-react';
import { extractPdfText, generateSpeech } from '../services/api';

// Soundwave Logo Icon matching VoiceStudio
function SoundwaveIcon({ color = 'currentColor', size = 22 }) {
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

export default function PdfToVoiceView({
  voices = [],
  selectedLang = 'en',
  setSelectedLang,
  availableLanguages = [],
  currentLangObj = { code: 'en', name: 'English' },
  combinedVoiceList = [],
  activeVoiceMeta = null,
  selectedVoiceId = '',
  setSelectedVoiceId,
  speed = 1.0,
  setSpeed,
  pitch = 0.5,
  setPitch,
  token = null,
  user = null,
  updateUser = () => {},
  onOpenUpgrade = () => {},
  setShowUpgradeModal = () => {}
}) {
  // ── PDF Extraction States ──────────────────────────────────────────────────
  const [pdfFile, setPdfFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfMeta, setPdfMeta] = useState(null); // { filename, page_count, character_count }
  const [extractedText, setExtractedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ── Dropdown States ────────────────────────────────────────────────────────
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [searchLangQuery, setSearchLangQuery] = useState('');
  const [searchVoiceQuery, setSearchVoiceQuery] = useState('');
  const dropdownRef = useRef(null);

  // ── Generation & Error States ──────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // ── Audio Player States (Play, Pause, Stop, Download) ────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Filter languages for search
  const filteredLanguages = availableLanguages.filter(lang => {
    if (!lang) return false;
    if (!searchLangQuery || !searchLangQuery.trim()) return true;
    const q = searchLangQuery.toLowerCase().trim();
    return (
      (lang.name && String(lang.name).toLowerCase().includes(q)) ||
      (lang.nativeName && String(lang.nativeName).toLowerCase().includes(q)) ||
      (lang.code && String(lang.code).toLowerCase().includes(q))
    );
  });

  // Filter voices for search
  const filteredVoices = combinedVoiceList.filter(v => {
    if (!v) return false;
    if (!searchVoiceQuery || !searchVoiceQuery.trim()) return true;
    const q = searchVoiceQuery.toLowerCase().trim();
    return (
      (v.name && String(v.name).toLowerCase().includes(q)) ||
      (v.gender && String(v.gender).toLowerCase().includes(q)) ||
      (v.id && String(v.id).toLowerCase().includes(q))
    );
  });

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLangDropdown(false);
        setShowVoiceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Audio player effect when audio URL changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [generationResult?.audio_url]);

  // Handle PDF file selection / drop
  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file (.pdf).');
      return;
    }

    setErrorMessage('');
    setIsExtracting(true);
    setPdfFile(file);

    try {
      const data = await extractPdfText(file, token);
      setPdfMeta({
        filename: data.filename,
        page_count: data.page_count,
        character_count: data.character_count
      });
      setExtractedText(data.text || '');
      setGenerationResult(null);
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setErrorMessage(err.message || 'Failed to extract text from PDF file.');
      setPdfFile(null);
      setPdfMeta(null);
      setExtractedText('');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePdfUpload(e.target.files[0]);
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setPdfMeta(null);
    setExtractedText('');
    setGenerationResult(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate Audio handler
  const handleGenerateVoice = async () => {
    if (!extractedText || !extractedText.trim()) {
      setErrorMessage('No text extracted from PDF. Please upload a PDF file with readable text.');
      return;
    }

    const charCount = extractedText.length;
    if (charCount > 5000) {
      setErrorMessage(`Extracted text (${charCount.toLocaleString()} chars) exceeds 5,000 limit. Please trim text in preview box.`);
      return;
    }

    const characterLimit = user?.character_limit ?? 1000;
    const charactersUsed = user?.characters_used ?? 0;
    const charactersRemaining = user?.characters_remaining ?? Math.max(0, characterLimit - charactersUsed);

    if (charactersRemaining <= 0 && user) {
      setShowUpgradeModal(true);
      setErrorMessage(`Your ${characterLimit.toLocaleString()} characters have been used. Please upgrade to continue.`);
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const result = await generateSpeech({
        text: extractedText.trim(),
        language: selectedLang,
        voiceId: selectedVoiceId || (activeVoiceMeta ? activeVoiceMeta.id : ''),
        speed,
        pitch,
        normalizeText: true,
        token
      });

      setGenerationResult(result);
      if (result && result.usage) {
        updateUser(result.usage);
      }
    } catch (err) {
      if (err && (err.code === 'FREE_LIMIT_REACHED' || err.code === 'CHARACTER_LIMIT_EXCEEDED')) {
        setShowUpgradeModal(true);
        setErrorMessage(err.message || 'Character limit reached.');
      } else {
        setErrorMessage(err?.message || 'Failed to generate audio from PDF text.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Audio Player controls (Play, Pause, Stop, Download)
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1.0;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="pdf-workspace-container" ref={dropdownRef} style={{ width: '100%' }}>
      
      {/* ── Center Hero Header (Dark Theme) ── */}
      <section className="ref-hero-section" style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: 'rgba(47, 129, 247, 0.15)',
          border: '1px solid rgba(47, 129, 247, 0.3)',
          color: '#2F81F7',
          fontSize: '0.82rem',
          fontWeight: 700,
          marginBottom: '12px'
        }}>
          <Sparkles size={14} color="#2F81F7" />
          <span>AI PDF AUDIO CONVERTER</span>
        </div>

        <h1 className="ref-hero-title" style={{ color: '#F0F6FC', fontSize: '1.8rem', fontWeight: 800 }}>
          PDF to AI Voice Generator
        </h1>
        <p className="ref-hero-subtitle" style={{ color: '#8B949E' }}>
          Upload any PDF document, extract text automatically, and convert it into natural Indian AI voice speech.
        </p>
      </section>

      {/* ── Main PDF Workspace Grid (Matches Home 2-Column Grid) ── */}
      <div className="ref-workspace-grid">
        
        {/* Row 1, Column 1: Language & Voice Selectors */}
        <div className="sel-row">

          {/* ── Language Selector ── */}
          <div className="sel-group ref-dropdown-wrapper">
            <div className="sel-label">
              <Globe size={14} color="#8B949E" />
              <span>Language</span>
            </div>
            <button
              type="button"
              className="sel-trigger"
              id="dropdown-pdf-language-btn"
              onClick={() => {
                setShowLangDropdown(!showLangDropdown);
                setShowVoiceDropdown(false);
              }}
            >
              <span className="sel-trigger-value">
                {currentLangObj && currentLangObj.name
                  ? `${currentLangObj.name}${currentLangObj.nativeName ? ' (' + currentLangObj.nativeName + ')' : ''}`
                  : 'English (India)'}
              </span>
              <ChevronDown size={16} className="sel-trigger-chevron" />
            </button>

            {showLangDropdown && (
              <div className="ref-dropdown-popup">
                <div className="ref-popup-search">
                  <Search size={14} color="#8B949E" />
                  <input
                    type="text"
                    placeholder="Search language..."
                    value={searchLangQuery}
                    onChange={(e) => setSearchLangQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="ref-popup-scroll">
                  {filteredLanguages.map(l => (
                    <button
                      key={l.code}
                      className={`ref-popup-item ${selectedLang === l.code ? 'selected' : ''}`}
                      onClick={() => {
                        if (setSelectedLang) setSelectedLang(l.code);
                        setShowLangDropdown(false);
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{l.name}</span>
                      {l.nativeName && <span style={{ opacity: 0.65, fontSize: '0.78rem' }}>({l.nativeName})</span>}
                      {selectedLang === l.code && <Check size={14} color="#2F81F7" style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Voice Selector ── */}
          <div className="sel-group ref-dropdown-wrapper">
            <div className="sel-label">
              <Mic size={14} color="#8B949E" />
              <span>Voice</span>
            </div>
            <button
              type="button"
              className="sel-trigger"
              id="dropdown-pdf-voice-btn"
              onClick={() => {
                setShowVoiceDropdown(!showVoiceDropdown);
                setShowLangDropdown(false);
              }}
            >
              <span className="sel-trigger-value">
                {combinedVoiceList.length > 0
                  ? (activeVoiceMeta && activeVoiceMeta.name
                      ? `${activeVoiceMeta.gender === 'Female' ? 'Female' : 'Male'} - ${activeVoiceMeta.name}`
                      : 'Select Voice')
                  : 'No voice available'}
              </span>
              <ChevronDown size={16} className="sel-trigger-chevron" />
            </button>

            {showVoiceDropdown && (
              <div className="ref-dropdown-popup">
                <div className="ref-popup-search">
                  <Search size={14} color="#8B949E" />
                  <input
                    type="text"
                    placeholder="Search voice..."
                    value={searchVoiceQuery}
                    onChange={(e) => setSearchVoiceQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="ref-popup-scroll">
                  {filteredVoices.length > 0 ? (
                    filteredVoices.map(v => (
                      <button
                        key={v.id || v.name}
                        className={`ref-popup-item ${selectedVoiceId === v.id ? 'selected' : ''}`}
                        onClick={() => {
                          if (setSelectedVoiceId) setSelectedVoiceId(v.id || '');
                          setShowVoiceDropdown(false);
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{v.name || 'Voice'}</span>
                        <span style={{ opacity: 0.6, fontSize: '0.75rem', marginLeft: '6px' }}>
                          ({v.gender === 'Female' ? 'Female' : 'Male'})
                        </span>
                        {selectedVoiceId === v.id && <Check size={14} color="#2F81F7" style={{ marginLeft: 'auto' }} />}
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: '16px 14px', fontSize: '0.84rem', color: '#8B949E', textAlign: 'center', lineHeight: '1.5' }}>
                      {searchVoiceQuery ? `No voices matching "${searchVoiceQuery}"` : `Native ${currentLangObj?.name || 'this language'} AI voice is currently under development.`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Row 2, Column 1: LEFT COLUMN (Drag & Drop Upload Zone + PDF Preview + Extracted Text) */}
        <div className="ref-left-column">
          
          {/* Card: Drag & Drop Upload Zone (Dark Theme matching dashboard) */}
          {!pdfFile && (
            <div
              className={`pdf-dropzone-card ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                background: isDragging
                  ? 'rgba(31, 111, 229, 0.12)'
                  : '#161B22',
                border: isDragging ? '2px dashed #388BFD' : '2px dashed #30363D',
                borderRadius: '16px',
                padding: '44px 24px',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '260px'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="pdf-file-input"
              />

              {isExtracting ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                  <RefreshCw size={36} color="#388BFD" className="spin-animation" />
                  <span style={{ fontWeight: 600, color: '#C9D1D9', fontSize: '1rem' }}>
                    Extracting text from PDF...
                  </span>
                </div>
              ) : (
                <>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: 'rgba(47, 129, 247, 0.12)',
                    border: '1px solid rgba(47, 129, 247, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                  }}>
                    <UploadCloud size={32} color="#388BFD" />
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F0F6FC', marginBottom: '6px' }}>
                    Drag & Drop your PDF file here
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: '#8B949E', marginBottom: '22px', maxWidth: '380px', lineHeight: '1.5' }}>
                    Supports single or multi-page PDF files. Text is automatically parsed for speech synthesis.
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="ref-btn-generate-blue"
                    style={{
                      width: 'auto',
                      padding: '12px 28px',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      fontWeight: 600
                    }}
                  >
                    Choose PDF File
                  </button>
                </>
              )}
            </div>
          )}

          {/* Card: PDF Preview Box & Extracted Text Editor (Dark Theme) */}
          {pdfFile && pdfMeta && (
            <div className="ref-text-card">
              
              {/* PDF Preview Header Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '12px',
                background: '#0D1117',
                border: '1px solid #30363D',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <FileCheck size={24} color="#388BFD" />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, color: '#F0F6FC', fontSize: '0.94rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {pdfMeta.filename}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: '#8B949E', marginTop: '2px' }}>
                      <span style={{ background: 'rgba(47, 129, 247, 0.15)', color: '#388BFD', border: '1px solid rgba(47, 129, 247, 0.3)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                        📄 {pdfMeta.page_count} {pdfMeta.page_count === 1 ? 'Page' : 'Pages'}
                      </span>
                      <span>
                        🔤 {extractedText.length.toLocaleString()} Chars
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePdf}
                  title="Remove PDF"
                  className="ref-tcbtn"
                  style={{ color: '#f87171' }}
                >
                  <Trash2 size={14} color="#f87171" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Extracted Text Title */}
              <div className="ref-text-card-header">
                <span className="ref-text-card-title">Extracted Text Preview</span>
              </div>

              <textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={8}
                maxLength={5000}
                className="ref-textarea"
                placeholder="Extracted text will appear here..."
              />

              <div className="ref-text-card-footer">
                <span className="ref-char-counter">{extractedText.length} / 1000 characters</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="ref-error-banner" style={{ marginTop: '16px' }}>
              <AlertCircle size={16} color="#f87171" />
              <span>{errorMessage}</span>
              <X size={14} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setErrorMessage('')} />
            </div>
          )}

          {/* Audio Player Card (Dark Theme) */}
          {generationResult && generationResult.audio_url ? (
            <div className="ref-card" style={{ padding: '16px 20px', marginTop: '16px' }}>
              <audio
                ref={audioRef}
                src={generationResult.audio_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => audioRef.current && !isNaN(audioRef.current.duration) && setDuration(audioRef.current.duration)}
                onEnded={() => setIsPlaying(false)}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                
                {/* Play / Pause Circular Button */}
                <button
                  onClick={togglePlay}
                  className="player-play-btn-black"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={20} fill="#F0F6FC" color="#F0F6FC" /> : <Play size={20} fill="#F0F6FC" color="#F0F6FC" style={{ marginLeft: '2px' }} />}
                </button>

                {/* Stop Button */}
                <button
                  onClick={handleStop}
                  className="ref-tcbtn"
                  style={{ width: '38px', height: '38px', padding: 0, justifyContent: 'center', borderRadius: '50%' }}
                  title="Stop Playback"
                >
                  <Square size={14} fill="#C9D1D9" color="#C9D1D9" />
                </button>

                {/* Audio Progress Scrubber & Labels */}
                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#8B949E' }}>
                    <span style={{ fontWeight: 600, color: '#388BFD' }}>Generated PDF Audio</span>
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.01"
                    value={currentTime}
                    onChange={handleSeek}
                    className="player-timeline-slider"
                    aria-label="Seek timeline"
                  />
                </div>

                {/* Volume & Download */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={toggleMute}
                    className="player-vol-btn"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={18} color="#F0F6FC" /> : <Volume2 size={18} color="#F0F6FC" fill="#F0F6FC" />}
                  </button>

                  <a
                    href={generationResult.audio_url}
                    download={pdfMeta?.filename ? `${pdfMeta.filename.replace('.pdf', '')}_voice.mp3` : 'pdf-voice.mp3'}
                    className="ref-btn-save-voice-sm"
                    title="Download Audio"
                  >
                    <Download size={14} color="#FFFFFF" />
                    <span>Download</span>
                  </a>
                </div>

              </div>
            </div>
          ) : (
            <div className="card-audio-player" style={{ marginTop: '16px' }}>
              <button className="player-play-btn-black" onClick={handleGenerateVoice} disabled={isGenerating || !extractedText.trim()}>
                <Play size={20} fill="#F0F6FC" color="#F0F6FC" style={{ marginLeft: '2px' }} />
              </button>
              <div className="player-right-content">
                <span className="player-audio-label">PDF Voice Audio</span>
                <div className="player-slider-row">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value="0"
                    readOnly
                    className="player-timeline-slider"
                    aria-label="Timeline scrubber placeholder"
                  />
                  <span className="player-duration-text">0:00</span>
                  <button className="player-vol-btn" aria-label="Volume toggle">
                    <Volume2 size={18} color="#F0F6FC" fill="#F0F6FC" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Row 2, Column 2: RIGHT COLUMN (Voice Controls & Primary Action Button) */}
        <div className="ref-right-column">
          <div className="ref-card ref-voice-control-card">
            <h2 className="ref-voice-control-title">Voice control</h2>

            {/* Speed Slider */}
            <div className="ref-slider-group">
              <div className="ref-slider-meta">
                <span>Speed</span>
                <span className="ref-slider-value">{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed && setSpeed(parseFloat(e.target.value))}
                className="ref-black-slider"
                aria-label="Speed slider"
              />
              <div className="ref-slider-limits">
                <span>0.5x</span>
                <span>5x</span>
              </div>
            </div>

            {/* Pitch Slider */}
            <div className="ref-slider-group">
              <div className="ref-slider-meta">
                <span>Pitch</span>
                <span className="ref-slider-value">{pitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch && setPitch(parseFloat(e.target.value))}
                className="ref-black-slider"
                aria-label="Pitch slider"
              />
              <div className="ref-slider-limits">
                <span>0.5x</span>
                <span>5x</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleGenerateVoice}
              disabled={isGenerating || !extractedText.trim()}
              className="ref-btn-generate-blue"
              id="btn-generate-pdf-voice"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="spin-animation" color="#FFFFFF" />
                  <span>Generating Speech...</span>
                </>
              ) : (
                <>
                  <SoundwaveIcon color="#FFFFFF" size={20} />
                  <span>Generate Voice</span>
                </>
              )}
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}

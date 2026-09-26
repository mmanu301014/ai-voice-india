import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2, Play, Pause, Square, RefreshCw,
  Trash2, Copy, Check, Sliders, Globe, AlertCircle, Info,
  RotateCcw, Search, Download, X, Edit3, ChevronRight,
  Home, IndianRupee, FileText, Code, Headphones, LogOut, ChevronDown,
  User, ArrowRight, Mic, Shield, Zap, Sparkles, Star, Menu, Clock,
  Crown, Settings, Wand2
} from 'lucide-react';
import { INDIAN_LANGUAGES } from '../data/languages';
import { generateSpeech } from '../services/api';
import { useWebSpeechVoices } from '../hooks/useWebSpeechVoices';
import { cleanVoiceName, detectVoiceGender, LANGUAGE_LOCALE_MAP } from '../services/webSpeechService';
import { useAuth } from '../context/AuthContext';
import AudioPlayer from './AudioPlayer';
import UpgradeModal from './UpgradeModal';
import PdfToVoiceView from './PdfToVoiceView';
import AiAssistantView from './AiAssistantView';
import VoiceEffectsView from './VoiceEffectsView';
import HelpSupportView from './HelpSupportView';
import SettingsView from './SettingsView';

// ── Soundwave Logo Icon matching reference design ────────────────────────────
function SoundwaveIcon({ color = '#F0F6FC', size = 22 }) {
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

const EXAMPLE_PROMPTS = [
  { title: "Explain artificial intelligence", desc: "Learn the core concepts of AI & neural synthesis", sampleText: "Artificial intelligence is the simulation of human intelligence processes by machines, especially computer systems. It enables automated voice creation, speech recognition, and language processing." },
  { title: "Write a short story", desc: "Generate a creative narration script for voiceovers", sampleText: "Once upon a time in a peaceful valley surrounded by majestic mountains, an ancient river whispered secrets of forgotten ages to all who passed by." },
  { title: "Summarize this topic", desc: "Create concise, voice-ready summaries", sampleText: "Voice synthesis technology transforms written text into natural human speech in seconds, empowering creators across India with high-quality audio generation." },
  { title: "Help me learn Python", desc: "Step-by-step programming & syntax guide", sampleText: "Python is a versatile programming language known for its clear syntax and ease of use. You can quickly build voice applications, web servers, and AI models with Python." }
];

export default function VoiceStudio({
  voices = [],
  selectedLang = 'en',
  setSelectedLang,
  initialMode = null,
  initialStyle = null,
  onOpenUpgrade = null,
  setActiveTab = null
}) {
  const auth = useAuth() || {};
  const user = auth.user;
  const token = auth.token;
  const logout = auth.logout || (() => {});
  const updateUser = auth.updateUser || (() => {});

  // Hook for Web Speech API voices
  const webSpeech = useWebSpeechVoices(selectedLang) || {};
  const browserVoices = Array.isArray(webSpeech.availableVoicesForLang) ? webSpeech.availableVoicesForLang : [];
  const allRawBrowserVoices = Array.isArray(webSpeech.allRawVoices) ? webSpeech.allRawVoices : [];

  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [text, setText] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0.5);
  const [volume, setVolume] = useState(100);
  const [style, setStyle] = useState(initialStyle || 'Storytelling');
  const [enableNormalization, setEnableNormalization] = useState(true);

  // Dropdown states & selection tracking
  const [hasSelectedLang, setHasSelectedLang] = useState(false);
  const [hasSelectedVoice, setHasSelectedVoice] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [searchLangQuery, setSearchLangQuery] = useState('');
  const [searchVoiceQuery, setSearchVoiceQuery] = useState('');
  const [activeMenuTab, setActiveMenuTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper formatting functions for clean language and voice names
  const getCleanLangName = (langObj) => {
    if (!langObj) return 'Select Language';
    const code = langObj.code || '';
    const name = langObj.name || '';
    
    if (code === 'en' || name.toLowerCase().includes('english')) return 'English (India)';
    if (code === 'kn' || name.toLowerCase().includes('kannada')) return 'Kannada (India)';
    if (code === 'hi' || name.toLowerCase().includes('hindi')) return 'Hindi (India)';
    if (code === 'ta' || name.toLowerCase().includes('tamil')) return 'Tamil (India)';
    if (code === 'te' || name.toLowerCase().includes('telugu')) return 'Telugu (India)';
    if (code === 'bn' || name.toLowerCase().includes('bengali')) return 'Bengali (India)';
    if (code === 'mr' || name.toLowerCase().includes('marathi')) return 'Marathi (India)';
    if (code === 'gu' || name.toLowerCase().includes('gujarati')) return 'Gujarati (India)';
    if (code === 'ml' || name.toLowerCase().includes('malayalam')) return 'Malayalam (India)';
    if (code === 'pa' || name.toLowerCase().includes('punjabi')) return 'Punjabi (India)';

    let clean = name.replace(/\s*\([^)]*English[^)]*\)/gi, '').trim();
    if (!clean.includes('(India)')) {
      clean += ' (India)';
    }
    return clean;
  };

  const getCleanVoiceName = (voiceObj) => {
    if (!voiceObj) return 'Select Voice';
    let name = voiceObj.name || 'Voice';
    const gender = voiceObj.gender === 'Female' ? 'Female' : (detectVoiceGender(name) === 'Female' ? 'Female' : 'Male');

    // Strip language suffix like "- English", "- Hindi", "(English)", etc.
    name = name.replace(/\s*[-–—]\s*(English|Hindi|Kannada|Tamil|Telugu|Bengali|Marathi|Gujarati|Malayalam|Punjabi).*$/gi, '').trim();
    name = name.replace(/\s*\([^)]*\)/g, '').trim();

    // Remove any duplicate "Male -" or "Female -" prefix
    name = name.replace(/^(Male|Female)\s*[-–—]\s*/i, '').trim();

    return `${gender} – ${name}`;
  };

  // Active Modals
  const [activeModal, setActiveModal] = useState(null); // 'creations', 'api', 'pricing', 'about', 'help'

  // Generation & Audio States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Mutex lock ref to prevent duplicate /api/generate calls
  const generateLock = useRef(false);

  // Drag & drop for .txt files
  const [isDragging, setIsDragging] = useState(false);

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
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            setText(event.target.result.slice(0, 1000));
          }
        };
        reader.readAsText(file);
      }
    }
  };

  // Quick Prompt Chips
  const PROMPT_TEMPLATES = {
    'YouTube Script': "Welcome back to the channel! In today's video, we're diving deep into the extraordinary world of artificial intelligence and its impact on modern technology.",
    'Podcast': "Hello listeners, welcome to another episode of India Tech Talk. Today we have a special guest joining us to discuss the future of AI voice automation.",
    'Story': "Once upon a time in a peaceful village nestled in the Western Ghats, a mysterious ancient scroll was discovered near the old temple.",
    'Announcement': "Attention valued customers! We are thrilled to announce the launch of our brand new AI voice features designed to empower creators across India."
  };

  const handleChipClick = (chipName) => {
    const template = PROMPT_TEMPLATES[chipName];
    if (template) {
      setText(template.slice(0, 1000));
    }
  };

  // Feedback / Rating State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // My creations history
  const [creationsHistory, setCreationsHistory] = useState([]);

  const dropdownRef = useRef(null);

  // Character Allowance Calculations
  const characterLimit = user?.character_limit ?? 1000;
  const charactersUsed = user?.characters_used ?? 0;
  const charactersRemaining = user?.characters_remaining ?? Math.max(0, characterLimit - charactersUsed);
  const charCount = text ? text.length : 0;

  // Safe backend voices list
  const safeVoices = Array.isArray(voices) ? voices : [];

  // Filter available languages
  const availableLanguages = (Array.isArray(INDIAN_LANGUAGES) ? INDIAN_LANGUAGES : []).filter(lang => {
    if (!lang) return false;
    const hasBackendVoice = safeVoices.some(bv => bv && bv.language === lang.code);
    const langConfig = LANGUAGE_LOCALE_MAP[lang.code];
    const hasBrowserVoice = langConfig
      ? allRawBrowserVoices.some(bv => {
          const langLower = (bv.lang || '').toLowerCase().replace(/_/g, '-');
          return langConfig.matchPrefixes.some(prefix => langLower.startsWith(prefix));
        })
      : false;

    return hasBackendVoice || hasBrowserVoice;
  });

  // Auto-switch selectedLang to first available language if current is missing
  useEffect(() => {
    if (availableLanguages.length > 0) {
      const isSelectedAvailable = availableLanguages.some(l => l.code === selectedLang);
      if (!isSelectedAvailable && setSelectedLang) {
        setSelectedLang(availableLanguages[0].code);
      }
    }
  }, [availableLanguages, selectedLang, setSelectedLang]);

  // Current language object
  const currentLangObj = (availableLanguages.find(l => l && l.code === selectedLang))
    || availableLanguages[0]
    || (Array.isArray(INDIAN_LANGUAGES) ? INDIAN_LANGUAGES.find(l => l && l.code === selectedLang) : null)
    || { code: 'en', name: 'English' };

  // Backend voices for selected language
  const backendVoicesForLang = safeVoices
    .filter(v => v && (v.language === selectedLang))
    .map(bv => {
      const rawN = bv.name || 'Voice';
      const cleanN = cleanVoiceName(rawN, currentLangObj?.name || '');
      const gender = detectVoiceGender(rawN) === 'Female' ? 'Female' : (bv.gender === 'Female' ? 'Female' : 'Male');
      return {
        ...bv,
        name: cleanN,
        gender: gender
      };
    });

  // Combined Voice list
  const combinedVoiceList = [
    ...browserVoices,
    ...backendVoicesForLang.filter(bv => bv && bv.name && !browserVoices.some(wv => wv && wv.name && String(wv.name).toLowerCase() === String(bv.name).toLowerCase()))
  ];

  // Default to first voice if available
  useEffect(() => {
    if (combinedVoiceList.length > 0) {
      const exists = combinedVoiceList.some(v => v && v.id === selectedVoiceId);
      if (!exists && combinedVoiceList[0]) {
        setSelectedVoiceId(combinedVoiceList[0].id || '');
      }
    } else {
      setSelectedVoiceId('');
    }
  }, [selectedLang, browserVoices, voices]);

  const activeVoiceMeta = combinedVoiceList.find(v => v && v.id === selectedVoiceId) || combinedVoiceList[0];

  // Filtered Languages for search
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

  // Filtered Voices for search
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

  // Click outside listener for dropdowns
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

  const handleCopyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDeleteText = () => {
    setText('');
    setErrorMessage('');
  };

  const handleSaveVoice = () => {
    if (generationResult && generationResult.audio_url) {
      const a = document.createElement('a');
      a.href = generationResult.audio_url;
      a.download = generationResult.filename || 'ai-voice-india.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    // Do NOT call handleGenerate here — download only works when audio exists
  };

  const handleGenerate = async () => {
    // Prevent duplicate concurrent requests (race condition / React StrictMode guard)
    if (generateLock.current) {
      console.warn('[Generate] Request already in flight — ignoring duplicate call.');
      return;
    }

    setHasSelectedLang(true);
    setHasSelectedVoice(true);

    if (!text || !text.trim()) {
      setErrorMessage('Please enter some text to generate speech.');
      return;
    }

    if (charCount > 5000) {
      setErrorMessage(`Text length (${charCount} characters) exceeds the maximum allowed limit of 5,000 characters.`);
      return;
    }

    if (charactersRemaining <= 0 && user) {
      setShowUpgradeModal(true);
      setErrorMessage(`Your ${characterLimit} characters have been used. Please upgrade to continue.`);
      return;
    }

    if (combinedVoiceList.length === 0 || (!selectedVoiceId && !activeVoiceMeta)) {
      setErrorMessage(`Native ${currentLangObj?.name || 'this language'} AI voice is currently under development. Try Hindi or English for similar regional accent options.`);
      return;
    }

    // Acquire lock
    generateLock.current = true;
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

      if (result && result.usage) {
        updateUser(result.usage);
      }

      // Add to creations history
      if (result && result.audio_url) {
        setCreationsHistory(prev => [
          {
            id: Date.now(),
            text: text.trim().slice(0, 80) + (text.length > 80 ? '...' : ''),
            language: currentLangObj.name || 'English',
            voice: activeVoiceMeta?.name || 'Neural Voice',
            audio_url: result.audio_url,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ]);
      }
    } catch (err) {
      if (err && (err.code === 'FREE_LIMIT_REACHED' || err.code === 'CHARACTER_LIMIT_EXCEEDED')) {
        setShowUpgradeModal(true);
        setErrorMessage(err.message || 'Character limit reached.');
      } else {
        console.warn('[Generate] Backend error:', err?.message || err);
        setErrorMessage(err?.message || 'Something went wrong while generating the audio. Please try again.');
      }
    } finally {
      // Release lock
      generateLock.current = false;
      setIsGenerating(false);
    }
  };

  const handleSignOut = () => {
    if (logout) logout();
    if (setActiveTab) setActiveTab('home');
  };

  return (
    <div className="ref-dashboard-container" ref={dropdownRef}>
      
      {/* Upgrade Modal */}
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

      {/* ═══════════════════════════════════════════════════════
          LEFT SIDEBAR NAVIGATION (DESKTOP)
          ═══════════════════════════════════════════════════════ */}
      <aside className="ref-sidebar">
        {/* Top Logo */}
        <div className="ref-sidebar-logo">
          <SoundwaveIcon color="#F0F6FC" size={24} />
          <span className="ref-logo-title">AI VOICE INDIA</span>
        </div>

        {/* Search */}
        <nav className="ref-sidebar-menu">
          <button
            onClick={() => {
              setActiveMenuTab('home');
              setActiveModal(null);
              setShowLangDropdown(true);
            }}
            className={`ref-menu-btn ${showLangDropdown ? 'active-black' : ''}`}
          >
            <Search size={18} />
            <span>Search</span>
          </button>

          {/* ── Divider ── */}
          <div className="ref-sidebar-divider" />

          {/* ── Main Menu ── */}
          <button
            onClick={() => {
              setActiveMenuTab('home');
              setActiveModal(null);
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeMenuTab === 'home' && !activeModal && !showLangDropdown ? 'active-black' : ''}`}
          >
            <Home size={18} />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setActiveMenuTab('pdf');
              setActiveModal(null);
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeMenuTab === 'pdf' && !activeModal ? 'active-black' : ''}`}
          >
            <FileText size={18} />
            <span>PDF to Voice</span>
          </button>

          <button
            onClick={() => {
              if (setActiveTab) setActiveTab('pricing');
              else setActiveModal('pricing');
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeModal === 'pricing' ? 'active-black' : ''}`}
          >
            <Crown size={18} />
            <span>Upgrade</span>
          </button>

          <button
            onClick={() => {
              setActiveModal('api');
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeModal === 'api' ? 'active-black' : ''}`}
          >
            <Code size={18} />
            <span>API Access</span>
          </button>

          {/* ── Divider ── */}
          <div className="ref-sidebar-divider" />

          {/* ── AI Tools ── */}
          <span className="ref-sidebar-section-label">AI Tools</span>

          <button
            onClick={() => {
              setActiveMenuTab('ai-assistant');
              setActiveModal(null);
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeMenuTab === 'ai-assistant' && !activeModal ? 'active-black' : ''}`}
          >
            <Sparkles size={18} />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => {
              setActiveMenuTab('voice-effects');
              setActiveModal(null);
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeMenuTab === 'voice-effects' && !activeModal ? 'active-black' : ''}`}
          >
            <Wand2 size={18} />
            <span>Voice Effects</span>
          </button>

          {/* ── Divider ── */}
          <div className="ref-sidebar-divider" />

          {/* ── Bottom Menu ── */}
          <button
            onClick={() => {
              setActiveModal('creations');
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeModal === 'creations' ? 'active-black' : ''}`}
          >
            <Clock size={18} />
            <span>History</span>
          </button>

          <button
            onClick={() => {
              setActiveMenuTab('help');
              setActiveModal(null);
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeMenuTab === 'help' && !activeModal ? 'active-black' : ''}`}
          >
            <Headphones size={18} />
            <span>Help & Support</span>
          </button>

          <button
            onClick={() => {
              setActiveMenuTab('settings');
              setActiveModal(null);
              setShowLangDropdown(false);
            }}
            className={`ref-menu-btn ${activeMenuTab === 'settings' && !activeModal ? 'active-black' : ''}`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          MAIN DASHBOARD WORKSPACE (RIGHT SIDE)
          ═══════════════════════════════════════════════════════ */}
      <main className="ref-main-workspace">
        
        {/* Top Header: Sign Out button on Top Right */}
        <header className="ref-top-header">
          {/* Mobile hamburger menu toggle */}
          <button
            className="ref-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} color="#F0F6FC" /> : <Menu size={20} color="#F0F6FC" />}
          </button>

          <button onClick={handleSignOut} className="ref-btn-signout" id="dashboard-signout-btn">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="ref-mobile-drawer" onClick={() => setMobileMenuOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ height: '100%' }}>
              <nav className="ref-sidebar-menu">
                <button onClick={() => { setActiveMenuTab('home'); setActiveModal(null); setShowLangDropdown(true); setMobileMenuOpen(false); }} className={`ref-menu-btn ${showLangDropdown ? 'active-black' : ''}`}>
                  <Search size={18} /><span>Search</span>
                </button>
                <div className="ref-sidebar-divider" />
                <button onClick={() => { setActiveMenuTab('home'); setActiveModal(null); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeMenuTab === 'home' && !activeModal && !showLangDropdown ? 'active-black' : ''}`}>
                  <Home size={18} /><span>Home</span>
                </button>
                <button onClick={() => { setActiveMenuTab('pdf'); setActiveModal(null); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeMenuTab === 'pdf' && !activeModal ? 'active-black' : ''}`}>
                  <FileText size={18} /><span>PDF to Voice</span>
                </button>
                <button onClick={() => { if (setActiveTab) setActiveTab('pricing'); else setActiveModal('pricing'); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeModal === 'pricing' ? 'active-black' : ''}`}>
                  <Crown size={18} /><span>Upgrade</span>
                </button>
                <button onClick={() => { setActiveModal('api'); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeModal === 'api' ? 'active-black' : ''}`}>
                  <Code size={18} /><span>API Access</span>
                </button>
                <div className="ref-sidebar-divider" />
                <span className="ref-sidebar-section-label">AI Tools</span>
                <button onClick={() => { setActiveMenuTab('ai-assistant'); setActiveModal(null); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeMenuTab === 'ai-assistant' && !activeModal ? 'active-black' : ''}`}>
                  <Sparkles size={18} /><span>AI Assistant</span>
                </button>
                <button onClick={() => { setActiveMenuTab('voice-effects'); setActiveModal(null); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeMenuTab === 'voice-effects' && !activeModal ? 'active-black' : ''}`}>
                  <Wand2 size={18} /><span>Voice Effects</span>
                </button>
                <div className="ref-sidebar-divider" />
                <button onClick={() => { setActiveModal('creations'); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeModal === 'creations' ? 'active-black' : ''}`}>
                  <Clock size={18} /><span>History</span>
                </button>
                <button onClick={() => { setActiveMenuTab('help'); setActiveModal(null); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeMenuTab === 'help' && !activeModal ? 'active-black' : ''}`}>
                  <Headphones size={18} /><span>Help & Support</span>
                </button>
                <button onClick={() => { setActiveMenuTab('settings'); setActiveModal(null); setShowLangDropdown(false); setMobileMenuOpen(false); }} className={`ref-menu-btn ${activeMenuTab === 'settings' && !activeModal ? 'active-black' : ''}`}>
                  <Settings size={18} /><span>Settings</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        {activeMenuTab === 'pdf' ? (
          <PdfToVoiceView
            voices={voices}
            selectedLang={selectedLang}
            setSelectedLang={setSelectedLang}
            availableLanguages={availableLanguages}
            currentLangObj={currentLangObj}
            combinedVoiceList={combinedVoiceList}
            activeVoiceMeta={activeVoiceMeta}
            selectedVoiceId={selectedVoiceId}
            setSelectedVoiceId={setSelectedVoiceId}
            speed={speed}
            setSpeed={setSpeed}
            pitch={pitch}
            setPitch={setPitch}
            token={token}
            user={user}
            updateUser={updateUser}
            onOpenUpgrade={onOpenUpgrade}
            setShowUpgradeModal={setShowUpgradeModal}
          />
        ) : activeMenuTab === 'ai-assistant' ? (
          <AiAssistantView
            token={token}
            user={user}
            onGenerateVoiceForText={(aiText) => {
              setText(aiText);
              setActiveMenuTab('home');
              setActiveModal(null);
            }}
          />
        ) : activeMenuTab === 'voice-effects' ? (
          <VoiceEffectsView
            inputAudioUrl={generationResult?.audio_url}
            generationResult={generationResult}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        ) : activeMenuTab === 'help' ? (
          <HelpSupportView
            user={user}
            token={token}
          />
        ) : activeMenuTab === 'settings' ? (
          <SettingsView
            user={user}
            token={token}
            onOpenUpgrade={onOpenUpgrade}
            setActiveMenuTab={setActiveMenuTab}
          />
        ) : (
          <>
            {/* Center Hero Section */}
            <section className="ref-hero-section">
              {/* Peacock Logo with Blue Glow */}
              <div className="ref-hero-logo-wrap">
                <img
                  src="/peacock-logo-transparent.png"
                  alt="Peacock Logo"
                  className="ref-hero-logo"
                />
              </div>

              {/* Heading */}
              <h1 className="ref-hero-heading">
                <span className="hero-text-white">Create something </span>
                <span className="hero-text-blue">new today</span>
              </h1>

              {/* Subtitle */}
              <p className="ref-hero-subtitle-new">
                Ask any question, generate voiceover scripts, or choose an example prompt below.
              </p>

              {/* Four Example Prompt Cards */}
              <div className="ref-ai-prompts-grid" style={{ marginTop: '32px', width: '100%', maxWidth: '720px' }}>
                {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setText(prompt.sampleText || prompt.title)}
                    className="ref-ai-prompt-card"
                  >
                    <div className="ref-ai-prompt-top">
                      <span className="ref-ai-prompt-title">{prompt.title}</span>
                      <ArrowRight size={15} color="#8B949E" className="ref-ai-prompt-arrow" />
                    </div>
                    <span className="ref-ai-prompt-desc">{prompt.desc}</span>
                  </button>
                ))}
              </div>
            </section>


            {/* Workspace 2-Column Grid */}
            <div className="ref-workspace-grid">
              
              {/* Row 1, Column 1: Language & Voice Selectors (exact same width as text editor) */}
              <div className="sel-row">

                {/* ── Language Selector ── */}
                <div className="sel-group ref-dropdown-wrapper">
                  <div className="sel-label">
                    <Globe size={14} color="#8B949E" />
                    <span>Language</span>
                  </div>
                  <button
                    type="button"
                    className={`sel-trigger ${!hasSelectedLang ? 'sel-trigger-placeholder' : ''}`}
                    id="dropdown-language-btn"
                    onClick={() => {
                      setShowLangDropdown(!showLangDropdown);
                      setShowVoiceDropdown(false);
                    }}
                  >
                    <span className="sel-trigger-value">
                      {hasSelectedLang
                        ? getCleanLangName(currentLangObj)
                        : 'Select Language'}
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
                            className={`ref-popup-item ${selectedLang === l.code && hasSelectedLang ? 'selected' : ''}`}
                            onClick={() => {
                              if (setSelectedLang) setSelectedLang(l.code);
                              setHasSelectedLang(true);
                              setHasSelectedVoice(false);
                              setSelectedVoiceId('');
                              setShowLangDropdown(false);
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{getCleanLangName(l)}</span>
                            {selectedLang === l.code && hasSelectedLang && <Check size={14} color="#2F81F7" style={{ marginLeft: 'auto' }} />}
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
                    className={`sel-trigger ${!hasSelectedVoice ? 'sel-trigger-placeholder' : ''}`}
                    id="dropdown-voice-btn"
                    onClick={() => {
                      setShowVoiceDropdown(!showVoiceDropdown);
                      setShowLangDropdown(false);
                    }}
                  >
                    <span className="sel-trigger-value">
                      {hasSelectedVoice && activeVoiceMeta && activeVoiceMeta.name
                        ? getCleanVoiceName(activeVoiceMeta)
                        : (combinedVoiceList.length === 0 && hasSelectedLang ? 'No voice available' : 'Select Voice')}
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
                              className={`ref-popup-item ${selectedVoiceId === v.id && hasSelectedVoice ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedVoiceId(v.id || '');
                                setHasSelectedVoice(true);
                                setShowVoiceDropdown(false);
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{getCleanVoiceName(v)}</span>
                              {selectedVoiceId === v.id && hasSelectedVoice && <Check size={14} color="#2F81F7" style={{ marginLeft: 'auto' }} />}
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

              {/* ── LEFT COLUMN (Text Input + Audio Player + Feedback) ── */}
              <div className="ref-left-column">

                {/* Card 1: Text Input Section Container */}
                <div
                  className={`ref-text-card ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Header Row: "Enter your text" title + Copy & Delete buttons */}
                  <div className="ref-text-card-header">
                    <span className="ref-text-card-title">Enter your text</span>
                    <div className="ref-text-card-btns">
                      <button
                        type="button"
                        onClick={handleCopyText}
                        className="ref-tcbtn"
                        title="Copy text"
                      >
                        {copiedText ? <Check size={15} color="#3fb950" /> : <Copy size={15} color="#C9D1D9" />}
                        <span>{copiedText ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteText}
                        className="ref-tcbtn"
                        title="Delete text"
                      >
                        <Trash2 size={15} color="#C9D1D9" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Four Quick Prompt Chips */}
                  <div className="ref-prompt-chips">
                    {['YouTube Script', 'Podcast', 'Story', 'Announcement'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="ref-chip"
                        onClick={() => handleChipClick(chip)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 1000))}
                    placeholder="Type or paste your text here..."
                    maxLength={1000}
                    className="ref-textarea"
                    id="dashboard-textarea"
                  />

                  {/* Character counter bottom-right */}
                  <div className="ref-text-card-footer">
                    <span className="ref-char-counter">{charCount} / 1000</span>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="ref-error-banner">
                    <AlertCircle size={16} color="#f87171" />
                    <span>{errorMessage}</span>
                    <X size={14} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setErrorMessage('')} />
                  </div>
                )}

                {/* Card 2: Generated Audio Player Bar */}
                <AudioPlayer
                  audioUrl={generationResult?.audio_url}
                  filename={generationResult?.filename}
                  onSaveVoice={handleSaveVoice}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />

                {/* Card 3: Feedback / Rating Section */}
                <div className="ref-card ref-feedback-card">
                  {!feedbackSubmitted ? (
                    <>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F0F6FC', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                        Rate your experience
                      </h3>

                      {/* 5 Star Rating Row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          marginBottom: '20px',
                          width: '100%'
                        }}
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {[1, 2, 3, 4, 5].map((star) => {
                          const active = star <= (hoverRating || rating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => {
                                setRating(star);
                                setFeedbackError('');
                              }}
                              onMouseEnter={() => setHoverRating(star)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '4px',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease',
                                transform: active ? 'scale(1.15)' : 'scale(1.0)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            >
                              <Star
                                size={30}
                                color={active ? '#2F81F7' : '#30363D'}
                                fill={active ? '#2F81F7' : 'none'}
                                strokeWidth={1.6}
                              />
                            </button>
                          );
                        })}
                      </div>

                      {feedbackError && (
                        <div style={{ fontSize: '0.82rem', color: '#f87171', marginBottom: '12px', fontWeight: 500 }}>
                          {feedbackError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (rating === 0) {
                            setFeedbackError('Please select a star rating first.');
                            return;
                          }
                          setFeedbackError('');
                          setFeedbackSubmitted(true);
                        }}
                        className="ref-feedback-submit-btn"
                      >
                        Submit Feedback
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: '12px 0', width: '100%', textAlign: 'center' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(47, 129, 247, 0.15)',
                        border: '1px solid #2F81F7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px'
                      }}>
                        <Check size={22} color="#2F81F7" />
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F0F6FC', marginBottom: '6px' }}>
                        Thank you for your feedback!
                      </h4>
                      <p style={{ fontSize: '0.86rem', color: '#8B949E', margin: 0 }}>
                        We appreciate your input to make AI Voice India even better.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackSubmitted(false);
                          setRating(0);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#8B949E',
                          fontSize: '0.78rem',
                          marginTop: '14px',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Submit another rating
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* ── RIGHT COLUMN: Voice Control Panel ── */}
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
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
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
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="ref-black-slider"
                      aria-label="Pitch slider"
                    />
                    <div className="ref-slider-limits">
                      <span>0.5x</span>
                      <span>5x</span>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="ref-slider-group">
                    <div className="ref-slider-meta">
                      <span>Volume</span>
                      <span className="ref-slider-value">{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="ref-black-slider"
                      aria-label="Volume slider"
                    />
                    <div className="ref-slider-limits">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Large Primary Generate Button with Waveform Icon */}
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !text.trim()}
                    className="ref-btn-generate-blue"
                    id="btn-generate-voice"
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
          </>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════
          FEATURE MODALS (Creations, API Access, About, Help)
          ═══════════════════════════════════════════════════════ */}
      {activeModal && (
        <div className="ref-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ref-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ref-modal-header">
              <h3>
                {activeModal === 'creations' && 'My Audio Creations'}
                {activeModal === 'api' && 'AI Voice India API Access'}
                {activeModal === 'about' && 'About AI Voice India'}
                {activeModal === 'help' && 'Help and Support'}
                {activeModal === 'pricing' && 'Plans & Pricing'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="ref-modal-close"><X size={18} color="#8B949E" /></button>
            </div>

            <div className="ref-modal-body">
              {activeModal === 'creations' && (
                <div>
                  {creationsHistory.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {creationsHistory.map(item => (
                        <div key={item.id} style={{ padding: '12px', background: '#0D1117', borderRadius: '10px', border: '1px solid #30363D' }}>
                          <div style={{ fontWeight: 600, color: '#F0F6FC', marginBottom: '4px' }}>{item.text}</div>
                          <div style={{ fontSize: '0.78rem', color: '#8B949E', display: 'flex', gap: '12px' }}>
                            <span>🌐 {item.language}</span>
                            <span>🎙️ {item.voice}</span>
                            <span>🕒 {item.date}</span>
                          </div>
                          <audio src={item.audio_url} controls style={{ width: '100%', marginTop: '8px', height: '32px' }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#8B949E', textAlign: 'center', padding: '24px' }}>No generated audio yet in this session. Click "Generate Voice" to create your first speech!</p>
                  )}
                </div>
              )}

              {activeModal === 'api' && (
                <div style={{ fontSize: '0.9rem', color: '#8B949E' }}>
                  <p style={{ marginBottom: '12px', color: '#F0F6FC' }}>Integrate AI Voice India directly into your applications using our high-speed REST API.</p>
                  <pre style={{ background: '#0D1117', color: '#F0F6FC', border: '1px solid #30363D', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', overflowX: 'auto' }}>
{`POST /api/generate
Header: Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "text": "Namaste",
  "language": "hi",
  "voice_id": "hi-IN-Neural",
  "speed": 1.0,
  "pitch": 0.5
}`}
                  </pre>
                </div>
              )}

              {activeModal === 'about' && (
                <div style={{ fontSize: '0.9rem', color: '#8B949E', lineHeight: '1.6' }}>
                  <p><strong style={{ color: '#F0F6FC' }}>AI VOICE INDIA</strong> is built specifically for Indian creators, businesses, and developers, supporting 22+ regional languages with natural pitch & speed modulation.</p>
                </div>
              )}

              {activeModal === 'help' && (
                <div style={{ fontSize: '0.9rem', color: '#8B949E' }}>
                  <p style={{ marginBottom: '8px', color: '#F0F6FC' }}><strong>How to adjust speed & pitch?</strong></p>
                  <p style={{ color: '#8B949E', marginBottom: '16px' }}>Use the Voice Control panel on the right sidebar to change speed (0.5x to 5x) and pitch (0.5x to 5x).</p>
                  <p style={{ marginBottom: '8px', color: '#F0F6FC' }}><strong>Need custom voices or Enterprise plan?</strong></p>
                  <p style={{ color: '#8B949E' }}>Contact our support team at support@aivoiceindia.in</p>
                </div>
              )}

              {activeModal === 'pricing' && (
                <div>
                  <p style={{ marginBottom: '12px', color: '#8B949E' }}>Choose a plan that fits your creation needs:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '14px', border: '1px solid #30363D', background: '#0D1117', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#F0F6FC' }}>Free Plan</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '6px 0', color: '#2F81F7' }}>₹0</div>
                      <div style={{ fontSize: '0.78rem', color: '#8B949E' }}>1,000 chars</div>
                    </div>
                    <div style={{ padding: '14px', border: '1px solid #30363D', background: '#0D1117', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#F0F6FC' }}>Pro Plan</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '6px 0', color: '#2F81F7' }}>₹129</div>
                      <div style={{ fontSize: '0.78rem', color: '#8B949E' }}>20,000 chars</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

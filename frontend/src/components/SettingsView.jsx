import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Sun, Moon, Laptop, Volume2, Sliders, Mic, Globe,
  Bell, Download, Shield, Trash2, Key, Copy, Check, Crown, Info, RefreshCw,
  Eye, EyeOff, Lock, LogOut, AlertTriangle, ExternalLink, HelpCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  fetchUserSettings,
  saveUserSettings,
  changeUserPassword,
  deleteUserAccount
} from '../services/api';

const GOOGLE_TTS_VOICES = [
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (Female) – English (India)' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat (Male) – English (India)' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara (Female) – Hindi (India)' },
  { id: 'hi-IN-MadhurNeural', name: 'Madhur (Male) – Hindi (India)' },
  { id: 'kn-IN-GaganNeural', name: 'Gagan (Male) – Kannada (India)' },
  { id: 'kn-IN-SapnaNeural', name: 'Sapna (Female) – Kannada (India)' },
  { id: 'ta-IN-PallaviNeural', name: 'Pallavi (Female) – Tamil (India)' },
  { id: 'te-IN-MohanNeural', name: 'Mohan (Male) – Telugu (India)' },
  { id: 'ml-IN-MidhunNeural', name: 'Midhun (Male) – Malayalam (India)' },
  { id: 'mr-IN-AarohiNeural', name: 'Aarohi (Female) – Marathi (India)' }
];

const LANGUAGES = [
  { code: 'en', name: 'English (India)' },
  { code: 'kn', name: 'Kannada (India)' },
  { code: 'hi', name: 'Hindi (India)' },
  { code: 'ta', name: 'Tamil (India)' },
  { code: 'te', name: 'Telugu (India)' },
  { code: 'ml', name: 'Malayalam (India)' }
];

export default function SettingsView({
  user = null,
  token = null,
  onOpenUpgrade = null,
  setActiveMenuTab = null
}) {
  const { theme, setTheme } = useTheme() || {};

  // Settings State
  const [selectedTheme, setSelectedTheme] = useState(theme || 'dark');
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0.5);
  const [defaultVoice, setDefaultVoice] = useState('en-IN-NeerjaNeural');
  const [language, setLanguage] = useState('en');

  // Notification Toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [supportNotifications, setSupportNotifications] = useState(true);

  // Download Quality
  const [downloadFormat, setDownloadFormat] = useState('mp3');

  // API Key & Usage
  const [apiKey, setApiKey] = useState('aivi_live_9k82j7m3x410');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Feedback Banners
  const [saveSuccess, setSaveSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal Dialogs
  const [activeModal, setActiveModal] = useState(null); // 'password', 'delete-account', 'clear-history', 'policy', 'terms'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Load user settings on mount
  useEffect(() => {
    // Load from localStorage first
    const saved = localStorage.getItem('aivi_user_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.theme) setSelectedTheme(parsed.theme);
        if (parsed.volume !== undefined) setVolume(parsed.volume);
        if (parsed.speed !== undefined) setSpeed(parsed.speed);
        if (parsed.pitch !== undefined) setPitch(parsed.pitch);
        if (parsed.defaultVoice) setDefaultVoice(parsed.defaultVoice);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.emailNotifications !== undefined) setEmailNotifications(parsed.emailNotifications);
        if (parsed.productUpdates !== undefined) setProductUpdates(parsed.productUpdates);
        if (parsed.supportNotifications !== undefined) setSupportNotifications(parsed.supportNotifications);
        if (parsed.downloadFormat) setDownloadFormat(parsed.downloadFormat);
      } catch (e) {}
    }

    // Fetch from backend if logged in
    if (token) {
      fetchUserSettings(token).then((res) => {
        if (res && res.settings) {
          const s = res.settings;
          if (s.volume !== undefined) setVolume(s.volume);
          if (s.speed !== undefined) setSpeed(s.speed);
          if (s.pitch !== undefined) setPitch(s.pitch);
          if (s.defaultVoice) setDefaultVoice(s.defaultVoice);
          if (s.language) setLanguage(s.language);
          if (s.emailNotifications !== undefined) setEmailNotifications(s.emailNotifications);
          if (s.productUpdates !== undefined) setProductUpdates(s.productUpdates);
          if (s.supportNotifications !== undefined) setSupportNotifications(s.supportNotifications);
          if (s.downloadFormat) setDownloadFormat(s.downloadFormat);
        }
        if (res && res.api_key) {
          setApiKey(res.api_key);
        }
      }).catch(console.error);
    }
  }, [token]);

  // Handle Theme Change
  const handleThemeChange = (newTheme) => {
    setSelectedTheme(newTheme);
    if (setTheme) {
      setTheme(newTheme);
    }
    document.documentElement.setAttribute('data-theme', newTheme);
    triggerAutoSave({ theme: newTheme });
  };

  // Save all settings handler
  const triggerAutoSave = (extra = {}) => {
    const payload = {
      theme: selectedTheme,
      volume,
      speed,
      pitch,
      defaultVoice,
      language,
      emailNotifications,
      productUpdates,
      supportNotifications,
      downloadFormat,
      ...extra
    };
    localStorage.setItem('aivi_user_settings', JSON.stringify(payload));

    if (token) {
      saveUserSettings(payload, token).catch(console.error);
    }

    setSaveSuccess('Preferences saved successfully.');
    setTimeout(() => setSaveSuccess(''), 2500);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (!currentPassword) {
      setModalError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setModalError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError('New password and confirmation do not match.');
      return;
    }

    setModalLoading(true);
    try {
      await changeUserPassword({ currentPassword, newPassword }, token);
      setModalSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setActiveModal(null);
        setModalSuccess('');
      }, 1500);
    } catch (err) {
      setModalError(err.message || 'Failed to change password.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem('aivi_creations_history');
    setSaveSuccess('Voice creation history cleared.');
    setActiveModal(null);
    setTimeout(() => setSaveSuccess(''), 2500);
  };

  const handleDeleteAccountSubmit = async () => {
    setModalLoading(true);
    try {
      await deleteUserAccount(token);
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      setModalError(err.message || 'Failed to delete account.');
      setModalLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '920px', margin: '0 auto', paddingBottom: '50px' }}>
      
      {/* ═══════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(37, 99, 235, 0.15)', border: '1px solid #2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <SettingsIcon size={18} color="#2563EB" />
          </div>
          <h1 style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            color: '#F0F6FC',
            letterSpacing: '-0.02em',
            margin: 0,
            fontFamily: 'Outfit, var(--font-sans)'
          }}>
            Settings
          </h1>
        </div>
        <p style={{ color: '#8B949E', fontSize: '0.92rem', margin: 0 }}>
          Customize your AI Voice India experience.
        </p>
      </div>

      {/* Global Toast Save Banner */}
      {saveSuccess && (
        <div style={{
          background: 'rgba(46, 160, 67, 0.15)',
          border: '1px solid rgba(46, 160, 67, 0.35)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          color: '#3FB950',
          fontSize: '0.88rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Check size={18} color="#3FB950" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SETTINGS CARDS GRID
          ═══════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ── CARD 1: THEME ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Sun size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>1. Theme</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Select your interface color theme.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Laptop }
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  style={{
                    background: isSelected ? 'rgba(37, 99, 235, 0.15)' : '#0D1117',
                    border: isSelected ? '2px solid #2563EB' : '1px solid #30363D',
                    color: isSelected ? '#FFFFFF' : '#8B949E',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    fontSize: '0.86rem',
                    transition: 'all 200ms ease'
                  }}
                >
                  <Icon size={20} color={isSelected ? '#2563EB' : 'currentColor'} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CARD 2: AUDIO SETTINGS ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>2. Audio Settings</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Configure default volume, speed, and pitch levels.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Volume Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#C9D1D9', marginBottom: '6px' }}>
                <span>Default Volume</span>
                <span style={{ color: '#2563EB' }}>{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="ref-black-slider"
                style={{ width: '100%' }}
              />
            </div>

            {/* Speed Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#C9D1D9', marginBottom: '6px' }}>
                <span>Default Speed</span>
                <span style={{ color: '#2563EB' }}>{speed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="ref-black-slider"
                style={{ width: '100%' }}
              />
            </div>

            {/* Pitch Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#C9D1D9', marginBottom: '6px' }}>
                <span>Default Pitch</span>
                <span style={{ color: '#2563EB' }}>{pitch.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="ref-black-slider"
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={() => triggerAutoSave()}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              Save Preferences
            </button>
          </div>
        </div>

        {/* ── CARD 3: DEFAULT VOICE ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Mic size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>3. Default Voice</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Select your default Google TTS neural voice model.</p>
            </div>
          </div>

          <select
            value={defaultVoice}
            onChange={(e) => {
              setDefaultVoice(e.target.value);
              triggerAutoSave({ defaultVoice: e.target.value });
            }}
            style={{
              width: '100%',
              background: '#0D1117',
              border: '1px solid #30363D',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#F0F6FC',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {GOOGLE_TTS_VOICES.map((v) => (
              <option key={v.id} value={v.id} style={{ background: '#161B22', color: '#F0F6FC' }}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── CARD 4: LANGUAGE ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Globe size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>4. Language</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Choose your primary regional language.</p>
            </div>
          </div>

          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              triggerAutoSave({ language: e.target.value });
            }}
            style={{
              width: '100%',
              background: '#0D1117',
              border: '1px solid #30363D',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#F0F6FC',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} style={{ background: '#161B22', color: '#F0F6FC' }}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── CARD 5: NOTIFICATIONS ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Bell size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>5. Notifications</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Manage notification preferences.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Email notifications', desc: 'Receive account & usage alert emails', state: emailNotifications, set: setEmailNotifications, key: 'emailNotifications' },
              { label: 'Product updates', desc: 'News about new voices, models, and features', state: productUpdates, set: setProductUpdates, key: 'productUpdates' },
              { label: 'Support reply notifications', desc: 'Notify when support team replies to your tickets', state: supportNotifications, set: setSupportNotifications, key: 'supportNotifications' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F0F6FC' }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#8B949E' }}>{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !item.state;
                    item.set(nextVal);
                    triggerAutoSave({ [item.key]: nextVal });
                  }}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '999px',
                    background: item.state ? '#2563EB' : '#30363D',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 200ms ease'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    position: 'absolute',
                    top: '3px',
                    left: item.state ? '25px' : '3px',
                    transition: 'left 200ms ease'
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── CARD 6: DOWNLOAD QUALITY ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Download size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>6. Download Quality</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Select your default output audio format.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {['mp3', 'wav'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => {
                  setDownloadFormat(fmt);
                  triggerAutoSave({ downloadFormat: fmt });
                }}
                style={{
                  flex: 1,
                  background: downloadFormat === fmt ? 'rgba(37, 99, 235, 0.15)' : '#0D1117',
                  border: downloadFormat === fmt ? '2px solid #2563EB' : '1px solid #30363D',
                  color: downloadFormat === fmt ? '#FFFFFF' : '#8B949E',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 200ms ease'
                }}
              >
                {fmt} ({fmt === 'mp3' ? 'Compressed, Fast' : 'Lossless Studio'})
              </button>
            ))}
          </div>
        </div>

        {/* ── CARD 7: PRIVACY & SECURITY ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>7. Privacy & Security</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Manage password, sessions, and account credentials.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveModal('password')}
              style={{
                background: '#21262d',
                border: '1px solid #30363D',
                color: '#F0F6FC',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Lock size={15} color="#2563EB" />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('aiv_token');
                localStorage.removeItem('aivi_token');
                window.location.reload();
              }}
              style={{
                background: '#21262d',
                border: '1px solid #30363D',
                color: '#F0F6FC',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <LogOut size={15} color="#F59E0B" />
              <span>Sign Out All Devices</span>
            </button>

            <button
              onClick={() => setActiveModal('delete-account')}
              style={{
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                color: '#F87171',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Trash2 size={15} color="#F87171" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        {/* ── CARD 8: HISTORY SETTINGS ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Trash2 size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>8. History Settings</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Manage generated audio creation history logs.</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal('clear-history')}
            style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: '#F87171',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={15} color="#F87171" />
            <span>Clear Voice History</span>
          </button>
        </div>

        {/* ── CARD 9: API SETTINGS ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Key size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>9. API Settings</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Access keys and track API integration usage.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1,
                background: '#0D1117',
                border: '1px solid #30363D',
                borderRadius: '8px',
                padding: '10px 14px',
                fontFamily: 'monospace',
                color: '#F0F6FC',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{showApiKey ? apiKey : '••••••••••••••••••••••••••••••••'}</span>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{ background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer' }}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                onClick={handleCopyApiKey}
                style={{
                  background: '#21262d',
                  border: '1px solid #30363D',
                  color: '#F0F6FC',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copiedKey ? <Check size={16} color="#3FB950" /> : <Copy size={16} color="#8B949E" />}
                <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#8B949E', display: 'flex', gap: '16px' }}>
              <span>Monthly Quota: <strong style={{ color: '#F0F6FC' }}>1,000 / 1,000 chars</strong></span>
              <span>API Endpoint: <strong style={{ color: '#2563EB' }}>POST /api/generate</strong></span>
            </div>
          </div>
        </div>

        {/* ── CARD 10: BILLING & SUBSCRIPTION ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Crown size={20} color="#2563EB" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>10. Billing & Subscription</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>Manage plan, limits, and billing details.</p>
            </div>
          </div>

          <div style={{
            background: '#0D1117',
            border: '1px solid #30363D',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#8B949E' }}>Current Active Plan</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F0F6FC', textTransform: 'capitalize' }}>
                {user?.plan || 'Free Plan'}
              </div>
            </div>

            <button
              onClick={() => {
                if (onOpenUpgrade) onOpenUpgrade();
              }}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* ── CARD 11: ABOUT ── */}
        <div className="ref-card" style={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '16px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <img
              src="/peacock-logo-transparent.png"
              alt="AI Voice India"
              style={{ width: '36px', height: '36px', filter: 'drop-shadow(0 0 6px rgba(37,99,235,0.8))' }}
            />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F0F6FC', margin: 0 }}>11. About</h3>
              <p style={{ fontSize: '0.82rem', color: '#8B949E', margin: '2px 0 0' }}>AI Voice India v1.4.0 Neural Edition</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <button
              onClick={() => setActiveModal('policy')}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveModal('terms')}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Terms of Service
            </button>
            <button
              onClick={() => {
                if (setActiveMenuTab) setActiveMenuTab('help');
              }}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Contact Support
            </button>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL DIALOGS (Password, Clear History, Delete Account, Policy)
          ═══════════════════════════════════════════════════════ */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={() => setActiveModal(null)}>
          
          <div style={{
            background: '#161B22', border: '1px solid #30363D', borderRadius: '16px',
            width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
          }} onClick={(e) => e.stopPropagation()}>

            {/* Change Password Modal */}
            {activeModal === 'password' && (
              <form onSubmit={handleChangePasswordSubmit}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F0F6FC', marginBottom: '16px' }}>Change Password</h3>
                {modalError && <div style={{ color: '#F87171', fontSize: '0.82rem', marginBottom: '12px' }}>{modalError}</div>}
                {modalSuccess && <div style={{ color: '#3FB950', fontSize: '0.82rem', marginBottom: '12px' }}>{modalSuccess}</div>}

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#8B949E', display: 'block', marginBottom: '4px' }}>Current Password</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#0D1117', border: '1px solid #30363D', borderRadius: '8px', color: '#F0F6FC' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#8B949E', display: 'block', marginBottom: '4px' }}>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#0D1117', border: '1px solid #30363D', borderRadius: '8px', color: '#F0F6FC' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#8B949E', display: 'block', marginBottom: '4px' }}>Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#0D1117', border: '1px solid #30363D', borderRadius: '8px', color: '#F0F6FC' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setActiveModal(null)} style={{ background: '#21262d', border: '1px solid #30363D', color: '#F0F6FC', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={modalLoading} style={{ background: '#2563EB', border: 'none', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Save Password</button>
                </div>
              </form>
            )}

            {/* Clear History Confirmation Modal */}
            {activeModal === 'clear-history' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F0F6FC', marginBottom: '12px' }}>Clear Voice History</h3>
                <p style={{ color: '#8B949E', fontSize: '0.9rem', marginBottom: '20px' }}>Are you sure you want to clear your local audio generation history?</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setActiveModal(null)} style={{ background: '#21262d', border: '1px solid #30363D', color: '#F0F6FC', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleClearHistory} style={{ background: '#EF4444', border: 'none', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Clear History</button>
                </div>
              </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {activeModal === 'delete-account' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F87171', marginBottom: '12px' }}>Delete Account</h3>
                <p style={{ color: '#8B949E', fontSize: '0.9rem', marginBottom: '20px' }}>This action is permanent and will permanently delete your user account and saved data.</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setActiveModal(null)} style={{ background: '#21262d', border: '1px solid #30363D', color: '#F0F6FC', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleDeleteAccountSubmit} disabled={modalLoading} style={{ background: '#EF4444', border: 'none', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Confirm Delete</button>
                </div>
              </div>
            )}

            {/* Privacy Policy / Terms Modal */}
            {(activeModal === 'policy' || activeModal === 'terms') && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F0F6FC', marginBottom: '12px' }}>
                  {activeModal === 'policy' ? 'Privacy Policy' : 'Terms of Service'}
                </h3>
                <div style={{ color: '#8B949E', fontSize: '0.85rem', lineHeight: '1.6', maxHeight: '240px', overflowY: 'auto', marginBottom: '20px' }}>
                  AI Voice India is committed to protecting your privacy and security. We do not store or sell your private voice input data. All audio processing is handled with high security standards.
                </div>
                <button onClick={() => setActiveModal(null)} style={{ background: '#2563EB', border: 'none', color: '#FFFFFF', width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

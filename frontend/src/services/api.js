/**
 * AI VOICE INDIA — Frontend API Client
 * 
 * Supports both local development (via Vite proxy /api)
 * and production public deployment (via VITE_API_URL environment variable).
 */

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const API_BASE = RAW_API_URL ? `${RAW_API_URL}/api` : '/api';

/**
 * Resolves a relative audio URL to a fully qualified URL if VITE_API_URL is configured
 */
export function resolveAudioUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return RAW_API_URL ? `${RAW_API_URL}${url}` : url;
}

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend offline or health unreachable:', err);
    return {
      status: 'offline',
      cost_mode: '₹0 Demo Mode (Browser/Local Fallback)',
      engine: 'Browser Speech Synthesis'
    };
  }
}

export async function fetchLanguages() {
  try {
    const res = await fetch(`${API_BASE}/languages`);
    if (!res.ok) throw new Error('Failed to load languages');
    return await res.json();
  } catch (err) {
    console.warn('Using local language list fallback');
    return { languages: [] };
  }
}

export async function fetchVoices(language = '') {
  try {
    const url = language ? `${API_BASE}/voices?language=${encodeURIComponent(language)}` : `${API_BASE}/voices`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load voices');
    return await res.json();
  } catch (err) {
    console.warn('Using local voices fallback');
    return { voices: [] };
  }
}

export async function fetchProviders() {
  try {
    const res = await fetch(`${API_BASE}/providers`);
    if (!res.ok) throw new Error('Failed to load providers');
    return await res.json();
  } catch (err) {
    return {
      providers: [
        { id: 'demo', name: 'Zero-Cost Free Mode', is_free: true, cost: '₹0 (Free)' }
      ]
    };
  }
}

export async function normalizeText(text, language = 'en') {
  try {
    const res = await fetch(`${API_BASE}/normalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });
    if (!res.ok) throw new Error('Normalization error');
    return await res.json();
  } catch (err) {
    return { original_text: text, normalized_text: text, language };
  }
}

export async function generateSpeech({
  text,
  language,
  voiceId,
  speed = 1.0,
  pitch = 0.0,
  style = null,
  normalizeText = true
}) {
  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language,
        voice_id: voiceId,
        speed,
        pitch,
        style,
        normalize_text: normalizeText
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Something went wrong while generating the audio. Please try again.');
    }

    const data = await res.json();
    if (data && data.audio_url) {
      data.audio_url = resolveAudioUrl(data.audio_url);
    }
    return data;
  } catch (err) {
    // If backend connection fails, provide clear friendly message
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Voice service is currently offline. Please start the backend and try again.');
    }
    throw err;
  }
}

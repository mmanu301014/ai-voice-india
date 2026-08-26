/**
 * AI VOICE INDIA — Frontend API Client
 * 
 * Supports both local development (via Vite proxy /api)
 * and production public deployment (via VITE_API_URL environment variable).
 */

const getBackendHost = () => {
  let envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    // If protocol is omitted (e.g. "ai-voice-india-backend-production.up.railway.app"), prepend https:// (or http:// for localhost)
    if (!/^https?:\/\//i.test(envUrl) && !envUrl.startsWith('/')) {
      envUrl = (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))
        ? `http://${envUrl}`
        : `https://${envUrl}`;
    }
    return envUrl.replace(/\/+$/, '').replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      return 'https://ai-voice-india-backend-production.up.railway.app';
    }
  }
  return '';
};

const RAW_API_URL = getBackendHost();
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

// ── Auth API ─────────────────────────────────────────────────────────────────

/**
 * Safely parse a JSON response body.
 * Returns null if the body is empty or not valid JSON,
 * so callers never crash with "Unexpected end of JSON input".
 */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Extract a human-readable error message from a FastAPI error response body.
 */
function extractDetail(data, status, fallback) {
  if (status >= 500 && !data) {
    return 'Unable to reach the backend server. Please verify the backend is running.';
  }
  if (status >= 500 && data) {
    const detail = data.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    return `Backend server error (HTTP ${status}). Please check backend logs.`;
  }
  if (status === 404) {
    return 'API endpoint not found (HTTP 404). Please verify backend deployment.';
  }
  if (status === 401) {
    if (data && typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    return 'Incorrect email or password. If you have not registered an account yet, please sign up.';
  }
  if (status === 409) {
    if (data && typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    return 'An account with this email already exists.';
  }
  if (!data) {
    return fallback;
  }
  const detail = data.detail;
  if (Array.isArray(detail)) {
    return detail.map(d => d.msg || (typeof d === 'object' ? JSON.stringify(d) : String(d))).join(', ');
  }
  return typeof detail === 'string' && detail.trim() ? detail : fallback;
}

export async function registerUser({ name, email, password }) {
  let res;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  try {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    });
  } catch (networkErr) {
    console.error('[Auth API] Network / connection error during registration:', networkErr);
    throw new Error('Unable to connect to the authentication server. Please check your internet connection and backend status.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Registration failed.'));
  }
  return data;
}

export async function loginUser({ email, password }) {
  let res;
  const cleanEmail = (email || '').trim().toLowerCase();
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
  } catch (networkErr) {
    console.error('[Auth API] Network / connection error during login:', networkErr);
    throw new Error('Unable to connect to the authentication server. Please check your internet connection and backend status.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Login failed. Please check your credentials.'));
  }
  return data;
}

export async function fetchCurrentUser(token) {
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error('Invalid or expired token.');
  }
  if (!res.ok) throw new Error('Invalid or expired token.');
  const data = await safeJson(res);
  if (!data) throw new Error('Invalid or expired token.');
  return data;
}


// ── Payments API ─────────────────────────────────────────────────────────────

export async function fetchPaymentConfig() {
  try {
    const res = await fetch(`${API_BASE}/payments/config`);
    if (!res.ok) throw new Error('Failed to load payment configuration');
    return await res.json();
  } catch (err) {
    console.warn('Payment config fallback:', err);
    return null;
  }
}

export async function createPaymentOrder(planId, token) {
  let res;
  try {
    res = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan: planId })
    });
  } catch (networkErr) {
    throw new Error('Cannot reach the payment server. Please make sure the backend is running.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Failed to create payment order.'));
  }
  return data;
}

export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, token) {
  let res;
  try {
    res = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      })
    });
  } catch (networkErr) {
    throw new Error('Cannot reach payment verification server.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Payment verification failed.'));
  }
  return data;
}

export async function fetchPaymentHistory(token) {
  try {
    const res = await fetch(`${API_BASE}/payments/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return { history: [], total: 0 };
    return await res.json();
  } catch (err) {
    return { history: [], total: 0 };
  }
}

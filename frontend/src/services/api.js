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
 * Differentiates:
 *  - Proxy 5xx with empty body → backend is not running
 *  - Real backend 5xx with JSON detail → actual server crash
 *  - 401 → wrong credentials
 *  - 409 → duplicate email
 */
function extractDetail(data, status, fallback) {
  if (status >= 500 && !data) {
    // Vite dev proxy returns 500 with empty body when backend is unreachable
    return 'Cannot reach the backend server. Please make sure the FastAPI backend is running on port 8000.';
  }
  if (status >= 500 && data) {
    // Backend is running but the route itself crashed — show the backend's detail
    const detail = data.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    return `Backend server error (HTTP ${status}). Please check the backend terminal for details.`;
  }
  if (!data) {
    if (status === 401) return 'Incorrect email or password.';
    if (status === 404) return 'API endpoint not found (HTTP 404).';
    if (status === 409) return 'An account with this email already exists.';
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
    throw new Error('Cannot reach the server. Please make sure the FastAPI backend is running on port 8000.');
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
    throw new Error('Cannot reach the server. Please make sure the FastAPI backend is running on port 8000.');
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

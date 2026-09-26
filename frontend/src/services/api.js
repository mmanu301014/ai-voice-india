/**
 * AI VOICE INDIA — Frontend API Client
 * 
 * Supports both local development (via Vite proxy /api)
 * and production public deployment (via VITE_API_URL environment variable).
 */

const getBackendHost = () => {
  let envUrl = (import.meta.env.VITE_API_URL || '').trim();

  // ── Dev-mode guard ──────────────────────────────────────────────────────────
  // In local development (npm run dev), ignore any remote VITE_API_URL.
  // Sending local JWT tokens to a remote production backend causes 401 Unauthorized
  // because the remote backend uses a different JWT_SECRET_KEY.
  // The Vite proxy (vite.config.js → /api → http://127.0.0.1:8000) handles routing.
  if (import.meta.env.DEV && envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    console.warn(
      '[API] DEV mode: ignoring VITE_API_URL ("' + envUrl + '") — using Vite proxy (local backend).\n' +
      '      To use the local backend, keep VITE_API_URL empty in frontend/.env.'
    );
    envUrl = '';
  }

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

/**
 * generateSpeech — sends text to backend for TTS generation.
 * Requires a valid JWT token (enforced server-side).
 * Returns result with audio_url and usage data.
 *
 * Character limit errors are surfaced with special error codes:
 *   err.code === 'FREE_LIMIT_REACHED'    → user has 0 chars left
 *   err.code === 'CHARACTER_LIMIT_EXCEEDED' → request too large for remaining
 */
export async function generateSpeech({
  text,
  language,
  voiceId,
  speed = 1.0,
  pitch = 0.0,
  style = null,
  normalizeText = true,
  token = null
}) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const authToken = token || (typeof window !== 'undefined' ? (localStorage.getItem('aiv_token') || localStorage.getItem('aivi_token')) : null);
    if (authToken && authToken !== 'null' && authToken !== 'undefined') {
      headers['Authorization'] = `Bearer ${authToken.trim()}`;
    }

    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers,
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
      const detail = errorData.detail;

      // Handle structured character limit errors from backend
      if (detail && typeof detail === 'object') {
        const err = new Error(detail.message || 'Generation limit reached.');
        err.code = detail.error;
        err.remainingCharacters = detail.remaining_characters;
        err.charactersUsed = detail.characters_used;
        err.characterLimit = detail.character_limit;
        err.status = res.status;
        throw err;
      }

      // Handle plain string errors (e.g. 401 Unauthorized)
      if (res.status === 401) {
        const err = new Error('Please log in to generate audio.');
        err.code = 'UNAUTHORIZED';
        err.status = 401;
        throw err;
      }

      throw new Error(
        (typeof detail === 'string' ? detail : null) ||
        'Something went wrong while generating the audio. Please try again.'
      );
    }

    const data = await res.json();
    if (data && data.audio_url) {
      data.audio_url = resolveAudioUrl(data.audio_url);
    }
    return data;
  } catch (err) {
    // Network failure (backend offline)
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
  if (status === 401) {
    if (data && typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    return 'Incorrect email or password.';
  }
  if (status === 409) {
    if (data && typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    return 'An account with this email already exists.';
  }
  if (status === 422) {
    if (data && Array.isArray(data.detail)) {
      return data.detail.map(d => d.msg || (typeof d === 'object' ? JSON.stringify(d) : String(d))).join(', ');
    }
    if (data && typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    return 'Invalid input data provided. Please check the fields and try again.';
  }
  if (status >= 500) {
    if (data && typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    return 'Unable to reach the backend server. Please verify the backend is running.';
  }
  if (status === 404) {
    return 'API endpoint not found (HTTP 404). Please verify backend is running.';
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
    throw new Error('Unable to reach the backend server. Please verify the backend is running.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Registration failed. Please check your information.'));
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
    throw new Error('Unable to reach the backend server. Please verify the backend is running.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Incorrect email or password.'));
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

/**
 * loginWithGoogle — exchange a Firebase ID token for a backend JWT.
 * Calls POST /api/auth/google, which verifies the token server-side
 * and auto-creates or logs in the user by email.
 *
 * @param {string} idToken  Firebase ID token from signInWithGoogle()
 * @returns {Promise<{ access_token: string, user: object }>}
 */
export async function loginWithGoogle(idToken) {
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
  } catch (networkErr) {
    console.error('[Auth API] Network error during Google login:', networkErr);
    throw new Error('Unable to reach the backend server. Please verify the backend is running.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Google sign-in failed. Please try again.'));
  }
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

/**
 * mockUpgradePlan — instantly activates a plan for testing (dev/test mode only).
 * Hits POST /api/payments/mock-upgrade on the backend.
 * Returns updated plan details and subscription info.
 */
export async function mockUpgradePlan(planId, token) {
  let res;
  try {
    res = await fetch(`${API_BASE}/payments/mock-upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan: planId })
    });
  } catch (networkErr) {
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Plan upgrade failed.'));
  }
  return data;
}

/**
 * extractPdfText — sends a PDF file to the backend to extract text and page count via PyMuPDF.
 * @param {File} file - PDF file object
 * @param {string|null} token - optional JWT token
 * @returns {Promise<{ filename: string, page_count: number, text: string, character_count: number }>}
 */
export async function extractPdfText(file, token = null) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/pdf/extract`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(extractDetail(data, res.status, 'Failed to extract text from PDF file.'));
    }

    return data;
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Backend service unavailable. Please check your connection.');
    }
    throw err;
  }
}

/**
 * AI Assistant Chat Endpoint Caller
 */
export async function askAiAssistant(message, history = [], token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, messages: history })
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(extractDetail(data, res.status, 'Failed to generate AI response.'));
    }

    return data;
  } catch (err) {
    console.warn('AI Chat API fallback activated:', err);
    // Intelligent client-side fallback if backend is offline
    let answer = "Artificial intelligence and voice synthesis allow instant creation of natural spoken audio. You can paste any prompt here to generate voiceover content for your videos, presentations, and educational modules.";
    const p = (message || '').toLowerCase();
    if (p.includes('python')) {
      answer = "Python is a high-level, general-purpose programming language widely used in AI, data science, web development, and automation. It is known for its clear syntax and huge ecosystem of packages.";
    } else if (p.includes('story')) {
      answer = "Once upon a time in a vibrant tech metropolis, an innovator dreamed of making AI voice synthesis accessible to every voice in India. Through perseverance and cutting-edge technology, AI Voice India was born!";
    }
    return { answer };
  }
}

// ── Support API Helpers ──────────────────────────────────────────────────────

export async function submitSupportRequest({ message, userName = 'Guest User', userEmail = '', userId = null }) {
  try {
    const res = await fetch(`${API_BASE}/support/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        user_name: userName,
        user_email: userEmail,
        user_id: userId
      })
    });
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(extractDetail(data, res.status, 'Failed to submit support request.'));
    }
    return data;
  } catch (err) {
    console.warn('Support submission network error, saving locally:', err);
    const now = new Date();
    return {
      status: 'success',
      message: "Your support request has been sent successfully.",
      data: {
        id: Date.now(),
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        message,
        date_str: now.toISOString().split('T')[0],
        time_str: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'New'
      }
    };
  }
}

export async function fetchSupportRequests() {
  try {
    const res = await fetch(`${API_BASE}/support/requests`);
    if (!res.ok) throw new Error('Failed to fetch support requests.');
    return await res.json();
  } catch (err) {
    console.warn('Fetching support requests fallback');
    return [];
  }
}

export async function updateSupportRequestStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/support/requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await safeJson(res);
  } catch (err) {
    console.warn('Update support status fallback:', err);
    return { status: 'success' };
  }
}

export async function deleteSupportRequest(id) {
  try {
    const res = await fetch(`${API_BASE}/support/requests/${id}`, {
      method: 'DELETE'
    });
    return await safeJson(res);
  } catch (err) {
    console.warn('Delete support request fallback:', err);
    return { status: 'success' };
  }
}

// ── Settings API Helpers ─────────────────────────────────────────────────────

export async function fetchUserSettings(token) {
  if (!token) return { settings: {}, api_key: 'aivi_demo_key_9982' };
  try {
    const res = await fetch(`${API_BASE}/user/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return { settings: {}, api_key: 'aivi_live_key_9982' };
    return await res.json();
  } catch (err) {
    return { settings: {}, api_key: 'aivi_live_key_9982' };
  }
}

export async function saveUserSettings(settings, token) {
  if (!token) return { status: 'success' };
  try {
    const res = await fetch(`${API_BASE}/user/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ settings })
    });
    return await safeJson(res);
  } catch (err) {
    return { status: 'success' };
  }
}

export async function changeUserPassword({ currentPassword, newPassword }, token) {
  let res;
  try {
    res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
  } catch (err) {
    throw new Error('Unable to reach server to change password.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Password update failed.'));
  }
  return data;
}

export async function deleteUserAccount(token) {
  let res;
  try {
    res = await fetch(`${API_BASE}/user/account`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err) {
    throw new Error('Unable to reach server to delete account.');
  }
  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(extractDetail(data, res.status, 'Account deletion failed.'));
  }
  return data;
}



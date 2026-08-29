/**
 * AI VOICE INDIA — Web Speech API Service
 * 
 * Reusable utility for detecting, categorizing, and previewing real browser/device voices.
 * Strictly ₹0 investment, zero-cost, no paid APIs.
 * Only displays real available voices on the user's system without inventing or faking duplicates.
 */

// Mapping of language codes to standard BCP 47 Indian locales & fallbacks
export const LANGUAGE_LOCALE_MAP = {
  hi: { primary: 'hi-IN', matchPrefixes: ['hi-in', 'hi_in', 'hi'], name: 'Hindi', defaultSpeed: 1.0, defaultPitch: 1.0 },
  kn: { primary: 'kn-IN', matchPrefixes: ['kn-in', 'kn_in', 'kn'], name: 'Kannada', defaultSpeed: 1.0, defaultPitch: 1.0 },
  mr: { primary: 'mr-IN', matchPrefixes: ['mr-in', 'mr_in', 'mr'], name: 'Marathi', defaultSpeed: 1.0, defaultPitch: 1.0 },
  ta: { primary: 'ta-IN', matchPrefixes: ['ta-in', 'ta_in', 'ta'], name: 'Tamil', defaultSpeed: 1.0, defaultPitch: 1.0 },
  te: { primary: 'te-IN', matchPrefixes: ['te-in', 'te_in', 'te'], name: 'Telugu', defaultSpeed: 1.0, defaultPitch: 1.0 },
  ml: { primary: 'ml-IN', matchPrefixes: ['ml-in', 'ml_in', 'ml'], name: 'Malayalam', defaultSpeed: 1.0, defaultPitch: 1.0 },
  bn: { primary: 'bn-IN', matchPrefixes: ['bn-in', 'bn_in', 'bn-bd', 'bn'], name: 'Bengali', defaultSpeed: 1.0, defaultPitch: 1.0 },
  gu: { primary: 'gu-IN', matchPrefixes: ['gu-in', 'gu_in', 'gu'], name: 'Gujarati', defaultSpeed: 1.0, defaultPitch: 1.0 },
  pa: { primary: 'pa-IN', matchPrefixes: ['pa-in', 'pa_in', 'pa-pk', 'pa'], name: 'Punjabi', defaultSpeed: 1.0, defaultPitch: 1.0 },
  en: { primary: 'en-IN', matchPrefixes: ['en-in', 'en_in'], fallbackPrefixes: ['en-us', 'en-gb', 'en-au', 'en'], name: 'English (India)', defaultSpeed: 1.0, defaultPitch: 1.0 },
  ur: { primary: 'ur-IN', matchPrefixes: ['ur-in', 'ur_in', 'ur-pk', 'ur'], name: 'Urdu', defaultSpeed: 1.0, defaultPitch: 1.0 },
  or: { primary: 'or-IN', matchPrefixes: ['or-in', 'or_in', 'or', 'ory'], name: 'Odia', defaultSpeed: 1.0, defaultPitch: 1.0 },
  as: { primary: 'as-IN', matchPrefixes: ['as-in', 'as_in', 'as'], name: 'Assamese', defaultSpeed: 1.0, defaultPitch: 1.0 },
  kok: { primary: 'kok-IN', matchPrefixes: ['kok-in', 'kok_in', 'kok'], name: 'Konkani', defaultSpeed: 1.0, defaultPitch: 1.0 },
  ne: { primary: 'ne-NP', matchPrefixes: ['ne-np', 'ne-in', 'ne'], name: 'Nepali', defaultSpeed: 1.0, defaultPitch: 1.0 },
  sa: { primary: 'sa-IN', matchPrefixes: ['sa-in', 'sa_in', 'sa', 'san'], name: 'Sanskrit', defaultSpeed: 1.0, defaultPitch: 1.0 },
  mni: { primary: 'mni-IN', matchPrefixes: ['mni-in', 'mni_in', 'mni'], name: 'Manipuri', defaultSpeed: 1.0, defaultPitch: 1.0 },
  ks: { primary: 'ks-IN', matchPrefixes: ['ks-in', 'ks_in', 'ks'], name: 'Kashmiri', defaultSpeed: 1.0, defaultPitch: 1.0 },
  sd: { primary: 'sd-IN', matchPrefixes: ['sd-in', 'sd_in', 'sd'], name: 'Sindhi', defaultSpeed: 1.0, defaultPitch: 1.0 },
  mai: { primary: 'mai-IN', matchPrefixes: ['mai-in', 'mai_in', 'mai'], name: 'Maithili', defaultSpeed: 1.0, defaultPitch: 1.0 },
  sat: { primary: 'sat-IN', matchPrefixes: ['sat-in', 'sat_in', 'sat'], name: 'Santali', defaultSpeed: 1.0, defaultPitch: 1.0 },
  doi: { primary: 'doi-IN', matchPrefixes: ['doi-in', 'doi_in', 'doi'], name: 'Dogri', defaultSpeed: 1.0, defaultPitch: 1.0 },
  brx: { primary: 'brx-IN', matchPrefixes: ['brx-in', 'brx_in', 'brx'], name: 'Bodo', defaultSpeed: 1.0, defaultPitch: 1.0 }
};

// Reliable gender keywords found in standard OS voice names (Microsoft, Google, Apple, Android)
const FEMALE_NAMES = [
  'female', 'zira', 'hazel', 'susan', 'catherine', 'heera', 'kalpana', 'neerja',
  'swara', 'sapna', 'pallavi', 'shruti', 'sobhana', 'tanishaa', 'dhwani', 'gul',
  'victoria', 'karen', 'moira', 'tessa', 'veena', 'sangeeta', 'priya', 'ananya',
  'aditi', 'lekha', 'geeta', 'sunita', 'shreya'
];

const MALE_NAMES = [
  'male', 'david', 'mark', 'george', 'richard', 'ravi', 'hemant', 'madhur',
  'gagan', 'manohar', 'valluvar', 'mohan', 'midhun', 'bashkar', 'niranjan',
  'gurpreet', 'salman', 'daniel', 'oliver', 'rishi', 'tarun', 'karthik', 'ajay',
  'arun', 'suresh', 'vijay', 'prabhat'
];

/**
 * Detect gender from voice name if reliably identifiable
 */
export function detectVoiceGender(voiceName = '') {
  const nameLower = voiceName.toLowerCase();
  for (const f of FEMALE_NAMES) {
    if (nameLower.includes(f)) return 'Female';
  }
  for (const m of MALE_NAMES) {
    if (nameLower.includes(m)) return 'Male';
  }
  return null; // Omit if gender cannot be reliably determined
}

/**
 * Check if a Web Speech voice is an exact Indian regional voice
 */
export function isIndianRegionalVoice(voiceLang = '', voiceName = '') {
  const langLower = (voiceLang || '').toLowerCase().replace(/_/g, '-');
  const nameLower = (voiceName || '').toLowerCase();

  // Check Indian country locale (-in) or Indian language tags
  if (langLower.includes('-in')) return true;
  
  const indianLangCodes = ['hi', 'kn', 'mr', 'ta', 'te', 'ml', 'bn', 'gu', 'pa', 'ur', 'or', 'as', 'kok', 'ne', 'sa', 'mni', 'ks', 'sd', 'mai', 'sat', 'doi', 'brx'];
  for (const code of indianLangCodes) {
    if (langLower.startsWith(code)) return true;
  }

  if (nameLower.includes('india') || nameLower.includes('hindi') || nameLower.includes('kannada') || 
      nameLower.includes('tamil') || nameLower.includes('telugu') || nameLower.includes('marathi') ||
      nameLower.includes('bengali') || nameLower.includes('gujarati') || nameLower.includes('malayalam') ||
      nameLower.includes('punjabi') || nameLower.includes('urdu') || nameLower.includes('odia') ||
      nameLower.includes('assamese') || nameLower.includes('sanskrit') || nameLower.includes('kashmiri') ||
      nameLower.includes('sindhi') || nameLower.includes('manipuri')) {
    return true;
  }

  return false;
}

/**
 * Formats a raw Web Speech voice into clean UI metadata
 */
export function formatWebSpeechVoice(voice, selectedLangCode = '') {
  const langLower = (voice.lang || '').toLowerCase().replace(/_/g, '-');
  const isIndian = isIndianRegionalVoice(voice.lang, voice.name);
  const detectedGender = detectVoiceGender(voice.name);
  
  const langConfig = LANGUAGE_LOCALE_MAP[selectedLangCode];
  const isExactLangMatch = langConfig 
    ? langConfig.matchPrefixes.some(prefix => langLower.startsWith(prefix))
    : isIndian;

  return {
    id: `webspeech-${voice.name}-${voice.lang}`,
    name: voice.name,
    rawVoice: voice,
    langLocale: voice.lang || 'en-IN',
    languageCode: selectedLangCode || 'en',
    gender: detectedGender,
    isIndianVoice: isIndian,
    isFallback: !isExactLangMatch,
    statusLabel: isIndian ? (isExactLangMatch ? 'Indian Regional Voice' : 'Indian Voice') : 'Fallback Voice',
    isLocalService: voice.localService ?? true,
    isDefault: voice.default ?? false,
    provider: 'Web Speech API (Device)'
  };
}

/**
 * Get all voices available on the browser
 */
export function getAvailableBrowserVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices() || [];
}

/**
 * Filter and prioritize voices for the specified language
 */
export function filterVoicesForLanguage(allVoices = [], langCode = 'en') {
  if (!allVoices || allVoices.length === 0) return [];

  const langConfig = LANGUAGE_LOCALE_MAP[langCode] || LANGUAGE_LOCALE_MAP.en;
  
  // 1. Exact match voices (e.g. hi-IN for Hindi, kn-IN for Kannada)
  const exactMatches = [];
  const regionalOtherMatches = [];
  const genericFallbacks = [];

  allVoices.forEach((rawVoice) => {
    const langLower = (rawVoice.lang || '').toLowerCase().replace(/_/g, '-');
    const isExact = langConfig.matchPrefixes.some(prefix => langLower.startsWith(prefix));

    if (isExact) {
      exactMatches.push(formatWebSpeechVoice(rawVoice, langCode));
    } else if (isIndianRegionalVoice(rawVoice.lang, rawVoice.name)) {
      regionalOtherMatches.push(formatWebSpeechVoice(rawVoice, langCode));
    } else {
      genericFallbacks.push(formatWebSpeechVoice(rawVoice, langCode));
    }
  });

  // If exact matching voices exist, return them!
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // If no exact match, provide regional fallback if available or generic device voices
  if (regionalOtherMatches.length > 0) {
    return regionalOtherMatches.map(v => ({ ...v, isFallback: true, statusLabel: 'Regional Fallback' }));
  }

  // Fallback to default/general system voices (clearly marked as Fallback)
  return genericFallbacks.slice(0, 3).map(v => ({ ...v, isFallback: true, statusLabel: 'Fallback Voice' }));
}

/**
 * Speak/Preview text using Web Speech API
 */
export function speakSampleText({
  voice,
  text,
  speed = 1.0,
  pitch = 1.0,
  volume = 1.0,
  lang = 'en-IN',
  onStart = () => {},
  onEnd = () => {},
  onError = () => {}
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError(new Error('Speech Synthesis is not supported in this browser.'));
    return;
  }

  // Cancel any ongoing speech first
  window.speechSynthesis.cancel();

  if (!text || !text.trim()) {
    onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text.trim());

  if (voice && voice.rawVoice) {
    utterance.voice = voice.rawVoice;
    utterance.lang = voice.rawVoice.lang || lang;
  } else if (typeof voice === 'object' && voice.lang) {
    utterance.lang = voice.lang;
  } else {
    utterance.lang = lang;
  }

  // Convert speed: web speech accepts 0.1 to 10 (default 1.0)
  utterance.rate = Math.max(0.5, Math.min(2.0, speed));
  
  // Convert pitch: web speech accepts 0 to 2 (default 1.0)
  // Our UI pitch might be -0.5 to 0.5 offset -> convert to 0.5 to 1.5
  const normalizedPitch = pitch > 0.0 && pitch <= 2.0 ? pitch : (1.0 + (pitch * 0.5));
  utterance.pitch = Math.max(0.5, Math.min(1.5, normalizedPitch));
  
  utterance.volume = Math.max(0.0, Math.min(1.0, volume));

  utterance.onstart = () => onStart();
  utterance.onend = () => onEnd();
  utterance.onerror = (e) => {
    // Interrupted by cancel is normal when stopping
    if (e.error === 'interrupted' || e.error === 'canceled') {
      onEnd();
      return;
    }
    console.warn('SpeechSynthesis error:', e);
    onError(e);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any current speech synthesis
 */
export function stopSpeechSynthesis() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

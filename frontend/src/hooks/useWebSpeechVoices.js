import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAvailableBrowserVoices, 
  filterVoicesForLanguage, 
  speakSampleText, 
  stopSpeechSynthesis,
  formatWebSpeechVoice 
} from '../services/webSpeechService';

/**
 * Custom hook to load, filter, and manage real Web Speech voices
 */
export function useWebSpeechVoices(selectedLang = 'en') {
  const [allRawVoices, setAllRawVoices] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  // Load voices from browser
  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return [];
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      setAllRawVoices(voices);
      return voices;
    }
    return [];
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    // Try initial load
    const initialVoices = loadVoices();

    // Listen to onvoiceschanged
    const handleVoicesChanged = () => {
      loadVoices();
    };

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }

    // Fallback timer for browsers that don't immediately trigger onvoiceschanged
    const timer = setTimeout(() => {
      if (allRawVoices.length === 0) {
        loadVoices();
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, [loadVoices]);

  // Compute filtered voices for currently selected language
  const availableVoicesForLang = filterVoicesForLanguage(allRawVoices, selectedLang);

  // Preview voice handler
  const previewVoice = useCallback((voice, sampleText, speed = 1.0, pitch = 0.0) => {
    if (!voice) return;

    setPreviewingVoiceId(voice.id);
    setIsSpeaking(true);

    speakSampleText({
      voice,
      text: sampleText,
      speed,
      pitch,
      lang: voice.langLocale || 'en-IN',
      onStart: () => {
        setIsSpeaking(true);
        setPreviewingVoiceId(voice.id);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setPreviewingVoiceId(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setPreviewingVoiceId(null);
      }
    });
  }, []);

  // Stop speech handler
  const stopVoice = useCallback(() => {
    stopSpeechSynthesis();
    setIsSpeaking(false);
    setPreviewingVoiceId(null);
  }, []);

  // Manual refresh voices
  const refreshVoices = useCallback(() => {
    stopSpeechSynthesis();
    setIsSpeaking(false);
    setPreviewingVoiceId(null);
    return loadVoices();
  }, [loadVoices]);

  return {
    allRawVoices,
    availableVoicesForLang,
    isSpeaking,
    previewingVoiceId,
    previewVoice,
    stopVoice,
    refreshVoices,
    isSupported
  };
}

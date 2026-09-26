import React, { useState, useRef, useEffect } from 'react';
import {
  Wand2, Volume2, Radio, Sliders, Sparkles, Disc,
  Play, Pause, Download, RefreshCw, Check, AlertCircle, RotateCcw, Mic, Music
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';

// Soundwave Logo Icon matching VoiceStudio
function SoundwaveIcon({ color = 'currentColor', size = 20 }) {
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

// 6 Effects metadata as specified
const VOICE_EFFECTS = [
  {
    id: 'studio',
    title: 'Studio',
    description: 'Clean and balanced voice.',
    icon: Wand2,
    badge: 'Pro Audio'
  },
  {
    id: 'echo',
    title: 'Echo',
    description: 'Natural room echo.',
    icon: Volume2,
    badge: 'Spatial'
  },
  {
    id: 'radio',
    title: 'Radio',
    description: 'Vintage radio sound.',
    icon: Radio,
    badge: 'Vintage'
  },
  {
    id: 'deep',
    title: 'Deep Voice',
    description: 'Lower pitch.',
    icon: Sliders,
    badge: 'Pitch Shift'
  },
  {
    id: 'bright',
    title: 'Bright Voice',
    description: 'Clear and crisp tone.',
    icon: Sparkles,
    badge: 'High Clarity'
  },
  {
    id: 'reverb',
    title: 'Reverb',
    description: 'Hall ambience.',
    icon: Disc,
    badge: 'Ambience'
  }
];

// WAV encoding helpers for Web Audio API buffer export
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function bufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const bufferLength = result.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + bufferLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const dataView = new DataView(arrayBuffer);

  /* RIFF chunk descriptor */
  writeString(dataView, 0, 'RIFF');
  dataView.setUint32(4, 36 + bufferLength, true);
  writeString(dataView, 8, 'WAVE');
  /* fmt sub-chunk */
  writeString(dataView, 12, 'fmt ');
  dataView.setUint32(16, 16, true);
  dataView.setUint16(20, format, true);
  dataView.setUint16(22, numChannels, true);
  dataView.setUint32(24, sampleRate, true);
  dataView.setUint32(28, sampleRate * blockAlign, true);
  dataView.setUint16(32, blockAlign, true);
  dataView.setUint16(34, bitDepth, true);
  /* data sub-chunk */
  writeString(dataView, 36, 'data');
  dataView.setUint32(40, bufferLength, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    const sample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    dataView.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Blob([dataView], { type: 'audio/wav' });
}

export default function VoiceEffectsView({
  inputAudioUrl = null,
  generationResult = null,
  onGenerate = null,
  isGenerating = false
}) {
  // Selected effect & control state
  const [selectedEffectId, setSelectedEffectId] = useState('studio');
  const [intensity, setIntensity] = useState(50);
  
  // Audio playback & processing state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState(null);
  const [processedEffectName, setProcessedEffectName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Audio Context refs for realtime preview & DSP
  const previewAudioContextRef = useRef(null);
  const previewSourceNodeRef = useRef(null);
  const audioBufferRef = useRef(null);
  const decodedUrlRef = useRef(null);

  // Active audio URL to process (either generated TTS audio or sample audio)
  const currentAudioUrl = inputAudioUrl || generationResult?.audio_url;

  // Cleanup Web Audio nodes on unmount or URL change
  useEffect(() => {
    return () => {
      stopPreviewAudio();
    };
  }, []);

  const stopPreviewAudio = () => {
    if (previewSourceNodeRef.current) {
      try {
        previewSourceNodeRef.current.stop();
        previewSourceNodeRef.current.disconnect();
      } catch (e) {
        // Source already stopped
      }
      previewSourceNodeRef.current = null;
    }
    if (previewAudioContextRef.current && previewAudioContextRef.current.state !== 'closed') {
      try {
        previewAudioContextRef.current.suspend();
      } catch (e) {}
    }
    setIsPreviewing(false);
  };

  // Helper to load & decode audio buffer
  const getAudioBuffer = async (url) => {
    if (audioBufferRef.current && decodedUrlRef.current === url) {
      return audioBufferRef.current;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const tempCtx = new AudioContextClass();
    
    let response;
    if (!url) {
      // If no input audio URL is available, synthesize a default audio buffer using Web Audio API oscillator/synthesizer
      const sampleRate = tempCtx.sampleRate;
      const length = sampleRate * 3; // 3 seconds
      const buffer = tempCtx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        // Clean pleasant voice demo tone
        const t = i / sampleRate;
        const freq = 220 + Math.sin(t * 6) * 40;
        data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 0.5) * 0.3;
      }
      audioBufferRef.current = buffer;
      decodedUrlRef.current = 'default-demo';
      tempCtx.close();
      return buffer;
    }

    response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch input audio file.');
    }
    const arrayBuffer = await response.arrayBuffer();
    const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    audioBufferRef.current = decodedBuffer;
    decodedUrlRef.current = url;
    tempCtx.close();
    return decodedBuffer;
  };

  // Apply Web Audio DSP nodes to a source node
  const buildDspChain = (ctx, sourceNode, effectId, intensityVal) => {
    const k = Math.max(0, Math.min(1, intensityVal / 100));
    let lastNode = sourceNode;

    if (effectId === 'studio') {
      // Clean and balanced voice
      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.value = 80 + 40 * k;

      const hsFilter = ctx.createBiquadFilter();
      hsFilter.type = 'highshelf';
      hsFilter.frequency.value = 3500;
      hsFilter.gain.value = 2.0 + 4.0 * k;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 10;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.2;

      lastNode.connect(hpFilter);
      hpFilter.connect(hsFilter);
      hsFilter.connect(compressor);
      lastNode = compressor;

    } else if (effectId === 'echo') {
      // Natural room echo
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.12 + 0.28 * k;

      const feedback = ctx.createGain();
      feedback.gain.value = 0.15 + 0.35 * k;

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.25 + 0.45 * k;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 1.0;

      const outputGain = ctx.createGain();

      lastNode.connect(dryGain);
      dryGain.connect(outputGain);

      lastNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);
      wetGain.connect(outputGain);

      lastNode = outputGain;

    } else if (effectId === 'radio') {
      // Vintage radio sound
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1500;
      bandpass.Q.value = 2.0 + 3.0 * k;

      const distortion = ctx.createWaveShaper();
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      const drive = 10 + 40 * k;
      for (let i = 0; i < n_samples; ++i) {
        let x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + drive) * x * 20 * deg) / (Math.PI + drive * Math.abs(x));
      }
      distortion.curve = curve;
      distortion.oversample = '4x';

      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.value = 400;

      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.value = 3200 - 800 * k;

      lastNode.connect(hpFilter);
      hpFilter.connect(bandpass);
      bandpass.connect(distortion);
      distortion.connect(lpFilter);
      lastNode = lpFilter;

    } else if (effectId === 'deep') {
      // Lower pitch
      if (sourceNode.playbackRate) {
        sourceNode.playbackRate.value = Math.max(0.65, 1.0 - 0.3 * k);
      }
      const lowShelf = ctx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 220;
      lowShelf.gain.value = 3.0 + 5.0 * k;

      lastNode.connect(lowShelf);
      lastNode = lowShelf;

    } else if (effectId === 'bright') {
      // Clear and crisp tone
      if (sourceNode.playbackRate) {
        sourceNode.playbackRate.value = 1.0 + 0.25 * k;
      }
      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 3000;
      highShelf.gain.value = 4.0 + 6.0 * k;

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 180;

      lastNode.connect(highpass);
      highpass.connect(highShelf);
      lastNode = highShelf;

    } else if (effectId === 'reverb') {
      // Hall ambience
      const outputGain = ctx.createGain();
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.85 - 0.2 * k;

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.2 + 0.5 * k;

      const delays = [0.03 + 0.02 * k, 0.05 + 0.03 * k, 0.08 + 0.04 * k, 0.12 + 0.05 * k];
      const gains = [0.6, 0.45, 0.35, 0.25];

      lastNode.connect(dryGain);
      dryGain.connect(outputGain);

      delays.forEach((delayTime, idx) => {
        const d = ctx.createDelay();
        d.delayTime.value = delayTime;
        const g = ctx.createGain();
        g.gain.value = gains[idx] * k;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2500;

        lastNode.connect(d);
        d.connect(lp);
        lp.connect(g);
        g.connect(wetGain);
      });

      wetGain.connect(outputGain);
      lastNode = outputGain;
    }

    return lastNode;
  };

  // ── Preview Button Handler ──
  const handleTogglePreview = async () => {
    setErrorMessage('');
    if (isPreviewing) {
      stopPreviewAudio();
      return;
    }

    try {
      stopPreviewAudio();
      const buffer = await getAudioBuffer(currentAudioUrl);
      
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      previewAudioContextRef.current = ctx;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      previewSourceNodeRef.current = source;

      const finalNode = buildDspChain(ctx, source, selectedEffectId, intensity);
      finalNode.connect(ctx.destination);

      source.onended = () => {
        setIsPreviewing(false);
      };

      source.start(0);
      setIsPreviewing(true);
    } catch (err) {
      console.error('Audio preview error:', err);
      setErrorMessage('Could not play audio preview. Please make sure Google TTS audio is generated.');
      setIsPreviewing(false);
    }
  };

  // ── Apply Effect Button Handler ──
  const handleApplyEffect = async () => {
    setErrorMessage('');
    stopPreviewAudio();
    setIsProcessing(true);

    try {
      const buffer = await getAudioBuffer(currentAudioUrl);
      
      // Determine sample rate and channel count for OfflineAudioContext
      const sampleRate = buffer.sampleRate || 44100;
      const channels = buffer.numberOfChannels || 1;
      
      // Calculate length considering possible pitch/rate changes
      let lengthFactor = 1.0;
      const k = intensity / 100;
      if (selectedEffectId === 'deep') lengthFactor = 1.0 / Math.max(0.65, 1.0 - 0.3 * k);
      if (selectedEffectId === 'bright') lengthFactor = 1.0 / (1.0 + 0.25 * k);
      if (selectedEffectId === 'echo' || selectedEffectId === 'reverb') lengthFactor = 1.15;

      const offlineLength = Math.ceil(buffer.length * lengthFactor + sampleRate * 0.5);
      const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const offlineCtx = new OfflineCtxClass(channels, offlineLength, sampleRate);

      const offlineSource = offlineCtx.createBufferSource();
      offlineSource.buffer = buffer;

      const finalNode = buildDspChain(offlineCtx, offlineSource, selectedEffectId, intensity);
      finalNode.connect(offlineCtx.destination);

      offlineSource.start(0);

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = bufferToWavBlob(renderedBuffer);

      if (processedAudioUrl) {
        URL.revokeObjectURL(processedAudioUrl);
      }

      const newUrl = URL.createObjectURL(wavBlob);
      setProcessedAudioUrl(newUrl);

      const selectedEffectObj = VOICE_EFFECTS.find(e => e.id === selectedEffectId);
      setProcessedEffectName(selectedEffectObj ? selectedEffectObj.title : selectedEffectId);
    } catch (err) {
      console.error('Apply effect error:', err);
      setErrorMessage('Failed to apply audio effect. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Download Processed Audio Handler ──
  const handleDownloadProcessed = () => {
    if (!processedAudioUrl) return;
    const selectedEffectObj = VOICE_EFFECTS.find(e => e.id === selectedEffectId);
    const effectSlug = selectedEffectObj ? selectedEffectObj.id : 'effect';
    const filename = `aivoiceindia-${effectSlug}-${intensity}pct.wav`;

    const a = document.createElement('a');
    a.href = processedAudioUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeEffectObj = VOICE_EFFECTS.find(e => e.id === selectedEffectId);

  return (
    <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* ═══════════════════════════════════════════════════════
          PAGE HEADER
          ═══════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(37, 99, 235, 0.15)', border: '1px solid #2563EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Wand2 size={18} color="#2563EB" />
          </div>
          <h1 style={{
            fontSize: '1.9rem',
            fontWeight: 800,
            color: '#F0F6FC',
            letterSpacing: '-0.02em',
            margin: 0,
            fontFamily: 'Outfit, var(--font-sans)'
          }}>
            Voice Effects
          </h1>
        </div>
        <p style={{
          color: '#8B949E',
          fontSize: '0.92rem',
          margin: 0,
          lineHeight: '1.5'
        }}>
          Enhance your generated voice with professional audio effects.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════
          INPUT AUDIO STATUS CARD
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        background: '#161B22',
        border: '1px solid #30363D',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SoundwaveIcon color="#2563EB" size={24} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, color: '#F0F6FC', fontSize: '0.95rem' }}>Input Audio Source</span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                background: currentAudioUrl ? 'rgba(46, 160, 67, 0.15)' : 'rgba(255, 138, 0, 0.15)',
                color: currentAudioUrl ? '#3FB950' : '#FF8A00',
                border: currentAudioUrl ? '1px solid rgba(46, 160, 67, 0.3)' : '1px solid rgba(255, 138, 0, 0.3)'
              }}>
                {currentAudioUrl ? 'Google TTS Audio Loaded' : 'Demo Voice Active'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#8B949E', margin: '2px 0 0' }}>
              Original Google TTS audio is preserved intact until you apply an effect below.
            </p>
          </div>
        </div>

        {!currentAudioUrl && onGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            style={{
              background: '#21262d',
              border: '1px solid #30363D',
              color: '#F0F6FC',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363D'; }}
          >
            {isGenerating ? <RefreshCw size={14} className="spin-animation" color="#2563EB" /> : <Mic size={14} color="#2563EB" />}
            <span>{isGenerating ? 'Generating...' : 'Generate Voice in Studio'}</span>
          </button>
        )}
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div style={{
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#F87171',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={16} />
          <span style={{ flex: 1 }}>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage('')}
            style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          EFFECT GRID (SIX ROUNDED CARDS - 16px RADIUS)
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {VOICE_EFFECTS.map((effect) => {
          const isSelected = selectedEffectId === effect.id;
          const IconComp = effect.icon;

          return (
            <div
              key={effect.id}
              onClick={() => {
                setSelectedEffectId(effect.id);
                // Clear active preview if switching effect
                stopPreviewAudio();
              }}
              style={{
                backgroundColor: '#161B22',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                border: isSelected ? '2px solid #2563EB' : '1px solid #30363D',
                boxShadow: isSelected
                  ? '0 0 16px rgba(37, 99, 235, 0.45)'
                  : '0 4px 16px rgba(0, 0, 0, 0.2)',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                userSelect: 'none',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = '#8B949E';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#30363D';
                }
              }}
            >
              {/* Top row: Icon + Radio Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(37, 99, 235, 0.2)' : '#21262d',
                  border: isSelected ? '1px solid #2563EB' : '1px solid #30363D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease'
                }}>
                  <IconComp size={22} color={isSelected ? '#2563EB' : '#F0F6FC'} />
                </div>

                {/* Selection Radio Circle */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid #2563EB' : '2px solid #484F58',
                  background: isSelected ? '#2563EB' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 200ms ease'
                }}>
                  {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </div>
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '0 0 6px 0',
                letterSpacing: '-0.01em'
              }}>
                {effect.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '0.86rem',
                color: '#8B949E',
                margin: 0,
                lineHeight: '1.45'
              }}>
                {effect.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONTROLS SECTION (BELOW CARDS)
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        background: '#161B22',
        border: '1px solid #30363D',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#F0F6FC',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sliders size={18} color="#2563EB" />
            <span>Effect Controls & Processing</span>
          </h2>

          <span style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#2563EB',
            background: 'rgba(37, 99, 235, 0.12)',
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid rgba(37, 99, 235, 0.3)'
          }}>
            Selected: {activeEffectObj?.title}
          </span>
        </div>

        {/* Effect Intensity Slider (0-100) */}
        <div className="ref-slider-group" style={{ marginBottom: '24px' }}>
          <div className="ref-slider-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#C9D1D9' }}>Effect Intensity</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2563EB' }}>{intensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={intensity}
            onChange={(e) => {
              setIntensity(parseInt(e.target.value));
              if (isPreviewing) {
                stopPreviewAudio();
              }
            }}
            className="ref-black-slider"
            aria-label="Effect Intensity slider"
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div className="ref-slider-limits" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8B949E', marginTop: '4px' }}>
            <span>Subtle (0%)</span>
            <span>Balanced (50%)</span>
            <span>Maximum (100%)</span>
          </div>
        </div>

        {/* Control Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>

          {/* Preview Button with Play Icon */}
          <button
            onClick={handleTogglePreview}
            style={{
              background: isPreviewing ? 'rgba(239, 68, 68, 0.15)' : '#21262d',
              border: isPreviewing ? '1px solid #EF4444' : '1px solid #30363D',
              color: isPreviewing ? '#EF4444' : '#F0F6FC',
              borderRadius: '10px',
              padding: '12px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 200ms ease',
              fontFamily: 'var(--font-sans)'
            }}
            onMouseEnter={(e) => {
              if (!isPreviewing) {
                e.currentTarget.style.background = '#2D333B';
                e.currentTarget.style.borderColor = '#8B949E';
              }
            }}
            onMouseLeave={(e) => {
              if (!isPreviewing) {
                e.currentTarget.style.background = '#21262d';
                e.currentTarget.style.borderColor = '#30363D';
              }
            }}
          >
            {isPreviewing ? (
              <>
                <Pause size={18} fill="currentColor" />
                <span>Pause Preview</span>
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                <span>Preview Effect</span>
              </>
            )}
          </button>

          {/* Apply Effect Button (Primary Button) */}
          <button
            onClick={handleApplyEffect}
            disabled={isProcessing}
            style={{
              background: '#2563EB',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 200ms ease',
              fontFamily: 'var(--font-sans)'
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = '#1D4ED8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = '#2563EB';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={18} className="spin-animation" color="#FFFFFF" />
                <span>Processing Audio...</span>
              </>
            ) : (
              <>
                <Wand2 size={18} color="#FFFFFF" />
                <span>Apply Effect</span>
              </>
            )}
          </button>

          {/* Download Processed Audio Button (Disabled until processing finishes) */}
          <button
            onClick={handleDownloadProcessed}
            disabled={!processedAudioUrl || isProcessing}
            style={{
              background: processedAudioUrl ? '#161B22' : '#0D1117',
              border: processedAudioUrl ? '1px solid #2563EB' : '1px solid #30363D',
              color: processedAudioUrl ? '#F0F6FC' : '#484F58',
              borderRadius: '10px',
              padding: '12px 20px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: processedAudioUrl ? 'pointer' : 'not-allowed',
              opacity: processedAudioUrl ? 1 : 0.45,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: 'auto',
              transition: 'all 200ms ease',
              fontFamily: 'var(--font-sans)'
            }}
            onMouseEnter={(e) => {
              if (processedAudioUrl) {
                e.currentTarget.style.background = '#21262d';
                e.currentTarget.style.borderColor = '#3B82F6';
              }
            }}
            onMouseLeave={(e) => {
              if (processedAudioUrl) {
                e.currentTarget.style.background = '#161B22';
                e.currentTarget.style.borderColor = '#2563EB';
              }
            }}
          >
            <Download size={18} color={processedAudioUrl ? '#2563EB' : '#484F58'} />
            <span>Download Processed Audio</span>
          </button>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          PROCESSED AUDIO RESULT PLAYER
          ═══════════════════════════════════════════════════════ */}
      {processedAudioUrl && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <Check size={16} color="#3FB950" />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#3FB950' }}>
              Audio processing complete! ({processedEffectName} • Intensity {intensity}%)
            </span>
          </div>

          <AudioPlayer
            audioUrl={processedAudioUrl}
            filename={`aivoiceindia-${selectedEffectId}-${intensity}pct.wav`}
          />
        </div>
      )}

    </div>
  );
}

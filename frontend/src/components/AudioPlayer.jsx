import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';

export default function AudioPlayer({ audioUrl, filename, voiceMeta, characterCount, providerUsed, generationTime }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
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

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
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

  const handleRateChange = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!audioUrl) return null;

  return (
    <div className="glass-card" style={{
      padding: '24px',
      border: '1px solid rgba(255, 138, 0, 0.3)',
      background: 'linear-gradient(180deg, rgba(26, 36, 62, 0.7) 0%, rgba(13, 18, 31, 0.9) 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3px',
            height: '24px',
            padding: '0 4px'
          }}>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
          </div>

          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Generated Speech Ready
              <span className="badge badge-emerald">HD Audio</span>
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Voice: <strong style={{ color: 'var(--saffron-primary)' }}>{voiceMeta?.name || 'Selected Voice'}</strong> • {characterCount} chars
              {generationTime ? ` • Generated in ${generationTime}s` : ''}
            </div>
          </div>
        </div>

        {/* Action: Download */}
        <a
          href={audioUrl}
          download={filename || 'ai-voice-india.mp3'}
          className="btn-secondary"
          style={{ textDecoration: 'none' }}
        >
          <Download size={16} color="#00D2FF" />
          <span>Download MP3</span>
        </a>
      </div>

      {/* Progress & Scrubbing Bar */}
      <div style={{ marginBottom: '14px' }}>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          style={{ width: '100%', accentColor: 'var(--saffron-primary)' }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '4px',
          fontVariantNumeric: 'tabular-nums'
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="audio-controls-row" style={{
        marginBottom: '4px'
      }}>
        {/* Play / Pause / Replay */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={togglePlay}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--saffron-primary) 0%, #FF512F 100%)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 16px -2px rgba(255, 107, 0, 0.5)',
              transition: 'transform 0.15s ease'
            }}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '2px' }} />}
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => setIsPlaying(true));
              }
            }}
            className="btn-secondary"
            title="Replay from start"
            style={{ padding: '8px 12px' }}
          >
            <RotateCcw size={15} />
          </button>

          {/* Speed badge button */}
          <button
            onClick={handleRateChange}
            className="btn-secondary"
            style={{ padding: '8px 12px', fontSize: '0.8rem', fontWeight: 600 }}
            title="Toggle playback rate"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Volume Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '150px' }}>
          <button
            onClick={toggleMute}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{ width: '90px' }}
          />
        </div>
      </div>
    </div>
  );
}

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
    <div className="audio-player-container" style={{
      padding: '16px',
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(180deg, rgba(255, 138, 0, 0.08) 0%, rgba(10, 10, 10, 0.95) 100%)',
      border: '1px solid rgba(255, 138, 0, 0.3)',
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
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div className="player-wave-container" style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2px',
            height: '20px',
            padding: '0 2px',
            flexShrink: 0
          }}>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
            <span className={`wave-bar ${isPlaying ? 'playing' : ''}`}></span>
          </div>

          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '0.94rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <span>Audio Ready</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>HD</span>
            </h3>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong style={{ color: 'var(--saffron-primary)' }}>{voiceMeta?.name || 'Selected Voice'}</strong> • {characterCount} chars
              {generationTime ? ` • ${generationTime}s` : ''}
            </div>
          </div>
        </div>

        {/* Action: Download MP3 */}
        <a
          href={audioUrl}
          download={filename || 'ai-voice-india.mp3'}
          className="btn-secondary btn-compact"
          style={{ textDecoration: 'none', color: '#00D2FF', borderColor: 'rgba(0, 210, 255, 0.3)' }}
          title="Download MP3 file"
        >
          <Download size={14} />
          <span>Download</span>
        </a>
      </div>

      {/* Progress & Scrubbing Bar */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          aria-label="Audio scrubber"
          style={{ width: '100%', accentColor: 'var(--saffron-primary)', cursor: 'pointer' }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          marginTop: '2px',
          fontVariantNumeric: 'tabular-nums'
        }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar (Mobile-friendly wrap) */}
      <div className="audio-player-controls" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Play / Pause / Replay / Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause Audio' : 'Play Audio'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--saffron-primary) 0%, #FF512F 100%)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 107, 0, 0.4)',
              transition: 'transform 0.15s ease',
              flexShrink: 0
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => setIsPlaying(true));
              }
            }}
            className="btn-secondary btn-compact"
            title="Replay from start"
            aria-label="Replay audio"
          >
            <RotateCcw size={13} />
          </button>

          {/* Speed multiplier badge button */}
          <button
            onClick={handleRateChange}
            className="btn-secondary btn-compact"
            style={{ fontSize: '0.75rem', fontWeight: 700 }}
            title="Toggle playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Volume Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleMute}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Volume level"
            style={{ width: '70px', accentColor: 'var(--saffron-primary)' }}
          />
        </div>
      </div>
    </div>
  );
}

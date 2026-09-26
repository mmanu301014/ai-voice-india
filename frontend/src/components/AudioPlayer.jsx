import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, VolumeX } from 'lucide-react';

const WAVEFORM_HEIGHTS = [
  35, 55, 75, 95, 60, 80, 100, 70, 45, 65, 90, 80, 60, 40, 70, 85, 100, 75, 55, 70,
  90, 45, 65, 80, 95, 60, 40, 75, 85, 70, 55, 80, 95, 65, 45, 75, 90, 60, 35, 50
];

export default function AudioPlayer({
  audioUrl,
  filename,
  onSaveVoice,
  onGenerate,
  isGenerating
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
        setDuration(audioRef.current.duration);
      }
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioUrl) {
      if (onGenerate) onGenerate();
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleWaveformClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = clickRatio * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
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

  const handleDownload = () => {
    if (onSaveVoice) {
      onSaveVoice();
    } else if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = filename || 'ai-voice-india.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="card-audio-player">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onCanPlayThrough={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      {/* Header: GENERATED VOICE title centered */}
      <div className="player-top-header" style={{ justifyContent: 'center' }}>
        <span className="player-audio-label" style={{ textAlign: 'center' }}>GENERATED VOICE</span>
      </div>

      {/* Controls Row */}
      <div className="player-main-controls">
        {/* Play/Pause circular button */}
        <button
          onClick={togglePlay}
          className="player-play-btn-black"
          aria-label={isPlaying ? 'Pause Audio' : 'Play Audio'}
          title={isPlaying ? 'Pause Audio' : 'Play Audio'}
          disabled={isGenerating}
        >
          {isPlaying ? (
            <Pause size={20} fill="#F0F6FC" color="#F0F6FC" />
          ) : (
            <Play size={20} fill="#F0F6FC" color="#F0F6FC" style={{ marginLeft: '2px' }} />
          )}
        </button>

        {/* Waveform Scrubber */}
        <div
          className="player-waveform-container"
          onClick={handleWaveformClick}
          title="Scrub audio"
        >
          {WAVEFORM_HEIGHTS.map((heightPercent, index) => {
            const barRatio = index / WAVEFORM_HEIGHTS.length;
            const currentRatio = duration > 0 ? currentTime / duration : 0;
            const isPlayed = audioUrl && barRatio <= currentRatio;
            return (
              <div
                key={index}
                className={`waveform-bar ${isPlayed ? 'played' : ''}`}
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>

        {/* Time Display */}
        <div className="player-time-display">
          <span>{formatTime(currentTime)}</span>
          <span style={{ opacity: 0.5, margin: '0 2px' }}>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="player-vol-btn"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={18} color="#F0F6FC" />
          ) : (
            <Volume2 size={18} color="#F0F6FC" fill="#F0F6FC" />
          )}
        </button>

        {/* Download MP3 Button */}
        <button
          onClick={handleDownload}
          className="ref-btn-save-voice-sm"
          title="Download MP3"
          aria-label="Download MP3"
        >
          <Download size={14} color="#FFFFFF" />
          <span>Download MP3</span>
        </button>
      </div>
    </div>
  );
}





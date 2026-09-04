import React from 'react';
import { Globe, Mic } from 'lucide-react';

export default function Hero({ onOpenLanguages, onOpenVoices, onGetStarted }) {
  return (
    <section className="hero-section">
      <div className="container hero-container" style={{ maxWidth: '860px' }}>
        {/* Main Heading */}
        <h1 className="hero-title">
          AI voice india
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Convert text to natural-sounding speech <br className="hero-br-desktop" />
          in 20+ Indian Languages
        </p>

        {/* 20+ Indian Languages badge */}
        <div className="hero-badge-row">
          <div className="hero-badge hero-badge-main">
            <Globe size={15} color="rgba(255, 255, 255, 0.85)" />
            <span>20+ Indian Languages</span>
          </div>
        </div>

        {/* Hero Quick Action Buttons: Languages & Voices */}
        <div className="hero-actions-row">
          <button
            type="button"
            className="hero-action-pill"
            onClick={onOpenLanguages}
            title="Browse all 20+ Indian Languages"
          >
            <Globe size={16} />
            <span>Languages</span>
          </button>

          <button
            type="button"
            className="hero-action-pill"
            onClick={onOpenVoices}
            title="Browse Indian Voices"
          >
            <Mic size={16} />
            <span>Voices</span>
          </button>
        </div>
      </div>
    </section>
  );
}


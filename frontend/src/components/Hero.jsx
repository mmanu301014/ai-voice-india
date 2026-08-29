import React from 'react';
import { Globe, Volume2, Zap } from 'lucide-react';

export default function Hero({ onGetStarted }) {
  return (
    <section className="hero-section">
      <div className="container" style={{ maxWidth: '860px' }}>
        {/* Main Heading */}
        <h1 className="hero-title">
          Natural AI Voices, Made for India.
        </h1>

        {/* Feature badges */}
        <div className="hero-badge-row">
          <div className="hero-badge">
            <Globe size={14} color="rgba(255,255,255,0.6)" />
            <span>10+ Indian Languages</span>
          </div>
          <div className="hero-badge">
            <Volume2 size={14} color="rgba(255,255,255,0.6)" />
            <span>Natural Indian Voices</span>
          </div>
          <div className="hero-badge">
            <Zap size={14} color="rgba(255,255,255,0.6)" />
            <span>Fast Voice Generation</span>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import { Layers, ShieldCheck, Cpu, Code2, Globe2, Sparkles } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="container" style={{ paddingBottom: '60px', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.4rem', marginBottom: '12px' }}>
          About AI VOICE INDIA
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          Empowering 1.4+ billion Indian citizens with authentic, natural-sounding voice synthesis in native regional languages.
        </p>
      </div>

      {/* Grid of Key Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Globe2 size={22} color="#FF9933" />
            <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC' }}>Multilingual by Design</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Built from the ground up to support 16 Indian languages equally. Every script is handled with full Unicode precision without forced transliteration.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ShieldCheck size={22} color="#00D084" />
            <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC' }}>₹0 Zero-Cost Core</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Engineered with free, open-source neural TTS technology and intelligent offline fallbacks so developers and creators can innovate with zero investment.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Cpu size={22} color="#00D2FF" />
            <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC' }}>Modular Provider Engine</h3>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Decoupled architecture supporting Microsoft Edge Neural TTS, Google TTS, and future pluggable cloud providers via environment variables.
          </p>
        </div>

      </div>

      {/* Tech Stack & Architecture Deep Dive */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.35rem', marginBottom: '16px', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Code2 size={22} color="#FFA333" />
          Technical Architecture
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          <p>
            <strong>Backend:</strong> High-performance FastAPI server with async stream buffering, disk caching for instantaneous repeated playback, and automatic fallback across providers.
          </p>
          <p>
            <strong>Indian Text Normalization:</strong> Custom regex preprocessing pipeline that converts currency symbols (<code>₹</code>, <code>Rs.</code>) into spoken words, expands Indian number units (<code>Lakhs</code>, <code>Crores</code>), formats abbreviations, and balances phonetic pauses.
          </p>
          <p>
            <strong>Frontend:</strong> Modern React + Vite application with responsive glassmorphic cards, custom audio scrubbing controls, and dynamic language/voice filtering.
          </p>
          <p>
            <strong>Security & Privacy:</strong> Zero API keys exposed to the browser. All environment variables reside strictly on the backend.
          </p>
        </div>
      </div>
    </div>
  );
}

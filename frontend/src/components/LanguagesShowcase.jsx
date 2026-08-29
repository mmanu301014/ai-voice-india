import React from 'react';
import { Globe, ArrowRight, Sparkles } from 'lucide-react';
import { INDIAN_LANGUAGES } from '../data/languages';

export default function LanguagesShowcase({ onSelectLanguage }) {
  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>
          {INDIAN_LANGUAGES.length} Supported Indian Languages
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto' }}>
          Authentic native phonetics and regional intonation across Indo-Aryan, Dravidian, and Classical linguistic families.
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
        gap: '20px'
      }}>
        {INDIAN_LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className="glass-card glass-card-interactive"
            onClick={() => onSelectLanguage(lang.code)}
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFA333', fontFamily: 'inherit' }}>
                  {lang.nativeName}
                </span>
                <span className="badge badge-cyan">
                  {lang.code.toUpperCase()}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', color: '#F8FAFC', marginBottom: '4px' }}>
                {lang.name}
              </h3>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                {lang.region} • {lang.family}
              </div>

              {/* Sample Native Text */}
              <div style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '18px',
                lineHeight: '1.5'
              }}>
                "{lang.sample}"
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.82rem',
              color: '#00D2FF',
              fontWeight: 600
            }}>
              <span>Open in Voice Studio</span>
              <ArrowRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

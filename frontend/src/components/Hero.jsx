import React from 'react';
import { Sparkles, Globe, Shield, Zap, Volume2, Video, Smartphone, BookOpen, Layers } from 'lucide-react';

export default function Hero({ onGetStarted }) {
  return (
    <section style={{
      padding: '44px 0 20px 0',
      textAlign: 'center',
      position: 'relative'
    }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        {/* Top pill badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 138, 0, 0.1)',
          border: '1px solid rgba(255, 138, 0, 0.3)',
          marginBottom: '18px'
        }}>
          <Sparkles size={14} color="#FFA333" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFB356' }}>

          </span>
        </div>

        {/* Main Heading */}
        <h1 style={{
          fontSize: 'clamp(2.3rem, 5vw, 3.6rem)',
          fontWeight: 800,
          marginBottom: '16px',
          letterSpacing: '-0.03em',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 60%, #94A3B8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Natural AI Voices,{' '}
          <span style={{
            background: 'linear-gradient(90deg, #FF9933 0%, #FFA333 50%, #00D2FF 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Made for India.
          </span>
        </h1>



        {/* Feature Labels */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.82rem',
            color: '#F8FAFC',
            fontWeight: 500
          }}>
            <Globe size={15} color="#00D2FF" />
            <span>10+ Indian Languages</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 138, 0, 0.08)',
            border: '1px solid rgba(255, 138, 0, 0.25)',
            fontSize: '0.82rem',
            color: '#FFA333',
            fontWeight: 500
          }}>
            <Volume2 size={15} color="#FF9933" />
            <span>Natural Indian Voices</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 210, 255, 0.08)',
            border: '1px solid rgba(0, 210, 255, 0.25)',
            fontSize: '0.82rem',
            color: '#63E6FF',
            fontWeight: 500
          }}>
            <Sparkles size={15} color="#00D2FF" />
            <span>Fast Voice Generation</span>
          </div>
        </div>
      </div>
    </section>
  );
}

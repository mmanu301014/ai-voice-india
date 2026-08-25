import React from 'react';
import { Globe, Volume2, Edit3, Download, Sparkles, Check, ArrowRight } from 'lucide-react';

export default function HowItWorks({ onOpenStudio }) {
  const steps = [
    {
      number: '01',
      title: 'Choose Language & Creator Mode',
      desc: 'Select from 16 Indian regional languages and select your target platform (YouTube, Reels, Story, News, Education, Ad).',
      icon: Globe,
      color: '#00D2FF'
    },
    {
      number: '02',
      title: 'Pick an Authentic Voice',
      desc: 'Browse native regional voice models and live device voices with real intonation and gender/style descriptions.',
      icon: Volume2,
      color: '#FF9933'
    },
    {
      number: '03',
      title: 'Enter or Paste Your Script',
      desc: 'Type in native Indian scripts or English. Use smart text normalization to auto-format ₹ currency and numbers.',
      icon: Edit3,
      color: '#00D084'
    },
    {
      number: '04',
      title: 'Generate & Export Studio Audio',
      desc: 'Listen to instant waveform playback, fine-tune speed & pitch, and download your pristine broadcast MP3 file.',
      icon: Download,
      color: '#FFA333'
    }
  ];

  return (
    <div className="container" style={{ paddingBottom: '60px', maxWidth: '1000px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '44px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 138, 0, 0.1)',
          border: '1px solid rgba(255, 138, 0, 0.3)',
          marginBottom: '14px',
          fontSize: '0.8rem',
          color: '#FFA333',
          fontWeight: 600
        }}>
          <span>Simple 4-Step Process</span>
        </div>
        <h2 style={{ fontSize: '2.4rem', marginBottom: '12px' }}>
          How AI Voice India Works
        </h2>
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Transform raw text into human-quality regional audio in seconds with zero setup friction.
        </p>
      </div>

      {/* Steps List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '24px',
        marginBottom: '48px'
      }}>
        {steps.map((st) => {
          const Icon = st.icon;
          return (
            <div
              key={st.number}
              className="glass-card"
              style={{
                padding: '28px 20px',
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
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <Icon size={22} color={st.color} />
                  </div>
                  <span style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: 'rgba(255, 255, 255, 0.15)',
                    fontFamily: 'var(--font-display)'
                  }}>
                    {st.number}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#F8FAFC', marginBottom: '8px' }}>
                  {st.title}
                </h3>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {st.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Call to Action */}
      <div className="glass-card" style={{
        padding: '36px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(255, 138, 0, 0.1) 0%, rgba(0, 210, 255, 0.08) 100%)',
        border: '1px solid rgba(255, 138, 0, 0.3)'
      }}>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>
          Ready to generate your first voiceover?
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '22px', fontSize: '0.95rem' }}>
          No credit cards, UPI, or sign-ups required. Open the studio and begin immediately.
        </p>
        <button
          onClick={onOpenStudio}
          className="btn-primary"
          style={{ padding: '14px 32px', fontSize: '1.05rem' }}
        >

          <span>Launch Voice Studio</span>
        </button>
      </div>
    </div>
  );
}

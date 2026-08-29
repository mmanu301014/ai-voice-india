import React from 'react';
import {
  Video, Smartphone, BookOpen, GraduationCap, Radio, Megaphone,
  Sparkles, CheckCircle2, Zap, Sliders, Globe, Layers, ArrowRight, Heart, Volume2
} from 'lucide-react';
import { CREATOR_MODES, VOICE_STYLES } from '../data/creatorModes';

export default function CreatorShowcase({ onSelectMode, onSelectStyle }) {
  const whyPoints = [

  ];

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>

      {/* SECTION 1: Made for Indian Creators */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
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

            <span></span>
          </div>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '12px' }}>
            Made for Indian Creators
          </h2>
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            From a quick Instagram Reel to a full YouTube narration, create voiceovers that sound natural, clear and ready for your content.
          </p>
        </div>

        {/* Creator Modes Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px'
        }}>
          {CREATOR_MODES.map((mode) => {
            const getIcon = () => {
              switch (mode.id) {
                case 'youtube': return <Video size={24} color="#FF0000" />;
                case 'reels': return <Smartphone size={24} color="#E1306C" />;
                case 'story': return <BookOpen size={24} color="#FF9933" />;
                case 'education': return <GraduationCap size={24} color="#00D2FF" />;
                case 'news': return <Radio size={24} color="#38EF7D" />;
                case 'ad': return <Megaphone size={24} color="#FFA333" />;
                default: return <Volume2 size={24} color="#00D2FF" />;
              }
            };

            return (
              <div
                key={mode.id}
                onClick={() => onSelectMode && onSelectMode(mode.id)}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      {getIcon()}
                    </div>
                    <span className="badge badge-saffron" style={{ fontSize: '0.7rem' }}>
                      {mode.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#F8FAFC' }}>
                    {mode.name}
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                    {mode.description}
                  </p>
                </div>

                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  color: '#00D2FF',
                  fontWeight: 600
                }}>
                  <span>Use in Studio</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: Choose Your Style */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 210, 255, 0.1)',
            border: '1px solid rgba(0, 210, 255, 0.3)',
            marginBottom: '14px',
            fontSize: '0.8rem',
            color: '#00D2FF',
            fontWeight: 600
          }}>
            <Sliders size={14} />
          </div>

        </div>

        {/* Styles Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {VOICE_STYLES.map((st) => (
            <div
              key={st.id}
              onClick={() => onSelectStyle && onSelectStyle(st.id)}
              className="glass-card glass-card-interactive"
              style={{
                padding: '20px',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <h3 style={{ fontSize: '1.1rem', color: '#FFA333' }}>
                  {st.name}
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                  Style
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: Why AI Voice India? */}
      <section style={{
        background: 'linear-gradient(180deg, rgba(19, 26, 45, 0.5) 0%, rgba(7, 9, 14, 0.8) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 32px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>


        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {whyPoints.map((pt, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 208, 132, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                <CheckCircle2 size={18} color="#00D084" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: '#F8FAFC', marginBottom: '4px' }}>
                  {pt.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {pt.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

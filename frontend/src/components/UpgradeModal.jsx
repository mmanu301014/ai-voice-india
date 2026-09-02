/**
 * AI VOICE INDIA — Upgrade Modal
 * Shown when a user's free character limit is reached.
 */
import React, { useEffect } from 'react';
import { X, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UpgradeModal({ onClose, onUpgrade, remainingChars = 0 }) {
  const { user } = useAuth();
  const charactersUsed = user?.characters_used ?? 0;
  const characterLimit = user?.character_limit ?? 200;

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isFullyUsed = remainingChars <= 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }} />

      {/* Modal Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: '20px',
        padding: '32px 28px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
        animation: 'modal-in 0.22s ease',
      }}>
        <style>{`
          @keyframes modal-in {
            from { opacity: 0; transform: scale(0.94) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
            borderRadius: '8px', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="Close"
        >
          <X size={15} />
        </button>

        {/* Icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          background: isFullyUsed ? 'rgba(255,80,80,0.1)' : 'rgba(255,138,0,0.12)',
          border: `1px solid ${isFullyUsed ? 'rgba(255,80,80,0.25)' : 'rgba(255,138,0,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px',
        }}>
          {isFullyUsed
            ? <AlertCircle size={26} color="#FF5050" />
            : <Zap size={26} color="#FF8A00" />
          }
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)',
          marginBottom: '10px', lineHeight: 1.2, fontFamily: 'var(--font-display)',
        }}>
          {isFullyUsed ? 'Free characters used up!' : 'Not enough characters remaining'}
        </h2>

        {/* Message */}
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          {isFullyUsed
            ? `Your free ${characterLimit} characters have been fully used. Upgrade your plan to continue generating AI voices.`
            : `You only have ${remainingChars} characters remaining on your free plan. Upgrade to get more.`
          }
        </p>

        {/* Usage bar */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>FREE PLAN USAGE</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isFullyUsed ? '#FF5050' : 'var(--text-secondary)' }}>
              {charactersUsed} / {characterLimit} chars
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (charactersUsed / characterLimit) * 100)}%`,
              background: isFullyUsed
                ? 'linear-gradient(90deg, #FF5050, #FF2222)'
                : 'linear-gradient(90deg, #FF8A00, #FF512F)',
              borderRadius: '3px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Upgrade button */}
        <button
          onClick={onUpgrade}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #FF8A00 0%, #FF512F 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(255,107,0,0.4)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-sans)',
            marginBottom: '10px',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
        >
          <Zap size={18} />
          UPGRADE NOW
          <ArrowRight size={16} />
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            color: 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

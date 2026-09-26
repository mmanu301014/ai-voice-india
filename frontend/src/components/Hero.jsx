/**
 * AI VOICE INDIA — Landing Hero Section
 * Redesigned to match the reference image:
 *   - White background with flowing wave decoration
 *   - Left: headline + subtitle + CTA buttons
 *   - Right: wireframe AI human image blending into white
 */
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// ── Animated wave background canvas ─────────────────────────────────────────
function HeroWaveCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let step = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const lineCount = 28;
      const centerY = h * 0.75;

      for (let i = 0; i < lineCount; i++) {
        const progress = i / lineCount;
        const phase = progress * Math.PI * 2.4 + step * 0.004;
        const opacity =
          Math.pow(Math.sin(progress * Math.PI), 1.8) * 0.22 + 0.02;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(160, 180, 210, ${opacity.toFixed(3)})`;
        ctx.lineWidth = 0.8;

        const pts = 60;
        for (let j = 0; j <= pts; j++) {
          const t = j / pts;
          const x = t * w;

          const w1 =
            Math.sin(t * Math.PI * 2.2 - 0.3 + phase * 0.9) * (h * 0.1);
          const w2 =
            Math.sin(t * Math.PI * 3.5 + phase * 1.1) * (h * 0.045);
          const w3 =
            Math.cos(t * Math.PI * 1.1 + phase * 0.6) * (h * 0.07);

          const envelope = Math.sin(t * Math.PI * 0.9);
          const spread = (progress - 0.5) * (30 + Math.sin(t * Math.PI * 3) * 18);

          const y = centerY + (w1 + w2 + w3) * envelope + spread;
          j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      step++;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ── Google "G" SVG Icon ──────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

// ── Arrow Icon ───────────────────────────────────────────────────────────────
function ArrowRight({ size = 16, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Google Badge Icon for Mobile Button ────────────────────────────────────
function GoogleBadgeIcon() {
  return (
    <div style={{
      width: 28,
      height: 28,
      borderRadius: '50%',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <span style={{
        color: '#000000',
        fontWeight: 800,
        fontSize: '0.95rem',
        fontFamily: 'sans-serif',
        lineHeight: 1
      }}>G</span>
    </div>
  );
}

// ── Main Hero Component ───────────────────────────────────────────────────────
export default function Hero({ onOpenLanguages, onOpenVoices, onGetStarted, setActiveTab }) {
  const { isAuthenticated, googleLogin } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      await googleLogin();
      // On success, AuthContext sets user; optionally navigate to studio
      if (onGetStarted) onGetStarted();
    } catch (err) {
      if (err.code !== 'CANCELLED') {
        setGoogleError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFreeTrial = () => {
    if (isAuthenticated) {
      // Authenticated: scroll to studio
      if (onGetStarted) onGetStarted();
    } else {
      // Not authenticated: go to register
      if (setActiveTab) {
        setActiveTab('register');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="ref-hero-section">
      {/* Peacock Logo with Blue Glow */}
      <div className="ref-hero-logo-wrap">
        <img
          src="/1790355560464.jpeg"
          alt="Peacock Logo"
          className="ref-hero-logo"
        />
      </div>

      {/* Heading */}
      <h1 className="ref-hero-heading">
        <span className="hero-text-white">Create something </span>
        <span className="hero-text-blue">new today</span>
      </h1>

      {/* Subtitle */}
      <p className="ref-hero-subtitle-new">
        Ask any question, generate voiceover scripts, or choose an example prompt below.
      </p>
    </section>
  );
}

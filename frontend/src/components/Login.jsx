/**
 * AI VOICE INDIA — Login Page
 * Exact visual recreation matching the luxury dark reference design.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Background Waveform Ribbon Component ─────────────────────────────────────
function WaveformBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const setDimensions = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    setDimensions();
    window.addEventListener('resize', setDimensions);

    let step = 0;

    const render = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Recreate the flowing multi-ribbon acoustic wave from the reference image
      const lineCount = 42;
      const centerY = h * 0.72;

      for (let i = 0; i < lineCount; i++) {
        const progress = i / lineCount;
        const phase = progress * Math.PI * 2.2 + step * 0.005;
        // Natural curved opacity distribution matching glowing mesh
        const opacity = Math.pow(Math.sin(progress * Math.PI), 1.6) * 0.28 + 0.02;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity.toFixed(3)})`;
        ctx.lineWidth = 0.75;

        const points = 70;
        for (let j = 0; j <= points; j++) {
          const t = j / points;
          const x = t * w;

          // Harmonic curve simulating flowing audio frequencies
          const w1 = Math.sin(t * Math.PI * 2.0 - 0.4 + phase * 0.8) * (h * 0.12);
          const w2 = Math.sin(t * Math.PI * 3.8 + phase * 1.2) * (h * 0.05);
          const w3 = Math.cos(t * Math.PI * 1.2 + phase * 0.5) * (h * 0.08);

          // Envelope: high dynamic amplitude in middle-right, sweeping across bottom left
          const envelope = Math.sin(t * Math.PI * 0.95);
          const ribbonSpread = (progress - 0.5) * (36 + Math.sin(t * Math.PI * 3) * 24);

          const y = centerY + (w1 + w2 + w3) * envelope + ribbonSpread;

          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      step += 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setDimensions);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

// ── Vector Brand Logo Component ──────────────────────────────────────────────
function BrandLogo() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      {/* High-fidelity vector monogram matching reference image */}
      <svg
        viewBox="0 0 280 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          maxWidth: '240px',
          height: 'auto',
        }}
      >
        {/* Letter A */}
        {/* Left thin diagonal with bottom foot */}
        <path
          d="M 32 165 L 56 165 L 56 161 L 47 161 L 96 26 L 88 26 L 39 161 L 32 161 Z"
          fill="#FFFFFF"
        />
        {/* Right bold diagonal */}
        <path
          d="M 92 26 L 108 26 L 152 161 L 161 161 L 161 165 L 132 165 L 132 161 L 140 161 L 102 36 L 92 26 Z"
          fill="#FFFFFF"
        />
        {/* Stylized Arching Curve flowing from crossbar down to bottom right */}
        <path
          d="M 64 110 C 85 106, 108 108, 126 120 C 142 131, 148 148, 148 165 L 142 165 C 142 150, 136 136, 122 126 C 106 114, 85 112, 64 115 Z"
          fill="#FFFFFF"
        />

        {/* Letter I */}
        {/* Top serif bar with smooth brackets */}
        <path
          d="M 180 26 L 230 26 L 230 30 L 218 30 C 213 30, 211 32, 211 37 L 211 154 C 211 159, 213 161, 218 161 L 230 161 L 230 165 L 180 165 L 180 161 L 192 161 C 197 161, 199 159, 199 154 L 199 37 C 199 32, 197 30, 192 30 L 180 30 Z"
          fill="#FFFFFF"
        />
      </svg>

      {/* Subtitle: AI VOICE INDIA */}
      <div
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: '13px',
          fontWeight: 400,
          color: '#FFFFFF',
          letterSpacing: '0.45em',
          marginTop: '12px',
          textTransform: 'uppercase',
          textAlign: 'center',
          paddingLeft: '0.45em', // offset letter-spacing so it is mathematically centered
        }}
      >
        AI VOICE INDIA
      </div>
    </div>
  );
}

// ── Google "G" Icon ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '10px', flexShrink: 0 }}>
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

// ── Main Login Page Component ────────────────────────────────────────────────
export default function Login({ onSwitchToRegister }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError('');
    setInfo('Password reset instructions will be sent to your registered email address.');
  };

  const handleGoogleLogin = () => {
    setError('');
    setInfo('Google Sign-In is configured for production. Please use email/password for local access.');
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Background Acoustic Waveform */}
      <WaveformBackground />

      {/* Main Responsive Grid Container */}
      <div
        className="login-container"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '940px',
          width: '100%',
          margin: '0 auto',
          gap: '48px',
        }}
      >
        {/* Left Side: Brand Logo */}
        <div
          className="login-logo-col"
          style={{
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          <BrandLogo />
        </div>

        {/* Right Side: Compact Login Card */}
        <div
          className="login-card-col"
          style={{
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: 'rgba(12, 12, 15, 0.72)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '32px 28px',
              boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              boxSizing: 'border-box',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em',
                  margin: '0 0 6px 0',
                }}
              >
                Welcome Back
              </h1>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#8E8E93',
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                Sign in to continue to AI Voice India
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  fontSize: '0.8rem',
                  marginBottom: '18px',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Info notice */}
            {info && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#E4E4E7',
                  fontSize: '0.8rem',
                  marginBottom: '18px',
                }}
              >
                <span>{info}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    color: '#A1A1AA',
                    marginBottom: '6px',
                  }}
                >
                  Email
                </label>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Mail
                    size={16}
                    strokeWidth={1.5}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#71717A',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px 0 38px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease, background 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '8px' }}>
                <label
                  htmlFor="login-password"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    color: '#A1A1AA',
                    marginBottom: '6px',
                  }}
                >
                  Password
                </label>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Lock
                    size={16}
                    strokeWidth={1.5}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#71717A',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 38px 0 38px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease, background 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#71717A',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8E8E93',
                    fontSize: '0.78rem',
                    fontWeight: 400,
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.target.style.color = '#FFFFFF')}
                  onMouseLeave={(e) => (e.target.style.color = '#8E8E93')}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                id="login-submit"
                disabled={loading}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease, opacity 0.15s ease',
                  opacity: loading ? 0.75 : 1,
                  boxShadow: '0 2px 8px rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#E5E5E5';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.backgroundColor = '#FFFFFF';
                }}
              >
                {loading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Signing In…</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
              <span
                style={{
                  padding: '0 12px',
                  fontSize: '0.72rem',
                  color: '#71717A',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                OR
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                height: '42px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Switch to Register */}
            <p
              style={{
                textAlign: 'center',
                marginTop: '22px',
                marginBottom: 0,
                color: '#8E8E93',
                fontSize: '0.82rem',
              }}
            >
              Don't have an account?{' '}
              <button
                id="go-to-register"
                type="button"
                onClick={onSwitchToRegister}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 'inherit',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.target.style.opacity = '1')}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Responsive layout CSS and animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Mobile layout styling */
        @media (max-width: 820px) {
          .login-container {
            flex-direction: column !important;
            gap: 28px !important;
            justify-content: center !important;
          }
          .login-logo-col {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

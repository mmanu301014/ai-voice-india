/**
 * AI VOICE INDIA — Register Page
 * Matches existing dark/glowing design system.
 */
import React, { useState } from 'react';
import { Mic, User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register({ onSwitchToLogin, onSuccess }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const EMAIL_RE = /^[a-zA-Z0-9_.+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9.\-]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    // Client-side validation
    if (!cleanName) return setError('Please enter your name.');
    if (!cleanEmail) return setError('Please enter your email address.');
    if (!EMAIL_RE.test(cleanEmail)) return setError('Please enter a valid email address.');
    if (!password) return setError('Please create a password.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await register(cleanName, cleanEmail, password);
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length === 0
    ? null
    : password.length < 6
    ? 'weak'
    : password.length < 10
    ? 'fair'
    : 'strong';

  const strengthColor = { weak: '#EF4444', fair: '#F59E0B', strong: '#00D084' };
  const strengthLabel = { weak: 'Weak', fair: 'Fair', strong: 'Strong' };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-primary)',
      backgroundImage: `
        radial-gradient(circle at 15% 10%, rgba(255, 138, 0, 0.1) 0%, transparent 40%),
        radial-gradient(circle at 85% 20%, rgba(0, 210, 255, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 50% 90%, rgba(0, 208, 132, 0.06) 0%, transparent 50%)
      `,
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #FF9933 0%, #138808 100%)',
            padding: '3px',
            marginBottom: '20px',
            boxShadow: '0 0 30px rgba(255, 153, 51, 0.3)',
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#0D1117',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Mic size={28} color="#FF9933" />
            </div>
          </div>

          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.5rem',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #FFFFFF 0%, #FFA333 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            AI VOICE INDIA
          </div>

          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Join AI Voice India
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* Error */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: '0.875rem',
                marginBottom: '24px',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}>Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  id="register-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  autoComplete="name"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255, 138, 0, 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type="email"
                  id="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255, 138, 0, 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255, 138, 0, 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength */}
              {passwordStrength && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: '2px',
                      width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'fair' ? '66%' : '100%',
                      background: strengthColor[passwordStrength],
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: strengthColor[passwordStrength], fontWeight: 600 }}>
                    {strengthLabel[passwordStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '28px', marginTop: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="register-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  style={{
                    ...inputStyle,
                    paddingRight: '44px',
                    borderColor: confirmPassword && confirmPassword !== password
                      ? 'rgba(239, 68, 68, 0.5)'
                      : confirmPassword && confirmPassword === password
                      ? 'rgba(0, 208, 132, 0.5)'
                      : 'var(--border-subtle)',
                  }}
                  onFocus={e => {
                    if (!confirmPassword || confirmPassword === password) {
                      e.target.style.borderColor = 'rgba(255, 138, 0, 0.5)';
                    }
                  }}
                  onBlur={e => {
                    if (!confirmPassword) e.target.style.borderColor = 'var(--border-subtle)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={eyeBtn}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                {/* Match indicator */}
                {confirmPassword && confirmPassword === password && (
                  <CheckCircle2 size={16} color="#00D084" style={{
                    position: 'absolute', right: '40px', top: '50%',
                    transform: 'translateY(-50%)',
                  }} />
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="register-submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', height: '48px', fontSize: '1rem' }}
            >
              {loading ? (
                <>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Creating Account…
                </>
              ) : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>

        {/* Switch to Login */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
        }}>
          Already have an account?{' '}
          <button
            id="go-to-login"
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--saffron-light)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              fontSize: 'inherit',
            }}
          >
            Login
          </button>
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Shared styles
const inputStyle = {
  width: '100%',
  padding: '12px 14px 12px 44px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  fontFamily: 'var(--font-sans)',
};

const eyeBtn = {
  position: 'absolute',
  right: '14px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  padding: '0',
  display: 'flex',
};

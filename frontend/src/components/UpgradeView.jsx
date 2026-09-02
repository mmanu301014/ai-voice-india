/**
 * AI VOICE INDIA — Premium Dark-Mode Pricing & Upgrade View
 * 
 * Tiers:
 * 1. BASIC CREATOR (₹99/mo, 200 chars) - Orange Accent - "MOST POPULAR"
 * 2. PRO (₹199/mo, 1,000 chars) - Purple Accent - "BEST VALUE"
 * 3. BUSINESS (₹999/mo, 5,000 chars) - Blue Accent - "FOR BUSINESS"
 */

import React, { useState, useEffect } from 'react';
import {
  Check, Zap, Crown, Building2,
  AlertCircle, CheckCircle2, Loader2, Clock, Sparkles,
  ArrowRight, ShieldCheck, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockUpgradePlan, fetchPaymentHistory } from '../services/api';

// ── 3 Exact Pricing Plans Configuration ──────────────────────────────────────
const PLANS_DATA = [
  {
    id: 'basic',
    name: 'Basic Creator',
    badgeTitle: 'Basic',
    price: '₹99',
    rawPrice: 99,
    period: '/month',
    charLimit: 200,
    charDisplay: '200 characters/month',
    badge: 'MOST POPULAR',
    accentColor: '#FF8A00',
    accentGlow: 'rgba(255, 138, 0, 0.25)',
    borderGradient: 'linear-gradient(135deg, rgba(255, 138, 0, 0.6), rgba(255, 81, 47, 0.2))',
    badgeGradient: 'linear-gradient(135deg, #FF8A00, #FF512F)',
    btnGradient: 'linear-gradient(135deg, #FF8A00, #FF512F)',
    icon: Zap,
    description: 'Perfect for getting started with AI Indian voices and personal content.',
    features: [
      '200 characters/month',
      'All 16 Indian languages & voices',
      'Standard voice quality',
      'Email support',
    ],
    buttonLabel: 'Current Plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    badgeTitle: 'Pro',
    price: '₹199',
    rawPrice: 199,
    period: '/month',
    charLimit: 1000,
    charDisplay: '1,000 characters/month',
    badge: 'BEST VALUE',
    accentColor: '#A855F7',
    accentGlow: 'rgba(168, 85, 247, 0.25)',
    borderGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.6), rgba(124, 58, 237, 0.2))',
    badgeGradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
    btnGradient: 'linear-gradient(135deg, #A855F7, #7C3AED)',
    icon: Crown,
    description: 'High performance voice generation for YouTube creators and Reels narrators.',
    features: [
      '1,000 characters/month',
      'All 16 Indian languages & voices',
      'High quality voices',
      'Priority support',
      'Commercial license',
    ],
    buttonLabel: 'Upgrade to Pro',
  },
  {
    id: 'business',
    name: 'Business',
    badgeTitle: 'Business',
    price: '₹999',
    rawPrice: 999,
    period: '/month',
    charLimit: 5000,
    charDisplay: '5,000 characters/month',
    badge: 'FOR BUSINESS',
    accentColor: '#00C4F0',
    accentGlow: 'rgba(0, 196, 240, 0.25)',
    borderGradient: 'linear-gradient(135deg, rgba(0, 196, 240, 0.6), rgba(0, 128, 255, 0.2))',
    badgeGradient: 'linear-gradient(135deg, #00C4F0, #0080FF)',
    btnGradient: 'linear-gradient(135deg, #00C4F0, #0080FF)',
    icon: Building2,
    description: 'Enterprise scalability for media production houses, publishing & apps.',
    features: [
      '5,000 characters/month',
      'All 16 Indian languages & voices',
      'Priority voice processing',
      'Commercial license',
      'Custom voice cloning (optional)',
    ],
    buttonLabel: 'Upgrade to Business',
  },
];

function calculateDaysRemaining(expiryOrBillingEnd) {
  if (!expiryOrBillingEnd) return 27;
  try {
    const end = new Date(expiryOrBillingEnd);
    const now = new Date();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 27;
  } catch {
    return 27;
  }
}

function getNextMonthFirstDate() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function UpgradeView({ onOpenStudio, setActiveTab }) {
  const { user, token, refreshUser } = useAuth();

  const userPlanRaw = (user?.plan || 'basic').toLowerCase();
  const currentPlanId = userPlanRaw === 'free' ? 'basic' : userPlanRaw;
  const currentPlanObj = PLANS_DATA.find(p => p.id === currentPlanId) || PLANS_DATA[0];

  const charactersUsed = user?.characters_used ?? 0;
  const characterLimit = user?.character_limit ?? currentPlanObj.charLimit;
  const charactersRemaining = user?.characters_remaining ?? Math.max(0, characterLimit - charactersUsed);

  const daysLeft = calculateDaysRemaining(user?.billing_period_end || user?.subscription_expiry);
  const nextResetDate = getNextMonthFirstDate();
  const usagePercentage = Math.min(100, Math.max(0, (charactersUsed / characterLimit) * 100));

  const [loadingPlan, setLoadingPlan] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (token && showHistory && history.length === 0) {
      setLoadingHistory(true);
      fetchPaymentHistory(token)
        .then(d => setHistory(d?.history || []))
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [token, showHistory]);

  const handleUpgrade = async (planId) => {
    if (!token) {
      setErrorMsg('Please log in to upgrade your subscription plan.');
      return;
    }

    setLoadingPlan(planId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await mockUpgradePlan(planId, token);
      const targetPlan = PLANS_DATA.find(p => p.id === planId);
      setSuccessMsg(`Successfully upgraded to ${targetPlan?.name || planId.toUpperCase()}! Your new limit is ${targetPlan?.charLimit.toLocaleString()} characters/month.`);
      await refreshUser();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to complete plan upgrade. Please try again.');
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0A0C',
      color: '#EDEDED',
      padding: '40px 16px 100px',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
    }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(255, 138, 0, 0.1)',
            border: '1px solid rgba(255, 138, 0, 0.3)',
            color: '#FF8A00',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '18px'
          }}>
            <Sparkles size={14} />
            <span>AI Voice India Pricing</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            marginBottom: '14px',
            color: '#FFFFFF',
            fontFamily: 'var(--font-display, inherit)'
          }}>
            Simple, Transparent AI Voice Plans
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: '#9CA3AF',
            maxWidth: '580px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Choose the right voice synthesis plan for your workflow. 
            All plans include natural Indian accents &amp; Unicode script normalization.
          </p>
        </div>

        {/* ── NOTIFICATIONS (Success / Error) ── */}
        {successMsg && (
          <div style={{
            maxWidth: '720px',
            margin: '0 auto 28px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            maxWidth: '720px',
            margin: '0 auto 28px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── CURRENT PLAN SECTION ── */}
        <div style={{
          maxWidth: '720px',
          margin: '0 auto 52px',
          background: 'linear-gradient(180deg, #131318 0%, #0D0D11 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '28px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}>
          {/* Header Row: Current Plan & Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '22px'
          }}>
            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#9CA3AF',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '4px'
              }}>
                Current Plan
              </div>
              <div style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#FFFFFF'
              }}>
                {currentPlanObj.name}
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: currentPlanObj.accentGlow,
              border: `1px solid ${currentPlanObj.accentColor}55`,
              color: currentPlanObj.accentColor,
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              ● {currentPlanObj.badgeTitle}
            </div>
          </div>

          {/* Usage Stats Block */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#D1D5DB' }}>
                Monthly Characters Used
              </span>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: usagePercentage >= 90 ? '#EF4444' : '#FFFFFF'
              }}>
                {charactersUsed.toLocaleString()} / {characterLimit.toLocaleString()}
              </span>
            </div>

            {/* Custom Usage Bar */}
            <div style={{
              height: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '10px'
            }}>
              <div style={{
                height: '100%',
                width: `${usagePercentage}%`,
                background: usagePercentage >= 90
                  ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                  : usagePercentage >= 70
                  ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                  : currentPlanObj.btnGradient,
                borderRadius: '999px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: '#9CA3AF'
            }}>
              <span style={{ fontWeight: 600, color: charactersRemaining === 0 ? '#EF4444' : '#10B981' }}>
                {charactersRemaining.toLocaleString()} remaining this month
              </span>
              <span>{usagePercentage.toFixed(0)}% used</span>
            </div>
          </div>

          {/* Renewal Details */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.82rem',
            color: '#9CA3AF'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color={currentPlanObj.accentColor} />
              <span>Renewal: <strong style={{ color: '#FFFFFF' }}>Renews in {daysLeft} days</strong></span>
            </div>
            <div>
              <span>Resets on <strong style={{ color: '#FFFFFF' }}>1st of next month</strong> ({nextResetDate})</span>
            </div>
          </div>
        </div>

        {/* ── 3 PRICING CARDS GRID ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          alignItems: 'stretch',
          marginBottom: '56px'
        }}>
          {PLANS_DATA.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isLoading = loadingPlan === plan.id;
            const IconComponent = plan.icon;

            return (
              <div
                key={plan.id}
                style={{
                  background: 'linear-gradient(180deg, #131318 0%, #0A0A0E 100%)',
                  border: isCurrent
                    ? `1.5px solid ${plan.accentColor}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                  padding: '36px 28px 28px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isCurrent
                    ? `0 0 35px ${plan.accentGlow}, 0 20px 40px rgba(0,0,0,0.8)`
                    : '0 10px 30px rgba(0, 0, 0, 0.5)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 0 40px ${plan.accentGlow}, 0 25px 50px rgba(0,0,0,0.9)`;
                  e.currentTarget.style.borderColor = plan.accentColor;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = isCurrent
                    ? `0 0 35px ${plan.accentGlow}, 0 20px 40px rgba(0,0,0,0.8)`
                    : '0 10px 30px rgba(0, 0, 0, 0.5)';
                  e.currentTarget.style.borderColor = isCurrent ? plan.accentColor : 'rgba(255, 255, 255, 0.1)';
                }}
              >
                {/* Top Badge (MOST POPULAR / BEST VALUE / FOR BUSINESS) */}
                <div style={{
                  position: 'absolute',
                  top: '-13px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: plan.badgeGradient,
                  color: '#FFFFFF',
                  padding: '4px 16px',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  boxShadow: `0 4px 16px ${plan.accentGlow}`
                }}>
                  ✦ {plan.badge}
                </div>

                {/* Plan Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${plan.accentColor}18`,
                    border: `1px solid ${plan.accentColor}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent size={22} color={plan.accentColor} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      margin: 0,
                      lineHeight: 1.2
                    }}>
                      {plan.name}
                    </h3>
                    <span style={{ fontSize: '0.76rem', color: '#9CA3AF' }}>
                      {plan.badgeTitle} Tier
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div style={{ marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '3rem',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    letterSpacing: '-0.03em',
                    lineHeight: 1
                  }}>
                    {plan.price}
                  </span>
                  <span style={{
                    fontSize: '0.95rem',
                    color: '#9CA3AF',
                    marginLeft: '4px',
                    fontWeight: 500
                  }}>
                    {plan.period}
                  </span>
                </div>

                {/* Character Limit Highlight Pill */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: `${plan.accentColor}15`,
                  border: `1px solid ${plan.accentColor}35`,
                  borderRadius: '8px',
                  padding: '5px 12px',
                  marginBottom: '18px',
                  width: 'fit-content'
                }}>
                  <Sparkles size={13} color={plan.accentColor} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: plan.accentColor }}>
                    {plan.charDisplay}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '0.85rem',
                  color: '#9CA3AF',
                  lineHeight: 1.5,
                  marginBottom: '24px'
                }}>
                  {plan.description}
                </p>

                {/* Feature List */}
                <div style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '20px',
                  marginBottom: '28px',
                  flex: 1
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '14px'
                  }}>
                    Features Included
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Check size={16} color={plan.accentColor} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.86rem', color: '#E5E7EB', lineHeight: 1.4 }}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Button Action */}
                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${plan.accentColor}66`,
                        color: plan.accentColor,
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Check size={16} />
                      <span>Current Plan</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        background: plan.btnGradient,
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        cursor: isLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: `0 4px 20px ${plan.accentGlow}`,
                        transition: 'all 0.2s ease',
                        opacity: isLoading ? 0.8 : 1
                      }}
                      onMouseEnter={e => {
                        if (!isLoading) {
                          e.currentTarget.style.filter = 'brightness(1.12)';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.filter = '';
                        e.currentTarget.style.transform = '';
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Upgrading…</span>
                        </>
                      ) : (
                        <>
                          <span>{plan.buttonLabel}</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── TEST MODE / SECURITY BADGE ── */}
        <div style={{
          maxWidth: '720px',
          margin: '0 auto 40px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={24} color="#10B981" />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                Instant Activation &amp; Zero Risk
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                Test mode is active for immediate plan upgrading without live charges.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(h => !h)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#D1D5DB',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Invoices &amp; History</span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* ── TRANSACTION HISTORY COLLAPSIBLE ── */}
        {showHistory && (
          <div style={{
            maxWidth: '720px',
            margin: '-24px auto 40px',
            background: '#131318',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
            overflow: 'hidden'
          }}>
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <Loader2 size={20} color="#9CA3AF" style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '8px' }}>Loading payment logs…</div>
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9CA3AF', fontSize: '0.85rem' }}>
                No past transactions found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((h, i) => (
                  <div key={h.id || i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'capitalize' }}>
                        {h.plan} Tier
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                        {h.razorpay_order_id} · {new Date(h.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10B981' }}>
                        ₹{((h.amount || 0) / 100).toFixed(0)}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#9CA3AF', textTransform: 'uppercase' }}>
                        {h.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BACK TO STUDIO BUTTON ── */}
        {typeof setActiveTab === 'function' && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => {
                setActiveTab('studio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                padding: '12px 28px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                color: '#E5E7EB',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#E5E7EB';
              }}
            >
              ← Back to Voice Studio
            </button>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

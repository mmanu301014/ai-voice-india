import React from 'react';
import { Check, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export default function PricingView({ onOpenStudio }) {
  const tiers = [
    {
      name: 'Free / Zero-Cost',
      price: '₹0',
      period: 'Forever Free',
      badge: 'Active Now',
      highlight: true,
      description: 'Zero-cost development and testing environment for all Indian languages.',
      features: [
        '16 Indian regional languages & English',
        '100% Free Neural Voice generation',
        'No credit card or UPI required',
        'Unlimited local synthesis & testing',
        'Standard MP3 audio download',
        'Smart Indian text normalizer (₹, Lakhs, Crores)',
        'Full Unicode native script support'
      ],
      buttonText: 'Start Using Studio',
      isCurrent: true
    },
    {
      name: 'Pro (Future Vision)',
      price: '₹0 in Dev',
      period: 'Coming in v2.0',
      badge: 'Roadmap',
      highlight: false,
      description: 'Commercial licensing, ultra-low latency, and custom studio voice cloning.',
      features: [
        'Everything in Free tier',
        'Extended character limits (50k+ chars)',
        'Custom voice cloning & studio emotions',
        'Commercial broadcast rights',
        'Priority synthesis queuing',
        'WAV / Lossless studio master exports'
      ],
      buttonText: 'Informational Only',
      isCurrent: false
    },
    {
      name: 'Enterprise / API',
      price: '₹0 in Dev',
      period: 'Coming in v2.0',
      badge: 'Roadmap',
      highlight: false,
      description: 'Dedicated cloud endpoints, custom regional dialects, and SLA for businesses.',
      features: [
        'Dedicated FastAPI REST API access',
        'Bespoke regional dialect tuning',
        'On-premise / Private cloud deployment',
        'Team collaboration & workspace management',
        'Dedicated 99.9% uptime SLA',
        'Enterprise data privacy compliance'
      ],
      buttonText: 'Informational Only',
      isCurrent: false
    }
  ];

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(0, 208, 132, 0.1)',
          border: '1px solid rgba(0, 208, 132, 0.3)',
          marginBottom: '16px'
        }}>
          <ShieldCheck size={16} color="#00D084" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4EEDA3' }}>
            Zero-Investment Development Policy
          </span>
        </div>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>
          Transparent & Free Development
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          All features in this version run 100% free with ₹0 investment. No payment information or billing activation is ever requested.
        </p>
      </div>

      {/* Tiers Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1080px',
        margin: '0 auto'
      }}>
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className="glass-card"
            style={{
              padding: '32px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              border: tier.highlight ? '1px solid rgba(255, 138, 0, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: tier.highlight 
                ? 'linear-gradient(180deg, rgba(255, 138, 0, 0.08) 0%, rgba(19, 26, 45, 0.9) 100%)' 
                : 'var(--bg-card)'
            }}
          >
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{ fontSize: '1.25rem', color: '#F8FAFC' }}>{tier.name}</h3>
                <span className={`badge ${tier.highlight ? 'badge-emerald' : 'badge-cyan'}`}>
                  {tier.badge}
                </span>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F8FAFC' }}>
                  {tier.price}
                </span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  / {tier.period}
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
                {tier.description}
              </p>

              {/* Features List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {tier.features.map((feat, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: '#CBD5E1' }}>
                    <Check size={16} color={tier.highlight ? '#00D084' : '#64748B'} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={tier.isCurrent ? onOpenStudio : undefined}
              disabled={!tier.isCurrent}
              className={tier.isCurrent ? 'btn-primary' : 'btn-secondary'}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {tier.isCurrent && <Sparkles size={16} />}
              <span>{tier.buttonText}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

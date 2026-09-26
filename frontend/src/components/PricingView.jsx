/**
 * AI VOICE INDIA — PricingView
 * Premium Dark-Mode 4-Tier Pricing Page matching attached reference image design:
 *
 * Content:
 * 1. FREE (₹0) - 1,000 credits, Standard voices, Indian languages, Basic voice generation
 * 2. BASIC (₹70) - 10,000 credits, Standard + WaveNet voices, Indian languages, Audio download
 * 3. PRO (₹129) - 20,000 credits, Standard + WaveNet voices, More voice options, Audio download, Priority generation [Most Popular]
 * 4. BUSINESS (₹249) - 50,000 total credits, Standard + WaveNet voices, Chirp 3 HD access with a usage limit, Premium voices, Priority generation
 *
 * Bottom Features:
 * - Multiple Indian Languages (Voice in your language)
 * - Natural AI Voices (Realistic & expressive)
 * - Secure & Reliable (Your data is safe with us)
 * - Fast Generation (Get audio in seconds)
 */

import React, { useState } from 'react';
import { User, Zap, Star, Crown, Check, ArrowRight, Globe, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockUpgradePlan } from '../services/api';

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'FREE',
    price: '₹0',
    icon: User,
    isPopular: false,
    features: [
      '1,000 credits',
      'Standard voices',
      'Indian languages',
      'Basic voice generation',
    ],
    buttonStyle: 'outline',
  },
  {
    id: 'basic',
    name: 'BASIC',
    price: '₹70',
    icon: Zap,
    isPopular: false,
    features: [
      '10,000 credits',
      'Standard + WaveNet voices',
      'Indian languages',
      'Audio download',
    ],
    buttonStyle: 'outline',
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '₹129',
    icon: Star,
    isPopular: true,
    popularBadge: 'Most Popular',
    features: [
      '20,000 credits',
      'Standard + WaveNet voices',
      'More voice options',
      'Audio download',
      'Priority generation',
    ],
    buttonStyle: 'primary',
  },
  {
    id: 'business',
    name: 'BUSINESS',
    price: '₹249',
    icon: Crown,
    isPopular: false,
    features: [
      '50,000 total credits',
      'Standard + WaveNet voices',
      'Chirp 3 HD access with a usage limit',
      'Premium voices',
      'Priority generation',
    ],
    buttonStyle: 'outline',
  },
];

const BOTTOM_FEATURES = [
  {
    icon: Globe,
    title: 'Multiple Indian Languages',
    description: 'Voice in your language',
  },
  {
    icon: Activity,
    title: 'Natural AI Voices',
    description: 'Realistic & expressive',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    description: 'Your data is safe with us',
  },
  {
    icon: Zap,
    title: 'Fast Generation',
    description: 'Get audio in seconds',
  },
];

export default function PricingView({ onOpenStudio, setActiveTab }) {
  const { isAuthenticated, token, refreshUser } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handlePlanClick = async (planId) => {
    if (!isAuthenticated) {
      if (typeof setActiveTab === 'function') {
        setActiveTab('login');
      }
      return;
    }

    if (planId === 'free') {
      if (typeof setActiveTab === 'function') {
        setActiveTab('studio');
      }
      return;
    }

    setLoadingPlan(planId);
    setFeedbackMsg('');

    try {
      if (token) {
        await mockUpgradePlan(planId, token);
        if (refreshUser) await refreshUser();
      }
      setFeedbackMsg(`Successfully upgraded to ${planId.toUpperCase()} plan!`);
      setTimeout(() => {
        setFeedbackMsg('');
        if (typeof setActiveTab === 'function') {
          setActiveTab('studio');
        }
      }, 1200);
    } catch (err) {
      setFeedbackMsg(err.message || 'Unable to update plan.');
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className="pricing-page-container">
      {/* Mountain Header & Hero Area */}
      <div className="pricing-hero-header">
        <div className="pricing-hero-content">
          <span className="pricing-category-tag">PRICING</span>
          <h1 className="pricing-hero-title">Choose Your Plan</h1>
          <p className="pricing-hero-subtitle">
            Get more credits, better voices and premium features.<br />
            Start for free or upgrade anytime.
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div className="pricing-notification">
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 4 Pricing Cards Grid */}
      <div className="pricing-cards-container">
        <div className="pricing-cards-grid">
          {PRICING_PLANS.map((plan) => {
            const IconComponent = plan.icon;
            const isLoading = loadingPlan === plan.id;
            const isPrimaryButton = plan.buttonStyle === 'primary';

            return (
              <div
                key={plan.id}
                className={`pricing-card ${plan.isPopular ? 'pricing-card--popular' : ''}`}
              >
                {plan.isPopular && (
                  <div className="pricing-popular-badge">
                    {plan.popularBadge}
                  </div>
                )}

                {/* Card Top: Circle Icon */}
                <div className="pricing-card-icon-wrapper">
                  <IconComponent size={20} className="pricing-card-icon" />
                </div>

                {/* Plan Name & Price */}
                <h3 className="pricing-plan-name">{plan.name}</h3>
                <div className="pricing-plan-price">{plan.price}</div>

                {/* Divider */}
                <div className="pricing-card-divider" />

                {/* Features List */}
                <ul className="pricing-features-list">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="pricing-feature-item">
                      <Check size={16} className="pricing-check-icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Get Started Button */}
                <button
                  type="button"
                  className={`pricing-btn ${isPrimaryButton ? 'pricing-btn--primary' : 'pricing-btn--outline'}`}
                  onClick={() => handlePlanClick(plan.id)}
                  disabled={isLoading}
                >
                  <span>{isLoading ? 'Processing…' : 'Get Started'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Features Section */}
      <div className="pricing-bottom-section">
        <div className="pricing-bottom-grid">
          {BOTTOM_FEATURES.map((item, index) => {
            const FeatureIcon = item.icon;
            return (
              <div key={index} className="pricing-bottom-item">
                <div className="pricing-bottom-icon-box">
                  <FeatureIcon size={22} />
                </div>
                <div className="pricing-bottom-text">
                  <h4 className="pricing-bottom-title">{item.title}</h4>
                  <p className="pricing-bottom-desc">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline styles scoped to pricing page */}
      <style>{`
        .pricing-page-container {
          min-height: 100vh;
          background-color: #000000;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          position: relative;
          width: 100%;
          padding-bottom: 60px;
        }

        .pricing-hero-header {
          position: relative;
          background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.95) 85%, #000000 100%), url('/mountain-bg.jpg');
          background-size: cover;
          background-position: center top;
          background-repeat: no-repeat;
          padding: 64px 20px 60px;
          text-align: center;
        }

        .pricing-hero-content {
          max-width: 700px;
          margin: 0 auto;
        }

        .pricing-category-tag {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #9ca3af;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 12px;
        }

        .pricing-hero-title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 16px;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .pricing-hero-subtitle {
          font-size: 1.05rem;
          color: #9ca3af;
          line-height: 1.6;
          margin: 0;
          font-weight: 400;
        }

        .pricing-notification {
          max-width: 600px;
          margin: -20px auto 30px;
          padding: 12px 20px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.4);
          border-radius: 8px;
          color: #10b981;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }

        .pricing-cards-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .pricing-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          align-items: stretch;
        }

        @media (max-width: 1024px) {
          .pricing-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
        }

        @media (max-width: 640px) {
          .pricing-cards-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        .pricing-card {
          background: #09090b;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 28px 24px 24px;
          position: relative;
          display: flex;
          flexDirection: column;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
        }

        .pricing-card--popular {
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 12px 35px rgba(255, 255, 255, 0.05);
        }

        .pricing-popular-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #ffffff;
          color: #000000;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .pricing-card-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .pricing-card-icon {
          color: #ffffff;
        }

        .pricing-plan-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 8px;
          letter-spacing: 0.05em;
        }

        .pricing-plan-price {
          font-size: 2.5rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .pricing-card-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.12);
          width: 100%;
          margin-bottom: 20px;
        }

        .pricing-features-list {
          list-style: none;
          padding: 0;
          margin: 0 0 28px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .pricing-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.4;
        }

        .pricing-check-icon {
          color: #ffffff;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .pricing-btn {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .pricing-btn--outline {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }

        .pricing-btn--outline:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .pricing-btn--primary {
          background: #ffffff;
          border: 1px solid #ffffff;
          color: #000000;
        }

        .pricing-btn--primary:hover {
          background: #e5e5e5;
          border-color: #e5e5e5;
        }

        /* Bottom Section */
        .pricing-bottom-section {
          max-width: 1140px;
          margin: 64px auto 0;
          padding: 32px 24px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .pricing-bottom-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .pricing-bottom-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .pricing-bottom-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }

        .pricing-bottom-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pricing-bottom-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          flex-shrink: 0;
        }

        .pricing-bottom-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 2px;
        }

        .pricing-bottom-desc {
          font-size: 0.78rem;
          color: #9ca3af;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

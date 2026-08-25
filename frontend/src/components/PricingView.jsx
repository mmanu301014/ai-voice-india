import React, { useState, useEffect } from 'react';
import {
  Check, Sparkles, ShieldCheck, Zap, CreditCard, Lock,
  AlertCircle, CheckCircle2, RefreshCw, ArrowRight, Clock, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  fetchPaymentHistory,
  fetchCurrentUser
} from '../services/api';

export default function PricingView({ onOpenStudio }) {
  const { user, token, isAuthenticated } = useAuth();

  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [testOrderModal, setTestOrderModal] = useState(null);

  // Load Razorpay script & config on mount
  useEffect(() => {
    fetchPaymentConfig().then((cfg) => {
      if (cfg) setPaymentConfig(cfg);
    });

    // Dynamically inject Razorpay Checkout Script if not present
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Load payment history if logged in
  useEffect(() => {
    if (isAuthenticated && token) {
      setLoadingHistory(true);
      fetchPaymentHistory(token)
        .then((res) => {
          if (res && res.history) setPaymentHistory(res.history);
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [isAuthenticated, token, user?.plan]);

  const currentPlanId = user?.plan || 'free';

  const defaultPlans = [
    {
      id: 'free',
      name: 'Free / Starter',
      price: '₹0',
      period: 'Forever Free',
      badge: currentPlanId === 'free' ? 'Current Plan' : '',
      highlight: false,
      description: 'Zero-cost voice generation for personal experimentation and regional speech testing.',
      features: [
        '16 Indian regional languages & English',
        '15 voice generations per day',
        'Up to 2,000 characters per generation',
        'Natural Neural Voices (Edge TTS)',
        'Standard MP3 audio download',
        'Smart Indian text normalizer (₹, Lakhs, Crores)',
        'Full Unicode native script support'
      ],
      buttonText: currentPlanId === 'free' ? 'Current Plan' : 'Free Tier',
      isCurrent: currentPlanId === 'free'
    },
    {
      id: 'basic',
      name: 'Basic Creator',
      price: '₹49',
      period: 'per month',
      badge: currentPlanId === 'basic' ? 'Active Plan' : 'Popular',
      highlight: true,
      description: 'Optimized for YouTube creators, Instagram Reels, and short-form video narrators.',
      features: [
        'Everything in Free plan',
        '100 voice generations per day',
        'Up to 5,000 characters per generation',
        'Full HD broadcast audio exports',
        'Fast generation queue priority',
        'Commercial creator rights for YouTube & Reels',
        'Priority email support'
      ],
      buttonText: currentPlanId === 'basic' ? 'Current Plan' : 'Upgrade to Basic (₹49)',
      isCurrent: currentPlanId === 'basic'
    },
    {
      id: 'pro',
      name: 'Pro Studio',
      price: '₹99',
      period: 'per month',
      badge: currentPlanId === 'pro' ? 'Active Plan' : 'Best Value',
      highlight: false,
      description: 'Maximum power for agencies, podcasters, EdTech educators, & commercial brands.',
      features: [
        'Everything in Basic plan',
        '500 voice generations per day',
        'Up to 10,000 characters per generation',
        'Ultra-low latency synthesis engine',
        'Commercial broadcast licensing rights',
        'Unlimited MP3 downloads & disk cache',
        'Dedicated 24/7 creator priority support'
      ],
      buttonText: currentPlanId === 'pro' ? 'Current Plan' : 'Upgrade to Pro (₹99)',
      isCurrent: currentPlanId === 'pro'
    }
  ];

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') {
      if (onOpenStudio) onOpenStudio();
      return;
    }

    if (!isAuthenticated || !token) {
      setErrorMessage('Please login to subscribe or upgrade your plan.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoadingPlan(planId);

    try {
      // 1. Create order on server
      const orderData = await createPaymentOrder(planId, token);

      // 2. If window.Razorpay is available, open standard checkout modal
      if (typeof window.Razorpay === 'function' && !orderData.is_test_mode) {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'AI VOICE INDIA',
          description: `Subscription: ${orderData.plan_name} (1 Month)`,
          image: '/logo.svg',
          order_id: orderData.order_id,
          prefill: {
            name: orderData.user_name || user?.name || '',
            email: orderData.user_email || user?.email || '',
          },
          theme: {
            color: '#FF8A00'
          },
          handler: async (response) => {
            try {
              // 3. Verify payment on server
              const verifyRes = await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }, token);

              setSuccessMessage(verifyRes.message || 'Payment verified! Plan upgraded.');
              // Refresh user data in window
              if (window.location) {
                setTimeout(() => window.location.reload(), 1500);
              }
            } catch (err) {
              setErrorMessage(err.message || 'Payment verification failed.');
            }
          },
          modal: {
            ondismiss: () => {
              setLoadingPlan('');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setErrorMessage(`Payment failed: ${response.error.description || 'Transaction declined'}`);
        });
        rzp.open();
      } else {
        // 3. Test Mode / Mock verification trigger
        setTestOrderModal(orderData);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to initiate payment.');
    } finally {
      setLoadingPlan('');
    }
  };

  const handleCompleteTestPayment = async () => {
    if (!testOrderModal) return;
    setLoadingPlan(testOrderModal.plan_id);
    setErrorMessage('');
    try {
      const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 12)}`;
      const mockSig = `sig_test_${Math.random().toString(36).substring(2, 16)}`;

      const verifyRes = await verifyPayment({
        razorpay_order_id: testOrderModal.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSig
      }, token);

      setSuccessMessage(verifyRes.message || 'Payment successful! Your account has been upgraded.');
      setTestOrderModal(null);
      // Reload user auth state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Test payment verification failed.');
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(255, 138, 0, 0.1)',
          border: '1px solid rgba(255, 138, 0, 0.3)',
          marginBottom: '16px'
        }}>
          <Sparkles size={16} color="#FFA333" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FFA333' }}>
            Flexible Creator & Studio Subscriptions
          </span>
        </div>

        <h2 style={{ fontSize: '2.4rem', marginBottom: '12px' }}>
          Choose Your Voice Plan
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
          Simple, transparent monthly pricing tailored for creators, developers, and businesses across India.
        </p>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 24px auto',
          background: 'rgba(0, 208, 132, 0.12)',
          border: '1px solid rgba(0, 208, 132, 0.35)',
          color: '#4EEDA3',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle2 size={20} color="#00D084" />
          <span style={{ fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 24px auto',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#FCA5A5',
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} color="#EF4444" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Subscription Summary Card (if logged in) */}
      {isAuthenticated && user && (
        <div className="glass-card" style={{
          maxWidth: '1080px',
          margin: '0 auto 36px auto',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          border: '1px solid rgba(255, 138, 0, 0.35)',
          background: 'linear-gradient(90deg, rgba(255, 138, 0, 0.08) 0%, rgba(19, 26, 45, 0.9) 100%)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#FFA333', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>
              Your Account & Subscription
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{user.name} ({user.email})</span>
              <span className={`badge ${currentPlanId === 'pro' ? 'badge-saffron' : currentPlanId === 'basic' ? 'badge-cyan' : 'badge-emerald'}`}>
                {currentPlanId.toUpperCase()} PLAN
              </span>
            </div>
            {user.subscription_expiry && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Subscription active until: {new Date(user.subscription_expiry).toLocaleDateString()}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={onOpenStudio}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <span>Go to Studio</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Razorpay Test Mode Order Simulation Modal */}
      {testOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            border: '1px solid rgba(255, 138, 0, 0.4)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CreditCard size={22} color="#FFA333" />
              <h3 style={{ fontSize: '1.25rem', color: '#F8FAFC' }}>
                Razorpay Checkout (Test Mode)
              </h3>
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 138, 0, 0.08)',
              border: '1px solid rgba(255, 138, 0, 0.25)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              color: '#FFB356',
              marginBottom: '20px'
            }}>
              <div><strong>Plan:</strong> {testOrderModal.plan_name}</div>
              <div><strong>Amount:</strong> ₹{testOrderModal.price_inr}</div>
              <div><strong>Order ID:</strong> <code>{testOrderModal.order_id}</code></div>
              <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Test Mode is active. Click below to simulate a successful payment and complete backend verification.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTestOrderModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTestPayment}
                className="btn-primary"
                disabled={!!loadingPlan}
              >
                {loadingPlan ? 'Verifying...' : 'Complete Test Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: '24px',
        maxWidth: '1080px',
        margin: '0 auto 48px auto'
      }}>
        {defaultPlans.map((tier) => {
          const isSelected = tier.id === currentPlanId;
          const isLoading = loadingPlan === tier.id;

          return (
            <div
              key={tier.id}
              className="glass-card"
              style={{
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                border: isSelected
                  ? '1px solid rgba(0, 208, 132, 0.6)'
                  : tier.highlight
                  ? '1px solid rgba(255, 138, 0, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                background: isSelected
                  ? 'linear-gradient(180deg, rgba(0, 208, 132, 0.08) 0%, rgba(19, 26, 45, 0.9) 100%)'
                  : tier.highlight
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
                  {tier.badge && (
                    <span className={`badge ${isSelected ? 'badge-emerald' : tier.highlight ? 'badge-saffron' : 'badge-cyan'}`}>
                      {tier.badge}
                    </span>
                  )}
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
                      <Check size={16} color={isSelected ? '#00D084' : tier.highlight ? '#FFA333' : '#64748B'} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(tier.id)}
                disabled={isSelected || isLoading}
                className={isSelected ? 'btn-secondary' : tier.highlight ? 'btn-primary' : 'btn-secondary'}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  opacity: isSelected ? 0.7 : 1,
                  cursor: isSelected ? 'default' : 'pointer'
                }}
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : isSelected ? (
                  <>
                    <CheckCircle2 size={16} color="#00D084" />
                    <span>Current Active Plan</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>{tier.buttonText}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment History Section */}
      {isAuthenticated && (
        <div className="glass-card" style={{ maxWidth: '1080px', margin: '0 auto', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Clock size={20} color="#00D2FF" />
            <h3 style={{ fontSize: '1.25rem', color: '#F8FAFC' }}>Your Payment & Invoice History</h3>
          </div>

          {loadingHistory ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>
              Loading payment history...
            </div>
          ) : paymentHistory.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>
              No payments recorded yet. When you subscribe, your invoices and receipts will appear here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px' }}>Plan</th>
                    <th style={{ padding: '10px 12px' }}>Amount</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '12px' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#F8FAFC' }}>{item.plan_name}</td>
                      <td style={{ padding: '12px' }}>₹{item.amount_inr}</td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${item.status === 'paid' ? 'badge-emerald' : 'badge-saffron'}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {item.razorpay_payment_id || item.razorpay_order_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

import React from 'react';
import { ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DemoBanner({ healthData }) {
  const isOnline = healthData?.status === 'online';

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(255, 138, 0, 0.08) 0%, rgba(0, 208, 132, 0.08) 100%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      padding: '8px 0',
      fontSize: '0.82rem',
      color: 'var(--text-secondary)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#00D084" />
          <span style={{ color: '#F8FAFC', fontWeight: 600 }}>₹0 Zero-Cost Commitment:</span>
          <span>No credit card, UPI, Google Cloud billing, or paid subscriptions required.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#FFA333" />
            <span>Neural Engine: <strong style={{ color: '#F8FAFC' }}>Microsoft Edge Neural + gTTS</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isOnline ? (
              <>
                <CheckCircle2 size={14} color="#00D084" />
                <span style={{ color: '#4EEDA3' }}>FastAPI Backend Ready</span>
              </>
            ) : (
              <>
                <AlertCircle size={14} color="#FFA333" />
                <span style={{ color: '#FFA333' }}>Connecting to Local Backend...</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

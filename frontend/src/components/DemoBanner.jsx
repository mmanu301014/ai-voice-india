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

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOnline ? (
            <>


            </>
          ) : (
            <>
              <AlertCircle size={14} color="#FFA333" />

            </>
          )}
        </div>
      </div>
    </div>

  );
}

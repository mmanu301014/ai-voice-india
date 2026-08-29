import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DemoBanner({ healthData }) {
  const isOnline = healthData?.status === 'online';

  if (isOnline) return null; // Hide banner when all is online

  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '7px 0',
      fontSize: '0.78rem',
      color: 'rgba(255,255,255,0.4)',
      textAlign: 'center',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        <AlertCircle size={13} color="rgba(255,255,255,0.35)" />
        <span>Backend service is starting up — voice generation may take a moment.</span>
      </div>
    </div>
  );
}

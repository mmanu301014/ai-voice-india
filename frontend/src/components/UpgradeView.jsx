/**
 * AI VOICE INDIA — UpgradeView
 * Delegates to PricingView matching exact 4-tier dark mode layout
 */
import React from 'react';
import PricingView from './PricingView';

export default function UpgradeView({ onOpenStudio, setActiveTab }) {
  return <PricingView onOpenStudio={onOpenStudio} setActiveTab={setActiveTab} />;
}

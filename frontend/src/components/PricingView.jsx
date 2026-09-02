/**
 * AI VOICE INDIA — PricingView
 * Matches UpgradeView with the exact 3-tier dark mode layout
 */
import React from 'react';
import UpgradeView from './UpgradeView';

export default function PricingView({ onOpenStudio, setActiveTab }) {
  return <UpgradeView onOpenStudio={onOpenStudio} setActiveTab={setActiveTab} />;
}

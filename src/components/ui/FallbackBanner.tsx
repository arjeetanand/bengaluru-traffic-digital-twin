import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

interface FallbackBannerProps {
  notice?: string;
  isDemo: boolean;
  isCapped: boolean;
  onDismiss?: () => void;
}

export const FallbackBanner: React.FC<FallbackBannerProps> = ({
  notice,
  isDemo,
  isCapped,
  onDismiss
}) => {
  if (!notice && !isDemo && !isCapped) return null;

  const displayMessage = notice || (
    isCapped
      ? 'TomTom safety cap active (30% threshold reached). Switched to high-fidelity demo traffic.'
      : isDemo
      ? 'Showing demo data — add your TomTom key in .env for live traffic'
      : ''
  );

  if (!displayMessage) return null;

  return (
    <div className="banner-toast">
      <div className="banner-content">
        {isCapped ? (
          <AlertTriangle size={15} className="banner-icon alert" />
        ) : (
          <Info size={15} className="banner-icon info" />
        )}
        <span className="banner-text">{displayMessage}</span>
      </div>
      {onDismiss && (
        <button className="banner-close" onClick={onDismiss} title="Dismiss notice">
          <X size={13} />
        </button>
      )}
    </div>
  );
};

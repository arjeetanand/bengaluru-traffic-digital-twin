import React from 'react';
import { ApiUsageStats } from '../../types';
import { ShieldCheck, ShieldAlert, RotateCcw } from 'lucide-react';

interface ApiUsageBadgeProps {
  usage: ApiUsageStats;
  onReset: () => void;
}

export const ApiUsageBadge: React.FC<ApiUsageBadgeProps> = ({ usage, onReset }) => {
  const percent = Number(((usage.callCount / usage.dailyLimit) * 100).toFixed(1));
  const isCapped = usage.isCapped || percent >= usage.capPercentage;

  return (
    <div className={`api-usage-card ${isCapped ? 'capped' : ''}`}>
      <div className="api-usage-header">
        <div className="api-title-row">
          {isCapped ? (
            <ShieldAlert size={14} className="shield-icon alert" />
          ) : (
            <ShieldCheck size={14} className="shield-icon ok" />
          )}
          <span className="api-label">TOMTOM API QUOTA</span>
          {isCapped && <span className="cap-tag">30% CAP HIT</span>}
        </div>
        <button
          onClick={onReset}
          className="api-reset-btn"
          title="Reset local usage counter"
        >
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
      </div>

      <div className="api-metric-row">
        <div className="api-count-display">
          <span className="api-current-calls">{usage.callCount}</span>
          <span className="api-total-calls">/ {usage.dailyLimit.toLocaleString()} calls</span>
        </div>
        <div className="api-percent-display">
          <span className={percent >= 25 ? 'text-amber' : 'text-emerald'}>{percent}%</span>
          <span className="api-threshold-label"> (Cap: {usage.capPercentage}%)</span>
        </div>
      </div>

      {/* Visual progress track */}
      <div className="api-progress-track">
        <div
          className={`api-progress-fill ${isCapped ? 'fill-red' : percent > 20 ? 'fill-amber' : 'fill-cyan'}`}
          style={{ width: `${Math.min(100, (percent / usage.capPercentage) * 100)}%` }}
        />
      </div>

      <div className="api-safety-note">
        {isCapped
          ? 'Auto-stopped at 30% usage to safeguard free-tier quota. Running on demo twin engine.'
          : `Live polling every 180s. Will auto-stop if requests reach 30% (${usage.capCount} calls).`}
      </div>
    </div>
  );
};

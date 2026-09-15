import React from 'react';
import { Activity, Footprints, Route } from 'lucide-react';
import {
  CameraPreset,
  SimulationMetrics,
  SimulationMode,
  TrafficFlowData
} from '../../types';
import { FOOTPATH_AUDIT_SUMMARY } from '../../data/footpathAudit';

interface CorridorJourneyBarProps {
  flowData: TrafficFlowData;
  metrics: SimulationMetrics;
  mode: SimulationMode;
  onUpdateMode: (updates: Partial<SimulationMode>) => void;
}

interface JourneyStop {
  preset: CameraPreset;
  label: string;
  shortLabel: string;
}

const JOURNEY_STOPS: readonly JourneyStop[] = [
  { preset: 'oraclehub', label: 'Oracle Tech Hub', shortLabel: 'ORACLE TECH HUB' },
  { preset: 'kadubeesanahalli', label: 'Kadubeesanahalli', shortLabel: 'KADUBEESANAHALLI' },
  { preset: 'crossover', label: 'Marathahalli crossover', shortLabel: 'CROSSOVER' },
  { preset: 'multiplex', label: 'Innovative Multiplex', shortLabel: 'MULTIPLEX' },
  { preset: 'kalamandir', label: 'Kalamandir', shortLabel: 'KALAMANDIR' },
  { preset: 'spicegarden', label: 'Spice Garden', shortLabel: 'SPICE GARDEN' }
];

const getActiveStopIndex = (preset: CameraPreset) =>
  JOURNEY_STOPS.findIndex((stop) => stop.preset === preset);

export const CorridorJourneyBar: React.FC<CorridorJourneyBarProps> = ({
  flowData,
  metrics,
  mode,
  onUpdateMode
}) => {
  const activeStopIndex = getActiveStopIndex(mode.cameraPreset);
  const isLive = !flowData.isDemo;
  const sourceLabel = isLive ? 'LIVE TOMTOM · FLEET MODELLED' : 'MODELLED OSM TWIN';
  const confidenceLabel = `${Math.round(flowData.confidence * 100)}% CONFIDENCE`;

  return (
    <section className="journey-bar" aria-label="Oracle Tech Hub to Spice Garden source journey">
      <div className="journey-bar-header">
        <div className="journey-title-group">
          <Route size={14} aria-hidden="true" />
          <div>
            <span className="journey-eyebrow">SOURCE JOURNEY</span>
            <strong>ORACLE TECH HUB → SPICE GARDEN</strong>
          </div>
        </div>
        <div className="journey-provenance" aria-label={`Traffic source: ${sourceLabel}`}>
          <span className={`journey-source-dot ${isLive ? 'is-live' : 'is-modelled'}`} aria-hidden="true" />
          <span>{isLive ? 'LIVE' : 'MODELLED'}</span>
          <small>{isLive ? 'TOMTOM' : 'OSM SNAPSHOT'}</small>
        </div>
      </div>

      <nav className="journey-stop-rail" aria-label="Jump to corridor location">
        {JOURNEY_STOPS.map((stop, index) => {
          const isActive = index === activeStopIndex;
          const isPassed = activeStopIndex >= 0 && index < activeStopIndex;

          return (
            <React.Fragment key={stop.preset}>
              <button
                type="button"
                className={`journey-stop ${isActive ? 'is-active' : ''} ${isPassed ? 'is-passed' : ''}`}
                onClick={() => onUpdateMode({ cameraPreset: stop.preset })}
                aria-label={`Open ${stop.label} source view`}
                aria-current={isActive ? 'location' : undefined}
                aria-pressed={isActive}
                title={`Open ${stop.label} source view`}
              >
                <span className="journey-stop-marker" aria-hidden="true" />
                <span>{stop.shortLabel}</span>
              </button>
              {index < JOURNEY_STOPS.length - 1 && (
                <span className={`journey-connector ${isPassed ? 'is-passed' : ''}`} aria-hidden="true" />
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="journey-bar-stats" aria-live="polite">
        <span className="journey-stat">
          <Activity size={12} aria-hidden="true" />
          <b>{Math.round(flowData.currentSpeed)} km/h</b>
          <small>{confidenceLabel}</small>
        </span>
        <span className="journey-stat">
          <span className="journey-stat-pulse" aria-hidden="true" />
          <b>{metrics.avgFlowPerHour.toLocaleString()} veh/hr</b>
          <small>{metrics.activeVehicleCount.toLocaleString()} fleet</small>
        </span>
        <button
          type="button"
          className={`journey-stat journey-footpath-stat ${mode.footpathAuditMode ? 'is-audit-active' : ''}`}
          onClick={() => onUpdateMode({ footpathAuditMode: !mode.footpathAuditMode })}
          aria-pressed={mode.footpathAuditMode}
          title="Toggle the footpath audit overlay"
        >
          <Footprints size={12} aria-hidden="true" />
          <b>{FOOTPATH_AUDIT_SUMMARY.pavedWalkablePct}% walkable</b>
          <small>{FOOTPATH_AUDIT_SUMMARY.segmentCount} audit segments</small>
        </button>
      </div>
    </section>
  );
};

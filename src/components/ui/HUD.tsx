import React from 'react';
import {
  Activity,
  Zap,
  Clock,
  Flame,
  Footprints,
  CarFront
} from 'lucide-react';
import {
  TrafficFlowData,
  SimulationMetrics,
  SimulationMode,
  ApiUsageStats,
  SignalStatus
} from '../../types';
import { ACTIVE_CITY, ACTIVE_JUNCTION_NAME } from '../../config/location';
import { ControlsBar } from './ControlsBar';
import { ApiUsageBadge } from './ApiUsageBadge';
import { FallbackBanner } from './FallbackBanner';
import { NavigationWidget } from './NavigationWidget';
import { GoogleMapsStoreDrawer } from './GoogleMapsStoreDrawer';
import { GoogleMapsStore } from '../../data/GoogleMapsStoreRegistry';
import { FOOTPATH_AUDIT_SUMMARY } from '../../data/footpathAudit';

interface HUDProps {
  flowData: TrafficFlowData;
  metrics: SimulationMetrics;
  mode: SimulationMode;
  usage: ApiUsageStats;
  signalStatus: SignalStatus;
  notice?: string;
  isStoreDrawerOpen: boolean;
  selectedStoreId?: string;
  onToggleStoreDrawer: () => void;
  onSelectStore: (store: GoogleMapsStore) => void;
  onUpdateMode: (updates: Partial<SimulationMode>) => void;
  onToggleDemo: () => void;
  onResetUsage: () => void;
  onOpenJunctionDetail: () => void;
  onDismissNotice: () => void;
  isScenarioRoomOpen: boolean;
  onOpenScenarioRoom: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  flowData,
  metrics,
  mode,
  usage,
  signalStatus,
  notice,
  isStoreDrawerOpen,
  selectedStoreId,
  onToggleStoreDrawer,
  onSelectStore,
  onUpdateMode,
  onToggleDemo,
  onResetUsage,
  onOpenJunctionDetail,
  onDismissNotice,
  isScenarioRoomOpen,
  onOpenScenarioRoom
}) => {
  // Determine health color
  const healthColor =
    metrics.networkHealth > 70
      ? 'health-green'
      : metrics.networkHealth > 40
      ? 'health-amber'
      : 'health-red';
  const crossoverJunctionAgents = Math.max(12, Math.round(mode.vehicleCount * 0.02));
  const fleetSummary = mode.cameraPreset === 'crossover'
    ? `${mode.vehicleCount} FLEET · ${crossoverJunctionAgents} JUNCTION DETAIL · ${Math.max(0, mode.vehicleCount - crossoverJunctionAgents)} CORRIDOR`
    : `${mode.vehicleCount} MODELLED FLEET`;

  return (
    <div className="hud-overlay" style={{ pointerEvents: 'none' }}>
      {/* ── Top Header Navigation Bar ── */}
      <header className="hud-top-bar">
        <div className="hud-brand">
          <div className="status-blip-container">
            <span className={`status-blip ${!flowData.isDemo ? 'blip-live' : 'blip-demo'}`} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              <span className="brand-city">{ACTIVE_CITY.toUpperCase()}</span>
              <span className="brand-divider">//</span>
              <span className="brand-junction">{ACTIVE_JUNCTION_NAME.toUpperCase()}</span>
            </div>
            <div className="brand-meta">
              <span>LAT: 12.956840  LNG: 77.701176</span>
              <span className="meta-dot">•</span>
              <span className="source-tag">
                {!flowData.isDemo ? 'TOMTOM LIVE FEED' : 'OSM SNAPSHOT • MODELLED TRAFFIC'}
              </span>
              <span className="meta-dot">•</span>
              <span>{fleetSummary}</span>
            </div>
          </div>
        </div>

        {/* Signal state pill in header */}
        <div className="hud-header-right">
          <div
            className={`traffic-source-chip ${flowData.isDemo ? 'is-modelled' : 'is-live'}`}
            aria-label={flowData.isDemo ? 'Modelled traffic using the OSM snapshot' : 'Live TomTom traffic feed'}
          >
            <span className="traffic-source-dot" aria-hidden="true" />
            <span>{flowData.isDemo ? 'MODELLED' : 'LIVE'}</span>
            <small>{flowData.isDemo ? 'OSM SNAPSHOT' : 'TOMTOM'}</small>
          </div>
          <div className="signal-pill">
            <span className="signal-label">SIGNAL:</span>
            <div className="signal-indicators">
              <span className={`signal-light ${signalStatus.nsColor === 'green' ? 'active-green' : signalStatus.nsColor === 'amber' ? 'active-amber' : 'active-red'}`} title="North-South Signal" />
              <span className="signal-axis">N-S</span>
              <span className={`signal-light ${signalStatus.ewColor === 'green' ? 'active-green' : signalStatus.ewColor === 'amber' ? 'active-amber' : 'active-red'}`} title="East-West Signal" />
              <span className="signal-axis">E-W</span>
              <span className="signal-timer">{signalStatus.timer}s</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Fallback / Safety Cap Notification Banner ── */}
      <FallbackBanner
        notice={notice}
        isDemo={flowData.isDemo}
        isCapped={usage.isCapped}
        onDismiss={onDismissNotice}
      />

      {/* ── Docked Left Telemetry Panel (Compact, Dark, Monospace) ── */}
      <aside className="hud-dock-left">
        {/* Network Health Widget */}
        <button
          type="button"
          className="telemetry-widget is-interactive"
          onClick={onOpenJunctionDetail}
          title="Inspect modelled junction telemetry"
        >
          <div className="widget-header">
            <span className="widget-title">NETWORK HEALTH</span>
            <Activity size={13} className="widget-icon" />
          </div>
          <div className="health-display">
            <span className={`health-score ${healthColor}`}>{metrics.networkHealth}</span>
            <span className="health-scale">/ 100</span>
            <span className={`health-badge ${healthColor}`}>{metrics.congestionIndex}</span>
          </div>
          <div className="health-progress-bar">
            <div
              className={`health-progress-fill ${healthColor}`}
              style={{ width: `${metrics.networkHealth}%` }}
            />
          </div>
        </button>

        {/* Average Junction Flow */}
        <div className="telemetry-widget">
          <div className="widget-header">
            <span className="widget-title">JUNCTION FLOW</span>
            <Zap size={13} className="widget-icon" />
          </div>
          <div className="metric-row">
            <span className="metric-value text-cyan">
              {metrics.avgFlowPerHour.toLocaleString()}
            </span>
            <span className="metric-unit">veh/hr</span>
          </div>
          <div className="widget-sub">Passing Junction Capacity</div>
        </div>

        {/* Active fleet telemetry: the count is explicit and keeps live-feed provenance honest. */}
        <div className="telemetry-widget" aria-live="polite">
          <div className="widget-header">
            <span className="widget-title">ACTIVE TRAFFIC</span>
            <CarFront size={13} className="widget-icon" />
          </div>
          <div className="metric-row">
            <span className="metric-value text-cyan">
              {metrics.activeVehicleCount.toLocaleString()}
            </span>
            <span className="metric-unit">vehicles</span>
          </div>
          <div className="widget-sub">
            {flowData.isDemo ? '30 HZ MODELLED FLEET' : 'TOMTOM FLOW INPUT · FLEET MODELLED'} · {mode.simSpeed}× CLOCK
          </div>
        </div>

        {/* Average Delay Per Vehicle */}
        <div className="telemetry-widget">
          <div className="widget-header">
            <span className="widget-title">AVG QUEUE DELAY</span>
            <Clock size={13} className="widget-icon" />
          </div>
          <div className="metric-row">
            <span className="metric-value text-amber">
              +{metrics.avgDelaySeconds}
            </span>
            <span className="metric-unit">sec / veh</span>
          </div>
          <div className="widget-sub">Stop & Go Red Signal Delay</div>
        </div>

        {/* Modeled Emissions & Fuel */}
        <div className="telemetry-widget">
          <div className="widget-header">
            <span className="widget-title">IDLING EMISSIONS</span>
            <Flame size={13} className="widget-icon" />
          </div>
          <div className="dual-metric-row">
            <div>
              <span className="metric-value-sm text-amber">{metrics.idlingCO2KgHr}</span>
              <span className="metric-unit-sm"> kg CO₂/hr</span>
            </div>
            <div>
              <span className="metric-value-sm text-rose">{metrics.fuelWastedLitersHr}</span>
              <span className="metric-unit-sm"> L/hr</span>
            </div>
          </div>
          <div className="widget-caption-tag">[MODELLED ESTIMATE]</div>
        </div>

        {/* Footpath Walkability Telemetry Card */}
        <button
          type="button"
          className={`telemetry-widget ${mode.footpathAuditMode ? 'audit-active-card' : ''}`}
          onClick={() => onUpdateMode({ footpathAuditMode: !mode.footpathAuditMode })}
          title="Toggle the modelled footpath audit overlay"
        >
          <div className="widget-header">
            <span className="widget-title">FOOTPATH STATUS</span>
            <Footprints size={13} className="widget-icon" style={{ color: mode.footpathAuditMode ? '#22c55e' : undefined }} />
          </div>
          <div className="metric-row">
            <span className="metric-value text-emerald">{FOOTPATH_AUDIT_SUMMARY.pavedWalkablePct}%</span>
            <span className="metric-unit">Walkable</span>
          </div>
          <div className="footpath-breakdown">
            <span className="footpath-status paved"><i aria-hidden="true" />Paved {FOOTPATH_AUDIT_SUMMARY.pavedWalkablePct}%</span>
            <span className="footpath-status missing"><i aria-hidden="true" />Missing {FOOTPATH_AUDIT_SUMMARY.missingUnpavedPct}%</span>
            <span className="footpath-status blocked"><i aria-hidden="true" />Blocked {FOOTPATH_AUDIT_SUMMARY.blockedEncroachedPct}%</span>
          </div>
          <div className="widget-sub">OSM FOOTWAYS + MODELLED AUDIT · {(FOOTPATH_AUDIT_SUMMARY.totalMeters / 1000).toFixed(2)} km · {FOOTPATH_AUDIT_SUMMARY.segmentCount} audit segments</div>
          <div className="widget-caption-tag" style={{ marginTop: 4, color: mode.footpathAuditMode ? '#4ade80' : undefined }}>
            {mode.footpathAuditMode ? '3D AUDIT OVERLAY ACTIVE' : 'CLICK TO AUDIT • FIELD VERIFY'}
          </div>
        </button>

        {/* TomTom API Quota & 30% Safety Stop Indicator */}
        <ApiUsageBadge usage={usage} onReset={onResetUsage} />
      </aside>

      {/* ── 3D Camera Controls Movement Guide Pill ── */}
      <div className="camera-hint-pill">
        <span className="hint-tag">CONTROLS</span>
        <span className="camera-mode-label">{mode.cameraMode === 'walk' ? 'PERSON · 1.7M EYE' : 'BIRD · ORBIT'}</span>
        <span className="hint-divider">•</span>
        <span><b>WASD:</b> {mode.cameraMode === 'walk' ? 'Walk' : 'Glide'}</span>
        <span className="hint-divider">•</span>
        <span><b>Drag:</b> {mode.cameraMode === 'walk' ? 'Look around' : 'Orbit 360°'}</span>
        <span className="hint-divider">•</span>
        <span><b>Arrows:</b> Turn / Tilt</span>
        <span className="hint-divider">•</span>
        <span><b>Q/E:</b> {mode.cameraMode === 'walk' ? 'Turn' : 'Altitude'}</span>
        <span className="hint-divider">•</span>
        <span><b>Shift:</b> Sprint</span>
        <span className="hint-divider">•</span>
        <span><b>Scroll:</b> Zoom</span>
      </div>

      {/* ── Floating Interactive Navigation Controller ── */}
      <div className="hud-dock-right">
        <NavigationWidget cameraMode={mode.cameraMode} />
      </div>

      <div className="source-attribution" aria-label="Map data attribution">
        OSM SNAPSHOT • © OpenStreetMap contributors • ODbL • API LAYERS OPTIONAL
      </div>

      {/* ── Docked Bottom Mode Controls Bar ── */}
      <footer className="hud-dock-bottom">
        <ControlsBar
          mode={mode}
          onUpdateMode={onUpdateMode}
          isDemo={flowData.isDemo}
          onToggleDemo={onToggleDemo}
          onOpenJunctionDetail={onOpenJunctionDetail}
          isStoreDrawerOpen={isStoreDrawerOpen}
          onToggleStoreDrawer={onToggleStoreDrawer}
          isScenarioRoomOpen={isScenarioRoomOpen}
          onOpenScenarioRoom={onOpenScenarioRoom}
        />
      </footer>

      {/* ── Sliding Google Maps Prominent Stores Explorer Drawer ── */}
      <GoogleMapsStoreDrawer
        isOpen={isStoreDrawerOpen}
        onClose={onToggleStoreDrawer}
        selectedStoreId={selectedStoreId}
        onSelectStore={onSelectStore}
      />
    </div>
  );
};

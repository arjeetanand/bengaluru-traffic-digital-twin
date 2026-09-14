import React, { useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crosshair,
  Gauge,
  Layers3,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Route,
  SlidersHorizontal,
  TimerReset,
  TriangleAlert,
  Waves,
  Zap
} from 'lucide-react';
import {
  ProvenanceTag,
  ScenarioDefinition,
  ScenarioMetrics,
  SimulationViewMode
} from '../../types';
import '../../styles/scenarioControlRoom.css';

export interface ScenarioControlRoomProps {
  scenarios: readonly ScenarioDefinition[];
  selectedScenarioId: string;
  baselineMetrics: ScenarioMetrics;
  counterfactualMetrics: ScenarioMetrics | null;
  activeViewMode: SimulationViewMode;
  simulationProgress: number;
  simulationTimeSeconds: number;
  simulationStartSeconds?: number;
  simulationEndSeconds?: number;
  isPlaying: boolean;
  isRunning?: boolean;
  provenance?: Readonly<Record<string, ProvenanceTag>>;
  onSelectScenario: (scenarioId: string) => void;
  onRunScenario: (scenarioId: string) => void;
  onResetScenario: () => void;
  onTogglePlayback: () => void;
  onScrubSimulation: (progress: number) => void;
  onRestartSimulation?: () => void;
  className?: string;
}

type MetricKey = keyof ScenarioMetrics;

interface MetricDefinition {
  key: MetricKey;
  label: string;
  description: string;
  unit: string;
  higherIsBetter: boolean;
  precision?: number;
}

const METRICS: readonly MetricDefinition[] = [
  {
    key: 'averageTravelTimeMinutes',
    label: 'Average travel time',
    description: 'Mean route time',
    unit: 'min',
    higherIsBetter: false
  },
  {
    key: 'averageDelayMinutes',
    label: 'Average delay',
    description: 'Delay per vehicle',
    unit: 'min',
    higherIsBetter: false
  },
  {
    key: 'throughputVehiclesPerHour',
    label: 'Throughput',
    description: 'Vehicles served',
    unit: 'veh/h',
    higherIsBetter: true,
    precision: 0
  },
  {
    key: 'vehicleMinutes',
    label: 'Vehicle-minutes',
    description: 'Total time in network',
    unit: 'veh·min',
    higherIsBetter: false,
    precision: 0
  },
  {
    key: 'maxQueueMeters',
    label: 'Maximum queue',
    description: 'Peak queue extent',
    unit: 'm',
    higherIsBetter: false,
    precision: 0
  },
  {
    key: 'congestionRatio',
    label: 'Congestion ratio',
    description: 'Speed / free-flow speed',
    unit: '%',
    higherIsBetter: true,
    precision: 1
  },
  {
    key: 'queueSpilloverMeters',
    label: 'Spillover queue',
    description: 'Additional route pressure',
    unit: 'm',
    higherIsBetter: false,
    precision: 0
  },
  {
    key: 'idlingCO2KgHr',
    label: 'Idling emissions',
    description: 'Modelled CO₂ rate',
    unit: 'kg CO₂/h',
    higherIsBetter: false,
    precision: 1
  }
];

const VIEW_MODE_LABELS: Record<SimulationViewMode, string> = {
  explore: 'EXPLORE',
  replay: 'REPLAY',
  simulate: 'SIMULATE',
  compare: 'COMPARE'
};

const SCENARIO_TYPE_LABELS: Record<ScenarioDefinition['type'], string> = {
  lane_closure: 'LANE CLOSURE',
  road_closure: 'ROAD CLOSURE',
  flooding: 'FLOODING',
  accident: 'INCIDENT',
  signal_timing_change: 'SIGNAL TIMING',
  demand_increase: 'DEMAND INCREASE',
  demand_decrease: 'DEMAND DECREASE',
  event_traffic: 'EVENT TRAFFIC',
  route_diversion: 'ROUTE DIVERSION',
  one_way_conversion: 'ONE-WAY CONVERSION',
  bus_priority: 'BUS PRIORITY'
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function formatClockTime(seconds: number) {
  const normalized = ((Math.round(seconds) % 86400) + 86400) % 86400;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatMetricValue(value: number, metric: MetricDefinition) {
  const normalized = metric.key === 'congestionRatio' ? value * 100 : value;
  const precision = metric.precision ?? 1;
  const formatted = normalized.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
  return `${formatted} ${metric.unit}`;
}

function formatMetricDelta(value: number, metric: MetricDefinition) {
  const normalized = metric.key === 'congestionRatio' ? value * 100 : value;
  const precision = metric.precision ?? 1;
  const sign = normalized > 0 ? '+' : '';
  const formatted = normalized.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
  return `${sign}${formatted} ${metric.unit}`;
}

function formatParameterKey(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
}

function formatParameterValue(value: string | number | boolean) {
  if (typeof value === 'boolean') return value ? 'YES' : 'NO';
  if (typeof value === 'number') {
    return value < 1 && value > 0 ? `${Math.round(value * 100)}%` : String(value);
  }
  return value.replace(/_/g, ' ').toUpperCase();
}

function getDeltaTone(value: number, higherIsBetter: boolean) {
  if (value === 0) return 'neutral';
  const isImprovement = higherIsBetter ? value > 0 : value < 0;
  return isImprovement ? 'positive' : 'negative';
}

function DeltaValue({ value, metric }: { value: number; metric: MetricDefinition }) {
  const tone = getDeltaTone(value, metric.higherIsBetter);
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : CheckCircle2;
  const direction = value === 0 ? 'No change' : tone === 'positive' ? 'Improvement' : 'Adverse change';

  return (
    <span className={`scenario-delta scenario-delta--${tone}`}>
      <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
      <span>{value === 0 ? '0' : formatMetricDelta(value, metric)}</span>
      <span className="scenario-visually-hidden">{direction}</span>
    </span>
  );
}

function MetricRow({
  metric,
  baseline,
  counterfactual
}: {
  metric: MetricDefinition;
  baseline: ScenarioMetrics;
  counterfactual: ScenarioMetrics | null;
}) {
  const baselineValue = baseline[metric.key];
  const counterfactualValue = counterfactual?.[metric.key] ?? null;
  const delta = counterfactualValue === null ? null : counterfactualValue - baselineValue;

  return (
    <tr>
      <th scope="row">
        <span className="scenario-metric-label">{metric.label}</span>
        <span className="scenario-metric-description">{metric.description}</span>
      </th>
      <td>{formatMetricValue(baselineValue, metric)}</td>
      <td className={counterfactualValue === null ? 'scenario-metric-pending' : undefined}>
        {counterfactualValue === null ? '—' : formatMetricValue(counterfactualValue, metric)}
      </td>
      <td>
        {delta === null ? (
          <span className="scenario-delta scenario-delta--pending">RUN TO CALCULATE</span>
        ) : (
          <DeltaValue value={delta} metric={metric} />
        )}
      </td>
    </tr>
  );
}

function ProvenanceBlock({ provenance }: { provenance: Readonly<Record<string, ProvenanceTag>> }) {
  const entries = Object.entries(provenance);

  return (
    <div className="scenario-provenance" aria-label="Scenario provenance">
      <div className="scenario-section-label">
        <span>INPUT PROVENANCE</span>
        <span className="scenario-section-rule" aria-hidden="true" />
      </div>
      <div className="scenario-provenance-list">
        {entries.map(([key, value]) => (
          <span className="scenario-provenance-item" key={key}>
            <span>{formatParameterKey(key)}</span>
            <strong className={`scenario-provenance-tag scenario-provenance-tag--${value.toLowerCase()}`}>
              {value}
            </strong>
          </span>
        ))}
      </div>
      <p className="scenario-provenance-note">
        Estimates stay explicitly labelled; modelled outputs are not measurements.
      </p>
    </div>
  );
}

export const ScenarioControlRoom: React.FC<ScenarioControlRoomProps> = ({
  scenarios,
  selectedScenarioId,
  baselineMetrics,
  counterfactualMetrics,
  activeViewMode,
  simulationProgress,
  simulationTimeSeconds,
  simulationStartSeconds,
  simulationEndSeconds,
  isPlaying,
  isRunning = false,
  provenance,
  onSelectScenario,
  onRunScenario,
  onResetScenario,
  onTogglePlayback,
  onScrubSimulation,
  onRestartSimulation,
  className
}) => {
  const roomRef = useRef<HTMLElement | null>(null);
  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? scenarios[0],
    [scenarios, selectedScenarioId]
  );
  const safeProgress = clamp(simulationProgress, 0, 1);
  const timelineStartSeconds = simulationStartSeconds ?? selectedScenario?.window.startSeconds ?? 0;
  const timelineEndSeconds = simulationEndSeconds ?? selectedScenario?.window.endSeconds ?? timelineStartSeconds + 1;
  const timelineDuration = Math.max(1, timelineEndSeconds - timelineStartSeconds);
  const scenarioWindowStartProgress = clamp((selectedScenario ? selectedScenario.window.startSeconds : timelineStartSeconds) - timelineStartSeconds, 0, timelineDuration) / timelineDuration;
  const scenarioWindowEndProgress = clamp((selectedScenario ? selectedScenario.window.endSeconds : timelineEndSeconds) - timelineStartSeconds, 0, timelineDuration) / timelineDuration;
  const provenanceEntries = provenance ?? selectedScenario?.provenance ?? {};

  useEffect(() => {
    if (!counterfactualMetrics) return undefined;

    const resetScroll = () => {
      if (roomRef.current) roomRef.current.scrollTop = 0;
    };
    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [counterfactualMetrics]);

  if (!selectedScenario) {
    return (
      <section className={`scenario-control-room${className ? ` ${className}` : ''}`} aria-labelledby="scenario-room-empty">
        <div className="scenario-empty-state">
          <TriangleAlert size={18} aria-hidden="true" />
          <h2 id="scenario-room-empty">No scenario definitions available</h2>
          <p>Provide at least one reproducible scenario definition to open the control room.</p>
        </div>
      </section>
    );
  }

  const statusLabel = isRunning
    ? 'RUN IN PROGRESS'
    : counterfactualMetrics
      ? 'COUNTERFACTUAL READY'
      : 'READY TO RUN';

  return (
    <section
      ref={roomRef}
      className={`scenario-control-room${className ? ` ${className}` : ''}`}
      aria-labelledby="scenario-control-room-title"
    >
      <div className="scenario-control-room__header">
        <div className="scenario-room-kicker">
          <span className="scenario-live-mark" aria-hidden="true" />
          <span>SCENARIO CONTROL ROOM</span>
          <span className="scenario-kicker-divider" aria-hidden="true">//</span>
          <span>BENGALURU DIGITAL TWIN</span>
        </div>
        <div className="scenario-room-heading">
          <div>
            <p className="scenario-question">What happens if we change this?</p>
            <h2 id="scenario-control-room-title">{selectedScenario.title}</h2>
            <p className="scenario-room-description">{selectedScenario.description}</p>
          </div>
          <div className="scenario-room-status" aria-live="polite">
            <span className="scenario-status-label">STATUS</span>
            <strong className={isRunning ? 'is-running' : counterfactualMetrics ? 'is-ready' : ''}>{statusLabel}</strong>
            <span className="scenario-mode-readout">
              <span>VIEW</span>
              <b>{VIEW_MODE_LABELS[activeViewMode]}</b>
            </span>
          </div>
        </div>
      </div>

      <div className="scenario-control-room__layout">
        <aside className="scenario-command-rail" aria-label="Scenario command rail">
          <fieldset className="scenario-selector">
            <legend>SCENARIO LIBRARY</legend>
            <label htmlFor="scenario-control-room-select">Choose a controlled intervention</label>
            <div className="scenario-select-wrap">
              <select
                id="scenario-control-room-select"
                value={selectedScenario.id}
                onChange={(event) => onSelectScenario(event.currentTarget.value)}
              >
                {scenarios.map((scenario) => (
                  <option value={scenario.id} key={scenario.id}>{scenario.title}</option>
                ))}
              </select>
              <SlidersHorizontal size={16} aria-hidden="true" />
            </div>
            <p className="scenario-helper-text">
              <span>{scenarios.length}</span> reproducible definitions available
            </p>
          </fieldset>

          <div className="scenario-command-divider" aria-hidden="true" />

          <div className="scenario-command-block">
            <div className="scenario-section-label">
              <span>INTERVENTION TARGET</span>
              <span className="scenario-section-rule" aria-hidden="true" />
            </div>
            <div className="scenario-target-readout">
              <div className="scenario-target-icon" aria-hidden="true"><Crosshair size={18} /></div>
              <div>
                <span className="scenario-target-type">{SCENARIO_TYPE_LABELS[selectedScenario.type]}</span>
                <strong>{selectedScenario.targetLabel}</strong>
                <span>{selectedScenario.affectedLane}</span>
              </div>
            </div>
          </div>

          <div className="scenario-command-block scenario-window-readout">
            <div className="scenario-section-label">
              <span>ACTIVE WINDOW</span>
              <span className="scenario-section-rule" aria-hidden="true" />
            </div>
            <div className="scenario-window-time">
              <Clock3 size={18} aria-hidden="true" />
              <strong>{formatClockTime(selectedScenario.window.startSeconds)}</strong>
              <ChevronRight size={14} aria-hidden="true" />
              <strong>{formatClockTime(selectedScenario.window.endSeconds)}</strong>
            </div>
            <span className="scenario-window-caption">Simulation-local time · duration {Math.round((selectedScenario.window.endSeconds - selectedScenario.window.startSeconds) / 60)} min</span>
          </div>

          <div className="scenario-parameter-strip" aria-label="Scenario effect parameters">
            <div className="scenario-section-label">
              <span>MODEL EFFECT</span>
              <span className="scenario-section-rule" aria-hidden="true" />
            </div>
            <div className="scenario-parameter-list">
              {Object.entries(selectedScenario.parameters).map(([key, value]) => (
                <span key={key}>
                  <b>{formatParameterKey(key)}</b>
                  <strong>{formatParameterValue(value)}</strong>
                </span>
              ))}
            </div>
          </div>

          <div className="scenario-command-actions">
            <button
              className="scenario-run-button"
              type="button"
              onClick={() => onRunScenario(selectedScenario.id)}
              disabled={isRunning}
            >
              {isRunning ? <Activity size={17} className="scenario-spin" aria-hidden="true" /> : <Play size={17} fill="currentColor" aria-hidden="true" />}
              <span>{isRunning ? 'RUNNING SCENARIO' : 'RUN SCENARIO'}</span>
              <span className="scenario-button-key">ENTER</span>
            </button>
            <button className="scenario-reset-button" type="button" onClick={onResetScenario} disabled={isRunning}>
              <RotateCcw size={16} aria-hidden="true" />
              <span>RESET RUN</span>
            </button>
          </div>
        </aside>

        <div className="scenario-observatory">
          <section className="scenario-inspection-panel" aria-labelledby="scenario-inspection-title">
            <div className="scenario-panel-heading">
              <div>
                <span className="scenario-section-label">INSPECTION TRACE</span>
                <h3 id="scenario-inspection-title">Target / window / effect</h3>
              </div>
              <div className="scenario-panel-id"><span>ID</span>{selectedScenario.id}</div>
            </div>
            <div className="scenario-inspection-grid">
              <div className="scenario-inspection-item">
                <MapPin size={15} aria-hidden="true" />
                <span>TARGET EDGE</span>
                <strong>{selectedScenario.targetEdgeId}</strong>
              </div>
              <div className="scenario-inspection-item">
                <TimerReset size={15} aria-hidden="true" />
                <span>WINDOW</span>
                <strong>{formatClockTime(selectedScenario.window.startSeconds)}—{formatClockTime(selectedScenario.window.endSeconds)}</strong>
              </div>
              <div className="scenario-inspection-item">
                <Gauge size={15} aria-hidden="true" />
                <span>PRIMARY EFFECT</span>
                <strong>{selectedScenario.affectedLane}</strong>
              </div>
            </div>
          </section>

          <section className="scenario-metrics-panel" aria-labelledby="scenario-metrics-title">
            <div className="scenario-panel-heading scenario-panel-heading--metrics">
              <div>
                <span className="scenario-section-label">MODELLED OUTPUTS</span>
                <h3 id="scenario-metrics-title">Baseline vs counterfactual</h3>
              </div>
              <div className="scenario-metric-legend" aria-label="Metric comparison legend">
                <span><i className="scenario-legend-swatch scenario-legend-swatch--baseline" aria-hidden="true" />BASELINE</span>
                <span><i className="scenario-legend-swatch scenario-legend-swatch--counterfactual" aria-hidden="true" />COUNTERFACTUAL</span>
              </div>
            </div>
            <div className="scenario-table-wrap">
              <table className="scenario-metrics-table">
                <caption className="scenario-visually-hidden">Baseline, counterfactual, and delta metrics for the selected scenario</caption>
                <thead>
                  <tr>
                    <th scope="col">Metric</th>
                    <th scope="col">Baseline</th>
                    <th scope="col">Counterfactual</th>
                    <th scope="col">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((metric) => (
                    <MetricRow key={metric.key} metric={metric} baseline={baselineMetrics} counterfactual={counterfactualMetrics} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="scenario-spillover-panel" aria-labelledby="scenario-spillover-title">
            <div className="scenario-panel-heading">
              <div>
                <span className="scenario-section-label">NETWORK REDISTRIBUTION</span>
                <h3 id="scenario-spillover-title">Where the queue goes</h3>
              </div>
              <span className="scenario-panel-note"><Waves size={14} aria-hidden="true" />SPILLOVER TARGETS</span>
            </div>
            <div className="scenario-spillover-list">
              {selectedScenario.spillover.map((target) => (
                <div className="scenario-spillover-row" key={target.edgeId}>
                  <div className="scenario-spillover-label">
                    <Route size={15} aria-hidden="true" />
                    <span>{target.label}</span>
                  </div>
                  <div className="scenario-spillover-bar" aria-hidden="true">
                    <span className={`scenario-spillover-fill scenario-spillover-fill--${target.relativeImpact}`} style={{ width: `${Math.min(100, Math.max(12, target.queueMeters / 10))}%` }} />
                  </div>
                  <strong>{target.queueMeters.toLocaleString()} m</strong>
                  <span className={`scenario-impact-label scenario-impact-label--${target.relativeImpact}`}>{target.relativeImpact.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </section>

          <ProvenanceBlock provenance={provenanceEntries} />

          <section className="scenario-timeline-panel" aria-labelledby="scenario-timeline-title">
            <div className="scenario-timeline-heading">
              <div>
                <span className="scenario-section-label">SIMULATION CLOCK</span>
                <h3 id="scenario-timeline-title">Scrub the corridor state</h3>
              </div>
              <div className="scenario-time-readout" aria-live="polite">
                <span>LOCAL SIM TIME</span>
                <strong>{formatClockTime(simulationTimeSeconds)}</strong>
              </div>
            </div>
            <div className="scenario-range-wrap">
              <div className="scenario-range-track" aria-hidden="true">
                <span
                  className="scenario-range-window"
                  style={{
                    left: `${scenarioWindowStartProgress * 100}%`,
                    width: `${Math.max(0, scenarioWindowEndProgress - scenarioWindowStartProgress) * 100}%`
                  }}
                />
                <span className="scenario-range-progress" style={{ width: `${safeProgress * 100}%` }} />
              </div>
              <input
                className="scenario-range-input"
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={safeProgress}
                aria-label={`Simulation progress at ${formatClockTime(simulationTimeSeconds)}`}
                onChange={(event) => onScrubSimulation(Number(event.currentTarget.value))}
              />
            </div>
            <div className="scenario-range-labels">
              <span>{formatClockTime(timelineStartSeconds)} <small>START</small></span>
              <span className="scenario-range-labels__window">{formatClockTime(selectedScenario.window.startSeconds)}—{formatClockTime(selectedScenario.window.endSeconds)} <small>SCENARIO WINDOW</small></span>
              <span>{formatClockTime(timelineEndSeconds)} <small>END</small></span>
            </div>
            <div className="scenario-playback-controls">
              <button className="scenario-play-button" type="button" onClick={onTogglePlayback} aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}>
                {isPlaying ? <Pause size={16} fill="currentColor" aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>
              {onRestartSimulation ? (
                <button className="scenario-timeline-button" type="button" onClick={onRestartSimulation}>
                  <RotateCcw size={15} aria-hidden="true" />
                  <span>RESTART</span>
                </button>
              ) : null}
              <span className="scenario-playback-state"><span className={isPlaying ? 'scenario-state-dot is-playing' : 'scenario-state-dot'} aria-hidden="true" />{isPlaying ? 'TIME ADVANCING' : 'TIME PAUSED'}</span>
              <span className="scenario-playback-mode"><Layers3 size={14} aria-hidden="true" />{VIEW_MODE_LABELS[activeViewMode]} STATE STREAM</span>
            </div>
          </section>
        </div>
      </div>

      <div className="scenario-control-room__footer">
        <span><Zap size={14} aria-hidden="true" />CONTROLLED SEED REQUIRED FOR REPRODUCTION</span>
        <span><Activity size={14} aria-hidden="true" />{counterfactualMetrics ? 'DELTA VALUES GENERATED FROM THE LATEST RUN' : 'COUNTERFACTUAL VALUES APPEAR AFTER A RUN'}</span>
      </div>
    </section>
  );
};

export default ScenarioControlRoom;

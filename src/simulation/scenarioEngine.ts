import {
  ScenarioDefinition,
  ScenarioMetrics,
  ScenarioRun,
  ScenarioType,
  ScenarioVisualState,
  SimulationMetrics,
  TrafficFlowData
} from '../types';

export const SIMULATION_CLOCK = {
  startSeconds: 8 * 60 * 60,
  endSeconds: 9 * 60 * 60 + 30 * 60,
  stepSeconds: 0.1
} as const;

export const DEFAULT_SCENARIO_SEED = 'marathahalli-demo-seed-01';

type ScenarioEffect = {
  travelTimeMultiplier: number;
  delayMultiplier: number;
  throughputMultiplier: number;
  maxQueueMultiplier: number;
  averageQueueMultiplier: number;
  stoppedTimeMultiplier: number;
  spilloverMultiplier: number;
  congestionMultiplier: number;
  emissionsMultiplier: number;
};

const EFFECTS: Record<ScenarioType, ScenarioEffect> = {
  lane_closure: {
    travelTimeMultiplier: 1.51,
    delayMultiplier: 2.39,
    throughputMultiplier: 0.84,
    maxQueueMultiplier: 2.95,
    averageQueueMultiplier: 1.82,
    stoppedTimeMultiplier: 2.11,
    spilloverMultiplier: 4.62,
    congestionMultiplier: 0.69,
    emissionsMultiplier: 1.45
  },
  road_closure: {
    travelTimeMultiplier: 2.06,
    delayMultiplier: 3.2,
    throughputMultiplier: 0.68,
    maxQueueMultiplier: 4.1,
    averageQueueMultiplier: 2.85,
    stoppedTimeMultiplier: 3.24,
    spilloverMultiplier: 6.2,
    congestionMultiplier: 0.54,
    emissionsMultiplier: 1.8
  },
  flooding: {
    travelTimeMultiplier: 1.82,
    delayMultiplier: 2.72,
    throughputMultiplier: 0.73,
    maxQueueMultiplier: 3.54,
    averageQueueMultiplier: 2.3,
    stoppedTimeMultiplier: 2.66,
    spilloverMultiplier: 5.3,
    congestionMultiplier: 0.6,
    emissionsMultiplier: 1.62
  },
  accident: {
    travelTimeMultiplier: 1.68,
    delayMultiplier: 2.45,
    throughputMultiplier: 0.78,
    maxQueueMultiplier: 3.1,
    averageQueueMultiplier: 2.08,
    stoppedTimeMultiplier: 2.32,
    spilloverMultiplier: 4.8,
    congestionMultiplier: 0.64,
    emissionsMultiplier: 1.52
  },
  signal_timing_change: {
    travelTimeMultiplier: 0.92,
    delayMultiplier: 0.74,
    throughputMultiplier: 1.08,
    maxQueueMultiplier: 0.72,
    averageQueueMultiplier: 0.79,
    stoppedTimeMultiplier: 0.76,
    spilloverMultiplier: 0.7,
    congestionMultiplier: 1.08,
    emissionsMultiplier: 0.82
  },
  demand_increase: {
    travelTimeMultiplier: 1.37,
    delayMultiplier: 1.88,
    throughputMultiplier: 0.91,
    maxQueueMultiplier: 2.28,
    averageQueueMultiplier: 1.6,
    stoppedTimeMultiplier: 1.82,
    spilloverMultiplier: 3.28,
    congestionMultiplier: 0.78,
    emissionsMultiplier: 1.31
  },
  demand_decrease: {
    travelTimeMultiplier: 0.79,
    delayMultiplier: 0.55,
    throughputMultiplier: 1.05,
    maxQueueMultiplier: 0.58,
    averageQueueMultiplier: 0.64,
    stoppedTimeMultiplier: 0.6,
    spilloverMultiplier: 0.44,
    congestionMultiplier: 1.18,
    emissionsMultiplier: 0.68
  },
  event_traffic: {
    travelTimeMultiplier: 1.58,
    delayMultiplier: 2.34,
    throughputMultiplier: 0.82,
    maxQueueMultiplier: 3.22,
    averageQueueMultiplier: 2.24,
    stoppedTimeMultiplier: 2.5,
    spilloverMultiplier: 4.4,
    congestionMultiplier: 0.66,
    emissionsMultiplier: 1.48
  },
  route_diversion: {
    travelTimeMultiplier: 1.22,
    delayMultiplier: 1.54,
    throughputMultiplier: 0.96,
    maxQueueMultiplier: 1.72,
    averageQueueMultiplier: 1.34,
    stoppedTimeMultiplier: 1.46,
    spilloverMultiplier: 2.36,
    congestionMultiplier: 0.88,
    emissionsMultiplier: 1.16
  },
  one_way_conversion: {
    travelTimeMultiplier: 1.29,
    delayMultiplier: 1.66,
    throughputMultiplier: 0.89,
    maxQueueMultiplier: 2.0,
    averageQueueMultiplier: 1.52,
    stoppedTimeMultiplier: 1.62,
    spilloverMultiplier: 2.74,
    congestionMultiplier: 0.82,
    emissionsMultiplier: 1.24
  },
  bus_priority: {
    travelTimeMultiplier: 0.95,
    delayMultiplier: 0.82,
    throughputMultiplier: 1.03,
    maxQueueMultiplier: 0.86,
    averageQueueMultiplier: 0.9,
    stoppedTimeMultiplier: 0.84,
    spilloverMultiplier: 0.74,
    congestionMultiplier: 1.04,
    emissionsMultiplier: 0.88
  }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function stableNoise(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 2001) / 1000 - 1;
}

export function formatSimulationTime(seconds: number) {
  const normalized = ((Math.round(seconds) % 86400) + 86400) % 86400;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function parseSimulationTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return SIMULATION_CLOCK.startSeconds;
  return clamp(hours * 3600 + minutes * 60, SIMULATION_CLOCK.startSeconds, SIMULATION_CLOCK.endSeconds);
}

export function deriveScenarioBaseline(
  flowData: TrafficFlowData,
  metrics: SimulationMetrics,
  vehicleCount: number
): ScenarioMetrics {
  const travelTimeMinutes = Math.max(0.1, flowData.currentTravelTime / 60);
  const delayMinutes = Math.max(0, (flowData.currentTravelTime - flowData.freeFlowTravelTime) / 60);
  const maxQueueMeters = Math.round(250 + (1 - clamp(flowData.congestionRatio, 0.18, 1)) * 180);
  const averageQueueMeters = Math.round(maxQueueMeters * 0.48);
  const vehicleMinutes = Math.round((vehicleCount * travelTimeMinutes) * 10) / 10;
  const stoppedTimeMinutes = Math.round(vehicleCount * delayMinutes * 10) / 10;

  return {
    averageTravelTimeMinutes: round(travelTimeMinutes),
    averageDelayMinutes: round(delayMinutes),
    throughputVehiclesPerHour: Math.max(0, Math.round(metrics.avgFlowPerHour)),
    maxQueueMeters,
    averageQueueMeters,
    vehicleMinutes,
    stoppedTimeMinutes,
    queueSpilloverMeters: Math.round(maxQueueMeters * 0.88),
    idlingCO2KgHr: round(metrics.idlingCO2KgHr),
    congestionRatio: round(clamp(flowData.congestionRatio, 0.18, 1), 3)
  };
}

function subtractMetrics(counterfactual: ScenarioMetrics, baseline: ScenarioMetrics): ScenarioMetrics {
  return {
    averageTravelTimeMinutes: round(counterfactual.averageTravelTimeMinutes - baseline.averageTravelTimeMinutes),
    averageDelayMinutes: round(counterfactual.averageDelayMinutes - baseline.averageDelayMinutes),
    throughputVehiclesPerHour: Math.round(counterfactual.throughputVehiclesPerHour - baseline.throughputVehiclesPerHour),
    maxQueueMeters: Math.round(counterfactual.maxQueueMeters - baseline.maxQueueMeters),
    averageQueueMeters: Math.round(counterfactual.averageQueueMeters - baseline.averageQueueMeters),
    vehicleMinutes: round(counterfactual.vehicleMinutes - baseline.vehicleMinutes),
    stoppedTimeMinutes: round(counterfactual.stoppedTimeMinutes - baseline.stoppedTimeMinutes),
    queueSpilloverMeters: Math.round(counterfactual.queueSpilloverMeters - baseline.queueSpilloverMeters),
    idlingCO2KgHr: round(counterfactual.idlingCO2KgHr - baseline.idlingCO2KgHr),
    congestionRatio: round(counterfactual.congestionRatio - baseline.congestionRatio, 3)
  };
}

export function runScenario(
  scenario: ScenarioDefinition,
  baseline: ScenarioMetrics,
  seed = DEFAULT_SCENARIO_SEED
): ScenarioRun {
  const effect = EFFECTS[scenario.type];
  const jitter = stableNoise(`${seed}:${scenario.id}`) * 0.02;
  const multiplier = (value: number) => value * (1 + jitter);
  const counterfactual: ScenarioMetrics = {
    averageTravelTimeMinutes: round(multiplier(baseline.averageTravelTimeMinutes * effect.travelTimeMultiplier)),
    averageDelayMinutes: round(multiplier(baseline.averageDelayMinutes * effect.delayMultiplier)),
    throughputVehiclesPerHour: Math.max(0, Math.round(multiplier(baseline.throughputVehiclesPerHour * effect.throughputMultiplier))),
    maxQueueMeters: Math.max(0, Math.round(multiplier(baseline.maxQueueMeters * effect.maxQueueMultiplier))),
    averageQueueMeters: Math.max(0, Math.round(multiplier(baseline.averageQueueMeters * effect.averageQueueMultiplier))),
    vehicleMinutes: round(multiplier(baseline.vehicleMinutes * effect.travelTimeMultiplier)),
    stoppedTimeMinutes: round(multiplier(baseline.stoppedTimeMinutes * effect.stoppedTimeMultiplier)),
    queueSpilloverMeters: Math.max(0, Math.round(multiplier(baseline.queueSpilloverMeters * effect.spilloverMultiplier))),
    idlingCO2KgHr: round(multiplier(baseline.idlingCO2KgHr * effect.emissionsMultiplier)),
    congestionRatio: round(clamp(multiplier(baseline.congestionRatio * effect.congestionMultiplier), 0.18, 0.98), 3)
  };

  return {
    scenario,
    baseline,
    counterfactual,
    delta: subtractMetrics(counterfactual, baseline),
    seed,
    ranAt: Date.now()
  };
}

export function getScenarioVisualState(
  run: ScenarioRun | null,
  simulationTimeSeconds: number,
  viewMode: 'explore' | 'replay' | 'simulate' | 'compare',
  fallbackCongestionRatio = 0.62
): ScenarioVisualState {
  if (!run) {
    return {
      isActive: false,
      progress: 0,
      congestionRatio: clamp(fallbackCongestionRatio, 0.18, 0.98),
      speedMultiplier: 1,
      spilloverEdges: []
    };
  }

  const { startSeconds, endSeconds } = run.scenario.window;
  const duration = Math.max(1, endSeconds - startSeconds);
  const inWindow = simulationTimeSeconds >= startSeconds && simulationTimeSeconds <= endSeconds;
  const isCompare = viewMode === 'compare';
  if (!inWindow && !isCompare) {
    return {
      isActive: false,
      progress: 0,
      congestionRatio: run.baseline.congestionRatio,
      speedMultiplier: 1,
      spilloverEdges: []
    };
  }

  const normalizedProgress = isCompare ? 1 : clamp((simulationTimeSeconds - startSeconds) / duration, 0, 1);
  const ramp = isCompare ? 1 : clamp(Math.min(normalizedProgress * 8, (1 - normalizedProgress) * 8, 1), 0.18, 1);
  const ratioDelta = run.delta.congestionRatio * ramp;
  const speedMultiplier = clamp(1 + (run.counterfactual.congestionRatio / Math.max(0.18, run.baseline.congestionRatio) - 1) * ramp, 0.45, 1.3);

  return {
    isActive: true,
    progress: normalizedProgress,
    congestionRatio: clamp(run.baseline.congestionRatio + ratioDelta, 0.18, 0.98),
    speedMultiplier,
    closedEdgeId: run.scenario.targetEdgeId,
    affectedLane: run.scenario.affectedLane,
    spilloverEdges: run.scenario.spillover.map((edge) => ({
      edgeId: edge.edgeId,
      label: edge.label,
      intensity: clamp((edge.relativeImpact === 'high' ? 1 : edge.relativeImpact === 'medium' ? 0.68 : 0.4) * ramp, 0.2, 1),
      queueMeters: Math.round(edge.queueMeters * ramp)
    }))
  };
}

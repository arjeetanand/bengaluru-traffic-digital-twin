export type VehicleType = 'car' | 'auto' | 'bus' | 'twoWheeler';

export type SimulationViewMode = 'explore' | 'replay' | 'simulate' | 'compare';

export type ScenarioType =
  | 'lane_closure'
  | 'road_closure'
  | 'flooding'
  | 'accident'
  | 'signal_timing_change'
  | 'demand_increase'
  | 'demand_decrease'
  | 'event_traffic'
  | 'route_diversion'
  | 'one_way_conversion'
  | 'bus_priority';

export type ProvenanceTag = 'MEASURED' | 'DERIVED' | 'ASSUMED';

export interface ScenarioSpilloverTarget {
  edgeId: string;
  label: string;
  relativeImpact: 'low' | 'medium' | 'high';
  queueMeters: number;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  type: ScenarioType;
  description: string;
  targetEdgeId: string;
  targetLabel: string;
  affectedLane: string;
  window: {
    startSeconds: number;
    endSeconds: number;
  };
  parameters: Readonly<Record<string, string | number | boolean>>;
  spillover: readonly ScenarioSpilloverTarget[];
  provenance: Readonly<Record<string, ProvenanceTag>>;
}

export interface ScenarioMetrics {
  averageTravelTimeMinutes: number;
  averageDelayMinutes: number;
  throughputVehiclesPerHour: number;
  maxQueueMeters: number;
  averageQueueMeters: number;
  vehicleMinutes: number;
  stoppedTimeMinutes: number;
  queueSpilloverMeters: number;
  idlingCO2KgHr: number;
  congestionRatio: number;
}

export interface ScenarioRun {
  scenario: ScenarioDefinition;
  baseline: ScenarioMetrics;
  counterfactual: ScenarioMetrics;
  delta: ScenarioMetrics;
  seed: string;
  ranAt: number;
}

export interface ScenarioSpilloverVisual {
  edgeId: string;
  label: string;
  intensity: number;
  queueMeters: number;
}

export interface ScenarioVisualState {
  isActive: boolean;
  progress: number;
  congestionRatio: number;
  speedMultiplier: number;
  closedEdgeId?: string;
  affectedLane?: string;
  spilloverEdges: readonly ScenarioSpilloverVisual[];
}

export interface TrafficFlowData {
  currentSpeed: number; // km/h
  freeFlowSpeed: number; // km/h
  currentTravelTime: number; // seconds
  freeFlowTravelTime: number; // seconds
  confidence: number; // 0.0 - 1.0
  roadClosure: boolean;
  frc?: string;
  timestamp: number;
  isDemo: boolean;
  congestionRatio: number; // currentSpeed / freeFlowSpeed (0.0 to 1.0+)
  networkHealth: number; // 0 to 100
}

export interface ApiUsageStats {
  callCount: number;
  dailyLimit: number;
  capPercentage: number; // e.g. 30 (%)
  capCount: number; // e.g. 750
  isCapped: boolean;
  lastCallTime: number | null;
  lastError: string | null;
}

export type CameraPreset =
  | 'overview'
  | 'underpass'
  | 'surface'
  | 'aerial'
  | 'cinematic'
  | 'flyover'
  | 'ground'
  | 'multiplex'
  | 'kalamandir'
  | 'brandfactory'
  | 'skywalk'
  | 'spicegarden'
  | 'crossover'
  | 'corridor'
  | 'oraclehub'
  | 'kadubeesanahalli'
  | 'bellandur';

export type CameraMode = 'walk' | 'overview';

export type BuildingRenderMode = 'osm' | 'google-tiles';

export interface SimulationMode {
  isNight: boolean;
  isRaining: boolean;
  simSpeed: 1 | 10 | 60;
  isCinematic: boolean;
  vehicleCount: number;
  cameraPreset: CameraPreset;
  cameraMode: CameraMode;
  footpathAuditMode: boolean;
  buildingMode: BuildingRenderMode;
  googleMapsApiKey?: string;
}

export interface FootpathWalkabilityMetrics {
  totalMeters: number;
  pavedWalkablePct: number;
  missingUnpavedPct: number;
  blockedEncroachedPct: number;
}

export interface SimulationMetrics {
  networkHealth: number; // 0 - 100
  avgFlowPerHour: number; // veh/hr passing junction
  avgDelaySeconds: number; // delay per vehicle
  idlingCO2KgHr: number; // modeled estimate
  fuelWastedLitersHr: number; // modeled estimate
  activeVehicleCount: number;
  congestionIndex: 'Smooth' | 'Moderate' | 'Heavy' | 'Gridlock';
}

export type SignalPhase =
  | 'NS_GREEN'
  | 'NS_AMBER'
  | 'EW_GREEN'
  | 'EW_AMBER';

export interface SignalStatus {
  phase: SignalPhase;
  timer: number;
  nsColor: 'green' | 'amber' | 'red';
  ewColor: 'green' | 'amber' | 'red';
}

export type VehicleType = 'car' | 'auto' | 'bus' | 'twoWheeler';

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
  | 'spicegarden'
  | 'crossover';

export type BuildingRenderMode = 'osm' | 'google-tiles';

export interface SimulationMode {
  isNight: boolean;
  isRaining: boolean;
  simSpeed: 1 | 10 | 60;
  isCinematic: boolean;
  vehicleCount: number;
  cameraPreset: CameraPreset;
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

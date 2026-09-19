import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import {
  TrafficFlowData,
  SimulationMode,
  ApiUsageStats,
  SimulationMetrics,
  ScenarioRun,
  SimulationViewMode
} from './types';
import { SIMULATION_CONFIG } from './config/simulation';
import {
  fetchTrafficFlow,
  getApiUsageStats,
  resetApiUsage
} from './services/tomtomService';
import { getBakedDemoTrafficData } from './services/demoTrafficData';
import { useTrafficSignals } from './components/canvas/traffic/TrafficSignals';
import { Scene } from './components/canvas/Scene';
import { HUD } from './components/ui/HUD';
import { JunctionDetailModal } from './components/ui/JunctionDetailModal';
import { GoogleMapsStore } from './data/GoogleMapsStoreRegistry';
import { SCENARIO_DEFINITIONS, DEFAULT_SCENARIO_ID, getScenarioDefinition } from './data/scenarioDefinitions';
import {
  SIMULATION_CLOCK,
  deriveScenarioBaseline,
  getScenarioVisualState,
  runScenario
} from './simulation/scenarioEngine';
import { useSimulationClock } from './simulation/useSimulationClock';
import { ScenarioControlRoom } from './components/ui/ScenarioControlRoom';

export const App: React.FC = () => {
  // ── Simulation Controls Mode ──
  const [mode, setMode] = useState<SimulationMode>({
    isNight: false,
    isRaining: false,
    simSpeed: 1,
    isCinematic: false,
    vehicleCount: SIMULATION_CONFIG.defaultVehicleCount,
    cameraPreset: 'overview',
    cameraMode: 'overview',
    footpathAuditMode: false,
    buildingMode: 'osm',
    googleMapsApiKey: (import.meta.env.VITE_GOOGLE_MAPS_KEY as string) || ''
  });

  // ── Force Demo Toggle State: Default to TRUE as requested for developer 3D model perfection ──
  const [forceDemo, setForceDemo] = useState(true);

  // ── Telemetry & Live Data State ──
  const [flowData, setFlowData] = useState<TrafficFlowData>(() => getBakedDemoTrafficData());
  const [usage, setUsage] = useState<ApiUsageStats>(() => getApiUsageStats());
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [isJunctionModalOpen, setIsJunctionModalOpen] = useState(false);
  const [isScenarioRoomOpen, setIsScenarioRoomOpen] = useState(false);
  const [isSketchfabLabOpen, setIsSketchfabLabOpen] = useState(false);
  const [viewMode, setViewMode] = useState<SimulationViewMode>('explore');
  const [selectedScenarioId, setSelectedScenarioId] = useState(DEFAULT_SCENARIO_ID);
  const [scenarioRun, setScenarioRun] = useState<ScenarioRun | null>(null);
  const [isScenarioPlaying, setIsScenarioPlaying] = useState(false);
  const scenarioRoomRef = useRef<HTMLDivElement>(null);
  const { simulationTimeSeconds, setTime, restart: restartSimulation } = useSimulationClock({
    isPlaying: isScenarioPlaying,
    speed: mode.simSpeed
  });

  // Keep polling stable across mode changes and share any already-running
  // request when a toggle/reset happens at the same time as the interval.
  const forceDemoRef = useRef(forceDemo);
  forceDemoRef.current = forceDemo;
  const pendingTrafficRequestsRef = useRef(new Map<boolean, Promise<void>>());

  // ── Prominent Google Maps Stores Explorer State ──
  const [selectedStore, setSelectedStore] = useState<GoogleMapsStore | undefined>(undefined);
  const [isStoreDrawerOpen, setIsStoreDrawerOpen] = useState(false);
  const handleToggleStoreDrawer = useCallback(() => {
    setIsStoreDrawerOpen((prev) => !prev);
  }, []);

  // ── Traffic Signals State Machine Hook ──
  const signalStatus = useTrafficSignals({ simSpeedMultiplier: mode.simSpeed });

  // ── Live Traffic Fetch Routine ──
  const loadTraffic = useCallback((forced: boolean): Promise<void> => {
    const pendingRequest = pendingTrafficRequestsRef.current.get(forced);
    if (pendingRequest) {
      return pendingRequest;
    }

    const request = (async () => {
      try {
        const result = await fetchTrafficFlow(forced);

        // A slower request from the previous mode must not overwrite the
        // mode the user has already selected.
        if (forceDemoRef.current !== forced) {
          return;
        }

        setFlowData(result.data);
        setUsage(result.usage);
        // A successful response is authoritative for the mode just selected.
        // Clear stale demo/live copy when the provider returns no notice.
        setNotice(result.notice);
      } catch (e) {
        // Preserve the existing fallback behavior, but only apply it if this
        // request still belongs to the active traffic mode.
        if (forceDemoRef.current !== forced) {
          return;
        }

        console.warn('Traffic fetch encountered error, fallback active', e);
        setFlowData(getBakedDemoTrafficData());
      }
    })();

    pendingTrafficRequestsRef.current.set(forced, request);
    void request.finally(() => {
      if (pendingTrafficRequestsRef.current.get(forced) === request) {
        pendingTrafficRequestsRef.current.delete(forced);
      }
    });

    return request;
  }, []);

  // Initial load and periodic 180s polling. The interval remains mounted when
  // the source toggle changes, so it cannot create a second live poller.
  useEffect(() => {
    void loadTraffic(forceDemoRef.current);

    const interval = setInterval(() => {
      void loadTraffic(forceDemoRef.current);
    }, SIMULATION_CONFIG.tomtom.fetchIntervalMs);

    return () => clearInterval(interval);
  }, [loadTraffic]);

  // ── Dynamic Modelled Simulation Metrics ──
  const metrics: SimulationMetrics = useMemo(() => {
    const ratio = flowData.congestionRatio;

    // Congestion classification
    let congestionIndex: 'Smooth' | 'Moderate' | 'Heavy' | 'Gridlock' = 'Moderate';
    if (ratio >= 0.75) congestionIndex = 'Smooth';
    else if (ratio >= 0.50) congestionIndex = 'Moderate';
    else if (ratio >= 0.32) congestionIndex = 'Heavy';
    else congestionIndex = 'Gridlock';

    // Flow volume estimate based on active vehicles and current speed
    const baseHourlyCapacity = 4800; // veh/hr for 6-lane + flyover corridor
    const avgFlowPerHour = Math.round(baseHourlyCapacity * Math.max(0.2, Math.min(1.15, ratio * 1.05)));

    // Delay per vehicle compared to free flow
    const rawDelay = Math.max(0, flowData.currentTravelTime - flowData.freeFlowTravelTime);
    const avgDelaySeconds = Math.round(rawDelay * 0.15 + (1 - Math.min(1, ratio)) * 45);

    // Modeled Idling Emissions & Fuel Consumption (based on stopped queue count)
    const stoppedVehiclesRatio = signalStatus.nsColor === 'red' || signalStatus.ewColor === 'red' ? 0.38 : 0.18;
    const idlingVehicleCount = Math.round(mode.vehicleCount * stoppedVehiclesRatio * (1 - ratio * 0.45));

    const fuelWastedLitersHr = Number(
      (idlingVehicleCount * (SIMULATION_CONFIG.emissions.fuelConsumptionIdleLitersPerHr / 60) * 12).toFixed(1)
    );
    const idlingCO2KgHr = Number(
      (fuelWastedLitersHr * SIMULATION_CONFIG.emissions.co2KgPerLiterFuel).toFixed(1)
    );

    return {
      networkHealth: flowData.networkHealth,
      avgFlowPerHour,
      avgDelaySeconds,
      idlingCO2KgHr,
      fuelWastedLitersHr,
      activeVehicleCount: mode.vehicleCount,
      congestionIndex
    };
  }, [flowData, signalStatus, mode.vehicleCount]);

  const baselineScenarioMetrics = useMemo(
    () => deriveScenarioBaseline(flowData, metrics, mode.vehicleCount),
    [flowData, metrics, mode.vehicleCount]
  );

  const scenarioVisualState = useMemo(
    () => getScenarioVisualState(
      scenarioRun,
      simulationTimeSeconds,
      viewMode,
      flowData.congestionRatio
    ),
    [scenarioRun, simulationTimeSeconds, viewMode, flowData.congestionRatio]
  );

  const simulationProgress = useMemo(() => {
    const duration = SIMULATION_CLOCK.endSeconds - SIMULATION_CLOCK.startSeconds;
    return duration <= 0
      ? 0
      : (simulationTimeSeconds - SIMULATION_CLOCK.startSeconds) / duration;
  }, [simulationTimeSeconds]);

  const handleUpdateMode = (updates: Partial<SimulationMode>) => {
    setMode((prev) => ({ ...prev, ...updates }));
  };

  const handleToggleDemo = () => {
    const nextDemoState = !forceDemo;
    forceDemoRef.current = nextDemoState;
    setNotice(undefined);
    setForceDemo(nextDemoState);
    void loadTraffic(nextDemoState);
  };

  const handleResetUsage = () => {
    const freshUsage = resetApiUsage();
    setUsage(freshUsage);
    setNotice('TomTom API local usage counter reset to 0');
    // Demo mode is intentionally offline. Resetting its local quota must not
    // spend a live request; live mode refreshes once, reusing any pending poll.
    if (!forceDemo) void loadTraffic(false);
  };

  const handleOpenScenarioRoom = useCallback(() => {
    setIsScenarioRoomOpen(true);
    setViewMode('simulate');
  }, []);

  const handleToggleSketchfabLab = useCallback(() => {
    setIsSketchfabLabOpen((previous) => !previous);
  }, []);

  const handleSelectScenario = useCallback((scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setScenarioRun(null);
    setViewMode('simulate');
    setIsScenarioPlaying(false);
    restartSimulation();
  }, [restartSimulation]);

  const handleRunScenario = useCallback((scenarioId: string) => {
    const scenario = getScenarioDefinition(scenarioId);
    const nextRun = runScenario(scenario, baselineScenarioMetrics);
    setSelectedScenarioId(scenario.id);
    setScenarioRun(nextRun);
    setViewMode('simulate');
    setIsScenarioRoomOpen(true);
    setTime(scenario.window.startSeconds);
    setIsScenarioPlaying(true);
  }, [baselineScenarioMetrics, setTime]);

  const handleResetScenario = useCallback(() => {
    setScenarioRun(null);
    setViewMode('explore');
    setIsScenarioPlaying(false);
    restartSimulation();
  }, [restartSimulation]);

  const handleSetViewMode = useCallback((nextViewMode: SimulationViewMode) => {
    if ((nextViewMode === 'replay' || nextViewMode === 'compare') && !scenarioRun) return;
    setViewMode(nextViewMode);
    if (nextViewMode === 'compare') {
      setIsScenarioPlaying(false);
    } else if (nextViewMode === 'replay' || nextViewMode === 'simulate') {
      if (scenarioRun) setTime(scenarioRun.scenario.window.startSeconds);
      setIsScenarioPlaying(true);
    } else {
      setIsScenarioPlaying(false);
    }
  }, [scenarioRun, setTime]);

  useEffect(() => {
    if (!isScenarioRoomOpen && !isSketchfabLabOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsScenarioRoomOpen(false);
        setIsSketchfabLabOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isScenarioRoomOpen, isSketchfabLabOpen]);

  useEffect(() => {
    if (isScenarioRoomOpen) scenarioRoomRef.current?.focus();
  }, [isScenarioRoomOpen]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* ── 3D Scene Viewport ── */}
      <Scene
        isNight={mode.isNight}
        isRaining={mode.isRaining}
        simSpeed={mode.simSpeed}
        isCinematic={mode.isCinematic}
        cameraPreset={mode.cameraPreset}
        cameraMode={mode.cameraMode}
        footpathAuditMode={mode.footpathAuditMode}
        buildingMode={mode.buildingMode}
        googleMapsApiKey={mode.googleMapsApiKey}
        signalStatus={signalStatus}
        congestionRatio={scenarioVisualState.congestionRatio}
        vehicleCount={mode.vehicleCount}
        scenarioVisualState={scenarioVisualState}
        onInspectJunction={() => setIsJunctionModalOpen(true)}
      />

      {/* ── Docked Dark Monospace HUD Overlay ── */}
      <HUD
        flowData={flowData}
        metrics={metrics}
        mode={mode}
        usage={usage}
        signalStatus={signalStatus}
        notice={notice}
        isStoreDrawerOpen={isStoreDrawerOpen}
        selectedStoreId={selectedStore?.id}
        onToggleStoreDrawer={handleToggleStoreDrawer}
        onSelectStore={(store) => setSelectedStore(store)}
        onUpdateMode={handleUpdateMode}
        onToggleDemo={handleToggleDemo}
        onResetUsage={handleResetUsage}
        onOpenJunctionDetail={() => setIsJunctionModalOpen(true)}
        onDismissNotice={() => setNotice(undefined)}
        isScenarioRoomOpen={isScenarioRoomOpen}
        onOpenScenarioRoom={handleOpenScenarioRoom}
        isSketchfabLabOpen={isSketchfabLabOpen}
        onToggleSketchfabLab={handleToggleSketchfabLab}
      />

      {/* ── Junction Telemetry & Detail Modal ── */}
      <JunctionDetailModal
        isOpen={isJunctionModalOpen}
        onClose={() => setIsJunctionModalOpen(false)}
        flowData={flowData}
        metrics={metrics}
        signalStatus={signalStatus}
        vehicleCount={mode.vehicleCount}
        onVehicleCountChange={(count) => handleUpdateMode({ vehicleCount: count })}
      />

      {isScenarioRoomOpen && (
        <div className="scenario-room-backdrop" role="presentation">
          <div
            className="scenario-room-shell"
            role="dialog"
            aria-modal="true"
            aria-label="Scenario control room"
            ref={scenarioRoomRef}
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setIsScenarioRoomOpen(false);
            }}
          >
            <div className="scenario-room-toolbar">
              <div className="scenario-view-mode-tabs" role="tablist" aria-label="Simulation view mode">
                {(['explore', 'replay', 'simulate', 'compare'] as SimulationViewMode[]).map((nextViewMode) => (
                  <button
                    key={nextViewMode}
                    type="button"
                    role="tab"
                    aria-selected={viewMode === nextViewMode}
                    disabled={(nextViewMode === 'replay' || nextViewMode === 'compare') && !scenarioRun}
                    className={viewMode === nextViewMode ? 'is-active' : ''}
                    onClick={() => handleSetViewMode(nextViewMode)}
                  >
                    {nextViewMode.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="scenario-room-close"
                aria-label="Close scenario control room"
                onClick={() => setIsScenarioRoomOpen(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <ScenarioControlRoom
              scenarios={SCENARIO_DEFINITIONS}
              selectedScenarioId={selectedScenarioId}
              baselineMetrics={baselineScenarioMetrics}
              counterfactualMetrics={scenarioRun?.counterfactual ?? null}
              activeViewMode={viewMode}
              simulationProgress={simulationProgress}
              simulationTimeSeconds={simulationTimeSeconds}
              simulationStartSeconds={SIMULATION_CLOCK.startSeconds}
              simulationEndSeconds={SIMULATION_CLOCK.endSeconds}
              isPlaying={isScenarioPlaying}
              isRunning={false}
              provenance={getScenarioDefinition(selectedScenarioId).provenance}
              onSelectScenario={handleSelectScenario}
              onRunScenario={handleRunScenario}
              onResetScenario={handleResetScenario}
              onTogglePlayback={() => setIsScenarioPlaying((previous) => !previous)}
              onScrubSimulation={(progress) => setTime(
                SIMULATION_CLOCK.startSeconds + progress * (SIMULATION_CLOCK.endSeconds - SIMULATION_CLOCK.startSeconds)
              )}
              onRestartSimulation={() => {
                restartSimulation();
                setIsScenarioPlaying(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

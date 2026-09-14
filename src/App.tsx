import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrafficFlowData,
  SimulationMode,
  ApiUsageStats,
  SimulationMetrics
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

export const App: React.FC = () => {
  // ── Simulation Controls Mode ──
  const [mode, setMode] = useState<SimulationMode>({
    isNight: false,
    isRaining: false,
    simSpeed: 1,
    isCinematic: false,
    vehicleCount: SIMULATION_CONFIG.defaultVehicleCount,
    cameraPreset: 'overview',
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

  // ── Traffic Signals State Machine Hook ──
  const signalStatus = useTrafficSignals({ simSpeedMultiplier: mode.simSpeed });

  // ── Live Traffic Fetch Routine ──
  const loadTraffic = useCallback(async (forced: boolean = forceDemo) => {
    try {
      const result = await fetchTrafficFlow(forced);
      setFlowData(result.data);
      setUsage(result.usage);
      if (result.notice) {
        setNotice(result.notice);
      }
    } catch (e) {
      console.warn('Traffic fetch encountered error, fallback active', e);
      setFlowData(getBakedDemoTrafficData());
    }
  }, [forceDemo]);

  // Initial load and periodic 180s live interval
  useEffect(() => {
    loadTraffic();

    const interval = setInterval(() => {
      loadTraffic();
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

  const handleUpdateMode = (updates: Partial<SimulationMode>) => {
    setMode((prev) => ({ ...prev, ...updates }));
  };

  const handleToggleDemo = () => {
    const nextDemoState = !forceDemo;
    setForceDemo(nextDemoState);
    loadTraffic(nextDemoState);
  };

  const handleResetUsage = () => {
    const freshUsage = resetApiUsage();
    setUsage(freshUsage);
    setNotice('TomTom API local usage counter reset to 0');
    // If we were demo or capped, try live fetch
    loadTraffic(false);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* ── 3D Scene Viewport ── */}
      <Scene
        isNight={mode.isNight}
        isRaining={mode.isRaining}
        simSpeed={mode.simSpeed}
        isCinematic={mode.isCinematic}
        cameraPreset={mode.cameraPreset}
        footpathAuditMode={mode.footpathAuditMode}
        buildingMode={mode.buildingMode}
        googleMapsApiKey={mode.googleMapsApiKey}
        signalStatus={signalStatus}
        congestionRatio={flowData.congestionRatio}
        vehicleCount={mode.vehicleCount}
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
        onUpdateMode={handleUpdateMode}
        onToggleDemo={handleToggleDemo}
        onResetUsage={handleResetUsage}
        onOpenJunctionDetail={() => setIsJunctionModalOpen(true)}
        onDismissNotice={() => setNotice(undefined)}
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
    </div>
  );
};

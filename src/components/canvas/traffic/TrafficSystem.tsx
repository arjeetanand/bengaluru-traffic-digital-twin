import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SignalStatus, VehicleType } from '../../../types';
import { SIMULATION_CONFIG } from '../../../config/simulation';
import {
  createCarGeometry,
  createAutoGeometry,
  createBusGeometry,
  createTwoWheelerGeometry
} from './VehicleModels';
import { createSourceReplayCurve, U_TURN_CONNECTORS } from '../../../data/marathahalliLaneNetwork';
import { getOrrOffsetPointAtZ, getOrrUnderpassElevation } from '../../../data/RealRoadData';

interface TrafficSystemProps {
  signalStatus: SignalStatus;
  congestionRatio: number; // currentSpeed / freeFlowSpeed
  simSpeedMultiplier: number; // 1, 10, 60
  isNight: boolean;
  vehicleTotalCount: number;
  scenarioOnly?: boolean;
}

interface LaneDefinition {
  id: string;
  spline: THREE.Curve<THREE.Vector3>;
  length: number;
  controlledBy: 'NS' | 'EW' | 'FREE';
  stopT: number; // progress t at stop line
  closedLoop: boolean;
  isScenarioRoute: boolean;
}

interface VehicleAgent {
  id: number;
  type: VehicleType;
  laneIdx: number;
  t: number; // 0.0 to 1.0
  speed: number;
  maxSpeed: number;
  meshIdx: number;
  lengthMeters: number;
  isIdling: boolean;
}

interface FleetCounts {
  car: number;
  twoWheeler: number;
  auto: number;
  bus: number;
  total: number;
}

const VEHICLE_TYPE_SHARES = [
  { type: 'car' as const, share: SIMULATION_CONFIG.vehicleDistribution.car },
  { type: 'twoWheeler' as const, share: SIMULATION_CONFIG.vehicleDistribution.twoWheeler },
  { type: 'auto' as const, share: SIMULATION_CONFIG.vehicleDistribution.auto },
  { type: 'bus' as const, share: SIMULATION_CONFIG.vehicleDistribution.bus }
];

/**
 * Allocate the requested modelled fleet without rounding one class into a
 * negative remainder. Largest-remainder allocation keeps the configured
 * total exact, including for the small crossover/junction detail slice.
 */
function allocateFleet(requestedCount: number): FleetCounts {
  const total = Number.isFinite(requestedCount)
    ? Math.max(0, Math.min(SIMULATION_CONFIG.maxVehicleCount, Math.floor(requestedCount)))
    : 0;
  const allocations = VEHICLE_TYPE_SHARES.map(({ type, share }, index) => {
    const exact = total * share;
    const count = Math.floor(exact);
    return { type, count, remainder: exact - count, index };
  });
  const remaining = total - allocations.reduce((sum, allocation) => sum + allocation.count, 0);

  allocations.sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let index = 0; index < remaining; index += 1) {
    allocations[index % allocations.length].count += 1;
  }

  const counts: Omit<FleetCounts, 'total'> = {
    car: 0,
    twoWheeler: 0,
    auto: 0,
    bus: 0
  };
  allocations.forEach((allocation) => {
    counts[allocation.type] = allocation.count;
  });
  return { ...counts, total };
}

export const TrafficSystem: React.FC<TrafficSystemProps> = ({
  signalStatus,
  congestionRatio,
  simSpeedMultiplier,
  isNight,
  vehicleTotalCount,
  scenarioOnly = false
}) => {
  const carsMeshRef = useRef<THREE.InstancedMesh>(null);
  const autosMeshRef = useRef<THREE.InstancedMesh>(null);
  const busesMeshRef = useRef<THREE.InstancedMesh>(null);
  const twoWheelersMeshRef = useRef<THREE.InstancedMesh>(null);

  // ── Geometries ──
  const carGeom = useMemo(() => createCarGeometry(), []);
  const autoGeom = useMemo(() => createAutoGeometry(), []);
  const busGeom = useMemo(() => createBusGeometry(), []);
  const twoWheelerGeom = useMemo(() => createTwoWheelerGeometry(), []);

  // ── Materials ──
  const carMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.65,
      emissive: isNight ? new THREE.Color('#332211') : new THREE.Color('#000000'),
      emissiveIntensity: isNight ? 0.35 : 0
    });
  }, [isNight]);

  const autoMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.5,
      metalness: 0.3,
      emissive: isNight ? new THREE.Color('#332b00') : new THREE.Color('#000000'),
      emissiveIntensity: isNight ? 0.4 : 0
    });
  }, [isNight]);

  const busMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.4,
      emissive: isNight ? new THREE.Color('#002233') : new THREE.Color('#000000'),
      emissiveIntensity: isNight ? 0.45 : 0
    });
  }, [isNight]);

  const twoWheelerMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.5,
      emissive: isNight ? new THREE.Color('#222222') : new THREE.Color('#000000'),
      emissiveIntensity: isNight ? 0.3 : 0
    });
  }, [isNight]);

  // ── Road Splines & Lane Network ──
  const lanes: LaneDefinition[] = useMemo(() => {
    const list: LaneDefinition[] = [];

    const orrPoint = (z: number, lateralOffset: number, y: number): [number, number, number] => {
      const [x, projectedZ] = getOrrOffsetPointAtZ(z, lateralOffset);
      return [x, y, projectedZ];
    };

    const underpassY = (z: number) => getOrrUnderpassElevation(z);

    // Helper to register spline
    const addLane = (
      id: string,
      points: [number, number, number][],
      controlledBy: 'NS' | 'EW' | 'FREE',
      stopT: number = 0.45,
      closedLoop = false
    ) => {
      const vPoints = points.map((p) => new THREE.Vector3(...p));
      const isScenarioUTurn = id === U_TURN_CONNECTORS.north.id || id === U_TURN_CONNECTORS.south.id;
      // Keep the scenario connector identical to the source replay and focus
      // overlay. Source-linked U-turns use exact piecewise-linear OSM
      // segments; authored fallback lanes retain Catmull-Rom smoothing.
      const spline = isScenarioUTurn
        ? createSourceReplayCurve(points)
        : new THREE.CatmullRomCurve3(vPoints, false, 'catmullrom', 0.25);
      list.push({
        id,
        spline,
        length: spline.getLength(),
        controlledBy,
        stopT,
        closedLoop,
        isScenarioRoute: isScenarioUTurn
      });
    };

    // 1, 2, 3. Underpass Northbound Express Lanes. In the source geometry
    // northbound traffic uses the west/left carriageway (positive lateral
    // offset in the +Z road frame).
    addLane('underpass-nb-1', [
      orrPoint(-170, 2.7, underpassY(-170)),
      orrPoint(-115, 2.7, underpassY(-115)),
      orrPoint(-40, 2.7, underpassY(-40)),
      orrPoint(0, 2.7, underpassY(0)),
      orrPoint(40, 2.7, underpassY(40)),
      orrPoint(115, 2.7, underpassY(115)),
      orrPoint(170, 2.7, underpassY(170))
    ], 'FREE');

    addLane('underpass-nb-2', [
      orrPoint(-170, 5.4, underpassY(-170)),
      orrPoint(-115, 5.4, underpassY(-115)),
      orrPoint(-40, 5.4, underpassY(-40)),
      orrPoint(0, 5.4, underpassY(0)),
      orrPoint(40, 5.4, underpassY(40)),
      orrPoint(115, 5.4, underpassY(115)),
      orrPoint(170, 5.4, underpassY(170))
    ], 'FREE');

    addLane('underpass-nb-3', [
      orrPoint(-170, 7.8, underpassY(-170)),
      orrPoint(-115, 7.8, underpassY(-115)),
      orrPoint(-40, 7.8, underpassY(-40)),
      orrPoint(0, 7.8, underpassY(0)),
      orrPoint(40, 7.8, underpassY(40)),
      orrPoint(115, 7.8, underpassY(115)),
      orrPoint(170, 7.8, underpassY(170))
    ], 'FREE');

    // 4, 5, 6. Underpass Southbound Express Lanes use the east/right
    // carriageway (negative lateral offset).
    addLane('underpass-sb-1', [
      orrPoint(170, -2.7, underpassY(170)),
      orrPoint(115, -2.7, underpassY(115)),
      orrPoint(40, -2.7, underpassY(40)),
      orrPoint(0, -2.7, underpassY(0)),
      orrPoint(-40, -2.7, underpassY(-40)),
      orrPoint(-115, -2.7, underpassY(-115)),
      orrPoint(-170, -2.7, underpassY(-170))
    ], 'FREE');

    addLane('underpass-sb-2', [
      orrPoint(170, -5.4, underpassY(170)),
      orrPoint(115, -5.4, underpassY(115)),
      orrPoint(40, -5.4, underpassY(40)),
      orrPoint(0, -5.4, underpassY(0)),
      orrPoint(-40, -5.4, underpassY(-40)),
      orrPoint(-115, -5.4, underpassY(-115)),
      orrPoint(-170, -5.4, underpassY(-170))
    ], 'FREE');

    addLane('underpass-sb-3', [
      orrPoint(170, -7.8, underpassY(170)),
      orrPoint(115, -7.8, underpassY(115)),
      orrPoint(40, -7.8, underpassY(40)),
      orrPoint(0, -7.8, underpassY(0)),
      orrPoint(-40, -7.8, underpassY(-40)),
      orrPoint(-115, -7.8, underpassY(-115)),
      orrPoint(-170, -7.8, underpassY(-170))
    ], 'FREE');

    // 7 & 8. Surface ORR Northbound Service Road (Stops at NS Signal before z = -18)
    addLane('surface-nb-1', [
      orrPoint(-170, 14.5, 0.1),
      orrPoint(-25, 14.5, 0.1),
      orrPoint(0, 14.5, 0.1),
      orrPoint(35, 14.5, 0.1),
      orrPoint(170, 14.5, 0.1)
    ], 'NS', 0.44);

    addLane('surface-nb-2', [
      orrPoint(-170, 17.5, 0.1),
      orrPoint(-25, 17.5, 0.1),
      orrPoint(0, 17.5, 0.1),
      orrPoint(35, 17.5, 0.1),
      orrPoint(170, 17.5, 0.1)
    ], 'NS', 0.44);

    // 9 & 10. Surface ORR Southbound Service Road (Stops at NS Signal before z = +18)
    addLane('surface-sb-1', [
      orrPoint(170, -14.5, 0.1),
      orrPoint(25, -14.5, 0.1),
      orrPoint(0, -14.5, 0.1),
      orrPoint(-35, -14.5, 0.1),
      orrPoint(-170, -14.5, 0.1)
    ], 'NS', 0.44);

    addLane('surface-sb-2', [
      orrPoint(170, -17.5, 0.1),
      orrPoint(25, -17.5, 0.1),
      orrPoint(0, -17.5, 0.1),
      orrPoint(-35, -17.5, 0.1),
      orrPoint(-170, -17.5, 0.1)
    ], 'NS', 0.44);

    // 11 & 12. HAL Old Airport Road to Varthur Road Eastbound (Direct Surface Road at y = 0.1, stops at EW signal)
    addLane('oar-eb-1', [
      [-220, 0.1, 3.8],
      [-25, 0.1, 3.8],
      [0, 0.1, 3.8],
      [45, 0.1, 3.8],
      [120, 0.1, 3.8],
      [220, 0.1, 3.8]
    ], 'EW', 0.44);

    addLane('oar-eb-2', [
      [-220, 0.1, 7.5],
      [-25, 0.1, 7.5],
      [0, 0.1, 7.5],
      [45, 0.1, 7.5],
      [120, 0.1, 7.5],
      [220, 0.1, 7.5]
    ], 'EW', 0.44);

    // 13 & 14. Varthur Road to HAL Old Airport Road Westbound (Direct Surface Road at y = 0.1, stops at EW signal)
    addLane('oar-wb-1', [
      [220, 0.1, -3.8],
      [45, 0.1, -3.8],
      [0, 0.1, -3.8],
      [-25, 0.1, -3.8],
      [-120, 0.1, -3.8],
      [-220, 0.1, -3.8]
    ], 'EW', 0.44);

    addLane('oar-wb-2', [
      [220, 0.1, -7.5],
      [45, 0.1, -7.5],
      [0, 0.1, -7.5],
      [-25, 0.1, -7.5],
      [-120, 0.1, -7.5],
      [-220, 0.1, -7.5]
    ], 'EW', 0.44);

    // 15, 16, 17, 18. Free Left Turn Slip Lanes (Indian left-hand traffic, on surface at y = 0.1)
    // Left turn 1: ORR East Service NB to Varthur Road EB
    addLane('slip-nb-to-eb', [
      [17.5, 0.1, -90],
      [20.0, 0.1, -40],
      [28.0, 0.1, -15],
      [45.0, 0.1, 8.5],
      [140, 0.1, 8.5],
      [220, 0.1, 8.5]
    ], 'FREE');

    // Left turn 2: ORR West Service SB to HAL Airport Road WB
    addLane('slip-sb-to-wb', [
      [-17.5, 0.1, 90],
      [-20.0, 0.1, 40],
      [-28.0, 0.1, 15],
      [-45.0, 0.1, -8.5],
      [-140, 0.1, -8.5],
      [-220, 0.1, -8.5]
    ], 'FREE');

    // Left turn 3: Varthur Road WB to ORR East Service NB
    addLane('slip-wb-to-nb', [
      [120, 0.1, -8.5],
      [45, 0.1, -11.0],
      [24, 0.1, -25.0],
      [17.5, 0.1, -45.0],
      [17.5, 0.1, 170]
    ], 'FREE');

    // Left turn 4: HAL Airport Road EB to ORR West Service SB
    addLane('slip-eb-to-sb', [
      [-120, 0.1, 8.5],
      [-45, 0.1, 11.0],
      [-24, 0.1, 25.0],
      [-17.5, 0.1, 45.0],
      [-17.5, 0.1, -170]
    ], 'FREE');

    // 19 & 20. Source-linked Varthur Road turn replays. These are shared
    // with the crossover audit layer so modelled vehicles follow the same
    // mapped vertex trace. Their OSM legality remains unresolved/negative.
    addLane(
      U_TURN_CONNECTORS.north.id,
      U_TURN_CONNECTORS.north.points,
      'EW',
      U_TURN_CONNECTORS.north.stopT
    );
    addLane(
      U_TURN_CONNECTORS.south.id,
      U_TURN_CONNECTORS.south.points,
      'EW',
      U_TURN_CONNECTORS.south.stopT
    );

    return list;
  }, []);

  const spawnLaneIndices = useMemo(() => {
    return lanes
      .map((lane, index) => ({ lane, index }))
      // The highlighted U-turns are scenario links, not ordinary junction
      // movements. Keep them out of the normal pool so their presence never
      // implies an observed or legally permitted turn.
      .filter(({ lane }) => scenarioOnly ? lane.isScenarioRoute : !lane.isScenarioRoute)
      .map(({ index }) => index);
  }, [lanes, scenarioOnly]);

  // ── Allocate Fleet of Vehicles ──
  const { counts, agents } = useMemo(() => {
    // The scene splits the configured fleet between this detailed junction
    // network and the source-road corridor layer. Respect the exact allocation
    // here so the HUD's configured vehicle count stays a real total.
    const allocation = allocateFleet(vehicleTotalCount);

    const list: VehicleAgent[] = [];
    let idCounter = 0;
    let carIdx = 0;
    let autoIdx = 0;
    let busIdx = 0;
    let twIdx = 0;
    let spawnOrdinal = 0;
    let randomState = (0x4d415241 ^ (vehicleTotalCount * 2654435761)) >>> 0;
    const nextRandom = () => {
      randomState = (randomState + 0x6d2b79f5) >>> 0;
      let value = randomState;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };

    // Helper to spawn a batch of vehicles of a type
    const spawnType = (
      type: VehicleType,
      count: number,
      maxSpeed: number,
      lengthMeters: number,
      getIdx: () => number
    ) => {
      if (!spawnLaneIndices.length) return;
      for (let i = 0; i < count; i++) {
        const laneIdx = scenarioOnly
          ? spawnLaneIndices[spawnOrdinal % spawnLaneIndices.length]
          : spawnLaneIndices[Math.floor(nextRandom() * spawnLaneIndices.length)];
        spawnOrdinal += 1;
        const t = 0.04 + nextRandom() * 0.88; // leave a small entry buffer at both ends
        list.push({
          id: idCounter++,
          type,
          laneIdx,
          t,
          speed: maxSpeed * 0.8,
          maxSpeed,
          meshIdx: getIdx(),
          lengthMeters,
          isIdling: false
        });
      }
    };

    spawnType('twoWheeler', allocation.twoWheeler, SIMULATION_CONFIG.baseSpeeds.twoWheeler, 2.0, () => twIdx++);
    spawnType('car', allocation.car, SIMULATION_CONFIG.baseSpeeds.car, 4.4, () => carIdx++);
    spawnType('auto', allocation.auto, SIMULATION_CONFIG.baseSpeeds.auto, 2.8, () => autoIdx++);
    spawnType('bus', allocation.bus, SIMULATION_CONFIG.baseSpeeds.bus, 10.6, () => busIdx++);

    return {
      counts: {
        car: carIdx,
        twoWheeler: twIdx,
        auto: autoIdx,
        bus: busIdx,
        total: list.length
      },
      agents: list
    };
  }, [scenarioOnly, vehicleTotalCount, spawnLaneIndices]);

  // ── Initialize Per-Instance Color Palette Variation ──
  useEffect(() => {
    const dummyColor = new THREE.Color();

    // 1. Cars (White, Silver, Grey, Dark Blue, Maroon, Black)
    if (carsMeshRef.current) {
      const carColors = ['#f8fafc', '#e2e8f0', '#94a3b8', '#1e3a8a', '#7f1d1d', '#18181b', '#334155'];
      for (let i = 0; i < counts.car; i++) {
        dummyColor.set(carColors[i % carColors.length]);
        carsMeshRef.current.setColorAt(i, dummyColor);
      }
      if (carsMeshRef.current.instanceColor) carsMeshRef.current.instanceColor.needsUpdate = true;
    }

    // 2. Auto-Rickshaws (Iconic Bengaluru yellow canopy with green accents)
    if (autosMeshRef.current) {
      const autoYellows = ['#eab308', '#facc15', '#ca8a04', '#eab308'];
      for (let i = 0; i < counts.auto; i++) {
        dummyColor.set(autoYellows[i % autoYellows.length]);
        autosMeshRef.current.setColorAt(i, dummyColor);
      }
      if (autosMeshRef.current.instanceColor) autosMeshRef.current.instanceColor.needsUpdate = true;
    }

    // 3. BMTC Transit Buses (Bengaluru BMTC Teal/Blue & White livery)
    if (busesMeshRef.current) {
      const busTeals = ['#0891b2', '#0284c7', '#0e7490', '#0369a1'];
      for (let i = 0; i < counts.bus; i++) {
        dummyColor.set(busTeals[i % busTeals.length]);
        busesMeshRef.current.setColorAt(i, dummyColor);
      }
      if (busesMeshRef.current.instanceColor) busesMeshRef.current.instanceColor.needsUpdate = true;
    }

    // 4. Two-Wheelers (Red, Black, Blue, Silver, Yellow scooters/bikes)
    if (twoWheelersMeshRef.current) {
      const bikeColors = ['#dc2626', '#18181b', '#2563eb', '#64748b', '#d97706', '#059669'];
      for (let i = 0; i < counts.twoWheeler; i++) {
        dummyColor.set(bikeColors[i % bikeColors.length]);
        twoWheelersMeshRef.current.setColorAt(i, dummyColor);
      }
      if (twoWheelersMeshRef.current.instanceColor) twoWheelersMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [counts]);

  // ── Reusable Math Objects for 60fps Loop ──
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const simulationAccumulator = useRef(0);

  // ── Fixed-step Physics & Simulation Loop ──
  // Vehicle transforms are still uploaded every simulation step, but the
  // expensive lane grouping/sorting/spline sampling is capped at 30 Hz. This
  // leaves the renderer and controls responsive while preserving sim speed.
  useFrame((_, delta) => {
    // Clamp delta to prevent simulation exploding during tab switch
    simulationAccumulator.current += Math.min(delta, 0.1);
    const simulationStep = 1 / 30;
    if (simulationAccumulator.current < simulationStep) return;

    const dt = Math.min(simulationAccumulator.current, 0.1) * simSpeedMultiplier;
    simulationAccumulator.current = 0;

    // Determine current signal allowances
    const nsCanPass = signalStatus.nsColor === 'green';
    const ewCanPass = signalStatus.ewColor === 'green';

    // Group agents by lane to compute inter-vehicle queues efficiently
    const laneVehicles: VehicleAgent[][] = Array.from({ length: lanes.length }, () => []);
    for (let i = 0; i < agents.length; i++) {
      laneVehicles[agents[i].laneIdx].push(agents[i]);
    }

    for (let l = 0; l < lanes.length; l++) {
      const lane = lanes[l];
      const vehList = laneVehicles[l];
      if (vehList.length === 0) continue;

      // Sort vehicles in lane by t (descending: furthest along the road first)
      vehList.sort((a, b) => b.t - a.t);

      const isSignalRedForLane =
        (lane.controlledBy === 'NS' && !nsCanPass) ||
        (lane.controlledBy === 'EW' && !ewCanPass);

      for (let v = 0; v < vehList.length; v++) {
        const veh = vehList[v];
        let desiredSpeed = veh.maxSpeed * Math.max(0.25, Math.min(1.2, congestionRatio));

        // 1. Signal Stop Check
        if (isSignalRedForLane) {
          const distToStopMeters = (lane.stopT - veh.t) * lane.length;
          // If vehicle is approaching stop bar within 45m
          if (distToStopMeters > 0 && distToStopMeters < 45) {
            // Smoothly decelerate to 0 at stop bar
            const decelRatio = Math.max(0, (distToStopMeters - 2) / 40);
            desiredSpeed = Math.min(desiredSpeed, desiredSpeed * decelRatio);
            if (distToStopMeters <= 3.0) {
              desiredSpeed = 0;
            }
          }
        }

        // 2. Queueing & Inter-Vehicle Gap Check
        // If there is a vehicle ahead in this lane
        if (v > 0) {
          const vehAhead = vehList[v - 1];
          let gapMeters = (vehAhead.t - veh.t) * lane.length;
          if (gapMeters < 0 && lane.closedLoop) gapMeters += lane.length; // wrap-around only for closed circuits

          const minSafeGap = veh.lengthMeters + 3.0; // tight Indian traffic queue gap
          if (gapMeters < 35) {
            if (gapMeters <= minSafeGap) {
              desiredSpeed = 0;
            } else {
              const gapFactor = (gapMeters - minSafeGap) / (35 - minSafeGap);
              desiredSpeed = Math.min(desiredSpeed, vehAhead.speed * 0.95 + desiredSpeed * gapFactor * 0.05);
            }
          }
        }

        // Apply smooth acceleration/braking
        const accelRate = desiredSpeed < veh.speed ? 24.0 : 8.0;
        veh.speed += (desiredSpeed - veh.speed) * Math.min(1.0, accelRate * dt);
        if (veh.speed < 0.05) veh.speed = 0;

        veh.isIdling = veh.speed === 0;

        // Advance position along spline
        const advanceT = (veh.speed * dt) / lane.length;
        veh.t += advanceT;
        if (veh.t > 1.0) {
          if (lane.closedLoop) {
            // A high simulation multiplier can advance more than one lap in a
            // fixed step; modulo keeps closed circuits bounded and stable.
            veh.t %= 1.0;
          } else {
            // Open corridor lanes respawn at their signed entry instead of
            // teleporting from an exit back through the middle of the map.
            veh.t = 0.02 + (veh.id % 5) * 0.008;
            veh.speed = veh.maxSpeed * 0.55;
          }
        }

        // Calculate 3D position and tangent
        lane.spline.getPointAt(veh.t, pos);
        lane.spline.getTangentAt(veh.t, tangent).normalize();

        dummy.position.copy(pos);

        // ── Per-vehicle-type wheel radius Y-offset so tires sit ON the road surface ──
        // Car: wheel radius 0.32m, Two-Wheeler: 0.30m, Auto: 0.26m, Bus: 0.50m
        switch (veh.type) {
          case 'car':        dummy.position.y += 0.32; break;
          case 'twoWheeler': dummy.position.y += 0.30; break;
          case 'auto':       dummy.position.y += 0.26; break;
          case 'bus':        dummy.position.y += 0.50; break;
        }

        // Orient vehicle along spline tangent direction
        dummy.lookAt(dummy.position.x + tangent.x, dummy.position.y + tangent.y, dummy.position.z + tangent.z);
        dummy.rotateY(Math.PI);

        dummy.updateMatrix();

        // Write transformation matrix to appropriate InstancedMesh
        switch (veh.type) {
          case 'car':
            carsMeshRef.current?.setMatrixAt(veh.meshIdx, dummy.matrix);
            break;
          case 'twoWheeler':
            twoWheelersMeshRef.current?.setMatrixAt(veh.meshIdx, dummy.matrix);
            break;
          case 'auto':
            autosMeshRef.current?.setMatrixAt(veh.meshIdx, dummy.matrix);
            break;
          case 'bus':
            busesMeshRef.current?.setMatrixAt(veh.meshIdx, dummy.matrix);
            break;
        }
      }
    }

    // Flag instanced buffers for GPU upload
    if (carsMeshRef.current) carsMeshRef.current.instanceMatrix.needsUpdate = true;
    if (twoWheelersMeshRef.current) twoWheelersMeshRef.current.instanceMatrix.needsUpdate = true;
    if (autosMeshRef.current) autosMeshRef.current.instanceMatrix.needsUpdate = true;
    if (busesMeshRef.current) busesMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  const trafficLayerUserData = useMemo(() => ({
    trafficSource: 'MODELLED',
    vehicleCountBasis: 'CONFIGURED ALLOCATION',
    vehicleCount: counts.total,
    scope: scenarioOnly ? 'CROSSOVER JUNCTION DETAIL' : 'JUNCTION DETAIL',
    routePolicy: scenarioOnly
      ? 'HIGHLIGHTED U-TURN SCENARIO ROUTES ONLY'
      : 'U-TURN SCENARIO ROUTES EXCLUDED',
    legalStatus: scenarioOnly ? 'MODELLED ONLY · OSM TURN STATUS UNRESOLVED' : 'MODELLED JUNCTION FLOW'
  }), [counts.total, scenarioOnly]);

  return (
    <group name="TrafficSystem">
      <group
        name={scenarioOnly ? 'ModelledCrossoverJunctionUTurnTraffic' : 'ModelledJunctionTraffic'}
        userData={trafficLayerUserData}
      >
        {/* Cars InstancedMesh */}
        <instancedMesh
          ref={carsMeshRef}
          args={[carGeom, carMaterial, counts.car]}
          frustumCulled={false}
        />

        {/* Two-Wheelers InstancedMesh */}
        <instancedMesh
          ref={twoWheelersMeshRef}
          args={[twoWheelerGeom, twoWheelerMaterial, counts.twoWheeler]}
          frustumCulled={false}
        />

        {/* Auto-Rickshaws InstancedMesh */}
        <instancedMesh
          ref={autosMeshRef}
          args={[autoGeom, autoMaterial, counts.auto]}
          frustumCulled={false}
        />

        {/* BMTC Buses InstancedMesh */}
        <instancedMesh
          ref={busesMeshRef}
          args={[busGeom, busMaterial, counts.bus]}
          frustumCulled={false}
        />
      </group>
    </group>
  );
};

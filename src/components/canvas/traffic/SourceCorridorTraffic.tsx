import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VehicleType } from '../../../types';
import { SIMULATION_CONFIG } from '../../../config/simulation';
import {
  createAutoGeometry,
  createBusGeometry,
  createCarGeometry,
  createTwoWheelerGeometry
} from './VehicleModels';
import {
  MarathahalliDemoSnapshot,
  OSMPolylineFeature,
  VARTHUR_VIADUCT_DECK_TOP_Y,
  isSourceElevatedRoad,
  isVarthurViaductWay
} from '../../../data/marathahalliDemo';
import { getOrrUnderpassElevation } from '../../../data/RealRoadData';
import { loadMarathahalliSnapshot } from '../../../services/marathahalliSnapshot';
import {
  allocateFleet,
  getPublishedModelledSignalState,
  MODELLED_TRAFFIC_STEP_SECONDS
} from './TrafficSystem';

interface SourceCorridorTrafficProps {
  simSpeedMultiplier: number;
  isNight: boolean;
  vehicleTotalCount: number;
  congestionRatio: number;
}

interface SourceRoute {
  id: string;
  curve: THREE.CurvePath<THREE.Vector3>;
  length: number;
  // OSM way order is the travel direction for one-way roads. Bidirectional
  // ways are expanded into one route per direction before vehicles spawn.
  preferredDirection: 1 | -1;
  // Lane offsets are authored in the source way's local frame. Reverse-flow
  // routes mirror the offset so both directions stay on their LHT carriageway.
  laneOffset: number;
  controlledBy: 'NS' | 'EW' | 'FREE';
  stopProgress: number | null;
  trafficWeight: number;
}

interface SourceVehicleAgent {
  id: number;
  type: VehicleType;
  routeIdx: number;
  progress: number;
  direction: 1 | -1;
  speed: number;
  maxSpeed: number;
  meshIdx: number;
  lateralOffset: number;
  lengthMeters: number;
  isIdling: boolean;
}

const SOURCE_ROAD_HIGHWAYS = new Set([
  'primary',
  'trunk',
  'trunk_link',
  'secondary',
  'tertiary'
]);

const ROUTE_NAME_HINT = /outer ring|varthur|marathahalli|marathalli|spice garden|airport|bridge|service road|main road|chinnappanahalli/i;

function getRoadLength(feature: OSMPolylineFeature) {
  return feature.geometry.slice(1).reduce(
    (total, point, index) => total + Math.hypot(
      point[0] - feature.geometry[index][0],
      point[1] - feature.geometry[index][1]
    ),
    0
  );
}

function getRoadRank(feature: OSMPolylineFeature) {
  switch (feature.tags.highway) {
    case 'trunk': return 5;
    case 'primary': return 4;
    case 'secondary': return 3;
    case 'tertiary': return 2;
    default: return 1;
  }
}

function getSourceRoadY(feature: OSMPolylineFeature, z: number) {
  const name = feature.name || feature.tags.name || '';
  if (/marathahalli underpass/i.test(name) || feature.tags.tunnel === 'yes') {
    return getOrrUnderpassElevation(z) + 0.08;
  }
  if (isVarthurViaductWay(feature)) return VARTHUR_VIADUCT_DECK_TOP_Y + 0.08;
  if (isSourceElevatedRoad(feature)) return 5.3;
  return 0.1;
}

function toSourcePolylineCurve(points: THREE.Vector3[]) {
  const curve = new THREE.CurvePath<THREE.Vector3>();
  for (let index = 1; index < points.length; index += 1) {
    curve.add(new THREE.LineCurve3(points[index - 1], points[index]));
  }
  return curve;
}

interface PolylineProjection {
  distanceMeters: number;
  progress: number;
  tangentX: number;
  tangentZ: number;
}

function projectPointToPolyline(
  geometry: [number, number][],
  target: [number, number]
): PolylineProjection {
  let totalLength = 0;
  for (let index = 1; index < geometry.length; index += 1) {
    totalLength += Math.hypot(
      geometry[index][0] - geometry[index - 1][0],
      geometry[index][1] - geometry[index - 1][1]
    );
  }

  let distanceAlong = 0;
  let closest: PolylineProjection = {
    distanceMeters: Number.POSITIVE_INFINITY,
    progress: 0,
    tangentX: 1,
    tangentZ: 0
  };

  for (let index = 1; index < geometry.length; index += 1) {
    const [startX, startZ] = geometry[index - 1];
    const [endX, endZ] = geometry[index];
    const deltaX = endX - startX;
    const deltaZ = endZ - startZ;
    const segmentLength = Math.hypot(deltaX, deltaZ);
    if (segmentLength < 0.001) continue;

    const segmentLengthSquared = segmentLength * segmentLength;
    const projectedT = Math.max(
      0,
      Math.min(
        1,
        ((target[0] - startX) * deltaX + (target[1] - startZ) * deltaZ)
          / segmentLengthSquared
      )
    );
    const projectedX = startX + deltaX * projectedT;
    const projectedZ = startZ + deltaZ * projectedT;
    const distanceMeters = Math.hypot(target[0] - projectedX, target[1] - projectedZ);

    if (distanceMeters < closest.distanceMeters) {
      closest = {
        distanceMeters,
        progress: (distanceAlong + segmentLength * projectedT) / Math.max(totalLength, 0.001),
        tangentX: deltaX / segmentLength,
        tangentZ: deltaZ / segmentLength
      };
    }
    distanceAlong += segmentLength;
  }

  return closest;
}

const SOURCE_SIGNAL_CENTER: [number, number] = [-10.7, 12.7];
const SOURCE_SIGNAL_CLUSTER_RADIUS_METERS = 110;
const SOURCE_SIGNAL_MATCH_RADIUS_METERS = 58;

function getSourceSignalControl(
  feature: OSMPolylineFeature,
  snapshot: MarathahalliDemoSnapshot,
  direction: 1 | -1
) {
  const name = feature.name || feature.tags.name || '';
  const isGradeRoute = !isSourceElevatedRoad(feature)
    && feature.tags.tunnel !== 'yes'
    && !/underpass/i.test(name);
  if (!isGradeRoute) {
    return { controlledBy: 'FREE' as const, stopProgress: null };
  }

  let closestSignal: PolylineProjection | null = null;
  (snapshot.signals || []).forEach((signal) => {
    const distanceToCluster = Math.hypot(
      signal.position[0] - SOURCE_SIGNAL_CENTER[0],
      signal.position[1] - SOURCE_SIGNAL_CENTER[1]
    );
    if (distanceToCluster > SOURCE_SIGNAL_CLUSTER_RADIUS_METERS) return;

    const projection = projectPointToPolyline(feature.geometry, signal.position);
    if (!closestSignal || projection.distanceMeters < closestSignal.distanceMeters) {
      closestSignal = projection;
    }
  });

  if (!closestSignal || closestSignal.distanceMeters > SOURCE_SIGNAL_MATCH_RADIUS_METERS) {
    return { controlledBy: 'FREE' as const, stopProgress: null };
  }

  const controlledBy = Math.abs(closestSignal.tangentX) >= Math.abs(closestSignal.tangentZ)
    ? 'EW' as const
    : 'NS' as const;
  const stopProgress = direction === 1
    ? closestSignal.progress
    : 1 - closestSignal.progress;

  // A route that starts at the signal is an exit, not an approach. Only
  // approaches with a meaningful travel distance before the stop bar are
  // phase-gated.
  return stopProgress > 0.025
    ? { controlledBy, stopProgress }
    : { controlledBy: 'FREE' as const, stopProgress: null };
}

function getSourceTrafficWeight(feature: OSMPolylineFeature, length: number) {
  const name = feature.name || feature.tags.name || '';
  const rankFactor = 0.75 + getRoadRank(feature) * 0.28;
  const namedCorridorFactor = ROUTE_NAME_HINT.test(name) ? 1.35 : 1;
  return Math.max(1, length * rankFactor * namedCorridorFactor);
}

/**
 * Keep the moving fleet on source-backed, drivable OSM ways while retaining
 * spatial coverage across the Oracle → junction → Spice Garden envelope.
 * This is intentionally a visual/modelled layer: it does not claim to be a
 * live probe feed and it avoids sending vehicles down residential alleys.
 */
function buildSourceRoutes(snapshot: MarathahalliDemoSnapshot): SourceRoute[] {
  const candidates = snapshot.roads
    .filter((feature) => {
      const highway = feature.tags.highway || '';
      const name = feature.name || feature.tags.name || '';
      const length = getRoadLength(feature);
      const inWalkEnvelope = feature.centroid[0] >= -1000
        && feature.centroid[0] <= 1000
        && feature.centroid[1] >= -1900
        && feature.centroid[1] <= 520;
      return inWalkEnvelope
        && SOURCE_ROAD_HIGHWAYS.has(highway)
        && !/footbridge|pedestrian/i.test(name)
        && length >= 55
        && feature.geometry.length >= 2;
    })
    .sort((a, b) => {
      const aName = a.name || a.tags.name || '';
      const bName = b.name || b.tags.name || '';
      const aPriority = (ROUTE_NAME_HINT.test(aName) ? 10000 : 0) + getRoadRank(a) * 100 + getRoadLength(a);
      const bPriority = (ROUTE_NAME_HINT.test(bName) ? 10000 : 0) + getRoadRank(b) * 100 + getRoadLength(b);
      return bPriority - aPriority;
    });

  const selected: OSMPolylineFeature[] = [];
  const selectedIds = new Set<string>();
  const coveredCells = new Set<string>();

  const addFeature = (feature: OSMPolylineFeature) => {
    if (selected.length >= 56 || selectedIds.has(feature.id)) return;
    selected.push(feature);
    selectedIds.add(feature.id);
  };

  // Keep the source-named arterials visible even when their individual OSM
  // ways are short fragments around a junction or bridge approach.
  for (const feature of candidates) {
    const name = feature.name || feature.tags.name || '';
    if (ROUTE_NAME_HINT.test(name)) addFeature(feature);
    if (selected.length >= 28) break;
  }

  // Fill the remaining budget with one major route per spatial cell. This
  // prevents the 2.1 km snapshot from looking busy only near the origin.
  for (const feature of candidates) {
    if (selected.length >= 56) break;
    const cellX = Math.floor((feature.centroid[0] + 1000) / 250);
    const cellZ = Math.floor((feature.centroid[1] + 1900) / 300);
    const cell = `${cellX}:${cellZ}`;
    if (!coveredCells.has(cell)) {
      coveredCells.add(cell);
      addFeature(feature);
    }
  }

  return selected
    .flatMap((feature) => {
      const points = feature.geometry.map(([x, z]) => new THREE.Vector3(x, getSourceRoadY(feature, z), z));
      // Keep vehicles on the exact mapped way vertices. A smoothed spline
      // can cut across a mapped corner and put a vehicle on a footway or
      // building frontage in the audit views.
      const curve = toSourcePolylineCurve(points);
      const oneway = feature.tags.oneway;
      const preferredDirection: 1 | -1 | null = oneway === 'yes' || oneway === '1'
        ? 1
        : oneway === '-1'
          ? -1
          : null;
      const laneCount = Math.max(1, Math.min(4, Number(feature.tags.lanes) || 1));
      const laneOffsets = Array.from({ length: laneCount }, (_, index) => (
        (index - (laneCount - 1) / 2) * 3.1
      ));
      const directions: (1 | -1)[] = preferredDirection ? [preferredDirection] : [1, -1];
      const length = curve.getLength();

      return directions.flatMap((direction) => laneOffsets.map((offset) => ({
        id: `${feature.id}:${direction}:${offset.toFixed(2)}`,
        curve,
        length,
        preferredDirection: direction,
        laneOffset: direction === 1 ? offset : -offset,
        ...getSourceSignalControl(feature, snapshot, direction),
        trafficWeight: getSourceTrafficWeight(feature, length)
      })));
    })
    .filter((route) => route.length >= 45);
}

export const SourceCorridorTraffic: React.FC<SourceCorridorTrafficProps> = ({
  simSpeedMultiplier,
  isNight,
  vehicleTotalCount,
  congestionRatio
}) => {
  const [snapshot, setSnapshot] = useState<MarathahalliDemoSnapshot | null>(null);
  const carsMeshRef = useRef<THREE.InstancedMesh>(null);
  const autosMeshRef = useRef<THREE.InstancedMesh>(null);
  const busesMeshRef = useRef<THREE.InstancedMesh>(null);
  const twoWheelersMeshRef = useRef<THREE.InstancedMesh>(null);
  const simulationAccumulator = useRef(0);

  useEffect(() => {
    let active = true;
    loadMarathahalliSnapshot()
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch((error: unknown) => {
        if (active) console.warn('OSM corridor traffic unavailable; junction traffic remains active', error);
      });
    return () => { active = false; };
  }, []);

  const routes = useMemo(() => (snapshot ? buildSourceRoutes(snapshot) : []), [snapshot]);
  const carGeom = useMemo(() => createCarGeometry(), []);
  const autoGeom = useMemo(() => createAutoGeometry(), []);
  const busGeom = useMemo(() => createBusGeometry(), []);
  const twoWheelerGeom = useMemo(() => createTwoWheelerGeometry(), []);

  const carMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.35,
    metalness: 0.65,
    emissive: isNight ? new THREE.Color('#332211') : new THREE.Color('#000000'),
    emissiveIntensity: isNight ? 0.35 : 0
  }), [isNight]);
  const autoMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.5,
    metalness: 0.3,
    emissive: isNight ? new THREE.Color('#332b00') : new THREE.Color('#000000'),
    emissiveIntensity: isNight ? 0.4 : 0
  }), [isNight]);
  const busMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.4,
    metalness: 0.4,
    emissive: isNight ? new THREE.Color('#002233') : new THREE.Color('#000000'),
    emissiveIntensity: isNight ? 0.45 : 0
  }), [isNight]);
  const twoWheelerMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.45,
    metalness: 0.5,
    emissive: isNight ? new THREE.Color('#222222') : new THREE.Color('#000000'),
    emissiveIntensity: isNight ? 0.3 : 0
  }), [isNight]);

  const { counts, agents } = useMemo(() => {
    const allocation = allocateFleet(vehicleTotalCount);
    const list: SourceVehicleAgent[] = [];
    let randomState = (0x534f5552 ^ Math.imul(allocation.total, 2654435761)) >>> 0;
    let idCounter = 0;
    let carIdx = 0;
    let autoIdx = 0;
    let busIdx = 0;
    let twIdx = 0;
    const totalRouteWeight = routes.reduce((sum, route) => sum + route.trafficWeight, 0);
    const nextRandom = () => {
      randomState = (randomState + 0x6d2b79f5) >>> 0;
      let value = randomState;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };

    const chooseRoute = () => {
      if (!routes.length) return -1;
      let threshold = nextRandom() * totalRouteWeight;
      for (let index = 0; index < routes.length; index += 1) {
        threshold -= routes[index].trafficWeight;
        if (threshold <= 0) return index;
      }
      return routes.length - 1;
    };

    const spawn = (
      type: VehicleType,
      count: number,
      maxSpeed: number,
      lengthMeters: number,
      nextMeshIndex: () => number
    ) => {
      for (let index = 0; index < count; index += 1) {
        if (!routes.length) break;
        const routeIdx = chooseRoute();
        if (routeIdx < 0) break;
        list.push({
          id: idCounter++,
          type,
          routeIdx,
          progress: nextRandom(),
          direction: routes[routeIdx].preferredDirection,
          speed: maxSpeed * (0.68 + nextRandom() * 0.18),
          maxSpeed,
          meshIdx: nextMeshIndex(),
          lateralOffset: routes[routeIdx].laneOffset + (nextRandom() - 0.5) * 0.18,
          lengthMeters,
          isIdling: false
        });
      }
    };

    spawn('twoWheeler', allocation.twoWheeler, SIMULATION_CONFIG.baseSpeeds.twoWheeler, 2.0, () => twIdx++);
    spawn('car', allocation.car, SIMULATION_CONFIG.baseSpeeds.car, 4.4, () => carIdx++);
    spawn('auto', allocation.auto, SIMULATION_CONFIG.baseSpeeds.auto, 2.8, () => autoIdx++);
    spawn('bus', allocation.bus, SIMULATION_CONFIG.baseSpeeds.bus, 10.6, () => busIdx++);

    // Keep the initial fleet readable and collision-free. Agents still use a
    // seeded order for visual variety, but their longitudinal positions are
    // projected into deterministic slots on each source-backed lane.
    const agentsByRoute = Array.from({ length: routes.length }, () => [] as SourceVehicleAgent[]);
    list.forEach((agent) => agentsByRoute[agent.routeIdx].push(agent));
    agentsByRoute.forEach((routeAgents) => {
      routeAgents.sort((a, b) => a.progress - b.progress || a.id - b.id);
      const routeCount = routeAgents.length;
      if (!routeCount) return;
      routeAgents.forEach((agent, index) => {
        const nominalProgress = 0.06 + ((index + 0.5) / routeCount) * 0.88;
        const slotWidth = 0.88 / routeCount;
        const jitter = (nextRandom() - 0.5) * Math.min(0.022, slotWidth * 0.14);
        agent.progress = Math.max(0.035, Math.min(0.965, nominalProgress + jitter));
      });
    });

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
  }, [routes, vehicleTotalCount]);

  useEffect(() => {
    const dummyColor = new THREE.Color();
    const palette = {
      car: ['#f8fafc', '#e2e8f0', '#94a3b8', '#1e3a8a', '#7f1d1d', '#18181b'],
      auto: ['#eab308', '#facc15', '#ca8a04'],
      bus: ['#0891b2', '#0284c7', '#0e7490'],
      twoWheeler: ['#dc2626', '#18181b', '#2563eb', '#64748b', '#d97706', '#059669']
    } as const;
    const meshes = [
      [carsMeshRef.current, counts.car, palette.car],
      [autosMeshRef.current, counts.auto, palette.auto],
      [busesMeshRef.current, counts.bus, palette.bus],
      [twoWheelersMeshRef.current, counts.twoWheeler, palette.twoWheeler]
    ] as const;
    for (const [mesh, count, colors] of meshes) {
      if (!mesh) continue;
      for (let index = 0; index < count; index += 1) {
        dummyColor.set(colors[index % colors.length]);
        mesh.setColorAt(index, dummyColor);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }, [counts]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const position = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!routes.length || !agents.length) return;
    simulationAccumulator.current += Math.min(delta, 0.1);
    const step = 1 / 30;
    if (simulationAccumulator.current < step) return;
    const dt = Math.min(simulationAccumulator.current, 0.1) * simSpeedMultiplier;
    simulationAccumulator.current = 0;

    const congestionSpeedFactor = Math.max(0.28, Math.min(1.18, congestionRatio));

    for (const agent of agents) {
      const route = routes[agent.routeIdx];
      const progress = agent.direction === 1 ? agent.t : 1 - agent.t;
      agent.t += (agent.speed * congestionSpeedFactor * dt) / route.length;
      if (agent.t > 1) {
        agent.t = 0.02 + (agent.id % 7) * 0.006;
        // A source route never reverses at the endpoint. Bidirectional ways
        // already have a separate route for each legal travel direction.
        agent.direction = route.preferredDirection;
      }

      route.curve.getPointAt(progress, position);
      route.curve.getTangentAt(progress, tangent).normalize();
      const normalX = -tangent.z;
      const normalZ = tangent.x;
      position.x += normalX * agent.lateralOffset;
      position.z += normalZ * agent.lateralOffset;
      position.y += agent.type === 'bus' ? 0.5 : agent.type === 'car' ? 0.32 : agent.type === 'auto' ? 0.26 : 0.3;
      dummy.position.copy(position);
      const direction = agent.direction;
      dummy.lookAt(
        dummy.position.x + tangent.x * direction,
        dummy.position.y,
        dummy.position.z + tangent.z * direction
      );
      dummy.rotateY(Math.PI);
      dummy.updateMatrix();

      switch (agent.type) {
        case 'car': carsMeshRef.current?.setMatrixAt(agent.meshIdx, dummy.matrix); break;
        case 'twoWheeler': twoWheelersMeshRef.current?.setMatrixAt(agent.meshIdx, dummy.matrix); break;
        case 'auto': autosMeshRef.current?.setMatrixAt(agent.meshIdx, dummy.matrix); break;
        case 'bus': busesMeshRef.current?.setMatrixAt(agent.meshIdx, dummy.matrix); break;
      }
    }

    carsMeshRef.current && (carsMeshRef.current.instanceMatrix.needsUpdate = true);
    twoWheelersMeshRef.current && (twoWheelersMeshRef.current.instanceMatrix.needsUpdate = true);
    autosMeshRef.current && (autosMeshRef.current.instanceMatrix.needsUpdate = true);
    busesMeshRef.current && (busesMeshRef.current.instanceMatrix.needsUpdate = true);
  });

  if (!snapshot || !routes.length || !agents.length) return null;

  return (
    <group name="OSMSourceCorridorTraffic">
      <instancedMesh ref={carsMeshRef} args={[carGeom, carMaterial, counts.car]} frustumCulled={false} />
      <instancedMesh ref={twoWheelersMeshRef} args={[twoWheelerGeom, twoWheelerMaterial, counts.twoWheeler]} frustumCulled={false} />
      <instancedMesh ref={autosMeshRef} args={[autoGeom, autoMaterial, counts.auto]} frustumCulled={false} />
      <instancedMesh ref={busesMeshRef} args={[busGeom, busMaterial, counts.bus]} frustumCulled={false} />
    </group>
  );
};

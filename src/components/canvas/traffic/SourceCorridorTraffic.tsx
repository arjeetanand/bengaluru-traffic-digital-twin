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

interface SourceCorridorTrafficProps {
  simSpeedMultiplier: number;
  isNight: boolean;
  vehicleTotalCount: number;
}

interface SourceRoute {
  id: string;
  curve: THREE.CatmullRomCurve3;
  length: number;
  // OSM way order is the travel direction for one-way roads. Bidirectional
  // ways are expanded into one route per direction before vehicles spawn.
  preferredDirection: 1 | -1;
  // Lane offsets are authored in the source way's local frame. Reverse-flow
  // routes mirror the offset so both directions stay on their LHT carriageway.
  laneOffset: number;
}

interface SourceVehicleAgent {
  id: number;
  type: VehicleType;
  routeIdx: number;
  t: number;
  direction: 1 | -1;
  speed: number;
  meshIdx: number;
  lateralOffset: number;
  lengthMeters: number;
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
        && !/underpass|footbridge|pedestrian/i.test(name)
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
      const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.18);
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

      return directions.flatMap((direction) => laneOffsets.map((offset) => ({
        id: `${feature.id}:${direction}:${offset.toFixed(2)}`,
        curve,
        length: curve.getLength(),
        preferredDirection: direction,
        laneOffset: direction === 1 ? offset : -offset
      })));
    })
    .filter((route) => route.length >= 45);
}

export const SourceCorridorTraffic: React.FC<SourceCorridorTrafficProps> = ({
  simSpeedMultiplier,
  isNight,
  vehicleTotalCount
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
    const total = Math.max(0, Math.min(SIMULATION_CONFIG.maxVehicleCount, vehicleTotalCount));
    const carCount = Math.round(total * SIMULATION_CONFIG.vehicleDistribution.car);
    const twoWheelerCount = Math.round(total * SIMULATION_CONFIG.vehicleDistribution.twoWheeler);
    const autoCount = Math.round(total * SIMULATION_CONFIG.vehicleDistribution.auto);
    const busCount = total - carCount - twoWheelerCount - autoCount;
    const list: SourceVehicleAgent[] = [];
    let randomState = (0x534f5552 ^ (vehicleTotalCount * 2654435761)) >>> 0;
    let idCounter = 0;
    let carIdx = 0;
    let autoIdx = 0;
    let busIdx = 0;
    let twIdx = 0;
    const nextRandom = () => {
      randomState = (randomState + 0x6d2b79f5) >>> 0;
      let value = randomState;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
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
        const routeIdx = Math.floor(nextRandom() * routes.length);
        list.push({
          id: idCounter++,
          type,
          routeIdx,
          t: 0.04 + nextRandom() * 0.9,
          direction: routes[routeIdx].preferredDirection,
          speed: maxSpeed * (0.68 + nextRandom() * 0.18),
          meshIdx: nextMeshIndex(),
          lateralOffset: routes[routeIdx].laneOffset + (nextRandom() - 0.5) * 0.22,
          lengthMeters
        });
      }
    };

    spawn('twoWheeler', twoWheelerCount, SIMULATION_CONFIG.baseSpeeds.twoWheeler, 2.0, () => twIdx++);
    spawn('car', carCount, SIMULATION_CONFIG.baseSpeeds.car, 4.4, () => carIdx++);
    spawn('auto', autoCount, SIMULATION_CONFIG.baseSpeeds.auto, 2.8, () => autoIdx++);
    spawn('bus', busCount, SIMULATION_CONFIG.baseSpeeds.bus, 10.6, () => busIdx++);

    return {
      counts: { car: carIdx, twoWheeler: twIdx, auto: autoIdx, bus: busIdx },
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

    for (const agent of agents) {
      const route = routes[agent.routeIdx];
      const progress = agent.direction === 1 ? agent.t : 1 - agent.t;
      agent.t += (agent.speed * dt) / route.length;
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

import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  MARATHAHALLI_SNAPSHOT_URL,
  MarathahalliDemoSnapshot,
  OSMPolylineFeature
} from '../../../data/marathahalliDemo';

interface OsmSnapshotLayerProps {
  isNight?: boolean;
  showBuildings?: boolean;
  buildingLimit?: number;
  labelDistanceFactor?: number;
}

function createPolylineGeometry(features: OSMPolylineFeature[], y = 0.12) {
  const positions: number[] = [];
  for (const feature of features) {
    for (let index = 1; index < feature.geometry.length; index += 1) {
      const previous = feature.geometry[index - 1];
      const current = feature.geometry[index];
      positions.push(previous[0], y, previous[1], current[0], y, current[1]);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createRibbonGeometry(
  features: OSMPolylineFeature[],
  width: number | ((feature: OSMPolylineFeature) => number),
  y: number
) {
  const positions: number[] = [];
  for (const feature of features) {
    for (let index = 1; index < feature.geometry.length; index += 1) {
      const previous = feature.geometry[index - 1];
      const current = feature.geometry[index];
      const dx = current[0] - previous[0];
      const dz = current[1] - previous[1];
      const length = Math.hypot(dx, dz);
      if (length < 0.05) continue;
      const halfWidth = (typeof width === 'function' ? width(feature) : width) / 2;
      const nx = -dz / length;
      const nz = dx / length;
      const ax = previous[0] + nx * halfWidth;
      const az = previous[1] + nz * halfWidth;
      const bx = previous[0] - nx * halfWidth;
      const bz = previous[1] - nz * halfWidth;
      const cx = current[0] + nx * halfWidth;
      const cz = current[1] + nz * halfWidth;
      const dx2 = current[0] - nx * halfWidth;
      const dz2 = current[1] - nz * halfWidth;
      positions.push(
        ax, y, az, cx, y, cz, bx, y, bz,
        cx, y, cz, dx2, y, dz2, bx, y, bz
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function getRoadRibbonWidth(feature: OSMPolylineFeature) {
  const lanes = Number(feature.tags.lanes);
  if (Number.isFinite(lanes) && lanes > 0) return Math.min(18, Math.max(3.2, lanes * 3.1));
  if (['motorway', 'trunk', 'primary'].includes(feature.tags.highway || '')) return 11;
  if (['secondary', 'tertiary'].includes(feature.tags.highway || '')) return 8;
  if (feature.tags.highway === 'service') return 4.2;
  return 5.4;
}

function isSourceElevatedRoad(feature: OSMPolylineFeature) {
  return feature.tags.bridge === 'yes' || feature.tags.bridge === 'viaduct';
}

function createBuildingGeometry(features: OSMPolylineFeature[], limit: number) {
  const byDistance = [...features]
    .sort((a, b) => {
      const aDistance = a.centroid[0] ** 2 + a.centroid[1] ** 2;
      const bDistance = b.centroid[0] ** 2 + b.centroid[1] ** 2;
      return aDistance - bDistance;
    })
  const minX = Math.min(...features.map((feature) => feature.centroid[0]));
  const maxX = Math.max(...features.map((feature) => feature.centroid[0]));
  const minZ = Math.min(...features.map((feature) => feature.centroid[1]));
  const maxZ = Math.max(...features.map((feature) => feature.centroid[1]));
  const grid = new Map<string, OSMPolylineFeature[]>();

  // A 16×16 spatial sample with a few representatives per cell keeps named
  // buildings and local massing visible at both ends of the widened
  // Oracle→Spice corridor instead of spending the budget almost entirely
  // near the junction origin.
  for (const feature of byDistance) {
    const gridX = Math.min(15, Math.max(0, Math.floor(((feature.centroid[0] - minX) / Math.max(1, maxX - minX)) * 16)));
    const gridZ = Math.min(15, Math.max(0, Math.floor(((feature.centroid[1] - minZ) / Math.max(1, maxZ - minZ)) * 16)));
    const key = `${gridX}:${gridZ}`;
    const cell = grid.get(key) || [];
    if (cell.length < 3) cell.push(feature);
    grid.set(key, cell);
  }

  const named = features.filter((feature) => feature.name || feature.tags.name);
  const spatialRepresentatives = [...grid.values()].flat();
  const representative = [...named, ...spatialRepresentatives, ...byDistance];
  const selected: OSMPolylineFeature[] = [];
  const selectedIds = new Set<string>();
  for (const feature of representative) {
    if (selected.length >= limit || selectedIds.has(feature.id)) continue;
    selected.push(feature);
    selectedIds.add(feature.id);
  }
  const geometries: THREE.BufferGeometry[] = [];

  for (const feature of selected) {
    if (feature.geometry.length < 3) continue;
    try {
      const shape = new THREE.Shape();
      // ExtrudeGeometry grows along +Z. Negating source northing before the
      // -90° X rotation keeps both northing and building height positive.
      shape.moveTo(feature.geometry[0][0], -feature.geometry[0][1]);
      for (let index = 1; index < feature.geometry.length; index += 1) {
        shape.lineTo(feature.geometry[index][0], -feature.geometry[index][1]);
      }
      shape.closePath();

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: Math.min(32, Math.max(3.5, feature.height || 4)),
        bevelEnabled: false,
        curveSegments: 1
      });
      geometry.rotateX(-Math.PI / 2);
      geometries.push(geometry);
    } catch {
      // A malformed self-intersecting OSM polygon should not block the rest
      // of the snapshot from rendering.
    }
  }

  if (!geometries.length) return null;
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  return merged;
}

function createBuildingOutlineGeometry(features: OSMPolylineFeature[]) {
  const positions: number[] = [];
  for (const feature of features) {
    if (feature.geometry.length < 2) continue;
    for (let index = 1; index <= feature.geometry.length; index += 1) {
      const previous = feature.geometry[index - 1];
      const current = feature.geometry[index % feature.geometry.length];
      positions.push(previous[0], 0.2, previous[1], current[0], 0.2, current[1]);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createNamedAreaGeometry(features: OSMPolylineFeature[]) {
  const sourceNamedAreas = features.filter((feature) => {
    const name = feature.name?.toLowerCase() || '';
    return !feature.tags.building && (
      name.includes('oracle tech hub') ||
      name.includes('innovative multiplex') ||
      name.includes('kalamandir') ||
      name.includes('spice garden')
    );
  });
  return createBuildingGeometry(sourceNamedAreas, sourceNamedAreas.length);
}

export const OsmSnapshotLayer: React.FC<OsmSnapshotLayerProps> = ({
  isNight = false,
  showBuildings = false,
  buildingLimit = 500,
  labelDistanceFactor = 65
}) => {
  const [snapshot, setSnapshot] = useState<MarathahalliDemoSnapshot | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(MARATHAHALLI_SNAPSHOT_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`OSM snapshot request failed (${response.status})`);
        return response.json() as Promise<MarathahalliDemoSnapshot>;
      })
      .then((nextSnapshot) => setSnapshot(nextSnapshot))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.warn('OSM snapshot layer unavailable; using authored demo geometry', error);
        }
      });

    return () => controller.abort();
  }, []);

  const roadGeometry = useMemo(
    () => (snapshot ? createPolylineGeometry(snapshot.roads) : null),
    [snapshot]
  );
  const roadSurfaceGeometry = useMemo(
    () => (snapshot ? createRibbonGeometry(snapshot.roads, getRoadRibbonWidth, 0.075) : null),
    [snapshot]
  );
  const sourceBridgeFeatures = useMemo(
    () => snapshot?.roads.filter(isSourceElevatedRoad) || [],
    [snapshot]
  );
  const sourceBridgeSurfaceGeometry = useMemo(
    () => (snapshot ? createRibbonGeometry(sourceBridgeFeatures, getRoadRibbonWidth, 5.2) : null),
    [snapshot, sourceBridgeFeatures]
  );
  const sourceBridgeGeometry = useMemo(
    () => (snapshot ? createPolylineGeometry(sourceBridgeFeatures, 5.34) : null),
    [snapshot, sourceBridgeFeatures]
  );
  const footwayGeometry = useMemo(
    () => (snapshot ? createPolylineGeometry(snapshot.footways) : null),
    [snapshot]
  );
  const footwaySurfaceGeometry = useMemo(
    () => (snapshot ? createRibbonGeometry(snapshot.footways, 1.8, 0.14) : null),
    [snapshot]
  );
  const railwayGeometry = useMemo(
    () => (snapshot ? createPolylineGeometry(snapshot.railways) : null),
    [snapshot]
  );
  const buildingGeometry = useMemo(
    () => (snapshot && showBuildings ? createBuildingGeometry(snapshot.buildings, buildingLimit) : null),
    [buildingLimit, showBuildings, snapshot]
  );
  const buildingOutlineGeometry = useMemo(
    () => (snapshot && showBuildings ? createBuildingOutlineGeometry(snapshot.buildings) : null),
    [showBuildings, snapshot]
  );
  const namedAreaGeometry = useMemo(
    () => (snapshot && showBuildings ? createNamedAreaGeometry(snapshot.places) : null),
    [showBuildings, snapshot]
  );

  useEffect(() => () => {
    roadGeometry?.dispose();
    roadSurfaceGeometry?.dispose();
    sourceBridgeGeometry?.dispose();
    sourceBridgeSurfaceGeometry?.dispose();
    footwayGeometry?.dispose();
    footwaySurfaceGeometry?.dispose();
    railwayGeometry?.dispose();
    buildingGeometry?.dispose();
    buildingOutlineGeometry?.dispose();
    namedAreaGeometry?.dispose();
  }, [buildingGeometry, buildingOutlineGeometry, footwayGeometry, footwaySurfaceGeometry, namedAreaGeometry, railwayGeometry, roadGeometry, roadSurfaceGeometry, sourceBridgeGeometry, sourceBridgeSurfaceGeometry]);

  if (!snapshot) return null;

  return (
    <group name="MarathahalliOSMSnapshotLayer">
      {buildingGeometry && (
        <mesh geometry={buildingGeometry} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={isNight ? '#243b53' : '#71879a'}
            roughness={0.92}
            metalness={0.05}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {buildingOutlineGeometry && (
        <lineSegments geometry={buildingOutlineGeometry} renderOrder={1}>
          <lineBasicMaterial
            color={isNight ? '#64748b' : '#a8bac8'}
            transparent
            opacity={isNight ? 0.22 : 0.32}
            depthWrite={false}
          />
        </lineSegments>
      )}

      {namedAreaGeometry && (
        <mesh geometry={namedAreaGeometry} position={[0, 0, 0]} renderOrder={1}>
          <meshStandardMaterial
            color={isNight ? '#164e63' : '#0f766e'}
            roughness={0.82}
            metalness={0.08}
            transparent
            opacity={0.68}
          />
        </mesh>
      )}

      {roadSurfaceGeometry && (
        <mesh geometry={roadSurfaceGeometry} renderOrder={0}>
          <meshStandardMaterial
            color={isNight ? '#111827' : '#273449'}
            roughness={0.94}
            metalness={0.02}
            transparent
            opacity={0.82}
          />
        </mesh>
      )}

      {/* Source-mapped bridge/viaduct ways are lifted above the base road
          layer. Supports are intentionally not invented here: the source
          geometry is authoritative for plan position, while the central
          metro structure remains an explicitly modelled transport layer. */}
      {sourceBridgeSurfaceGeometry && (
        <mesh geometry={sourceBridgeSurfaceGeometry} renderOrder={1}>
          <meshStandardMaterial
            color={isNight ? '#475569' : '#a8b4bf'}
            roughness={0.82}
            metalness={0.12}
            transparent
            opacity={0.78}
          />
        </mesh>
      )}
      {sourceBridgeGeometry && (
        <lineSegments geometry={sourceBridgeGeometry} renderOrder={2}>
          <lineBasicMaterial color={isNight ? '#cbd5e1' : '#64748b'} transparent opacity={0.82} />
        </lineSegments>
      )}

      {footwaySurfaceGeometry && (
        <mesh geometry={footwaySurfaceGeometry} renderOrder={1}>
          <meshStandardMaterial
            color={isNight ? '#a16207' : '#cbd5e1'}
            roughness={0.9}
            metalness={0.02}
            transparent
            opacity={0.78}
          />
        </mesh>
      )}

      {roadGeometry && (
        <lineSegments geometry={roadGeometry} renderOrder={2}>
          <lineBasicMaterial color={isNight ? '#94a3b8' : '#334155'} transparent opacity={0.78} />
        </lineSegments>
      )}

      {footwayGeometry && (
        <lineSegments geometry={footwayGeometry} renderOrder={3}>
          <lineBasicMaterial color={isNight ? '#fbbf24' : '#b45309'} transparent opacity={0.85} />
        </lineSegments>
      )}

      {/* Compiled source rail/viaduct ways are rendered separately from the
          authored junction rail scene so the long corridor view includes the
          mapped Bangalore-Salem railway and Namma Metro Phase 2A alignment. */}
      {railwayGeometry && (
        <lineSegments geometry={railwayGeometry} position={[0, 0.2, 0]} renderOrder={4}>
          <lineBasicMaterial color={isNight ? '#fbbf24' : '#7c3aed'} transparent opacity={0.74} />
        </lineSegments>
      )}

      <group name="OSMSnapshotPointFeatures">
        {snapshot.shops.slice(0, 160).map((shop) => (
          <mesh key={`shop-${shop.id}`} position={[shop.position[0], 0.55, shop.position[1]]}>
            <cylinderGeometry args={[0.45, 0.45, 1.1, 8]} />
            <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={isNight ? 0.9 : 0.15} />
          </mesh>
        ))}

        {snapshot.signals.map((signal) => (
          <mesh key={`signal-${signal.id}`} position={[signal.position[0], 1.2, signal.position[1]]}>
            <sphereGeometry args={[0.7, 10, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={isNight ? 2.2 : 0.45} />
          </mesh>
        ))}

        {snapshot.crossings.map((crossing) => (
          <mesh key={`crossing-${crossing.id}`} position={[crossing.position[0], 0.24, crossing.position[1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 1.0, 12]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} />
          </mesh>
        ))}

        {snapshot.busStops.map((stop) => (
          <mesh key={`bus-stop-${stop.id}`} position={[stop.position[0], 1.0, stop.position[1]]}>
            <cylinderGeometry args={[0.35, 0.35, 2.0, 8]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0369a1" emissiveIntensity={isNight ? 1.4 : 0.25} />
          </mesh>
        ))}

        {snapshot.trees.map((tree) => (
          <group key={`tree-${tree.id}`} position={[tree.position[0], 0, tree.position[1]]}>
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[0.12, 0.18, 2.0, 6]} />
              <meshStandardMaterial color="#78350f" roughness={1} />
            </mesh>
            <mesh position={[0, 2.6, 0]}>
              <coneGeometry args={[1.1, 3.2, 8]} />
              <meshStandardMaterial color={isNight ? '#14532d' : '#166534'} roughness={0.95} />
            </mesh>
          </group>
        ))}
      </group>

      <group name="OSMSourceLandmarkLabels">
        {['Oracle Tech Hub', 'Innovative Multiplex', 'Kalamandir', 'Spice Garden'].map((label) => {
          const place = snapshot.places.find((feature) => feature.name?.toLowerCase() === label.toLowerCase())
            || snapshot.places.find((feature) => feature.name?.toLowerCase().includes(label.toLowerCase()));
          const point = [...snapshot.shops, ...snapshot.busStops].find((feature) =>
            feature.name?.toLowerCase() === label.toLowerCase()
          );
          if (!place && !point) return null;
          const position = place?.centroid || point?.position;
          if (!position) return null;
          return (
            <Html
              key={label}
              position={[position[0], Math.max(4, place?.height || 4) + 4, position[1]]}
              center
              distanceFactor={labelDistanceFactor}
              zIndexRange={[20, 0]}
            >
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.84)',
                  border: '1px solid rgba(56, 189, 248, 0.55)',
                  borderRadius: '5px',
                  color: '#e0f2fe',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  letterSpacing: '0.35px',
                  padding: '4px 7px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 3px 12px rgba(2, 6, 23, 0.4)'
                }}
              >
                SOURCE · {label.toUpperCase()}
              </div>
            </Html>
          );
        })}
      </group>
    </group>
  );
};

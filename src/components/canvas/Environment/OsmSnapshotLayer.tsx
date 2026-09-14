import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
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
}

function createPolylineGeometry(features: OSMPolylineFeature[]) {
  const positions: number[] = [];
  for (const feature of features) {
    for (let index = 1; index < feature.geometry.length; index += 1) {
      const previous = feature.geometry[index - 1];
      const current = feature.geometry[index];
      positions.push(previous[0], 0.12, previous[1], current[0], 0.12, current[1]);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function createBuildingGeometry(features: OSMPolylineFeature[], limit: number) {
  const nearest = [...features]
    .sort((a, b) => {
      const aDistance = a.centroid[0] ** 2 + a.centroid[1] ** 2;
      const bDistance = b.centroid[0] ** 2 + b.centroid[1] ** 2;
      return aDistance - bDistance;
    })
    .slice(0, limit);
  const geometries: THREE.BufferGeometry[] = [];

  for (const feature of nearest) {
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

export const OsmSnapshotLayer: React.FC<OsmSnapshotLayerProps> = ({
  isNight = false,
  showBuildings = false,
  buildingLimit = 500
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
  const footwayGeometry = useMemo(
    () => (snapshot ? createPolylineGeometry(snapshot.footways) : null),
    [snapshot]
  );
  const buildingGeometry = useMemo(
    () => (snapshot && showBuildings ? createBuildingGeometry(snapshot.buildings, buildingLimit) : null),
    [buildingLimit, showBuildings, snapshot]
  );

  useEffect(() => () => {
    roadGeometry?.dispose();
    footwayGeometry?.dispose();
    buildingGeometry?.dispose();
  }, [buildingGeometry, footwayGeometry, roadGeometry]);

  if (!snapshot) return null;

  return (
    <group name="MarathahalliOSMSnapshotLayer">
      {buildingGeometry && (
        <mesh geometry={buildingGeometry} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={isNight ? '#243b53' : '#64748b'}
            roughness={0.92}
            metalness={0.05}
            transparent
            opacity={0.48}
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
    </group>
  );
};

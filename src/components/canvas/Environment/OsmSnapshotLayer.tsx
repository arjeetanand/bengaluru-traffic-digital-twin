import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  MarathahalliDemoSnapshot,
  OSMHeightSource,
  OSMPolylineFeature,
  isSourceElevatedRoad,
  isNammaMetroSourceWay,
  isNammaMetroMainlineWay,
  isNammaMetroPierSupport
} from '../../../data/marathahalliDemo';
import { getOrrUnderpassElevation } from '../../../data/RealRoadData';
import {
  isSourceNavigableFootway,
  isSourceUnverifiedStructure,
  resolveSourceStructureElevation
} from '../../../data/marathahalliNavigation';
import { loadMarathahalliSnapshot } from '../../../services/marathahalliSnapshot';

interface OsmSnapshotLayerProps {
  isNight?: boolean;
  showBuildings?: boolean;
  buildingLimit?: number;
  buildingOpacity?: number;
  buildingOutlineOpacity?: number;
  labelDistanceFactor?: number;
}

function createPolylineGeometry(
  features: OSMPolylineFeature[],
  y: number | ((feature: OSMPolylineFeature, point: [number, number]) => number) = 0.12
) {
  const positions: number[] = [];
  for (const feature of features) {
    for (let index = 1; index < feature.geometry.length; index += 1) {
      const previous = feature.geometry[index - 1];
      const current = feature.geometry[index];
      const previousY = typeof y === 'function' ? y(feature, previous) : y;
      const currentY = typeof y === 'function' ? y(feature, current) : y;
      positions.push(previous[0], previousY, previous[1], current[0], currentY, current[1]);
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
  y: number | ((feature: OSMPolylineFeature, point: [number, number]) => number)
) {
  const positions: number[] = [];
  for (const feature of features) {
    if (feature.geometry.length < 2) continue;

    const halfWidth = (typeof width === 'function' ? width(feature) : width) / 2;
    const stripEdges = feature.geometry.map((point, index) => {
      const previous = feature.geometry[Math.max(0, index - 1)];
      const next = feature.geometry[Math.min(feature.geometry.length - 1, index + 1)];
      const previousDx = point[0] - previous[0];
      const previousDz = point[1] - previous[1];
      const nextDx = next[0] - point[0];
      const nextDz = next[1] - point[1];
      const previousLength = Math.hypot(previousDx, previousDz);
      const nextLength = Math.hypot(nextDx, nextDz);

      // Degenerate source vertices occasionally occur in OSM ways. Use the
      // non-zero adjacent segment so one bad vertex cannot collapse the
      // entire strip.
      const tangentDx = nextLength >= 0.05
        ? nextDx / nextLength
        : previousLength >= 0.05
          ? previousDx / previousLength
          : 1;
      const tangentDz = nextLength >= 0.05
        ? nextDz / nextLength
        : previousLength >= 0.05
          ? previousDz / previousLength
          : 0;
      const nextNormalX = -tangentDz;
      const nextNormalZ = tangentDx;

      let miterX = nextNormalX;
      let miterZ = nextNormalZ;
      let miterScale = halfWidth;
      if (previousLength >= 0.05 && nextLength >= 0.05) {
        const previousTangentX = previousDx / previousLength;
        const previousTangentZ = previousDz / previousLength;
        const previousNormalX = -previousTangentZ;
        const previousNormalZ = previousTangentX;
        const combinedNormalLength = Math.hypot(
          previousNormalX + nextNormalX,
          previousNormalZ + nextNormalZ
        );

        if (combinedNormalLength >= 0.001) {
          miterX = (previousNormalX + nextNormalX) / combinedNormalLength;
          miterZ = (previousNormalZ + nextNormalZ) / combinedNormalLength;
          const miterDenominator = miterX * nextNormalX + miterZ * nextNormalZ;
          if (Math.abs(miterDenominator) >= 0.2) {
            // Clamp acute OSM bends so a narrow footway cannot create an
            // extreme spike that reaches into an adjacent building or lane.
            miterScale = Math.min(halfWidth * 3, halfWidth / miterDenominator);
          } else {
            miterX = nextNormalX;
            miterZ = nextNormalZ;
          }
        }
      }

      const yValue = typeof y === 'function' ? y(feature, point) : y;
      return {
        left: [point[0] + miterX * miterScale, yValue, point[1] + miterZ * miterScale] as const,
        right: [point[0] - miterX * miterScale, yValue, point[1] - miterZ * miterScale] as const
      };
    });

    for (let index = 1; index < stripEdges.length; index += 1) {
      const previous = stripEdges[index - 1];
      const current = stripEdges[index];
      positions.push(
        previous.left[0], previous.left[1], previous.left[2],
        current.left[0], current.left[1], current.left[2],
        previous.right[0], previous.right[1], previous.right[2],
        current.left[0], current.left[1], current.left[2],
        current.right[0], current.right[1], current.right[2],
        previous.right[0], previous.right[1], previous.right[2]
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

const SOURCE_ROAD_DETAIL_HIGHWAYS = new Set([
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'tertiary',
  'tertiary_link'
]);
const SOURCE_ROAD_DETAIL_LIMIT = 220;
// Use only the mapped corridor-scale road classes for the building selection
// score. Residential/service ways remain rendered by the source road layer;
// including all of them here would make every building selection revisit a
// much larger segment index without improving the skyline LOD.
const SOURCE_BUILDING_CONTEXT_HIGHWAYS = SOURCE_ROAD_DETAIL_HIGHWAYS;
const SOURCE_BUILDING_CONTEXT_CELL_SIZE = 110;
const SOURCE_BUILDING_REPRESENTATIVES_PER_CELL = 3;
const SOURCE_BUILDING_OUTLINE_COVERAGE_MIN_LIMIT = 800;
const SOURCE_BUILDING_MAX_RENDER_HEIGHT = 32;

function createLineGeometry(positions: number[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function pushDashedSegment(
  positions: number[],
  start: [number, number],
  end: [number, number],
  startY: number,
  endY: number,
  dashLength = 4.5,
  gapLength = 4.5
) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const length = Math.hypot(dx, dz);
  if (length < 0.2) return;

  for (let distance = 0; distance < length; distance += dashLength + gapLength) {
    const from = distance / length;
    const to = Math.min(1, (distance + dashLength) / length);
    positions.push(
      start[0] + dx * from,
      startY + (endY - startY) * from,
      start[1] + dz * from,
      start[0] + dx * to,
      startY + (endY - startY) * to,
      start[1] + dz * to
    );
  }
}

function createRoadDetailGeometries(features: OSMPolylineFeature[]) {
  const edgePositions: number[] = [];
  const lanePositions: number[] = [];

  for (const feature of features.slice(0, SOURCE_ROAD_DETAIL_LIMIT)) {
    const lanes = Math.max(1, Math.min(8, Math.round(Number(feature.tags.lanes)) || 1));
    const halfWidth = getRoadRibbonWidth(feature) / 2;

    for (let index = 1; index < feature.geometry.length; index += 1) {
      const previous = feature.geometry[index - 1];
      const current = feature.geometry[index];
      const dx = current[0] - previous[0];
      const dz = current[1] - previous[1];
      const length = Math.hypot(dx, dz);
      if (length < 0.2) continue;

      const normalX = -dz / length;
      const normalZ = dx / length;
      const edgeOffset = Math.max(0.35, halfWidth - 0.32);
      const previousY = getRoadSurfaceY(feature, previous) + 0.045;
      const currentY = getRoadSurfaceY(feature, current) + 0.045;

      // OSM way geometry supplies the road center trace; these two lines are
      // display edges derived from its lane width, not a survey of paint or
      // curb placement.
      for (const side of [-1, 1]) {
        edgePositions.push(
          previous[0] + normalX * edgeOffset * side,
          previousY,
          previous[1] + normalZ * edgeOffset * side,
          current[0] + normalX * edgeOffset * side,
          currentY,
          current[1] + normalZ * edgeOffset * side
        );
      }

      if (lanes < 2) continue;
      const laneWidth = (halfWidth * 2) / lanes;
      for (let lane = 1; lane < lanes; lane += 1) {
        const offset = -halfWidth + laneWidth * lane;
        const laneStart: [number, number] = [
          previous[0] + normalX * offset,
          previous[1] + normalZ * offset
        ];
        const laneEnd: [number, number] = [
          current[0] + normalX * offset,
          current[1] + normalZ * offset
        ];
        pushDashedSegment(lanePositions, laneStart, laneEnd, previousY, currentY);
      }
    }
  }

  return {
    edge: createLineGeometry(edgePositions),
    lane: createLineGeometry(lanePositions)
  };
}

function isSourceBridgeFeature(feature: OSMPolylineFeature) {
  const bridgeTag = feature.tags.bridge;
  return isSourceElevatedRoad(feature) ||
    (Boolean(bridgeTag) && bridgeTag !== 'no') ||
    feature.tags.man_made === 'bridge';
}

function isSourceUnderpass(feature: OSMPolylineFeature) {
  const name = feature.name || feature.tags.name || '';
  return /underpass/i.test(name) || feature.tags.tunnel === 'yes';
}

function isSourceTunnel(feature: OSMPolylineFeature) {
  return feature.tags.man_made === 'tunnel' || isSourceUnderpass(feature);
}

function getInfrastructureDisplayY(feature: OSMPolylineFeature) {
  // OSM layer=-1/1 describes relative ordering only. These display datums
  // align the known tunnel with the authored scene. Unknown bridges use the
  // shared unverified fallback instead of borrowing a Skywalk/viaduct height.
  return isSourceTunnel(feature) ? -6.2 : resolveSourceStructureElevation(feature).lineY;
}

function getRoadSurfaceY(feature: OSMPolylineFeature, point: [number, number]) {
  if (isSourceUnderpass(feature)) return getOrrUnderpassElevation(point[1]) + 0.075;
  return 0.075;
}

function getRestrictionFeatures(snapshot: MarathahalliDemoSnapshot, restrictionType: string) {
  const restriction = snapshot.turnRestrictions.find((entry) => entry.restriction === restrictionType);
  if (!restriction) return null;

  const roadsById = new Map(snapshot.roads.map((feature) => [feature.id, feature]));
  const roads = [...new Set(
    restriction.members
      .filter((member) => member.type === 'way')
      .map((member) => roadsById.get(member.ref))
      .filter((feature): feature is OSMPolylineFeature => Boolean(feature))
  )];
  return { restriction, roads };
}

function pointToSegmentDistance(
  point: [number, number],
  start: [number, number],
  end: [number, number]
) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared < 0.01) return Math.hypot(point[0] - start[0], point[1] - start[1]);

  const progress = Math.max(0, Math.min(1, (
    (point[0] - start[0]) * dx + (point[1] - start[1]) * dz
  ) / lengthSquared));
  return Math.hypot(
    point[0] - (start[0] + progress * dx),
    point[1] - (start[1] + progress * dz)
  );
}

function getFeatureBounds(feature: OSMPolylineFeature) {
  const xs = feature.geometry.map(([x]) => x);
  const zs = feature.geometry.map(([, z]) => z);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs)
  };
}

interface SourceRoadSelectionFeature extends OSMPolylineFeature {
  bounds: ReturnType<typeof getFeatureBounds>;
}

function distanceToSourceRoad(point: [number, number], roads: readonly SourceRoadSelectionFeature[]) {
  let nearest = Infinity;
  for (const road of roads) {
    const bounds = road.bounds;
    if (bounds && (
      point[0] < bounds.minX - 120 || point[0] > bounds.maxX + 120
      || point[1] < bounds.minZ - 120 || point[1] > bounds.maxZ + 120
    )) continue;

    for (let index = 1; index < road.geometry.length; index += 1) {
      nearest = Math.min(nearest, pointToSegmentDistance(point, road.geometry[index - 1], road.geometry[index]));
      if (nearest <= 6) return nearest;
    }
  }
  return nearest;
}

function getBuildingFootprintArea(feature: OSMPolylineFeature) {
  if (feature.geometry.length < 3) return 1;
  let twiceArea = 0;
  for (let index = 0; index < feature.geometry.length; index += 1) {
    const current = feature.geometry[index];
    const next = feature.geometry[(index + 1) % feature.geometry.length];
    twiceArea += current[0] * next[1] - next[0] * current[1];
  }
  return Math.max(1, Math.abs(twiceArea) / 2);
}

function getStableFeatureJitter(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function getBuildingUseScore(feature: OSMPolylineFeature) {
  const tags = feature.tags;
  const use = `${tags.building || ''} ${tags.amenity || ''} ${tags.landuse || ''}`.toLowerCase();
  if (/apartments|residential|dormitory|hotel/.test(use)) return 32;
  if (/office|commercial|retail|hospital|school|industrial/.test(use)) return 24;
  if (/house|detached|semidetached|terrace/.test(use)) return 12;
  if (/garage|shed|hut/.test(use)) return 2;
  return 8;
}

function selectBuildingFeatures(
  features: OSMPolylineFeature[],
  limit: number,
  contextRoadFeatures: readonly OSMPolylineFeature[] = []
) {
  if (limit <= 0 || features.length === 0) return [];

  // Build a small, bounded road index once per selection pass. The previous
  // normalized 16×16 grid could leave a close view with only a handful of
  // buildings because a 250 m neighborhood occupied one global cell. Fixed
  // metre cells keep the crossover, Oracle campus and Kalamandir frontages
  // populated while still distributing the long corridor across the budget.
  const contextRoads: SourceRoadSelectionFeature[] = contextRoadFeatures
    .filter((road) => {
      const highway = road.tags.highway || '';
      const isNamed = Boolean(road.name || road.tags.name);
      const lanes = Number(road.tags.lanes);
      return SOURCE_BUILDING_CONTEXT_HIGHWAYS.has(highway)
        && (isNamed || Number.isFinite(lanes) || road.geometry.length > 4);
    })
    .sort((left, right) => right.geometry.length - left.geometry.length)
    .slice(0, 220)
    .map((road) => ({ ...road, bounds: getFeatureBounds(road) }));

  const candidates = features.map((feature) => {
    const isNamed = Boolean(feature.name || feature.tags.name);
    const source = getBuildingHeightSource(feature);
    const roadDistance = distanceToSourceRoad(feature.centroid, contextRoads);
    const area = getBuildingFootprintArea(feature);
    const roadFrontageScore = Number.isFinite(roadDistance)
      ? Math.max(0, 140 - roadDistance) * 2.2
      : 0;
    const score = (isNamed ? 10000 : 0)
      + roadFrontageScore
      + Math.min(120, Math.log1p(area) * 12)
      + getBuildingUseScore(feature)
      + (source === 'modelled:fallback' ? 0 : 20);
    return {
      feature,
      area,
      score,
      roadDistance,
      cell: `${Math.floor(feature.centroid[0] / SOURCE_BUILDING_CONTEXT_CELL_SIZE)}:${Math.floor(feature.centroid[1] / SOURCE_BUILDING_CONTEXT_CELL_SIZE)}`
    };
  });

  const byScore = [...candidates].sort((left, right) => (
    right.score - left.score || right.area - left.area || left.feature.id.localeCompare(right.feature.id)
  ));
  const grid = new Map<string, typeof candidates>();
  for (const candidate of byScore) {
    const cell = grid.get(candidate.cell) || [];
    if (cell.length < SOURCE_BUILDING_REPRESENTATIVES_PER_CELL) cell.push(candidate);
    grid.set(candidate.cell, cell);
  }

  const selected: OSMPolylineFeature[] = [];
  const selectedIds = new Set<string>();
  // Keep named buildings first, then a fixed-size context sample. All
  // selections remain source footprints; score only controls visibility LOD.
  for (const candidate of byScore) {
    if (!candidate.feature.name && !candidate.feature.tags.name) continue;
    if (selected.length >= limit) break;
    selected.push(candidate.feature);
    selectedIds.add(candidate.feature.id);
  }
  for (const candidate of [...grid.values()].flat()) {
    if (selected.length >= limit || selectedIds.has(candidate.feature.id)) continue;
    selected.push(candidate.feature);
    selectedIds.add(candidate.feature.id);
  }
  for (const candidate of byScore) {
    if (selected.length >= limit || selectedIds.has(candidate.feature.id)) continue;
    selected.push(candidate.feature);
    selectedIds.add(candidate.feature.id);
  }
  return selected;
}

function getBuildingHeightSource(feature: OSMPolylineFeature): OSMHeightSource {
  if (feature.heightSource) return feature.heightSource;
  const explicitHeight = Number(feature.tags.height);
  const explicitLevels = Number(feature.tags['building:levels']);
  if (Number.isFinite(explicitHeight) && explicitHeight > 0) return 'osm:height';
  if (Number.isFinite(explicitLevels) && explicitLevels > 0) return 'osm:building:levels';
  return 'modelled:fallback';
}

function getRenderableBuildingHeight(feature: OSMPolylineFeature) {
  const source = getBuildingHeightSource(feature);
  if (source !== 'modelled:fallback' || !feature.tags.building) {
    return Math.min(SOURCE_BUILDING_MAX_RENDER_HEIGHT, Math.max(3.2, feature.height || 4));
  }

  // The snapshot's fallback value is intentionally conservative (4 m). Use a
  // deterministic urban-massing estimate for display only, retaining the
  // modelled:fallback batch provenance. OSM plan geometry and use tags still
  // control the footprint; only missing vertical evidence is inferred here.
  const buildingType = feature.tags.building.toLowerCase();
  const baseHeight = /apartments|residential|dormitory|hotel/.test(buildingType)
    ? 12.5
    : /office|commercial|retail|hospital|school/.test(buildingType)
      ? 9.5
      : /industrial|warehouse/.test(buildingType)
        ? 7.5
        : /house|detached|semidetached|terrace/.test(buildingType)
          ? 5.4
          : /garage|shed|hut/.test(buildingType)
            ? 3.5
            : 6.5;
  const areaLift = Math.min(6, Math.sqrt(getBuildingFootprintArea(feature)) / 24);
  const jitter = (getStableFeatureJitter(feature.id) - 0.5) * 1.4;
  return Math.min(SOURCE_BUILDING_MAX_RENDER_HEIGHT, Math.max(3.5, baseHeight + areaLift + jitter));
}

function createBuildingExtrusion(feature: OSMPolylineFeature) {
  if (feature.geometry.length < 3) return null;
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
      depth: getRenderableBuildingHeight(feature),
      bevelEnabled: false,
      curveSegments: 1
    });
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  } catch {
    // A malformed self-intersecting OSM polygon should not block the rest
    // of the snapshot from rendering.
    return null;
  }
}

function mergeBuildingGeometries(features: OSMPolylineFeature[]) {
  const geometries = features
    .map(createBuildingExtrusion)
    .filter((geometry): geometry is THREE.ExtrudeGeometry => Boolean(geometry));
  if (!geometries.length) return null;

  try {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((geometry) => geometry.dispose());
    return merged;
  } catch {
    geometries.forEach((geometry) => geometry.dispose());
    return null;
  }
}

interface SourceBuildingGeometryBatch {
  source: OSMHeightSource;
  count: number;
  heightEvidence: string;
  geometry: THREE.BufferGeometry;
}

function createBuildingGeometry(features: OSMPolylineFeature[], limit: number) {
  return mergeBuildingGeometries(selectBuildingFeatures(features, limit));
}

function createBuildingGeometryBatches(features: OSMPolylineFeature[]): SourceBuildingGeometryBatch[] {
  const byProvenance = new Map<OSMHeightSource, OSMPolylineFeature[]>();
  for (const source of ['osm:height', 'osm:building:levels', 'modelled:fallback'] as OSMHeightSource[]) {
    byProvenance.set(source, []);
  }
  for (const feature of features) {
    byProvenance.get(getBuildingHeightSource(feature))?.push(feature);
  }

  return (['osm:height', 'osm:building:levels', 'modelled:fallback'] as OSMHeightSource[])
    .flatMap((source) => {
      const sourceFeatures = byProvenance.get(source) || [];
      const geometry = mergeBuildingGeometries(sourceFeatures);
      return geometry
        ? [{
          source,
          count: sourceFeatures.length,
          heightEvidence: source === 'modelled:fallback'
            ? 'missing OSM height/levels · deterministic use/area estimate'
            : source,
          geometry
        }]
        : [];
    });
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

function getHeightProvenanceLabel(feature: OSMPolylineFeature) {
  const source = getBuildingHeightSource(feature);
  const height = `${getRenderableBuildingHeight(feature).toFixed(1)}M`;

  if (source === 'osm:height') return `HEIGHT OSM TAG · ${height}`;
  if (source === 'osm:building:levels') {
    return `HEIGHT DERIVED · ${feature.tags['building:levels']} OSM LEVELS`;
  }
  return `HEIGHT UNKNOWN · ${height} MODELLED FALLBACK`;
}

interface SourceMarkerInstancesProps {
  positions: readonly [number, number][];
  featureType: string;
  color: string;
  emissive: string;
  emissiveIntensity: number;
}

const SourceMarkerInstances: React.FC<SourceMarkerInstancesProps> = ({
  positions,
  featureType,
  color,
  emissive,
  emissiveIntensity
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    positions.forEach(([x, z], index) => {
      dummy.position.set(x, 0.55, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [dummy, positions]);

  if (!positions.length) return null;
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, positions.length]}
      userData={{ source: 'OSM', featureType, rendering: 'instanced' }}
    >
      <cylinderGeometry args={[0.45, 0.45, 1.1, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.72}
      />
    </instancedMesh>
  );
};

interface SourceShopFrontageInstancesProps {
  positions: readonly [number, number][];
  isNight: boolean;
}

const SourceShopFrontageInstances: React.FC<SourceShopFrontageInstancesProps> = ({ positions, isNight }) => {
  const baseRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    if (!baseRef.current || !canopyRef.current) return;
    positions.forEach(([x, z], index) => {
      const width = 0.9 + (index % 3) * 0.16;
      dummy.position.set(x, 0.5, z);
      dummy.rotation.set(0, (index % 4) * Math.PI / 2, 0);
      dummy.scale.set(width, 1, 0.72 + (index % 2) * 0.12);
      dummy.updateMatrix();
      baseRef.current?.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, 1.12, z);
      dummy.scale.set(width * 1.12, 0.65, 0.86 + (index % 2) * 0.12);
      dummy.updateMatrix();
      canopyRef.current?.setMatrixAt(index, dummy.matrix);
    });
    baseRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
    baseRef.current.computeBoundingSphere();
    canopyRef.current.computeBoundingSphere();
  }, [dummy, positions]);

  if (!positions.length) return null;
  return (
    <group
      name="OSMNamedShopFrontageMarkers"
      userData={{
        source: 'OSM',
        featureType: 'named shop node',
        rendering: 'instanced',
        geometry: 'visual frontage marker, not a building footprint',
        count: positions.length
      }}
    >
      <instancedMesh ref={baseRef} args={[undefined, undefined, positions.length]} castShadow>
        <boxGeometry args={[1.65, 1, 1.2]} />
        <meshStandardMaterial
          color={isNight ? '#78350f' : '#b45309'}
          roughness={0.78}
          metalness={0.08}
        />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, positions.length]} castShadow>
        <boxGeometry args={[1.65, 0.16, 1.2]} />
        <meshStandardMaterial
          color={isNight ? '#f59e0b' : '#fbbf24'}
          emissive={isNight ? '#92400e' : '#000000'}
          emissiveIntensity={isNight ? 0.75 : 0}
          roughness={0.6}
        />
      </instancedMesh>
    </group>
  );
};

interface SourceTreeInstancesProps {
  positions: readonly [number, number][];
  isNight: boolean;
}

const SourceTreeInstances: React.FC<SourceTreeInstancesProps> = ({ positions, isNight }) => {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;
    positions.forEach(([x, z], index) => {
      const scale = 0.86 + (Math.sin(index * 12.7) + 1) * 0.08;
      const lean = Math.sin(index * 2.17) * 0.035;

      dummy.position.set(x, 1.35 * scale, z);
      dummy.rotation.set(lean, index * 0.37, lean * 0.72);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(index, dummy.matrix);

      dummy.position.set(x, 3.0 * scale, z);
      dummy.rotation.set(0, index * 0.52, 0);
      dummy.scale.set(0.82 * scale, 0.68 * scale, 0.82 * scale);
      dummy.updateMatrix();
      canopyRef.current?.setMatrixAt(index, dummy.matrix);

      color.set(isNight
        ? (index % 3 === 0 ? '#14532d' : '#166534')
        : (index % 3 === 0 ? '#15803d' : '#166534'));
      canopyRef.current?.setColorAt(index, color);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
    if (canopyRef.current.instanceColor) canopyRef.current.instanceColor.needsUpdate = true;
    trunkRef.current.computeBoundingSphere();
    canopyRef.current.computeBoundingSphere();
  }, [color, dummy, isNight, positions]);

  if (!positions.length) return null;
  return (
    <group name="OSMSourceTreeInstances" userData={{ source: 'OSM', featureType: 'tree/tree_row', rendering: 'instanced', count: positions.length }}>
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, positions.length]}
        castShadow
      >
        <cylinderGeometry args={[0.25, 0.38, 3.0, 7]} />
        <meshStandardMaterial color="#78350f" roughness={1} />
      </instancedMesh>
      <instancedMesh
        ref={canopyRef}
        args={[undefined, undefined, positions.length]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1.9, 7, 5]} />
        <meshStandardMaterial roughness={0.92} metalness={0.02} />
      </instancedMesh>
    </group>
  );
};

export const OsmSnapshotLayer: React.FC<OsmSnapshotLayerProps> = ({
  isNight = false,
  showBuildings = false,
  buildingLimit = 500,
  buildingOpacity = 0.5,
  buildingOutlineOpacity = 0.32,
  labelDistanceFactor = 65
}) => {
  const [snapshot, setSnapshot] = useState<MarathahalliDemoSnapshot | null>(null);
  const isLongRange = labelDistanceFactor > 1000;

  useEffect(() => {
    let active = true;
    loadMarathahalliSnapshot()
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch((error: unknown) => {
        if (active) console.warn('OSM snapshot layer unavailable; using authored demo geometry', error);
      });

    return () => { active = false; };
  }, []);

  const sourceGroundRoadFeatures = useMemo(
    () => snapshot?.roads.filter((feature) => !isSourceBridgeFeature(feature)) || [],
    [snapshot]
  );
  const roadGeometry = useMemo(
    () => (snapshot ? createPolylineGeometry(sourceGroundRoadFeatures, getRoadSurfaceY) : null),
    [snapshot, sourceGroundRoadFeatures]
  );
  const roadSurfaceGeometry = useMemo(
    () => (snapshot
      ? createRibbonGeometry(sourceGroundRoadFeatures, getRoadRibbonWidth, getRoadSurfaceY)
      : null),
    [snapshot, sourceGroundRoadFeatures]
  );
  const sourceRoadDetailFeatures = useMemo(
    () => sourceGroundRoadFeatures
      .filter((feature) => SOURCE_ROAD_DETAIL_HIGHWAYS.has(feature.tags.highway || '') && feature.geometry.length >= 2)
      .sort((left, right) => {
        const leftLanes = Number(left.tags.lanes);
        const rightLanes = Number(right.tags.lanes);
        const laneDelta = (Number.isFinite(rightLanes) ? rightLanes : 0) - (Number.isFinite(leftLanes) ? leftLanes : 0);
        if (laneDelta !== 0) return laneDelta;
        return right.geometry.length - left.geometry.length;
      })
      .slice(0, SOURCE_ROAD_DETAIL_LIMIT),
    [sourceGroundRoadFeatures]
  );
  const sourceRoadDetailGeometry = useMemo(
    () => (snapshot ? createRoadDetailGeometries(sourceRoadDetailFeatures) : null),
    [snapshot, sourceRoadDetailFeatures]
  );
  const sourceBridgeFeatures = useMemo(
    () => snapshot?.roads.filter(isSourceBridgeFeature) || [],
    [snapshot]
  );
  const sourceBridgeSupportFeatures = useMemo(
    () => (snapshot
      ? snapshot.bridgeSupports.filter((support) => !isNammaMetroPierSupport(
        support,
        snapshot.railways.filter(isNammaMetroMainlineWay)
      ))
      : []),
    [snapshot]
  );
  const sourceBridgeSurfaceGeometry = useMemo(
    () => (snapshot
      ? createRibbonGeometry(
        sourceBridgeFeatures,
        getRoadRibbonWidth,
        (feature) => resolveSourceStructureElevation(feature).renderY
      )
      : null),
    [snapshot, sourceBridgeFeatures]
  );
  const sourceBridgeGeometry = useMemo(
    () => (snapshot
      ? createPolylineGeometry(
        sourceBridgeFeatures,
        (feature) => resolveSourceStructureElevation(feature).lineY
      )
      : null),
    [snapshot, sourceBridgeFeatures]
  );
  const sourceWalkableFootwayFeatures = useMemo(
    () => snapshot?.footways.filter(isSourceNavigableFootway) || [],
    [snapshot]
  );
  const sourceUnverifiedFootwayFeatures = useMemo(
    () => snapshot?.footways.filter(isSourceUnverifiedStructure) || [],
    [snapshot]
  );
  const sourceUnverifiedStructureLabelFeatures = useMemo(
    () => (snapshot && !isLongRange
      ? [
        ...sourceBridgeFeatures.filter(isSourceUnverifiedStructure),
        ...sourceUnverifiedFootwayFeatures
      ].slice(0, 28)
      : []),
    [isLongRange, snapshot, sourceBridgeFeatures, sourceUnverifiedFootwayFeatures]
  );
  const footwayGeometry = useMemo(
    () => (snapshot
      ? createPolylineGeometry(
        sourceWalkableFootwayFeatures,
        (feature) => resolveSourceStructureElevation(feature).lineY
      )
      : null),
    [snapshot, sourceWalkableFootwayFeatures]
  );
  const footwaySurfaceGeometry = useMemo(
    () => (snapshot
      ? createRibbonGeometry(
        sourceWalkableFootwayFeatures,
        1.8,
        (feature) => resolveSourceStructureElevation(feature).renderY
      )
      : null),
    [snapshot, sourceWalkableFootwayFeatures]
  );
  const unverifiedFootwayGeometry = useMemo(
    () => (snapshot
      ? createPolylineGeometry(
        sourceUnverifiedFootwayFeatures,
        (feature) => resolveSourceStructureElevation(feature).lineY
      )
      : null),
    [snapshot, sourceUnverifiedFootwayFeatures]
  );
  const railwayGeometry = useMemo(
    () => (snapshot ? createPolylineGeometry(snapshot.railways.filter((feature) => !isNammaMetroSourceWay(feature))) : null),
    [snapshot]
  );
  const sourceInfrastructureGeometry = useMemo(
    () => (snapshot
      ? createPolylineGeometry(snapshot.infrastructure || [], (feature) => getInfrastructureDisplayY(feature) + 0.18)
      : null),
    [snapshot]
  );
  const selectedBuildingFeatures = useMemo(
    () => (snapshot && showBuildings
      ? selectBuildingFeatures(snapshot.buildings, buildingLimit, snapshot.roads)
      : []),
    [buildingLimit, showBuildings, snapshot]
  );
  const buildingGeometryBatches = useMemo(
    () => (showBuildings ? createBuildingGeometryBatches(selectedBuildingFeatures) : []),
    [selectedBuildingFeatures, showBuildings]
  );
  const buildingOutlineFeatures = useMemo(
    () => (snapshot && showBuildings
      // A single low-opacity line batch is substantially cheaper than
      // extruding every footprint. Keep the complete source plan visible once
      // the scene is in a normal corridor/local inspection budget; the
      // smaller fallback still avoids doing extra work during initial load.
      ? (buildingLimit >= SOURCE_BUILDING_OUTLINE_COVERAGE_MIN_LIMIT
        ? snapshot.buildings
        : selectedBuildingFeatures)
      : []),
    [buildingLimit, selectedBuildingFeatures, showBuildings, snapshot]
  );
  const buildingOutlineGeometry = useMemo(
    () => (showBuildings ? createBuildingOutlineGeometry(buildingOutlineFeatures) : null),
    [buildingOutlineFeatures, showBuildings]
  );
  const namedAreaGeometry = useMemo(
    () => (snapshot && showBuildings ? createNamedAreaGeometry(snapshot.places) : null),
    [showBuildings, snapshot]
  );
  const sourceShopFeatures = useMemo(() => {
    if (!snapshot) return [];
    // Keep every named source POI ahead of unnamed shop nodes so landmark
    // anchors are never lost just because the XML ordering changed.
    const named = snapshot.shops.filter((shop) => shop.name || shop.tags.name);
    const unnamed = snapshot.shops.filter((shop) => !shop.name && !shop.tags.name);
    return [...named, ...unnamed].slice(0, 420);
  }, [snapshot]);
  const sourceShopMarkerPositions = useMemo(
    () => sourceShopFeatures.map((shop) => shop.position),
    [sourceShopFeatures]
  );
  const sourceNamedShopFrontagePositions = useMemo(
    () => sourceShopFeatures
      .filter((shop) => shop.name || shop.tags.name)
      .map((shop) => shop.position),
    [sourceShopFeatures]
  );
  const sourceTreePositions = useMemo(() => {
    if (!snapshot) return [] as [number, number][];
    const points: [number, number][] = snapshot.trees.map((tree) => tree.position);
    const addIfSeparated = (point: [number, number]) => {
      if (points.some(([x, z]) => Math.hypot(point[0] - x, point[1] - z) < 4)) return;
      points.push(point);
    };

    for (const row of snapshot.treeRows || []) {
      for (let index = 1; index < row.geometry.length; index += 1) {
        const start = row.geometry[index - 1];
        const end = row.geometry[index];
        const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
        const samples = Math.max(1, Math.ceil(length / 8));
        for (let sample = 0; sample <= samples; sample += 1) {
          const progress = sample / samples;
          addIfSeparated([
            start[0] + (end[0] - start[0]) * progress,
            start[1] + (end[1] - start[1]) * progress
          ]);
        }
      }
    }
    return points;
  }, [snapshot]);
  const sourceShopLabelFeatures = useMemo(() => {
    // Keep the wide corridor survey readable: all named source shops remain
    // available as instanced POIs, while a ranked, spatially distributed label
    // set makes the actual frontage legible without turning the corridor into
    // a wall of HTML billboards.
    if (!snapshot || labelDistanceFactor > 1000) return [];
    const labelLimit = labelDistanceFactor < 40 ? 20 : 48;
    const landmarkShopPattern = /spice garden|pizza hut|village hypermart|holly flames|sweet chariot|kalamandir|nalli|tanishq|kalyan|brand factory|multiplex/i;
    const named = snapshot.shops.filter((shop) => shop.name || shop.tags.name);
    const priority = named
      .filter((shop) => landmarkShopPattern.test(shop.name || shop.tags.name || ''))
      .sort((left, right) => (left.position[0] ** 2 + left.position[1] ** 2) - (right.position[0] ** 2 + right.position[1] ** 2));
    const selected: typeof named = [];
    const selectedIds = new Set<string>();
    for (const shop of priority) {
      if (selected.length >= labelLimit || selectedIds.has(shop.id)) continue;
      selected.push(shop);
      selectedIds.add(shop.id);
    }

    // Farthest-point sampling keeps the remaining labels distributed from
    // Oracle through the junction to Kalamandir/Spice Garden instead of
    // clustering around the local origin. All candidates remain source POIs;
    // this only limits which names are placed in the 3D view.
    while (selected.length < labelLimit) {
      let bestShop: typeof named[number] | undefined;
      let bestDistance = -1;
      for (const candidate of named) {
        if (selectedIds.has(candidate.id)) continue;
        const nearestDistance = selected.length === 0
          ? candidate.position[0] ** 2 + candidate.position[1] ** 2
          : Math.min(...selected.map((shop) => (
            (candidate.position[0] - shop.position[0]) ** 2
            + (candidate.position[1] - shop.position[1]) ** 2
          )));
        if (nearestDistance > bestDistance) {
          bestDistance = nearestDistance;
          bestShop = candidate;
        }
      }
      if (!bestShop) break;
      selected.push(bestShop);
      selectedIds.add(bestShop.id);
    }
    return selected;
  }, [labelDistanceFactor, snapshot]);
  // Person presets use a compact but non-zero source label factor (currently
  // 24) so the landmark name remains legible at eye level. Treat that range
  // as street scale too; the bird presets start at 65 and keep their larger
  // corridor labels.
  const isFirstPersonLabelScale = labelDistanceFactor < 40;
  // Nearby POIs can otherwise expand into a billboard when a person starts
  // beside a shop node. Keep the source label readable while capping its
  // world-space scale; bird/overview labels retain their corridor scale.
  const sourceShopLabelDistanceFactor = isFirstPersonLabelScale
    ? Math.min(15, Math.max(8, labelDistanceFactor * 0.55))
    : Math.max(45, labelDistanceFactor * 0.82);
  const sourceRoadLabelFeatures = useMemo(() => {
    if (!snapshot || isLongRange) return [];
    const priority = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'service']);
    const seen = new Set<string>();
    return snapshot.roads
      .filter((road) => {
        const name = road.name || road.tags.name;
        const highway = road.tags.highway || '';
        if (!name || !priority.has(highway) || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .sort((a, b) => (
        (a.centroid[0] ** 2 + a.centroid[1] ** 2) - (b.centroid[0] ** 2 + b.centroid[1] ** 2)
      ))
      .slice(0, 12);
  }, [isLongRange, snapshot]);
  const noUTurnSource = useMemo(
    () => (snapshot ? getRestrictionFeatures(snapshot, 'no_u_turn') : null),
    [snapshot]
  );
  const noUTurnGeometry = useMemo(
    () => (noUTurnSource
      ? createRibbonGeometry(noUTurnSource.roads, 1.45, getRoadSurfaceY)
      : null),
    [noUTurnSource]
  );
  const noUTurnLabelPosition = useMemo<[number, number, number]>(() => {
    if (!noUTurnSource?.roads.length) return [-24, 3.4, 16];
    const points = noUTurnSource.roads.flatMap((feature) => feature.geometry);
    const [x, z] = points.reduce(
      ([sumX, sumZ], [pointX, pointZ]) => [sumX + pointX, sumZ + pointZ],
      [0, 0]
    );
    return [x / points.length, 3.4, z / points.length];
  }, [noUTurnSource]);
  useEffect(() => () => {
    roadGeometry?.dispose();
    roadSurfaceGeometry?.dispose();
    sourceRoadDetailGeometry?.edge.dispose();
    sourceRoadDetailGeometry?.lane.dispose();
    sourceBridgeGeometry?.dispose();
    sourceBridgeSurfaceGeometry?.dispose();
    footwayGeometry?.dispose();
    footwaySurfaceGeometry?.dispose();
    unverifiedFootwayGeometry?.dispose();
    railwayGeometry?.dispose();
    sourceInfrastructureGeometry?.dispose();
    buildingGeometryBatches.forEach((batch) => batch.geometry.dispose());
    buildingOutlineGeometry?.dispose();
    namedAreaGeometry?.dispose();
    noUTurnGeometry?.dispose();
  }, [buildingGeometryBatches, buildingOutlineGeometry, footwayGeometry, footwaySurfaceGeometry, namedAreaGeometry, noUTurnGeometry, railwayGeometry, roadGeometry, roadSurfaceGeometry, sourceBridgeGeometry, sourceBridgeSurfaceGeometry, sourceInfrastructureGeometry, sourceRoadDetailGeometry, unverifiedFootwayGeometry]);

  if (!snapshot) return null;

  return (
    <group name="MarathahalliOSMSnapshotLayer">
      {buildingGeometryBatches.map((batch) => (
        <mesh
          key={`osm-building-batch-${batch.source}`}
          geometry={batch.geometry}
          position={[0, 0, 0]}
          userData={{
            source: 'OSM',
            heightProvenance: batch.source,
            featureCount: batch.count,
            rendering: 'merged',
            heightEvidence: batch.heightEvidence
          }}
        >
          <meshStandardMaterial
            color={batch.source === 'osm:height'
              ? (isNight ? '#155e75' : '#4d8b9e')
              : batch.source === 'osm:building:levels'
                ? (isNight ? '#1e3a5f' : '#71879a')
                : (isNight ? '#243447' : '#8799a8')}
            emissive={batch.source === 'osm:height'
              ? (isNight ? '#083344' : '#0f3d4c')
              : (isNight ? '#08111c' : '#000000')}
            emissiveIntensity={batch.source === 'osm:height'
              ? (isNight ? 0.22 : (isLongRange ? 0.18 : 0.06))
              : (isNight ? 0.16 : (isLongRange ? 0.22 : 0))}
            roughness={0.92}
            metalness={0.05}
            transparent
            opacity={batch.source === 'modelled:fallback' ? buildingOpacity * 0.72 : buildingOpacity}
          />
        </mesh>
      ))}

      {buildingOutlineGeometry && (
        <lineSegments
          geometry={buildingOutlineGeometry}
          renderOrder={1}
          userData={{
            source: 'OSM',
            featureType: 'building footprint',
            coverage: buildingOutlineFeatures.length === snapshot.buildings.length ? 'full snapshot' : 'selected LOD',
            featureCount: buildingOutlineFeatures.length,
            heightProvenance: 'plan geometry only; no vertical claim'
          }}
        >
          <lineBasicMaterial
            color={isNight ? '#64748b' : '#a8bac8'}
            transparent
            opacity={isNight ? Math.min(0.22, buildingOutlineOpacity) : buildingOutlineOpacity}
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

      {/* Lane and edge hints are derived from OSM highway/lanes tags. They are
          intentionally a limited, merged overlay: useful for reading the
          crossover and corridor structure, but not presented as surveyed
          paint, curb, or lane-width measurements. */}
      {sourceRoadDetailGeometry?.edge && (
        <lineSegments
          geometry={sourceRoadDetailGeometry.edge}
          renderOrder={2}
          userData={{ source: 'OSM', detail: 'road-edge-hints', tags: 'highway/lanes', rendering: 'merged' }}
        >
          <lineBasicMaterial
            color={isNight ? '#e2e8f0' : '#94a3b8'}
            transparent
            opacity={isNight ? 0.74 : 0.62}
            depthWrite={false}
          />
        </lineSegments>
      )}
      {sourceRoadDetailGeometry?.lane && (
        <lineSegments
          geometry={sourceRoadDetailGeometry.lane}
          renderOrder={3}
          userData={{ source: 'OSM', detail: 'lane-separator-hints', tags: 'lanes', rendering: 'merged' }}
        >
          <lineBasicMaterial
            color={isNight ? '#fde68a' : '#facc15'}
            transparent
            opacity={isNight ? 0.82 : 0.68}
            depthWrite={false}
          />
        </lineSegments>
      )}

      {/* The source no_u_turn relation is evidence, not a legal movement
          overlay. It stays red and source-labelled so the modelled amber
          scenario connector cannot be mistaken for a verified real-world
          turn permission. */}
      {noUTurnGeometry && (
        <mesh geometry={noUTurnGeometry} renderOrder={5}>
          <meshBasicMaterial color="#ef4444" transparent opacity={0.62} depthWrite={false} />
        </mesh>
      )}

      {/* Source-mapped bridge/viaduct ways use the shared structure registry.
          Only the known Varthur viaduct keeps its verified elevated datum;
          other bridge tags are rendered at the explicit unverified fallback
          and labelled below rather than borrowing the Skywalk height. */}
      {sourceBridgeSurfaceGeometry && (
        <mesh
          geometry={sourceBridgeSurfaceGeometry}
          renderOrder={1}
          userData={{ source: 'OSM', elevationContract: 'shared-structure-registry' }}
        >
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
        <lineSegments
          geometry={sourceBridgeGeometry}
          renderOrder={2}
          userData={{ source: 'OSM', elevationContract: 'shared-structure-registry' }}
        >
          <lineBasicMaterial color={isNight ? '#cbd5e1' : '#64748b'} transparent opacity={0.82} />
        </lineSegments>
      )}

      {/* OSM explicitly tags these support nodes as bridge piers. They belong
          to source elevated-road/rail structures, not the separate modelled
          metro support sequence, so keep their provenance visible in code and
          place them at the same source bridge deck datum. */}
      <group name="OSMSourceBridgePiers">
        {sourceBridgeSupportFeatures.map((support) => (
          <group key={`bridge-support-${support.id}`} position={[support.position[0], 0, support.position[1]]}>
            <mesh position={[0, 2.35, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.72, 0.88, 4.7, 10]} />
              <meshStandardMaterial color={isNight ? '#64748b' : '#9ca3af'} roughness={0.9} metalness={0.04} />
            </mesh>
            <mesh position={[0, 4.82, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.0, 0.52, 1.7]} />
              <meshStandardMaterial color={isNight ? '#475569' : '#94a3b8'} roughness={0.86} metalness={0.05} />
            </mesh>
          </group>
        ))}
      </group>

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
        <lineSegments
          geometry={footwayGeometry}
          renderOrder={3}
          userData={{ source: 'OSM', walkable: true, elevationContract: 'shared-structure-registry' }}
        >
          <lineBasicMaterial color={isNight ? '#fbbf24' : '#b45309'} transparent opacity={0.85} />
        </lineSegments>
      )}

      {/* Generic highway=steps and bridge-tagged footways remain visible as
          source evidence, but never become a flat navigable ribbon. Their
          line is placed at the shared unverified datum and labelled as such. */}
      {unverifiedFootwayGeometry && (
        <lineSegments
          geometry={unverifiedFootwayGeometry}
          renderOrder={4}
          userData={{ source: 'OSM', walkable: false, elevation: 'unverified' }}
        >
          <lineBasicMaterial
            color={isNight ? '#fbbf24' : '#f97316'}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
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

      {/* Named tunnel/bridge footprints preserve source structures that are
          not drawable road or railway ways. Their plan position is source
          geometry; their vertical display datum is explicitly modelled. */}
      {sourceInfrastructureGeometry && (
        <lineSegments geometry={sourceInfrastructureGeometry} renderOrder={5}>
          <lineBasicMaterial color={isNight ? '#67e8f9' : '#0e7490'} transparent opacity={0.9} depthWrite={false} />
        </lineSegments>
      )}

      <group name="OSMSnapshotPointFeatures">
        <SourceMarkerInstances
          positions={sourceShopMarkerPositions}
          featureType="shop"
          color="#f59e0b"
          emissive="#b45309"
          emissiveIntensity={isNight ? 0.9 : 0.15}
        />
        <SourceShopFrontageInstances
          positions={sourceNamedShopFrontagePositions}
          isNight={isNight}
        />

        {snapshot.signals.map((signal) => (
          <group
            key={`signal-${signal.id}`}
            position={[signal.position[0], 0, signal.position[1]]}
          >
            {/* A source signal node is rendered as a compact physical post;
                the former 0.7m beacon sphere could fill the person camera. */}
            <mesh position={[0, 2.0, 0]}>
              <cylinderGeometry args={[0.08, 0.11, 4.0, 8]} />
              <meshStandardMaterial color="#334155" roughness={0.72} metalness={0.35} />
            </mesh>
            <mesh position={[0, 4.08, 0]}>
              <boxGeometry args={[0.42, 0.92, 0.32]} />
              <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.25} />
            </mesh>
            <mesh position={[0, 4.08, 0.19]}>
              <sphereGeometry args={[0.12, 10, 8]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={isNight ? 2.2 : 0.45}
              />
            </mesh>
          </group>
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

        <SourceTreeInstances positions={sourceTreePositions} isNight={isNight} />

        {snapshot.sourceAnchors.map((anchor) => (
          <mesh
            key={`source-anchor-${anchor.id}`}
            position={[anchor.position[0], 0.26, anchor.position[1]]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={5}
          >
            <ringGeometry args={[1.15, 1.45, 20]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.78} depthWrite={false} />
          </mesh>
        ))}
      </group>

      <group name="OSMSourceLandmarkLabels">
        {sourceShopLabelFeatures.map((shop) => (
          <Html
            key={`source-shop-label-${shop.id}`}
            position={[shop.position[0], 2.4, shop.position[1]]}
            center
            distanceFactor={sourceShopLabelDistanceFactor}
            zIndexRange={[18, 0]}
          >
            <div
              style={{
                background: 'rgba(69, 26, 3, 0.86)',
                border: '1px solid rgba(251, 191, 36, 0.65)',
                borderRadius: '4px',
                color: '#fef3c7',
                fontFamily: 'monospace',
                fontSize: '8px',
                letterSpacing: '0.18px',
                padding: '3px 5px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(2, 6, 23, 0.35)'
              }}
            >
              OSM SHOP · {(shop.name || shop.tags.name || 'SHOP').toUpperCase()} · {(shop.tags.shop || shop.tags.amenity || 'POI').toUpperCase()}
            </div>
          </Html>
        ))}

        {sourceRoadLabelFeatures.map((road) => (
          <Html
            key={`source-road-label-${road.id}`}
            position={[road.centroid[0], 1.8, road.centroid[1]]}
            center
            distanceFactor={Math.max(isFirstPersonLabelScale ? 4 : 42, labelDistanceFactor * 0.78)}
            zIndexRange={[17, 0]}
          >
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.78)',
                border: '1px solid rgba(125, 211, 252, 0.58)',
                borderRadius: '4px',
                color: '#bae6fd',
                fontFamily: 'monospace',
                fontSize: '7px',
                letterSpacing: '0.14px',
                padding: '2px 4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(2, 6, 23, 0.32)'
              }}
            >
              OSM ROAD · {(road.name || road.tags.name || 'UNNAMED').toUpperCase()} · {(road.tags.highway || 'ROAD').toUpperCase()}
            </div>
          </Html>
        ))}

        {['Oracle Tech Hub', 'Innovative Multiplex', 'Kalamandir', 'Spice Garden', 'Kadubeesanahalli Underpass', 'Kaadubeesanahalli'].map((label) => {
          const place = snapshot.places.find((feature) => feature.name?.toLowerCase() === label.toLowerCase())
            || snapshot.places.find((feature) => feature.name?.toLowerCase().includes(label.toLowerCase()));
          const point = [...snapshot.sourceAnchors, ...snapshot.shops, ...snapshot.busStops].find((feature) =>
            feature.name?.toLowerCase() === label.toLowerCase()
          );
          if (!place && !point) return null;
          const position = place?.centroid || point?.position;
          if (!position) return null;
          const labelLift = isLongRange ? 36 : 4;
          const heightLabel = place
            ? getHeightProvenanceLabel(place)
            : 'HEIGHT NOT IN SNAPSHOT';
          return (
            <Html
              key={label}
              position={[position[0], Math.max(4, place?.height || 4) + labelLift, position[1]]}
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
                fontSize: isLongRange ? '10px' : '9px',
                  letterSpacing: '0.35px',
                  padding: '4px 7px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 3px 12px rgba(2, 6, 23, 0.4)'
                }}
              >
                SOURCE · {label.toUpperCase()} · {heightLabel}
              </div>
            </Html>
          );
        })}

        {(snapshot.infrastructure || []).map((feature) => {
          const displayName = feature.tags.full_name || feature.name || feature.tags.name;
          if (!displayName) return null;
          const isTunnel = isSourceTunnel(feature);
          const structureElevation = resolveSourceStructureElevation(feature);
          const elevationLabel = isTunnel ? 'SOURCE · TUNNEL DATUM' : structureElevation.label;
          return (
            <Html
              key={`source-infrastructure-label-${feature.id}`}
              position={[feature.centroid[0], isTunnel ? 6.0 : (isLongRange ? 30.0 : 8.0), feature.centroid[1]]}
              center
              distanceFactor={Math.max(isFirstPersonLabelScale ? 5 : 55, labelDistanceFactor * 0.9)}
              zIndexRange={[22, 0]}
            >
              <div
                style={{
                  background: 'rgba(8, 47, 73, 0.9)',
                  border: '1px solid rgba(103, 232, 249, 0.72)',
                  borderRadius: '4px',
                  color: '#cffafe',
                  fontFamily: 'monospace',
                  fontSize: isLongRange ? '9px' : '8px',
                  letterSpacing: '0.16px',
                  padding: '3px 5px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 10px rgba(2, 6, 23, 0.45)'
                }}
              >
                OSM INFRA · {displayName.toUpperCase()} · {elevationLabel} · LAYER {feature.tags.layer || '—'}
              </div>
            </Html>
          );
        })}

        {sourceUnverifiedStructureLabelFeatures.map((feature) => {
          const structureElevation = resolveSourceStructureElevation(feature);
          const sourceName = feature.name || feature.tags.name;
          const structureTitle = structureElevation.kind === 'unverified-steps'
            ? 'OSM STEPS'
            : 'OSM BRIDGE';
          return (
            <Html
              key={`source-unverified-structure-label-${feature.id}`}
              position={[feature.centroid[0], structureElevation.lineY + 1.15, feature.centroid[1]]}
              center
              distanceFactor={Math.max(isFirstPersonLabelScale ? 8 : 45, labelDistanceFactor * 0.8)}
              zIndexRange={[23, 0]}
            >
              <div
                style={{
                  background: 'rgba(124, 45, 18, 0.9)',
                  border: '1px solid rgba(251, 146, 60, 0.85)',
                  borderRadius: '4px',
                  color: '#ffedd5',
                  fontFamily: 'monospace',
                  fontSize: '7px',
                  letterSpacing: '0.12px',
                  padding: '3px 5px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 10px rgba(2, 6, 23, 0.45)'
                }}
              >
                {structureTitle} · {sourceName ? `${sourceName.toUpperCase()} · ` : ''}{structureElevation.label}
              </div>
            </Html>
          );
        })}

        {noUTurnSource && (
          <Html
            position={noUTurnLabelPosition}
            center
            distanceFactor={Math.max(isFirstPersonLabelScale ? 12 : 45, labelDistanceFactor * 0.9)}
            zIndexRange={[26, 0]}
          >
            <div
              style={{
                background: 'rgba(69, 10, 10, 0.9)',
                border: '1px solid rgba(248, 113, 113, 0.9)',
                borderRadius: '4px',
                color: '#fee2e2',
                fontFamily: 'monospace',
                fontSize: '8px',
                letterSpacing: '0.18px',
                padding: '3px 5px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(2, 6, 23, 0.45)'
              }}
            >
              OSM RULE · NO U-TURN · {noUTurnSource.restriction.id.toUpperCase()}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

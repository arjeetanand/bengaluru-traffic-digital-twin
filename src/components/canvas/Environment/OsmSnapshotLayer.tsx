import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  MarathahalliDemoSnapshot,
  OSMPolylineFeature,
  VARTHUR_VIADUCT_DECK_TOP_Y,
  isSourceElevatedRoad,
  isNammaMetroSourceWay,
  isMarathahalliSkywalkDeck,
  isMarathahalliSkywalkStair,
  isNammaMetroMainlineWay,
  isNammaMetroPierSupport,
  isVarthurViaductFootway,
  isVarthurViaductWay
} from '../../../data/marathahalliDemo';
import { getOrrUnderpassElevation } from '../../../data/RealRoadData';
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

function isSourceUnderpass(feature: OSMPolylineFeature) {
  const name = feature.name || feature.tags.name || '';
  return /underpass/i.test(name) || feature.tags.tunnel === 'yes';
}

function isSourceTunnel(feature: OSMPolylineFeature) {
  return feature.tags.man_made === 'tunnel' || isSourceUnderpass(feature);
}

function getInfrastructureDisplayY(feature: OSMPolylineFeature) {
  // OSM layer=-1/1 describes relative ordering only. These display datums
  // align named structures with the authored scene without claiming a
  // survey-grade elevation from the source extract.
  return isSourceTunnel(feature) ? -6.2 : 5.2;
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

function selectBuildingFeatures(features: OSMPolylineFeature[], limit: number) {
  if (limit <= 0 || features.length === 0) return [];

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
  return selected;
}

function createBuildingGeometry(features: OSMPolylineFeature[], limit: number) {
  const selected = selectBuildingFeatures(features, limit);
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

function createBuildingOutlineGeometry(features: OSMPolylineFeature[], limit: number) {
  const positions: number[] = [];
  for (const feature of selectBuildingFeatures(features, limit)) {
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

  const roadGeometry = useMemo(
    () => (snapshot
      ? createPolylineGeometry(
        snapshot.roads.filter((feature) => !isSourceElevatedRoad(feature) && !isVarthurViaductWay(feature)),
        getRoadSurfaceY
      )
      : null),
    [snapshot]
  );
  const roadSurfaceGeometry = useMemo(
    () => (snapshot
      ? createRibbonGeometry(
        snapshot.roads.filter((feature) => !isSourceElevatedRoad(feature) && !isVarthurViaductWay(feature)),
        getRoadRibbonWidth,
        getRoadSurfaceY
      )
      : null),
    [snapshot]
  );
  const sourceBridgeFeatures = useMemo(
    () => snapshot?.roads.filter(isSourceElevatedRoad) || [],
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
        (feature) => isVarthurViaductWay(feature) ? VARTHUR_VIADUCT_DECK_TOP_Y + 0.02 : 5.2
      )
      : null),
    [snapshot, sourceBridgeFeatures]
  );
  const sourceBridgeGeometry = useMemo(
    () => (snapshot
      ? createPolylineGeometry(
        sourceBridgeFeatures,
        (feature) => isVarthurViaductWay(feature) ? VARTHUR_VIADUCT_DECK_TOP_Y + 0.12 : 5.34
      )
      : null),
    [snapshot, sourceBridgeFeatures]
  );
  const footwayGeometry = useMemo(
    () => (snapshot
      ? createPolylineGeometry(snapshot.footways.filter((feature) => !isMarathahalliSkywalkStair(feature)), (feature) => {
        if (isVarthurViaductFootway(feature)) {
          return VARTHUR_VIADUCT_DECK_TOP_Y + 0.16;
        }
        return isMarathahalliSkywalkDeck(feature) || feature.tags.bridge ? 7.55 : 0.12;
      })
      : null),
    [snapshot]
  );
  const footwaySurfaceGeometry = useMemo(
    () => (snapshot
      ? createRibbonGeometry(snapshot.footways.filter((feature) => !isMarathahalliSkywalkStair(feature)), 1.8, (feature) => {
        if (isVarthurViaductFootway(feature)) {
          return VARTHUR_VIADUCT_DECK_TOP_Y + 0.16;
        }
        return isMarathahalliSkywalkDeck(feature) || feature.tags.bridge ? 7.55 : 0.14;
      })
      : null),
    [snapshot]
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
  const buildingGeometry = useMemo(
    () => (snapshot && showBuildings ? createBuildingGeometry(snapshot.buildings, buildingLimit) : null),
    [buildingLimit, showBuildings, snapshot]
  );
  const buildingOutlineGeometry = useMemo(
    () => (snapshot && showBuildings
      ? createBuildingOutlineGeometry(
        snapshot.buildings,
        // The corridor overview needs every source footprint to read as a
        // continuous city fabric. Keep solid extrusions capped for frame time,
        // but use inexpensive line geometry for all 7,533 source outlines.
        buildingLimit >= 2500 ? Number.POSITIVE_INFINITY : buildingLimit
      )
      : null),
    [buildingLimit, showBuildings, snapshot]
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
  const sourceTreeRowPoints = useMemo(() => {
    if (!snapshot?.treeRows?.length) return [] as [number, number][];
    const points: [number, number][] = [];
    for (const row of snapshot.treeRows) {
      for (const point of row.geometry) {
        // A tree-row way is a source line, not an inventory of individual
        // trees. Place deterministic display markers at separated vertices
        // without implying a surveyed count between those vertices.
        if (points.some(([x, z]) => Math.hypot(point[0] - x, point[1] - z) < 4)) continue;
        points.push(point);
      }
    }
    return points;
  }, [snapshot]);
  const sourceShopLabelFeatures = useMemo(() => {
    // Keep the wide corridor survey readable: individual shop anchors remain
    // available in the store drawer and as orange POI points, while only the
    // four fixed source landmarks are labelled at long-range scale.
    if (!snapshot || labelDistanceFactor > 1000) return [];
    const landmarkShopPattern = /spice garden|pizza hut|village hypermart|holly flames|sweet chariot|kalamandir|nalli|tanishq|kalyan|brand factory/i;
    return snapshot.shops.filter((shop) => landmarkShopPattern.test(shop.name || shop.tags.name || '')).slice(0, 24);
  }, [labelDistanceFactor, snapshot]);
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
    sourceBridgeGeometry?.dispose();
    sourceBridgeSurfaceGeometry?.dispose();
    footwayGeometry?.dispose();
    footwaySurfaceGeometry?.dispose();
    railwayGeometry?.dispose();
    sourceInfrastructureGeometry?.dispose();
    buildingGeometry?.dispose();
    buildingOutlineGeometry?.dispose();
    namedAreaGeometry?.dispose();
    noUTurnGeometry?.dispose();
  }, [buildingGeometry, buildingOutlineGeometry, footwayGeometry, footwaySurfaceGeometry, namedAreaGeometry, noUTurnGeometry, railwayGeometry, roadGeometry, roadSurfaceGeometry, sourceBridgeGeometry, sourceBridgeSurfaceGeometry, sourceInfrastructureGeometry]);

  if (!snapshot) return null;

  return (
    <group name="MarathahalliOSMSnapshotLayer">
      {buildingGeometry && (
        <mesh geometry={buildingGeometry} position={[0, 0, 0]}>
          <meshStandardMaterial
            color={isNight ? '#243b53' : (isLongRange ? '#9ab0be' : '#71879a')}
            emissive={isNight ? '#08111c' : (isLongRange ? '#294454' : '#000000')}
            emissiveIntensity={isNight ? 0.16 : (isLongRange ? 0.22 : 0)}
            roughness={0.92}
            metalness={0.05}
            transparent
            opacity={buildingOpacity}
          />
        </mesh>
      )}

      {buildingOutlineGeometry && (
        <lineSegments geometry={buildingOutlineGeometry} renderOrder={1}>
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

      {/* The source no_u_turn relation is evidence, not a legal movement
          overlay. It stays red and source-labelled so the modelled amber
          scenario connector cannot be mistaken for a verified real-world
          turn permission. */}
      {noUTurnGeometry && (
        <mesh geometry={noUTurnGeometry} renderOrder={5}>
          <meshBasicMaterial color="#ef4444" transparent opacity={0.62} depthWrite={false} />
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

      {/* Named tunnel/bridge footprints preserve source structures that are
          not drawable road or railway ways. Their plan position is source
          geometry; their vertical display datum is explicitly modelled. */}
      {sourceInfrastructureGeometry && (
        <lineSegments geometry={sourceInfrastructureGeometry} renderOrder={5}>
          <lineBasicMaterial color={isNight ? '#67e8f9' : '#0e7490'} transparent opacity={0.9} depthWrite={false} />
        </lineSegments>
      )}

      <group name="OSMSnapshotPointFeatures">
        {sourceShopFeatures.map((shop) => (
          <mesh key={`shop-${shop.id}`} position={[shop.position[0], 0.55, shop.position[1]]}>
            <cylinderGeometry args={[0.45, 0.45, 1.1, 8]} />
            <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={isNight ? 0.9 : 0.15} />
          </mesh>
        ))}

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

        {sourceTreeRowPoints.map(([x, z], index) => (
          <group key={`tree-row-${index}`} position={[x, 0, z]} userData={{ source: 'OSM', natural: 'tree_row' }}>
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
            distanceFactor={Math.max(45, labelDistanceFactor * 0.82)}
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
              OSM · {(shop.name || shop.tags.name || 'SHOP').toUpperCase()}
            </div>
          </Html>
        ))}

        {sourceRoadLabelFeatures.map((road) => (
          <Html
            key={`source-road-label-${road.id}`}
            position={[road.centroid[0], 1.8, road.centroid[1]]}
            center
            distanceFactor={Math.max(42, labelDistanceFactor * 0.78)}
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
                SOURCE · {label.toUpperCase()}
              </div>
            </Html>
          );
        })}

        {(snapshot.infrastructure || []).map((feature) => {
          const displayName = feature.tags.full_name || feature.name || feature.tags.name;
          if (!displayName) return null;
          const isTunnel = isSourceTunnel(feature);
          return (
            <Html
              key={`source-infrastructure-label-${feature.id}`}
              position={[feature.centroid[0], isTunnel ? 6.0 : (isLongRange ? 30.0 : 8.0), feature.centroid[1]]}
              center
              distanceFactor={Math.max(55, labelDistanceFactor * 0.9)}
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
                OSM INFRA · {displayName.toUpperCase()} · LAYER {feature.tags.layer || '—'}
              </div>
            </Html>
          );
        })}

        {noUTurnSource && (
          <Html
            position={noUTurnLabelPosition}
            center
            distanceFactor={Math.max(45, labelDistanceFactor * 0.9)}
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

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  createOrrOffsetRibbonGeometry,
  getOrrOffsetPointAtZ,
  getOrrRoadFrameAtZ
} from '../../../data/RealRoadData';
import {
  MARATHAHALLI_SKYWALK_DECK_POINTS,
  MARATHAHALLI_SKYWALK_DECK_TOP_Y,
  MARATHAHALLI_SKYWALK_GROUND_TOP_Y,
  MARATHAHALLI_SKYWALK_STAIR_POINTS,
  MARATHAHALLI_SKYWALK_STAIR_STEP_COUNTS,
  VARTHUR_VIADUCT_DECK_TOP_Y
} from '../../../data/marathahalliDemo';
import {
  MODELLED_MISSING_WALK_LINKS,
  SOURCE_ELEVATED_WALK_ROUTES,
  SOURCE_GROUND_WALK_ROUTES,
  SourceWalkRoute
} from '../../../data/marathahalliPedestrianData';

interface FootpathsProps {
  auditMode: boolean;
  isNight?: boolean;
  cameraMode?: 'walk' | 'overview';
  cameraPreset?: string;
  // Source-focus views should show the compiled OSM footways as the physical
  // surface. The procedural catalog remains useful for the default demo and
  // audit storytelling, but rendering both layers in the same focus view can
  // create double-width slabs that look like a false sidewalk.
  showModeledNetwork?: boolean;
}

export type FootpathStatus = 'paved' | 'missing' | 'encroached' | 'metro_blocked';

interface FootpathSegment {
  id: string;
  name: string;
  axis: 'X' | 'Z'; // X = East-West (HAL <-> Spice Garden), Z = North-South (Multiplex <-> Kalamandir)
  start: number;
  end: number;
  offset: number; // perpendicular coordinate (x or z)
  width: number;
  height: number;
  status: FootpathStatus;
  elevation?: number; // base Y elevation for explicitly elevated paths
  connectedToGrade?: boolean; // source-backed vertical join; false means no mapped ramp
  sourcePath?: [number, number][]; // source-mapped [x,z] path used by the audit overlay
  sourceWayIds?: string[];
  description: string;
}

interface PathRibbonEdge {
  left: [number, number, number];
  right: [number, number, number];
}

interface PathSample {
  point: [number, number];
  tangent: [number, number];
}

interface SteppedPathEdge {
  left: [number, number, number];
  right: [number, number, number];
}

// A short overlap at a mapped route endpoint hides sub-decimetre seams between
// adjacent source-derived ribbons. It is deliberately much smaller than a
// footway width: it closes a rendering seam without creating a new connection
// between unrelated OSM ways.
const PATH_ENDPOINT_SEAM_OVERLAP = 0.18;

function createPathRibbonEdges(
  points: readonly [number, number][],
  width: number,
  y: number
): PathRibbonEdge[] {
  // Build one continuous strip from the source vertices. Creating an isolated
  // quad per segment leaves visible pinholes at every mapped bend, which reads
  // as a broken footpath at eye level. A clamped miter keeps tight OSM turns
  // connected without letting an acute corner spike into the carriageway.
  const cleanPoints = points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || Math.hypot(point[0] - previous[0], point[1] - previous[1]) >= 0.05;
  });
  if (cleanPoints.length === 0) return [];

  const halfWidth = Math.max(0.05, width / 2);
  const edges = cleanPoints.map((point, index) => {
    const previous = cleanPoints[Math.max(0, index - 1)];
    const next = cleanPoints[Math.min(cleanPoints.length - 1, index + 1)];
    const previousDx = point[0] - previous[0];
    const previousDz = point[1] - previous[1];
    const nextDx = next[0] - point[0];
    const nextDz = next[1] - point[1];
    const previousLength = Math.hypot(previousDx, previousDz);
    const nextLength = Math.hypot(nextDx, nextDz);
    const tangentX = nextLength >= 0.05
      ? nextDx / nextLength
      : previousLength >= 0.05
        ? previousDx / previousLength
        : 1;
    const tangentZ = nextLength >= 0.05
      ? nextDz / nextLength
      : previousLength >= 0.05
        ? previousDz / previousLength
        : 0;
    const currentNormalX = -tangentZ;
    const currentNormalZ = tangentX;
    let normalX = currentNormalX;
    let normalZ = currentNormalZ;
    let miterLength = halfWidth;

    if (previousLength >= 0.05 && nextLength >= 0.05) {
      const previousNormalX = -previousDz / previousLength;
      const previousNormalZ = previousDx / previousLength;
      const combinedLength = Math.hypot(previousNormalX + normalX, previousNormalZ + normalZ);
      if (combinedLength >= 0.001) {
        normalX = (previousNormalX + normalX) / combinedLength;
        normalZ = (previousNormalZ + normalZ) / combinedLength;
        const denominator = normalX * currentNormalX + normalZ * currentNormalZ;
        // A reversing or nearly reversing OSM vertex should use a bevel-like
        // corner. A negative miter length flips the ribbon across the path and
        // can put the apparent sidewalk inside the carriageway.
        if (denominator >= 0.2) {
          miterLength = Math.min(halfWidth * 2.6, halfWidth / denominator);
        } else {
          normalX = currentNormalX;
          normalZ = currentNormalZ;
        }
      }
    }

    return {
      left: [point[0] + normalX * miterLength, y, point[1] + normalZ * miterLength] as [number, number, number],
      right: [point[0] - normalX * miterLength, y, point[1] - normalZ * miterLength] as [number, number, number]
    };
  });

  if (edges.length >= 2) {
    const startDx = cleanPoints[1][0] - cleanPoints[0][0];
    const startDz = cleanPoints[1][1] - cleanPoints[0][1];
    const startLength = Math.hypot(startDx, startDz);
    const endDx = cleanPoints[cleanPoints.length - 1][0] - cleanPoints[cleanPoints.length - 2][0];
    const endDz = cleanPoints[cleanPoints.length - 1][1] - cleanPoints[cleanPoints.length - 2][1];
    const endLength = Math.hypot(endDx, endDz);

    if (startLength >= 0.05) {
      const startExtendX = (startDx / startLength) * PATH_ENDPOINT_SEAM_OVERLAP;
      const startExtendZ = (startDz / startLength) * PATH_ENDPOINT_SEAM_OVERLAP;
      edges[0].left[0] -= startExtendX;
      edges[0].left[2] -= startExtendZ;
      edges[0].right[0] -= startExtendX;
      edges[0].right[2] -= startExtendZ;
    }
    if (endLength >= 0.05) {
      const endExtendX = (endDx / endLength) * PATH_ENDPOINT_SEAM_OVERLAP;
      const endExtendZ = (endDz / endLength) * PATH_ENDPOINT_SEAM_OVERLAP;
      const endIndex = edges.length - 1;
      edges[endIndex].left[0] += endExtendX;
      edges[endIndex].left[2] += endExtendZ;
      edges[endIndex].right[0] += endExtendX;
      edges[endIndex].right[2] += endExtendZ;
    }
  }

  return edges;
}

function createPathRibbonGeometry(points: readonly [number, number][], width: number, y: number) {
  const edges = createPathRibbonEdges(points, width, y);

  const positions: number[] = [];
  for (let index = 1; index < edges.length; index += 1) {
    const previous = edges[index - 1];
    const current = edges[index];
    positions.push(
      previous.left[0], previous.left[1], previous.left[2],
      current.left[0], current.left[1], current.left[2],
      previous.right[0], previous.right[1], previous.right[2],
      current.left[0], current.left[1], current.left[2],
      current.right[0], current.right[1], current.right[2],
      previous.right[0], previous.right[1], previous.right[2]
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createPathEdgeLinePoints(
  points: readonly [number, number][],
  width: number,
  y: number
) {
  const edges = createPathRibbonEdges(points, width, y);
  return {
    left: edges.map(({ left }) => left),
    right: edges.map(({ right }) => right)
  };
}

function samplePathAtSpacing(
  points: readonly [number, number][],
  spacing: number
): PathSample[] {
  const cleanPoints = points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || Math.hypot(point[0] - previous[0], point[1] - previous[1]) >= 0.05;
  });
  if (cleanPoints.length < 2) return [];

  const cumulativeLengths = [0];
  for (let index = 1; index < cleanPoints.length; index += 1) {
    cumulativeLengths.push(
      cumulativeLengths[index - 1] +
      Math.hypot(
        cleanPoints[index][0] - cleanPoints[index - 1][0],
        cleanPoints[index][1] - cleanPoints[index - 1][1]
      )
    );
  }

  const totalLength = cumulativeLengths[cumulativeLengths.length - 1];
  const samples: PathSample[] = [];
  const sampleSpacing = Math.max(1.5, spacing);
  for (let distance = 0; distance <= totalLength + 0.001; distance += sampleSpacing) {
    let segmentIndex = 1;
    while (segmentIndex < cumulativeLengths.length - 1 && cumulativeLengths[segmentIndex] < distance) {
      segmentIndex += 1;
    }

    const start = cleanPoints[segmentIndex - 1];
    const end = cleanPoints[segmentIndex];
    const segmentLength = cumulativeLengths[segmentIndex] - cumulativeLengths[segmentIndex - 1];
    const progress = segmentLength >= 0.05
      ? Math.max(0, Math.min(1, (distance - cumulativeLengths[segmentIndex - 1]) / segmentLength))
      : 0;
    const tangent: [number, number] = segmentLength >= 0.05
      ? [(end[0] - start[0]) / segmentLength, (end[1] - start[1]) / segmentLength]
      : [1, 0];
    samples.push({
      point: [
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress
      ],
      tangent
    });
  }

  return samples;
}

function createTactileCueGeometry(
  points: readonly [number, number][],
  width: number,
  y: number
) {
  const positions: number[] = [];
  const cueHalfLength = Math.min(0.62, Math.max(0.3, width * 0.34));
  for (const { point, tangent } of samplePathAtSpacing(points, 4.5)) {
    const normalX = -tangent[1];
    const normalZ = tangent[0];
    positions.push(
      point[0] - normalX * cueHalfLength, y, point[1] - normalZ * cueHalfLength,
      point[0] + normalX * cueHalfLength, y, point[1] + normalZ * cueHalfLength
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function formatFootpathStatus(status: FootpathStatus) {
  return status === 'metro_blocked'
    ? 'METRO BLOCKED'
    : status.toUpperCase();
}

function getSourceFootwaySurfaceY(route: SourceWalkRoute) {
  // The source navigation registry owns explicit elevated datums. Ground
  // ribbons sit a few centimetres above the shared ground top so the cyan
  // evidence line is readable without changing the walkable elevation.
  return route.elevation === 0
    ? MARATHAHALLI_SKYWALK_GROUND_TOP_Y + 0.04
    : route.elevation;
}

const SourceFootwayBoundaryGuides: React.FC<{
  points: readonly [number, number][];
  width: number;
  y: number;
  cameraMode: 'walk' | 'overview';
  auditMode: boolean;
}> = ({ points, width, y, cameraMode, auditMode }) => {
  const edgePoints = useMemo(
    () => createPathEdgeLinePoints(points, width, y + 0.08),
    [points, width, y]
  );
  const tactileCueGeometry = useMemo(
    () => createTactileCueGeometry(points, width, y + 0.11),
    [points, width, y]
  );

  useEffect(() => () => tactileCueGeometry.dispose(), [tactileCueGeometry]);

  if (edgePoints.left.length < 2) return null;

  const guideOpacity = auditMode ? 0.84 : (cameraMode === 'walk' ? 0.72 : 0.5);
  const guideWidth = cameraMode === 'walk' ? 1.2 : 1.35;
  const cueOpacity = auditMode ? 0.9 : (cameraMode === 'walk' ? 0.78 : 0.46);

  return (
    <>
      {/* These are display cues, not additional pavement or a surveyed curb.
          Keeping both edges on the exact mapped width makes the road stand-off
          legible in person view without widening an uncertain footway. */}
      {[edgePoints.left, edgePoints.right].map((edge, index) => (
        <group key={index}>
          <Line
            points={edge}
            color="#083344"
            lineWidth={guideWidth + 2.2}
            transparent
            opacity={guideOpacity * 0.4}
          />
          <Line
            points={edge}
            color="#a5f3fc"
            lineWidth={guideWidth}
            transparent
            opacity={guideOpacity}
          />
          <Line
            points={edge}
            color="#f8fafc"
            lineWidth={Math.max(0.8, guideWidth - 0.2)}
            dashed
            dashSize={2.8}
            gapSize={1.5}
            transparent
            opacity={cueOpacity * 0.82}
          />
        </group>
      ))}
      {/* Sparse cross-bars are a wayfinding/tactile display cue. They are
          deliberately generated from the mapped centerline and do not claim
          that tactile paving was present in the OSM tags. */}
      {tactileCueGeometry.getAttribute('position')?.count ? (
        <lineSegments
          geometry={tactileCueGeometry}
          renderOrder={7}
          userData={{ source: 'MODELLED_DISPLAY_CUE', cue: 'tactile', fieldVerify: true }}
        >
          <lineBasicMaterial
            color="#fde047"
            transparent
            opacity={cueOpacity}
            depthWrite={false}
          />
        </lineSegments>
      ) : null}
    </>
  );
};

function getSourceWalkProvenanceLabel(route: Pick<SourceWalkRoute, 'elevation' | 'connectedToGrade' | 'truthLevel'>) {
  if (route.truthLevel === 'MODELLED') return 'MODELLED · FIELD VERIFY';
  if (route.elevation > 0 && route.connectedToGrade === false) {
    return 'SOURCE · OSM FOOTWAY · ELEVATED · NO MAPPED GRADE JOIN';
  }
  if (route.elevation > 0) return 'SOURCE · OSM FOOTWAY · VERIFIED ELEVATED SURFACE';
  return 'SOURCE · OSM FOOTWAY';
}

function createVerifiedSkywalkStairPoints(
  ground: readonly [number, number],
  deck: readonly [number, number],
  stepCount: number
): [number, number, number][] {
  // Keep the cue and the animated walkers on the same stepped profile as the
  // rendered source-backed stair flight. A straight 3D line here would read
  // as an invented ramp and would lose the source step-count evidence.
  const count = Math.max(1, stepCount);
  const dx = ground[0] - deck[0];
  const dz = ground[1] - deck[1];
  const pointAtProgress = (progress: number, y: number): [number, number, number] => [
    deck[0] + dx * progress,
    y,
    deck[1] + dz * progress
  ];
  const treadTop = (index: number) => MARATHAHALLI_SKYWALK_DECK_TOP_Y +
    (MARATHAHALLI_SKYWALK_GROUND_TOP_Y - MARATHAHALLI_SKYWALK_DECK_TOP_Y) *
    (count <= 1 ? 1 : index / (count - 1));
  const route: [number, number, number][] = [
    [ground[0], MARATHAHALLI_SKYWALK_GROUND_TOP_Y, ground[1]]
  ];

  for (let index = count - 1; index >= 0; index -= 1) {
    const nearGroundProgress = (index + 1) / count;
    const nearDeckProgress = index / count;
    const y = treadTop(index);
    route.push(pointAtProgress(nearGroundProgress, y));
    route.push(pointAtProgress(nearDeckProgress, y));
    if (index > 0) route.push(pointAtProgress(nearDeckProgress, treadTop(index - 1)));
  }

  route.push([deck[0], MARATHAHALLI_SKYWALK_DECK_TOP_Y, deck[1]]);
  return route;
}

function getSteppedPathTangent(
  points: readonly [number, number, number][],
  index: number
): [number, number] {
  const point = points[index];
  for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
    const dx = points[nextIndex][0] - point[0];
    const dz = points[nextIndex][2] - point[2];
    const length = Math.hypot(dx, dz);
    if (length >= 0.05) return [dx / length, dz / length];
  }
  for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
    const dx = point[0] - points[previousIndex][0];
    const dz = point[2] - points[previousIndex][2];
    const length = Math.hypot(dx, dz);
    if (length >= 0.05) return [dx / length, dz / length];
  }
  return [1, 0];
}

function createSteppedPathEdges(
  points: readonly [number, number, number][],
  width: number
): SteppedPathEdge[] {
  const halfWidth = Math.max(0.05, width / 2);
  return points.map((point, index) => {
    const [tangentX, tangentZ] = getSteppedPathTangent(points, index);
    const normalX = -tangentZ;
    const normalZ = tangentX;
    return {
      left: [point[0] + normalX * halfWidth, point[1] + 0.08, point[2] + normalZ * halfWidth],
      right: [point[0] - normalX * halfWidth, point[1] + 0.08, point[2] - normalZ * halfWidth]
    };
  });
}

function createSteppedTactileCueGeometry(
  points: readonly [number, number, number][],
  width: number
) {
  const positions: number[] = [];
  const cueHalfLength = Math.min(0.62, Math.max(0.3, width * 0.34));
  const stride = Math.max(1, Math.floor(points.length / 10));
  let previousCuePoint: [number, number] | null = null;

  points.forEach((point, index) => {
    if (index % stride !== 0) return;
    if (previousCuePoint && Math.hypot(point[0] - previousCuePoint[0], point[2] - previousCuePoint[1]) < 0.15) return;
    previousCuePoint = [point[0], point[2]];
    const [tangentX, tangentZ] = getSteppedPathTangent(points, index);
    const normalX = -tangentZ;
    const normalZ = tangentX;
    const y = point[1] + 0.13;
    positions.push(
      point[0] - normalX * cueHalfLength, y, point[2] - normalZ * cueHalfLength,
      point[0] + normalX * cueHalfLength, y, point[2] + normalZ * cueHalfLength
    );
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

const SourceFootwayCoverageRibbon: React.FC<{
  route: SourceWalkRoute;
  auditMode: boolean;
  cameraMode: 'walk' | 'overview';
  showLabel: boolean;
}> = ({ route, auditMode, cameraMode, showLabel }) => {
  const sourceSurfaceY = getSourceFootwaySurfaceY(route);
  const geometry = useMemo(
    () => createPathRibbonGeometry(route.points, route.width, sourceSurfaceY),
    [route.points, route.width, sourceSurfaceY]
  );
  const sourceLinePoints = useMemo(
    () => route.points.map(([x, z]) => [x, sourceSurfaceY + 0.1, z] as [number, number, number]),
    [route.points, sourceSurfaceY]
  );
  const labelPoint = route.points[Math.floor(route.points.length / 2)];

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group name={`SourceFootwayCoverage:${route.sourceWayIds.join('|')}`}>
      <mesh geometry={geometry} renderOrder={5}>
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={cameraMode === 'walk' ? 0.1 : (auditMode ? 0.16 : 0.08)}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <SourceFootwayBoundaryGuides
        points={route.points}
        width={route.width}
        y={sourceSurfaceY}
        cameraMode={cameraMode}
        auditMode={auditMode}
      />
      <Line
        points={sourceLinePoints}
        color="#67e8f9"
        lineWidth={cameraMode === 'walk' ? 1.5 : 1.8}
        transparent
        opacity={cameraMode === 'walk' ? 0.56 : (auditMode ? 0.78 : 0.42)}
      />
      {showLabel && (
        <Html
          position={[labelPoint[0], sourceSurfaceY + 1.1, labelPoint[1]]}
          center
          distanceFactor={cameraMode === 'walk' ? 20 : 105}
          style={{ pointerEvents: 'none' }}
        >
          <div className="walk-link-world-label">
            <span className="walk-link-world-label-dot" aria-hidden="true" style={{ background: '#22d3ee' }} />
            <span>{route.name || 'OSM source footway coverage'}</span>
            <strong>{getSourceWalkProvenanceLabel(route)} · {route.sourceWayIds.join(', ')}</strong>
          </div>
        </Html>
      )}
    </group>
  );
};

const SourceFootwayCoverage: React.FC<{
  routes: readonly SourceWalkRoute[];
  auditMode: boolean;
  cameraMode: 'walk' | 'overview';
}> = ({ routes, auditMode, cameraMode }) => {
  // The OSM layer supplies the physical source surface. This supplemental
  // ribbon is the person-mode locator: it adds exact-width edge/tactile cues
  // without turning a sparse source route into an inferred connector. In bird
  // view it remains limited to audit mode so the normal overview stays clean.
  if (cameraMode !== 'walk' && !auditMode) return null;

  return (
    <group name="SourceFootwayCoverage">
      {routes.map((route) => (
        <SourceFootwayCoverageRibbon
          key={route.sourceWayIds.join('|')}
          route={route}
          auditMode={auditMode}
          cameraMode={cameraMode}
          showLabel={cameraMode === 'walk' || auditMode}
        />
      ))}
    </group>
  );
};

const SteppedSourcePathCue: React.FC<{
  points: readonly [number, number, number][];
  sourceWayId: string;
  name: string;
  cameraMode: 'walk' | 'overview';
  auditMode: boolean;
}> = ({ points, sourceWayId, name, cameraMode, auditMode }) => {
  const edges = useMemo(() => createSteppedPathEdges(points, 3), [points]);
  const tactileCueGeometry = useMemo(
    () => createSteppedTactileCueGeometry(points, 3),
    [points]
  );

  useEffect(() => () => tactileCueGeometry.dispose(), [tactileCueGeometry]);

  if (edges.length < 2) return null;

  const cueOpacity = auditMode ? 0.92 : 0.82;
  const edgePoints = edges.map(({ left }) => left);
  const oppositeEdgePoints = edges.map(({ right }) => right);
  const labelPoint = points[Math.floor(points.length / 2)];

  return (
    <group
      name={`SourceSkywalkStairCue:${sourceWayId}`}
      userData={{ source: 'OSM', sourceWayId, walkable: true, elevationContract: 'verified-skywalk-stair-profile' }}
    >
      {[edgePoints, oppositeEdgePoints].map((edge, index) => (
        <group key={index}>
          <Line
            points={edge}
            color="#0f172a"
            lineWidth={4.2}
            transparent
            opacity={cueOpacity * 0.52}
          />
          <Line
            points={edge}
            color="#a5f3fc"
            lineWidth={1.35}
            transparent
            opacity={cueOpacity}
          />
          <Line
            points={edge}
            color="#f8fafc"
            lineWidth={1}
            dashed
            dashSize={1.1}
            gapSize={0.9}
            transparent
            opacity={cueOpacity * 0.86}
          />
        </group>
      ))}
      {tactileCueGeometry.getAttribute('position')?.count ? (
        <lineSegments
          geometry={tactileCueGeometry}
          renderOrder={7}
          userData={{ source: 'MODELLED_DISPLAY_CUE', cue: 'tactile', fieldVerify: true, sourceWayId }}
        >
          <lineBasicMaterial color="#fde047" transparent opacity={cueOpacity} depthWrite={false} />
        </lineSegments>
      ) : null}
      <Line
        points={points}
        color="#fde047"
        lineWidth={cameraMode === 'walk' ? 1.25 : 1}
        dashed
        dashSize={0.85}
        gapSize={0.85}
        transparent
        opacity={cueOpacity * 0.86}
      />
      {(cameraMode === 'walk' || auditMode) && (
        <Html
          position={[labelPoint[0], labelPoint[1] + 1.05, labelPoint[2]]}
          center
          distanceFactor={cameraMode === 'walk' ? 20 : 105}
          style={{ pointerEvents: 'none' }}
        >
          <div className="walk-link-world-label">
            <span className="walk-link-world-label-dot" aria-hidden="true" style={{ background: '#22d3ee' }} />
            <span>Marathahalli Skywalk {name} access</span>
            <strong>SOURCE · OSM STEPS · {sourceWayId} · VERIFIED PROFILE</strong>
          </div>
        </Html>
      )}
    </group>
  );
};

const VerifiedSkywalkAccessCues: React.FC<{
  auditMode: boolean;
  cameraMode: 'walk' | 'overview';
}> = ({ auditMode, cameraMode }) => {
  const stairRoutes = useMemo(() => [
    {
      sourceWayId: 'way/323729569',
      name: 'south',
      points: createVerifiedSkywalkStairPoints(
        MARATHAHALLI_SKYWALK_STAIR_POINTS[0].ground,
        MARATHAHALLI_SKYWALK_STAIR_POINTS[0].deck,
        MARATHAHALLI_SKYWALK_STAIR_STEP_COUNTS[0]
      )
    },
    {
      sourceWayId: 'way/323729566',
      name: 'north',
      points: createVerifiedSkywalkStairPoints(
        MARATHAHALLI_SKYWALK_STAIR_POINTS[1].ground,
        MARATHAHALLI_SKYWALK_STAIR_POINTS[1].deck,
        MARATHAHALLI_SKYWALK_STAIR_STEP_COUNTS[1]
      ).reverse()
    }
  ], []);

  if (!auditMode && cameraMode !== 'walk') return null;

  return (
    <group name="VerifiedSkywalkAccessCues">
      {stairRoutes.map((route) => (
        <SteppedSourcePathCue
          key={route.sourceWayId}
          points={route.points}
          sourceWayId={route.sourceWayId}
          name={route.name}
          cameraMode={cameraMode}
          auditMode={auditMode}
        />
      ))}
    </group>
  );
};

const ModeledWalkLink: React.FC<{
  route: SourceWalkRoute;
  auditMode: boolean;
  cameraMode: 'walk' | 'overview';
  showLabel: boolean;
}> = ({ route, auditMode, cameraMode, showLabel }) => {
  const ribbonGeometry = useMemo(
    () => createPathRibbonGeometry(route.points as [number, number][], route.width, 0.22),
    [route]
  );
  const linePoints = useMemo(
    () => route.points.map(([x, z]) => [x, 0.42, z] as [number, number, number]),
    [route]
  );
  const labelPoint = route.points[Math.floor(route.points.length / 2)];
  const endpointPoints = [route.points[0], route.points[route.points.length - 1]];

  useEffect(() => () => ribbonGeometry.dispose(), [ribbonGeometry]);

  return (
    <group
      name={`ModeledWalkLink:${route.sourceWayIds[0]}`}
      userData={{
        source: 'MODELLED',
        fieldVerify: true,
        evidenceWayIds: route.evidenceWayIds || []
      }}
    >
      <mesh geometry={ribbonGeometry} renderOrder={4}>
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={auditMode ? 0.46 : 0.18}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line
        points={linePoints}
        color="#fbbf24"
        lineWidth={auditMode ? 2.6 : 1.4}
        dashed
        dashSize={auditMode ? 5 : 7}
        gapSize={auditMode ? 3 : 5}
        transparent
        opacity={auditMode ? 0.96 : 0.52}
      />
      {endpointPoints.map(([x, z], index) => (
        <mesh key={index} position={[x, 0.52, z]} renderOrder={5}>
          <sphereGeometry args={[1.15, 12, 8]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={auditMode ? 0.9 : 0.58} />
        </mesh>
      ))}
      {showLabel && (
        <Html
          position={[labelPoint[0], 1.35, labelPoint[1]]}
          center
          distanceFactor={cameraMode === 'walk' ? 22 : 180}
          style={{ pointerEvents: 'none' }}
        >
          <div className="walk-link-world-label">
            <span className="walk-link-world-label-dot" aria-hidden="true" />
            <span>{route.name || 'Modelled roadside walking link'}</span>
            <strong>
              {getSourceWalkProvenanceLabel(route)}
              {route.evidenceWayIds?.length ? ` · ROAD EVIDENCE · ${route.evidenceWayIds.join(', ')}` : ''}
            </strong>
          </div>
        </Html>
      )}
    </group>
  );
};

const ModeledWalkLinks: React.FC<{
  auditMode: boolean;
  cameraMode: 'walk' | 'overview';
  cameraPreset: string;
  showModeledNetwork: boolean;
}> = ({ auditMode, cameraMode, cameraPreset, showModeledNetwork }) => {
  const showLabel = auditMode || cameraMode === 'walk' ||
    ['corridor', 'oraclehub', 'kadubeesanahalli'].includes(cameraPreset);

  // Source-focus views suppress the broad procedural catalog, but audit mode
  // must still show the two explicitly modelled links so a source graph gap is
  // visible as a field-verification scenario rather than silently disappearing.
  if (!showModeledNetwork && !auditMode) return null;

  return (
    <group name="ModeledMissingFootpathLinks">
      {MODELLED_MISSING_WALK_LINKS.map((route) => (
        <ModeledWalkLink
          key={route.sourceWayIds[0]}
          route={route}
          auditMode={auditMode}
          cameraMode={cameraMode}
          showLabel={showLabel}
        />
      ))}
    </group>
  );
};

export const Footpaths: React.FC<FootpathsProps> = ({
  auditMode,
  isNight = false,
  cameraMode = 'overview',
  cameraPreset = 'overview',
  showModeledNetwork = true
}) => {
  // ── Procedural Real-World Footpath Segments along the Two Corridors ──
  const segments: FootpathSegment[] = useMemo(() => [
    // ══════════════════════════════════════════════════════════════════════════
    // CORRIDOR 1: OUTER RING ROAD (Multiplex to Kalamandir, Z-axis)
    // ══════════════════════════════════════════════════════════════════════════
    // ── West Footpath (Southbound ORR Service Road edge, x ≈ -23.5) ──
    {
      id: 'orr-w-multiplex',
      name: 'Innovative Multiplex Entrance Frontage',
      axis: 'Z',
      start: -220,
      end: -160,
      offset: -23.5,
      width: 2.8,
      height: 0.25,
      status: 'paved',
      description: 'Paved interlocking pavers with curb stones near cinema entrance gates'
    },
    {
      id: 'orr-w-multiplex-busbay',
      name: 'Multiplex Bus Bay & Auto Stand',
      axis: 'Z',
      start: -160,
      end: -110,
      offset: -23.5,
      width: 2.4,
      height: 0.25,
      status: 'encroached',
      description: 'Encroached by waiting auto-rickshaws, bike parking, and street vendors'
    },
    {
      id: 'orr-w-south-ramp',
      name: 'ORR South Underpass Approach Shoulder',
      axis: 'Z',
      start: -110,
      end: -50,
      offset: -23.0,
      width: 2.0,
      height: 0.05,
      status: 'missing',
      description: 'Missing/unpaved dirt shoulder beside retaining wall, raw gravel edge'
    },
    {
      id: 'orr-w-junction-sw',
      name: 'South-West Junction Corner (Tanishq/Reebok)',
      axis: 'Z',
      start: -50,
      end: -21,
      offset: -23.5,
      width: 3.2,
      height: 0.25,
      status: 'paved',
      description: 'Wide concrete sidewalk linking to pedestrian zebra crossing'
    },
    {
      id: 'orr-w-junction-nw',
      name: 'North-West Junction Corner (Krishna Summit)',
      axis: 'Z',
      start: 21,
      end: 55,
      offset: -23.5,
      width: 3.2,
      height: 0.25,
      status: 'paved',
      description: 'Paved sidewalk in front of Krishna Summit Tech Center'
    },
    {
      id: 'orr-w-metro-barrier',
      name: 'Northbound Service Road Metro Construction Zone',
      axis: 'Z',
      start: 55,
      end: 115,
      offset: -22.5,
      width: 2.2,
      height: 0.15,
      status: 'metro_blocked',
      description: 'Narrowed and severed by BMRCL barricades and foundation material'
    },
    {
      id: 'orr-w-kalamandir-opp',
      name: 'Kalamandir Opposite Tech Complex',
      axis: 'Z',
      start: 115,
      end: 175,
      offset: -23.5,
      width: 2.6,
      height: 0.25,
      status: 'paved',
      description: 'Intact paver blocks in front of commercial IT offices'
    },

    // ── East Footpath (Northbound ORR Service Road edge, x ≈ +23.5) ──
    {
      id: 'orr-e-multiplex-opp',
      name: 'Multiplex East Service Road Margin',
      axis: 'Z',
      start: -220,
      end: -145,
      offset: 23.5,
      width: 2.4,
      height: 0.05,
      status: 'missing',
      description: 'Missing footpath; raw soil, mud and open drainage culverts'
    },
    {
      id: 'orr-e-south-approach',
      name: 'Marathahalli Village South Approach',
      axis: 'Z',
      start: -145,
      end: -50,
      offset: 23.5,
      width: 2.4,
      height: 0.22,
      status: 'encroached',
      description: 'Occupied by informal repair shops, tea stalls, and parked two-wheelers'
    },
    {
      id: 'orr-e-junction-se',
      name: 'South-East Junction Corner (Factory Outlets)',
      axis: 'Z',
      start: -50,
      end: -21,
      offset: 23.5,
      width: 3.4,
      height: 0.25,
      status: 'paved',
      description: 'Paved corner sidewalk near Marathahalli signal'
    },
    {
      id: 'orr-e-brandfactory',
      name: 'Brand Factory Frontage',
      axis: 'Z',
      start: 21,
      end: 65,
      offset: 23.5,
      width: 3.6,
      height: 0.25,
      status: 'paved',
      description: 'Wide commercial paved sidewalk in front of Brand Factory outlet'
    },
    {
      id: 'orr-e-kalamandir',
      name: 'Kalamandir Wedding Palatial Store Frontage',
      axis: 'Z',
      start: 65,
      end: 120,
      offset: 24.0,
      width: 3.8,
      height: 0.25,
      status: 'paved',
      description: 'Polished stone paver slabs and decorative bollards in front of Kalamandir'
    },
    {
      id: 'orr-e-nalli-silks',
      name: 'Nalli Silks / Metro Station Access Footpath',
      axis: 'Z',
      start: 120,
      end: 175,
      offset: 23.5,
      width: 2.4,
      height: 0.18,
      status: 'metro_blocked',
      description: 'Squeezed footpath beside the elevated Marathahalli Metro structure'
    },

    // ══════════════════════════════════════════════════════════════════════════
    // CORRIDOR 2: HAL ROAD ◄► SPICE GARDEN (X-axis)
    // ══════════════════════════════════════════════════════════════════════════
    // ── HAL Old Airport Road North Footpath (z ≈ +13) ──
    {
      id: 'hal-n-far',
      name: 'HAL Road Far West Commercial Corridor',
      axis: 'X',
      start: -240,
      end: -140,
      offset: 13.0,
      width: 2.6,
      height: 0.25,
      status: 'paved',
      description: 'Standard BBMP tiled footpath with yellow-black curbs and street trees'
    },
    {
      id: 'hal-n-jewellers',
      name: 'Kalyan & Tanishq Showroom Strip',
      axis: 'X',
      start: -140,
      end: -28,
      offset: 13.0,
      width: 3.2,
      height: 0.25,
      status: 'paved',
      description: 'Showroom entrance walkway with illuminated storefronts and tactile paving'
    },

    // ── HAL Old Airport Road South Footpath (z ≈ -13) ──
    {
      id: 'hal-s-far',
      name: 'HAL Road South Apparel Row',
      axis: 'X',
      start: -240,
      end: -120,
      offset: -13.0,
      width: 2.6,
      height: 0.25,
      status: 'paved',
      description: 'Paved pedestrian path with retail showroom display frontage'
    },
    {
      id: 'hal-s-encroached',
      name: 'HAL Road Street Market & Snacks Row',
      axis: 'X',
      start: -120,
      end: -28,
      offset: -13.0,
      width: 2.6,
      height: 0.22,
      status: 'encroached',
      description: 'Encroached by mobile chai stalls, fruit vendors, and customer bike parking'
    },

    // ── Source-mapped skywalk and Varthur pedestrian footways ──
    {
      id: 'marathahalli-skywalk-deck',
      name: 'OSM Marathahalli Skywalk Deck',
      axis: 'Z',
      start: -5,
      end: 25,
      offset: 64.5,
      width: 3.0,
      height: 0.08,
      // Keep the audit ribbon just above the mapped deck top. The previous
      // value floated this source trace roughly 0.4m above the actual deck.
      elevation: MARATHAHALLI_SKYWALK_DECK_TOP_Y + 0.08,
      connectedToGrade: true,
      status: 'paved',
      sourcePath: [[63.9, -4.6], [66.2, 24.5]],
      sourceWayIds: ['way/323729567', 'way/1221361667', 'way/1221361669'],
      description: 'Source-mapped skywalk deck; access flights are rendered from their source step ways'
    },
    {
      id: 'varthur-n-ground-approach',
      name: 'OSM Varthur Road North Ground Footway',
      axis: 'X',
      start: 226,
      end: 339,
      offset: 0,
      width: 2.8,
      height: 0.08,
      status: 'paved',
      sourcePath: [[226.6, 5.1], [338.7, -1.3]],
      sourceWayIds: ['way/1225572737'],
      description: 'Source-mapped pedestrian approach to the elevated Varthur footway'
    },
    {
      id: 'varthur-n-elevated-bridge',
      name: 'OSM Varthur Road North Elevated Footway',
      axis: 'X',
      start: 339,
      end: 415,
      offset: 0,
      width: 2.6,
      height: 0.08,
      elevation: VARTHUR_VIADUCT_DECK_TOP_Y + 0.16,
      connectedToGrade: false,
      status: 'paved',
      sourcePath: [[338.7, -1.3], [414.9, -6.8]],
      sourceWayIds: ['way/1225572736'],
      description: 'Source-mapped elevated footway running with the Varthur viaduct'
    },
    {
      id: 'varthur-s-ground-approach',
      name: 'OSM Varthur Road South Ground Footway',
      axis: 'X',
      start: 247,
      end: 337,
      offset: 0,
      width: 2.6,
      height: 0.08,
      status: 'encroached',
      sourcePath: [[246.7, -19.4], [337.2, -23.1]],
      sourceWayIds: ['way/1225572744'],
      description: 'Source-mapped pedestrian approach; encroachment is a modelled inspection status'
    },
    {
      id: 'varthur-s-elevated-bridge',
      name: 'OSM Varthur Road South Elevated Footway',
      axis: 'X',
      start: 337,
      end: 414,
      offset: 0,
      width: 2.6,
      height: 0.08,
      elevation: VARTHUR_VIADUCT_DECK_TOP_Y + 0.16,
      connectedToGrade: false,
      status: 'paved',
      sourcePath: [[337.2, -23.1], [413.3, -29.1]],
      sourceWayIds: ['way/1225572743'],
      description: 'Source-mapped elevated footway running with the Varthur viaduct'
    },

    // ── Spice Garden / Munnekolala source-mapped footway audit ──
    // These paths follow the compiled OSM footway traces instead of the old
    // x=225–270 placeholder frontage. The OSM layer renders the underlying
    // geometry continuously; these modelled status colors appear only when
    // AUDIT PATHS is enabled and remain explicitly field-verification data.
    {
      id: 'spice-source-north-frontage',
      name: 'OSM Varthur Road North Footway to Spice Garden',
      axis: 'X',
      start: 414,
      end: 841,
      offset: -35,
      width: 2.0,
      height: 0.08,
      status: 'paved',
      sourcePath: [[414.9, -6.8], [583.2, -19.4], [661.9, -25.7], [749.3, -32.4], [811.4, -35.8], [839.5, -35.6], [840.6, -35.6]],
      sourceWayIds: ['way/1225572738'],
      description: 'Source-mapped footway trace; surface condition still needs field verification'
    },
    {
      id: 'spice-source-south-frontage',
      name: 'OSM Varthur Road South Footway to Spice Garden',
      axis: 'X',
      start: 413,
      end: 835,
      offset: -61,
      width: 2.0,
      height: 0.08,
      status: 'encroached',
      sourcePath: [[413.3, -29.1], [442.3, -31.6], [530, -39.2], [787.9, -58.2], [834.9, -61.6]],
      sourceWayIds: ['way/1231738940'],
      description: 'Source-mapped footway trace; encroachment status is a modelled inspection scenario'
    },
    {
      id: 'spice-source-service-footway',
      name: 'Spice Garden Service Road Footway & Bus Stop Link',
      axis: 'X',
      start: 835,
      end: 910,
      offset: -70,
      width: 2.2,
      height: 0.08,
      status: 'encroached',
      sourcePath: [[834.9, -61.6], [841.8, -64.3], [849.2, -67.6], [863.1, -68.2], [870.7, -70.4], [877.1, -70.6], [887.8, -69.9], [895.6, -72.8], [909.3, -77.1]],
      sourceWayIds: ['way/1225572747', 'way/1225572746'],
      description: 'Source-mapped service-road footway near Spice Garden bus stop; field condition needs verification'
    },
    {
      id: 'spice-source-east-approach-north',
      name: 'Spice Garden Inner Road North Footway Approach',
      axis: 'X',
      start: 837,
      end: 905,
      offset: 0,
      width: 1.8,
      height: 0.08,
      status: 'missing',
      sourcePath: [[857.7, -20.8], [857.2, -18.2], [835.9, 78.8], [832.9, 97.0], [882.7, 115.3]],
      sourceWayIds: ['way/1311089011'],
      description: 'Source-mapped inner-road trace; missing/unsafe status is a modelled field-audit scenario'
    },
    {
      id: 'spice-source-east-approach-south',
      name: 'Spice Garden Inner Road South Footway Approach',
      axis: 'X',
      start: 857,
      end: 904,
      offset: -28,
      width: 1.8,
      height: 0.08,
      status: 'missing',
      sourcePath: [[904.0, -47.5], [900.5, -44.3], [899.2, -39.4], [896.5, -31.7], [895.2, -27.8], [892.3, -23.7], [888.4, -21.2], [887.0, -20.3], [881.8, -18.4], [869.6, -19.7], [857.7, -20.8]],
      sourceWayIds: ['way/1311089014'],
      description: 'Source-mapped inner-road trace; missing/unsafe status is a modelled field-audit scenario'
    }
  ], []);

  const sourceWayIdsCoveredByAuditSegments = useMemo(
    () => new Set(segments.flatMap((segment) => segment.sourceWayIds || [])),
    [segments]
  );
  const sourceCoverageRoutes = useMemo(
    () => [...SOURCE_GROUND_WALK_ROUTES, ...SOURCE_ELEVATED_WALK_ROUTES]
      .filter((route) => !route.sourceWayIds.some((wayId) => sourceWayIdsCoveredByAuditSegments.has(wayId))),
    [sourceWayIdsCoveredByAuditSegments]
  );

  return (
    <group name="MarathahalliFootpathNetwork">
      <VerifiedSkywalkAccessCues
        auditMode={auditMode}
        cameraMode={cameraMode}
      />
      <ModeledWalkLinks
        auditMode={auditMode}
        cameraMode={cameraMode}
        cameraPreset={cameraPreset}
        showModeledNetwork={showModeledNetwork}
      />
      <SourceFootwayCoverage
        routes={sourceCoverageRoutes}
        auditMode={auditMode}
        cameraMode={cameraMode}
      />
      {segments.map((seg) => {
        if (seg.sourcePath) {
          return (
            <SourceMappedFootpathAuditSegment
              key={seg.id}
              segment={seg}
              auditMode={auditMode}
              cameraMode={cameraMode}
            />
          );
        }
        return showModeledNetwork
          ? <FootpathSegmentMesh
            key={seg.id}
            segment={seg}
            auditMode={auditMode}
            isNight={isNight}
            cameraMode={cameraMode}
          />
          : null;
      })}
      <AnimatedPedestrians isNight={isNight} />
    </group>
  );
};

// ── Subcomponent: Animated Pedestrians walking along footpaths and crossings ──
interface PedestrianRoute {
  curve: THREE.Curve<THREE.Vector3>;
  length: number;
  start: [number, number, number];
  speed: number;
  color: string;
}

function createPedestrianRoute(
  points: [number, number, number][],
  speed: number,
  color: string
): PedestrianRoute {
  // These are source traces, not a cinematic spline. Keep every OSM vertex in
  // the route so walkers do not cut across a junction corner or float between
  // the horizontal treads of the mapped skywalk stairs.
  const curve = new THREE.CurvePath<THREE.Vector3>();
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const from = new THREE.Vector3(...previous);
    const to = new THREE.Vector3(...current);
    if (from.distanceToSquared(to) < 0.0001) continue;
    curve.add(new THREE.LineCurve3(from, to));
  }

  return {
    curve,
    length: Math.max(1, curve.getLength()),
    start: points[0],
    speed,
    color
  };
}

function sourceRouteToPedestrianPoints(route: SourceWalkRoute): [number, number, number][] {
  const surfaceY = getSourceFootwaySurfaceY(route);
  return route.points.map(([x, z]) => [x, surfaceY + 0.04, z]);
}

const AnimatedPedestrians: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const pedestriansRef = useRef<THREE.Group>(null);
  const position = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);

  const routes = useMemo(() => {
    const southStairRoute = createVerifiedSkywalkStairPoints(
      MARATHAHALLI_SKYWALK_STAIR_POINTS[0].ground,
      MARATHAHALLI_SKYWALK_STAIR_POINTS[0].deck,
      MARATHAHALLI_SKYWALK_STAIR_STEP_COUNTS[0]
    );
    const northStairRoute = createVerifiedSkywalkStairPoints(
      MARATHAHALLI_SKYWALK_STAIR_POINTS[1].ground,
      MARATHAHALLI_SKYWALK_STAIR_POINTS[1].deck,
      MARATHAHALLI_SKYWALK_STAIR_STEP_COUNTS[1]
    ).reverse();
    const skywalkDeckRoute: [number, number, number][] = MARATHAHALLI_SKYWALK_DECK_POINTS.map(
      ([x, z]) => [x, MARATHAHALLI_SKYWALK_DECK_TOP_Y, z]
    );
    const skywalkRoute = [
      ...southStairRoute,
      ...skywalkDeckRoute.slice(1),
      ...northStairRoute.slice(1)
    ];

    // The source ground graph carries the long Oracle/Marathahalli approach
    // and the source elevated graph carries the two Varthur footways. Animate
    // directly on those exact polylines so the people never bridge an OSM gap
    // or silently turn an unverified structure into a walkable connection.
    const sourceGroundRoutes = SOURCE_GROUND_WALK_ROUTES.flatMap((route, index) => {
      const points = sourceRouteToPedestrianPoints(route);
      return [
        createPedestrianRoute(points, 2.4 + (index % 3) * 0.25, ['#15803d', '#0284c7', '#2563eb'][index % 3]),
        createPedestrianRoute([...points].reverse(), 2.2 + (index % 2) * 0.3, ['#9333ea', '#e11d48'][index % 2])
      ];
    });
    const sourceElevatedRoutes = SOURCE_ELEVATED_WALK_ROUTES.flatMap((route, index) => {
      const points = sourceRouteToPedestrianPoints(route);
      return [
        createPedestrianRoute(points, 2.8, index === 0 ? '#0e7490' : '#0369a1'),
        createPedestrianRoute([...points].reverse(), 2.5, index === 0 ? '#be123c' : '#9f1239')
      ];
    });

    return [
      ...sourceGroundRoutes,
      ...sourceElevatedRoutes,
      // Source-mapped Marathahalli Skywalk: ground → 27-step south flight →
      // deck → 42-step north flight → ground, in both directions.
      createPedestrianRoute(skywalkRoute, 2.5, '#15803d'),
      createPedestrianRoute([...skywalkRoute].reverse(), 2.6, '#9333ea'),
    ];
  }, []);

  const progress = useRef(routes.map((_, index) => (index * 0.15) % 1));

  useFrame((_, delta) => {
    if (!pedestriansRef.current) return;
    const safeDelta = Math.min(delta, 0.1);

    pedestriansRef.current.children.forEach((child, index) => {
      const route = routes[index];
      progress.current[index] = (progress.current[index] + (route.speed * safeDelta) / route.length) % 1;
      const t = progress.current[index];

      route.curve.getPointAt(t, position);
      route.curve.getTangentAt(t, tangent).normalize();
      child.position.copy(position);
      child.rotation.y = Math.atan2(tangent.x, tangent.z);
    });
  });

  return (
    <group ref={pedestriansRef} name="PedestrianWalkers">
      {routes.map((route, index) => (
        // The animation loop writes world-space positions to these groups.
        // Do not add route.start a second time or walkers appear displaced
        // from the footway they are meant to inspect.
        <group key={index}>
          {/* Person torso */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.85, 8]} />
            <meshStandardMaterial color={route.color} roughness={0.7} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 1.25, 0]}>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color="#fed7aa" />
          </mesh>
          {/* Night subtle silhouette / visibility glow */}
          {isNight && (
            <mesh position={[0, 0.65, 0]}>
              <sphereGeometry args={[0.22, 6, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

// ── Segment Mesh Renderer ──
const FootpathSegmentMesh: React.FC<{
  segment: FootpathSegment;
  auditMode: boolean;
  isNight: boolean;
  cameraMode: 'walk' | 'overview';
}> = ({ segment, auditMode, isNight, cameraMode }) => {
  const { axis, start, end, offset, width, height, status, elevation = 0 } = segment;

  const length = Math.abs(end - start);
  const centerCoord = (start + end) / 2;

  // Audit Mode Colors:
  // 🟢 Green = Paved & Walkable
  // 🔴 Red = Missing / Hazardous Shoulder
  // 🟡 Amber = Encroached / Metro Blocked
  const auditColor = useMemo(() => {
    switch (status) {
      case 'paved':
        return '#22c55e'; // Bright emerald green
      case 'missing':
        return '#ef4444'; // Bright crimson red
      case 'encroached':
        return '#f59e0b'; // Amber yellow
      case 'metro_blocked':
        return '#eab308'; // Safety gold yellow
      default:
        return '#38bdf8';
    }
  }, [status]);

  // Realistic Physical Materials:
  const surfaceMat = useMemo(() => {
    if (status === 'missing') {
      // Raw dirt/gravel road shoulder
      return new THREE.MeshStandardMaterial({
        color: '#6b5847',
        roughness: 0.98,
        metalness: 0.02
      });
    }
    if (status === 'metro_blocked') {
      // Pitted broken asphalt / construction crushed gravel
      return new THREE.MeshStandardMaterial({
        color: '#5c544d',
        roughness: 0.95,
        metalness: 0.05
      });
    }
    // 'paved' and 'encroached' use concrete sidewalk pavers
    return new THREE.MeshStandardMaterial({
      color: '#8b929a',
      roughness: 0.88,
      metalness: 0.08
    });
  }, [status]);

  // Compute position and dimensions based on orientation axis
  const isXAxis = axis === 'X';
  const posX = isXAxis ? centerCoord : offset;
  const posZ = isXAxis ? offset : centerCoord;
  const sizeX = isXAxis ? length : width;
  const sizeZ = isXAxis ? width : length;
  const posY = elevation + height / 2;
  const isOrrCurve = axis === 'Z' && segment.id.startsWith('orr-');
  const lateralOffset = isOrrCurve
    ? (offset >= 0 ? -Math.abs(offset) : Math.abs(offset))
    : 0;
  const roadFrame = isOrrCurve ? getOrrRoadFrameAtZ(centerCoord) : null;
  const projectedCenter = isOrrCurve
    ? getOrrOffsetPointAtZ(centerCoord, lateralOffset)
    : null;
  const renderPosX = projectedCenter?.[0] ?? posX;
  const renderPosZ = projectedCenter?.[1] ?? posZ;
  const renderRotation = roadFrame ? Math.atan2(roadFrame.tangentX, roadFrame.tangentZ) : 0;

  const curvedSurfaceGeometry = useMemo(() => {
    if (!isOrrCurve) return null;
    const geometry = createOrrOffsetRibbonGeometry(
      start,
      end,
      lateralOffset,
      width,
      height / 2 + 0.01,
      36
    );
    geometry.translate(-renderPosX, 0, -renderPosZ);
    // The parent rotates local +Z to the road tangent for the curb,
    // tactile strip, and obstruction details. Counter-rotate the already
    // curved world-space ribbon so it is not rotated a second time.
    geometry.rotateY(-renderRotation);
    return geometry;
  }, [end, height, isOrrCurve, lateralOffset, renderPosX, renderPosZ, renderRotation, start, width]);

  const curvedAuditGeometry = useMemo(() => {
    if (!isOrrCurve) return null;
    const geometry = createOrrOffsetRibbonGeometry(
      start,
      end,
      lateralOffset,
      width,
      height / 2 + 0.16,
      36
    );
    geometry.translate(-renderPosX, 0, -renderPosZ);
    geometry.rotateY(-renderRotation);
    return geometry;
  }, [end, height, isOrrCurve, lateralOffset, renderPosX, renderPosZ, renderRotation, start, width]);

  return (
    <group position={[renderPosX, posY, renderPosZ]} rotation={[0, renderRotation, 0]}>
      {/* ── Main Footpath Surface Slab ── */}
      {curvedSurfaceGeometry ? (
        <mesh
          geometry={curvedSurfaceGeometry}
          receiveShadow
          castShadow={status === 'paved' || status === 'encroached'}
          material={surfaceMat}
        />
      ) : (
        <mesh receiveShadow castShadow={status === 'paved' || status === 'encroached'} material={surfaceMat}>
          <boxGeometry args={[sizeX, height, sizeZ]} />
        </mesh>
      )}

      {/* ── Raised Curb Stone along Road Edge (Only if Paved or Encroached) ── */}
      {(status === 'paved' || status === 'encroached') && (
        <CurbStoneLine
          axis={axis}
          length={length}
          width={width}
          curbHeight={height}
          roadSide={offset > 0 ? -1 : 1}
        />
      )}

      {/* ── Tactile Yellow Braille Tiles for Visually Impaired (on Paved sections) ── */}
      {status === 'paved' && (
        <TactileStrip
          axis={axis}
          length={length}
          width={width}
          curbHeight={height}
          roadSide={offset > 0 ? -1 : 1}
        />
      )}

      {/* ── Encroachment Obstacles (Vendor thelas, crates, parked scooter) ── */}
      {status === 'encroached' && (
        <EncroachmentObstacles axis={axis} length={length} isNight={isNight} />
      )}

      {/* ── Metro Construction Safety Barricade along Blocked Footpath ── */}
      {status === 'metro_blocked' && (
        <MetroConstructionBarricadeLine axis={axis} length={length} isNight={isNight} />
      )}

      {/* ── Missing Footpath Mud Ruts & Broken Culvert Slabs ── */}
      {status === 'missing' && (
        <BrokenDrainCulverts axis={axis} length={length} />
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* AUDIT MODE OVERLAY: Floating glowing ribbon + status beacon          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {auditMode && (
        <group position={[0, height / 2 + 0.15, 0]}>
          {/* Glowing Status Ribbon */}
          {curvedAuditGeometry ? (
            <mesh geometry={curvedAuditGeometry} position={[0, -(height / 2 + 0.15), 0]} renderOrder={4}>
              <meshStandardMaterial
                color={auditColor}
                emissive={auditColor}
                emissiveIntensity={2.4}
                transparent
                opacity={0.88}
                roughness={0.2}
              />
            </mesh>
          ) : (
            <mesh>
              <boxGeometry args={[sizeX, 0.08, sizeZ]} />
              <meshStandardMaterial
                color={auditColor}
                emissive={auditColor}
                emissiveIntensity={2.4}
                transparent
                opacity={0.88}
                roughness={0.2}
              />
            </mesh>
          )}

          {/* Pulsing Status Core Dot at center */}
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial
              color={auditColor}
              emissive={auditColor}
              emissiveIntensity={3.5}
            />
          </mesh>
        </group>
      )}
      {auditMode && status !== 'paved' && (
        <Html
          position={[0, height + 1.1, 0]}
          center
          distanceFactor={cameraMode === 'walk' ? 20 : 105}
          style={{ pointerEvents: 'none' }}
        >
          <div className="walk-link-world-label" title={segment.description}>
            <span
              className="walk-link-world-label-dot"
              aria-hidden="true"
              style={{ background: auditColor }}
            />
            <span>{segment.name}</span>
            <strong style={{ color: auditColor }}>
              MODELLED · FIELD VERIFY · {formatFootpathStatus(status)}
            </strong>
          </div>
        </Html>
      )}
    </group>
  );
};

const SourceMappedFootpathAuditSegment: React.FC<{
  segment: FootpathSegment;
  auditMode: boolean;
  cameraMode: 'walk' | 'overview';
}> = ({ segment, auditMode, cameraMode }) => {
  const auditColor = useMemo(() => {
    switch (segment.status) {
      case 'paved':
        return '#22c55e';
      case 'missing':
        return '#ef4444';
      case 'encroached':
        return '#f59e0b';
      case 'metro_blocked':
        return '#eab308';
      default:
        return '#38bdf8';
    }
  }, [segment.status]);
  const sourceSurfaceY = segment.elevation ?? 0.2;
  const geometry = useMemo(
    () => createPathRibbonGeometry(segment.sourcePath || [], segment.width, sourceSurfaceY),
    [segment.sourcePath, segment.width, sourceSurfaceY]
  );
  const sourceLinePoints = useMemo(
    () => (segment.sourcePath || []).map(([x, z]) => [x, sourceSurfaceY + 0.06, z] as [number, number, number]),
    [segment.sourcePath, sourceSurfaceY]
  );
  const statusLinePoints = useMemo(
    () => (segment.sourcePath || []).map(([x, z]) => [x, sourceSurfaceY + 0.1, z] as [number, number, number]),
    [segment.sourcePath, sourceSurfaceY]
  );
  const sourceEdgePoints = useMemo(
    () => createPathEdgeLinePoints(segment.sourcePath || [], segment.width, sourceSurfaceY),
    [segment.sourcePath, segment.width, sourceSurfaceY]
  );
  const labelPoint = segment.sourcePath?.[Math.floor((segment.sourcePath.length - 1) / 2)] || [0, 0];
  const showSourceGuide = auditMode || cameraMode === 'walk';
  const showSourceLabel = cameraMode === 'walk' || auditMode;

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!showSourceGuide) return null;
  return (
    <group name={`SourceFootpathAudit-${segment.id}`}>
      {/* Cyan is the source-truth channel; the condition color is overlaid
          only in audit mode so a red/amber condition never implies that the
          mapped footway itself is absent. */}
      <mesh geometry={geometry} renderOrder={5}>
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={cameraMode === 'walk' ? 0.16 : 0.24}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {sourceEdgePoints.left.length >= 2 && (
        <SourceFootwayBoundaryGuides
          points={segment.sourcePath || []}
          width={segment.width}
          y={sourceSurfaceY}
          cameraMode={cameraMode}
          auditMode={auditMode}
        />
      )}
      <Line
        points={sourceLinePoints}
        color="#67e8f9"
        lineWidth={cameraMode === 'walk' ? 1.8 : 2.2}
        transparent
        opacity={cameraMode === 'walk' ? 0.68 : 0.88}
      />
      {auditMode && (
        <Line
          points={statusLinePoints}
          color={auditColor}
          lineWidth={2.8}
          dashed
          dashSize={3.5}
          gapSize={2.2}
          transparent
          opacity={0.95}
        />
      )}
      {showSourceLabel && (
        <Html
          position={[labelPoint[0], sourceSurfaceY + (cameraMode === 'walk' ? 1.15 : 1.45), labelPoint[1]]}
          center
          distanceFactor={cameraMode === 'walk' ? 20 : 105}
          style={{ pointerEvents: 'none' }}
        >
          <div className="walk-link-world-label">
            <span className="walk-link-world-label-dot" aria-hidden="true" style={{ background: '#22d3ee' }} />
            <span>{segment.name}</span>
            <strong>SOURCE · OSM FOOTWAY · {segment.sourceWayIds?.join(', ')}</strong>
            {auditMode && (
              <strong style={{ color: auditColor }}>AUDIT · {formatFootpathStatus(segment.status)}</strong>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// ── Subcomponent: Yellow & Black Alternating BBMP Curb Stones ──
const CurbStoneLine: React.FC<{
  axis: 'X' | 'Z';
  length: number;
  width: number;
  curbHeight: number;
  roadSide: 1 | -1;
}> = ({ axis, length, width, curbHeight, roadSide }) => {
  const blockLength = 1.6;
  const count = Math.max(1, Math.floor(length / blockLength));
  const isX = axis === 'X';

  const curbOffset = (width / 2) * roadSide;

  return (
    <group position={isX ? [0, 0, curbOffset] : [curbOffset, 0, 0]}>
      {Array.from({ length: count }).map((_, idx) => {
        const isYellow = idx % 2 === 0;
        const pos = -length / 2 + (idx + 0.5) * blockLength;
        return (
          <mesh
            key={idx}
            position={isX ? [pos, 0.02, 0] : [0, 0.02, pos]}
            castShadow
          >
            <boxGeometry args={isX ? [blockLength * 0.96, curbHeight + 0.04, 0.35] : [0.35, curbHeight + 0.04, blockLength * 0.96]} />
            <meshStandardMaterial color={isYellow ? '#facc15' : '#1e293b'} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

// ── Subcomponent: Yellow Tactile Paving Strip ──
const TactileStrip: React.FC<{
  axis: 'X' | 'Z';
  length: number;
  width: number;
  curbHeight: number;
  roadSide: 1 | -1;
}> = ({ axis, length, width, curbHeight, roadSide }) => {
  const isX = axis === 'X';
  const tactileOffset = (width / 2 - 0.55) * roadSide;

  return (
    <mesh
      position={isX ? [0, curbHeight / 2 + 0.01, tactileOffset] : [tactileOffset, curbHeight / 2 + 0.01, 0]}
    >
      <boxGeometry args={isX ? [length * 0.98, 0.02, 0.4] : [0.4, 0.02, length * 0.98]} />
      <meshStandardMaterial color="#eab308" roughness={0.6} />
    </mesh>
  );
};

// ── Subcomponent: Encroachment Obstacles (Vendor stalls, fruit carts, scooter) ──
const EncroachmentObstacles: React.FC<{
  axis: 'X' | 'Z';
  length: number;
  isNight: boolean;
}> = ({ axis, length, isNight }) => {
  const isX = axis === 'X';
  const positions = useMemo(() => {
    const list: number[] = [];
    for (let p = -length / 2 + 6; p < length / 2 - 6; p += 18) {
      list.push(p);
    }
    return list;
  }, [length]);

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={isX ? [pos, 0.3, 0] : [0, 0.3, pos]}>
          {/* Wooden Fruit Pushcart (Thela) */}
          {i % 2 === 0 ? (
            <group>
              {/* Cart wooden bed */}
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[1.6, 0.15, 1.1]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>
              {/* Spoke wheels */}
              <mesh position={[-0.6, 0.3, 0.55]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 10]} />
                <meshStandardMaterial color="#1f2937" metalness={0.8} />
              </mesh>
              <mesh position={[0.6, 0.3, 0.55]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 10]} />
                <meshStandardMaterial color="#1f2937" metalness={0.8} />
              </mesh>
              {/* Colorful umbrella / tarpaulin awning */}
              <mesh position={[0, 1.8, 0]} rotation={[0, 0, 0.1]}>
                <cylinderGeometry args={[0.9, 1.4, 0.3, 10]} />
                <meshStandardMaterial color="#dc2626" roughness={0.7} />
              </mesh>
              <mesh position={[0, 1.0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
                <meshStandardMaterial color="#9ca3af" metalness={0.7} />
              </mesh>
              {isNight && (
                <mesh position={[0, 1.4, 0]}>
                  <sphereGeometry args={[0.08, 6, 6]} />
                  <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={3} />
                </mesh>
              )}
            </group>
          ) : (
            /* Parked Scooter Blocking Footpath */
            <group position={[0, 0.35, 0]} rotation={[0, Math.PI / 3, 0]}>
              <mesh position={[0, 0.25, 0]} castShadow>
                <boxGeometry args={[1.2, 0.5, 0.4]} />
                <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.6} />
              </mesh>
              <mesh position={[0.5, 0.6, 0]}>
                <boxGeometry args={[0.1, 0.5, 0.6]} />
                <meshStandardMaterial color="#1f2937" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

// ── Subcomponent: Metro Construction Barricades Blocking Footpath ──
const MetroConstructionBarricadeLine: React.FC<{
  axis: 'X' | 'Z';
  length: number;
  isNight: boolean;
}> = ({ axis, length, isNight }) => {
  const panelLength = 3.6;
  const count = Math.max(1, Math.floor(length / panelLength));
  const isX = axis === 'X';

  return (
    <group position={[0, 0.8, 0]}>
      {Array.from({ length: count }).map((_, idx) => {
        const isYellow = idx % 2 === 0;
        const pos = -length / 2 + (idx + 0.5) * panelLength;
        return (
          <group key={idx} position={isX ? [pos, 0, 0] : [0, 0, pos]}>
            {/* Corrugated safety barricade sheet (BMRCL Yellow & Blue) */}
            <mesh castShadow>
              <boxGeometry args={isX ? [panelLength * 0.95, 1.6, 0.12] : [0.12, 1.6, panelLength * 0.95]} />
              <meshStandardMaterial
                color={isYellow ? '#eab308' : '#0284c7'}
                roughness={0.6}
                metalness={0.3}
              />
            </mesh>

            {/* BMRCL Logo Emblem Stripe */}
            <mesh position={isX ? [0, 0.1, 0.07] : [0.07, 0.1, 0]}>
              <boxGeometry args={isX ? [panelLength * 0.8, 0.3, 0.02] : [0.02, 0.3, panelLength * 0.8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>

            {/* Red Warning Hazard Cone beside barricade */}
            <mesh position={isX ? [0, -0.5, 0.7] : [0.7, -0.5, 0]}>
              <cylinderGeometry args={[0.08, 0.25, 0.65, 8]} />
              <meshStandardMaterial
                color="#ea580c"
                emissive="#ea580c"
                emissiveIntensity={isNight ? 1.2 : 0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ── Subcomponent: Broken Gutter / Drain Slabs on Missing Footpath ──
const BrokenDrainCulverts: React.FC<{ axis: 'X' | 'Z'; length: number }> = ({ axis, length }) => {
  const isX = axis === 'X';
  const positions = useMemo(() => {
    const list: number[] = [];
    for (let p = -length / 2 + 5; p < length / 2 - 5; p += 14) {
      list.push(p);
    }
    return list;
  }, [length]);

  return (
    <group position={[0, 0.06, 0]}>
      {positions.map((p, idx) => (
        <group key={idx} position={isX ? [p, 0, 0] : [0, 0, p]} rotation={[0, (idx % 3) * 0.2 - 0.2, 0]}>
          {/* Cracked concrete drain slab */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={isX ? [1.8, 0.12, 1.2] : [1.2, 0.12, 1.8]} />
            <meshStandardMaterial color="#52525b" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

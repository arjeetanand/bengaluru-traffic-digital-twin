import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  MarathahalliDemoSnapshot,
  OSMPolylineFeature,
  NAMMA_METRO_MAINLINE_WAY_IDS,
  isNammaMetroMainlineWay,
  isNammaMetroPierSupport
} from '../../../data/marathahalliDemo';
import { loadMarathahalliSnapshot } from '../../../services/marathahalliSnapshot';

interface MetroViaductProps {
  isNight: boolean;
}

type LocalPoint = [number, number];

// The OSM extract gives the alignment and relative layer only. Keep the
// display elevation above the mapped Varthur viaduct while using the 5.5 m
// Phase 2A road-clearance value as a minimum structural datum; this is not a
// surveyed rail level. The numeric deck datum is deliberately a renderer
// contract, not an assertion about the built Namma Metro vertical profile.
const METRO_DECK_CENTER_Y = 10.8;
const METRO_DECK_WIDTH = 9.5;
const METRO_TRACK_WIDTH = 2.75;
const METRO_RAIL_Y = 11.62;
const METRO_TRAIN_Y = 11.57;
const METRO_PIER_SPACING = 28;
const METRO_SAMPLE_SPACING = 8;
const METRO_TRAIN_SPEED_FALLBACK = 22;
const METRO_SLEEPER_SPACING = 4;
const METRO_GAUGE_FALLBACK_METERS = 1.435;
// The two source centreline ways are the authority for the rendered
// alignment. 5.03 m is the target centre-to-centre spacing used for the
// structural fallback when a future extract cannot be paired at a sample.
const METRO_TARGET_TRACK_CENTRE_SPACING = 5.03;
const METRO_THIRD_RAIL_CLEARANCE = 0.34;
const METRO_MIN_SOFFIT_Y = 5.5;
const METRO_UNDERDECK_CENTER_DROP = 0.55;
const METRO_UNDERDECK_HEIGHT = 0.4;
// Phase 2A viaducts use a single precast U-girder per track. These dimensions
// are deliberately kept separate from the OSM track envelope: OSM supplies
// centreline plan geometry and gauge, while the cross-section remains a
// renderer assumption until a construction drawing or survey is available.
const METRO_U_GIRDER_WIDTH = 3.55;
const METRO_U_GIRDER_WALL_THICKNESS = 0.28;
const METRO_U_GIRDER_WALL_HEIGHT = 1.48;
const METRO_U_GIRDER_FLOOR_THICKNESS = 0.34;
const METRO_U_GIRDER_BOTTOM_Y = 10.05;
const METRO_U_GIRDER_TOP_Y = 11.53;
const METRO_SPAN_JOINT_DEPTH = 0.12;
const METRO_SPAN_JOINT_HEIGHT = 1.28;
const METRO_PIER_CAPITAL_HEIGHT = 0.58;
const METRO_PIER_CAPITAL_OVERLAP = 0.16;
const METRO_BEARING_PAIR_SPACING = 1.32;
const METRO_PIER_CAP_HEIGHT = 0.72;
const METRO_PIER_CAP_DEPTH = 2.0;
const METRO_PIER_SHAFT_RADIUS = 0.78;
const METRO_PIER_BASE_RADIUS = 1.12;
const METRO_PIER_BASE_TOP_Y = 0.42;
const METRO_PIER_BUILDING_BUFFER = 0.65;
const METRO_MIN_SOURCE_PIER_SPACING = 8;
const METRO_BEARING_BASE_HEIGHT = 0.08;
const METRO_BEARING_PAD_HEIGHT = 0.14;
const METRO_BEARING_TO_DECK_CLEARANCE = 0.06;
// This is a modeled comparison datum for the mapped road viaduct crossing.
// It is not Namma Metro evidence and does not turn the local OSM layer tags
// into a surveyed vertical section.
const METRO_REFERENCE_ROAD_DECK_TOP_Y = 8.0;
const METRO_REFERENCE_ROAD_CLEARANCE_BUFFER = 1.5;
// The source ways carry a relative OSM layer (layer=2), not survey elevations.
// These are display elevations for the modeled viaduct detail only.
const METRO_JUNCTION_CLEAR_HALF_LENGTH = 42;
const METRO_JUNCTION_CLEAR_HALF_WIDTH = 14;
const METRO_JUNCTION_PIER_SETBACK = 4;

interface MetroTrackData {
  trackPaths: LocalPoint[][];
  centerline: LocalPoint[];
  centerCurve: THREE.Curve<THREE.Vector3>;
  trainCurve: THREE.Curve<THREE.Vector3>;
  sourceWayIds: readonly string[];
  sourceNodeCounts: number[];
  sourceTrackTags: Record<string, string>;
  trainLength: number;
  initialProgress: number;
  trackSeparation: number;
  gaugeMeters: number;
  gaugeSourceBacked: boolean;
  trainSpeed: number;
  thirdRailSourceBacked: boolean;
}

interface MetroPierFrame {
  point: LocalPoint;
  angle: number;
  progress: number;
  sourceBacked: boolean;
  sourceSupportId?: string;
  sourceSupportOffset?: number;
}

interface SourceCurveData {
  curve: THREE.Curve<THREE.Vector3>;
  points: LocalPoint[];
  vertexProgress: number[];
}

function distanceBetween(a: LocalPoint, b: LocalPoint) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function toPolylineCurve(points: LocalPoint[]) {
  const curve = new THREE.CurvePath<THREE.Vector3>();
  for (let index = 1; index < points.length; index += 1) {
    curve.add(new THREE.LineCurve3(
      new THREE.Vector3(points[index - 1][0], 0, points[index - 1][1]),
      new THREE.Vector3(points[index][0], 0, points[index][1])
    ));
  }
  return curve;
}

function toLocalPoints(points: THREE.Vector3[]): LocalPoint[] {
  return points.map((point) => [point.x, point.z]);
}

function sourceCurve(feature: OSMPolylineFeature): SourceCurveData {
  const points = feature.geometry.filter((point, index, geometry) => (
    index === 0 || distanceBetween(point, geometry[index - 1]) > 0.05
  ));
  const segmentLengths = points.slice(1).map((point, index) => (
    distanceBetween(points[index], point)
  ));
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  const vertexProgress = [0];
  let accumulatedLength = 0;
  segmentLengths.forEach((length) => {
    accumulatedLength += length;
    vertexProgress.push(totalLength > 0 ? accumulatedLength / totalLength : 1);
  });
  return {
    curve: toPolylineCurve(points),
    points,
    vertexProgress
  };
}

function orientSourceCurveLike(reference: SourceCurveData, candidate: SourceCurveData) {
  const referenceLast = reference.points[reference.points.length - 1];
  const candidateLast = candidate.points[candidate.points.length - 1];
  const direct = distanceBetween(reference.points[0], candidate.points[0])
    + distanceBetween(referenceLast, candidateLast);
  const reversed = distanceBetween(reference.points[0], candidateLast)
    + distanceBetween(referenceLast, candidate.points[0]);
  if (reversed >= direct) return candidate;

  return {
    points: [...candidate.points].reverse(),
    curve: toPolylineCurve([...candidate.points].reverse()),
    vertexProgress: candidate.vertexProgress
      .slice()
      .reverse()
      .map((progress) => 1 - progress)
  };
}

function getTangent(points: LocalPoint[], index: number): LocalPoint {
  const previous = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const dx = next[0] - previous[0];
  const dz = next[1] - previous[1];
  const length = Math.hypot(dx, dz) || 1;
  return [dx / length, dz / length];
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function offsetPath(points: LocalPoint[], offset: number): LocalPoint[] {
  return points.map((point, index) => {
    const [tangentX, tangentZ] = getTangent(points, index);
    return [
      point[0] - tangentZ * offset,
      point[1] + tangentX * offset
    ];
  });
}

function createBeamGeometry(
  paths: LocalPoint[][],
  width: number,
  height: number,
  y: number,
  overlap = 0.24
) {
  const pieces: THREE.BufferGeometry[] = [];
  const yAxis = new THREE.Vector3(0, 1, 0);

  for (const path of paths) {
    for (let index = 1; index < path.length; index += 1) {
      const previous = path[index - 1];
      const current = path[index];
      const dx = current[0] - previous[0];
      const dz = current[1] - previous[1];
      const length = Math.hypot(dx, dz);
      if (length < 0.05) continue;

      const midpoint = new THREE.Vector3(
        (previous[0] + current[0]) / 2,
        y,
        (previous[1] + current[1]) / 2
      );
      const angle = Math.atan2(dx, dz);
      const piece = new THREE.BoxGeometry(width, height, length + overlap);
      piece.applyMatrix4(
        new THREE.Matrix4().compose(
          midpoint,
          new THREE.Quaternion().setFromAxisAngle(yAxis, angle),
          new THREE.Vector3(1, 1, 1)
        )
      );
      pieces.push(piece);
    }
  }

  const geometry = mergeGeometries(pieces, false) || new THREE.BufferGeometry();
  pieces.forEach((piece) => piece.dispose());
  return geometry;
}

type ProfilePoint = [number, number];

// Return the local +X direction for a source polyline vertex. Averaging the
// incoming/outgoing normals makes the precast shell continuous through mapped
// bends, instead of leaving the visible box-segment gaps that the old deck
// construction produced. Clamp sharp OSM corners so a bad node does not make
// the miter flare into surrounding buildings.
function getMiterNormal(points: LocalPoint[], index: number): LocalPoint {
  const current = points[index];
  const previous = points[Math.max(0, index - 1)] || current;
  const next = points[Math.min(points.length - 1, index + 1)] || current;
  const incomingLength = distanceBetween(previous, current) || 1;
  const outgoingLength = distanceBetween(current, next) || 1;
  const incomingTangent: LocalPoint = [
    (current[0] - previous[0]) / incomingLength,
    (current[1] - previous[1]) / incomingLength
  ];
  const outgoingTangent: LocalPoint = [
    (next[0] - current[0]) / outgoingLength,
    (next[1] - current[1]) / outgoingLength
  ];
  const incomingNormal: LocalPoint = [incomingTangent[1], -incomingTangent[0]];
  const outgoingNormal: LocalPoint = [outgoingTangent[1], -outgoingTangent[0]];
  let normalX = incomingNormal[0] + outgoingNormal[0];
  let normalZ = incomingNormal[1] + outgoingNormal[1];
  const normalLength = Math.hypot(normalX, normalZ);
  if (normalLength < 0.001) return incomingNormal;
  normalX /= normalLength;
  normalZ /= normalLength;
  const miterDot = Math.max(0.55, normalX * incomingNormal[0] + normalZ * incomingNormal[1]);
  const miterLength = Math.max(0.8, Math.min(1.7, 1 / miterDot));
  return [normalX * miterLength, normalZ * miterLength];
}

function createSweptProfileGeometry(
  paths: LocalPoint[][],
  profile: ProfilePoint[],
  baseY: number
) {
  const positions: number[] = [];
  const indices: number[] = [];

  paths.forEach((path) => {
    if (path.length < 2 || profile.length < 3) return;
    const ringSize = profile.length;
    const pathStart = positions.length / 3;
    path.forEach((point, pointIndex) => {
      const [normalX, normalZ] = getMiterNormal(path, pointIndex);
      profile.forEach(([lateral, vertical]) => {
        positions.push(
          point[0] + normalX * lateral,
          baseY + vertical,
          point[1] + normalZ * lateral
        );
      });
    });

    for (let pointIndex = 1; pointIndex < path.length; pointIndex += 1) {
      const currentRing = pathStart + (pointIndex - 1) * ringSize;
      const nextRing = pathStart + pointIndex * ringSize;
      for (let profileIndex = 0; profileIndex < ringSize; profileIndex += 1) {
        const nextProfileIndex = (profileIndex + 1) % ringSize;
        const current = currentRing + profileIndex;
        const currentNext = currentRing + nextProfileIndex;
        const next = nextRing + profileIndex;
        const nextNext = nextRing + nextProfileIndex;
        indices.push(current, currentNext, nextNext, current, nextNext, next);
      }
    }

    // Close the two span ends. The U profile itself stays open at the top;
    // these caps only close the precast span end faces.
    const firstRing = pathStart;
    const lastRing = pathStart + (path.length - 1) * ringSize;
    for (let profileIndex = 1; profileIndex < ringSize - 1; profileIndex += 1) {
      indices.push(firstRing, firstRing + profileIndex + 1, firstRing + profileIndex);
      indices.push(lastRing, lastRing + profileIndex, lastRing + profileIndex + 1);
    }
  });

  const geometry = new THREE.BufferGeometry();
  if (!positions.length) return geometry;
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createUGirderGeometry(paths: LocalPoint[][], baseY: number) {
  const halfWidth = METRO_U_GIRDER_WIDTH / 2;
  const innerHalfWidth = halfWidth - METRO_U_GIRDER_WALL_THICKNESS;
  const profile: ProfilePoint[] = [
    [-halfWidth, 0],
    [halfWidth, 0],
    [halfWidth, METRO_U_GIRDER_WALL_HEIGHT],
    [innerHalfWidth, METRO_U_GIRDER_WALL_HEIGHT],
    [innerHalfWidth, METRO_U_GIRDER_FLOOR_THICKNESS],
    [-innerHalfWidth, METRO_U_GIRDER_FLOOR_THICKNESS],
    [-innerHalfWidth, METRO_U_GIRDER_WALL_HEIGHT],
    [-halfWidth, METRO_U_GIRDER_WALL_HEIGHT]
  ];
  return createSweptProfileGeometry(paths, profile, baseY);
}

function createTransverseBoxGeometry(
  frames: MetroPierFrame[],
  width: number,
  height: number,
  y: number,
  depth: number
) {
  const pieces: THREE.BufferGeometry[] = [];
  const yAxis = new THREE.Vector3(0, 1, 0);
  frames.forEach((frame) => {
    const piece = new THREE.BoxGeometry(width, height, depth);
    piece.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3(frame.point[0], y, frame.point[1]),
        new THREE.Quaternion().setFromAxisAngle(yAxis, frame.angle),
        new THREE.Vector3(1, 1, 1)
      )
    );
    pieces.push(piece);
  });
  const geometry = mergeGeometries(pieces, false) || new THREE.BufferGeometry();
  pieces.forEach((piece) => piece.dispose());
  return geometry;
}

function createSpanJointGeometry(
  trackPaths: LocalPoint[][],
  frames: MetroPierFrame[],
  width: number,
  height: number,
  y: number,
  depth: number
) {
  const curves = trackPaths.map((path) => toPolylineCurve(path));
  const pieces: THREE.BufferGeometry[] = [];
  const yAxis = new THREE.Vector3(0, 1, 0);
  frames.forEach((frame) => {
    curves.forEach((curve) => {
      const point = curve.getPointAt(frame.progress);
      const piece = new THREE.BoxGeometry(width, height, depth);
      piece.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(point.x, y, point.z),
          new THREE.Quaternion().setFromAxisAngle(yAxis, frame.angle),
          new THREE.Vector3(1, 1, 1)
        )
      );
      pieces.push(piece);
    });
  });
  const geometry = mergeGeometries(pieces, false) || new THREE.BufferGeometry();
  pieces.forEach((piece) => piece.dispose());
  return geometry;
}

function getPierCapWidth(trackData: MetroTrackData) {
  return Math.max(
    METRO_DECK_WIDTH + 0.28,
    trackData.trackSeparation + METRO_U_GIRDER_WIDTH + 0.55
  );
}

function buildMetroTrackData(snapshot: MarathahalliDemoSnapshot): MetroTrackData | null {
  // Select the two committed through-way IDs explicitly. This keeps the
  // short way/1551136769 siding out of the viaduct even if a future extract
  // adds more Namma Metro service ways to the snapshot.
  const ways = NAMMA_METRO_MAINLINE_WAY_IDS
    .map((id) => snapshot.railways.find((feature) => feature.id === id))
    .filter((way): way is OSMPolylineFeature => Boolean(way));
  if (ways.length !== NAMMA_METRO_MAINLINE_WAY_IDS.length) return null;
  if (ways.some((way) => (
    way.tags.network !== 'Namma Metro' ||
    way.tags.railway !== 'subway' ||
    way.tags.bridge !== 'viaduct' ||
    way.tags.layer !== '2'
  ))) return null;

  const sourceCurves = ways.slice(0, 2).map(sourceCurve);
  if (sourceCurves.some(({ points }) => points.length < 2)) return null;
  sourceCurves[1] = orientSourceCurveLike(sourceCurves[0], sourceCurves[1]);
  const sampleCount = Math.max(
    2,
    Math.ceil(Math.max(...sourceCurves.map(({ curve }) => curve.getLength())) / METRO_SAMPLE_SPACING)
  );
  // Sample by shared normalized distance, while also retaining every source
  // vertex. This keeps both tracks paired without smoothing or cutting across
  // a mapped bend in the OSM alignment.
  const progressValues = new Set<number>([0, 1]);
  for (let index = 1; index < sampleCount; index += 1) {
    progressValues.add(index / sampleCount);
  }
  sourceCurves.forEach(({ vertexProgress }) => {
    vertexProgress.forEach((progress) => progressValues.add(progress));
  });
  const sharedProgress = [...progressValues].sort((a, b) => a - b);
  const firstTrack = toLocalPoints(sharedProgress.map((progress) => (
    sourceCurves[0].curve.getPointAt(progress)
  )));
  const secondTrack = toLocalPoints(sharedProgress.map((progress) => (
    sourceCurves[1].curve.getPointAt(progress)
  )));
  const trackPaths = [firstTrack, secondTrack];
  const centerline = firstTrack.map((point, index) => [
    (point[0] + secondTrack[index][0]) / 2,
    (point[1] + secondTrack[index][1]) / 2
  ] as LocalPoint);
  const centerCurve = toPolylineCurve(centerline);
  const trainCurve = toPolylineCurve(firstTrack);
  const trackSeparation = median(firstTrack.map((point, index) => (
    distanceBetween(point, secondTrack[index])
  ))) || METRO_TARGET_TRACK_CENTRE_SPACING;
  const sourceGaugeMillimeters = Number.parseFloat(ways[0].tags.gauge || '');
  const gaugeSourceBacked = Number.isFinite(sourceGaugeMillimeters)
    && sourceGaugeMillimeters > 0
    && ways.every((way) => way.tags.gauge === ways[0].tags.gauge);
  const gaugeMeters = gaugeSourceBacked
    ? sourceGaugeMillimeters / 1000
    : METRO_GAUGE_FALLBACK_METERS;
  // These tags are source metadata. The animated train speed remains a
  // presentation value; this uses the mapped maxspeed only as its bounded
  // motion input, never as live timetable or telemetry evidence.
  const sourceMaxspeedKph = Number.parseFloat(ways[0].tags.maxspeed || '');
  const trainSpeed = Number.isFinite(sourceMaxspeedKph) && sourceMaxspeedKph > 0
    ? sourceMaxspeedKph / 3.6
    : METRO_TRAIN_SPEED_FALLBACK;
  const thirdRailSourceBacked = ways.every((way) => (
    way.tags.voltage === '750' && way.tags.frequency === '0'
  ));

  let nearestIndex = 0;
  let nearestDistance = Infinity;
  firstTrack.forEach((point, index) => {
    const distance = Math.hypot(point[0], point[1] + 90);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return {
    trackPaths,
    centerline,
    centerCurve,
    trainCurve,
    sourceWayIds: ways.map((way) => way.id),
    sourceNodeCounts: ways.map((way) => way.nodeRefs.length),
    sourceTrackTags: { ...ways[0].tags },
    trainLength: trainCurve.getLength(),
    initialProgress: nearestIndex / Math.max(1, firstTrack.length - 1),
    trackSeparation,
    gaugeMeters,
    gaugeSourceBacked,
    trainSpeed,
    thirdRailSourceBacked
  };
}

function nearestCenterlineFrame(trackData: MetroTrackData, point: LocalPoint) {
  let nearestPoint: LocalPoint = trackData.centerline[0] || point;
  let nearestTangent: LocalPoint = getTangent(trackData.centerline, 0);
  let nearestDistance = Infinity;
  let nearestProgress = 0;
  let travelledDistance = 0;
  const centerlineLength = trackData.centerCurve.getLength();
  for (let index = 1; index < trackData.centerline.length; index += 1) {
    const start = trackData.centerline[index - 1];
    const end = trackData.centerline[index];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const lengthSquared = dx * dx + dz * dz;
    const segmentLength = Math.sqrt(lengthSquared);
    const progress = lengthSquared > 0
      ? Math.max(0, Math.min(1, (
        (point[0] - start[0]) * dx + (point[1] - start[1]) * dz
      ) / lengthSquared))
      : 0;
    const candidate: LocalPoint = [
      start[0] + progress * dx,
      start[1] + progress * dz
    ];
    const distance = distanceBetween(point, candidate);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = candidate;
      const length = Math.hypot(dx, dz) || 1;
      nearestTangent = [dx / length, dz / length];
      nearestProgress = centerlineLength > 0
        ? (travelledDistance + progress * segmentLength) / centerlineLength
        : 0;
    }
    travelledDistance += segmentLength;
  }
  return {
    point: nearestPoint,
    angle: Math.atan2(nearestTangent[0], nearestTangent[1]),
    progress: nearestProgress,
    sourceSupportOffset: nearestDistance
  };
}

function isJunctionClearZone([x, z]: LocalPoint) {
  return Math.abs(z) < METRO_JUNCTION_CLEAR_HALF_LENGTH
    && Math.abs(x) < METRO_JUNCTION_CLEAR_HALF_WIDTH;
}

function findJunctionBoundaryDistances(trackData: MetroTrackData) {
  const length = trackData.centerCurve.getLength();
  if (length <= 0) return [];
  const sampleStep = 1;
  const boundaries: number[] = [];
  let previousDistance = 0;
  const initialPoint = trackData.centerCurve.getPointAt(0);
  let previousInside = isJunctionClearZone([initialPoint.x, initialPoint.z]);

  for (let distance = sampleStep; distance <= length; distance += sampleStep) {
    const currentDistance = Math.min(distance, length);
    const currentPoint = trackData.centerCurve.getPointAt(currentDistance / length);
    const currentInside = isJunctionClearZone([currentPoint.x, currentPoint.z]);
    if (currentInside !== previousInside) {
      let low = previousDistance;
      let high = currentDistance;
      for (let iteration = 0; iteration < 12; iteration += 1) {
        const middle = (low + high) / 2;
        const middlePoint = trackData.centerCurve.getPointAt(middle / length);
        const middleInside = isJunctionClearZone([middlePoint.x, middlePoint.z]);
        if (middleInside === previousInside) low = middle;
        else high = middle;
      }
      boundaries.push((low + high) / 2);
    }
    previousDistance = currentDistance;
    previousInside = currentInside;
    if (currentDistance >= length) break;
  }
  return boundaries;
}

function isPointInsidePolygon([x, z]: LocalPoint, polygon: LocalPoint[]) {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index++) {
    const [currentX, currentZ] = polygon[index];
    const [previousX, previousZ] = polygon[previousIndex];
    const crossesRay = (currentZ > z) !== (previousZ > z);
    if (!crossesRay) continue;
    const intersectionX = (previousX - currentX) * (z - currentZ) /
      (previousZ - currentZ) + currentX;
    if (x < intersectionX) inside = !inside;
  }
  return inside;
}

function pointToSegmentDistance(point: LocalPoint, start: LocalPoint, end: LocalPoint) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return distanceBetween(point, start);
  const progress = Math.max(0, Math.min(1, (
    (point[0] - start[0]) * dx + (point[1] - start[1]) * dz
  ) / lengthSquared));
  return distanceBetween(point, [
    start[0] + progress * dx,
    start[1] + progress * dz
  ]);
}

function pointToPolygonDistance(point: LocalPoint, polygon: LocalPoint[]) {
  if (polygon.length < 2) return Number.POSITIVE_INFINITY;
  if (polygon.length >= 3 && isPointInsidePolygon(point, polygon)) return 0;
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    nearest = Math.min(
      nearest,
      pointToSegmentDistance(point, polygon[index], polygon[(index + 1) % polygon.length])
    );
  }
  return nearest;
}

function isInsideSourceBuilding(
  point: LocalPoint,
  buildings: OSMPolylineFeature[],
  clearanceRadius = METRO_PIER_BASE_RADIUS + METRO_PIER_BUILDING_BUFFER
) {
  return buildings.some((building) => {
    if (building.geometry.length < 3) return false;
    const xs = building.geometry.map(([x]) => x);
    const zs = building.geometry.map(([, z]) => z);
    if (
      point[0] < Math.min(...xs) - clearanceRadius ||
      point[0] > Math.max(...xs) + clearanceRadius ||
      point[1] < Math.min(...zs) - clearanceRadius ||
      point[1] > Math.max(...zs) + clearanceRadius
    ) return false;
    return pointToPolygonDistance(point, building.geometry) <= clearanceRadius;
  });
}

function deduplicatePierFrames(frames: MetroPierFrame[]) {
  const accepted: MetroPierFrame[] = [];
  frames.forEach((frame) => {
    if (accepted.every((candidate) => (
      distanceBetween(candidate.point, frame.point) >= METRO_MIN_SOURCE_PIER_SPACING
    ))) {
      accepted.push(frame);
    }
  });
  return accepted.sort((left, right) => left.progress - right.progress);
}

function sourcePierFrames(
  trackData: MetroTrackData,
  sourceSupports: { id: string; position: LocalPoint }[],
  sourceBuildings: OSMPolylineFeature[],
  junctionBoundaries: number[]
): MetroPierFrame[] {
  if (sourceSupports.length) {
    return deduplicatePierFrames(sourceSupports
      .map((support) => {
        const frame = nearestCenterlineFrame(trackData, support.position);
        return {
          ...frame,
          sourceBacked: true,
          sourceSupportId: support.id
        };
      })
      .filter(({ point }) => (
        !isJunctionClearZone(point) && !isInsideSourceBuilding(point, sourceBuildings)
      )));
  }

  // The current extract has no explicitly metro-tagged supports. Keep a
  // deterministic modeled station grid centered on the exact source path;
  // never use nearby road supports as a proxy for metro construction.
  const length = trackData.centerCurve.getLength();
  const candidateDistances: number[] = [];

  for (let distance = 14; distance < length - 14; distance += METRO_PIER_SPACING) {
    candidateDistances.push(distance);
  }

  // Put the first modelled pier just outside each side of the mapped clear
  // box. This makes the crossover a deliberate span opening rather than an
  // accidental hole caused by the phase of a regular 28 m station grid.
  for (let index = 0; index + 1 < junctionBoundaries.length; index += 2) {
    candidateDistances.push(
      Math.max(14, junctionBoundaries[index] - METRO_JUNCTION_PIER_SETBACK),
      Math.min(length - 14, junctionBoundaries[index + 1] + METRO_JUNCTION_PIER_SETBACK)
    );
  }

  const frames = candidateDistances
    .sort((left, right) => left - right)
    .map((distance) => {
      const progress = distance / length;
      const point = trackData.centerCurve.getPointAt(progress);
      const tangent = trackData.centerCurve.getTangentAt(progress).normalize();
      return {
        point: [point.x, point.z] as LocalPoint,
        angle: Math.atan2(tangent.x, tangent.z),
        progress,
        sourceBacked: false
      };
    })
    // Keep the junction's below-grade carriageway and its mapped pedestrian
    // crossing open. The source alignment still spans this clear zone; only
    // the support station is skipped because this fallback has no pier nodes.
    .filter(({ point }) => !isJunctionClearZone(point));

  // The source extract has no metro pier nodes, so these are only candidate
  // stations. Never place a modeled column through a mapped building massing
  // footprint; leaving a longer span is more honest than rendering an
  // impossible collision. Road/median proximity is intentionally not a
  // rejection rule because an elevated metro pier may legitimately occupy a
  // carriageway median and OSM has no surveyed pier setback data here.
  return deduplicatePierFrames(frames.filter(({ point }) => !isInsideSourceBuilding(point, sourceBuildings)));
}

function createSleeperGeometry(
  paths: LocalPoint[][],
  spacing: number,
  width: number,
  height: number,
  y: number,
  depth: number
) {
  const pieces: THREE.BufferGeometry[] = [];
  const yAxis = new THREE.Vector3(0, 1, 0);

  paths.forEach((path) => {
    const curve = toPolylineCurve(path);
    const length = curve.getLength();
    for (let distance = 0; distance <= length; distance += spacing) {
      const progress = length > 0 ? distance / length : 0;
      const point = curve.getPointAt(progress);
      const tangent = curve.getTangentAt(progress).normalize();
      const piece = new THREE.BoxGeometry(width, height, depth);
      piece.applyMatrix4(
        new THREE.Matrix4().compose(
          new THREE.Vector3(point.x, y, point.z),
          new THREE.Quaternion().setFromAxisAngle(yAxis, Math.atan2(tangent.x, tangent.z)),
          new THREE.Vector3(1, 1, 1)
        )
      );
      pieces.push(piece);
    }
  });

  const geometry = mergeGeometries(pieces, false) || new THREE.BufferGeometry();
  pieces.forEach((piece) => piece.dispose());
  return geometry;
}

export const MetroViaduct: React.FC<MetroViaductProps> = ({ isNight }) => {
  const [snapshot, setSnapshot] = useState<MarathahalliDemoSnapshot | null>(null);
  const metroTrainRef = useRef<THREE.Group>(null);
  const trainProgressRef = useRef(0.9);

  useEffect(() => {
    let active = true;
    loadMarathahalliSnapshot()
      .then((nextSnapshot) => {
        if (active) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        // The OSM layer owns the visible fallback state. Keep this optional
        // detail layer silent if the local source snapshot cannot load.
      });
    return () => {
      active = false;
    };
  }, []);

  const trackData = useMemo(
    () => (snapshot ? buildMetroTrackData(snapshot) : null),
    [snapshot]
  );
  const sourceMetroSupportFeatures = useMemo(
    () => (snapshot
      ? snapshot.bridgeSupports.filter((support) => isNammaMetroPierSupport(
        support,
        snapshot.railways.filter(isNammaMetroMainlineWay)
      ))
      : []),
    [snapshot]
  );
  const junctionBoundaryDistances = useMemo(
    () => (trackData ? findJunctionBoundaryDistances(trackData) : []),
    [trackData]
  );
  const pierFrames = useMemo(
    () => (trackData
      ? sourcePierFrames(
        trackData,
        sourceMetroSupportFeatures,
        snapshot?.buildings || [],
        junctionBoundaryDistances
      )
      : []),
    [junctionBoundaryDistances, snapshot, sourceMetroSupportFeatures, trackData]
  );
  const parapetPaths = useMemo(
    () => (trackData ? trackData.trackPaths.flatMap((path) => [
      offsetPath(path, -(METRO_U_GIRDER_WIDTH / 2 - 0.12)),
      offsetPath(path, METRO_U_GIRDER_WIDTH / 2 - 0.12)
    ]) : []),
    [trackData]
  );
  const railPaths = useMemo(
    () => (trackData ? trackData.trackPaths.flatMap((path) => [
      offsetPath(path, -(trackData.gaugeMeters / 2)),
      offsetPath(path, trackData.gaugeMeters / 2)
    ]) : []),
    [trackData]
  );
  const thirdRailPaths = useMemo(
    () => (trackData ? trackData.trackPaths.flatMap((path) => [
      offsetPath(path, -(trackData.gaugeMeters / 2 + METRO_THIRD_RAIL_CLEARANCE)),
      offsetPath(path, trackData.gaugeMeters / 2 + METRO_THIRD_RAIL_CLEARANCE)
    ]) : []),
    [trackData]
  );

  const uGirderGeometry = useMemo(
    () => (trackData
      ? createUGirderGeometry(trackData.trackPaths, METRO_U_GIRDER_BOTTOM_Y)
      : null),
    [trackData]
  );

  const sleeperGeometry = useMemo(
    () => (trackData
      ? createSleeperGeometry(
        trackData.trackPaths,
        METRO_SLEEPER_SPACING,
        Math.max(METRO_TRACK_WIDTH, trackData.gaugeMeters + 0.55),
        0.08,
        METRO_DECK_CENTER_Y + 0.58,
        0.28
      )
      : null),
    [trackData]
  );

  const deckGeometry = useMemo(
    () => uGirderGeometry,
    [uGirderGeometry]
  );
  const underdeckGeometry = useMemo(
    () => (trackData
      ? createBeamGeometry(
        [trackData.centerline],
        Math.max(0.8, trackData.trackSeparation - METRO_U_GIRDER_WIDTH),
        0.18,
        METRO_U_GIRDER_BOTTOM_Y + 0.03,
        0.4
      )
      : null),
    [trackData]
  );
  const underdeckRibGeometry = useMemo(
    () => (trackData
      ? createTransverseBoxGeometry(
        pierFrames,
        Math.max(0.8, trackData.trackSeparation - METRO_U_GIRDER_WIDTH),
        0.16,
        METRO_U_GIRDER_BOTTOM_Y + 0.03,
        0.42
      )
      : null),
    [pierFrames, trackData]
  );
  const spanJointGeometry = useMemo(
    () => (trackData
      ? createSpanJointGeometry(
        trackData.trackPaths,
        pierFrames,
        METRO_U_GIRDER_WIDTH + 0.08,
        METRO_SPAN_JOINT_HEIGHT,
        METRO_U_GIRDER_BOTTOM_Y + METRO_SPAN_JOINT_HEIGHT / 2,
        METRO_SPAN_JOINT_DEPTH
      )
      : null),
    [pierFrames, trackData]
  );
  const parapetGeometry = useMemo(
    () => (parapetPaths.length
      ? createBeamGeometry(parapetPaths, 0.2, 0.24, METRO_U_GIRDER_TOP_Y + 0.02)
      : null),
    [parapetPaths]
  );
  const blueStripeGeometry = useMemo(
    () => (parapetPaths.length
      ? createBeamGeometry(parapetPaths, 0.08, 0.1, METRO_U_GIRDER_TOP_Y - 0.2)
      : null),
    [parapetPaths]
  );
  const railGeometry = useMemo(
    () => (railPaths.length ? createBeamGeometry(railPaths, 0.12, 0.12, METRO_RAIL_Y) : null),
    [railPaths]
  );
  const thirdRailGeometry = useMemo(
    () => (thirdRailPaths.length ? createBeamGeometry(thirdRailPaths, 0.1, 0.1, METRO_RAIL_Y + 0.08) : null),
    [thirdRailPaths]
  );
  useEffect(() => {
    if (trackData) trainProgressRef.current = trackData.initialProgress;
  }, [trackData]);

  useEffect(() => () => {
    deckGeometry?.dispose();
    underdeckGeometry?.dispose();
    underdeckRibGeometry?.dispose();
    parapetGeometry?.dispose();
    blueStripeGeometry?.dispose();
    railGeometry?.dispose();
    thirdRailGeometry?.dispose();
    sleeperGeometry?.dispose();
    spanJointGeometry?.dispose();
  }, [blueStripeGeometry, deckGeometry, parapetGeometry, railGeometry, sleeperGeometry, spanJointGeometry, thirdRailGeometry, underdeckGeometry, underdeckRibGeometry]);

  useFrame((_, delta) => {
    if (!metroTrainRef.current || !trackData) return;
    trainProgressRef.current = (trainProgressRef.current
      + (trackData.trainSpeed * delta) / Math.max(1, trackData.trainLength)) % 1;
    const progress = trainProgressRef.current;
    const point = trackData.trainCurve.getPointAt(progress);
    const tangent = trackData.trainCurve.getTangentAt(progress).normalize();
    metroTrainRef.current.position.set(point.x, METRO_TRAIN_Y, point.z);
    metroTrainRef.current.rotation.y = Math.atan2(tangent.x, tangent.z);
  });

  if (!trackData) return null;

  const concreteMaterial = isNight ? '#a3b1c0' : '#d7e0e8';
  const shadowMaterial = isNight ? '#718096' : '#aebdca';
  const soffitEmissive = isNight ? '#111827' : '#334155';
  const soffitEmissiveIntensity = isNight ? 0.24 : 0.2;
  // The cap spans both source-aligned U-girders with a restrained overhang;
  // it is not a road barrier. Bearing pads remain tied to the source-derived
  // centre separation so the deck stays aligned even when OSM is refreshed.
  const pierCapWidth = getPierCapWidth(trackData);
  const underdeckBottom = METRO_DECK_CENTER_Y
    - METRO_UNDERDECK_CENTER_DROP
    - METRO_UNDERDECK_HEIGHT / 2;
  const bearingStackHeight = METRO_BEARING_BASE_HEIGHT + METRO_BEARING_PAD_HEIGHT;
  // Keep the full modeled bearing stack below the modeled underdeck. OSM
  // supplies the plan alignment, not a surveyed vertical section or pier
  // elevation. The validator checks this ordering and the road-clearance
  // comparison as a renderer contract only.
  const pierCapTop = underdeckBottom
    - bearingStackHeight
    - METRO_BEARING_TO_DECK_CLEARANCE;
  const bearingPositions = [-1, 1].flatMap((trackSide) => {
    const trackCentre = trackSide * trackData.trackSeparation / 2;
    return [
      trackCentre - METRO_BEARING_PAIR_SPACING / 2,
      trackCentre + METRO_BEARING_PAIR_SPACING / 2
    ];
  });
  const modelledGradeClearance = underdeckBottom;
  const modelledRoadDeckClearance = underdeckBottom - METRO_REFERENCE_ROAD_DECK_TOP_Y;
  const roadClearanceContract = modelledRoadDeckClearance >= METRO_REFERENCE_ROAD_CLEARANCE_BUFFER
    ? `passes ${METRO_REFERENCE_ROAD_CLEARANCE_BUFFER.toFixed(2)} m model buffer`
    : `below ${METRO_REFERENCE_ROAD_CLEARANCE_BUFFER.toFixed(2)} m model buffer`;
  const junctionOpeningSpan = junctionBoundaryDistances.length >= 2
    ? junctionBoundaryDistances[1] - junctionBoundaryDistances[0] + METRO_JUNCTION_PIER_SETBACK * 2
    : 0;

  return (
    <group
      name="NammaMetroPhase2A_SourcePlan_ModelledStructure"
      userData={{
        modelStatus: 'source-backed plan alignment; modelled vertical and structural detail',
        sourceProvider: 'OpenStreetMap local extract; source geometry is node-linked',
        sourceSnapshot: 'public/data/marathahalli-demo.json',
        sourceWayIds: trackData.sourceWayIds.join(', '),
        sourceWayNodeCounts: trackData.sourceNodeCounts.join(', '),
        sourceTags: Object.entries(trackData.sourceTrackTags)
          .map(([key, value]) => `${key}=${value}`)
          .join('; '),
        sourceElevationEvidence: 'none; OSM layer=2 is relative topology, not metre elevation or clearance',
        alignment: 'OSM mainline ways way/1551136768 and way/1551136770; siding way/1551136769 excluded',
        elevation: 'modelled display elevation; not survey-derived',
        structure: 'modelled twin precast U-girders, octagonal tapered RCC pier, flared capital, precast crosshead, four bearings per support, and span joints; 28 m candidate stationing',
        minimumSoffit: `${METRO_MIN_SOFFIT_Y.toFixed(2)} m model baseline; not surveyed clearance`,
        roadClearance: `${modelledGradeClearance.toFixed(2)} m above local grade and ${modelledRoadDeckClearance.toFixed(2)} m above the modeled road-viaduct comparison datum; ${roadClearanceContract}; modelled only`,
        supportEvidence: sourceMetroSupportFeatures.length
          ? 'OSM explicit Namma Metro pier supports, projected onto the source centerline'
          : 'none in extract; modelled regular pier grid, with generic ORR bridge piers excluded',
        supportPlacement: `modelled source-footprint exclusion radius ${(METRO_PIER_BASE_RADIUS + METRO_PIER_BUILDING_BUFFER).toFixed(2)} m; junction clear box ±${METRO_JUNCTION_CLEAR_HALF_WIDTH} m x ±${METRO_JUNCTION_CLEAR_HALF_LENGTH} m`,
        crossoverOpening: junctionOpeningSpan > 0
          ? `${junctionOpeningSpan.toFixed(1)} m modelled no-pier span along source alignment; boundary piers set back ${METRO_JUNCTION_PIER_SETBACK.toFixed(1)} m`
          : 'no source-alignment intersection with the modelled crossover clear box',
        spanJoints: `${pierFrames.length} modelled span joint locations follow support stationing; span segmentation is not present in OSM`,
        gauge: trackData.gaugeSourceBacked ? 'OSM gauge=1435' : 'modelled fallback gauge',
        trackCentreSpacing: `OSM paired-way median ${trackData.trackSeparation.toFixed(2)} m; target about ${METRO_TARGET_TRACK_CENTRE_SPACING.toFixed(2)} m`,
        bearings: `modelled four bearing stacks ${bearingStackHeight.toFixed(2)} m high below the twin U-girders at source-derived track centres`,
        thirdRail: trackData.thirdRailSourceBacked
          ? 'OSM voltage=750 frequency=0'
          : 'not rendered without source electrical evidence'
      }}
    >
      {pierFrames.map(({ point, angle, sourceBacked, sourceSupportId, sourceSupportOffset }, index) => {
        const pierCapBottom = pierCapTop - METRO_PIER_CAP_HEIGHT;
        const columnBase = METRO_PIER_BASE_TOP_Y;
        const capitalBottom = pierCapBottom - METRO_PIER_CAPITAL_HEIGHT + METRO_PIER_CAPITAL_OVERLAP;
        const columnTop = capitalBottom + 0.08;
        const columnHeight = Math.max(0.1, columnTop - columnBase);
        return (
          <group
            key={`metro-source-pier-${index}`}
            position={[point[0], 0, point[1]]}
            rotation={[0, angle, 0]}
            userData={{
              modelStatus: sourceBacked
                ? 'source support evidence; centerline-projected placement'
                : 'modelled support station on source-aligned centerline',
              supportProvenance: sourceBacked
                ? 'OSM explicit Namma Metro support'
                : 'modelled support on source-aligned centerline; no ORR support reuse',
              sourceSupportId: sourceSupportId || 'none',
              sourceSupportOffset: sourceSupportOffset === undefined
                ? 'n/a'
                : `${sourceSupportOffset.toFixed(2)} m from source support node to centerline projection`,
              buildingClearance: `${(METRO_PIER_BASE_RADIUS + METRO_PIER_BUILDING_BUFFER).toFixed(2)} m source-footprint exclusion; not a structural survey`
            }}
          >
            {/* A shallow octagonal RCC plinth keeps the support legible without
                creating a cage or a visual roadblock at the junction. */}
            <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[METRO_PIER_BASE_RADIUS, METRO_PIER_BASE_RADIUS + 0.12, 0.36, 8]} />
              <meshStandardMaterial color={shadowMaterial} roughness={0.9} metalness={0.03} />
            </mesh>
            <mesh position={[0, columnBase + columnHeight / 2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[METRO_PIER_SHAFT_RADIUS, METRO_PIER_SHAFT_RADIUS + 0.1, columnHeight, 8]} />
              <meshStandardMaterial color={concreteMaterial} roughness={0.86} metalness={0.04} />
            </mesh>
            {/* A flared capital is the cast-in-place transition into the
                precast cap, not a second column. */}
            <mesh position={[0, capitalBottom + METRO_PIER_CAPITAL_HEIGHT / 2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[METRO_PIER_SHAFT_RADIUS + 0.22, METRO_PIER_SHAFT_RADIUS + 0.02, METRO_PIER_CAPITAL_HEIGHT, 8]} />
              <meshStandardMaterial color={concreteMaterial} roughness={0.86} metalness={0.04} />
            </mesh>
            {/* Modelled precast pier cap: its long axis is perpendicular to
                the source ways because the parent group carries the source
                tangent rotation. */}
            <mesh position={[0, pierCapTop - METRO_PIER_CAP_HEIGHT / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[pierCapWidth, METRO_PIER_CAP_HEIGHT, METRO_PIER_CAP_DEPTH]} />
              <meshStandardMaterial color={concreteMaterial} roughness={0.86} metalness={0.04} />
            </mesh>
            <mesh position={[0, pierCapTop - 0.07, 0]} castShadow receiveShadow>
              <boxGeometry args={[pierCapWidth + 0.12, 0.14, METRO_PIER_CAP_DEPTH + 0.1]} />
              <meshStandardMaterial color={shadowMaterial} roughness={0.84} metalness={0.04} />
            </mesh>
            {bearingPositions.map((offset, bearingIndex) => (
              <group key={`metro-bearing-${index}-${bearingIndex}`} position={[offset, pierCapTop, 0]}>
                <mesh position={[0, METRO_BEARING_BASE_HEIGHT / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.92, METRO_BEARING_BASE_HEIGHT, 1.12]} />
                  <meshStandardMaterial color="#334155" roughness={0.72} metalness={0.16} />
                </mesh>
                <mesh position={[0, METRO_BEARING_BASE_HEIGHT + METRO_BEARING_PAD_HEIGHT / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.76, METRO_BEARING_PAD_HEIGHT, 0.9]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.58} metalness={0.24} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {underdeckGeometry && (
        <mesh name="MetroTwinUGirderCentreClosure_Modelled" geometry={underdeckGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={shadowMaterial}
            emissive={soffitEmissive}
            emissiveIntensity={soffitEmissiveIntensity}
            roughness={0.9}
            metalness={0.04}
          />
        </mesh>
      )}
      {underdeckRibGeometry && (
        <mesh name="MetroPierDiaphragms_Modelled" geometry={underdeckRibGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={shadowMaterial}
            emissive={soffitEmissive}
            emissiveIntensity={soffitEmissiveIntensity + 0.04}
            roughness={0.88}
            metalness={0.04}
          />
        </mesh>
      )}
      {deckGeometry && (
        <mesh name="MetroTwinPrecastUGirders_SourceAligned" geometry={deckGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={concreteMaterial}
            emissive={soffitEmissive}
            emissiveIntensity={isNight ? 0.18 : 0.12}
            roughness={0.82}
            metalness={0.04}
          />
        </mesh>
      )}
      {spanJointGeometry && (
        <mesh name="MetroSpanJoints_ModelledAtSupports" geometry={spanJointGeometry} castShadow>
          <meshStandardMaterial
            color={isNight ? '#475569' : '#64748b'}
            roughness={0.92}
            metalness={0.03}
          />
        </mesh>
      )}
      {parapetGeometry && (
        <mesh geometry={parapetGeometry} castShadow>
          <meshStandardMaterial
            color={shadowMaterial}
            emissive={soffitEmissive}
            emissiveIntensity={soffitEmissiveIntensity * 0.45}
            roughness={0.78}
            metalness={0.08}
          />
        </mesh>
      )}
      {blueStripeGeometry && (
        <mesh geometry={blueStripeGeometry}>
          <meshStandardMaterial color="#0284c7" roughness={0.32} metalness={0.25} />
        </mesh>
      )}
      {sleeperGeometry && (
        <mesh geometry={sleeperGeometry}>
          <meshStandardMaterial color="#475569" roughness={0.82} metalness={0.16} />
        </mesh>
      )}
      {railGeometry && (
        <mesh geometry={railGeometry}>
          <meshStandardMaterial color="#e2e8f0" roughness={0.12} metalness={0.95} />
        </mesh>
      )}
      {trackData.thirdRailSourceBacked && thirdRailGeometry && (
        <mesh geometry={thirdRailGeometry}>
          <meshStandardMaterial color="#facc15" roughness={0.38} metalness={0.5} />
        </mesh>
      )}

      <group ref={metroTrainRef} position={[0, METRO_TRAIN_Y, 0]}>
        <MetroTrainCar position={[0, 1.35, 30]} isHead isNight={isNight} />
        <MetroTrainCar position={[0, 1.35, 15]} isNight={isNight} />
        <MetroTrainCar position={[0, 1.35, 0]} isNight={isNight} />
        <MetroTrainCar position={[0, 1.35, -15]} isNight={isNight} />
        <MetroTrainCar position={[0, 1.35, -30]} isNight={isNight} />
        <MetroTrainCar position={[0, 1.35, -45]} isTail isNight={isNight} />
      </group>
    </group>
  );
};

const MetroTrainCar: React.FC<{
  position: [number, number, number];
  isHead?: boolean;
  isTail?: boolean;
  isNight: boolean;
}> = ({ position, isHead = false, isTail = false, isNight }) => (
  <group position={position}>
    <mesh castShadow>
      <boxGeometry args={[2.7, 2.6, 14]} />
      <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
    </mesh>

    <mesh position={[-1.37, 0, 0]}>
      <boxGeometry args={[0.02, 0.4, 13.8]} />
      <meshStandardMaterial color="#0284c7" roughness={0.3} />
    </mesh>
    <mesh position={[1.37, 0, 0]}>
      <boxGeometry args={[0.02, 0.4, 13.8]} />
      <meshStandardMaterial color="#0284c7" roughness={0.3} />
    </mesh>

    <mesh position={[-1.37, 0.4, 0]}>
      <boxGeometry args={[0.02, 0.7, 13.0]} />
      <meshStandardMaterial
        color={isNight ? '#93c5fd' : '#1e293b'}
        emissive={isNight ? '#3b82f6' : '#000000'}
        emissiveIntensity={isNight ? 1.8 : 0}
      />
    </mesh>
    <mesh position={[1.37, 0.4, 0]}>
      <boxGeometry args={[0.02, 0.7, 13.0]} />
      <meshStandardMaterial
        color={isNight ? '#93c5fd' : '#1e293b'}
        emissive={isNight ? '#3b82f6' : '#000000'}
        emissiveIntensity={isNight ? 1.8 : 0}
      />
    </mesh>

    {isHead && (
      <group position={[0, 0.3, 7.1]}>
        <mesh position={[-0.7, 0, 0]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#fffae0" emissiveIntensity={isNight ? 5 : 2} />
        </mesh>
        <mesh position={[0.7, 0, 0]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#fffae0" emissiveIntensity={isNight ? 5 : 2} />
        </mesh>
        {isNight && (
          <pointLight position={[0, 0, 2]} intensity={25} distance={35} color="#fffbe6" />
        )}
      </group>
    )}

    {isTail && (
      <group position={[0, 0.3, -7.1]}>
        <mesh position={[-0.7, 0, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={isNight ? 4 : 1.5} />
        </mesh>
        <mesh position={[0.7, 0, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={isNight ? 4 : 1.5} />
        </mesh>
      </group>
    )}
  </group>
);

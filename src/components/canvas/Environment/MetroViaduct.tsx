import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  MarathahalliDemoSnapshot,
  OSMPolylineFeature,
  isNammaMetroMainlineWay,
  isNammaMetroPierSupport
} from '../../../data/marathahalliDemo';
import { loadMarathahalliSnapshot } from '../../../services/marathahalliSnapshot';

interface MetroViaductProps {
  isNight: boolean;
}

type LocalPoint = [number, number];

const METRO_DECK_CENTER_Y = 13.2;
const METRO_DECK_WIDTH = 8.5;
const METRO_TRACK_WIDTH = 2.75;
const METRO_RAIL_Y = METRO_DECK_CENTER_Y + 0.7;
const METRO_TRAIN_Y = METRO_DECK_CENTER_Y + 0.68;
const METRO_PIER_SPACING = 32;
const METRO_SAMPLE_SPACING = 8;
const METRO_TRAIN_SPEED_FALLBACK = 22;
const METRO_SLEEPER_SPACING = 4;
const METRO_GAUGE_FALLBACK_METERS = 1.435;
const METRO_THIRD_RAIL_CLEARANCE = 0.34;
// The source ways carry a relative OSM layer (layer=2), not survey elevations.
// These are display elevations for the modeled viaduct detail only.
const METRO_JUNCTION_CLEAR_HALF_LENGTH = 42;
const METRO_JUNCTION_CLEAR_HALF_WIDTH = 14;

interface MetroTrackData {
  trackPaths: LocalPoint[][];
  centerline: LocalPoint[];
  centerCurve: THREE.Curve<THREE.Vector3>;
  trainCurve: THREE.Curve<THREE.Vector3>;
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
  sourceBacked: boolean;
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

function buildMetroTrackData(snapshot: MarathahalliDemoSnapshot): MetroTrackData | null {
  const ways = snapshot.railways
    .filter(isNammaMetroMainlineWay)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (ways.length < 2) return null;

  const sourceCurves = ways.slice(0, 2).map(sourceCurve);
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
  )));
  const sourceGaugeMillimeters = Number.parseFloat(sourceCurves.length
    ? (ways[0].tags.gauge || '')
    : '');
  const gaugeSourceBacked = Number.isFinite(sourceGaugeMillimeters) && sourceGaugeMillimeters > 0;
  const gaugeMeters = gaugeSourceBacked
    ? sourceGaugeMillimeters / 1000
    : METRO_GAUGE_FALLBACK_METERS;
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
    trainLength: trainCurve.getLength(),
    initialProgress: nearestIndex / Math.max(1, firstTrack.length - 1),
    trackSeparation: trackSeparation || METRO_DECK_WIDTH - METRO_TRACK_WIDTH - 0.5,
    gaugeMeters,
    gaugeSourceBacked,
    trainSpeed,
    thirdRailSourceBacked
  };
}

function nearestCenterlineFrame(trackData: MetroTrackData, point: LocalPoint) {
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  trackData.centerline.forEach((candidate, index) => {
    const distance = distanceBetween(point, candidate);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  const tangent = getTangent(trackData.centerline, nearestIndex);
  return {
    point,
    angle: Math.atan2(tangent[0], tangent[1])
  };
}

function isJunctionClearZone([x, z]: LocalPoint) {
  return Math.abs(z) < METRO_JUNCTION_CLEAR_HALF_LENGTH
    && Math.abs(x) < METRO_JUNCTION_CLEAR_HALF_WIDTH;
}

function sourcePierFrames(trackData: MetroTrackData, sourceSupports: LocalPoint[]): MetroPierFrame[] {
  if (sourceSupports.length) {
    return sourceSupports
      .filter((point) => !isJunctionClearZone(point))
      .map((point) => ({
        ...nearestCenterlineFrame(trackData, point),
        sourceBacked: true
      }));
  }

  // The current extract has no explicitly metro-tagged supports. Keep a
  // deterministic modeled station grid centered on the exact source path;
  // never use nearby road supports as a proxy for metro construction.
  const length = trackData.centerCurve.getLength();
  const frames: MetroPierFrame[] = [];

  for (let distance = 18; distance < length - 18; distance += METRO_PIER_SPACING) {
    const progress = distance / length;
    const point = trackData.centerCurve.getPointAt(progress);

    // Keep the junction's below-grade carriageway and its mapped pedestrian
    // crossing open. The source alignment still spans this clear zone; only
    // the support station is skipped because this fallback has no pier nodes.
    if (isJunctionClearZone([point.x, point.z])) continue;

    const tangent = trackData.centerCurve.getTangentAt(progress).normalize();
    frames.push({
      point: [point.x, point.z],
      angle: Math.atan2(tangent.x, tangent.z),
      sourceBacked: false
    });
  }
  return frames;
}

function createTransverseBeamGeometry(
  frames: MetroPierFrame[],
  width: number,
  height: number,
  y: number,
  depth: number
) {
  const pieces: THREE.BufferGeometry[] = [];
  const yAxis = new THREE.Vector3(0, 1, 0);

  frames.forEach(({ point, angle }) => {
    const piece = new THREE.BoxGeometry(width, height, depth);
    piece.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3(point[0], y, point[1]),
        new THREE.Quaternion().setFromAxisAngle(yAxis, angle),
        new THREE.Vector3(1, 1, 1)
      )
    );
    pieces.push(piece);
  });

  const geometry = mergeGeometries(pieces, false) || new THREE.BufferGeometry();
  pieces.forEach((piece) => piece.dispose());
  return geometry;
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
  const pierFrames = useMemo(
    () => (trackData
      ? sourcePierFrames(trackData, sourceMetroSupportFeatures.map((support) => support.position))
      : []),
    [sourceMetroSupportFeatures, trackData]
  );
  const parapetPaths = useMemo(
    () => (trackData ? trackData.trackPaths.flatMap((path) => [
      offsetPath(path, -1.18),
      offsetPath(path, 1.18)
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

  const sleeperGeometry = useMemo(
    () => (trackData
      ? createSleeperGeometry(
        trackData.trackPaths,
        METRO_SLEEPER_SPACING,
        trackData.gaugeMeters + 0.55,
        0.08,
        METRO_DECK_CENTER_Y + 0.58,
        0.28
      )
      : null),
    [trackData]
  );

  const deckGeometry = useMemo(
    () => (trackData ? createBeamGeometry(trackData.trackPaths, METRO_TRACK_WIDTH, 1.05, METRO_DECK_CENTER_Y) : null),
    [trackData]
  );
  const underdeckGeometry = useMemo(
    () => (trackData ? createBeamGeometry([trackData.centerline], METRO_DECK_WIDTH, 0.46, METRO_DECK_CENTER_Y - 0.68, 0.4) : null),
    [trackData]
  );
  const underdeckRibGeometry = useMemo(
    () => (trackData
      ? createBeamGeometry(trackData.trackPaths, 0.3, 0.34, METRO_DECK_CENTER_Y - 0.82, 0.36)
      : null),
    [trackData]
  );
  const parapetGeometry = useMemo(
    () => (parapetPaths.length ? createBeamGeometry(parapetPaths, 0.24, 1.2, METRO_DECK_CENTER_Y + 1.0) : null),
    [parapetPaths]
  );
  const blueStripeGeometry = useMemo(
    () => (parapetPaths.length ? createBeamGeometry(parapetPaths, 0.1, 0.28, METRO_DECK_CENTER_Y + 0.54) : null),
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
  const pierJointGeometry = useMemo(
    () => (pierFrames.length
      ? createTransverseBeamGeometry(
        pierFrames,
        Math.max(METRO_DECK_WIDTH, trackData?.trackSeparation || METRO_DECK_WIDTH),
        0.06,
        METRO_DECK_CENTER_Y + 0.54,
        0.14
      )
      : null),
    [pierFrames, trackData]
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
    pierJointGeometry?.dispose();
  }, [blueStripeGeometry, deckGeometry, parapetGeometry, pierJointGeometry, railGeometry, sleeperGeometry, thirdRailGeometry, underdeckGeometry, underdeckRibGeometry]);

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
  const pierCapWidth = Math.max(
    METRO_DECK_WIDTH + 0.65,
    trackData.trackSeparation + METRO_TRACK_WIDTH + 0.9
  );
  const bearingOffset = trackData.trackSeparation / 2;

  return (
    <group
      name="NammaMetroPhase2A_SourceAlignment_ModelledElevation"
      userData={{
        alignment: 'OSM mainline ways 1551136768 and 1551136770',
        elevation: 'modelled display elevation; OSM layer=2 is relative only',
        supports: sourceMetroSupportFeatures.length
          ? 'OSM explicit Namma Metro pier supports'
          : 'modelled regular pier grid; extract has no explicit Namma Metro pier supports',
        gauge: trackData.gaugeSourceBacked ? 'OSM gauge=1435' : 'modelled fallback gauge',
        thirdRail: trackData.thirdRailSourceBacked
          ? 'OSM voltage=750 frequency=0'
          : 'not rendered without source electrical evidence'
      }}
    >
      {pierFrames.map(({ point, angle, sourceBacked }, index) => {
        const columnTop = METRO_DECK_CENTER_Y - 0.75;
        const columnBase = 0.08;
        const columnHeight = columnTop - columnBase;
        return (
          <group
            key={`metro-source-pier-${index}`}
            position={[point[0], 0, point[1]]}
            rotation={[0, angle, 0]}
            userData={{
              supportProvenance: sourceBacked
                ? 'OSM explicit Namma Metro support'
                : 'modelled support on source-aligned centerline'
            }}
          >
            <mesh position={[0, columnBase + 0.08, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.9, 0.16, 2.35]} />
              <meshStandardMaterial color={shadowMaterial} roughness={0.9} metalness={0.03} />
            </mesh>
            <mesh position={[0, columnBase + columnHeight / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.2, columnHeight, 1.0]} />
              <meshStandardMaterial color={concreteMaterial} roughness={0.86} metalness={0.04} />
            </mesh>
            <mesh position={[0, columnTop - 0.36, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.8, 0.58, 1.4]} />
              <meshStandardMaterial color={concreteMaterial} roughness={0.86} metalness={0.04} />
            </mesh>
            <mesh position={[0, columnBase + 0.34, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.3, 0.68, 1.9]} />
              <meshStandardMaterial color={shadowMaterial} roughness={0.9} metalness={0.03} />
            </mesh>
            <mesh position={[0, columnTop - 0.22, 0]} castShadow receiveShadow>
              <boxGeometry args={[pierCapWidth, 0.88, 2.3]} />
              <meshStandardMaterial color={concreteMaterial} roughness={0.86} metalness={0.04} />
            </mesh>
            <mesh position={[-bearingOffset, columnTop + 0.26, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.95, 0.18, 1.1]} />
              <meshStandardMaterial color="#475569" roughness={0.72} metalness={0.12} />
            </mesh>
            <mesh position={[bearingOffset, columnTop + 0.26, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.95, 0.18, 1.1]} />
              <meshStandardMaterial color="#475569" roughness={0.72} metalness={0.12} />
            </mesh>
          </group>
        );
      })}

      {underdeckGeometry && (
        <mesh geometry={underdeckGeometry} castShadow receiveShadow>
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
        <mesh geometry={underdeckRibGeometry} castShadow receiveShadow>
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
        <mesh geometry={deckGeometry} castShadow receiveShadow>
          <meshStandardMaterial color={concreteMaterial} roughness={0.82} metalness={0.04} />
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
      {pierJointGeometry && (
        <mesh geometry={pierJointGeometry}>
          <meshStandardMaterial color="#64748b" roughness={0.8} metalness={0.08} />
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

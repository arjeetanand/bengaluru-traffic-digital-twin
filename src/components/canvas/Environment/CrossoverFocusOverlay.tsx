import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  createSourceReplayCurve,
  getSourceReplayProgressAtVertex,
  SOURCE_CROSSOVER_CROSSING_TRACES,
  U_TURN_CONNECTORS
} from '../../../data/marathahalliLaneNetwork';
import type { LanePoint, UTurnConnector, UTurnPhaseId } from '../../../data/marathahalliLaneNetwork';
import { createCurveLineGeometry, createRoadRibbonGeometry } from '../../../data/RealRoadData';
import { createCarGeometry } from '../traffic/VehicleModels';

interface CrossoverFocusOverlayProps {
  isNight?: boolean;
  cameraMode?: 'walk' | 'overview';
}

const createConnectorCurve = (points: readonly [number, number, number][]) => (
  createSourceReplayCurve(points, 0.18)
);

// The source curve remains the exact OSM vertex trace. These display curves
// only smooth that trace for a human-readable replay; they do not replace the
// source geometry or imply a surveyed turning radius.
const createModelledReplayCurve = (points: readonly LanePoint[]) => (
  new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y + 0.18, z)),
    false,
    'centripetal',
    0.25
  )
);

// OSM does not publish lane widths for these ways. This is a restrained
// display width for the source-linked scenario lane; the surrounding OSM
// carriageway remains the authoritative pavement surface.
const MODELLED_REPLAY_LANE_WIDTH_METERS = 2.6;
const MODELLED_REPLAY_CENTER_GAP_METERS = 0.2;
const MODELLED_REPLAY_WIDTH_METERS = (MODELLED_REPLAY_LANE_WIDTH_METERS * 2)
  + MODELLED_REPLAY_CENTER_GAP_METERS;
const MODELLED_REPLAY_LANE_OFFSET = (MODELLED_REPLAY_LANE_WIDTH_METERS / 2)
  + (MODELLED_REPLAY_CENTER_GAP_METERS / 2);
const MODELLED_REPLAY_CURB_OFFSET = MODELLED_REPLAY_WIDTH_METERS / 2 + 0.16;
const MODELLED_REPLAY_CURB_WIDTH_METERS = 0.26;
const MODELLED_REPLAY_CURB_HEIGHT_METERS = 0.16;
const MODELLED_CONFLICT_BUFFER_WIDTH_METERS = MODELLED_REPLAY_WIDTH_METERS + 1.2;
const MODELLED_SIGNAL_OFFSET = MODELLED_REPLAY_CURB_OFFSET + 1.25;
const SOURCE_CROSSING_WIDTH_METERS = 1.8;

const REPLAY_SPEED_METERS_PER_SECOND = 6.4;
const REPLAY_YIELD_WINDOW = 0.055;
const REPLAY_HOLD_GAP_METERS = 2.3;
const REPLAY_HANDOFF_DELAY_SECONDS = 0.75;
const REPLAY_GEOMETRY_SAMPLE_COUNT = 96;
const REPLAY_SOURCE_TRACE_Y = 0.34;

type ReplayVehicleId = 'north' | 'south';

interface ReplayConflictState {
  owner: ReplayVehicleId;
  clock: number;
  lastCompleted: ReplayVehicleId | null;
  lastTransferAt: number;
  handoffUntil: number;
}

const CROSSOVER_PHASES: readonly {
  id: UTurnPhaseId;
  label: string;
  color: string;
}[] = [
  { id: 'approach', label: 'APPROACH', color: '#38bdf8' },
  { id: 'yield', label: 'YIELD', color: '#fbbf24' },
  { id: 'sweep', label: 'SWEEP', color: '#fb923c' },
  { id: 'exit', label: 'EXIT', color: '#4ade80' }
];

interface ReplayPhaseFrame {
  id: UTurnPhaseId;
  label: string;
  color: string;
  startProgress: number;
  endProgress: number;
  progress: number;
  sourceWayIds: readonly string[];
}

interface ReplayConflictWindow {
  startProgress: number;
  endProgress: number;
  holdProgress: number;
}

function getSafeCurveTangent(
  curve: THREE.Curve<THREE.Vector3>,
  progress: number
) {
  const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const tangent = curve.getTangentAt(clampedProgress).setY(0);
  if (tangent.lengthSq() >= 0.000001) return tangent.normalize();

  const lookBehind = curve.getPointAt(Math.max(0, clampedProgress - 0.002));
  const lookAhead = curve.getPointAt(Math.min(1, clampedProgress + 0.002));
  tangent.subVectors(lookAhead, lookBehind).setY(0);
  return tangent.lengthSq() >= 0.000001
    ? tangent.normalize()
    : new THREE.Vector3(0, 0, 1);
}

function getReplayProgressAtSourceVertex(
  connector: UTurnConnector,
  vertexIndex: number,
  curve?: THREE.Curve<THREE.Vector3>
) {
  const sourceProgress = getSourceReplayProgressAtVertex(connector.points, vertexIndex);
  if (!curve) return sourceProgress;

  // Catmull-Rom smoothing still passes through the source vertices, but its
  // arc-length parametrisation is not identical to the source polyline. Find
  // the nearest point in a small stationing window so phase boundaries remain
  // anchored to the exact source vertex rather than an arbitrary percentage.
  const target = connector.points[Math.max(0, Math.min(connector.points.length - 1, vertexIndex))];
  let bestProgress = sourceProgress;
  let bestDistance = Number.POSITIVE_INFINITY;
  const window = 0.08;
  for (let index = 0; index <= 48; index += 1) {
    const progress = THREE.MathUtils.lerp(
      Math.max(0, sourceProgress - window),
      Math.min(1, sourceProgress + window),
      index / 48
    );
    const point = curve.getPointAt(progress);
    const distance = Math.hypot(point.x - target[0], point.z - target[2]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestProgress = progress;
    }
  }
  return bestProgress;
}

function getReplayPhaseFrames(
  connector: UTurnConnector,
  curve?: THREE.Curve<THREE.Vector3>
): ReplayPhaseFrame[] {
  return CROSSOVER_PHASES.map((phase) => {
    const range = connector.phaseRanges[phase.id];
    const startProgress = getReplayProgressAtSourceVertex(connector, range.startVertex, curve);
    const endProgress = getReplayProgressAtSourceVertex(connector, range.endVertex, curve);
    return {
      ...phase,
      startProgress,
      endProgress,
      progress: THREE.MathUtils.lerp(startProgress, endProgress, 0.5),
      sourceWayIds: range.sourceWayIds
    };
  });
}

function getReplayConflictWindow(
  connector: UTurnConnector,
  curve: THREE.Curve<THREE.Vector3>
): ReplayConflictWindow {
  const phases = getReplayPhaseFrames(connector, curve);
  const sweep = phases.find((phase) => phase.id === 'sweep') || phases[0];
  const holdGap = Math.min(
    0.028,
    Math.max(0.008, REPLAY_HOLD_GAP_METERS / Math.max(1, curve.getLength()))
  );
  return {
    startProgress: sweep.startProgress,
    endProgress: sweep.endProgress,
    holdProgress: Math.max(0, sweep.startProgress - holdGap)
  };
}

function getReplayPhase(progress: number, phases: readonly ReplayPhaseFrame[]) {
  return phases.find((phase, index) => (
    progress >= phase.startProgress && (
      progress < phase.endProgress || index === phases.length - 1
    )
  )) || phases[0];
}

function wrappedProgressDistance(progress: number, target: number) {
  const directDistance = Math.abs(progress - target);
  return Math.min(directDistance, 1 - directDistance);
}

function getReplayDynamics(
  progress: number,
  stopProgress: number,
  phases: readonly ReplayPhaseFrame[]
) {
  const yieldStrength = THREE.MathUtils.smoothstep(
    REPLAY_YIELD_WINDOW - wrappedProgressDistance(progress, stopProgress),
    0,
    REPLAY_YIELD_WINDOW
  );

  const phase = getReplayPhase(progress, phases);
  const phaseSpeedFactor = phase.id === 'yield'
    ? 0.46
    : phase.id === 'sweep'
      ? 0.7
      : phase.id === 'exit'
        ? 0.9
        : 1;

  return {
    // A modeled yield is intentionally a rolling slowdown rather than a hard
    // stop: it makes the replay read like a driver approaching the crossover
    // while avoiding a frozen hero car in the audit view.
    speedFactor: phaseSpeedFactor * THREE.MathUtils.lerp(1, 0.28, yieldStrength),
    yieldStrength,
    inTurnWindow: phase.id === 'yield' || phase.id === 'sweep',
    phaseId: phase.id
  };
}

function getOffsetCurveControlPoints(
  curve: THREE.Curve<THREE.Vector3>,
  lateralOffset = 0,
  sampleCount = REPLAY_GEOMETRY_SAMPLE_COUNT
) {
  return curve.getSpacedPoints(sampleCount).map((point, index) => {
    const tangent = getSafeCurveTangent(curve, index / sampleCount);
    return [
      point.x - tangent.z * lateralOffset,
      point.z + tangent.x * lateralOffset
    ] as [number, number];
  });
}

function createConnectorSurfaceGeometry(
  curve: THREE.Curve<THREE.Vector3>
) {
  // The exact OSM polyline remains a separate source trace. This low-profile
  // carriageway is a deliberately labelled display surface sampled from the
  // same trace, with a small smoothing step so the U-turn reads continuously.
  return createRoadRibbonGeometry(
    getOffsetCurveControlPoints(curve),
    MODELLED_REPLAY_WIDTH_METERS,
    () => 0.19,
    REPLAY_GEOMETRY_SAMPLE_COUNT,
    'linear'
  );
}

function createSourceCurbGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  lateralOffset: number,
  y = 0.24
) {
  const offsetPoints = getOffsetCurveControlPoints(curve, lateralOffset);
  if (offsetPoints.length < 2) return new THREE.BufferGeometry();

  // Build one continuous low curb along the modelled display curve. Sampling
  // the curve rather than boxing each source segment keeps the sweep joined at
  // street scale while the exact source trace stays available underneath.
  const sourceVertices = offsetPoints.map(([x, z]) => new THREE.Vector2(x, z));
  const curbCenters = sourceVertices.map((point, index) => {
    const previous = sourceVertices[Math.max(0, index - 1)];
    const next = sourceVertices[Math.min(sourceVertices.length - 1, index + 1)];
    const incoming = point.clone().sub(previous);
    const outgoing = next.clone().sub(point);
    if (incoming.lengthSq() < 0.04) incoming.copy(outgoing);
    if (outgoing.lengthSq() < 0.04) outgoing.copy(incoming);
    incoming.normalize();
    outgoing.normalize();

    const incomingNormal = new THREE.Vector2(-incoming.y, incoming.x);
    const outgoingNormal = new THREE.Vector2(-outgoing.y, outgoing.x);
    const normal = index === 0
      ? outgoingNormal
      : index === sourceVertices.length - 1
        ? incomingNormal
        : incomingNormal.clone().add(outgoingNormal);

    if (normal.lengthSq() < 0.04) {
      normal.copy(outgoingNormal);
    } else {
      normal.normalize();
    }

    const miterScale = index === 0 || index === sourceVertices.length - 1
      ? lateralOffset
      : lateralOffset / Math.max(0.45, Math.abs(normal.dot(outgoingNormal)));
    return point.clone().add(normal.multiplyScalar(Math.min(miterScale, lateralOffset * 1.75)));
  });

  const halfWidth = MODELLED_REPLAY_CURB_WIDTH_METERS / 2;
  const baseY = y - MODELLED_REPLAY_CURB_HEIGHT_METERS / 2;
  const topY = y + MODELLED_REPLAY_CURB_HEIGHT_METERS / 2;
  const positions: number[] = [];
  const indices: number[] = [];

  curbCenters.forEach((center, index) => {
    const previous = curbCenters[Math.max(0, index - 1)];
    const next = curbCenters[Math.min(curbCenters.length - 1, index + 1)];
    const tangent = next.clone().sub(previous).normalize();
    const across = new THREE.Vector2(-tangent.y, tangent.x);
    const inner = center.clone().sub(across.clone().multiplyScalar(halfWidth));
    const outer = center.clone().add(across.multiplyScalar(halfWidth));
    positions.push(
      inner.x, baseY, inner.y,
      outer.x, baseY, outer.y,
      inner.x, topY, inner.y,
      outer.x, topY, outer.y
    );
  });

  for (let index = 0; index < curbCenters.length - 1; index += 1) {
    const current = index * 4;
    const next = current + 4;
    // Top, inner side, outer side, and the underside. The caps are added
    // below so the raised modelled curb reads as a physical object in walk
    // view instead of a floating line.
    indices.push(
      current + 2, current + 3, next + 2,
      current + 3, next + 3, next + 2,
      current, next + 2, current + 2,
      current, next, next + 2,
      current + 1, current + 3, next + 3,
      current + 1, next + 3, next + 1,
      current, current + 1, next,
      current, next, next + 1
    );
  }

  indices.push(
    0, 2, 3,
    0, 3, 1,
    (curbCenters.length - 1) * 4, (curbCenters.length - 1) * 4 + 1, (curbCenters.length - 1) * 4 + 3,
    (curbCenters.length - 1) * 4, (curbCenters.length - 1) * 4 + 3, (curbCenters.length - 1) * 4 + 2
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createConnectorSegmentGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  startProgress: number,
  endProgress: number,
  width: number,
  y: number,
  lateralOffset = 0
) {
  const sampleCount = 40;
  const controlPoints: [number, number][] = [];
  for (let index = 0; index <= sampleCount; index += 1) {
    const progress = THREE.MathUtils.lerp(startProgress, endProgress, index / sampleCount);
    const point = curve.getPointAt(progress);
    const tangent = getSafeCurveTangent(curve, progress);
    controlPoints.push([
      point.x - tangent.z * lateralOffset,
      point.z + tangent.x * lateralOffset
    ]);
  }
  return createRoadRibbonGeometry(controlPoints, width, () => y, sampleCount, 'linear');
}

function createSourceTraceGeometry(curve: THREE.Curve<THREE.Vector3>) {
  return createCurveLineGeometry(
    getOffsetCurveControlPoints(curve, 0, REPLAY_GEOMETRY_SAMPLE_COUNT),
    0,
    () => REPLAY_SOURCE_TRACE_Y,
    0.08,
    REPLAY_GEOMETRY_SAMPLE_COUNT,
    'linear'
  );
}

function createReplayOffsetLineGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  lateralOffset: number,
  y: number,
  lineWidth: number
) {
  return createCurveLineGeometry(
    getOffsetCurveControlPoints(curve, lateralOffset),
    0,
    () => y,
    lineWidth,
    REPLAY_GEOMETRY_SAMPLE_COUNT,
    'linear'
  );
}

function createCurveSegmentCurve(
  curve: THREE.Curve<THREE.Vector3>,
  startProgress: number,
  endProgress: number
) {
  const sampleCount = 32;
  return new THREE.CatmullRomCurve3(
    Array.from({ length: sampleCount + 1 }, (_, index) => (
      curve.getPointAt(THREE.MathUtils.lerp(startProgress, endProgress, index / sampleCount))
    )),
    false,
    'centripetal',
    0.25
  );
}

function createSweepArcGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  startProgress: number,
  endProgress: number
) {
  return new THREE.TubeGeometry(
    createCurveSegmentCurve(curve, startProgress, endProgress),
    64,
    0.16,
    8,
    false
  );
}

function createSourceCrossingSurfaceGeometry() {
  const pieces = SOURCE_CROSSOVER_CROSSING_TRACES.map((trace) => (
    createRoadRibbonGeometry(
      trace.geometry.map(([x, z]) => [x, z] as [number, number]),
      SOURCE_CROSSING_WIDTH_METERS,
      () => 0.27,
      32,
      'linear'
    )
  ));
  const geometry = mergeGeometries(pieces, false) || new THREE.BufferGeometry();
  pieces.forEach((piece) => piece.dispose());
  return geometry;
}

function createConnectorDashGeometry(curve: THREE.Curve<THREE.Vector3>) {
  const pieces: THREE.BufferGeometry[] = [];
  const points = curve.getSpacedPoints(120);
  const yAxis = new THREE.Vector3(0, 1, 0);
  for (let index = 2; index < points.length - 1; index += 5) {
    const previous = points[index];
    const current = points[index + 1];
    const dx = current.x - previous.x;
    const dz = current.z - previous.z;
    const length = Math.hypot(dx, dz);
    if (length < 0.2) continue;
    const dash = new THREE.BoxGeometry(0.13, 0.025, Math.min(2.2, length * 0.72));
    dash.applyMatrix4(
      new THREE.Matrix4().compose(
        new THREE.Vector3((previous.x + current.x) / 2, 0.34, (previous.z + current.z) / 2),
        new THREE.Quaternion().setFromAxisAngle(yAxis, Math.atan2(dx, dz)),
        new THREE.Vector3(1, 1, 1)
      )
    );
    pieces.push(dash);
  }
  const geometry = mergeGeometries(pieces, false);
  pieces.forEach((piece) => piece.dispose());
  return geometry || new THREE.BufferGeometry();
}

const FocusLabel: React.FC<{
  position: [number, number, number];
  title: string;
  detail: string;
  distanceFactor?: number;
}> = ({ position, title, detail, distanceFactor = 88 }) => (
  <Html position={position} center distanceFactor={distanceFactor} zIndexRange={[45, 0]}>
    <div
      role="note"
      aria-label={`${title}. ${detail}`}
      style={{
        pointerEvents: 'none',
        minWidth: 168,
        padding: '6px 8px',
        borderRadius: 5,
        border: '1px solid rgba(56, 189, 248, 0.75)',
        background: 'rgba(7, 17, 31, 0.9)',
        boxShadow: '0 4px 16px rgba(2, 6, 23, 0.45)',
        color: '#e0f2fe',
        fontFamily: 'monospace',
        fontSize: 9,
        lineHeight: 1.25,
        letterSpacing: '0.04em',
        textAlign: 'center',
        whiteSpace: 'nowrap'
      }}
    >
      <div style={{ color: '#fbbf24', fontWeight: 800 }}>{title}</div>
      <div style={{ color: '#a5f3fc', fontSize: 8, marginTop: 2 }}>{detail}</div>
    </div>
  </Html>
);

const CrossoverReplayVehicle: React.FC<{
  id: ReplayVehicleId;
  connector: UTurnConnector;
  curve: THREE.Curve<THREE.Vector3>;
  startProgress: number;
  stopProgress: number;
  laneOffset: number;
  color: string;
  isNight: boolean;
  cameraMode: 'walk' | 'overview';
  conflictRef: React.MutableRefObject<ReplayConflictState>;
}> = ({ id, connector, curve, startProgress, stopProgress, laneOffset, color, isNight, cameraMode, conflictRef }) => {
  const vehicleRef = useRef<THREE.Group>(null);
  const progressRef = useRef(startProgress);
  const motionClockRef = useRef(0);
  const phaseFrames = useMemo(() => getReplayPhaseFrames(connector, curve), [connector, curve]);
  const geometry = useMemo(() => createCarGeometry(), []);
  const curveLength = useMemo(() => curve.getLength(), [curve]);
  const conflictWindow = useMemo(
    () => getReplayConflictWindow(connector, curve),
    [connector, curve]
  );
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.34,
    metalness: 0.58,
    emissive: isNight ? new THREE.Color(color) : new THREE.Color('#000000'),
    emissiveIntensity: isNight ? 0.42 : 0
  }), [color, isNight]);
  const turnSignalMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: isNight ? '#fde68a' : '#f59e0b',
    transparent: true,
    opacity: 0,
    toneMapped: false
  }), [isNight]);
  const brakeLightMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ef4444',
    transparent: true,
    opacity: 0.28,
    toneMapped: false
  }), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const headingPoint = useMemo(() => new THREE.Vector3(), []);
  const pathTangent = useMemo(() => new THREE.Vector3(), []);
  const headingTangent = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
    turnSignalMaterial.dispose();
    brakeLightMaterial.dispose();
  }, [brakeLightMaterial, geometry, material, turnSignalMaterial]);

  useFrame((_, delta) => {
    const vehicle = vehicleRef.current;
    if (!vehicle) return;

    const frameDelta = Math.min(delta, 0.05);
    motionClockRef.current += frameDelta;
    const currentProgress = progressRef.current;
    const dynamics = getReplayDynamics(currentProgress, stopProgress, phaseFrames);
    const conflict = conflictRef.current;
    const ownsConflict = conflict.owner === id && conflict.clock >= conflict.handoffUntil;
    const progressDelta = (
      frameDelta * REPLAY_SPEED_METERS_PER_SECOND * dynamics.speedFactor
    ) / Math.max(1, curveLength);
    const reachedRouteEnd = currentProgress + progressDelta >= 1;
    let nextProgress = reachedRouteEnd
      ? startProgress
      : currentProgress + progressDelta;

    // The OSM relation is a no_u_turn restriction, so both directions are
    // deliberately treated as replay scenarios. They can approach the same
    // source-linked sweep, but only one scenario owns that conflict envelope
    // at a time. The other vehicle settles at a modelled hold line rather than
    // visually driving through the opposing replay.
    const isBeforeConflict = !reachedRouteEnd && currentProgress <= conflictWindow.endProgress;
    const isEnteringBlockedConflict = !ownsConflict
      && isBeforeConflict
      && nextProgress >= conflictWindow.holdProgress;
    const isHolding = isEnteringBlockedConflict || (
      !ownsConflict
      && currentProgress >= conflictWindow.holdProgress
      && currentProgress <= conflictWindow.endProgress
    );
    if (isHolding) nextProgress = conflictWindow.holdProgress;

    if (
      ownsConflict
      && currentProgress < conflictWindow.endProgress
      && nextProgress >= conflictWindow.endProgress
    ) {
      conflict.owner = id === 'north' ? 'south' : 'north';
      conflict.lastCompleted = id;
      conflict.lastTransferAt = conflict.clock;
      conflict.handoffUntil = conflict.clock + REPLAY_HANDOFF_DELAY_SECONDS;
    }

    if (reachedRouteEnd) {
      vehicle.userData.replayCycle = (vehicle.userData.replayCycle || 0) + 1;
    }

    progressRef.current = nextProgress;
    curve.getPointAt(nextProgress, point);
    pathTangent.copy(getSafeCurveTangent(curve, nextProgress));
    normal.set(-pathTangent.z, 0, pathTangent.x).normalize();
    vehicle.position.set(
      point.x + normal.x * laneOffset,
      0.12,
      point.z + normal.z * laneOffset
    );

    // Use a short forward chord for the body heading. Positioning still uses
    // the exact source tangent, while the heading eases into each source
    // vertex instead of snapping at the sparse OSM polyline corners.
    const headingLookAhead = Math.min(0.028, Math.max(0.008, 4 / Math.max(1, curveLength)));
    const headingProgress = nextProgress + headingLookAhead <= 1
      ? nextProgress + headingLookAhead
      : Math.max(0, nextProgress - headingLookAhead);
    curve.getPointAt(headingProgress, headingPoint);
    headingTangent.subVectors(
      headingProgress >= nextProgress ? headingPoint : point,
      headingProgress >= nextProgress ? point : headingPoint
    ).setY(0);
    if (headingTangent.lengthSq() < 0.04) headingTangent.copy(pathTangent);
    else headingTangent.normalize();
    // VehicleModels faces +Z; rotate it directly into the source replay
    // tangent. The regular instanced fleet uses Object3D.lookAt (which needs
    // a PI correction for its -Z convention), but this hero group receives a
    // raw Euler angle and must not be inverted.
    vehicle.rotation.y = Math.atan2(headingTangent.x, headingTangent.z);
    vehicle.rotation.z = THREE.MathUtils.clamp(
      (headingTangent.x * pathTangent.z - headingTangent.z * pathTangent.x) * 0.32,
      -0.08,
      0.08
    );

    vehicle.userData.replayPhase = isHolding ? 'yield-hold' : dynamics.phaseId;
    vehicle.userData.waitingForConflict = isHolding;
    vehicle.userData.conflictOwner = conflict.owner;
    vehicle.userData.conflictHandoffPending = conflict.clock < conflict.handoffUntil;
    vehicle.userData.laneOffset = laneOffset;

    // Make the turn leg read as a maneuver: both indicators blink only during
    // the modeled sweep, while the rear lamps brighten as the vehicle rolls
    // through the source-linked yield point. These are visual replay cues,
    // not claims about observed vehicle behavior or traffic-signal control.
    const blinkOn = Math.floor(motionClockRef.current * 4) % 2 === 0;
    turnSignalMaterial.opacity = (dynamics.inTurnWindow || isHolding) && blinkOn
      ? (isNight ? 1 : 0.82)
      : 0.08;
    brakeLightMaterial.opacity = isHolding
      ? (isNight ? 1 : 0.86)
      : 0.26 + dynamics.yieldStrength * (isNight ? 0.74 : 0.58);
  });

  return (
    <group
      ref={vehicleRef}
      name={`CrossoverReplayVehicle-${id}`}
      renderOrder={14}
      scale={cameraMode === 'walk' ? 0.72 : 0.68}
      userData={{
        source: 'OSM relation/18922642',
        status: 'modelled visual replay',
        replayPhases: 'approach/yield → sweep → exit',
        replayPhaseTiming: 'modelled at source way-member boundaries',
        sourceWayIds: connector.sourceWayIds,
        stopProgress,
        conflictEnvelope: 'modelled single-owner sweep; opposing replay yields',
        laneOffset,
        laneWidthMetres: MODELLED_REPLAY_LANE_WIDTH_METERS,
        smoothing: 'modelled centripetal display curve; exact OSM trace retained separately',
        countedInFleet: false
      }}
    >
      <mesh geometry={geometry} material={material} castShadow />
      <mesh position={[-0.6, 0.55, 2.13]} material={turnSignalMaterial}>
        <boxGeometry args={[0.35, 0.15, 0.1]} />
      </mesh>
      <mesh position={[0.6, 0.55, 2.13]} material={turnSignalMaterial}>
        <boxGeometry args={[0.35, 0.15, 0.1]} />
      </mesh>
      <mesh position={[-0.6, 0.55, -2.13]} material={brakeLightMaterial}>
        <boxGeometry args={[0.35, 0.15, 0.1]} />
      </mesh>
      <mesh position={[0.6, 0.55, -2.13]} material={brakeLightMaterial}>
        <boxGeometry args={[0.35, 0.15, 0.1]} />
      </mesh>
      <mesh position={[0, 0.64, 1.58]}>
        <boxGeometry args={[0.22, 0.12, 0.06]} />
        <meshBasicMaterial color={isNight ? '#fef08a' : '#fde68a'} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.99, -0.98]}>
        <boxGeometry args={[0.8, 0.04, 0.07]} />
        <meshBasicMaterial color="#f97316" transparent opacity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
};

function getCurveFrame(
  curve: THREE.Curve<THREE.Vector3>,
  progress: number,
  lateralOffset = 0,
  y = 0.42
) {
  const point = curve.getPointAt(THREE.MathUtils.clamp(progress, 0, 1));
  const tangent = getSafeCurveTangent(curve, progress);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
  return {
    position: [
      point.x + normal.x * lateralOffset,
      y,
      point.z + normal.z * lateralOffset
    ] as [number, number, number],
    angle: Math.atan2(tangent.x, tangent.z)
  };
}

const CrossoverConflictHoldLine: React.FC<{
  id: ReplayVehicleId;
  connector: UTurnConnector;
  curve: THREE.Curve<THREE.Vector3>;
  laneOffset: number;
  cameraMode: 'walk' | 'overview';
}> = ({ id, connector, curve, laneOffset, cameraMode }) => {
  const conflictWindow = useMemo(
    () => getReplayConflictWindow(connector, curve),
    [connector, curve]
  );
  const stopFrame = useMemo(
    () => getCurveFrame(curve, conflictWindow.startProgress, laneOffset, 0.36),
    [conflictWindow.startProgress, curve, laneOffset]
  );
  const holdFrame = useMemo(
    () => getCurveFrame(curve, conflictWindow.holdProgress, laneOffset, 0.37),
    [conflictWindow.holdProgress, curve, laneOffset]
  );

  return (
    <group
      name={`ModelledConflictHoldLine-${id}`}
      userData={{
        source: 'OSM relation/18922642',
        status: 'modelled yield and hold lines',
        purpose: 'visual replay sequencing; not a legal stop line',
        laneOffset,
        sourceWayIds: connector.sourceWayIds
      }}
    >
      <group position={stopFrame.position} rotation={[0, stopFrame.angle, 0]}>
        <mesh renderOrder={10}>
          <boxGeometry args={[MODELLED_REPLAY_LANE_WIDTH_METERS - 0.16, 0.06, 0.2]} />
          <meshBasicMaterial
            color="#f8fafc"
            transparent
            opacity={cameraMode === 'overview' ? 0.96 : 0.78}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.035, 0.42]} rotation={[0, 0, Math.PI / 2]} renderOrder={10}>
          <coneGeometry args={[0.18, 0.46, 3]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={cameraMode === 'overview' ? 0.9 : 0.72}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
      <group position={holdFrame.position} rotation={[0, holdFrame.angle, 0]}>
        <mesh renderOrder={10}>
          <boxGeometry args={[MODELLED_REPLAY_LANE_WIDTH_METERS - 0.24, 0.045, 0.18]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={cameraMode === 'overview' ? 0.9 : 0.76}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.032, 0.3]} renderOrder={10}>
          <boxGeometry args={[MODELLED_REPLAY_LANE_WIDTH_METERS - 0.5, 0.025, 0.07]} />
          <meshBasicMaterial color="#f8fafc" transparent opacity={0.88} depthWrite={false} toneMapped={false} />
        </mesh>
        {cameraMode === 'overview' && (
          <Html position={[0, 0.74, 0]} center distanceFactor={90} zIndexRange={[47, 0]}>
            <div
              role="note"
              aria-label={`${id} modelled yield hold line. Source relation 18922642.`}
              style={{
                pointerEvents: 'none',
                padding: '2px 4px',
                border: '1px solid rgba(251, 191, 36, 0.7)',
                borderRadius: 3,
                background: 'rgba(2, 8, 23, 0.76)',
                color: '#fde68a',
                fontFamily: 'monospace',
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: '0.06em',
                whiteSpace: 'nowrap'
              }}
            >
              MODELLED YIELD · HAND-OFF
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

/**
 * Add a small physical signal gate and a moving route pulse to each
 * source-linked connector. This makes the maneuver legible in 3D while
 * keeping its no_u_turn legality boundary explicit in userData.
 */
const CrossoverTurnGuide: React.FC<{
  id: ReplayVehicleId;
  connector: UTurnConnector;
  curve: THREE.Curve<THREE.Vector3>;
  laneOffset: number;
  isNight: boolean;
  cameraMode: 'walk' | 'overview';
  conflictRef: React.MutableRefObject<ReplayConflictState>;
}> = ({ id, connector, curve, laneOffset, isNight, cameraMode, conflictRef }) => {
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseProgressRef = useRef(0.08);
  const pulsePoint = useMemo(() => new THREE.Vector3(), []);
  const pulseTangent = useMemo(() => new THREE.Vector3(), []);
  const pulseNormal = useMemo(() => new THREE.Vector3(), []);
  const conflictWindow = useMemo(
    () => getReplayConflictWindow(connector, curve),
    [connector, curve]
  );
  const phaseFrames = useMemo(
    () => getReplayPhaseFrames(connector, curve).map((phase) => ({
      ...phase,
      frame: getCurveFrame(curve, phase.progress, laneOffset, 0.38)
    })),
    [connector, curve, laneOffset]
  );
  const signalFrame = useMemo(
    () => getCurveFrame(
      curve,
      getReplayProgressAtSourceVertex(connector, connector.phaseRanges.yield.startVertex, curve),
      MODELLED_SIGNAL_OFFSET,
      0.12
    ),
    [connector, curve]
  );

  useFrame((_, delta) => {
    const pulse = pulseRef.current;
    if (!pulse) return;
    const currentProgress = pulseProgressRef.current;
    const nextProgress = (
      currentProgress + Math.min(delta, 0.05) * 0.16
    ) % 1;
    const isBeforeConflict = currentProgress <= conflictWindow.endProgress;
    pulseProgressRef.current = conflictRef.current.owner !== id
      && isBeforeConflict
      && nextProgress >= conflictWindow.holdProgress
      ? conflictWindow.holdProgress
      : nextProgress;
    curve.getPointAt(pulseProgressRef.current, pulsePoint);
    pulseTangent.copy(getSafeCurveTangent(curve, pulseProgressRef.current));
    pulseNormal.set(-pulseTangent.z, 0, pulseTangent.x);
    pulse.position.set(
      pulsePoint.x + pulseNormal.x * laneOffset,
      0.52,
      pulsePoint.z + pulseNormal.z * laneOffset
    );
    const breathe = 0.85 + Math.sin(pulseProgressRef.current * Math.PI * 2) * 0.15;
    pulse.scale.setScalar(breathe);
    const activePhase = getReplayPhase(pulseProgressRef.current, phaseFrames);
    const pulseMaterial = pulse.material as THREE.MeshBasicMaterial;
    pulseMaterial.color.set(activePhase.color);
    pulseMaterial.opacity = conflictRef.current.owner === id
      ? (conflictRef.current.clock < conflictRef.current.handoffUntil ? 0.62 : 0.98)
      : 0.38;
    pulse.userData.activePhase = activePhase.id;
  });

  return (
    <group name={`CrossoverTurnGuide-${id}`} renderOrder={11} userData={{
      source: 'OSM relation/18922642',
      status: 'modelled maneuver guide',
      phaseOrder: 'approach → yield → sweep → exit',
      conflictSequencing: 'single-owner sweep; opposing replay waits at hold line',
      laneOffset
    }}>
      <mesh ref={pulseRef} renderOrder={12}>
        <sphereGeometry args={[0.34, 12, 8]} />
        <meshBasicMaterial
          color={isNight ? '#fef08a' : '#fbbf24'}
          transparent
          opacity={0.95}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      <CrossoverConflictHoldLine
        id={id}
        connector={connector}
        curve={curve}
        laneOffset={laneOffset}
        cameraMode={cameraMode}
      />

      {phaseFrames
        .filter((phase) => cameraMode === 'overview' || phase.id === 'yield' || phase.id === 'sweep')
        .map((phase) => (
        <group key={`${id}-phase-${phase.id}`} position={phase.frame.position} rotation={[0, phase.frame.angle, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={10}>
            <ringGeometry args={cameraMode === 'overview' ? [0.65, 0.8, 18] : [0.52, 0.65, 16]} />
            <meshBasicMaterial color={phase.color} transparent opacity={isNight ? 0.92 : (cameraMode === 'overview' ? 0.72 : 0.55)} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.16, 0]} renderOrder={11}>
            <cylinderGeometry args={[0.08, 0.08, 0.32, 8]} />
            <meshStandardMaterial color={phase.color} emissive={phase.color} emissiveIntensity={isNight ? 2.2 : 0.35} />
          </mesh>
          <Html position={[0, cameraMode === 'overview' ? 1.45 : 0.95, 0]} center distanceFactor={cameraMode === 'overview' ? 92 : 4.2} zIndexRange={[46, 0]}>
            <div
              role="note"
              aria-label={`${phase.label} phase marker. Source ways ${phase.sourceWayIds.join(', ')}`}
              style={{
                pointerEvents: 'none',
                padding: '2px 4px',
                border: `1px solid ${phase.color}99`,
                borderRadius: 3,
                background: 'rgba(2, 8, 23, 0.78)',
                color: phase.color,
                fontFamily: 'monospace',
                fontSize: cameraMode === 'overview' ? 7 : 8,
                fontWeight: 800,
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap'
              }}
            >
              MODELLED {phase.label} · {phase.sourceWayIds.length === 1
                ? phase.sourceWayIds[0].toUpperCase()
                : `${phase.sourceWayIds[0].toUpperCase()} +${phase.sourceWayIds.length - 1}`}
            </div>
          </Html>
        </group>
      ))}

      {cameraMode === 'overview' && (
        <group
          position={signalFrame.position}
          rotation={[0, signalFrame.angle, 0]}
          name={`ModelledYieldSignal-${id}`}
          userData={{ signalStatus: 'modelled yield cue', countedInFleet: false, source: 'OSM way boundary' }}
        >
          <mesh position={[0, 1.35, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.11, 2.7, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.45} />
          </mesh>
          <mesh position={[0, 2.76, 0]} castShadow>
            <boxGeometry args={[0.58, 1.65, 0.36]} />
            <meshStandardMaterial color="#111827" metalness={0.35} roughness={0.62} />
          </mesh>
          <mesh position={[0, 3.2, 0.2]}>
            <sphereGeometry args={[0.115, 10, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
          <mesh position={[0, 2.78, 0.2]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={isNight ? 4.5 : 1.1} />
          </mesh>
          <mesh position={[0, 2.36, 0.2]}>
            <sphereGeometry args={[0.115, 10, 8]} />
            <meshStandardMaterial color="#14532d" roughness={0.3} />
          </mesh>
          {isNight && <pointLight position={[0, 2.78, 0.5]} intensity={3.2} distance={8} color="#fbbf24" />}
        </group>
      )}
    </group>
  );
};

const DirectionMarkers: React.FC<{
  id: ReplayVehicleId;
  connector: UTurnConnector;
  curve: THREE.Curve<THREE.Vector3>;
  color: string;
  laneOffset: number;
}> = ({ id, connector, curve, color, laneOffset }) => {
  const markers = useMemo(() => getReplayPhaseFrames(connector, curve).map((phase) => {
    const frame = getCurveFrame(curve, phase.progress, laneOffset, 0.46);
    return {
      phaseId: phase.id,
      position: frame.position,
      angle: frame.angle
    };
  }), [connector, curve, laneOffset]);

  return (
    <group
      name={`ModelledUturnDirectionMarkers-${id}`}
      userData={{
        source: 'OSM relation/18922642',
        status: 'modelled orientation annotation',
        laneOffset
      }}
    >
      {markers.map((marker) => (
        <group
          key={`${id}-direction-marker-${marker.phaseId}`}
          position={marker.position}
          rotation={[0, marker.angle, 0]}
        >
          {/* These are orientation annotations, not traffic signs or legal
              permissions. They use the same curve as the modelled fleet. */}
          <mesh
            position={[0, 0.05, marker.phaseId === 'sweep' ? 0.2 : 0.14]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={marker.phaseId === 'sweep' ? 1.3 : 1}
            renderOrder={10}
          >
            <coneGeometry args={[0.28, 0.62, 3]} />
            <meshBasicMaterial color={color} transparent opacity={0.94} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/**
 * Focus aid for the crossover preset. The highlighted paths are generated
 * from U_TURN_CONNECTORS, the same source-linked points consumed by
 * JunctionRoads and TrafficSystem. They follow the short OSM relation trace,
 * but remain scenario links because the snapshot records no_u_turn for that
 * movement and does not contain a field-verified turn plan.
 */
export const CrossoverFocusOverlay: React.FC<CrossoverFocusOverlayProps> = ({
  isNight = false,
  cameraMode = 'overview'
}) => {
  const northSourceCurve = useMemo(() => createConnectorCurve(U_TURN_CONNECTORS.north.points), []);
  const northCurve = useMemo(() => createModelledReplayCurve(U_TURN_CONNECTORS.north.points), []);
  const southCurve = useMemo(() => createModelledReplayCurve(U_TURN_CONNECTORS.south.points), []);
  const northSurfaceGeometry = useMemo(
    () => createConnectorSurfaceGeometry(northCurve),
    [northCurve]
  );
  const southSurfaceGeometry = useMemo(
    () => createConnectorSurfaceGeometry(southCurve),
    [southCurve]
  );
  const northCurbGeometry = useMemo(
    () => createSourceCurbGeometry(northCurve, MODELLED_REPLAY_CURB_OFFSET),
    [northCurve]
  );
  const southCurbGeometry = useMemo(
    () => createSourceCurbGeometry(southCurve, MODELLED_REPLAY_CURB_OFFSET),
    [southCurve]
  );
  const crossingSurfaceGeometry = useMemo(
    () => createSourceCrossingSurfaceGeometry(),
    []
  );
  const northSourceTraceGeometry = useMemo(
    () => createSourceTraceGeometry(northSourceCurve),
    [northSourceCurve]
  );
  const northDashGeometry = useMemo(() => createConnectorDashGeometry(northCurve), [northCurve]);
  const southDashGeometry = useMemo(() => createConnectorDashGeometry(southCurve), [southCurve]);
  const northSweepArcGeometry = useMemo(() => {
    const conflictWindow = getReplayConflictWindow(U_TURN_CONNECTORS.north, northCurve);
    return createSweepArcGeometry(northCurve, conflictWindow.startProgress, conflictWindow.endProgress);
  }, [northCurve]);
  const southSweepArcGeometry = useMemo(() => {
    const conflictWindow = getReplayConflictWindow(U_TURN_CONNECTORS.south, southCurve);
    return createSweepArcGeometry(southCurve, conflictWindow.startProgress, conflictWindow.endProgress);
  }, [southCurve]);
  const northConflictGeometry = useMemo(() => {
    const conflictWindow = getReplayConflictWindow(U_TURN_CONNECTORS.north, northCurve);
    return createConnectorSegmentGeometry(
      northCurve,
      conflictWindow.startProgress,
      conflictWindow.endProgress,
      MODELLED_CONFLICT_BUFFER_WIDTH_METERS,
      0.225
    );
  }, [northCurve]);
  const southConflictGeometry = useMemo(() => {
    const conflictWindow = getReplayConflictWindow(U_TURN_CONNECTORS.south, southCurve);
    return createConnectorSegmentGeometry(
      southCurve,
      conflictWindow.startProgress,
      conflictWindow.endProgress,
      MODELLED_CONFLICT_BUFFER_WIDTH_METERS,
      0.225
    );
  }, [southCurve]);
  const northEdgeGeometries = useMemo(
    () => [-MODELLED_REPLAY_WIDTH_METERS / 2 + 0.24, MODELLED_REPLAY_WIDTH_METERS / 2 - 0.24].map((offset) => createReplayOffsetLineGeometry(
      northCurve,
      offset,
      0.31,
      0.1
    )),
    [northCurve]
  );
  const southEdgeGeometries = useMemo(
    () => [-MODELLED_REPLAY_WIDTH_METERS / 2 + 0.24, MODELLED_REPLAY_WIDTH_METERS / 2 - 0.24].map((offset) => createReplayOffsetLineGeometry(
      southCurve,
      offset,
      0.31,
      0.1
    )),
    [southCurve]
  );
  const northLabelPosition = useMemo(() => {
    const point = northCurve.getPointAt(0.58);
    const tangent = getSafeCurveTangent(northCurve, 0.58);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    return [point.x + normal.x * 8, 4.8, point.z + normal.z * 8] as [number, number, number];
  }, [northCurve]);
  const southLabelPosition = useMemo(() => {
    const point = southCurve.getPointAt(0.58);
    const tangent = getSafeCurveTangent(southCurve, 0.58);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    return [point.x - normal.x * 8, 4.8, point.z - normal.z * 8] as [number, number, number];
  }, [southCurve]);
  const accent = isNight ? '#fbbf24' : '#f59e0b';
  const isOverview = cameraMode === 'overview';
  const replayConflictRef = useRef<ReplayConflictState>({
    owner: 'north',
    clock: 0,
    lastCompleted: null,
    lastTransferAt: 0,
    handoffUntil: 0
  });

  useFrame((_, delta) => {
    replayConflictRef.current.clock += Math.min(delta, 0.05);
  });

  React.useEffect(() => () => {
    northSurfaceGeometry.dispose();
    southSurfaceGeometry.dispose();
    northCurbGeometry.dispose();
    southCurbGeometry.dispose();
    crossingSurfaceGeometry.dispose();
    northSourceTraceGeometry.dispose();
    northDashGeometry.dispose();
    southDashGeometry.dispose();
    northSweepArcGeometry.dispose();
    southSweepArcGeometry.dispose();
    northConflictGeometry.dispose();
    southConflictGeometry.dispose();
    northEdgeGeometries.forEach((geometry) => geometry.dispose());
    southEdgeGeometries.forEach((geometry) => geometry.dispose());
  }, [crossingSurfaceGeometry, northConflictGeometry, northCurbGeometry, northDashGeometry, northEdgeGeometries, northSourceTraceGeometry, northSurfaceGeometry, northSweepArcGeometry, southConflictGeometry, southCurbGeometry, southDashGeometry, southEdgeGeometries, southSurfaceGeometry, southSweepArcGeometry]);

  return (
    <group
      name="MarathahalliCrossoverSourceAlignmentOverlay"
      userData={{
        source: 'OSM relation/18922642',
        sourceRestriction: 'no_u_turn',
        status: 'source-linked scenario replay; field verification required'
      }}
    >
      {/* The OSM crossing ways are rendered as quiet paved traces. Their
          snapshot tags say unmarked, so this layer intentionally shows no
          zebra stripes or right-of-way signal. */}
      <mesh
        geometry={crossingSurfaceGeometry}
        receiveShadow
        renderOrder={6}
        userData={{ source: 'OSM', feature: 'footway=crossing', markings: 'unmarked' }}
      >
        <meshStandardMaterial
          color={isNight ? '#78716c' : '#d6d3d1'}
          roughness={0.92}
          metalness={0.02}
          transparent
          opacity={isOverview ? 0.48 : 0.26}
          depthWrite={false}
        />
      </mesh>

      {/* The sweep is the only shared conflict envelope in the two reversed
          scenarios. This translucent band is modelled review geometry: it
          never replaces the mapped road and remains below the source crossing
          traces and raised curb edges in the render stack. */}
      <mesh
        geometry={northConflictGeometry}
        renderOrder={5}
        userData={{
          source: 'OSM relation/18922642',
          status: 'modelled conflict envelope',
          phase: 'sweep',
          semantics: 'opposing replay yields; not a legal movement'
        }}
      >
        <meshBasicMaterial
          color="#fb923c"
          transparent
          opacity={isOverview ? 0.16 : 0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        geometry={southConflictGeometry}
        renderOrder={5}
        userData={{
          source: 'OSM relation/18922642',
          status: 'modelled conflict envelope',
          phase: 'sweep',
          semantics: 'opposing replay yields; not a legal movement'
        }}
      >
        <meshBasicMaterial
          color="#fb923c"
          transparent
          opacity={isOverview ? 0.16 : 0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* These low concrete edges make the replay lane sit on the pavement
          instead of reading as a floating line. Width and curb placement are
          modelled because the OSM ways do not carry width/curb tags. */}
      <mesh
        geometry={northCurbGeometry}
        castShadow
        receiveShadow
        renderOrder={7}
        userData={{ source: 'modelled curb edge', sourceTrace: 'OSM relation/18922642' }}
      >
        <meshStandardMaterial
          color={isNight ? '#64748b' : '#cbd5e1'}
          roughness={0.88}
          metalness={0.04}
          transparent
          opacity={isOverview ? 0.9 : 0.48}
          depthWrite={isOverview}
        />
      </mesh>
      <mesh
        geometry={southCurbGeometry}
        castShadow
        receiveShadow
        renderOrder={7}
        userData={{ source: 'modelled curb edge', sourceTrace: 'OSM relation/18922642' }}
      >
        <meshStandardMaterial
          color={isNight ? '#64748b' : '#cbd5e1'}
          roughness={0.88}
          metalness={0.04}
          transparent
          opacity={isOverview ? 0.9 : 0.48}
          depthWrite={isOverview}
        />
      </mesh>

      <group name="SourceCrossoverCrossingEvidence">
        {SOURCE_CROSSOVER_CROSSING_TRACES.map((trace) => {
          const [x, z] = trace.geometry[Math.floor(trace.geometry.length / 2)];
          const isSignalCrossing = trace.crossing === 'traffic_signals';
          const crossingColor = isSignalCrossing ? '#38bdf8' : '#f59e0b';
          const crossingLabel = isSignalCrossing ? 'SIGNALLED' : 'UNCONTROLLED';
          return (
            <group
              key={`source-crossing-${trace.id}`}
              position={[x, 0.29, z]}
              userData={{
                source: 'OSM',
                sourceWayId: trace.id,
                crossing: trace.crossing,
                markings: trace.markings
              }}
            >
              <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
                <ringGeometry args={[0.58, 0.76, 16]} />
                <meshBasicMaterial
                  color={crossingColor}
                  transparent
                  opacity={isOverview ? 0.76 : 0.3}
                  depthWrite={false}
                />
              </mesh>
              <mesh position={[0, 0.04, 0]} renderOrder={8}>
                <cylinderGeometry args={[0.11, 0.11, 0.08, 8]} />
                <meshStandardMaterial color={crossingColor} emissive={crossingColor} emissiveIntensity={isNight ? 1.5 : 0.2} />
              </mesh>
              {isOverview && (
                <Html position={[0, 1.25, 0]} center distanceFactor={104} zIndexRange={[42, 0]}>
                  <div
                    role="note"
                    aria-label={`OSM crossing ${trace.id}. ${crossingLabel}. Markings unmarked.`}
                    style={{
                      pointerEvents: 'none',
                      padding: '2px 4px',
                      border: `1px solid ${crossingColor}99`,
                      borderRadius: 3,
                      background: 'rgba(2, 8, 23, 0.72)',
                      color: crossingColor,
                      fontFamily: 'monospace',
                      fontSize: 7,
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    OSM CROSSING · {crossingLabel} · UNMARKED
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {/* JunctionRoads keeps its authored U-turn asphalt and chevrons inside
          the non-source fallback branch. In the live source-backed scene this
          group is therefore an audit visualization, not a surveyed road. Keep
          the source-linked replay ribbon narrow and translucent; the mapped
          road/footway remains the primary visual surface. */}
      {isOverview && (
        <group
          name="ModelledUturnBirdAudit"
          userData={{
            source: 'OSM relation/18922642',
            status: 'source-linked scenario replay',
            legality: 'no_u_turn in snapshot; field verification required'
          }}
        >
        {/* A restrained center halo anchors the signal table without covering the
            source road surface. */}
        <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
          <ringGeometry args={[5.8, 6.05, 48]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={isNight ? 0.9 : 0.72} depthWrite={false} />
        </mesh>

        {/* The two short source-linked surfaces use the shared road-ribbon
            builder; they are an audit overlay, not a claim that OSM permits
            this turn. */}
        <mesh geometry={northSurfaceGeometry} renderOrder={7}>
          <meshStandardMaterial color="#334155" roughness={0.92} metalness={0.04} transparent opacity={0.2} depthWrite={false} />
        </mesh>
        <mesh geometry={southSurfaceGeometry} renderOrder={7}>
          <meshStandardMaterial color="#334155" roughness={0.92} metalness={0.04} transparent opacity={0.2} depthWrite={false} />
        </mesh>
        <mesh geometry={northDashGeometry} renderOrder={9}>
          <meshBasicMaterial color="#f8fafc" transparent opacity={0.86} depthWrite={false} />
        </mesh>
        <mesh geometry={southDashGeometry} renderOrder={9}>
          <meshBasicMaterial color="#f8fafc" transparent opacity={0.86} depthWrite={false} />
        </mesh>
        {northEdgeGeometries.map((geometry, index) => (
          <mesh key={`north-turn-edge-${index}`} geometry={geometry} renderOrder={9}>
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.92} depthWrite={false} />
          </mesh>
        ))}
        {southEdgeGeometries.map((geometry, index) => (
          <mesh key={`south-turn-edge-${index}`} geometry={geometry} renderOrder={9}>
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.92} depthWrite={false} />
          </mesh>
        ))}

        {/* A narrow amber center trace and direction chevrons make the
            modelled vehicle flow readable while staying visibly separate from
            the source road and the red OSM restriction layer. */}
        <mesh renderOrder={8}>
          <tubeGeometry args={[northCurve, 96, 0.1, 8, false]} />
          <meshBasicMaterial color={accent} transparent opacity={0.92} depthWrite={false} />
        </mesh>
        <mesh renderOrder={8}>
          <tubeGeometry args={[southCurve, 96, 0.1, 8, false]} />
          <meshBasicMaterial color={accent} transparent opacity={0.92} depthWrite={false} />
        </mesh>
        <DirectionMarkers id="north" connector={U_TURN_CONNECTORS.north} curve={northCurve} color={accent} laneOffset={-MODELLED_REPLAY_LANE_OFFSET} />
        <DirectionMarkers id="south" connector={U_TURN_CONNECTORS.south} curve={southCurve} color={accent} laneOffset={MODELLED_REPLAY_LANE_OFFSET} />

        <FocusLabel
          position={northLabelPosition}
          title="NORTH TURN REPLAY"
          detail="SOURCE-LINKED · OSM NO U-TURN"
        />
        <FocusLabel
          position={southLabelPosition}
          title="SOUTH TURN REPLAY"
          detail="REVERSE SCENARIO · FIELD VERIFY"
        />
        <FocusLabel
          position={[-6, 7, 18]}
          title="MARATHAHALLI CROSSOVER"
          detail="OSM ROADS + FOOTWAYS · TURN STATUS UNRESOLVED"
        />
        <FocusLabel
          position={[12, 5.4, 1]}
          title="TURN REPLAY"
          detail="YIELD → SWEEP → EXIT · MODELLED · NOT COUNTED"
        />
        <CrossoverTurnGuide id="north" connector={U_TURN_CONNECTORS.north} curve={northCurve} laneOffset={-MODELLED_REPLAY_LANE_OFFSET} isNight={isNight} cameraMode={cameraMode} conflictRef={replayConflictRef} />
        <CrossoverTurnGuide id="south" connector={U_TURN_CONNECTORS.south} curve={southCurve} laneOffset={MODELLED_REPLAY_LANE_OFFSET} isNight={isNight} cameraMode={cameraMode} conflictRef={replayConflictRef} />
        </group>
      )}

      {/* A pair of uncounted hero vehicles make the source-linked maneuver
          legible at a glance. The configured fleet remains in TrafficSystem;
          these meshes are presentation aids only and carry explicit source
          and legality metadata. */}
      <CrossoverReplayVehicle
        id="north"
        connector={U_TURN_CONNECTORS.north}
        curve={northCurve}
        startProgress={0.08}
        stopProgress={U_TURN_CONNECTORS.north.stopT}
        laneOffset={-0.72}
        color="#0ea5e9"
        isNight={isNight}
        cameraMode={cameraMode}
        conflictRef={replayConflictRef}
      />

      <CrossoverReplayVehicle
        id="south"
        connector={U_TURN_CONNECTORS.south}
        curve={southCurve}
        startProgress={0.08}
        stopProgress={U_TURN_CONNECTORS.south.stopT}
        laneOffset={0.72}
        color="#f97316"
        isNight={isNight}
        cameraMode={cameraMode}
        conflictRef={replayConflictRef}
      />

      {/* At eye level, retain only a thin, low-contrast audit trace. The
          source-backed road and footpaths remain the pedestrian experience. */}
      {!isOverview && (
        <>
          <mesh geometry={northDashGeometry} renderOrder={9}>
            <meshBasicMaterial color={accent} transparent opacity={0.42} depthWrite={false} />
          </mesh>
          <mesh geometry={southDashGeometry} renderOrder={9}>
            <meshBasicMaterial color={accent} transparent opacity={0.42} depthWrite={false} />
          </mesh>
          {northEdgeGeometries.map((geometry, index) => (
            <mesh key={`north-person-edge-${index}`} geometry={geometry} renderOrder={9}>
              <meshBasicMaterial color={accent} transparent opacity={0.3} depthWrite={false} />
            </mesh>
          ))}
          {southEdgeGeometries.map((geometry, index) => (
            <mesh key={`south-person-edge-${index}`} geometry={geometry} renderOrder={9}>
              <meshBasicMaterial color={accent} transparent opacity={0.3} depthWrite={false} />
            </mesh>
          ))}
          <CrossoverTurnGuide id="north" connector={U_TURN_CONNECTORS.north} curve={northCurve} laneOffset={-MODELLED_REPLAY_LANE_OFFSET} isNight={isNight} cameraMode="walk" conflictRef={replayConflictRef} />
          <CrossoverTurnGuide id="south" connector={U_TURN_CONNECTORS.south} curve={southCurve} laneOffset={MODELLED_REPLAY_LANE_OFFSET} isNight={isNight} cameraMode="walk" conflictRef={replayConflictRef} />
        </>
      )}
    </group>
  );
};

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { U_TURN_CONNECTORS } from '../../../data/marathahalliLaneNetwork';
import { createRoadRibbonGeometry } from '../../../data/RealRoadData';
import { createCarGeometry } from '../traffic/VehicleModels';

interface CrossoverFocusOverlayProps {
  isNight?: boolean;
  cameraMode?: 'walk' | 'overview';
}

const createConnectorCurve = (points: readonly [number, number, number][]) => new THREE.CatmullRomCurve3(
  points.map(([x, y, z]) => new THREE.Vector3(x, y + 0.18, z)),
  false,
  'centripetal',
  0.25
);

function createConnectorSurfaceGeometry(
  points: readonly [number, number, number][]
) {
  // Keep the audit ribbon on the same geometry contract as JunctionRoads:
  // same control points, centripetal interpolation, sampling density and
  // pavement datum. The overlay is still modelled, but it cannot visually
  // drift from the shared scenario lane if the source points are revised.
  return createRoadRibbonGeometry(
    points.map(([x, _y, z]) => [x, z]),
    3.8,
    () => 0.19,
    64,
    'centripetal'
  );
}

function createConnectorDashGeometry(curve: THREE.CatmullRomCurve3) {
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
}> = ({ position, title, detail }) => (
  <Html position={position} center distanceFactor={88} zIndexRange={[45, 0]}>
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
  id: string;
  curve: THREE.CatmullRomCurve3;
  startProgress: number;
  laneOffset: number;
  color: string;
  isNight: boolean;
  cameraMode: 'walk' | 'overview';
}> = ({ id, curve, startProgress, laneOffset, color, isNight, cameraMode }) => {
  const vehicleRef = useRef<THREE.Group>(null);
  const progressRef = useRef(startProgress);
  const geometry = useMemo(() => createCarGeometry(), []);
  const curveLength = useMemo(() => curve.getLength(), [curve]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.34,
    metalness: 0.58,
    emissive: isNight ? new THREE.Color(color) : new THREE.Color('#000000'),
    emissiveIntensity: isNight ? 0.42 : 0
  }), [color, isNight]);
  const point = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((_, delta) => {
    const vehicle = vehicleRef.current;
    if (!vehicle) return;

    progressRef.current = (progressRef.current + (delta * 6.4) / Math.max(1, curveLength)) % 1;
    curve.getPointAt(progressRef.current, point);
    curve.getTangentAt(progressRef.current, tangent).setY(0).normalize();
    normal.set(-tangent.z, 0, tangent.x).normalize();
    vehicle.position.set(
      point.x + normal.x * laneOffset,
      0.12,
      point.z + normal.z * laneOffset
    );
    // VehicleModels faces +Z; rotate it into the direction of the source
    // replay tangent while keeping the wheels on the mapped road datum.
    vehicle.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI;
  });

  return (
    <group
      ref={vehicleRef}
      name={`CrossoverReplayVehicle-${id}`}
      userData={{
        source: 'OSM relation/18922642',
        status: 'modelled visual replay',
        countedInFleet: false
      }}
    >
      <mesh geometry={geometry} material={material} scale={cameraMode === 'walk' ? 0.54 : 0.72} castShadow />
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

const DirectionMarkers: React.FC<{
  id: string;
  curve: THREE.CatmullRomCurve3;
  color: string;
}> = ({ id, curve, color }) => {
  const markers = useMemo(() => [0.34, 0.48, 0.62, 0.76].map((t) => {
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).setY(0).normalize();
    return {
      position: [point.x, 0.46, point.z] as [number, number, number],
      angle: Math.atan2(tangent.x, tangent.z)
    };
  }), [curve]);

  return (
    <group name={`ModelledUturnDirectionMarkers-${id}`}>
      {markers.map((marker, index) => (
        <group
          key={`${id}-direction-marker-${index}`}
          position={marker.position}
          rotation={[0, marker.angle, 0]}
        >
          {/* These are orientation annotations, not traffic signs or legal
              permissions. They use the same curve as the modelled fleet. */}
          <mesh position={[-0.22, 0, 0.16]} rotation={[0, -0.62, 0]} renderOrder={10}>
            <boxGeometry args={[0.16, 0.045, 0.72]} />
            <meshBasicMaterial color={color} transparent opacity={0.94} depthWrite={false} />
          </mesh>
          <mesh position={[0.22, 0, 0.16]} rotation={[0, 0.62, 0]} renderOrder={10}>
            <boxGeometry args={[0.16, 0.045, 0.72]} />
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
  const northCurve = useMemo(() => createConnectorCurve(U_TURN_CONNECTORS.north.points), []);
  const southCurve = useMemo(() => createConnectorCurve(U_TURN_CONNECTORS.south.points), []);
  const northSurfaceGeometry = useMemo(
    () => createConnectorSurfaceGeometry(U_TURN_CONNECTORS.north.points),
    []
  );
  const southSurfaceGeometry = useMemo(
    () => createConnectorSurfaceGeometry(U_TURN_CONNECTORS.south.points),
    []
  );
  const northDashGeometry = useMemo(() => createConnectorDashGeometry(northCurve), [northCurve]);
  const southDashGeometry = useMemo(() => createConnectorDashGeometry(southCurve), [southCurve]);
  const northLabelPosition = useMemo(() => {
    const point = northCurve.getPointAt(0.58);
    const tangent = northCurve.getTangentAt(0.58).setY(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    return [point.x + normal.x * 8, 4.8, point.z + normal.z * 8] as [number, number, number];
  }, [northCurve]);
  const southLabelPosition = useMemo(() => {
    const point = southCurve.getPointAt(0.58);
    const tangent = southCurve.getTangentAt(0.58).setY(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    return [point.x - normal.x * 8, 4.8, point.z - normal.z * 8] as [number, number, number];
  }, [southCurve]);
  const gates = useMemo(() => [
    {
      id: 'relation-via-entry',
      position: [U_TURN_CONNECTORS.north.points[4][0], 0.42, U_TURN_CONNECTORS.north.points[4][2]] as [number, number, number]
    },
    {
      id: 'relation-via-exit',
      position: [U_TURN_CONNECTORS.north.points[6][0], 0.42, U_TURN_CONNECTORS.north.points[6][2]] as [number, number, number]
    }
  ], []);
  const accent = isNight ? '#fbbf24' : '#f59e0b';
  const isOverview = cameraMode === 'overview';

  React.useEffect(() => () => {
    northSurfaceGeometry.dispose();
    southSurfaceGeometry.dispose();
    northDashGeometry.dispose();
    southDashGeometry.dispose();
  }, [northDashGeometry, northSurfaceGeometry, southDashGeometry, southSurfaceGeometry]);

  return (
    <group name="MarathahalliCrossoverSourceAlignmentOverlay">
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
        <DirectionMarkers id="north" curve={northCurve} color={accent} />
        <DirectionMarkers id="south" curve={southCurve} color={accent} />

        {/* These gates are anchored to the exact via vertices of the source
            relation trace. They are modelled audit markers, not
            legal-movement permissions. */}
        {gates.map((gate) => (
          <group key={gate.id} position={gate.position}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={9}>
              <ringGeometry args={[1.35, 1.58, 20]} />
              <meshBasicMaterial color="#f8fafc" transparent opacity={0.9} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 1.35, 8]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={isNight ? 1.6 : 0.35} />
            </mesh>
          </group>
        ))}

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
          detail="2 HERO VEHICLES · MODELLED · NOT COUNTED"
        />
        </group>
      )}

      {/* A pair of uncounted hero vehicles make the source-linked maneuver
          legible at a glance. The configured fleet remains in TrafficSystem;
          these meshes are presentation aids only and carry explicit source
          and legality metadata. */}
      <CrossoverReplayVehicle
        id="north"
        curve={northCurve}
        startProgress={0.08}
        laneOffset={-0.72}
        color="#0ea5e9"
        isNight={isNight}
        cameraMode={cameraMode}
      />
      <CrossoverReplayVehicle
        id="south"
        curve={southCurve}
        startProgress={0.58}
        laneOffset={0.72}
        color="#f97316"
        isNight={isNight}
        cameraMode={cameraMode}
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
        </>
      )}
    </group>
  );
};

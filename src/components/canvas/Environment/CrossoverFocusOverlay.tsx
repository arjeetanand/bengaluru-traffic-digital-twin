import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { U_TURN_CONNECTORS } from '../../../data/marathahalliLaneNetwork';

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

function createConnectorSurfaceGeometry(curve: THREE.CatmullRomCurve3, width: number) {
  const positions: number[] = [];
  const points = curve.getSpacedPoints(160);
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const tangent = current.clone().sub(previous).setY(0).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    const previousY = 0.19;
    const currentY = 0.19;
    positions.push(
      previous.x + normal.x, previousY, previous.z + normal.z,
      current.x + normal.x, currentY, current.z + normal.z,
      previous.x - normal.x, previousY, previous.z - normal.z,
      current.x + normal.x, currentY, current.z + normal.z,
      current.x - normal.x, currentY, current.z - normal.z,
      previous.x - normal.x, previousY, previous.z - normal.z
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
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
  <Html position={position} center distanceFactor={120} zIndexRange={[45, 0]}>
    <div
      style={{
        pointerEvents: 'none',
        minWidth: 154,
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

/**
 * Focus aid for the crossover preset. The highlighted paths are not a second
 * traffic network: they are generated from U_TURN_CONNECTORS, the same
 * source-aligned connector points consumed by JunctionRoads and TrafficSystem.
 * The OSM snapshot also carries a no_u_turn relation, so these remain
 * scenario links until the turn restriction is reconciled with the field plan.
 */
export const CrossoverFocusOverlay: React.FC<CrossoverFocusOverlayProps> = ({
  isNight = false,
  cameraMode = 'overview'
}) => {
  const northCurve = useMemo(() => createConnectorCurve(U_TURN_CONNECTORS.north.points), []);
  const southCurve = useMemo(() => createConnectorCurve(U_TURN_CONNECTORS.south.points), []);
  const northSurfaceGeometry = useMemo(() => createConnectorSurfaceGeometry(northCurve, 5.4), [northCurve]);
  const southSurfaceGeometry = useMemo(() => createConnectorSurfaceGeometry(southCurve, 5.4), [southCurve]);
  const northDashGeometry = useMemo(() => createConnectorDashGeometry(northCurve), [northCurve]);
  const southDashGeometry = useMemo(() => createConnectorDashGeometry(southCurve), [southCurve]);
  const accent = isNight ? '#fbbf24' : '#f59e0b';

  React.useEffect(() => () => {
    northSurfaceGeometry.dispose();
    southSurfaceGeometry.dispose();
    northDashGeometry.dispose();
    southDashGeometry.dispose();
  }, [northDashGeometry, northSurfaceGeometry, southDashGeometry, southSurfaceGeometry]);

  return (
    <group name="MarathahalliCrossoverSourceAlignmentOverlay">
      {/* A restrained center halo anchors the signal table without covering the
          source road surface. */}
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
        <ringGeometry args={[5.8, 6.05, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={isNight ? 0.9 : 0.72} depthWrite={false} />
      </mesh>

      {/* The two scenario loop surfaces share their exact traffic geometry. */}
      <mesh geometry={northSurfaceGeometry} renderOrder={7}>
        <meshStandardMaterial color="#1f2937" roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh geometry={southSurfaceGeometry} renderOrder={7}>
        <meshStandardMaterial color="#1f2937" roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh geometry={northDashGeometry} renderOrder={9}>
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.82} depthWrite={false} />
      </mesh>
      <mesh geometry={southDashGeometry} renderOrder={9}>
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.82} depthWrite={false} />
      </mesh>

      {/* A narrow amber center trace keeps the modelled scenario easy to audit
          without turning the whole route into a glowing tube. */}
      <mesh renderOrder={8}>
        <tubeGeometry args={[northCurve, 96, 0.1, 8, false]} />
        <meshBasicMaterial color={accent} transparent opacity={0.92} depthWrite={false} />
      </mesh>
      <mesh renderOrder={8}>
        <tubeGeometry args={[southCurve, 96, 0.1, 8, false]} />
        <meshBasicMaterial color={accent} transparent opacity={0.92} depthWrite={false} />
      </mesh>

      {/* Small source-style route gates make the loop entrance legible from a
          bird view without inventing another road or building. They are not a
          legal-movement assertion while the mapped restriction is unresolved. */}
      {[
        { id: 'north', position: [30.3, 0.42, 29.0] as [number, number, number] },
        { id: 'south', position: [-7.3, 0.42, -0.1] as [number, number, number] }
      ].map((gate) => (
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

      {cameraMode === 'overview' && (
        <>
          <FocusLabel
            position={[32, 5.1, 34]}
            title="NORTH U-TURN"
            detail="MODELLED SCENARIO · SOURCE ROAD LINKS"
          />
          <FocusLabel
            position={[-3, 4.4, -7]}
            title="SOUTH U-TURN"
            detail="MODELLED SCENARIO · SOURCE ROAD LINKS"
          />
          <FocusLabel
            position={[-2, 8, 14]}
            title="MARATHAHALLI CROSSOVER"
            detail="OSM ROAD FRAME · MODELLED SIGNAL"
          />
        </>
      )}
    </group>
  );
};

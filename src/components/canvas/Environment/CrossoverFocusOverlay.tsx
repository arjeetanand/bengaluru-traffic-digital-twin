import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
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
  const accent = isNight ? '#fbbf24' : '#f59e0b';

  return (
    <group name="MarathahalliCrossoverSourceAlignmentOverlay">
      {/* A restrained center halo anchors the signal table without covering the
          source road surface. */}
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
        <ringGeometry args={[5.8, 6.05, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={isNight ? 0.9 : 0.72} depthWrite={false} />
      </mesh>

      {/* The two scenario loop paths share their exact traffic geometry. */}
      <mesh renderOrder={8}>
        <tubeGeometry args={[northCurve, 96, 0.22, 8, false]} />
        <meshBasicMaterial color={accent} transparent opacity={0.92} depthWrite={false} />
      </mesh>
      <mesh renderOrder={8}>
        <tubeGeometry args={[southCurve, 96, 0.22, 8, false]} />
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
            detail="MODELLED ROUTE · OSM no_u_turn"
          />
          <FocusLabel
            position={[-3, 4.4, -7]}
            title="SOUTH U-TURN"
            detail="MODELLED ROUTE · OSM no_u_turn"
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

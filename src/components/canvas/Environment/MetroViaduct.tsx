import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  getOrrMedianPointAtZ,
  getOrrOffsetPointAtZ,
  getOrrRoadFrameAtZ
} from '../../../data/RealRoadData';

interface MetroViaductProps {
  isNight: boolean;
}

const METRO_PATH_Z_COORDS = [-225, -210, -165, -120, -75, -42, 42, 75, 120, 165, 205] as const;

interface MetroBeamSpec {
  lateralOffset: number;
  width: number;
  height: number;
  y: number;
}

/**
 * Build short overlapping box segments along the source-backed ORR curve.
 * This keeps the viaduct deck, parapets and rails aligned with the road's
 * tangent instead of making the elevated structure a visually obvious
 * straight x=0 shortcut through the curved junction.
 */
function createCurvedBeamsGeometry(
  pathZCoords: readonly number[],
  beams: readonly MetroBeamSpec[]
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const yAxis = new THREE.Vector3(0, 1, 0);

  for (const beam of beams) {
    for (let index = 1; index < pathZCoords.length; index += 1) {
      const start = getOrrMedianPointAtZ(pathZCoords[index - 1]);
      const end = getOrrMedianPointAtZ(pathZCoords[index]);
      const startFrame = getOrrRoadFrameAtZ(pathZCoords[index - 1]);
      const endFrame = getOrrRoadFrameAtZ(pathZCoords[index]);
      const startNormal: [number, number] = [-startFrame.tangentZ, startFrame.tangentX];
      const endNormal: [number, number] = [-endFrame.tangentZ, endFrame.tangentX];
      const lateralStart: [number, number] = [
        start[0] + startNormal[0] * beam.lateralOffset,
        start[1] + startNormal[1] * beam.lateralOffset
      ];
      const lateralEnd: [number, number] = [
        end[0] + endNormal[0] * beam.lateralOffset,
        end[1] + endNormal[1] * beam.lateralOffset
      ];
      const dx = lateralEnd[0] - lateralStart[0];
      const dz = lateralEnd[1] - lateralStart[1];
      const length = Math.max(0.4, Math.hypot(dx, dz));
      const midpoint = new THREE.Vector3(
        (lateralStart[0] + lateralEnd[0]) / 2,
        beam.y,
        (lateralStart[1] + lateralEnd[1]) / 2
      );
      const angle = Math.atan2(dx, dz);
      const geometry = new THREE.BoxGeometry(beam.width, beam.height, length + 0.55);
      geometry.applyMatrix4(
        new THREE.Matrix4().compose(
          midpoint,
          new THREE.Quaternion().setFromAxisAngle(yAxis, angle),
          new THREE.Vector3(1, 1, 1)
        )
      );
      parts.push(geometry);
    }
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((geometry) => geometry.dispose());
  return merged || new THREE.BufferGeometry();
}

function getMetroPathAngle(z: number) {
  const frame = getOrrRoadFrameAtZ(z);
  return Math.atan2(frame.tangentX, frame.tangentZ);
}

export const MetroViaduct: React.FC<MetroViaductProps> = ({ isNight }) => {
  const metroHeight = 15.5; // elevated cleanly above underpass (-7.5m), surface (0m), and skywalk (7.2m)
  const metroWidth = 6.8;   // corrected: real BMRCL U-girder width (was 9.8m — too wide)
  const metroTrainRef = useRef<THREE.Group>(null);
  const metroTrainZRef = useRef(-120);

  // Metro pier coordinates along the median. The two inner supports are
  // pushed just beyond the underpass/skywalk clear zone so foundations do not
  // sit in the sunken carriageway or cut through the pedestrian deck.
  const pierZCoords = useMemo(
    () => [-210, -165, -120, -75, -42, 42, 75, 120, 165],
    []
  );
  const pierFrames = useMemo(
    () => pierZCoords.map((zCoord) => ({
      zCoord,
      point: getOrrMedianPointAtZ(zCoord),
      angle: getMetroPathAngle(zCoord)
    })),
    [pierZCoords]
  );
  const beaconFrames = useMemo(
    () => [-180, -90, 0, 90, 180].map((zCoord) => ({
      point: getOrrMedianPointAtZ(zCoord),
      zCoord,
      angle: getMetroPathAngle(zCoord)
    })),
    []
  );

  const concreteMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.85,
      metalness: 0.1
    });
  }, []);

  const parapetMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      roughness: 0.75,
      metalness: 0.15
    });
  }, []);

  const deckGeometry = useMemo(
    () => createCurvedBeamsGeometry(METRO_PATH_Z_COORDS, [
      { lateralOffset: 0, width: metroWidth, height: 1.1, y: metroHeight }
    ]),
    [metroHeight, metroWidth]
  );
  const parapetGeometry = useMemo(
    () => createCurvedBeamsGeometry(METRO_PATH_Z_COORDS, [
      { lateralOffset: -metroWidth / 2 + 0.25, width: 0.5, height: 1.4, y: metroHeight + 0.9 },
      { lateralOffset: metroWidth / 2 - 0.25, width: 0.5, height: 1.4, y: metroHeight + 0.9 }
    ]),
    [metroHeight, metroWidth]
  );
  const blueStripeGeometry = useMemo(
    () => createCurvedBeamsGeometry(METRO_PATH_Z_COORDS, [
      { lateralOffset: -metroWidth / 2 - 0.02, width: 0.04, height: 0.5, y: metroHeight + 0.9 },
      { lateralOffset: metroWidth / 2 + 0.02, width: 0.04, height: 0.5, y: metroHeight + 0.9 }
    ]),
    [metroHeight, metroWidth]
  );
  const cableTrayGeometry = useMemo(
    () => createCurvedBeamsGeometry(METRO_PATH_Z_COORDS, [
      { lateralOffset: 0, width: 0.8, height: 0.6, y: metroHeight + 0.4 }
    ]),
    [metroHeight]
  );
  const railGeometry = useMemo(
    () => createCurvedBeamsGeometry(METRO_PATH_Z_COORDS, [
      { lateralOffset: -2.4, width: 0.12, height: 0.12, y: metroHeight + 0.4 },
      { lateralOffset: -1.0, width: 0.12, height: 0.12, y: metroHeight + 0.4 },
      { lateralOffset: 1.0, width: 0.12, height: 0.12, y: metroHeight + 0.4 },
      { lateralOffset: 2.4, width: 0.12, height: 0.12, y: metroHeight + 0.4 }
    ]),
    [metroHeight]
  );
  const thirdRailGeometry = useMemo(
    () => createCurvedBeamsGeometry(METRO_PATH_Z_COORDS, [
      { lateralOffset: -3.1, width: 0.1, height: 0.1, y: metroHeight + 0.5 },
      { lateralOffset: 3.1, width: 0.1, height: 0.1, y: metroHeight + 0.5 }
    ]),
    [metroHeight]
  );
  const stationPoint = useMemo(() => getOrrMedianPointAtZ(95), []);
  const stationAngle = useMemo(() => getMetroPathAngle(95), []);

  // Animate 6-Coach Namma Metro Train smoothly gliding on Track 1 (Northbound)
  // Speed: 16 units/sec ≈ 58 km/h (realistic viaduct approach speed)
  useFrame((_, delta) => {
    if (!metroTrainRef.current) return;
    metroTrainZRef.current += 16 * delta;
    if (metroTrainZRef.current > 205) {
      metroTrainZRef.current = -210;
    }
    const [trainX, trainZ] = getOrrOffsetPointAtZ(
      metroTrainZRef.current,
      -1.7 - 6.3
    );
    metroTrainRef.current.position.set(trainX, metroHeight + 0.7, trainZ);
    metroTrainRef.current.rotation.y = getMetroPathAngle(metroTrainZRef.current);
  });

  return (
    <group name="NammaMetroBlueLineViaduct">
      {/* ── Tall Concrete Cylindrical Metro Piers with Hammerhead Caps & BMRCL Barricades ── */}
      {pierFrames.map(({ zCoord, point, angle }, idx) => (
        <group
          key={`metro-pier-${idx}`}
          position={[point[0], 0, point[1]]}
          rotation={[0, angle, 0]}
        >
          {/* Main cylindrical column */}
          <mesh position={[0, metroHeight / 2, 0]} castShadow receiveShadow material={concreteMat}>
            <cylinderGeometry args={[1.18, 1.38, metroHeight, 16]} />
          </mesh>

          {/* Heavy Hammerhead Pier Cap (supporting U-girders) */}
          <mesh position={[0, metroHeight - 0.7, 0]} castShadow receiveShadow material={concreteMat}>
            <boxGeometry args={[metroWidth + 0.45, 1.25, 2.9]} />
          </mesh>

          {/* Pier base pedestal */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={concreteMat}>
            <cylinderGeometry args={[1.95, 2.25, 0.9, 16]} />
          </mesh>

          {/* ── BMRCL Ground-Level Construction Barricades enclosing Pier Foundation ── */}
          {Math.abs(zCoord) > 35 && (
            <group position={[0, 0, 0]}>
              {/* North & South Barricades */}
              <mesh position={[0, 0.82, 2.7]} castShadow>
                <boxGeometry args={[5.4, 1.55, 0.1]} />
                <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.3} />
              </mesh>
              <mesh position={[0, 0.82, -2.7]} castShadow>
                <boxGeometry args={[5.4, 1.55, 0.1]} />
                <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.3} />
              </mesh>
              {/* East & West Barricades (Blue BMRCL) */}
              <mesh position={[2.7, 0.82, 0]} castShadow>
                <boxGeometry args={[0.1, 1.55, 5.4]} />
                <meshStandardMaterial color="#0284c7" roughness={0.6} metalness={0.3} />
              </mesh>
              <mesh position={[-2.7, 0.82, 0]} castShadow>
                <boxGeometry args={[0.1, 1.55, 5.4]} />
                <meshStandardMaterial color="#0284c7" roughness={0.6} metalness={0.3} />
              </mesh>
              {/* BMRCL Logo White Stripe */}
              <mesh position={[2.76, 1.0, 0]}>
                <boxGeometry args={[0.02, 0.3, 4.8]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[-2.76, 1.0, 0]}>
                <boxGeometry args={[0.02, 0.3, 4.8]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>

              {/* Steel Rebar Cage on Construction Site */}
              <mesh position={[0.9, 1.05, 0.9]}>
                <cylinderGeometry args={[0.6, 0.6, 2.4, 8]} />
                <meshStandardMaterial color="#64748b" wireframe />
              </mesh>

              {/* Warning hazard blinkers on barricade corners */}
              {[-2.6, 2.6].map((xP, i) => (
                <group key={i} position={[xP, 1.68, 2.6]}>
                  <mesh>
                    <boxGeometry args={[0.2, 0.25, 0.2]} />
                    <meshStandardMaterial
                      color="#f59e0b"
                      emissive="#eab308"
                      emissiveIntensity={isNight ? 3.5 : 0.8}
                    />
                  </mesh>
                </group>
              ))}
            </group>
          )}
        </group>
      ))}

      {/* ── Curved Elevated Metro Viaduct Track Deck (Multiplex → Kalamandir) ── */}
      {/* Each short precast segment follows the sampled OSM-backed ORR tangent. */}
      <mesh geometry={deckGeometry} receiveShadow castShadow material={concreteMat} />
      <mesh geometry={parapetGeometry} castShadow material={parapetMat} />
      <mesh geometry={blueStripeGeometry}>
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </mesh>
      <mesh geometry={cableTrayGeometry} material={parapetMat} />
      <mesh geometry={railGeometry}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
      </mesh>
      <mesh geometry={thirdRailGeometry}>
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>

      <group>

        {/* ── Animated 6-Coach Namma Metro Train Gliding on Track 1 ── */}
        <group ref={metroTrainRef} position={[0, metroHeight + 0.7, -120]}>
          {/* Train Head Car Cab */}
          <MetroTrainCar position={[0, 1.4, 30]} isHead isNight={isNight} />
          {/* Middle Coaches */}
          <MetroTrainCar position={[0, 1.4, 15]} isNight={isNight} />
          <MetroTrainCar position={[0, 1.4, 0]} isNight={isNight} />
          <MetroTrainCar position={[0, 1.4, -15]} isNight={isNight} />
          <MetroTrainCar position={[0, 1.4, -30]} isNight={isNight} />
          {/* Rear Car */}
          <MetroTrainCar position={[0, 1.4, -45]} isTail isNight={isNight} />
        </group>

        {/* ── Elevated Marathahalli Metro Station (Near Kalamandir at z = 95) ── */}
        <group
          position={[stationPoint[0], metroHeight, stationPoint[1]]}
          rotation={[0, stationAngle, 0]}
        >
          {/* Platform Deck Expansion */}
          <mesh position={[0, 0.2, 0]} receiveShadow material={concreteMat}>
            <boxGeometry args={[18, 0.8, 58]} />
          </mesh>

          {/* Station Arched Canopy Roof (low-profile so the junction remains legible) */}
          <mesh position={[0, 4.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[3.9, 3.9, 34, 24, 1, true, 0, Math.PI]} />
            <meshStandardMaterial
              color="#1e3a5f"
              metalness={0.45}
              roughness={0.72}
              transparent
              opacity={0.62}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[-3.65, 4.25, 0]}>
            <boxGeometry args={[0.18, 0.22, 34]} />
            <meshStandardMaterial color="#0284c7" metalness={0.55} roughness={0.32} />
          </mesh>
          <mesh position={[3.65, 4.25, 0]}>
            <boxGeometry args={[0.18, 0.22, 34]} />
            <meshStandardMaterial color="#0284c7" metalness={0.55} roughness={0.32} />
          </mesh>

          {/* Lower Concourse Level (y = -5.0m below track deck = 10.5m above ground) */}
          <mesh position={[0, -4.8, 0]} receiveShadow material={concreteMat}>
            <boxGeometry args={[16, 0.6, 46]} />
          </mesh>

          {/* Station Signage Boards */}
          <mesh position={[0, 3.8, -29.2]}>
            <boxGeometry args={[14, 1.4, 0.2]} />
            <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 3.8, 29.2]}>
            <boxGeometry args={[14, 1.4, 0.2]} />
            <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
          </mesh>

          {/* East Pedestrian Access Stair Portal (Descending towards Kalamandir Footpath) */}
          <group position={[11, -7.5, 0]}>
            <mesh rotation={[0, 0, -Math.PI / 5]} position={[0, 0, 0]}>
              <boxGeometry args={[8.5, 0.4, 2.6]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
              <boxGeometry args={[8.5, 2.2, 2.8]} />
              <meshStandardMaterial color="#0284c7" transparent opacity={0.35} roughness={0.2} />
            </mesh>
          </group>

          {/* West Pedestrian Access Stair Portal (Descending towards Krishna Summit Footpath) */}
          <group position={[-11, -7.5, 0]}>
            <mesh rotation={[0, 0, Math.PI / 5]} position={[0, 0, 0]}>
              <boxGeometry args={[8.5, 0.4, 2.6]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
              <boxGeometry args={[8.5, 2.2, 2.8]} />
              <meshStandardMaterial color="#0284c7" transparent opacity={0.35} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Red Aviation Warning Beacons on Elevated Viaduct Masts */}
        {beaconFrames.map(({ point, angle }, i) => (
          <group key={i} position={[point[0], metroHeight + 1.8, point[1]]} rotation={[0, angle, 0]}>
            <mesh>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={isNight ? 3.8 : 1.4}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

// Subcomponent: Namma Metro Stainless Steel Train Car
const MetroTrainCar: React.FC<{
  position: [number, number, number];
  isHead?: boolean;
  isTail?: boolean;
  isNight: boolean;
}> = ({ position, isHead = false, isTail = false, isNight }) => {
  return (
    <group position={position}>
      {/* Stainless Steel Car Body */}
      <mesh castShadow>
        <boxGeometry args={[2.7, 2.6, 14]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Signature Namma Metro Blue / Purple Livery Cheatline */}
      <mesh position={[-1.37, 0, 0]}>
        <boxGeometry args={[0.02, 0.4, 13.8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </mesh>
      <mesh position={[1.37, 0, 0]}>
        <boxGeometry args={[0.02, 0.4, 13.8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </mesh>

      {/* Tinted Window Ribbon */}
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

      {/* Headlights on Leading Cab */}
      {isHead && (
        <group position={[0, 0, 7.1]}>
          <mesh position={[-0.7, 0.3, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#fffae0" emissiveIntensity={isNight ? 5 : 2} />
          </mesh>
          <mesh position={[0.7, 0.3, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#fffae0" emissiveIntensity={isNight ? 5 : 2} />
          </mesh>
          {isNight && (
            <pointLight position={[0, 0.3, 2]} intensity={25} distance={35} color="#fffbe6" />
          )}
        </group>
      )}

      {/* Red Taillights on Trailing Cab */}
      {isTail && (
        <group position={[0, 0, -7.1]}>
          <mesh position={[-0.7, 0.3, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={isNight ? 4 : 1.5} />
          </mesh>
          <mesh position={[0.7, 0.3, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={isNight ? 4 : 1.5} />
          </mesh>
        </group>
      )}
    </group>
  );
};

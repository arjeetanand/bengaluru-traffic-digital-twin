import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MetroViaductProps {
  isNight: boolean;
}

export const MetroViaduct: React.FC<MetroViaductProps> = ({ isNight }) => {
  const metroHeight = 15.5; // elevated cleanly above underpass (-7.5m), surface (0m), and skywalk (7.2m)
  const metroLength = 430;  // spans Z = -225 to +205 (Multiplex to Kalamandir)
  const metroWidth = 6.8;   // corrected: real BMRCL U-girder width (was 9.8m — too wide)
  const metroTrainRef = useRef<THREE.Group>(null);

  // Metro pier coordinates along the median (Z-axis, every 45m)
  const pierZCoords = useMemo(
    () => [-210, -165, -120, -75, -30, 30, 75, 120, 165],
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

  // Animate 6-Coach Namma Metro Train smoothly gliding on Track 1 (Northbound)
  // Speed: 16 units/sec ≈ 58 km/h (realistic viaduct approach speed)
  useFrame((_, delta) => {
    if (!metroTrainRef.current) return;
    metroTrainRef.current.position.z += 16 * delta;
    if (metroTrainRef.current.position.z > 210) {
      metroTrainRef.current.position.z = -210;
    }
  });

  return (
    <group name="NammaMetroBlueLineViaduct">
      {/* ── Tall Concrete Cylindrical Metro Piers with Hammerhead Caps & BMRCL Barricades ── */}
      {pierZCoords.map((zCoord, idx) => (
        <group key={`metro-pier-${idx}`} position={[0, 0, zCoord]}>
          {/* Main cylindrical column */}
          <mesh position={[0, metroHeight / 2, 0]} castShadow receiveShadow material={concreteMat}>
            <cylinderGeometry args={[1.6, 1.8, metroHeight, 16]} />
          </mesh>

          {/* Heavy Hammerhead Pier Cap (supporting U-girders) */}
          <mesh position={[0, metroHeight - 0.7, 0]} castShadow receiveShadow material={concreteMat}>
            <boxGeometry args={[metroWidth + 0.6, 1.4, 3.4]} />
          </mesh>

          {/* Pier base pedestal */}
          <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={concreteMat}>
            <cylinderGeometry args={[2.4, 2.7, 1.0, 16]} />
          </mesh>

          {/* ── BMRCL Ground-Level Construction Barricades enclosing Pier Foundation ── */}
          {Math.abs(zCoord) > 35 && (
            <group position={[0, 0, 0]}>
              {/* North & South Barricades */}
              <mesh position={[0, 0.9, 3.2]} castShadow>
                <boxGeometry args={[6.2, 1.8, 0.1]} />
                <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.3} />
              </mesh>
              <mesh position={[0, 0.9, -3.2]} castShadow>
                <boxGeometry args={[6.2, 1.8, 0.1]} />
                <meshStandardMaterial color="#eab308" roughness={0.6} metalness={0.3} />
              </mesh>
              {/* East & West Barricades (Blue BMRCL) */}
              <mesh position={[3.1, 0.9, 0]} castShadow>
                <boxGeometry args={[0.1, 1.8, 6.4]} />
                <meshStandardMaterial color="#0284c7" roughness={0.6} metalness={0.3} />
              </mesh>
              <mesh position={[-3.1, 0.9, 0]} castShadow>
                <boxGeometry args={[0.1, 1.8, 6.4]} />
                <meshStandardMaterial color="#0284c7" roughness={0.6} metalness={0.3} />
              </mesh>
              {/* BMRCL Logo White Stripe */}
              <mesh position={[3.16, 1.1, 0]}>
                <boxGeometry args={[0.02, 0.35, 5.8]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[-3.16, 1.1, 0]}>
                <boxGeometry args={[0.02, 0.35, 5.8]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>

              {/* Steel Rebar Cage on Construction Site */}
              <mesh position={[1.2, 1.2, 1.2]}>
                <cylinderGeometry args={[0.6, 0.6, 2.4, 8]} />
                <meshStandardMaterial color="#64748b" wireframe />
              </mesh>

              {/* Warning hazard blinkers on barricade corners */}
              {[-3.0, 3.0].map((xP, i) => (
                <group key={i} position={[xP, 1.9, 3.1]}>
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

      {/* ── Segmental Elevated Metro Viaduct Track Deck (Spanning Multiplex to Kalamandir) ── */}
      <group position={[0, metroHeight, 0]}>
        {/* Precast Concrete U-Girder Bottom Slab */}
        <mesh position={[0, 0, 0]} receiveShadow castShadow material={concreteMat}>
          <boxGeometry args={[metroWidth, 1.1, metroLength]} />
        </mesh>

        {/* Left Parapet Crash Wall (Blue Line accent) */}
        <mesh position={[-metroWidth / 2 + 0.25, 0.9, 0]} castShadow material={parapetMat}>
          <boxGeometry args={[0.5, 1.4, metroLength]} />
        </mesh>
        {/* Left Namma Metro Signature Blue Decorative Stripe */}
        <mesh position={[-metroWidth / 2 - 0.02, 0.9, 0]}>
          <boxGeometry args={[0.04, 0.5, metroLength]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>

        {/* Right Parapet Crash Wall */}
        <mesh position={[metroWidth / 2 - 0.25, 0.9, 0]} castShadow material={parapetMat}>
          <boxGeometry args={[0.5, 1.4, metroLength]} />
        </mesh>
        {/* Right Namma Metro Signature Blue Decorative Stripe */}
        <mesh position={[metroWidth / 2 + 0.02, 0.9, 0]}>
          <boxGeometry args={[0.04, 0.5, metroLength]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>

        {/* Central Divider / Cable Tray */}
        <mesh position={[0, 0.4, 0]} material={parapetMat}>
          <boxGeometry args={[0.8, 0.6, metroLength]} />
        </mesh>

        {/* Track 1 Rails (Northbound to KR Puram / Airport) */}
        <mesh position={[-2.4, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, metroLength, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[-1.0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, metroLength, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Third Rail (DC 750V with yellow cover) */}
        <mesh position={[-3.1, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, metroLength, 4]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>

        {/* Track 2 Rails (Southbound to Silk Board) */}
        <mesh position={[1.0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, metroLength, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[2.4, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, metroLength, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Third Rail Track 2 */}
        <mesh position={[3.1, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, metroLength, 4]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>

        {/* ── Animated 6-Coach Namma Metro Train Gliding on Track 1 ── */}
        <group ref={metroTrainRef} position={[-1.7, 0.7, -120]}>
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
        <group position={[0, 0, 95]}>
          {/* Platform Deck Expansion */}
          <mesh position={[0, 0.2, 0]} receiveShadow material={concreteMat}>
            <boxGeometry args={[18, 0.8, 58]} />
          </mesh>

          {/* Station Arched Canopy Roof (Blue Steel Space Frame) */}
          <mesh position={[0, 6.4, 0]}>
            <cylinderGeometry args={[9.8, 9.8, 58, 16, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
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
        {[-180, -90, 0, 90, 180].map((z, i) => (
          <group key={i} position={[0, 1.8, z]}>
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

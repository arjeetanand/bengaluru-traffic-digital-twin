import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RailwayTracksProps {
  isNight: boolean;
}

export const RailwayTracks: React.FC<RailwayTracksProps> = ({ isNight }) => {
  const trainRef = useRef<THREE.Group>(null);
  const trainSpeed = 24; // units per second
  const trackLength = 320;
  const railGauge = 1.676; // Indian Broad Gauge (1.676m)

  // Double tracks: Track 1 (Towards Bellandur / Carmelaram / Hosur) & Track 2 (Towards Baiyappanahalli)
  const trackOffset1 = -2.5; 
  const trackOffset2 = 2.5;

  // OHE (Overhead Electrification) Mast positions along track (avoiding ROB deck at |pos| < 15)
  const ohePositions = useMemo(() => {
    const arr: number[] = [];
    for (let pos = -140; pos <= 140; pos += 36) {
      if (Math.abs(pos) > 16) arr.push(pos);
    }
    return arr;
  }, []);

  // Animate Indian Railways train moving on Track 1
  useFrame((_, delta) => {
    if (!trainRef.current) return;
    trainRef.current.position.x += trainSpeed * delta;
    if (trainRef.current.position.x > 180) {
      trainRef.current.position.x = -180;
    }
  });

  return (
    // Position the entire corridor at real Google Maps railway location: x = 175m, rotated North-South
    <group name="IndianRailwaysCorridor" position={[175, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      {/* ── Crushed Granite Ballast Bed (Railway trackbed) ── */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[trackLength, 0.22, 12]} />
        <meshStandardMaterial color="#474747" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* ── Concrete Sleepers & Steel Rails for Track 1 ── */}
      <SingleTrack z={trackOffset1} length={trackLength} gauge={railGauge} />

      {/* ── Concrete Sleepers & Steel Rails for Track 2 ── */}
      <SingleTrack z={trackOffset2} length={trackLength} gauge={railGauge} />

      {/* ── Overhead Electrification (OHE) Catenary Masts & Wires ── */}
      {ohePositions.map((pos, idx) => (
        <OHEMast key={`ohe-${idx}`} x={pos} />
      ))}

      {/* Overhead Contact Wires (Tensioned high voltage copper wires) */}
      <mesh position={[0, 6.2, trackOffset1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, trackLength, 4]} />
        <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 6.2, trackOffset2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, trackLength, 4]} />
        <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* ── Animated Indian Railways Train (WAP-7 Loco + Passenger Coaches) ── */}
      <group ref={trainRef} position={[-80, 0.2, trackOffset1]}>
        {/* WAP-7 High-Speed Electric Locomotive */}
        <LocomotiveWAP7 isNight={isNight} />

        {/* Coach 1 (Red LHB AC 3-Tier) */}
        <PassengerCoach position={[-21, 0, 0]} color="#991b1b" stripeColor="#f59e0b" isNight={isNight} />

        {/* Coach 2 (Red LHB AC 2-Tier) */}
        <PassengerCoach position={[-42, 0, 0]} color="#991b1b" stripeColor="#f59e0b" isNight={isNight} />

        {/* Coach 3 (Classic Blue ICF Sleeper) */}
        <PassengerCoach position={[-63, 0, 0]} color="#1e40af" stripeColor="#93c5fd" isNight={isNight} />

        {/* Coach 4 (Classic Blue ICF Sleeper) */}
        <PassengerCoach position={[-84, 0, 0]} color="#1e40af" stripeColor="#93c5fd" isNight={isNight} />
      </group>
    </group>
  );
};

// Subcomponent: Broad-Gauge Track with Concrete Sleepers and Steel Rails
const SingleTrack: React.FC<{ z: number; length: number; gauge: number }> = ({ z, length, gauge }) => {
  const sleeperSpacing = 1.4;
  const sleeperCount = Math.floor(length / sleeperSpacing);

  const sleepers = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < sleeperCount; i++) {
      list.push(-length / 2 + (i + 0.5) * sleeperSpacing);
    }
    return list;
  }, [length, sleeperCount]);

  return (
    <group position={[0, 0, z]}>
      {/* Sleepers (Pre-stressed concrete cross-ties) */}
      {sleepers.map((x, idx) => (
        <mesh key={idx} position={[x, 0.2, 0]} receiveShadow>
          <boxGeometry args={[0.3, 0.16, 2.6]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.9} />
        </mesh>
      ))}

      {/* Left Steel Rail */}
      <mesh position={[0, 0.32, -gauge / 2]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.06, length, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Right Steel Rail */}
      <mesh position={[0, 0.32, gauge / 2]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.06, length, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
      </mesh>
    </group>
  );
};

// Subcomponent: Indian Railways OHE (Overhead Electrification) Steel Portal Mast
const OHEMast: React.FC<{ x: number }> = ({ x }) => {
  return (
    <group position={[x, 0, 0]}>
      {/* Left steel lattice column */}
      <mesh position={[0, 4.0, -8.2]} castShadow>
        <boxGeometry args={[0.35, 8.0, 0.35]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Right steel lattice column */}
      <mesh position={[0, 4.0, 8.2]} castShadow>
        <boxGeometry args={[0.35, 8.0, 0.35]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Overhead horizontal boom beam */}
      <mesh position={[0, 7.8, 0]} castShadow>
        <boxGeometry args={[0.4, 0.45, 16.8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Cantilever droppers and ceramic insulators */}
      <mesh position={[0, 6.8, -4.2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 6]} />
        <meshStandardMaterial color="#d97706" roughness={0.4} />
      </mesh>
      <mesh position={[0, 6.8, 4.2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 6]} />
        <meshStandardMaterial color="#d97706" roughness={0.4} />
      </mesh>
    </group>
  );
};

// Subcomponent: Indian Railways WAP-7 High-Horsepower Electric Locomotive
const LocomotiveWAP7: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Heavy aerodynamic body (White/Cream with Blue or Red/Cream stripes) */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[18.5, 3.2, 3.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Aerodynamic cab nose front (facing forward +X) */}
      <mesh position={[9.8, 2.1, 0]} rotation={[0, 0, -Math.PI / 8]} castShadow>
        <boxGeometry args={[1.8, 2.6, 3.16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
      {/* Aerodynamic cab nose rear */}
      <mesh position={[-9.8, 2.1, 0]} rotation={[0, 0, Math.PI / 8]} castShadow>
        <boxGeometry args={[1.8, 2.6, 3.16]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>

      {/* Bold Red Indian Railways center cheatline stripe */}
      <mesh position={[0, 2.2, 1.62]}>
        <boxGeometry args={[18.4, 0.7, 0.02]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[0, 2.2, -1.62]}>
        <boxGeometry args={[18.4, 0.7, 0.02]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>

      {/* Rooftop Pantographs (current collectors) */}
      <mesh position={[5.5, 4.4, 0]}>
        <boxGeometry args={[2.5, 0.8, 1.8]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} />
      </mesh>
      <mesh position={[-5.5, 4.4, 0]}>
        <boxGeometry args={[2.5, 0.8, 1.8]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} />
      </mesh>

      {/* Front High-Beam Dual Headlight */}
      <mesh position={[10.5, 2.6, 0]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fffae0"
          emissiveIntensity={isNight ? 5.0 : 2.0}
        />
      </mesh>
      {isNight && (
        <pointLight position={[13, 2.6, 0]} intensity={45} distance={60} color="#fffbe6" />
      )}

      {/* Bogies & Wheels (Co-Co 6-axle) */}
      {[-6.5, -4.5, -2.5, 2.5, 4.5, 6.5].map((x, idx) => (
        <React.Fragment key={idx}>
          <mesh position={[x, 0.6, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.25, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
          <mesh position={[x, 0.6, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.25, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
};

// Subcomponent: Indian Railways Passenger Coach (LHB or ICF style)
const PassengerCoach: React.FC<{
  position: [number, number, number];
  color: string;
  stripeColor: string;
  isNight: boolean;
}> = ({ position, color, stripeColor, isNight }) => {
  return (
    <group position={position}>
      {/* Main coach body */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[20, 2.9, 3.2]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Curved roof */}
      <mesh position={[0, 3.8, 0]}>
        <boxGeometry args={[20, 0.3, 3.1]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} />
      </mesh>

      {/* Window ribbon strip (Front & Back) */}
      <mesh position={[0, 2.45, 1.62]}>
        <boxGeometry args={[18.8, 0.65, 0.02]} />
        <meshStandardMaterial
          color={isNight ? '#fef08a' : '#0f172a'}
          emissive={isNight ? '#eab308' : '#000000'}
          emissiveIntensity={isNight ? 1.6 : 0}
        />
      </mesh>
      <mesh position={[0, 2.45, -1.62]}>
        <boxGeometry args={[18.8, 0.65, 0.02]} />
        <meshStandardMaterial
          color={isNight ? '#fef08a' : '#0f172a'}
          emissive={isNight ? '#eab308' : '#000000'}
          emissiveIntensity={isNight ? 1.6 : 0}
        />
      </mesh>

      {/* Decorative colored livery stripe */}
      <mesh position={[0, 1.5, 1.62]}>
        <boxGeometry args={[19.6, 0.25, 0.02]} />
        <meshStandardMaterial color={stripeColor} />
      </mesh>

      {/* Wheels */}
      {[-7.5, -5.5, 5.5, 7.5].map((x, idx) => (
        <React.Fragment key={idx}>
          <mesh position={[x, 0.5, 1.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[x, 0.5, -1.25]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.2, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </React.Fragment>
      ))}
    </group>
  );
};

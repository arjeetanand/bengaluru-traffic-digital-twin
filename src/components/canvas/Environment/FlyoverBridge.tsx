import React, { useMemo } from 'react';
import * as THREE from 'three';

interface FlyoverBridgeProps {
  isRaining: boolean;
  isNight: boolean;
}

export const FlyoverBridge: React.FC<FlyoverBridgeProps> = ({ isRaining, isNight }) => {
  const concreteMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isRaining ? '#73777d' : '#9ca3af',
      roughness: 0.85,
      metalness: 0.1
    });
  }, [isRaining]);

  const asphaltDeckMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isRaining ? '#111317' : '#1f2227',
      roughness: isRaining ? 0.3 : 0.8,
      metalness: isRaining ? 0.4 : 0.12
    });
  }, [isRaining]);

  const barrierMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#e5e7eb',
      roughness: 0.7,
      metalness: 0.15
    });
  }, []);

  const deckWidth = 14;      // 4 lanes along Z (z: -7 to +7)
  const deckHeight = 7.5;    // elevated clearance over railway
  const spanStart = 155;     // elevated span start X
  const spanEnd = 195;       // elevated span end X
  const spanLength = spanEnd - spanStart; // 40m
  const spanCenterX = (spanStart + spanEnd) / 2; // 175m

  const rampLength = 35;     // ramp length along X
  const rampAngle = Math.atan2(deckHeight, rampLength);
  const rampHypot = Math.hypot(deckHeight, rampLength);

  return (
    <group name="MarathahalliRailwayOverbridgeROB">
      {/* ── Main Elevated Bridge Deck (Spanning over Railway Corridor at x = 175) ── */}
      <group position={[spanCenterX, deckHeight, 0]}>
        {/* Concrete box girder structure */}
        <mesh position={[0, -0.6, 0]} receiveShadow castShadow material={concreteMat}>
          <boxGeometry args={[spanLength, 1.2, deckWidth]} />
        </mesh>
        {/* Asphalt road deck */}
        <mesh position={[0, 0.05, 0]} receiveShadow material={asphaltDeckMat}>
          <boxGeometry args={[spanLength, 0.1, deckWidth - 0.6]} />
        </mesh>

        {/* Center concrete crash barrier */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={barrierMat}>
          <boxGeometry args={[spanLength, 0.9, 0.6]} />
        </mesh>

        {/* North safety parapet (z = 6.65) */}
        <mesh position={[0, 0.6, deckWidth / 2 - 0.35]} castShadow receiveShadow material={barrierMat}>
          <boxGeometry args={[spanLength, 1.1, 0.7]} />
        </mesh>
        <HazardStripeParapetEastWest position={[0, 0.6, deckWidth / 2 + 0.02]} length={spanLength} />

        {/* South safety parapet (z = -6.65) */}
        <mesh position={[0, 0.6, -deckWidth / 2 + 0.35]} castShadow receiveShadow material={barrierMat}>
          <boxGeometry args={[spanLength, 1.1, 0.7]} />
        </mesh>
        <HazardStripeParapetEastWest position={[0, 0.6, -deckWidth / 2 - 0.02]} length={spanLength} />

        {/* Lane dashes on ROB deck (Eastbound & Westbound) */}
        {[-3.3, 3.3].map((zOffset, idx) => (
          <ROBDeckDashesEastWest key={idx} z={zOffset} length={spanLength} />
        ))}
      </group>

      {/* ── West Approach Ramp (ascending from x = 120, y = 0 to x = 155, y = 7.5m) ── */}
      <group position={[120 + rampLength / 2, deckHeight / 2, 0]}>
        <mesh
          rotation={[0, 0, rampAngle]}
          position={[0, -0.2, 0]}
          receiveShadow
          castShadow
          material={concreteMat}
        >
          <boxGeometry args={[rampHypot, 0.9, deckWidth]} />
        </mesh>
        <mesh
          rotation={[0, 0, rampAngle]}
          position={[0, 0.3, 0]}
          receiveShadow
          material={asphaltDeckMat}
        >
          <boxGeometry args={[rampHypot, 0.1, deckWidth - 0.6]} />
        </mesh>
        {/* Parapets */}
        <mesh
          rotation={[0, 0, rampAngle]}
          position={[0, 0.7, deckWidth / 2 - 0.35]}
          material={barrierMat}
        >
          <boxGeometry args={[rampHypot, 0.9, 0.7]} />
        </mesh>
        <mesh
          rotation={[0, 0, rampAngle]}
          position={[0, 0.7, -deckWidth / 2 + 0.35]}
          material={barrierMat}
        >
          <boxGeometry args={[rampHypot, 0.9, 0.7]} />
        </mesh>
      </group>

      {/* ── East Approach Ramp (descending from x = 195, y = 7.5m to x = 230, y = 0) ── */}
      <group position={[195 + rampLength / 2, deckHeight / 2, 0]}>
        <mesh
          rotation={[0, 0, -rampAngle]}
          position={[0, -0.2, 0]}
          receiveShadow
          castShadow
          material={concreteMat}
        >
          <boxGeometry args={[rampHypot, 0.9, deckWidth]} />
        </mesh>
        <mesh
          rotation={[0, 0, -rampAngle]}
          position={[0, 0.3, 0]}
          receiveShadow
          material={asphaltDeckMat}
        >
          <boxGeometry args={[rampHypot, 0.1, deckWidth - 0.6]} />
        </mesh>
        {/* Parapets */}
        <mesh
          rotation={[0, 0, -rampAngle]}
          position={[0, 0.7, deckWidth / 2 - 0.35]}
          material={barrierMat}
        >
          <boxGeometry args={[rampHypot, 0.9, 0.7]} />
        </mesh>
        <mesh
          rotation={[0, 0, -rampAngle]}
          position={[0, 0.7, -deckWidth / 2 + 0.35]}
          material={barrierMat}
        >
          <boxGeometry args={[rampHypot, 0.9, 0.7]} />
        </mesh>
      </group>

      {/* ── Heavy Concrete Support Piers Flanking the Railway Corridor ── */}
      {[156, 194].map((xCoord, i) => (
        <group key={`rob-pier-${i}`} position={[xCoord, 0, 0]}>
          {/* North Column */}
          <mesh position={[0, deckHeight / 2 - 0.6, 3.8]} castShadow receiveShadow material={concreteMat}>
            <cylinderGeometry args={[1.1, 1.3, deckHeight - 1.2, 16]} />
          </mesh>
          {/* South Column */}
          <mesh position={[0, deckHeight / 2 - 0.6, -3.8]} castShadow receiveShadow material={concreteMat}>
            <cylinderGeometry args={[1.1, 1.3, deckHeight - 1.2, 16]} />
          </mesh>
          {/* Crosshead Beam */}
          <mesh position={[0, deckHeight - 1.2, 0]} castShadow receiveShadow material={concreteMat}>
            <boxGeometry args={[3.2, 1.3, deckWidth + 0.5]} />
          </mesh>
        </group>
      ))}

      {/* ── Real Google Maps: Munnekolala Underpass Portal ── */}
      {/* Tunnel box beside the bridge approach allowing U-turns under the railway/bridge */}
      <group position={[158, 0, -18]}>
        {/* Underpass tunnel roof slab */}
        <mesh position={[0, 3.8, 0]} castShadow receiveShadow material={concreteMat}>
          <boxGeometry args={[12, 0.6, 10]} />
        </mesh>
        {/* Retaining wall West */}
        <mesh position={[-5.8, 1.8, 0]} castShadow receiveShadow material={concreteMat}>
          <boxGeometry args={[0.6, 3.8, 10]} />
        </mesh>
        {/* Retaining wall East */}
        <mesh position={[5.8, 1.8, 0]} castShadow receiveShadow material={concreteMat}>
          <boxGeometry args={[0.6, 3.8, 10]} />
        </mesh>
        {/* Asphalt floor inside underpass */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={asphaltDeckMat}>
          <planeGeometry args={[10.5, 9.8]} />
        </mesh>
        {/* Munnekolala Underpass Signboard */}
        <mesh position={[0, 4.3, 5.1]}>
          <boxGeometry args={[8.0, 0.7, 0.1]} />
          <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* ── High-Mast LED Streetlights along ROB ── */}
      {[140, 175, 210].map((xPos, idx) => (
        <ROBLightPole key={idx} position={[xPos, deckHeight + 0.8, 0]} isNight={isNight} />
      ))}
    </group>
  );
};

// Subcomponent: Classic Indian BBMP Yellow & Black Alternating Hazard Stripes (East-West)
const HazardStripeParapetEastWest: React.FC<{
  position: [number, number, number];
  length: number;
}> = ({ position, length }) => {
  const stripeWidth = 2.4;
  const count = Math.floor(length / stripeWidth);

  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => {
        const isYellow = i % 2 === 0;
        const x = -length / 2 + (i + 0.5) * stripeWidth;
        return (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[stripeWidth, 0.9, 0.04]} />
            <meshBasicMaterial color={isYellow ? '#fbbf24' : '#18181b'} />
          </mesh>
        );
      })}
    </group>
  );
};

// Subcomponent: Dashed line along elevated ROB deck (East-West)
const ROBDeckDashesEastWest: React.FC<{ z: number; length: number }> = ({ z, length }) => {
  const dashCount = Math.floor(length / 6);
  return (
    <group>
      {Array.from({ length: dashCount }).map((_, i) => {
        const x = -length / 2 + (i + 0.5) * 6;
        return (
          <mesh key={i} position={[x, 0.12, z]}>
            <boxGeometry args={[3.0, 0.02, 0.2]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        );
      })}
    </group>
  );
};

// Subcomponent: High-mast LED luminaire on ROB
const ROBLightPole: React.FC<{ position: [number, number, number]; isNight: boolean }> = ({
  position,
  isNight
}) => {
  return (
    <group position={position}>
      <mesh position={[0, 2.8, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 5.6, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 5.5, 0]}>
        <boxGeometry args={[0.12, 0.12, 3.2]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[0, 5.35, -1.6]}>
        <boxGeometry args={[0.35, 0.15, 0.6]} />
        <meshStandardMaterial
          color={isNight ? '#fff5db' : '#4b5563'}
          emissive={isNight ? '#ffe9b3' : '#000000'}
          emissiveIntensity={isNight ? 2.5 : 0}
        />
      </mesh>
      <mesh position={[0, 5.35, 1.6]}>
        <boxGeometry args={[0.35, 0.15, 0.6]} />
        <meshStandardMaterial
          color={isNight ? '#fff5db' : '#4b5563'}
          emissive={isNight ? '#ffe9b3' : '#000000'}
          emissiveIntensity={isNight ? 2.5 : 0}
        />
      </mesh>

      {isNight && (
        <pointLight position={[0, 5.2, 0]} intensity={14} distance={35} color="#fff1cc" />
      )}
    </group>
  );
};

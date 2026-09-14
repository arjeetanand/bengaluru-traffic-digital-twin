import React from 'react';

interface SkywalkProps {
  isNight: boolean;
}

export const Skywalk: React.FC<SkywalkProps> = ({ isNight }) => {
  const bridgeSpan = 38;
  const bridgeHeight = 7.2;
  const bridgeZ = 32;

  return (
    <group position={[0, 0, bridgeZ]} name="MarathahalliSkywalk">
      {/* ── Main Horizontal Covered Walkway ── */}
      <group position={[0, bridgeHeight, 0]}>
        {/* Floor base girder */}
        <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[bridgeSpan, 0.4, 3.4]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Interior floor path */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[bridgeSpan - 0.2, 0.1, 2.8]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>

        {/* Curved Roof Canopy */}
        <mesh position={[0, 2.4, 0]}>
          <boxGeometry args={[bridgeSpan + 0.6, 0.25, 4.0]} />
          <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Semi-transparent Glass Side Enclosures */}
        {/* North side */}
        <mesh position={[0, 1.2, 1.6]}>
          <boxGeometry args={[bridgeSpan, 2.2, 0.1]} />
          <meshStandardMaterial
            color={isNight ? '#93c5fd' : '#bfdbfe'}
            transparent
            opacity={0.45}
            roughness={0.1}
            metalness={0.8}
            emissive={isNight ? '#3b82f6' : '#000000'}
            emissiveIntensity={isNight ? 0.35 : 0}
          />
        </mesh>
        {/* South side */}
        <mesh position={[0, 1.2, -1.6]}>
          <boxGeometry args={[bridgeSpan, 2.2, 0.1]} />
          <meshStandardMaterial
            color={isNight ? '#93c5fd' : '#bfdbfe'}
            transparent
            opacity={0.45}
            roughness={0.1}
            metalness={0.8}
            emissive={isNight ? '#3b82f6' : '#000000'}
            emissiveIntensity={isNight ? 0.35 : 0}
          />
        </mesh>

        {/* Tubular steel ribs / truss rings */}
        {Array.from({ length: 9 }).map((_, i) => {
          const x = -bridgeSpan / 2 + (i + 0.5) * (bridgeSpan / 9);
          return (
            <group key={i} position={[x, 1.2, 0]}>
              <mesh>
                <boxGeometry args={[0.2, 2.4, 3.6]} />
                <meshStandardMaterial color="#1e3a8a" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          );
        })}

        {/* Night internal walkway lighting */}
        {isNight && (
          <>
            <pointLight position={[-10, 1.8, 0]} intensity={12} distance={20} color="#fed7aa" />
            <pointLight position={[10, 1.8, 0]} intensity={12} distance={20} color="#fed7aa" />
          </>
        )}
      </group>

      {/* ── West Staircase / Access Tower (X = -bridgeSpan/2) ── */}
      <group position={[-bridgeSpan / 2 - 1.5, 0, 0]}>
        {/* Structural tower columns */}
        <mesh position={[0, bridgeHeight / 2, 0]} castShadow>
          <boxGeometry args={[3.2, bridgeHeight, 3.4]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Diagonal staircase flight */}
        <mesh
          rotation={[0, 0, Math.atan2(bridgeHeight, 6)]}
          position={[-3, bridgeHeight / 2, 0]}
          castShadow
        >
          <boxGeometry args={[Math.hypot(bridgeHeight, 6), 0.3, 2.2]} />
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>
      </group>

      {/* ── East Staircase / Access Tower (X = +bridgeSpan/2) ── */}
      <group position={[bridgeSpan / 2 + 1.5, 0, 0]}>
        {/* Structural tower columns */}
        <mesh position={[0, bridgeHeight / 2, 0]} castShadow>
          <boxGeometry args={[3.2, bridgeHeight, 3.4]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Diagonal staircase flight */}
        <mesh
          rotation={[0, 0, -Math.atan2(bridgeHeight, 6)]}
          position={[3, bridgeHeight / 2, 0]}
          castShadow
        >
          <boxGeometry args={[Math.hypot(bridgeHeight, 6), 0.3, 2.2]} />
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
};

import React, { useMemo } from 'react';

interface UnderpassTrenchProps {
  isRaining: boolean;
  isNight: boolean;
}

export const UnderpassTrench: React.FC<UnderpassTrenchProps> = ({ isRaining, isNight }) => {
  // Physical parameters of Marathahalli 6-Lane Sunken Expressway
  const underpassWidth = 17.2;   // 17.2m wide roadway (3 lanes NB + 3 lanes SB + center barrier)
  const underpassDepth = 5.2;    // 5.2m deep below surface grade
  const trenchHalfW = underpassWidth / 2; // 8.6m
  const rampLength = 90;         // smooth descent/ascent ramps (z: 35 to 125, -35 to -125)
  const flatTrenchLength = 70;   // central flat trench (-35 to +35)
  const tunnelLength = 36;       // covered box tunnel under surface crossroads (-18 to +18)

  const rampAngle = Math.atan2(underpassDepth, rampLength);
  const rampHypot = Math.hypot(underpassDepth, rampLength);

  const underpassAsphaltProps = useMemo(() => {
    return {
      color: isRaining ? '#0a0c0f' : '#181b20',
      roughness: isRaining ? 0.22 : 0.84,
      metalness: isRaining ? 0.45 : 0.12
    };
  }, [isRaining]);

  const precastWallProps = useMemo(() => {
    return {
      color: isRaining ? '#60656d' : '#828892',
      roughness: 0.88,
      metalness: 0.1
    };
  }, [isRaining]);

  return (
    <group name="MarathahalliUnderpass_RealEngineered">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. SUNKEN ASPHALT ROADBED (Flat Trench + South & North Ramps)        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* Flat Central Roadbed (-35 to +35 at y = -5.2m) */}
      <mesh position={[0, -underpassDepth + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[underpassWidth, flatTrenchLength]} />
        <meshStandardMaterial {...underpassAsphaltProps} />
      </mesh>

      {/* South Descent Ramp (from z = -125 at y = 0 down to z = -35 at y = -5.2m) */}
      <mesh
        position={[0, -underpassDepth / 2, -35 - rampLength / 2]}
        rotation={[-Math.PI / 2 + rampAngle, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[underpassWidth, rampHypot]} />
        <meshStandardMaterial {...underpassAsphaltProps} />
      </mesh>

      {/* North Ascent Ramp (from z = 35 at y = -5.2m up to z = 125 at y = 0) */}
      <mesh
        position={[0, -underpassDepth / 2, 35 + rampLength / 2]}
        rotation={[-Math.PI / 2 - rampAngle, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[underpassWidth, rampHypot]} />
        <meshStandardMaterial {...underpassAsphaltProps} />
      </mesh>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. PRECAST CONCRETE RETAINING WALLS (West & East)                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* West Retaining Wall (Separating Underpass from West Service Road) */}
      <group position={[-trenchHalfW - 0.45, 0, 0]}>
        <mesh position={[0, -underpassDepth / 2 + 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, underpassDepth + 0.9, flatTrenchLength + rampLength * 1.85]} />
          <meshStandardMaterial {...precastWallProps} />
        </mesh>
        {/* Steel Safety Crash Guardrail along top */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[0.15, 0.7, flatTrenchLength + rampLength * 1.8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* East Retaining Wall (Separating Underpass from East Service Road) */}
      <group position={[trenchHalfW + 0.45, 0, 0]}>
        <mesh position={[0, -underpassDepth / 2 + 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, underpassDepth + 0.9, flatTrenchLength + rampLength * 1.85]} />
          <meshStandardMaterial {...precastWallProps} />
        </mesh>
        {/* Steel Safety Crash Guardrail along top */}
        <mesh position={[0, 1.25, 0]} castShadow>
          <boxGeometry args={[0.15, 0.7, flatTrenchLength + rampLength * 1.8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Yellow & Black Painted Top Curb Stones along Retaining Wall Edges */}
      <UnderpassCurbLine start={[-trenchHalfW - 0.45, 0.92, -120]} end={[-trenchHalfW - 0.45, 0.92, 120]} />
      <UnderpassCurbLine start={[trenchHalfW + 0.45, 0.92, -120]} end={[trenchHalfW + 0.45, 0.92, 120]} />

      {/* Central Concrete New Jersey Crash Divider inside Underpass */}
      <mesh position={[0, -underpassDepth + 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.95, flatTrenchLength + rampLength * 1.75]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* Underpass Lane Dashed Dividers (3 Lanes Northbound + 3 Lanes Southbound) */}
      {[-5.4, -2.7, 2.7, 5.4].map((xOffset, i) => (
        <mesh key={`up-lane-${i}`} position={[xOffset, -underpassDepth + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, flatTrenchLength + 45]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. COVERED TUNNEL PORTALS (South at z = -18, North at z = +18)        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* South Tunnel Portal Arch */}
      <group position={[0, 0, -tunnelLength / 2]}>
        <mesh position={[0, -underpassDepth / 2, 0]} castShadow>
          <boxGeometry args={[underpassWidth + 2.5, underpassDepth + 1.2, 2.0]} />
          <meshStandardMaterial {...precastWallProps} />
        </mesh>
        {/* Overhead Height Clearance Signboard */}
        <group position={[0, 0.65, -1.15]}>
          <mesh>
            <boxGeometry args={[underpassWidth * 0.82, 0.8, 0.1]} />
            <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.5} />
          </mesh>
          {/* Clearance Text Indicator Stripe */}
          <mesh position={[0, 0, -0.06]}>
            <boxGeometry args={[underpassWidth * 0.75, 0.4, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* North Tunnel Portal Arch */}
      <group position={[0, 0, tunnelLength / 2]}>
        <mesh position={[0, -underpassDepth / 2, 0]} castShadow>
          <boxGeometry args={[underpassWidth + 2.5, underpassDepth + 1.2, 2.0]} />
          <meshStandardMaterial {...precastWallProps} />
        </mesh>
        {/* Overhead Height Clearance Signboard */}
        <group position={[0, 0.65, 1.15]}>
          <mesh>
            <boxGeometry args={[underpassWidth * 0.82, 0.8, 0.1]} />
            <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.5} />
          </mesh>
          {/* Clearance Text Indicator Stripe */}
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[underpassWidth * 0.75, 0.4, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 4. TUNNEL INTERIOR CEILING & CONTINUOUS INDUSTRIAL LED LIGHTS         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* Concrete Roof Deck (Supporting Surface Crossroads) */}
      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[underpassWidth, 0.75, tunnelLength - 2]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Ceiling-Mounted Industrial LED Lighting Strips */}
      {[-4.2, 4.2].map((xOffset, idx) => (
        <group key={`tunnel-strip-${idx}`} position={[xOffset, -0.74, 0]}>
          {[-12, -4, 4, 12].map((zOffset, zIdx) => (
            <group key={zIdx} position={[0, 0, zOffset]}>
              <mesh>
                <boxGeometry args={[0.35, 0.08, 2.6]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#ffffff"
                  emissiveIntensity={isNight ? 4.5 : 2.8}
                />
              </mesh>
              <pointLight
                position={[0, -0.6, 0]}
                intensity={isNight ? 18 : 10}
                distance={15}
                color="#fef9c3"
              />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};

// Subcomponent: Yellow & Black Striped Kerb Stones (Bengaluru PWD Standard)
const UnderpassCurbLine: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
}> = ({ start, end }) => {
  const blockLength = 1.6;
  const totalLength = Math.abs(end[2] - start[2]);
  const count = Math.floor(totalLength / blockLength);
  const dir = Math.sign(end[2] - start[2]);

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const isYellow = i % 2 === 0;
        const z = start[2] + dir * (i * blockLength + blockLength / 2);
        return (
          <mesh key={i} position={[start[0], start[1], z]}>
            <boxGeometry args={[0.3, 0.26, blockLength]} />
            <meshStandardMaterial color={isYellow ? '#facc15' : '#1e293b'} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

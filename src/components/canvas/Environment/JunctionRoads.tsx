import React, { useMemo } from 'react';
import { UnderpassTrench } from './UnderpassTrench';

interface JunctionRoadsProps {
  isRaining: boolean;
  isNight: boolean;
  congestionRatio: number;
}

export const JunctionRoads: React.FC<JunctionRoadsProps> = ({
  isRaining,
  isNight,
  congestionRatio
}) => {
  const asphaltProps = useMemo(() => {
    return {
      color: isRaining ? '#111317' : '#22252a',
      roughness: isRaining ? 0.28 : 0.82,
      metalness: isRaining ? 0.45 : 0.12
    };
  }, [isRaining]);

  const congestionAccentColor = useMemo(() => {
    if (congestionRatio < 0.45) return '#ef4444'; // Heavy / Red
    if (congestionRatio < 0.75) return '#f59e0b'; // Moderate / Amber
    return '#10b981';                             // Smooth / Green
  }, [congestionRatio]);

  // Dimensions
  const underpassWidth = 17.0;  // 17m wide sunken roadway
  const trenchHalfW = underpassWidth / 2; // 8.5m
  const tunnelLength = 36;      // covered tunnel under surface crossroads (-18 to +18)

  return (
    <group name="MarathahalliUndergroundAndSurfaceSystem">
      {/* ── Wide Ground Terrain Base ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[750, 750]} />
        <meshStandardMaterial
          color={isRaining ? '#1a221a' : '#263326'}
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. MARATHAHALLI SUBTERRANEAN UNDERPASS (ORR Main Express Highway)    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <UnderpassTrench isRaining={isRaining} isNight={isNight} />

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. SURFACE ROAD NETWORK (Ground Level y = 0.05)                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group name="SurfaceRoadNetwork">
        {/* ── Surface Intersection Table Deck (Crosses directly over the Underpass) ── */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[38, 0.2, tunnelLength]} />
          <meshStandardMaterial {...asphaltProps} />
        </mesh>

        {/* ── HAL Old Airport Road (West Arterial, x = -250 to -19) ── */}
        <mesh position={[-134.5, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[231, 22]} />
          <meshStandardMaterial {...asphaltProps} />
        </mesh>
        {/* Median on HAL Old Airport Road */}
        <mesh position={[-134.5, 0.25, 0]} receiveShadow castShadow>
          <boxGeometry args={[225, 0.4, 1.2]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>

        {/* ── Varthur Road (East Arterial continuing past Bridge to Spice Garden, x = 19 to 275) ── */}
        <mesh position={[147, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[256, 22]} />
          <meshStandardMaterial {...asphaltProps} />
        </mesh>
        {/* Median on Varthur Road */}
        <mesh position={[147, 0.25, 0]} receiveShadow castShadow>
          <boxGeometry args={[250, 0.4, 1.2]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>

        {/* Spice Garden BMTC Bus Bay Asphalt Extension (x = 256, z = 13) */}
        <mesh position={[256, 0.028, 12.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[18, 5]} />
          <meshStandardMaterial {...asphaltProps} />
        </mesh>

        {/* ── Outer Ring Road Surface Parallel Service Roads (North-South, Z = -225 to +215) ── */}
        {/* East Service Road (Northbound towards Mahadevapura / KR Puram / Kalamandir) */}
        <mesh position={[trenchHalfW + 4.8, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[7.8, 440]} />
          <meshStandardMaterial {...asphaltProps} />
        </mesh>
        {/* West Service Road (Southbound towards Multiplex / Bellandur) */}
        <mesh position={[-trenchHalfW - 4.8, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[7.8, 440]} />
          <meshStandardMaterial {...asphaltProps} />
        </mesh>

        {/* ── Zebra Crossings on the Surface Crossroads ── */}
        <ZebraCrossing position={[0, 0.08, 15]} rotation={[0, 0, 0]} width={17} stripes={11} />
        <ZebraCrossing position={[0, 0.08, -15]} rotation={[0, 0, 0]} width={17} stripes={11} />
        <ZebraCrossing position={[-16, 0.08, 0]} rotation={[0, Math.PI / 2, 0]} width={18} stripes={11} />
        <ZebraCrossing position={[16, 0.08, 0]} rotation={[0, Math.PI / 2, 0]} width={18} stripes={11} />

        {/* ── Yellow Stop Lines before Crossings ── */}
        <mesh position={[0, 0.09, 17.5]}>
          <boxGeometry args={[17, 0.02, 0.6]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[0, 0.09, -17.5]}>
          <boxGeometry args={[17, 0.02, 0.6]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[-18.5, 0.09, 0]}>
          <boxGeometry args={[0.6, 0.02, 18]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[18.5, 0.09, 0]}>
          <boxGeometry args={[0.6, 0.02, 18]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>

        {/* ── Center Junction Box Hatching ── */}
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[26, 24]} />
          <meshBasicMaterial color="#422006" transparent opacity={0.25} />
        </mesh>

        {/* ── Dashed Lane Lines on Surface Roads (Full Corridor) ── */}
        <DashedLineHorizontal startX={-245} endX={-20} z={5.2} />
        <DashedLineHorizontal startX={-245} endX={-20} z={-5.2} />
        <DashedLineHorizontal startX={20} endX={265} z={5.2} />
        <DashedLineHorizontal startX={20} endX={265} z={-5.2} />

        <DashedLine startZ={-220} endZ={220} x={trenchHalfW + 4.8} />
        <DashedLine startZ={-220} endZ={220} x={-trenchHalfW - 4.8} />

        {/* ── Live Congestion Status Edge Glow along service road curbs ── */}
        <mesh position={[trenchHalfW + 9.0, 0.05, 0]}>
          <boxGeometry args={[0.25, 0.04, 440]} />
          <meshBasicMaterial color={congestionAccentColor} transparent opacity={0.7} />
        </mesh>
        <mesh position={[-trenchHalfW - 9.0, 0.05, 0]}>
          <boxGeometry args={[0.25, 0.04, 440]} />
          <meshBasicMaterial color={congestionAccentColor} transparent opacity={0.7} />
        </mesh>
      </group>
    </group>
  );
};

// Subcomponent: Zebra Crossing Stripes
const ZebraCrossing: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  stripes: number;
}> = ({ position, rotation, width, stripes }) => {
  const stripeWidth = 0.6;
  const stripeLength = 3.2;
  const spacing = width / stripes;

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: stripes }).map((_, idx) => {
        const xPos = -width / 2 + (idx + 0.5) * spacing;
        return (
          <mesh key={idx} position={[xPos, 0, 0]}>
            <boxGeometry args={[stripeWidth, 0.015, stripeLength]} />
            <meshBasicMaterial color="#f8fafc" />
          </mesh>
        );
      })}
    </group>
  );
};

// Subcomponent: Dashed Road Line (Z-axis)
const DashedLine: React.FC<{ startZ: number; endZ: number; x: number }> = ({ startZ, endZ, x }) => {
  const total = Math.abs(endZ - startZ);
  const dashLen = 3.0;
  const gapLen = 3.0;
  const period = dashLen + gapLen;
  const count = Math.floor(total / period);
  const dir = Math.sign(endZ - startZ);

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const z = startZ + dir * (i * period + dashLen / 2);
        return (
          <mesh key={i} position={[x, 0.035, z]}>
            <boxGeometry args={[0.22, 0.01, dashLen]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        );
      })}
    </group>
  );
};

// Subcomponent: Dashed Road Line (X-axis)
const DashedLineHorizontal: React.FC<{ startX: number; endX: number; z: number }> = ({ startX, endX, z }) => {
  const total = Math.abs(endX - startX);
  const dashLen = 3.0;
  const gapLen = 3.0;
  const period = dashLen + gapLen;
  const count = Math.floor(total / period);
  const dir = Math.sign(endX - startX);

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const x = startX + dir * (i * period + dashLen / 2);
        return (
          <mesh key={i} position={[x, 0.035, z]}>
            <boxGeometry args={[dashLen, 0.01, 0.22]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        );
      })}
    </group>
  );
};


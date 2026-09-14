import React, { useMemo } from 'react';
import * as THREE from 'three';
import { UnderpassTrench } from './UnderpassTrench';
import {
  ORR_CENTERLINE_PTS,
  HAL_TO_SPICEGARDEN_PTS,
  createRoadRibbonGeometry,
  createCurveLineGeometry,
  getOrrOffsetPointAtZ
} from '../../../data/RealRoadData';
import { U_TURN_CONNECTORS } from '../../../data/marathahalliLaneNetwork';

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

  // Real junction intersection dimensions
  const junctionEW = 56;
  const junctionNS = 42;
  const halfEW = junctionEW / 2;  // 28m
  const halfNS = junctionNS / 2;  // 21m
  const laneW = 3.5;
  const trenchHalfW = 11.0;

  // ── True-Curvature Road Spline Geometries Derived from marathahalli_osm.xml ──
  // 1. East Service Road (Northbound along ORR towards Kalamandir)
  const eastServiceRoadGeom = useMemo(() => {
    return createRoadRibbonGeometry(
      ORR_CENTERLINE_PTS.map(([, z]) => getOrrOffsetPointAtZ(z, -14.5)),
      11.5,
      () => 0.05,
      120
    );
  }, []);

  // 2. West Service Road (Southbound along ORR towards Multiplex)
  const westServiceRoadGeom = useMemo(() => {
    return createRoadRibbonGeometry(
      ORR_CENTERLINE_PTS.map(([, z]) => getOrrOffsetPointAtZ(z, 14.5)),
      11.5,
      () => 0.05,
      120
    );
  }, []);

  // 3. Curved East-West Arterial (HAL Old Airport Road -> Surface Junction -> ROB Bridge -> Spice Garden)
  const halToSpiceGardenRoadGeom = useMemo(() => {
    return createRoadRibbonGeometry(
      HAL_TO_SPICEGARDEN_PTS,
      22,
      () => 0.06,
      140
    );
  }, []);

  // 4. Curved Median Divider on HAL Road to Spice Garden
  const halSpiceMedianGeom = useMemo(() => {
    return createCurveLineGeometry(
      HAL_TO_SPICEGARDEN_PTS,
      0,
      () => 0.18,
      1.2,
      140
    );
  }, []);

  const northUTurnGeom = useMemo(
    () => createRoadRibbonGeometry(
      U_TURN_CONNECTORS.north.points.map(([x, _y, z]) => [x, z]),
      3.5,
      () => 0.13,
      64
    ),
    []
  );

  const southUTurnGeom = useMemo(
    () => createRoadRibbonGeometry(
      U_TURN_CONNECTORS.south.points.map(([x, _y, z]) => [x, z]),
      3.5,
      () => 0.13,
      64
    ),
    []
  );

  const northUTurnEdgeGeom = useMemo(
    () => createCurveLineGeometry(
      U_TURN_CONNECTORS.north.points.map(([x, _y, z]) => [x, z]),
      0,
      () => 0.19,
      0.16,
      64
    ),
    []
  );

  const southUTurnEdgeGeom = useMemo(
    () => createCurveLineGeometry(
      U_TURN_CONNECTORS.south.points.map(([x, _y, z]) => [x, z]),
      0,
      () => 0.19,
      0.16,
      64
    ),
    []
  );

  return (
    <group name="MarathahalliUndergroundAndSurfaceSystem">
      {/* ── Ground Terrain Base ──
          The OSM extract now spans the complete Oracle → Spice Garden
          envelope. Keep one broad, low-cost ground tile under that same
          extent so source roads, footways and building massing do not float
          against the background in the corridor bird view. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -690]} receiveShadow>
        <planeGeometry args={[2300, 2600]} />
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
          <boxGeometry args={[junctionEW, 0.2, junctionNS]} />
          <meshStandardMaterial {...asphaltProps} />
        </mesh>

        {/* ── Real Curved HAL Old Airport Road to Spice Garden Arterial ── */}
        <mesh geometry={halToSpiceGardenRoadGeom} receiveShadow>
          <meshStandardMaterial {...asphaltProps} />
        </mesh>
        {/* Curved median divider */}
        <mesh geometry={halSpiceMedianGeom} castShadow receiveShadow>
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>

        {/* ── Real Curved ORR East Service Road (Northbound towards Kalamandir) ── */}
        <mesh geometry={eastServiceRoadGeom} receiveShadow>
          <meshStandardMaterial {...asphaltProps} />
        </mesh>

        {/* ── Real Curved ORR West Service Road (Southbound towards Multiplex) ── */}
        <mesh geometry={westServiceRoadGeom} receiveShadow>
          <meshStandardMaterial {...asphaltProps} />
        </mesh>

        {/* Shared drivable U-turn connectors. The traffic fleet consumes the
            same points, keeping the visible asphalt and vehicle route aligned. */}
        <mesh geometry={northUTurnGeom} receiveShadow renderOrder={1}>
          <meshStandardMaterial color={isRaining ? '#15181d' : '#30343b'} roughness={0.78} />
        </mesh>
        <mesh geometry={southUTurnGeom} receiveShadow renderOrder={1}>
          <meshStandardMaterial color={isRaining ? '#15181d' : '#30343b'} roughness={0.78} />
        </mesh>
        <mesh geometry={northUTurnEdgeGeom} renderOrder={2}>
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
        </mesh>
        <mesh geometry={southUTurnEdgeGeom} renderOrder={2}>
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
        </mesh>

        {/* ── Zebra Crossings on the Surface Crossroads (at real 21m half-junction) ── */}
        <ZebraCrossing position={[0, 0.08, halfNS + 1]} rotation={[0, 0, 0]} width={22} stripes={14} />
        <ZebraCrossing position={[0, 0.08, -halfNS - 1]} rotation={[0, 0, 0]} width={22} stripes={14} />
        <ZebraCrossing position={[-halfEW - 1, 0.08, 0]} rotation={[0, Math.PI / 2, 0]} width={22} stripes={14} />
        <ZebraCrossing position={[halfEW + 1, 0.08, 0]} rotation={[0, Math.PI / 2, 0]} width={22} stripes={14} />

        {/* ── Yellow Stop Lines before Crossings ── */}
        <mesh position={[0, 0.09, halfNS + 3.5]}>
          <boxGeometry args={[22, 0.02, 0.7]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[0, 0.09, -halfNS - 3.5]}>
          <boxGeometry args={[22, 0.02, 0.7]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[-halfEW - 3.5, 0.09, 0]}>
          <boxGeometry args={[0.7, 0.02, 22]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[halfEW + 3.5, 0.09, 0]}>
          <boxGeometry args={[0.7, 0.02, 22]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>

        {/* ── Center Junction Box Hatching (full yellow diagonal hatch) ── */}
        {/* Background yellow fill */}
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[junctionEW - 2, junctionNS - 2]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.18} />
        </mesh>
        {/* Diagonal hatch lines (NW-SE) */}
        {Array.from({ length: 16 }).map((_, i) => {
          const offset = -36 + i * 5;
          return (
            <mesh key={`hatch-${i}`} position={[offset, 0.08, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
              <planeGeometry args={[0.35, 85]} />
              <meshBasicMaterial color="#facc15" transparent opacity={0.55} />
            </mesh>
          );
        })}

        {/* ── Police / Traffic Warden Pedestal at Junction Center ── */}
        <group position={[0, 0, 0]} name="PolicePedestal">
          {/* Raised concrete octagonal platform */}
          <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.8, 2.0, 0.44, 8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} metalness={0.1} />
          </mesh>
          {/* Yellow/black kerb ring */}
          <mesh position={[0, 0.06, 0]}>
            <torusGeometry args={[2.1, 0.12, 6, 16]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
          {/* BBMP orange traffic cone markers */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <mesh key={i} position={[Math.cos(angle) * 2.5, 0.3, Math.sin(angle) * 2.5]} castShadow>
              <coneGeometry args={[0.18, 0.6, 6]} />
              <meshStandardMaterial color="#f97316" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* ── Channelization Islands (painted concrete splitter at all 4 quadrant corners) ── */}
        {[
          [halfEW + 4, halfNS + 4, 0],
          [-halfEW - 4, halfNS + 4, 0],
          [halfEW + 4, -halfNS - 4, Math.PI],
          [-halfEW - 4, -halfNS - 4, Math.PI],
        ].map(([cx, cz, ry], idx) => (
          <group key={`island-${idx}`} position={[cx as number, 0, cz as number]} rotation={[0, ry as number, 0]}>
            <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
              <boxGeometry args={[5.0, 0.3, 3.2]} />
              <meshStandardMaterial color="#64748b" roughness={0.8} />
            </mesh>
            {/* Yellow/white painted edge stripe */}
            <mesh position={[0, 0.31, 0]}>
              <boxGeometry args={[5.0, 0.05, 0.25]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>
          </group>
        ))}

        {/* ── Dashed Lane Lines on Surface Roads (Full Corridor) ── */}
        {/* E-W road (OAR/Varthur) lanes at 3.5m spacing */}
        <DashedLineHorizontal startX={-245} endX={-halfEW} z={laneW} />
        <DashedLineHorizontal startX={-245} endX={-halfEW} z={-laneW} />
        <DashedLineHorizontal startX={halfEW} endX={265} z={laneW} />
        <DashedLineHorizontal startX={halfEW} endX={265} z={-laneW} />
        {/* E-W outer lanes */}
        <DashedLineHorizontal startX={-245} endX={-halfEW} z={laneW * 2 + 0.5} />
        <DashedLineHorizontal startX={-245} endX={-halfEW} z={-laneW * 2 - 0.5} />
        <DashedLineHorizontal startX={halfEW} endX={265} z={laneW * 2 + 0.5} />
        <DashedLineHorizontal startX={halfEW} endX={265} z={-laneW * 2 - 0.5} />

        {/* N-S service road lanes */}
        <DashedLine startZ={-220} endZ={220} x={trenchHalfW + 5.5} />
        <DashedLine startZ={-220} endZ={220} x={trenchHalfW + 9.0} />
        <DashedLine startZ={-220} endZ={220} x={-trenchHalfW - 5.5} />
        <DashedLine startZ={-220} endZ={220} x={-trenchHalfW - 9.0} />

        {/* ── Pothole Patches (dark repair patches — realistic Indian road surface) ── */}
        {[
          [-85, 0.06, 5.2], [45, 0.06, -4.8], [-130, 0.06, 8.0], [180, 0.06, -6.5],
          [-60, 0.06, -laneW + 0.5], [110, 0.06, laneW - 0.3], [-20, 0.06, -halfNS - 8],
        ].map(([px, py, pz], i) => (
          <mesh key={`pothole-${i}`} position={[px, py, pz]} rotation={[-Math.PI / 2, 0, i * 0.8]}>
            <circleGeometry args={[0.6 + (i % 3) * 0.3, 8]} />
            <meshBasicMaterial color="#111418" transparent opacity={0.85} />
          </mesh>
        ))}

        {/* ── Oil Stain Decals near stop lines ── */}
        {[
          [0, 0.055, halfNS + 6], [0, 0.055, -halfNS - 6],
          [-halfEW - 6, 0.055, 0], [halfEW + 6, 0.055, 0],
        ].map(([ox, oy, oz], i) => (
          <mesh key={`oilstain-${i}`} position={[ox, oy, oz]} rotation={[-Math.PI / 2, 0, i * 1.2]}>
            <circleGeometry args={[1.8, 10]} />
            <meshBasicMaterial color="#0a0d11" transparent opacity={0.4} />
          </mesh>
        ))}

        {/* ── Surface Road Pavement Markings: U-Turn & Lane Directions ── */}
        {/* Northbound approach (inner lane: U-turn, outer lane: straight & right) */}
        <UTurnRoadMarking position={[14.0, 0, -28]} rotationY={Math.PI} />
        <UTurnRoadMarking position={[14.0, 0, -55]} rotationY={Math.PI} />
        <LaneArrowMarking position={[17.5, 0, -28]} rotationY={0} type="right" />
        <LaneArrowMarking position={[17.5, 0, -55]} rotationY={0} type="straight" />

        {/* Southbound approach (inner lane: U-turn, outer lane: straight & right) */}
        <UTurnRoadMarking position={[-14.0, 0, 28]} rotationY={0} />
        <UTurnRoadMarking position={[-14.0, 0, 55]} rotationY={0} />
        <LaneArrowMarking position={[-17.5, 0, 28]} rotationY={Math.PI} type="right" />
        <LaneArrowMarking position={[-17.5, 0, 55]} rotationY={Math.PI} type="straight" />

        {/* Eastbound approach (HAL Old Airport Road toward Varthur) */}
        <LaneArrowMarking position={[-38, 0, 3.8]} rotationY={Math.PI / 2} type="straight" />
        <LaneArrowMarking position={[-75, 0, 3.8]} rotationY={Math.PI / 2} type="straight" />
        <LaneArrowMarking position={[-38, 0, 7.5]} rotationY={Math.PI / 2} type="right" />

        {/* Westbound approach (Varthur Road toward HAL/City) */}
        <LaneArrowMarking position={[38, 0, -3.8]} rotationY={-Math.PI / 2} type="straight" />
        <LaneArrowMarking position={[75, 0, -3.8]} rotationY={-Math.PI / 2} type="straight" />
        <LaneArrowMarking position={[38, 0, -7.5]} rotationY={-Math.PI / 2} type="right" />

        {/* ── Live Congestion Status Edge Glow along service road curbs ── */}
        <mesh position={[trenchHalfW + 13.0, 0.05, 0]}>
          <boxGeometry args={[0.25, 0.04, 440]} />
          <meshBasicMaterial color={congestionAccentColor} transparent opacity={0.7} />
        </mesh>
        <mesh position={[-trenchHalfW - 13.0, 0.05, 0]}>
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

// Subcomponent: U-Turn Painted Asphalt Road Marking
const UTurnRoadMarking: React.FC<{ position: [number, number, number]; rotationY?: number }> = ({
  position,
  rotationY = 0
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {/* Approach Stem */}
    <mesh position={[0.35, 0.08, 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.32, 1.5]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    {/* Return Stem */}
    <mesh position={[-0.35, 0.08, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.32, 0.9]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    {/* 180° Curved Arc */}
    <mesh position={[0, 0.08, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.52, 16, 1, 0, Math.PI]} />
      <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
    </mesh>
    {/* Arrowhead */}
    <mesh position={[-0.35, 0.08, 0.8]} rotation={[-Math.PI / 2, 0, Math.PI]}>
      <coneGeometry args={[0.35, 0.65, 3]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  </group>
);

// Subcomponent: Lane Arrow Painted Asphalt Road Marking
const LaneArrowMarking: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  type?: 'straight' | 'right' | 'left';
}> = ({ position, rotationY = 0, type = 'straight' }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {/* Main Stem */}
    <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.3, 1.8]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    {/* Straight Arrowhead */}
    <mesh position={[0, 0.08, -1.1]} rotation={[-Math.PI / 2, 0, 0]}>
      <coneGeometry args={[0.4, 0.75, 3]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    {/* Branch Arrowhead if turning */}
    {type === 'right' && (
      <>
        <mesh position={[0.4, 0.08, -0.3]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.28, 0.9]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.75, 0.08, -0.65]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
          <coneGeometry args={[0.35, 0.65, 3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </>
    )}
  </group>
);

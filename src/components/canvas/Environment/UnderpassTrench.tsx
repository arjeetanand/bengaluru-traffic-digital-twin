import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  createRoadRibbonGeometry,
  createCurveLineGeometry,
  getOrrOffsetPointAtZ,
  getOrrRoadFrameAtZ,
  getOrrUnderpassElevation,
  ORR_UNDERPASS_DEPTH,
  ORR_UNDERPASS_PATH_START_Z,
  ORR_UNDERPASS_PATH_END_Z
} from '../../../data/RealRoadData';

interface UnderpassTrenchProps {
  isRaining: boolean;
  isNight: boolean;
}

function createCurvedBoxGeometry(
  lateralOffset: number,
  width: number,
  bottomY: number,
  topY: number,
  segments = 48,
  startZ = ORR_UNDERPASS_PATH_START_Z,
  endZ = ORR_UNDERPASS_PATH_END_Z
) {
  const parts: THREE.BufferGeometry[] = [];
  const yAxis = new THREE.Vector3(0, 1, 0);
  const height = Math.max(0.02, topY - bottomY);

  for (let index = 1; index <= segments; index += 1) {
    const segmentStartZ = startZ + ((index - 1) / segments) * (endZ - startZ);
    const segmentEndZ = startZ + (index / segments) * (endZ - startZ);
    const start = getOrrOffsetPointAtZ(segmentStartZ, lateralOffset);
    const end = getOrrOffsetPointAtZ(segmentEndZ, lateralOffset);
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const length = Math.max(0.4, Math.hypot(dx, dz));
    const midpoint = new THREE.Vector3(
      (start[0] + end[0]) / 2,
      (bottomY + topY) / 2,
      (start[1] + end[1]) / 2
    );
    const angle = Math.atan2(dx, dz);
    const geometry = new THREE.BoxGeometry(width, height, length + 0.4);
    geometry.applyMatrix4(
      new THREE.Matrix4().compose(
        midpoint,
        new THREE.Quaternion().setFromAxisAngle(yAxis, angle),
        new THREE.Vector3(1, 1, 1)
      )
    );
    parts.push(geometry);
  }

  const merged = mergeGeometries(parts, false) || new THREE.BufferGeometry();
  parts.forEach((geometry) => geometry.dispose());
  return merged;
}

function createCurvedUnderpassCurbGeometry(lateralOffset: number, segments = 72) {
  const frames: { midpoint: [number, number]; length: number; angle: number }[] = [];
  for (let index = 1; index <= segments; index += 1) {
    const startZ = ORR_UNDERPASS_PATH_START_Z + ((index - 1) / segments) * (ORR_UNDERPASS_PATH_END_Z - ORR_UNDERPASS_PATH_START_Z);
    const endZ = ORR_UNDERPASS_PATH_START_Z + (index / segments) * (ORR_UNDERPASS_PATH_END_Z - ORR_UNDERPASS_PATH_START_Z);
    const start = getOrrOffsetPointAtZ(startZ, lateralOffset);
    const end = getOrrOffsetPointAtZ(endZ, lateralOffset);
    frames.push({
      midpoint: [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2],
      length: Math.max(0.2, Math.hypot(end[0] - start[0], end[1] - start[1])),
      angle: Math.atan2(end[0] - start[0], end[1] - start[1])
    });
  }
  return frames;
}

function createOrrControlPointsBetween(startZ: number, endZ: number, step = 20): [number, number][] {
  const direction = Math.sign(endZ - startZ) || 1;
  const distance = Math.abs(endZ - startZ);
  const sampleCount = Math.max(2, Math.ceil(distance / step) + 1);
  const points: [number, number][] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / (sampleCount - 1);
    const z = startZ + direction * distance * progress;
    const frame = getOrrRoadFrameAtZ(z);
    points.push([frame.x, frame.z]);
  }

  return points;
}

export const UnderpassTrench: React.FC<UnderpassTrenchProps> = ({ isRaining, isNight }) => {
  // Physical parameters of Marathahalli 6-Lane Sunken Expressway
  const underpassWidth = 22.0;   // 22m wide roadway (3×3.5m lanes NB + barrier + 3×3.5m lanes SB)
  const underpassDepth = ORR_UNDERPASS_DEPTH; // calibrated trench depth below surface grade
  const trenchHalfW = underpassWidth / 2; // 11.0m
  const tunnelLength = 36;       // 36m covered box tunnel (-18 to +18)

  // Elevation along the curved Outer Ring Road is shared with the traffic
  // splines so vehicles sit on the same source-aligned pavement surface.
  const underpassElevation = (_t: number, _x: number, z: number) => getOrrUnderpassElevation(z);

  const underpassControlPoints = useMemo(
    () => createOrrControlPointsBetween(ORR_UNDERPASS_PATH_START_Z, ORR_UNDERPASS_PATH_END_Z),
    []
  );
  const portalFrames = useMemo(
    () => [-tunnelLength / 2, tunnelLength / 2].map((zCoord) => {
      const frame = getOrrRoadFrameAtZ(zCoord);
      return {
        point: [frame.x, frame.z] as [number, number],
        angle: Math.atan2(frame.tangentX, frame.tangentZ)
      };
    }),
    [tunnelLength]
  );
  const tunnelCeilingGeometry = useMemo(
    () => createCurvedBoxGeometry(
      0,
      underpassWidth,
      -0.775,
      -0.025,
      12,
      -tunnelLength / 2 + 1,
      tunnelLength / 2 - 1
    ),
    [tunnelLength, underpassWidth]
  );
  const tunnelLightFrames = useMemo(
    () => [-12, -4, 4, 12].flatMap((zCoord) => [-5.5, 5.5].map((lateralOffset) => {
      const frame = getOrrRoadFrameAtZ(zCoord);
      const point = getOrrOffsetPointAtZ(zCoord, lateralOffset);
      return {
        point,
        angle: Math.atan2(frame.tangentX, frame.tangentZ),
        zCoord,
        lateralOffset
      };
    })),
    []
  );

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

  const westWallGeometry = useMemo(
    () => createCurvedBoxGeometry(-trenchHalfW - 0.45, 0.9, -underpassDepth, 0.95),
    [trenchHalfW, underpassDepth]
  );
  const eastWallGeometry = useMemo(
    () => createCurvedBoxGeometry(trenchHalfW + 0.45, 0.9, -underpassDepth, 0.95),
    [trenchHalfW, underpassDepth]
  );
  const centralDividerGeometry = useMemo(
    () => createCurvedBoxGeometry(0, 0.65, -underpassDepth + 0.48, -underpassDepth + 1.43),
    [underpassDepth]
  );
  const westGuardrailGeometry = useMemo(
    () => createCurveLineGeometry(underpassControlPoints, -trenchHalfW - 0.45, () => 1.25, 0.15, 140),
    [trenchHalfW, underpassControlPoints]
  );
  const eastGuardrailGeometry = useMemo(
    () => createCurveLineGeometry(underpassControlPoints, trenchHalfW + 0.45, () => 1.25, 0.15, 140),
    [trenchHalfW, underpassControlPoints]
  );
  const laneDividerGeometries = useMemo(
    () => [-6.75, -3.3, 3.3, 6.75].map((lateralOffset) => createCurveLineGeometry(
      underpassControlPoints,
      lateralOffset,
      (_t, _x, z) => underpassElevation(0, 0, z) + 0.05,
      0.2,
      140
    )),
    [underpassControlPoints]
  );

  const underpassRoadGeom = useMemo(() => {
    return createRoadRibbonGeometry(
      underpassControlPoints,
      underpassWidth,
      underpassElevation,
      140
    );
  }, [underpassControlPoints, underpassWidth]);

  const underpassBarrierGeom = useMemo(() => {
    return createCurveLineGeometry(
      underpassControlPoints,
      0,
      (t, x, z) => underpassElevation(t, x, z) + 0.45,
      0.65,
      140
    );
  }, [underpassControlPoints]);

  return (
    <group name="MarathahalliUnderpass_RealEngineered">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. CURVED SUNKEN ASPHALT ROADBED FOLLOWING REAL ORR TRAJECTORY       */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <mesh geometry={underpassRoadGeom} receiveShadow>
        <meshStandardMaterial {...underpassAsphaltProps} />
      </mesh>

      {/* Central Jersey Crash Divider following the curve */}
      <mesh geometry={underpassBarrierGeom} castShadow receiveShadow>
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. PRECAST CONCRETE RETAINING WALLS (West & East)                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* Both walls follow the source ORR frame; straight x=±11.45 walls
          drift away from the carriageway as the mapped road bends southwest. */}
      <mesh geometry={westWallGeometry} castShadow receiveShadow>
        <meshStandardMaterial {...precastWallProps} />
      </mesh>
      <mesh geometry={eastWallGeometry} castShadow receiveShadow>
        <meshStandardMaterial {...precastWallProps} />
      </mesh>
      {/* Steel Safety Crash Guardrails along the curved wall tops */}
      <mesh geometry={westGuardrailGeometry} castShadow>
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh geometry={eastGuardrailGeometry} castShadow>
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Yellow & Black Painted Top Curb Stones along Retaining Wall Edges */}
      <UnderpassCurbLine lateralOffset={-trenchHalfW - 0.45} />
      <UnderpassCurbLine lateralOffset={trenchHalfW + 0.45} />

      {/* Central Concrete New Jersey Crash Divider inside Underpass */}
      <mesh geometry={centralDividerGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* Underpass Lane Dashed Dividers (3 Lanes Northbound + 3 Lanes Southbound) */}
      {laneDividerGeometries.map((geometry, index) => (
        <mesh key={`up-lane-${index}`} geometry={geometry}>
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. COVERED TUNNEL PORTALS (South at z = -18, North at z = +18)        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* South Tunnel Portal Arch */}
      <group position={[portalFrames[0].point[0], 0, portalFrames[0].point[1]]} rotation={[0, portalFrames[0].angle, 0]}>
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
      <group position={[portalFrames[1].point[0], 0, portalFrames[1].point[1]]} rotation={[0, portalFrames[1].angle, 0]}>
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
      <mesh geometry={tunnelCeilingGeometry}>
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {/* Ceiling-Mounted Industrial LED Lighting Strips */}
      {tunnelLightFrames.map(({ point, angle, lateralOffset, zCoord }) => (
        <group
          key={`tunnel-strip-${lateralOffset}-${zCoord}`}
          position={[point[0], -0.74, point[1]]}
          rotation={[0, angle, 0]}
        >
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

      {/* Night Sodium Vapor Ambient Glow (Orange underpass atmosphere) */}
      {isNight && (
        <pointLight position={[0, -underpassDepth + 2.5, 0]} intensity={35} distance={50} color="#ff8c00" />
      )}
    </group>
  );
};

// Subcomponent: Yellow & Black Striped Kerb Stones (Bengaluru PWD Standard)
const UnderpassCurbLine: React.FC<{ lateralOffset: number }> = ({ lateralOffset }) => {
  const blockLength = 1.6;
  const frames = useMemo(() => createCurvedUnderpassCurbGeometry(lateralOffset), [lateralOffset]);

  return (
    <group>
      {frames.map(({ midpoint, length, angle }, i) => {
        const isYellow = i % 2 === 0;
        return (
          <mesh key={i} position={[midpoint[0], 0.92, midpoint[1]]} rotation={[0, angle, 0]}>
            <boxGeometry args={[0.3, 0.26, Math.min(blockLength, length + 0.08)]} />
            <meshStandardMaterial color={isYellow ? '#facc15' : '#1e293b'} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

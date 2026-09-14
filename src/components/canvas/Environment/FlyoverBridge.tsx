import React, { useMemo } from 'react';
import * as THREE from 'three';
import { VARTHUR_VIADUCT_DECK_TOP_Y } from '../../../data/marathahalliDemo';

interface FlyoverBridgeProps {
  isRaining: boolean;
  isNight: boolean;
}

type SourcePoint = [number, number];

interface SourceBridgePath {
  id: string;
  points: SourcePoint[];
}

interface BridgeSegment {
  id: string;
  midpoint: SourcePoint;
  length: number;
  yaw: number;
}

interface BridgePathPose {
  point: SourcePoint;
  yaw: number;
}

// Compiled OSM geometry for the two one-way Varthur Road viaduct ways.
// Coordinates are local world metres: x=east, z=north.
const SOURCE_BRIDGE_PATHS: SourceBridgePath[] = [
  {
    id: 'varthur-road-viaduct-eastbound',
    points: [
      [338.3, -6.9],
      [358.3, -8.0],
      [414.5, -12.2]
    ]
  },
  {
    id: 'varthur-road-viaduct-westbound',
    points: [
      [413.7, -24.1],
      [361.0, -19.7],
      [337.6, -17.8]
    ]
  }
];

const DECK_TOP_Y = VARTHUR_VIADUCT_DECK_TOP_Y;
const DECK_BOTTOM_Y = DECK_TOP_Y - 1.2;
const DECK_WIDTH = 11.0;
const BRIDGE_TOTAL_WIDTH = DECK_WIDTH * 2 + 1.2;
const ROAD_WIDTH = 10.4;
const LANE_BOUNDARY_OFFSETS = [-1.73, 1.73];
const SUPPORT_X_COORDS = [348, 378, 408];
const LIGHT_X_COORDS = [348, 378, 408];

const getPathPoseAtX = (points: SourcePoint[], xCoord: number): BridgePathPose => {
  const orderedPoints = points[0][0] <= points[points.length - 1][0]
    ? points
    : [...points].reverse();

  for (let index = 0; index < orderedPoints.length - 1; index += 1) {
    const start = orderedPoints[index];
    const end = orderedPoints[index + 1];
    if (xCoord < start[0] || xCoord > end[0]) continue;

    const spanX = end[0] - start[0];
    const progress = spanX === 0 ? 0 : (xCoord - start[0]) / spanX;
    const z = start[1] + (end[1] - start[1]) * progress;
    const yaw = Math.atan2(-(end[1] - start[1]), end[0] - start[0]);
    return { point: [xCoord, z], yaw };
  }

  const first = orderedPoints[0];
  const last = orderedPoints[orderedPoints.length - 1];
  return xCoord < first[0]
    ? { point: first, yaw: 0 }
    : { point: last, yaw: 0 };
};

const SOURCE_BRIDGE_SEGMENTS: BridgeSegment[] = SOURCE_BRIDGE_PATHS.flatMap((path) =>
  path.points.slice(1).map((point, index) => {
    const start = path.points[index];
    const dx = point[0] - start[0];
    const dz = point[1] - start[1];
    return {
      id: `${path.id}-segment-${index}`,
      midpoint: [(start[0] + point[0]) / 2, (start[1] + point[1]) / 2],
      length: Math.hypot(dx, dz),
      yaw: Math.atan2(-dz, dx)
    };
  })
);

// A shared median pier supports the paired one-way decks without putting a
// column in either live carriageway. Its position is the midpoint between
// the two source way centerlines at the same east-west station.
const SOURCE_BRIDGE_SUPPORTS = SUPPORT_X_COORDS.map((xCoord) => {
  const eastbound = getPathPoseAtX(SOURCE_BRIDGE_PATHS[0].points, xCoord);
  const westbound = getPathPoseAtX(SOURCE_BRIDGE_PATHS[1].points, xCoord);
  return {
    id: `varthur-road-viaduct-median-support-${xCoord}`,
    point: [xCoord, (eastbound.point[1] + westbound.point[1]) / 2] as SourcePoint,
    yaw: (eastbound.yaw + westbound.yaw) / 2
  };
});

const SOURCE_BRIDGE_LIGHTS = SOURCE_BRIDGE_PATHS.flatMap((path) =>
  LIGHT_X_COORDS.map((xCoord) => {
    const pose = getPathPoseAtX(path.points, xCoord);
    return {
      id: `${path.id}-light-${xCoord}`,
      point: pose.point,
      yaw: pose.yaw
    };
  })
);

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

  return (
    <group name="MarathahalliVarthurRoadSourceViaduct">
      {/* Source-positioned, gently segmented deck for both OSM carriageways. */}
      {SOURCE_BRIDGE_SEGMENTS.map((segment) => (
        <SourceBridgeDeckSegment
          key={segment.id}
          segment={segment}
          concreteMat={concreteMat}
          asphaltDeckMat={asphaltDeckMat}
          barrierMat={barrierMat}
        />
      ))}

      {/* Twin-column supports follow each carriageway centerline. */}
      {SOURCE_BRIDGE_SUPPORTS.map((support) => (
        <SourceBridgeSupport
          key={support.id}
          point={support.point}
          yaw={support.yaw}
          concreteMat={concreteMat}
        />
      ))}

      {/* Warm fixtures make the underside readable in both rain and night views. */}
      {SOURCE_BRIDGE_LIGHTS.map((light) => (
        <UnderBridgeLight
          key={light.id}
          point={light.point}
          yaw={light.yaw}
          isNight={isNight}
        />
      ))}
    </group>
  );
};

const SourceBridgeDeckSegment: React.FC<{
  segment: BridgeSegment;
  concreteMat: THREE.Material;
  asphaltDeckMat: THREE.Material;
  barrierMat: THREE.Material;
}> = ({ segment, concreteMat, asphaltDeckMat, barrierMat }) => {
  const barrierZ = DECK_WIDTH / 2 - 0.35;
  const dashCount = Math.max(1, Math.floor(segment.length / 6));

  return (
    <group
      position={[segment.midpoint[0], 0, segment.midpoint[1]]}
      rotation={[0, segment.yaw, 0]}
    >
      {/* Deep box girder with a narrow three-lane asphalt carriageway. */}
      <mesh position={[0, DECK_BOTTOM_Y + 0.6, 0]} receiveShadow castShadow material={concreteMat}>
        <boxGeometry args={[segment.length + 0.35, 1.2, DECK_WIDTH]} />
      </mesh>
      <mesh position={[0, DECK_TOP_Y + 0.05, 0]} receiveShadow material={asphaltDeckMat}>
        <boxGeometry args={[segment.length + 0.1, 0.1, ROAD_WIDTH]} />
      </mesh>

      {/* Edge barriers on each carriageway; yellow-black faces improve source-road legibility. */}
      {[-barrierZ, barrierZ].map((z, index) => (
        <React.Fragment key={index}>
          <mesh position={[0, DECK_TOP_Y + 0.55, z]} castShadow receiveShadow material={barrierMat}>
            <boxGeometry args={[segment.length + 0.15, 1.1, 0.7]} />
          </mesh>
          <HazardStripeLine
            position={[0, DECK_TOP_Y + 0.55, z + (z > 0 ? 0.36 : -0.36)]}
            length={segment.length + 0.15}
          />
        </React.Fragment>
      ))}

      {/* Three-lane markings follow the same local tangent as the source way. */}
      {LANE_BOUNDARY_OFFSETS.map((z, index) => (
        <group key={index}>
          {Array.from({ length: dashCount }).map((_, dashIndex) => {
            const x = -segment.length / 2 + (dashIndex + 0.5) * 6;
            return (
              <mesh key={dashIndex} position={[x, DECK_TOP_Y + 0.12, z]}>
                <boxGeometry args={[3.0, 0.02, 0.16]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
};

const SourceBridgeSupport: React.FC<{
  point: SourcePoint;
  yaw: number;
  concreteMat: THREE.Material;
}> = ({ point, yaw, concreteMat }) => {
  const columnHeight = DECK_BOTTOM_Y - 0.4;

  return (
    <group position={[point[0], 0, point[1]]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow material={concreteMat}>
        <boxGeometry args={[3.0, 0.4, BRIDGE_TOTAL_WIDTH]} />
      </mesh>
      <mesh position={[0, 0.4 + columnHeight / 2, 0]} castShadow receiveShadow material={concreteMat}>
        <cylinderGeometry args={[0.9, 1.1, columnHeight, 16]} />
      </mesh>
      <mesh position={[0, DECK_BOTTOM_Y - 0.45, 0]} castShadow receiveShadow material={concreteMat}>
        <boxGeometry args={[3.2, 0.9, BRIDGE_TOTAL_WIDTH + 1.0]} />
      </mesh>
    </group>
  );
};

const HazardStripeLine: React.FC<{
  position: [number, number, number];
  length: number;
}> = ({ position, length }) => {
  const stripeWidth = 2.4;
  const stripeCount = Math.max(1, Math.floor(length / stripeWidth));

  return (
    <group position={position}>
      {Array.from({ length: stripeCount }).map((_, index) => (
        <mesh key={index} position={[-length / 2 + (index + 0.5) * stripeWidth, 0, 0]}>
          <boxGeometry args={[stripeWidth, 0.9, 0.04]} />
          <meshBasicMaterial color={index % 2 === 0 ? '#fbbf24' : '#18181b'} />
        </mesh>
      ))}
    </group>
  );
};

const UnderBridgeLight: React.FC<{
  point: SourcePoint;
  yaw: number;
  isNight: boolean;
}> = ({ point, yaw, isNight }) => (
  <group position={[point[0], DECK_BOTTOM_Y - 0.2, point[1]]} rotation={[0, yaw, 0]}>
    <mesh>
      <boxGeometry args={[2.4, 0.08, 0.24]} />
      <meshStandardMaterial
        color="#fff7d6"
        emissive="#ffe9a8"
        emissiveIntensity={isNight ? 3.5 : 1.2}
      />
    </mesh>
    <pointLight
      position={[0, -0.7, 0]}
      intensity={isNight ? 11 : 2.5}
      distance={18}
      color="#fff1cc"
    />
  </group>
);

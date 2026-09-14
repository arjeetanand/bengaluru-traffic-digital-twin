import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  MARATHAHALLI_SKYWALK_DECK_POINTS,
  MARATHAHALLI_SKYWALK_STAIR_POINTS
} from '../../../data/marathahalliDemo';

interface SkywalkProps {
  isNight: boolean;
}

const DECK_TOP_Y = 7.55;
const DECK_WIDTH = 3.4;
const DECK_CLEARANCE = 7.2;

type SourcePoint = [number, number];

const deckStart = MARATHAHALLI_SKYWALK_DECK_POINTS[0];
const deckEnd = MARATHAHALLI_SKYWALK_DECK_POINTS[1];
const deckVector = new THREE.Vector2(deckEnd[0] - deckStart[0], deckEnd[1] - deckStart[1]);
const deckLength = deckVector.length();
const deckMidpoint: SourcePoint = [
  (deckStart[0] + deckEnd[0]) / 2,
  (deckStart[1] + deckEnd[1]) / 2
];
// Three.js local +Z follows the mapped way from south to north.
const deckYaw = Math.atan2(deckVector.x, deckVector.y);

export const Skywalk: React.FC<SkywalkProps> = ({ isNight }) => {
  const ribPositions = useMemo(() => (
    Array.from({ length: 9 }, (_, index) => -deckLength / 2 + (index + 0.5) * (deckLength / 9))
  ), []);

  return (
    <group name="MarathahalliSkywalkSourceMapped">
      <group
        position={[deckMidpoint[0], 0, deckMidpoint[1]]}
        rotation={[0, deckYaw, 0]}
      >
        {/* The mapped deck is a north-south footway at x≈65, crossing the
            Varthur Road carriageways; it is not the east-west vehicle bridge. */}
        <mesh position={[0, DECK_TOP_Y - 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[DECK_WIDTH, 0.44, deckLength + 0.35]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, DECK_TOP_Y + 0.05, 0]} receiveShadow>
          <boxGeometry args={[DECK_WIDTH - 0.2, 0.1, deckLength - 0.15]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>

        {/* Lightweight covered canopy matching the mapped footway footprint. */}
        <mesh position={[0, DECK_TOP_Y + 2.4, 0]} castShadow>
          <boxGeometry args={[4.0, 0.25, deckLength + 0.6]} />
          <meshStandardMaterial color="#1e40af" roughness={0.3} metalness={0.7} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 1.6, DECK_TOP_Y + 1.2, 0]}>
            <boxGeometry args={[0.1, 2.2, deckLength]} />
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
        ))}

        {ribPositions.map((z) => (
          <group key={z} position={[0, DECK_TOP_Y + 1.2, z]}>
            <mesh>
              <boxGeometry args={[3.6, 2.4, 0.2]} />
              <meshStandardMaterial color="#1e3a8a" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {isNight && (
          <>
            <pointLight position={[0, DECK_TOP_Y + 1.8, -deckLength * 0.28]} intensity={12} distance={20} color="#fed7aa" />
            <pointLight position={[0, DECK_TOP_Y + 1.8, deckLength * 0.28]} intensity={12} distance={20} color="#fed7aa" />
          </>
        )}
      </group>

      {/* OSM records the access flights as two steps ways extending west from
          the south landing and east from the north landing. Build those
          flights from the recorded endpoints instead of inventing side towers. */}
      {MARATHAHALLI_SKYWALK_STAIR_POINTS.map(({ deck, ground }, index) => (
        <SourceStairFlight
          key={index}
          deck={deck}
          ground={ground}
          isNight={isNight}
          name={index === 0 ? 'south' : 'north'}
        />
      ))}
    </group>
  );
};

const SourceStairFlight: React.FC<{
  deck: SourcePoint;
  ground: SourcePoint;
  isNight: boolean;
  name: string;
}> = ({ deck, ground, isNight, name }) => {
  const dx = ground[0] - deck[0];
  const dz = ground[1] - deck[1];
  const length = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const stepCount = Math.max(8, Math.round(length / 1.8));
  const stepDepth = length / stepCount;

  return (
    <group
      name={`MarathahalliSkywalk-${name}-source-stairs`}
      position={[deck[0], 0, deck[1]]}
      rotation={[0, yaw, 0]}
    >
      {Array.from({ length: stepCount }, (_, index) => {
        const progress = (index + 0.5) / stepCount;
        const height = DECK_CLEARANCE * (1 - progress);
        return (
          <mesh
            key={index}
            position={[0, Math.max(0.12, height / 2), stepDepth * (index + 0.5)]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[2.6, Math.max(0.24, height), stepDepth + 0.04]} />
            <meshStandardMaterial color="#374151" roughness={0.8} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.12, length + 0.45]} receiveShadow>
        <boxGeometry args={[3.0, 0.24, 0.9]} />
        <meshStandardMaterial color="#6b7280" roughness={0.86} />
      </mesh>
      {isNight && (
        <pointLight position={[0, 1.3, length * 0.42]} intensity={4} distance={12} color="#fed7aa" />
      )}
    </group>
  );
};

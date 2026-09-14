import React, { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { MapPin, BriefcaseBusiness } from 'lucide-react';
import {
  BELLANDUR_MARATHAHALLI_CORRIDOR,
  corridorAnchorToWorld,
  CorridorAttractorAnchor
} from '../../../data/bengaluruCorridor';

interface CorridorAttractorLayerProps {
  isNight: boolean;
  showStops?: boolean;
  showAdjacentContext?: boolean;
  labelDistanceFactor?: number;
}

const ATTRACTOR_PALETTE: Record<CorridorAttractorAnchor['scope'], string> = {
  corridor: '#4fd1c5',
  adjacent_context: '#a78bfa'
};
const getBlockDimensions = (attractor: CorridorAttractorAnchor) => {
  if (attractor.kind === 'technology_employment_cluster') return { width: 56, depth: 42, height: 30 };
  return { width: 44, depth: 34, height: 24 };
};

function AttractorLabel({
  attractor,
  isNight,
  distanceFactor
}: {
  attractor: CorridorAttractorAnchor;
  isNight: boolean;
  distanceFactor: number;
}) {
  const accent = ATTRACTOR_PALETTE[attractor.scope];
  return (
    <Html
      position={corridorAnchorToWorld(attractor.coordinate, 1)}
      center
      distanceFactor={distanceFactor}
      style={{ pointerEvents: 'none' }}
    >
      <div
        className={`corridor-attractor-label ${attractor.scope === 'adjacent_context' ? 'is-context' : ''}`}
        style={{ borderColor: `${accent}99`, boxShadow: isNight ? `0 0 16px ${accent}33` : undefined }}
      >
        <span className="corridor-attractor-icon" style={{ color: accent }} aria-hidden="true">
          <BriefcaseBusiness size={11} />
        </span>
        <span>
          <strong>{attractor.name}</strong>
          <small>{attractor.approximate ? 'APPROX. ANCHOR' : 'SOURCE ANCHOR'}</small>
        </span>
      </div>
    </Html>
  );
}

export const CorridorAttractorLayer: React.FC<CorridorAttractorLayerProps> = ({
  isNight,
  showStops = false,
  showAdjacentContext = false,
  labelDistanceFactor = 260
}) => {
  const attractors = useMemo(
    () => BELLANDUR_MARATHAHALLI_CORRIDOR.attractors.filter((attractor) => (
      showAdjacentContext || attractor.scope === 'corridor'
    )),
    [showAdjacentContext]
  );
  const stops = useMemo(
    () => showStops ? BELLANDUR_MARATHAHALLI_CORRIDOR.stops : [],
    [showStops]
  );
  const stopRoute = useMemo(
    () => stops.map((stop) => corridorAnchorToWorld(stop.coordinate, 0.28)),
    [stops]
  );

  return (
    <group name="BellandurMarathahalliCorridorAnchors">
      {stopRoute.length > 1 && (
        <Line
          points={stopRoute}
          color="#38bdf8"
          lineWidth={1.8}
          transparent
          opacity={isNight ? 0.75 : 0.46}
        />
      )}

      {stops.map((stop) => {
        const [x, , z] = corridorAnchorToWorld(stop.coordinate, 0.34);
        return (
          <group key={stop.id} position={[x, 0.34, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[8, 8.7, 32]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.62} />
            </mesh>
            <Html position={[0, 1, 0]} center distanceFactor={labelDistanceFactor} style={{ pointerEvents: 'none' }}>
              <div className="corridor-stop-label">
                <MapPin size={11} aria-hidden="true" />
                <span>{stop.name}</span>
              </div>
            </Html>
          </group>
        );
      })}

      {attractors.map((attractor) => {
        const [x, , z] = corridorAnchorToWorld(attractor.coordinate);
        const dimensions = getBlockDimensions(attractor);
        const accent = ATTRACTOR_PALETTE[attractor.scope];
        return (
          <group key={attractor.id} position={[x, 0, z]}>
            <mesh position={[0, dimensions.height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
              <meshStandardMaterial
                color={isNight ? '#122331' : '#264957'}
                roughness={0.5}
                metalness={0.45}
                emissive={isNight ? accent : '#000000'}
                emissiveIntensity={isNight ? 0.18 : 0}
                transparent
                opacity={0.88}
              />
            </mesh>
            <mesh position={[0, dimensions.height * 0.48, dimensions.depth / 2 + 0.06]}>
              <boxGeometry args={[dimensions.width * 0.74, 0.18, 0.08]} />
              <meshBasicMaterial color={accent} transparent opacity={0.7} />
            </mesh>
            <AttractorLabel
              attractor={attractor}
              isNight={isNight}
              distanceFactor={labelDistanceFactor}
            />
          </group>
        );
      })}
    </group>
  );
};

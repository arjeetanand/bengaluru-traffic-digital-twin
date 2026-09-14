import React, { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { ScenarioVisualState } from '../../../types';
import { getOrrOffsetPointAtZ } from '../../../data/RealRoadData';

interface ScenarioImpactOverlayProps {
  visualState: ScenarioVisualState;
}

interface ImpactRoute {
  edgeId: string;
  label: string;
  points: readonly [number, number, number][];
}

const toPoints = (points: readonly [number, number][], y = 0.48) =>
  points.map(([x, z]) => [x, y, z] as [number, number, number]);

const IMPACT_ROUTES: readonly ImpactRoute[] = [
  {
    edgeId: 'bellandur_approach',
    label: 'Bellandur approach',
    points: toPoints([[-118, -205], [-52, -100], [-20, -25]])
  },
  {
    edgeId: 'doddanekundi_approach',
    label: 'Doddanekundi approach',
    points: toPoints([[26, 176], [12, 110], [-3, 46]])
  },
  {
    edgeId: 'orr_eastbound',
    label: 'ORR eastbound',
    points: toPoints([[-210, 9], [-115, 8], [-24, 10]])
  },
  {
    edgeId: 'tech_park_access',
    label: 'Technology park access',
    points: toPoints([[-205, -54], [-130, -30], [-52, -4]])
  }
];

const CLOSED_EDGE_ROUTES: Record<string, readonly [number, number, number][]> = {
  orr_eastbound: toPoints([[-208, 8], [-122, 8], [-26, 10]], 0.56),
  marathahalli_underpass: toPoints(
    [-80, -30, 20, 70, 145].map((z) => getOrrOffsetPointAtZ(z, 3.8)),
    0.56
  ),
  marathahalli_signal: toPoints([[-34, 0], [-18, 10], [2, 15], [18, 10]], 0.56),
  tech_park_access: toPoints([[-204, -54], [-130, -30], [-52, -4]], 0.56)
};

function intensityForEdge(
  edgeId: string,
  visualState: ScenarioVisualState
) {
  return visualState.spilloverEdges.find((edge) => edge.edgeId === edgeId)?.intensity ?? 0;
}

export const ScenarioImpactOverlay: React.FC<ScenarioImpactOverlayProps> = ({ visualState }) => {
  const activeSpilloverRoutes = useMemo(
    () => IMPACT_ROUTES.filter((route) => intensityForEdge(route.edgeId, visualState) > 0),
    [visualState]
  );

  if (!visualState.isActive) return null;

  const closedRoute = visualState.closedEdgeId
    ? CLOSED_EDGE_ROUTES[visualState.closedEdgeId]
    : undefined;

  return (
    <group name="ScenarioImpactOverlay">
      {closedRoute && (
        <>
          <Line
            points={closedRoute}
            color="#ff765e"
            lineWidth={5}
            transparent
            opacity={0.9}
          />
          <Line
            points={closedRoute}
            color="#ffd166"
            lineWidth={1.6}
            transparent
            opacity={0.95}
          />
          <Html position={closedRoute[Math.floor(closedRoute.length / 2)]} center distanceFactor={105}>
            <div className="scenario-world-label scenario-world-label-closed">
              <span className="scenario-world-label-dot" aria-hidden="true" />
              {visualState.affectedLane || 'Affected approach'}
            </div>
          </Html>
        </>
      )}

      {activeSpilloverRoutes.map((route) => {
        const intensity = intensityForEdge(route.edgeId, visualState);
        const impact = visualState.spilloverEdges.find((edge) => edge.edgeId === route.edgeId);
        return (
          <React.Fragment key={route.edgeId}>
            <Line
              points={route.points}
              color="#f6b44f"
              lineWidth={2 + intensity * 2}
              transparent
              opacity={0.34 + intensity * 0.5}
            />
            <Html position={route.points[Math.floor(route.points.length / 2)]} center distanceFactor={120}>
              <div className="scenario-world-label scenario-world-label-spillover">
                <span className="scenario-world-label-pulse" aria-hidden="true" />
                <span>{route.label}</span>
                {impact && <strong>+{impact.queueMeters} m</strong>}
              </div>
            </Html>
          </React.Fragment>
        );
      })}

      <mesh position={[-10.7, 0.6, 12.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[12, 12.55, 48]} />
        <meshBasicMaterial
          color="#ffb454"
          transparent
          opacity={0.22 + visualState.progress * 0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

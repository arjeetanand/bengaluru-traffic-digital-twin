import * as THREE from 'three';

export type LanePoint = [number, number, number];

export interface UTurnConnector {
  id: string;
  points: LanePoint[];
  stopT: number;
  sourceStatus: 'source-linked-scenario';
  sourceWayIds: readonly string[];
}

const sourceRoadPoint = (x: number, z: number): LanePoint => [x, 0.12, z];

// This path follows the short OSM vertex trace around the Varthur Road
// crossover. It includes the exact member sequence of relation/18922642
// (way/399000523 → way/1288842277 → way/426988256), with only the immediately
// connected approach/exit vertices added so the replay stays local to the
// junction instead of drawing an invented corridor-wide loop. OSM marks this
// movement as no_u_turn; it is deliberately a source-linked scenario replay,
// not a legal-turn assertion.
const SOURCE_UTURN_REPLAY_POINTS: readonly LanePoint[] = [
  sourceRoadPoint(58.8, 1.6),
  sourceRoadPoint(30.8, 3.6),
  sourceRoadPoint(6.4, 5.9),
  sourceRoadPoint(-16.2, 7.7),
  sourceRoadPoint(-23.5, 8.1),
  sourceRoadPoint(-26.9, 8.3),
  sourceRoadPoint(-25.7, 16.9),
  sourceRoadPoint(-15.4, 16.4),
  sourceRoadPoint(12.8, 14.6),
  sourceRoadPoint(31.7, 13.2),
  sourceRoadPoint(49.9, 13.0),
  sourceRoadPoint(84.1, 10.6),
];

const SOURCE_UTURN_REPLAY_REVERSE_POINTS: readonly LanePoint[] = [
  ...[...SOURCE_UTURN_REPLAY_POINTS].reverse()
];

/**
 * Build the source-linked replay as a piecewise-linear path. OSM gives us
 * vertices and joined way members, not a surveyed turning-radius spline; a
 * CurvePath keeps every vehicle and audit ribbon on those exact segments.
 * Smoothing is still available to authored fallback roads, but must not make
 * the source scenario cut across a mapped carriageway or footway.
 */
export function createSourceReplayCurve(
  points: readonly LanePoint[],
  yOffset = 0
): THREE.CurvePath<THREE.Vector3> {
  const curve = new THREE.CurvePath<THREE.Vector3>();
  for (let index = 1; index < points.length; index += 1) {
    const [fromX, fromY, fromZ] = points[index - 1];
    const [toX, toY, toZ] = points[index];
    curve.add(new THREE.LineCurve3(
      new THREE.Vector3(fromX, fromY + yOffset, fromZ),
      new THREE.Vector3(toX, toY + yOffset, toZ)
    ));
  }
  return curve;
}

// Surface U-turn connectors are shared by the traffic simulation and the
// crossover audit layer so a vehicle route cannot drift away from the source
// vertex trace. The compiled OSM turn restriction remains the authority for
// legality; these lanes are only replayable visual scenarios.
export const U_TURN_CONNECTORS: { north: UTurnConnector; south: UTurnConnector } = {
  north: {
    id: 'surface-u-turn-north',
    stopT: 0.46,
    points: [...SOURCE_UTURN_REPLAY_POINTS],
    sourceStatus: 'source-linked-scenario',
    sourceWayIds: [
      'way/426988255', 'way/1100988966', 'way/735044130', 'way/399000523',
      'way/1288842277', 'way/426988256', 'way/399000520', 'way/763405052',
      'way/1086240291'
    ]
  },
  south: {
    id: 'surface-u-turn-south',
    stopT: 0.42,
    points: [...SOURCE_UTURN_REPLAY_REVERSE_POINTS],
    sourceStatus: 'source-linked-scenario',
    sourceWayIds: [
      'way/1086240291', 'way/763405052', 'way/399000520', 'way/426988256',
      'way/1288842277', 'way/399000523', 'way/735044130', 'way/1100988966',
      'way/426988255'
    ]
  }
};

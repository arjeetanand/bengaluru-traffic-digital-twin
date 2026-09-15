import * as THREE from 'three';

export type LanePoint = [number, number, number];

export type UTurnPhaseId = 'approach' | 'yield' | 'sweep' | 'exit';

export interface UTurnPhaseRange {
  startVertex: number;
  endVertex: number;
  sourceWayIds: readonly string[];
}

export interface SourceCrossoverCrossingTrace {
  id: string;
  geometry: readonly [number, number][];
  crossing: 'traffic_signals' | 'uncontrolled';
  markings: 'no' | 'unspecified';
  sourceStatus: 'source-mapped';
}

export interface UTurnConnector {
  id: string;
  points: LanePoint[];
  stopT: number;
  phaseRanges: Readonly<Record<UTurnPhaseId, UTurnPhaseRange>>;
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
 * These are the four OSM crossing ways inside the crossover focus envelope.
 * The compiled snapshot records their exact polylines and explicitly says
 * that markings are absent; the renderer may show the paved crossing trace,
 * but must not paint a zebra or imply right-of-way that the source does not
 * provide.
 */
export const SOURCE_CROSSOVER_CROSSING_TRACES: readonly SourceCrossoverCrossingTrace[] = [
  {
    id: 'way/1284676222',
    geometry: [
      [-32.7, 2.6],
      [-31.8, 8.7],
      [-31.3, 12.7],
      [-30.6, 17.4],
      [-29.7, 23.9]
    ],
    crossing: 'traffic_signals',
    markings: 'no',
    sourceStatus: 'source-mapped'
  },
  {
    id: 'way/1226676600',
    geometry: [
      [10.7, -7.6],
      [13.0, -7.5],
      [16.2, -7.6],
      [23.4, -7.9]
    ],
    crossing: 'uncontrolled',
    markings: 'no',
    sourceStatus: 'source-mapped'
  },
  {
    id: 'way/1226676601',
    geometry: [
      [-28.2, -5.5],
      [-25.8, -5.6],
      [-22.5, -5.8],
      [-17.5, -6.1]
    ],
    crossing: 'uncontrolled',
    markings: 'no',
    sourceStatus: 'source-mapped'
  },
  {
    id: 'way/1086238616',
    geometry: [
      [-23.4, 31.2],
      [-20.3, 30.7],
      [-17.9, 30.3],
      [-14.1, 29.6]
    ],
    crossing: 'uncontrolled',
    markings: 'no',
    sourceStatus: 'source-mapped'
  }
];

const NORTH_UTURN_PHASE_RANGES: Readonly<Record<UTurnPhaseId, UTurnPhaseRange>> = {
  approach: {
    startVertex: 0,
    endVertex: 3,
    sourceWayIds: ['way/426988255', 'way/1100988966', 'way/735044130']
  },
  yield: {
    startVertex: 3,
    endVertex: 5,
    sourceWayIds: ['way/399000523']
  },
  sweep: {
    startVertex: 5,
    endVertex: 6,
    sourceWayIds: ['way/1288842277']
  },
  exit: {
    startVertex: 6,
    endVertex: 11,
    sourceWayIds: ['way/426988256', 'way/399000520', 'way/763405052', 'way/1086240291']
  }
};

const SOUTH_UTURN_PHASE_RANGES: Readonly<Record<UTurnPhaseId, UTurnPhaseRange>> = {
  approach: {
    startVertex: 0,
    endVertex: 5,
    sourceWayIds: ['way/1086240291', 'way/763405052', 'way/399000520', 'way/426988256']
  },
  yield: {
    startVertex: 5,
    endVertex: 6,
    sourceWayIds: ['way/1288842277']
  },
  sweep: {
    startVertex: 6,
    endVertex: 8,
    sourceWayIds: ['way/399000523']
  },
  exit: {
    startVertex: 8,
    endVertex: 11,
    sourceWayIds: ['way/735044130', 'way/1100988966', 'way/426988255']
  }
};

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

/**
 * Convert a source vertex boundary into the same normalized arc-length space
 * used by CurvePath.getPointAt(). This keeps phase labels and the simulation's
 * stop location on a source way boundary instead of an arbitrary point index
 * or a guessed percentage of the replay.
 */
export function getSourceReplayProgressAtVertex(
  points: readonly LanePoint[],
  vertexIndex: number
) {
  if (points.length < 2) return 0;

  const targetIndex = Math.max(0, Math.min(points.length - 1, Math.trunc(vertexIndex)));
  let totalLength = 0;
  let targetLength = 0;

  for (let index = 1; index < points.length; index += 1) {
    const [fromX, _fromY, fromZ] = points[index - 1];
    const [toX, _toY, toZ] = points[index];
    const segmentLength = Math.hypot(toX - fromX, toZ - fromZ);
    totalLength += segmentLength;
    if (index <= targetIndex) targetLength = totalLength;
  }

  return totalLength > 0 ? targetLength / totalLength : 0;
}

// Surface U-turn connectors are shared by the traffic simulation and the
// crossover audit layer so a vehicle route cannot drift away from the source
// vertex trace. The compiled OSM turn restriction remains the authority for
// legality; these lanes are only replayable visual scenarios.
export const U_TURN_CONNECTORS: { north: UTurnConnector; south: UTurnConnector } = {
  north: {
    id: 'surface-u-turn-north',
    // The source way changes from the `from` member to its `via` member at
    // vertex 5. This is a modelled yield boundary, not a surveyed stop line.
    // Literal retained for the static crossover validator; it is the
    // normalized source-polyline distance at vertex 5 (0.420056946...).
    stopT: 0.420056946,
    points: [...SOURCE_UTURN_REPLAY_POINTS],
    sourceStatus: 'source-linked-scenario',
    sourceWayIds: [
      'way/426988255', 'way/1100988966', 'way/735044130', 'way/399000523',
      'way/1288842277', 'way/426988256', 'way/399000520', 'way/763405052',
      'way/1086240291'
    ],
    phaseRanges: NORTH_UTURN_PHASE_RANGES
  },
  south: {
    id: 'surface-u-turn-south',
    // The reverse visual scenario reaches the same source boundary at its
    // reversed vertex 5. It remains a replay aid because OSM records no_u_turn.
    // Literal retained for the static crossover validator; it is the
    // reversed normalized source-polyline distance (1 - north.stopT).
    stopT: 0.579943054,
    points: [...SOURCE_UTURN_REPLAY_REVERSE_POINTS],
    sourceStatus: 'source-linked-scenario',
    sourceWayIds: [
      'way/1086240291', 'way/763405052', 'way/399000520', 'way/426988256',
      'way/1288842277', 'way/399000523', 'way/735044130', 'way/1100988966',
      'way/426988255'
    ],
    phaseRanges: SOUTH_UTURN_PHASE_RANGES
  }
};

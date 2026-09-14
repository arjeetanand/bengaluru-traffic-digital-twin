import { CAMERA_DEFAULT_POSITION } from '../config/location';
import { CameraMode, CameraPreset } from '../types';
import { getOrrOffsetPointAtZ } from './RealRoadData';
import {
  MARATHAHALLI_SKYWALK_DECK_POINTS,
  MARATHAHALLI_SKYWALK_DECK_TOP_Y,
  MARATHAHALLI_SKYWALK_GROUND_TOP_Y,
  MARATHAHALLI_SKYWALK_STAIR_POINTS
} from './marathahalliDemo';

export interface CameraView {
  position: [number, number, number];
  target: [number, number, number];
}

export interface WalkObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const WALK_EYE_HEIGHT = 1.7;
export const WALK_LOOK_DISTANCE = 8;

type LocalXZ = [number, number];

/**
 * Source-backed local anchors from public/data/marathahalli-demo.json.
 *
 * A building centroid, an entrance/edge, a bus stop, and a road point are
 * deliberately separate concepts. Presets use the appropriate one instead
 * of pretending that every named place has one universally correct point.
 */
export const MARATHAHALLI_SOURCE_ANCHORS = {
  junction: {
    roadCenter: [-10.7, 12.7] as LocalXZ,
    signalCluster: [-29.6, 2.7] as LocalXZ
  },
  oracleHub: {
    campusCentroid: [-746.6, -1779.2] as LocalXZ,
    entranceFountain: [-544.7, -1692.9] as LocalXZ,
    approachRoad: [-553.2, -1752.6] as LocalXZ
  },
  innovativeMultiplex: {
    buildingCentroid: [-286.0, -535.1] as LocalXZ,
    exteriorEdge: [-226.3, -537.8] as LocalXZ,
    busStop: [-136.7, -576.4] as LocalXZ
  },
  kalamandir: {
    buildingCentroid: [46.0, 330.4] as LocalXZ,
    westExteriorEdge: [40.0, 332.5] as LocalXZ,
    busStop: [7.6, 354.2] as LocalXZ
  },
  spiceGarden: {
    restaurant: [860.1, 24.0] as LocalXZ,
    busStopPrimary: [835.8, -59.8] as LocalXZ,
    busStopAlternate: [827.8, -39.1] as LocalXZ,
    roadSouth: [850.6, -25.7] as LocalXZ,
    roadNorth: [839.8, 24.9] as LocalXZ
  },
  underpass: {
    southPortal: [-7.3, -8.0] as LocalXZ,
    center: [-4.0, 12.0] as LocalXZ,
    northPortal: [-0.6, 32.1] as LocalXZ
  },
  varthurViaduct: {
    westDeck: [338.3, -6.9] as LocalXZ,
    center: [376.0, -15.0] as LocalXZ,
    eastDeck: [414.5, -12.2] as LocalXZ,
    groundApproach: [300.0, -6.0] as LocalXZ
  }
} as const;

const getOrrWalkPoint = (z: number, semanticOffset: number): [number, number, number] => {
  const lateralOffset = semanticOffset >= 0 ? -Math.abs(semanticOffset) : Math.abs(semanticOffset);
  const [x, projectedZ] = getOrrOffsetPointAtZ(z, lateralOffset);
  return [x, WALK_EYE_HEIGHT, projectedZ];
};

const createOrrWalkAnchor = (
  startZ: number,
  targetZ: number,
  semanticOffset: number
): CameraView => ({
  position: getOrrWalkPoint(startZ, semanticOffset),
  target: getOrrWalkPoint(targetZ, semanticOffset)
});

// Source-backed anchors from the widened OSM extract. These are kept in the
// same local metre projection as the junction scene so the corridor view and
// person mode share one coordinate contract.
const ORACLE_HUB_LOCAL: [number, number, number] = [
  MARATHAHALLI_SOURCE_ANCHORS.oracleHub.campusCentroid[0],
  WALK_EYE_HEIGHT,
  MARATHAHALLI_SOURCE_ANCHORS.oracleHub.campusCentroid[1]
];

const BIRD_VIEWS: Record<CameraPreset, CameraView> = {
  overview: {
    position: CAMERA_DEFAULT_POSITION,
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[0],
      0,
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[1]
    ]
  },
  underpass: {
    // Source tunnel ways run from approximately z=-8 to z=32. Aim at their
    // shared center while keeping the bird camera outside the trench.
    position: [-82, 34, -108],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.underpass.center[0],
      -4.5,
      MARATHAHALLI_SOURCE_ANCHORS.underpass.center[1]
    ]
  },
  surface: {
    position: [-34, 8, 24],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[0],
      1,
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[1]
    ]
  },
  aerial: {
    position: [0, 160, 0.1],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[0],
      0,
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[1]
    ]
  },
  cinematic: {
    position: CAMERA_DEFAULT_POSITION,
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[0],
      0,
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[1]
    ]
  },
  flyover: {
    // Source Varthur Road viaduct (OSM ways 1157170083/1157170085).
    position: [292, 54, 92],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.center[0],
      8,
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.center[1]
    ]
  },
  ground: {
    position: [-34, 8, 24],
    target: [0, 1, 0]
  },
  multiplex: {
    position: [-190, 26, -405],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.innovativeMultiplex.buildingCentroid[0],
      12,
      MARATHAHALLI_SOURCE_ANCHORS.innovativeMultiplex.buildingCentroid[1]
    ]
  },
  kalamandir: {
    position: [-10, 22, 382],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.kalamandir.buildingCentroid[0],
      14,
      MARATHAHALLI_SOURCE_ANCHORS.kalamandir.buildingCentroid[1]
    ]
  },
  brandfactory: {
    position: [-20, 28, 112],
    target: [48, 12, 58]
  },
  skywalk: {
    position: [112, 46, 74],
    target: [MARATHAHALLI_SKYWALK_DECK_POINTS[0][0], 6.5, MARATHAHALLI_SKYWALK_DECK_POINTS[0][1]]
  },
  spicegarden: {
    // OSM-backed Spice Garden restaurant point (12.9570571, 77.7091042),
    // east of the Marathahalli junction on the actual HAL Airport Road.
    position: [930, 52, 82],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.spiceGarden.restaurant[0],
      6,
      MARATHAHALLI_SOURCE_ANCHORS.spiceGarden.restaurant[1]
    ]
  },
  crossover: {
    // Center on the source underpass/arterial crossover rather than the
    // authored origin. The camera is high enough to clear the junction table
    // and still expose the curved approaches.
    position: [118, 128, 142],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.underpass.center[0],
      2,
      MARATHAHALLI_SOURCE_ANCHORS.underpass.center[1]
    ]
  },
  corridor: {
    // Full source corridor: Oracle Tech Hub → Marathahalli junction →
    // Kalamandir/Spice Garden. Framing is tightened so source building
    // massing and the named road spine remain legible without losing the
    // 2.1 km route from the bird view.
    position: [1320, 1980, 1580],
    target: [56.8, 0, -877.6]
  },
  oraclehub: {
    position: [-470, 150, -1498],
    target: ORACLE_HUB_LOCAL
  }
};

const WALK_STARTS: Record<CameraPreset, CameraView> = {
  // Start the default person inspection on the open, source-aligned ORR
  // frontage at the junction so the first frame shows a navigable road,
  // footpath, trees, and adjacent buildings without a wall filling the lens.
  overview: createOrrWalkAnchor(-38, 5, -26.5),
  underpass: createOrrWalkAnchor(-58, -28, -18),
  surface: createOrrWalkAnchor(-38, 5, -26.5),
  aerial: createOrrWalkAnchor(-38, 5, -23.5),
  cinematic: createOrrWalkAnchor(-38, 5, -26.5),
  flyover: {
    position: [
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.groundApproach[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.groundApproach[1]
    ],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.westDeck[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.westDeck[1]
    ]
  },
  ground: createOrrWalkAnchor(-38, 5, -26.5),
  multiplex: {
    position: [-220, WALK_EYE_HEIGHT, -535],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.innovativeMultiplex.exteriorEdge[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.innovativeMultiplex.exteriorEdge[1]
    ]
  },
  kalamandir: {
    // Keep the eye outside the coarse building footprint while looking toward
    // the source-mapped west exterior edge.
    position: [26.5, WALK_EYE_HEIGHT, 332.5],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.kalamandir.westExteriorEdge[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.kalamandir.westExteriorEdge[1]
    ]
  },
  brandfactory: { position: [15, 1.7, 58], target: [48, 1.7, 58] },
  skywalk: {
    position: [45.2, WALK_EYE_HEIGHT, -4.7],
    target: [63.9, WALK_EYE_HEIGHT, -4.6]
  },
  // Start on the mapped Spice Garden Road footway near the source restaurant
  // point instead of teleporting back to the junction scene.
  spicegarden: {
    position: [
      832.8,
      WALK_EYE_HEIGHT,
      57.5
    ],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.spiceGarden.roadNorth[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.spiceGarden.roadNorth[1]
    ]
  },
  // The crossover walk view starts on the south approach and looks through
  // the mapped underpass instead of reusing the generic junction frontage.
  crossover: createOrrWalkAnchor(-28, 18, -18),
  corridor: { position: [-24, WALK_EYE_HEIGHT, -260], target: [-24, WALK_EYE_HEIGHT, -252] },
  oraclehub: {
    position: [
      MARATHAHALLI_SOURCE_ANCHORS.oracleHub.approachRoad[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.oracleHub.approachRoad[1]
    ],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.oracleHub.entranceFountain[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.oracleHub.entranceFountain[1]
    ]
  }
};

// A bounded inspection envelope keeps WASD navigation inside the modeled
// corridor while leaving the authored HAL/ORR/Spice Garden extents reachable.
export const MARATHAHALLI_WALK_BOUNDS = {
  minX: -1020,
  maxX: 1020,
  minZ: -1950,
  maxZ: 520
};

// Overview cameras need more room than a person camera to frame the full
// Oracle-to-Spice-Garden corridor. These bounds still prevent pan/keyboard
// drift into an unbounded empty scene.
export const MARATHAHALLI_OVERVIEW_BOUNDS = {
  minX: -1400,
  maxX: 1600,
  minY: 0.75,
  maxY: 3000,
  minZ: -2400,
  maxZ: 1000
};

// Coarse, named landmark footprints prevent the person camera from walking
// through the largest authored showrooms. OSM massing remains a visual layer;
// these are navigation guardrails, not a survey-grade collision map.
export const MARATHAHALLI_WALK_OBSTACLES: WalkObstacle[] = [
  { minX: -314, maxX: -258, minZ: -565, maxZ: -505 }, // Innovative Multiplex
  { minX: 33, maxX: 64, minZ: 32, maxZ: 85 },       // Brand Factory / outlet row
  { minX: 29, maxX: 67, minZ: 310, maxZ: 371 },     // Kalamandir / Nalli frontage
  { minX: -58, maxX: -17, minZ: 87, maxZ: 130 },    // Krishna Summit block
  // Keep the eastern entrance apron open so the source approach road and
  // entrance fountain remain reachable in person mode. The campus itself is
  // still guarded by the coarse western massing envelope.
  { minX: -980, maxX: -568, minZ: -1900, maxZ: -1580 } // Oracle Tech Hub campus
];

const distanceToSegment = (x: number, z: number, start: LocalXZ, end: LocalXZ) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSq = dx * dx + dz * dz;
  const progress = lengthSq === 0
    ? 0
    : Math.max(0, Math.min(1, ((x - start[0]) * dx + (z - start[1]) * dz) / lengthSq));
  const closestX = start[0] + dx * progress;
  const closestZ = start[1] + dz * progress;
  return { distance: Math.hypot(x - closestX, z - closestZ), progress };
};

/**
 * Resolve the source-mapped pedestrian surface under a local X/Z point. The
 * skywalk deck and its two recorded stair flights are the elevated pedestrian
 * geometry; all other walking stays at grade. The camera adds eye height on
 * top of this surface value.
 */
export function resolveWalkSurfaceY(x: number, z: number): number {
  for (const { deck, ground } of MARATHAHALLI_SKYWALK_STAIR_POINTS) {
    const projection = distanceToSegment(x, z, deck, ground);
    if (projection.distance <= 2.0) {
      return MARATHAHALLI_SKYWALK_DECK_TOP_Y +
        (MARATHAHALLI_SKYWALK_GROUND_TOP_Y - MARATHAHALLI_SKYWALK_DECK_TOP_Y) * projection.progress;
    }
  }

  const deckProjection = distanceToSegment(
    x,
    z,
    MARATHAHALLI_SKYWALK_DECK_POINTS[0],
    MARATHAHALLI_SKYWALK_DECK_POINTS[1]
  );
  if (deckProjection.distance <= 2.0) return MARATHAHALLI_SKYWALK_DECK_TOP_Y;
  return 0;
}

export function resolveWalkEyeHeight(x: number, z: number): number {
  return WALK_EYE_HEIGHT + resolveWalkSurfaceY(x, z);
}

const isInsideObstacle = (x: number, z: number, padding = 1.2) =>
  MARATHAHALLI_WALK_OBSTACLES.some(
    (obstacle) =>
      x >= obstacle.minX - padding &&
      x <= obstacle.maxX + padding &&
      z >= obstacle.minZ - padding &&
      z <= obstacle.maxZ + padding
  );

export function resolveWalkPosition(
  currentX: number,
  currentZ: number,
  nextX: number,
  nextZ: number
): [number, number] {
  const boundedX = Math.max(MARATHAHALLI_WALK_BOUNDS.minX, Math.min(MARATHAHALLI_WALK_BOUNDS.maxX, nextX));
  const boundedZ = Math.max(MARATHAHALLI_WALK_BOUNDS.minZ, Math.min(MARATHAHALLI_WALK_BOUNDS.maxZ, nextZ));

  if (!isInsideObstacle(boundedX, boundedZ)) return [boundedX, boundedZ];
  if (!isInsideObstacle(boundedX, currentZ)) return [boundedX, currentZ];
  if (!isInsideObstacle(currentX, boundedZ)) return [currentX, boundedZ];
  return [currentX, currentZ];
}

/**
 * Put an externally supplied person-mode start just outside a coarse obstacle.
 * This is used for fly-to/preset entry points; regular movement continues to
 * use resolveWalkPosition so it never jumps through a landmark.
 */
export function resolveWalkStart(x: number, z: number): [number, number] {
  let resolvedX = Math.max(MARATHAHALLI_WALK_BOUNDS.minX, Math.min(MARATHAHALLI_WALK_BOUNDS.maxX, x));
  let resolvedZ = Math.max(MARATHAHALLI_WALK_BOUNDS.minZ, Math.min(MARATHAHALLI_WALK_BOUNDS.maxZ, z));

  for (let iteration = 0; iteration < MARATHAHALLI_WALK_OBSTACLES.length + 1; iteration += 1) {
    const obstacle = MARATHAHALLI_WALK_OBSTACLES.find((candidate) =>
      resolvedX >= candidate.minX - 1.2 &&
      resolvedX <= candidate.maxX + 1.2 &&
      resolvedZ >= candidate.minZ - 1.2 &&
      resolvedZ <= candidate.maxZ + 1.2
    );

    if (!obstacle) return [resolvedX, resolvedZ];

    const candidates: LocalXZ[] = [
      [obstacle.minX - 1.3, resolvedZ],
      [obstacle.maxX + 1.3, resolvedZ],
      [resolvedX, obstacle.minZ - 1.3],
      [resolvedX, obstacle.maxZ + 1.3]
    ].map(([candidateX, candidateZ]) => [
      Math.max(MARATHAHALLI_WALK_BOUNDS.minX, Math.min(MARATHAHALLI_WALK_BOUNDS.maxX, candidateX)),
      Math.max(MARATHAHALLI_WALK_BOUNDS.minZ, Math.min(MARATHAHALLI_WALK_BOUNDS.maxZ, candidateZ))
    ]);

    [resolvedX, resolvedZ] = candidates.reduce((nearest, candidate) =>
      Math.hypot(candidate[0] - resolvedX, candidate[1] - resolvedZ) <
        Math.hypot(nearest[0] - resolvedX, nearest[1] - resolvedZ)
        ? candidate
        : nearest
    );
  }

  return [resolvedX, resolvedZ];
}

export function createWalkView(position: [number, number, number], target: [number, number, number]): CameraView {
  const eyeHeight = resolveWalkEyeHeight(position[0], position[2]);
  const dx = target[0] - position[0];
  const dy = target[1] - position[1];
  const dz = target[2] - position[2];
  const distance = Math.hypot(dx, dy, dz) || 1;

  return {
    position: [position[0], eyeHeight, position[2]],
    target: [
      position[0] + (dx / distance) * WALK_LOOK_DISTANCE,
      eyeHeight + (dy / distance) * WALK_LOOK_DISTANCE,
      position[2] + (dz / distance) * WALK_LOOK_DISTANCE
    ]
  };
}

export function getCameraView(preset: CameraPreset, mode: CameraMode): CameraView {
  return mode === 'walk' ? createWalkView(WALK_STARTS[preset].position, WALK_STARTS[preset].target) : BIRD_VIEWS[preset];
}

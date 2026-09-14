import { CAMERA_DEFAULT_POSITION, CAMERA_DEFAULT_TARGET } from '../config/location';
import { CameraMode, CameraPreset } from '../types';
import { getOrrOffsetPointAtZ } from './RealRoadData';

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
const ORACLE_HUB_LOCAL: [number, number, number] = [-746.6, WALK_EYE_HEIGHT, -1779.2];

const BIRD_VIEWS: Record<CameraPreset, CameraView> = {
  overview: {
    position: CAMERA_DEFAULT_POSITION,
    target: CAMERA_DEFAULT_TARGET
  },
  underpass: {
    // Approach the south portal obliquely. This keeps the trench opening,
    // curved carriageway, surface crossover, and overhead supports in one
    // legible frame instead of placing the camera behind a metro pier.
    position: [-24, 5, -125],
    target: [-28, -4, -50]
  },
  surface: {
    position: [-34, 8, 24],
    target: [0, 1, 0]
  },
  aerial: {
    position: [0, 160, 0.1],
    target: [0, 0, 0]
  },
  cinematic: {
    position: CAMERA_DEFAULT_POSITION,
    target: CAMERA_DEFAULT_TARGET
  },
  flyover: {
    position: [150, 42, 95],
    target: [175, 7, 0]
  },
  ground: {
    position: [-34, 8, 24],
    target: [0, 1, 0]
  },
  multiplex: {
    position: [-190, 26, -405],
    target: [-286, 12, -535]
  },
  kalamandir: {
    position: [-10, 22, 382],
    target: [46, 14, 332.5]
  },
  brandfactory: {
    position: [-20, 28, 112],
    target: [48, 12, 58]
  },
  spicegarden: {
    // OSM-backed Spice Garden restaurant point (12.9570571, 77.7091042),
    // east of the Marathahalli junction on the actual HAL Airport Road.
    position: [930, 48, 80],
    target: [860, 6, 24]
  },
  crossover: {
    // East-side oblique angle keeps both source-aligned U-turn loops and the
    // curved metro deck in frame without letting the foreground structures
    // swallow the signal crossover.
    position: [130, 108, 190],
    target: [0, 3, 12]
  },
  corridor: {
    // Full source corridor: Oracle Tech Hub → Marathahalli junction →
    // Kalamandir/Spice Garden. Framing is tightened so source building
    // massing and the named road spine remain legible without losing the
    // 2.1 km route from the bird view.
    position: [1250, 1800, 1450],
    target: [-120, 0, -720]
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
  underpass: createOrrWalkAnchor(-110, -50, -26.5),
  surface: createOrrWalkAnchor(-38, 5, -26.5),
  aerial: createOrrWalkAnchor(-38, 5, -23.5),
  cinematic: createOrrWalkAnchor(-38, 5, -26.5),
  flyover: { position: [125, 1.7, 8], target: [175, 1.7, 0] },
  ground: createOrrWalkAnchor(-38, 5, -26.5),
  multiplex: { position: [-220, WALK_EYE_HEIGHT, -535], target: [-226.3, WALK_EYE_HEIGHT, -537.8] },
  kalamandir: { position: [22, WALK_EYE_HEIGHT, 332.5], target: [40, WALK_EYE_HEIGHT, 332.5] },
  brandfactory: { position: [15, 1.7, 58], target: [48, 1.7, 58] },
  // Start on the mapped Spice Garden Road footway near the source restaurant
  // point instead of teleporting back to the junction scene.
  spicegarden: { position: [835, WALK_EYE_HEIGHT, 58], target: [850, WALK_EYE_HEIGHT, 30] },
  crossover: createOrrWalkAnchor(-38, 5, -26.5),
  corridor: { position: [-24, WALK_EYE_HEIGHT, -260], target: [-24, WALK_EYE_HEIGHT, -252] },
  oraclehub: { position: [-470, WALK_EYE_HEIGHT, -1740], target: [-500, WALK_EYE_HEIGHT, -1740] }
};

// A bounded inspection envelope keeps WASD navigation inside the modeled
// corridor while leaving the authored HAL/ORR/Spice Garden extents reachable.
export const MARATHAHALLI_WALK_BOUNDS = {
  minX: -1000,
  maxX: 1000,
  minZ: -1900,
  maxZ: 520
};

// Coarse, named landmark footprints prevent the person camera from walking
// through the largest authored showrooms. OSM massing remains a visual layer;
// these are navigation guardrails, not a survey-grade collision map.
export const MARATHAHALLI_WALK_OBSTACLES: WalkObstacle[] = [
  { minX: -314, maxX: -258, minZ: -565, maxZ: -505 }, // Innovative Multiplex
  { minX: 33, maxX: 64, minZ: 32, maxZ: 85 },       // Brand Factory / outlet row
  { minX: 29, maxX: 67, minZ: 310, maxZ: 371 },     // Kalamandir / Nalli frontage
  { minX: -58, maxX: -17, minZ: 87, maxZ: 130 },    // Krishna Summit block
  { minX: -980, maxX: -480, minZ: -1900, maxZ: -1580 } // Oracle Tech Hub campus
];

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

export function createWalkView(position: [number, number, number], target: [number, number, number]): CameraView {
  const dx = target[0] - position[0];
  const dy = target[1] - position[1];
  const dz = target[2] - position[2];
  const distance = Math.hypot(dx, dy, dz) || 1;

  return {
    position: [position[0], WALK_EYE_HEIGHT, position[2]],
    target: [
      position[0] + (dx / distance) * WALK_LOOK_DISTANCE,
      WALK_EYE_HEIGHT + (dy / distance) * WALK_LOOK_DISTANCE,
      position[2] + (dz / distance) * WALK_LOOK_DISTANCE
    ]
  };
}

export function getCameraView(preset: CameraPreset, mode: CameraMode): CameraView {
  return mode === 'walk' ? createWalkView(WALK_STARTS[preset].position, WALK_STARTS[preset].target) : BIRD_VIEWS[preset];
}

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

const BIRD_VIEWS: Record<CameraPreset, CameraView> = {
  overview: {
    position: CAMERA_DEFAULT_POSITION,
    target: CAMERA_DEFAULT_TARGET
  },
  underpass: {
    position: [-18, 9, 65],
    target: [0, -4.5, 5]
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
    position: [12, 16, -185],
    target: [-52, 12, -185]
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
    position: [210, 22, 45],
    target: [260, 4, -10]
  },
  crossover: {
    // Deliberately pulled back and above the source-backed massing so the
    // underpass, surface table, ROB and metro remain readable together.
    position: [145, 96, 150],
    target: [8, 5, 18]
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
  multiplex: createOrrWalkAnchor(-175, -215, -26.5),
  kalamandir: { position: [22, 1.7, 332.5], target: [46, 1.7, 332.5] },
  brandfactory: { position: [15, 1.7, 58], target: [48, 1.7, 58] },
  spicegarden: { position: [220, 1.7, 15], target: [260, 1.7, -10] },
  crossover: createOrrWalkAnchor(-38, 5, -26.5)
};

// A bounded inspection envelope keeps WASD navigation inside the modeled
// corridor while leaving the authored HAL/ORR/Spice Garden extents reachable.
export const MARATHAHALLI_WALK_BOUNDS = {
  minX: -430,
  maxX: 470,
  minZ: -390,
  maxZ: 470
};

// Coarse, named landmark footprints prevent the person camera from walking
// through the largest authored showrooms. OSM massing remains a visual layer;
// these are navigation guardrails, not a survey-grade collision map.
export const MARATHAHALLI_WALK_OBSTACLES: WalkObstacle[] = [
  { minX: -75, maxX: -27, minZ: -214, maxZ: -156 }, // Innovative Multiplex
  { minX: 33, maxX: 64, minZ: 32, maxZ: 85 },       // Brand Factory / outlet row
  { minX: 29, maxX: 67, minZ: 310, maxZ: 371 },     // Kalamandir / Nalli frontage
  { minX: -58, maxX: -17, minZ: 87, maxZ: 130 }    // Krishna Summit block
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

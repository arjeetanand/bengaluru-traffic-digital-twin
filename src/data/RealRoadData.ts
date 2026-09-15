import * as THREE from 'three';
import { VARTHUR_VIADUCT_DECK_TOP_Y } from './marathahalliDemo';

// ═════════════════════════════════════════════════════════════════════════════
// REAL-WORLD GEOMETRIC ROAD SPLINES DERIVED FROM MARATHAHALLI_OSM.XML
// Origin: lat 12.956840, lon 77.701176 (Surface crossroads center)
// X = East (+X) / West (-X) in meters
// Z = North (+Z) / South (-Z) in meters
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 1. Outer Ring Road (ORR) Central Highway Corridor (Underpass & Main Carriageway)
 *
 * The OSM extract models the underpass as two separate, one-way three-lane
 * carriageways. Keep both source ways here and derive the navigation
 * centerline from their midpoint. This is the geometry contract shared by
 * the trench, surface service roads, U-turn entries, traffic splines and
 * median-aligned metro — it must not follow just one carriageway.
 *
 * Source ways:
 *   way/376784366 + way/380704971 (north-oriented carriageway)
 *   way/380787519 + way/380787521 + way/380787520 (south-oriented carriageway,
 *   listed in increasing northing order below)
 */
export const ORR_SOURCE_CARRIAGEWAY_WEST: readonly [number, number][] = [
  [-88.6, -283.3],
  [-62.8, -174.6],
  [-57.8, -155.2],
  [-52.9, -138.4],
  [-47.0, -120.2],
  [-36.1, -88.2],
  [-26.1, -57.8],
  [-19.1, -30.9],
  [-14.4, -7.3],
  [-7.0, 32.6],
  [-5.6, 50.7],
  [-3.5, 76.6],
  [-2.1, 108.7],
  [-1.2, 144.2],
  [-2.6, 202.0],
  [-2.1, 229.8],
  [5.3, 307.7]
];

export const ORR_SOURCE_CARRIAGEWAY_EAST: readonly [number, number][] = [
  [-74.8, -285.9],
  [-48.2, -182.6],
  [-43.0, -163.1],
  [-38.7, -146.4],
  [-34.2, -130.3],
  [-28.5, -109.6],
  [-20.7, -86.1],
  [-11.7, -55.2],
  [-0.2, -8.6],
  [5.8, 31.5],
  [8.1, 54.4],
  [10.9, 81.3],
  [12.0, 108.1],
  [12.4, 129.0],
  [11.7, 205.0],
  [13.3, 231.2],
  [21.8, 304.5]
];

function interpolateSourceXAtZ(points: readonly [number, number][], z: number) {
  if (z <= points[0][1]) return points[0][0];
  const last = points[points.length - 1];
  if (z >= last[1]) return last[0];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (z > current[1]) continue;
    const span = current[1] - previous[1];
    const progress = span === 0 ? 0 : (z - previous[1]) / span;
    return previous[0] + (current[0] - previous[0]) * progress;
  }

  return last[0];
}

const ORR_SOURCE_Z_MIN = Math.max(
  ORR_SOURCE_CARRIAGEWAY_WEST[0][1],
  ORR_SOURCE_CARRIAGEWAY_EAST[0][1]
);
const ORR_SOURCE_Z_MAX = Math.min(
  ORR_SOURCE_CARRIAGEWAY_WEST[ORR_SOURCE_CARRIAGEWAY_WEST.length - 1][1],
  ORR_SOURCE_CARRIAGEWAY_EAST[ORR_SOURCE_CARRIAGEWAY_EAST.length - 1][1]
);
const ORR_SOURCE_SAMPLE_ZS = [...new Set(
  [...ORR_SOURCE_CARRIAGEWAY_WEST, ...ORR_SOURCE_CARRIAGEWAY_EAST]
    .map(([, z]) => z)
    .filter((z) => z >= ORR_SOURCE_Z_MIN && z <= ORR_SOURCE_Z_MAX)
)].sort((a, b) => a - b);

export const ORR_CENTERLINE_PTS: [number, number][] = ORR_SOURCE_SAMPLE_ZS.map((z) => [
  (interpolateSourceXAtZ(ORR_SOURCE_CARRIAGEWAY_WEST, z) +
    interpolateSourceXAtZ(ORR_SOURCE_CARRIAGEWAY_EAST, z)) / 2,
  z
]);

export interface RoadFrame {
  x: number;
  z: number;
  tangentX: number;
  tangentZ: number;
}

// The ORR is the canonical north/south reference for the corridor. Keeping a
// sampled frame beside the authored road ribbon lets footpaths, trees, and
// pedestrians share the same curved alignment instead of drifting back to a
// straight x = constant approximation.
const ORR_CURVE = new THREE.CatmullRomCurve3(
  ORR_CENTERLINE_PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'catmullrom',
  0.25
);
const ORR_FRAME_SAMPLES = ORR_CURVE.getPoints(640);

export function getOrrRoadFrameAtZ(zCoord: number): RoadFrame {
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  for (let index = 0; index < ORR_FRAME_SAMPLES.length; index += 1) {
    const distance = Math.abs(ORR_FRAME_SAMPLES[index].z - zCoord);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  const current = ORR_FRAME_SAMPLES[nearestIndex];
  const previous = ORR_FRAME_SAMPLES[Math.max(0, nearestIndex - 1)];
  const next = ORR_FRAME_SAMPLES[Math.min(ORR_FRAME_SAMPLES.length - 1, nearestIndex + 1)];
  const tangent = new THREE.Vector2(next.x - previous.x, next.z - previous.z).normalize();

  return {
    x: current.x,
    z: current.z,
    tangentX: tangent.x,
    tangentZ: tangent.y
  };
}

export function getOrrOffsetPointAtZ(zCoord: number, lateralOffset: number): [number, number] {
  const frame = getOrrRoadFrameAtZ(zCoord);
  const normalX = -frame.tangentZ;
  const normalZ = frame.tangentX;
  return [
    frame.x + normalX * lateralOffset,
    frame.z + normalZ * lateralOffset
  ];
}

// ORR_CENTERLINE_PTS is already the midpoint between the two source
// carriageways, so a zero lateral offset is the physical ORR median. Keeping
// this named contract makes the metro alignment explicit at call sites.
export const ORR_MEDIAN_LATERAL_OFFSET = 0;

// The source Varthur Road bridge starts just east of the signal and returns
// to grade before Spice Garden. This elevation profile is shared by the
// surface ribbon, median marking and any modelled road traffic on the upper
// deck; the detailed deck itself is rendered by FlyoverBridge.
export const VARTHUR_VIADUCT_RAMP_START_X = 285;
export const VARTHUR_VIADUCT_START_X = 338;
export const VARTHUR_VIADUCT_END_X = 414;
export const VARTHUR_VIADUCT_RAMP_END_X = 470;

export function getVarthurRoadElevation(xCoord: number): number {
  if (xCoord <= VARTHUR_VIADUCT_RAMP_START_X || xCoord >= VARTHUR_VIADUCT_RAMP_END_X) {
    return 0.06;
  }
  if (xCoord < VARTHUR_VIADUCT_START_X) {
    const progress = (xCoord - VARTHUR_VIADUCT_RAMP_START_X)
      / (VARTHUR_VIADUCT_START_X - VARTHUR_VIADUCT_RAMP_START_X);
    return 0.06 + (VARTHUR_VIADUCT_DECK_TOP_Y - 0.06) * progress;
  }
  if (xCoord <= VARTHUR_VIADUCT_END_X) return VARTHUR_VIADUCT_DECK_TOP_Y;
  const progress = (VARTHUR_VIADUCT_RAMP_END_X - xCoord)
    / (VARTHUR_VIADUCT_RAMP_END_X - VARTHUR_VIADUCT_END_X);
  return 0.06 + (VARTHUR_VIADUCT_DECK_TOP_Y - 0.06) * progress;
}

export function getOrrMedianPointAtZ(zCoord: number): [number, number] {
  return getOrrOffsetPointAtZ(zCoord, ORR_MEDIAN_LATERAL_OFFSET);
}

// One shared elevation contract keeps the rendered trench, portals and
// animated underpass traffic on the same pavement surface.
export const ORR_UNDERPASS_DEPTH = 6.2;
export const ORR_UNDERPASS_PATH_START_Z = -150;
export const ORR_UNDERPASS_PATH_END_Z = 150;

export function getOrrUnderpassElevation(zCoord: number): number {
  const absZ = Math.abs(zCoord);
  if (absZ <= 35) return -ORR_UNDERPASS_DEPTH;
  if (absZ >= ORR_UNDERPASS_PATH_END_Z) return 0.05;
  const progress = (absZ - 35) / (ORR_UNDERPASS_PATH_END_Z - 35);
  return -ORR_UNDERPASS_DEPTH * (1 - progress) + 0.05 * progress;
}

/**
 * Build a ribbon section offset from the curved ORR centerline. The caller's
 * lateral sign follows the road frame: positive is west of the northbound
 * tangent and negative is east.
 */
export function createOrrOffsetRibbonGeometry(
  startZ: number,
  endZ: number,
  lateralOffset: number,
  width: number,
  surfaceY = 0.1,
  sampleSteps = 36
): THREE.BufferGeometry {
  const pointCount = Math.max(3, Math.min(12, Math.ceil(Math.abs(endZ - startZ) / 22) + 1));
  const controlPoints: [number, number][] = [];

  for (let index = 0; index < pointCount; index += 1) {
    const progress = pointCount === 1 ? 0 : index / (pointCount - 1);
    const z = startZ + (endZ - startZ) * progress;
    controlPoints.push(getOrrOffsetPointAtZ(z, lateralOffset));
  }

  const geometry = createRoadRibbonGeometry(
    controlPoints,
    width,
    () => surfaceY,
    sampleSteps
  );

  return geometry;
}

/**
 * 2. East-West Arterial Corridor:
 * HAL Old Airport Road (West) ──► Surface Junction ──► Varthur Road viaduct ──► Spice Garden (East)
 * Slopes from North-West to South-East crossing the ORR at an angle.
 */
export const HAL_TO_SPICEGARDEN_PTS: [number, number][] = [
  [-455.4, -18.4],
  [-411.7, -10.7],
  [-354.5, -0.9],
  [-337.5, 2.0],
  [-293.1, 10.0],
  [-260.2, 16.7],
  [-213.9, 22.2],
  [-151.7, 18.6],
  [-120.1, 15.8],
  [-90.3, 13.1],
  [-50.8, 10.4],
  [-31.8, 8.8],
  [-16.2, 7.8],
  [0.0, 10.0],
  [12.8, 14.7],
  [31.7, 13.3],
  [49.9, 13.0],
  [84.1, 10.7],
  [150.1, 5.8],
  [175.0, 3.0],
  [195.7, 0.9],
  [228.2, -1.3],
  [260.0, -4.5],
  [285.0, -6.0],
  [338.3, -6.9],
  [370.0, -10.0],
  [414.5, -12.2],
  [470.0, -15.0]
];

// Source way/648496925 — Spice Garden Road — from the widened OSM snapshot.
// This is kept separate from the authored HAL/Varthur arterial spline because
// the local road turns north-east through the actual Spice Garden frontage.
// It is used for source-aligned planting and inspection composition only; it
// does not replace the compiled OSM road geometry or claim a surveyed tree row.
export const SPICE_GARDEN_ROAD_SOURCE_PTS: readonly [number, number][] = [
  [850.6, -25.7],
  [849.3, -19.6],
  [839.8, 24.9],
  [832.8, 57.5],
  [825.7, 99.9],
  [813.5, 158.5],
  [801.2, 217.0],
  [796.2, 233.4],
  [793.0, 247.3],
  [788.4, 268.8],
  [780.4, 311.7],
  [778.3, 323.5]
];

const SPICE_GARDEN_ROAD_CURVE = new THREE.CatmullRomCurve3(
  SPICE_GARDEN_ROAD_SOURCE_PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  'centripetal',
  0.25
);
const SPICE_GARDEN_ROAD_LENGTH = SPICE_GARDEN_ROAD_CURVE.getLength();

export function getSpiceGardenRoadFrameAtDistance(distance: number): RoadFrame {
  const progress = Math.max(0, Math.min(1, distance / SPICE_GARDEN_ROAD_LENGTH));
  const point = SPICE_GARDEN_ROAD_CURVE.getPointAt(progress);
  const tangent = SPICE_GARDEN_ROAD_CURVE.getTangentAt(progress).setY(0).normalize();
  return {
    x: point.x,
    z: point.z,
    tangentX: tangent.x,
    tangentZ: tangent.z
  };
}

export function getSpiceGardenOffsetPointAtDistance(
  distance: number,
  lateralOffset: number
): [number, number] {
  const frame = getSpiceGardenRoadFrameAtDistance(distance);
  return [
    frame.x - frame.tangentZ * lateralOffset,
    frame.z + frame.tangentX * lateralOffset
  ];
}

/**
 * Procedural ribbon mesh builder that extrudes an asphalt road strip along any 2D/3D spline.
 * Creates smooth quads with normals and UV coordinates for realistic asphalt textures and markings.
 */
export function createRoadRibbonGeometry(
  controlPoints: [number, number][],
  width: number,
  elevationFn: (t: number, x: number, z: number) => number = () => 0.08,
  sampleSteps = 120,
  curveType: 'catmullrom' | 'centripetal' | 'chordal' = 'catmullrom'
): THREE.BufferGeometry {
  // Build 3D vector points for CatmullRom curve interpolation
  const v3Points = controlPoints.map((p) => new THREE.Vector3(p[0], 0, p[1]));
  const curve = new THREE.CatmullRomCurve3(v3Points, false, curveType, 0.25);

  const halfWidth = width / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const points = curve.getPoints(sampleSteps);
  let accumulatedDistance = 0;

  for (let i = 0; i <= sampleSteps; i++) {
    const t = i / sampleSteps;
    const pt = points[i];
    const tangent = curve.getTangent(t).normalize();

    // Normal vector perpendicular to tangent on XZ plane
    const normX = -tangent.z;
    const normZ = tangent.x;

    if (i > 0) {
      accumulatedDistance += points[i].distanceTo(points[i - 1]);
    }

    const y = elevationFn(t, pt.x, pt.z);

    // Left vertex (-normal * halfWidth)
    const leftX = pt.x - normX * halfWidth;
    const leftZ = pt.z - normZ * halfWidth;
    positions.push(leftX, y, leftZ);
    normals.push(0, 1, 0);
    uvs.push(0, accumulatedDistance * 0.1);

    // Right vertex (+normal * halfWidth)
    const rightX = pt.x + normX * halfWidth;
    const rightZ = pt.z + normZ * halfWidth;
    positions.push(rightX, y, rightZ);
    normals.push(0, 1, 0);
    uvs.push(1, accumulatedDistance * 0.1);

    if (i < sampleSteps) {
      const base = i * 2;
      // Two triangles forming a quad
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);

  return geom;
}

/**
 * Creates dashed / solid lane divider markings along a curve with customizable lateral offset.
 */
export function createCurveLineGeometry(
  controlPoints: [number, number][],
  lateralOffset: number,
  elevationFn: (t: number, x: number, z: number) => number = () => 0.1,
  lineWidth = 0.25,
  sampleSteps = 120,
  curveType: 'catmullrom' | 'centripetal' | 'chordal' = 'catmullrom'
): THREE.BufferGeometry {
  const v3Points = controlPoints.map((p) => new THREE.Vector3(p[0], 0, p[1]));
  const curve = new THREE.CatmullRomCurve3(v3Points, false, curveType, 0.25);

  const halfLineWidth = lineWidth / 2;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const points = curve.getPoints(sampleSteps);
  let dist = 0;

  for (let i = 0; i <= sampleSteps; i++) {
    const t = i / sampleSteps;
    const pt = points[i];
    const tangent = curve.getTangent(t).normalize();

    const normX = -tangent.z;
    const normZ = tangent.x;

    if (i > 0) dist += points[i].distanceTo(points[i - 1]);

    const y = elevationFn(t, pt.x, pt.z);

    const centerX = pt.x + normX * lateralOffset;
    const centerZ = pt.z + normZ * lateralOffset;

    positions.push(centerX - normX * halfLineWidth, y, centerZ - normZ * halfLineWidth);
    normals.push(0, 1, 0);
    uvs.push(0, dist * 0.2);

    positions.push(centerX + normX * halfLineWidth, y, centerZ + normZ * halfLineWidth);
    normals.push(0, 1, 0);
    uvs.push(1, dist * 0.2);

    if (i < sampleSteps) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);

  return geom;
}

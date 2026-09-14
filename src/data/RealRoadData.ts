import * as THREE from 'three';

// ═════════════════════════════════════════════════════════════════════════════
// REAL-WORLD GEOMETRIC ROAD SPLINES DERIVED FROM MARATHAHALLI_OSM.XML
// Origin: lat 12.956840, lon 77.701176 (Surface crossroads center)
// X = East (+X) / West (-X) in meters
// Z = North (+Z) / South (-Z) in meters
// ═════════════════════════════════════════════════════════════════════════════

/**
 * 1. Outer Ring Road (ORR) Central Highway Corridor (Underpass & Main Carriageway)
 * Real trajectory exhibits a natural 15-degree diagonal S-curve from SW to NE.
 */
export const ORR_CENTERLINE_PTS: [number, number][] = [
  [-111.9, -381.3],
  [-94.6, -317.1],
  [-88.6, -285.2],
  [-62.8, -175.7],
  [-57.8, -156.2],
  [-52.9, -139.3],
  [-47.1, -121.0],
  [-36.1, -88.7],
  [-26.1, -58.2],
  [-19.1, -31.1],
  [-14.4, -7.3],
  [-7.0, 18.0],
  [-7.0, 32.9],
  [-5.6, 51.1],
  [-3.5, 77.1],
  [-2.1, 109.4],
  [-1.2, 145.2],
  [-2.6, 203.4],
  [-2.1, 231.3],
  [5.3, 309.7],
  [10.5, 348.4],
  [14.9, 378.9],
  [24.2, 421.4],
  [35.0, 470.0]
];

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

// The source snapshot contains separate ORR carriageways. The modeled metro
// follows their local median, not the western carriageway centerline used by
// the underpass spline. Calibrated from the paired source carriageways near
// the signal: roughly 6.3m east of the canonical reference line.
export const ORR_MEDIAN_LATERAL_OFFSET = -6.3;

export function getOrrMedianPointAtZ(zCoord: number): [number, number] {
  return getOrrOffsetPointAtZ(zCoord, ORR_MEDIAN_LATERAL_OFFSET);
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
 * HAL Old Airport Road (West) ──► Surface Junction ──► Marathahalli ROB Bridge ──► Spice Garden (East)
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

/**
 * Procedural ribbon mesh builder that extrudes an asphalt road strip along any 2D/3D spline.
 * Creates smooth quads with normals and UV coordinates for realistic asphalt textures and markings.
 */
export function createRoadRibbonGeometry(
  controlPoints: [number, number][],
  width: number,
  elevationFn: (t: number, x: number, z: number) => number = () => 0.08,
  sampleSteps = 120
): THREE.BufferGeometry {
  // Build 3D vector points for CatmullRom curve interpolation
  const v3Points = controlPoints.map((p) => new THREE.Vector3(p[0], 0, p[1]));
  const curve = new THREE.CatmullRomCurve3(v3Points, false, 'catmullrom', 0.25);

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
  sampleSteps = 120
): THREE.BufferGeometry {
  const v3Points = controlPoints.map((p) => new THREE.Vector3(p[0], 0, p[1]));
  const curve = new THREE.CatmullRomCurve3(v3Points, false, 'catmullrom', 0.25);

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

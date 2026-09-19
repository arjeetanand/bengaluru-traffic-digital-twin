import { readFile } from 'node:fs/promises';
import path from 'node:path';

const dataset = JSON.parse(await readFile(
  path.join(process.cwd(), 'public', 'data', 'marathahalli-demo.json'),
  'utf8'
));

const CLEARANCE_MARGIN_METRES = 0.8;
const CELL_SIZE_METRES = 80;
const QUERY_PADDING_METRES = 96;
const MAX_ADJUSTMENT_PASSES = 4;

function roadRibbonWidth(feature) {
  const lanes = Number(feature.tags?.lanes);
  if (Number.isFinite(lanes) && lanes > 0) return Math.min(18, Math.max(3.2, lanes * 3.1));
  if (['motorway', 'trunk', 'primary'].includes(feature.tags?.highway || '')) return 11;
  if (['secondary', 'tertiary'].includes(feature.tags?.highway || '')) return 8;
  if (feature.tags?.highway === 'service') return 4.2;
  return 5.4;
}

function isGradeRoad(feature) {
  const layer = Number(feature.tags?.layer);
  return feature.tags?.bridge !== 'yes'
    && feature.tags?.bridge !== 'viaduct'
    && feature.tags?.man_made !== 'bridge'
    && feature.tags?.tunnel !== 'yes'
    && !/underpass/i.test(feature.name || feature.tags?.name || '')
    && !(Number.isFinite(layer) && layer > 0);
}

function stableJitter(id) {
  let hash = 2166136261;
  for (const character of id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

function openPolygon(feature) {
  const points = feature.geometry.map(([x, z]) => [x, z]);
  if (points.length > 1) {
    const first = points[0];
    const last = points.at(-1);
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.001) points.pop();
  }
  return points;
}

function bounds(points) {
  return points.reduce((result, [x, z]) => ({
    minX: Math.min(result.minX, x),
    maxX: Math.max(result.maxX, x),
    minZ: Math.min(result.minZ, z),
    maxZ: Math.max(result.maxZ, z)
  }), {
    minX: Infinity,
    maxX: -Infinity,
    minZ: Infinity,
    maxZ: -Infinity
  });
}

function closestPoint(point, start, end) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  const progress = lengthSquared < 0.01
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) / lengthSquared));
  return [start[0] + dx * progress, start[1] + dz * progress];
}

function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSegment(a, b, point) {
  return Math.abs(orientation(a, b, point)) < 1e-7
    && point[0] >= Math.min(a[0], b[0]) - 1e-7
    && point[0] <= Math.max(a[0], b[0]) + 1e-7
    && point[1] >= Math.min(a[1], b[1]) - 1e-7
    && point[1] <= Math.max(a[1], b[1]) + 1e-7;
}

function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  return (Math.abs(abC) < 1e-7 && onSegment(a, b, c))
    || (Math.abs(abD) < 1e-7 && onSegment(a, b, d))
    || (Math.abs(cdA) < 1e-7 && onSegment(c, d, a))
    || (Math.abs(cdB) < 1e-7 && onSegment(c, d, b))
    || ((abC > 0) !== (abD > 0) && (cdA > 0) !== (cdB > 0));
}

function pointInside(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    if (onSegment(previousPoint, currentPoint, point)) return true;
    const crossesRay = (currentPoint[1] > point[1]) !== (previousPoint[1] > point[1]);
    if (!crossesRay) continue;
    const intersectionX = (previousPoint[0] - currentPoint[0]) * (point[1] - currentPoint[1])
      / (previousPoint[1] - currentPoint[1]) + currentPoint[0];
    if (point[0] < intersectionX) inside = !inside;
  }
  return inside;
}

function centroid(points) {
  const [sumX, sumZ] = points.reduce(([x, z], [pointX, pointZ]) => [x + pointX, z + pointZ], [0, 0]);
  return [sumX / points.length, sumZ / points.length];
}

function segmentPairContact(buildingStart, buildingEnd, roadStart, roadEnd, polygon) {
  if (pointInside(roadStart, polygon) || pointInside(roadEnd, polygon)) {
    const roadPoint = pointInside(roadStart, polygon) ? roadStart : roadEnd;
    return { buildingPoint: centroid(polygon), roadPoint, distance: 0 };
  }
  if (segmentsIntersect(buildingStart, buildingEnd, roadStart, roadEnd)) {
    const point = closestPoint(buildingStart, roadStart, roadEnd);
    return { buildingPoint: centroid(polygon), roadPoint: point, distance: 0 };
  }
  const options = [
    { buildingPoint: buildingStart, roadPoint: closestPoint(buildingStart, roadStart, roadEnd) },
    { buildingPoint: buildingEnd, roadPoint: closestPoint(buildingEnd, roadStart, roadEnd) },
    { buildingPoint: closestPoint(roadStart, buildingStart, buildingEnd), roadPoint: roadStart },
    { buildingPoint: closestPoint(roadEnd, buildingStart, buildingEnd), roadPoint: roadEnd }
  ];
  return options.reduce((best, option) => {
    const distance = Math.hypot(option.buildingPoint[0] - option.roadPoint[0], option.buildingPoint[1] - option.roadPoint[1]);
    return distance < best.distance ? { ...option, distance } : best;
  }, { ...options[0], distance: Infinity });
}

function footprintRoadContact(points, segment) {
  let nearest = null;
  for (let index = 0; index < points.length; index += 1) {
    const contact = segmentPairContact(
      points[index],
      points[(index + 1) % points.length],
      segment.start,
      segment.end,
      points
    );
    if (!nearest || contact.distance < nearest.distance) nearest = contact;
  }
  return { ...nearest, clearance: nearest.distance - segment.halfWidth };
}

function makeRoadIndex(roads) {
  const cells = new Map();
  let roadCount = 0;
  let segmentCount = 0;
  let excluded = 0;
  for (const road of roads) {
    if (!isGradeRoad(road)) {
      excluded += 1;
      continue;
    }
    roadCount += 1;
    const halfWidth = roadRibbonWidth(road) / 2;
    for (let index = 1; index < road.geometry.length; index += 1) {
      const start = road.geometry[index - 1];
      const end = road.geometry[index];
      if (Math.hypot(end[0] - start[0], end[1] - start[1]) < 0.2) continue;
      const padding = halfWidth + CLEARANCE_MARGIN_METRES;
      const minX = Math.floor((Math.min(start[0], end[0]) - padding) / CELL_SIZE_METRES);
      const maxX = Math.floor((Math.max(start[0], end[0]) + padding) / CELL_SIZE_METRES);
      const minZ = Math.floor((Math.min(start[1], end[1]) - padding) / CELL_SIZE_METRES);
      const maxZ = Math.floor((Math.max(start[1], end[1]) + padding) / CELL_SIZE_METRES);
      const segment = { start, end, halfWidth, roadId: road.id };
      segmentCount += 1;
      for (let cellX = minX; cellX <= maxX; cellX += 1) {
        for (let cellZ = minZ; cellZ <= maxZ; cellZ += 1) {
          const key = `${cellX}:${cellZ}`;
          const bucket = cells.get(key) || [];
          bucket.push(segment);
          cells.set(key, bucket);
        }
      }
    }
  }
  return { cells, roadCount, segmentCount, excluded };
}

function candidateSegments(points, index) {
  const footprintBounds = bounds(points);
  const segments = new Set();
  const minX = Math.floor((footprintBounds.minX - QUERY_PADDING_METRES) / CELL_SIZE_METRES);
  const maxX = Math.floor((footprintBounds.maxX + QUERY_PADDING_METRES) / CELL_SIZE_METRES);
  const minZ = Math.floor((footprintBounds.minZ - QUERY_PADDING_METRES) / CELL_SIZE_METRES);
  const maxZ = Math.floor((footprintBounds.maxZ + QUERY_PADDING_METRES) / CELL_SIZE_METRES);
  for (let cellX = minX; cellX <= maxX; cellX += 1) {
    for (let cellZ = minZ; cellZ <= maxZ; cellZ += 1) {
      for (const segment of index.cells.get(`${cellX}:${cellZ}`) || []) segments.add(segment);
    }
  }
  return [...segments];
}

function adjustmentDirection(feature, contact) {
  let dx = contact.buildingPoint[0] - contact.roadPoint[0];
  let dz = contact.buildingPoint[1] - contact.roadPoint[1];
  let length = Math.hypot(dx, dz);
  if (length < 0.001) {
    const roadLength = Math.hypot(contact.segment.end[0] - contact.segment.start[0], contact.segment.end[1] - contact.segment.start[1]);
    const normalX = roadLength >= 0.001 ? -(contact.segment.end[1] - contact.segment.start[1]) / roadLength : 1;
    const normalZ = roadLength >= 0.001 ? (contact.segment.end[0] - contact.segment.start[0]) / roadLength : 0;
    const sign = stableJitter(feature.id) >= 0.5 ? 1 : -1;
    dx = normalX * sign;
    dz = normalZ * sign;
    length = 1;
  }
  return [dx / length, dz / length];
}

function minimumClearance(points, segments) {
  return Math.min(...segments.map((segment) => footprintRoadContact(points, segment).clearance));
}

function translated(points, direction, distance) {
  return points.map(([x, z]) => [x + direction[0] * distance, z + direction[1] * distance]);
}

function scaled(points, scale) {
  const center = centroid(points);
  return points.map(([x, z]) => [
    center[0] + (x - center[0]) * scale,
    center[1] + (z - center[1]) * scale
  ]);
}

function fallbackClearanceSolution(feature, rawPoints, segments) {
  const diagonal = Math.SQRT1_2;
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [diagonal, diagonal], [diagonal, -diagonal], [-diagonal, diagonal], [-diagonal, -diagonal]
  ];
  for (const segment of segments) {
    const contact = footprintRoadContact(rawPoints, segment);
    directions.push(adjustmentDirection(feature, { ...contact, segment }));
  }

  const scales = [1, 0.88, 0.72, 0.56, 0.42, 0.3];
  const distances = [1, 2, 4, 8, 12, 18, 26, 36, 50, 68];
  let best = null;
  for (const scale of scales) {
    const base = scaled(rawPoints, scale);
    const baseClearance = minimumClearance(base, segments);
    if (baseClearance >= CLEARANCE_MARGIN_METRES) return base;
    for (const direction of directions) {
      for (const distance of distances) {
        const candidate = translated(base, direction, distance);
        const clearance = minimumClearance(candidate, segments);
        if (clearance < CLEARANCE_MARGIN_METRES) continue;
        const cost = distance + (1 - scale) * 18;
        if (!best || cost < best.cost) best = { points: candidate, cost };
      }
    }
    if (best) return best.points;
  }
  return null;
}

function resolveBuilding(feature, index) {
  const rawPoints = openPolygon(feature);
  const segments = candidateSegments(rawPoints, index);
  if (rawPoints.length < 3 || !segments.length) {
    return { status: 'raw', rawMinimum: Infinity, renderedMinimum: Infinity, roadIds: [] };
  }
  const rawContacts = segments.map((segment) => ({ segment, contact: footprintRoadContact(rawPoints, segment) }));
  const rawMinimum = Math.min(...rawContacts.map(({ segment, contact }) => contact.clearance));
  const points = rawPoints.map(([x, z]) => [x, z]);
  const roadIds = new Set();

  for (let pass = 0; pass < MAX_ADJUSTMENT_PASSES; pass += 1) {
    const contacts = segments
      .map((segment) => ({ segment, contact: footprintRoadContact(points, segment) }))
      .sort((left, right) => left.contact.clearance - right.contact.clearance || left.segment.roadId.localeCompare(right.segment.roadId));
    const closest = contacts[0];
    if (!closest || closest.contact.clearance >= CLEARANCE_MARGIN_METRES) break;
    roadIds.add(closest.segment.roadId);
    const direction = adjustmentDirection(feature, { ...closest.contact, segment: closest.segment });
    const minimumProjection = Math.min(...points.map(([x, z]) => (
      (x - closest.contact.roadPoint[0]) * direction[0]
      + (z - closest.contact.roadPoint[1]) * direction[1]
    )));
    const shift = Math.max(
      0.12,
      CLEARANCE_MARGIN_METRES - closest.contact.clearance,
      closest.segment.halfWidth + CLEARANCE_MARGIN_METRES - minimumProjection
    );
    for (const point of points) {
      point[0] += direction[0] * shift;
      point[1] += direction[1] * shift;
    }
  }

  let renderedMinimum = minimumClearance(points, segments);
  if (renderedMinimum < CLEARANCE_MARGIN_METRES) {
    const fallback = fallbackClearanceSolution(feature, rawPoints, segments);
    if (fallback) {
      points.splice(0, points.length, ...fallback);
      renderedMinimum = minimumClearance(points, segments);
    }
  }
  return {
    status: renderedMinimum >= CLEARANCE_MARGIN_METRES ? (rawMinimum < CLEARANCE_MARGIN_METRES ? 'adjusted' : 'raw') : 'suppressed',
    rawMinimum,
    renderedMinimum,
    roadIds: [...roadIds]
  };
}

const roadIndex = makeRoadIndex(dataset.roads);
const results = dataset.buildings.map((feature) => ({ feature, result: resolveBuilding(feature, roadIndex) }));
const conflictResults = results.filter(({ result }) => result.rawMinimum < CLEARANCE_MARGIN_METRES);
const adjustedResults = results.filter(({ result }) => result.status === 'adjusted');
const suppressedResults = results.filter(({ result }) => result.status === 'suppressed');
const kalamandir = results.find(({ feature }) => feature.id === 'way/223045596');

if (!kalamandir) throw new Error('Kalamandir source building way/223045596 is missing');
if (kalamandir.result.rawMinimum < CLEARANCE_MARGIN_METRES) {
  throw new Error(`Kalamandir source footprint conflicts with a grade road: ${kalamandir.result.rawMinimum.toFixed(2)}m`);
}
if (suppressedResults.length > 0) {
  const sample = suppressedResults.slice(0, 12).map(({ feature, result }) => ({
    id: feature.id,
    name: feature.name || feature.tags?.name || '',
    rawMinimum: Number(result.rawMinimum.toFixed(2)),
    renderedMinimum: Number(result.renderedMinimum.toFixed(2)),
    roads: result.roadIds
  }));
  throw new Error(`${suppressedResults.length} source building display footprints remain inside grade-road envelopes: ${JSON.stringify(sample)}`);
}

const minimumRenderedClearance = Math.min(...results.map(({ result }) => result.renderedMinimum));
console.log('Building-to-road clearance validation passed');
console.log(JSON.stringify({
  sourceBuildings: dataset.buildings.length,
  sourceRoads: dataset.roads.length,
  groundRoads: roadIndex.roadCount,
  groundRoadSegments: roadIndex.segmentCount,
  excludedElevatedOrTunnelRoads: roadIndex.excluded,
  rawBuildingConflicts: conflictResults.length,
  adjustedDisplayFootprints: adjustedResults.length,
  suppressedDisplayFootprints: suppressedResults.length,
  minimumRenderedClearanceMetres: Number(minimumRenderedClearance.toFixed(2)),
  clearanceMarginMetres: CLEARANCE_MARGIN_METRES,
  kalamandir: {
    sourceId: kalamandir.feature.id,
    rawMinimumClearanceMetres: Number(kalamandir.result.rawMinimum.toFixed(2)),
    status: kalamandir.result.status
  },
  sourceGeometryPreserved: true
}, null, 2));

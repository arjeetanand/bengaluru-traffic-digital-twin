import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';

const root = process.cwd();
const datasetPath = path.join(root, 'public', 'data', 'marathahalli-demo.json');
const laneNetworkPath = path.join(root, 'src', 'data', 'marathahalliLaneNetwork.ts');
const navigationPath = path.join(root, 'src', 'data', 'marathahalliNavigation.ts');
const cameraControllerPath = path.join(root, 'src', 'components', 'canvas', 'CameraController.tsx');

const RELATION_ID = 'relation/18922642';
const RELATION_WAY_SEQUENCE = [
  'way/399000523',
  'way/1288842277',
  'way/426988256'
];
const SOURCE_JOIN_TOLERANCE_METRES = 1.5;
const WALK_ROUTE_JOIN_TOLERANCE_METRES = 4.5;
const CURVE_SAMPLE_COUNT = 2001;
const MAX_SOURCE_CENTERLINE_CLEARANCE_METRES = 2;
const VEHICLE_LANE_OFFSETS = [-0.72, 0.72];
const HERO_CAR_WIDTH_METRES = 1.8;
const HERO_CAR_SCALES = { overview: 0.72, walk: 0.54 };
const WALK_EYE_HEIGHT = 1.7;
const WALK_LOOK_DISTANCE = 8;
const VARTHUR_VIADUCT_DECK_TOP_Y = 8;
const VARTHUR_WALK_SLAB_OFFSET_Y = 0.16;
const MARATHAHALLI_SKYWALK_DECK_TOP_Y = 7.55;
const CROSSOVER_FOOTWAY_CHAIN = [
  'way/1284676223',
  'way/1284676222',
  'way/1284676224',
  'way/1086238612'
];

const errors = [];
const warnings = [];

const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const round = (value, digits = 3) => Number(value.toFixed(digits));
const roundPoint = (point) => point.map((value) => round(value));
const finite = (value) => Number.isFinite(value);

function parseNumericPointExpression(expression, label) {
  const values = expression.split(',').map((value) => Number(value.trim()));
  if (values.length < 3 || !finite(values[0]) || !finite(values[2])) {
    fail(`${label} must contain numeric X/Z coordinates`);
    return [0, 0];
  }
  return [values[0], values[2]];
}

function parseReplayPoints(source) {
  const start = source.indexOf('const SOURCE_UTURN_REPLAY_POINTS');
  const end = source.indexOf('];', start);
  if (start < 0 || end < 0) {
    fail('SOURCE_UTURN_REPLAY_POINTS could not be located');
    return [];
  }

  const block = source.slice(start, end);
  return [...block.matchAll(/sourceRoadPoint\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/g)]
    .map((match) => [Number(match[1]), 0.12, Number(match[2])]);
}

function parseConnectorBlock(source, label, start, end) {
  const block = source.slice(start, end);
  const idsMatch = block.match(/sourceWayIds:\s*\[([\s\S]*?)\]/);
  const stopMatch = block.match(/stopT:\s*([\d.]+)/);
  if (!idsMatch || !stopMatch) {
    fail(`${label} connector sourceWayIds/stopT could not be parsed`);
    return { sourceWayIds: [], stopT: Number.NaN };
  }

  return {
    sourceWayIds: [...idsMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]),
    stopT: Number(stopMatch[1])
  };
}

function parseConnectors(source) {
  const objectStart = source.indexOf('export const U_TURN_CONNECTORS');
  // The exported type annotation also contains `north`/`south`; anchor on
  // the object-property form so the parser cannot accidentally read the
  // north block twice.
  const northStart = source.indexOf('  north: {', objectStart);
  const southStart = source.indexOf('  south: {', northStart);
  const objectEnd = source.indexOf('\n};', southStart);
  const northEnd = source.indexOf('\n  },\n  south:', northStart);
  if (objectStart < 0 || northStart < 0 || southStart < 0 || northEnd < 0 || objectEnd < 0) {
    fail('U_TURN_CONNECTORS object could not be parsed');
    return { north: { sourceWayIds: [], stopT: Number.NaN }, south: { sourceWayIds: [], stopT: Number.NaN } };
  }

  return {
    north: parseConnectorBlock(source, 'north', northStart, northEnd),
    south: parseConnectorBlock(source, 'south', southStart, objectEnd)
  };
}

function parseCrossoverCamera(section, label) {
  const marker = section.indexOf('crossover:');
  const end = section.indexOf('\n  },', marker);
  if (marker < 0 || end < 0) {
    fail(`${label} crossover camera block could not be parsed`);
    return { position: [0, 0], target: [0, 0] };
  }

  const block = section.slice(marker, end);
  const positionMatch = block.match(/position:\s*\[([^\]]+)\]/s);
  const targetMatch = block.match(/target:\s*\[([^\]]+)\]/s);
  if (!positionMatch || !targetMatch) {
    fail(`${label} crossover camera position/target could not be parsed`);
    return { position: [0, 0], target: [0, 0] };
  }

  return {
    position: parseNumericPointExpression(positionMatch[1], `${label}.position`),
    target: parseNumericPointExpression(targetMatch[1], `${label}.target`)
  };
}

function distanceBetween(left, right) {
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
}

function projectToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  const progress = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) / lengthSquared));
  const projected = [start[0] + dx * progress, start[1] + dz * progress];
  return {
    distance: distanceBetween(point, projected),
    point: projected,
    progress
  };
}

function nearestFeature(point, features) {
  let nearest = null;
  for (const feature of features) {
    if (!Array.isArray(feature.geometry) || feature.geometry.length < 2) continue;
    for (let index = 1; index < feature.geometry.length; index += 1) {
      const projection = projectToSegment(point, feature.geometry[index - 1], feature.geometry[index]);
      if (!nearest || projection.distance < nearest.distance - 1e-9) {
        nearest = {
          ...projection,
          feature,
          segmentIndex: index
        };
      }
    }
  }
  return nearest;
}

function nearestRoute(point, routes) {
  let nearest = null;
  for (const route of routes) {
    for (let index = 1; index < route.points.length; index += 1) {
      const projection = projectToSegment(point, route.points[index - 1], route.points[index]);
      if (!nearest || projection.distance < nearest.distance - 1e-9) {
        nearest = {
          ...projection,
          route,
          segmentIndex: index
        };
      }
    }
  }
  return nearest;
}

function roadRibbonWidth(feature) {
  const lanes = Number(feature.tags?.lanes);
  if (finite(lanes) && lanes > 0) return Math.min(18, Math.max(3.2, lanes * 3.1));
  if (['motorway', 'trunk', 'primary'].includes(feature.tags?.highway || '')) return 11;
  if (['secondary', 'tertiary'].includes(feature.tags?.highway || '')) return 8;
  if (feature.tags?.highway === 'service') return 4.2;
  return 5.4;
}

function sourceFootwayWidth(feature) {
  const taggedWidth = Number.parseFloat(feature.tags?.width || '');
  if (finite(taggedWidth) && taggedWidth >= 1) return Math.min(8, taggedWidth);
  return feature.tags?.footway === 'crossing' || feature.tags?.highway === 'crossing' ? 2.5 : 2;
}

const skywalkDeckIds = new Set(['way/323729567', 'way/1221361667', 'way/1221361669']);
const skywalkStairIds = new Set(['way/323729566', 'way/323729569']);
const varthurElevatedFootwayIds = new Set(['way/1225572736', 'way/1225572743']);

function footwayElevation(feature) {
  if (varthurElevatedFootwayIds.has(feature.id)) return VARTHUR_VIADUCT_DECK_TOP_Y + VARTHUR_WALK_SLAB_OFFSET_Y;
  if (skywalkDeckIds.has(feature.id) || feature.tags?.bridge === 'yes' || feature.tags?.bridge === 'viaduct') {
    return MARATHAHALLI_SKYWALK_DECK_TOP_Y;
  }
  return 0;
}

function makeSnapshotWalkRoutes(footways) {
  const snapshotRoutes = footways
    .filter((feature) => Array.isArray(feature.geometry) && feature.geometry.length >= 2)
    .filter((feature) => !skywalkStairIds.has(feature.id) && !skywalkDeckIds.has(feature.id))
    .map((feature) => ({
      id: feature.id,
      sourceWayIds: [feature.id],
      sourceNodeRefs: feature.nodeRefs,
      points: feature.geometry,
      width: sourceFootwayWidth(feature),
      elevation: footwayElevation(feature),
      tags: feature.tags
    }));

  // These are the same three special routes appended by
  // registerSnapshotWalkRoutes after the snapshot routes are loaded. Their
  // points are the explicit authored skywalk/stair contract in marathahalliDemo.ts.
  const specialRoutes = [
    {
      id: 'way/323729569',
      sourceWayIds: ['way/323729569'],
      sourceNodeRefs: undefined,
      points: [[45.2, -4.7], [63.9, -4.6]],
      width: 3,
      elevation: 0,
      tags: { highway: 'footway', footway: 'steps' }
    },
    {
      id: 'way/323729567|way/1221361667|way/1221361669',
      sourceWayIds: ['way/323729567', 'way/1221361667', 'way/1221361669'],
      sourceNodeRefs: undefined,
      points: [[63.9, -4.6], [66.2, 24.5]],
      width: 3,
      elevation: MARATHAHALLI_SKYWALK_DECK_TOP_Y,
      tags: { highway: 'footway', bridge: 'viaduct' }
    },
    {
      id: 'way/323729566',
      sourceWayIds: ['way/323729566'],
      sourceNodeRefs: undefined,
      points: [[84.5, 22.7], [66.2, 24.5]],
      width: 3,
      elevation: 0,
      tags: { highway: 'footway', footway: 'steps' }
    }
  ];

  return [...snapshotRoutes, ...specialRoutes];
}

function shareNode(left, right) {
  if (!Array.isArray(left.sourceNodeRefs) || !Array.isArray(right.sourceNodeRefs)) return false;
  const rightNodes = new Set(right.sourceNodeRefs);
  return left.sourceNodeRefs.some((nodeRef) => rightNodes.has(nodeRef));
}

function sharedNodeIds(left, right) {
  if (!Array.isArray(left?.sourceNodeRefs) || !Array.isArray(right?.sourceNodeRefs)) return [];
  const rightNodes = new Set(right.sourceNodeRefs);
  return left.sourceNodeRefs.filter((nodeRef) => rightNodes.has(nodeRef));
}

function routeEndpointDistance(left, right) {
  const leftStart = left.points[0];
  const leftEnd = left.points.at(-1);
  const rightStart = right.points[0];
  const rightEnd = right.points.at(-1);
  return Math.min(
    distanceBetween(leftStart, rightStart),
    distanceBetween(leftStart, rightEnd),
    distanceBetween(leftEnd, rightStart),
    distanceBetween(leftEnd, rightEnd)
  );
}

function buildRouteGraph(routes) {
  const connections = routes.map(() => new Set());
  for (let leftIndex = 0; leftIndex < routes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < routes.length; rightIndex += 1) {
      const left = routes[leftIndex];
      const right = routes[rightIndex];
      if (shareNode(left, right)) {
        if (Math.abs(left.elevation - right.elevation) < 0.75) {
          connections[leftIndex].add(rightIndex);
          connections[rightIndex].add(leftIndex);
        }
        continue;
      }
      if (routeEndpointDistance(left, right) <= WALK_ROUTE_JOIN_TOLERANCE_METRES) {
        connections[leftIndex].add(rightIndex);
        connections[rightIndex].add(leftIndex);
      }
    }
  }
  return connections;
}

function connectedComponentSize(startIndex, graph) {
  if (startIndex < 0) return 0;
  const visited = new Set([startIndex]);
  const queue = [startIndex];
  while (queue.length) {
    const index = queue.shift();
    for (const next of graph[index]) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return visited.size;
}

function findRoutePath(startIndex, targetIndex, graph) {
  if (startIndex < 0 || targetIndex < 0) return [];
  const queue = [startIndex];
  const previous = new Map([[startIndex, -1]]);
  while (queue.length) {
    const current = queue.shift();
    if (current === targetIndex) break;
    for (const next of graph[current]) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      queue.push(next);
    }
  }
  if (!previous.has(targetIndex)) return [];
  const pathIndices = [];
  for (let current = targetIndex; current >= 0; current = previous.get(current)) pathIndices.push(current);
  return pathIndices.reverse();
}

function makeCurve(points) {
  return new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y + 0.18, z)),
    false,
    'centripetal',
    0.25
  );
}

function curvePoint2d(curve, t, laneOffset = 0) {
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).setY(0);
  if (tangent.lengthSq() > 0.000001) tangent.normalize();
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
  return {
    point: [point.x + normal.x * laneOffset, point.z + normal.z * laneOffset],
    y: point.y,
    tangent: [tangent.x, tangent.z]
  };
}

function sampleCurve(curve, laneOffset = 0) {
  const samples = [];
  for (let index = 0; index < CURVE_SAMPLE_COUNT; index += 1) {
    const t = index / (CURVE_SAMPLE_COUNT - 1);
    samples.push({ t, ...curvePoint2d(curve, t, laneOffset) });
  }
  return samples;
}

function summarizeRoadAlignment(samples, sourceRoads) {
  let maxDistance = 0;
  let maxSurfaceExcess = Number.NEGATIVE_INFINITY;
  let minSurfaceMargin = Number.POSITIVE_INFINITY;
  let outsideSamples = 0;
  let worst = null;

  for (const sample of samples) {
    const nearest = nearestFeature(sample.point, sourceRoads);
    if (!nearest) continue;
    const roadWidth = roadRibbonWidth(nearest.feature);
    const surfaceMargin = roadWidth / 2 - nearest.distance;
    const surfaceExcess = -surfaceMargin;
    if (nearest.distance > maxDistance) {
      maxDistance = nearest.distance;
      worst = { t: sample.t, point: sample.point, way: nearest.feature.id, distance: nearest.distance };
    }
    maxSurfaceExcess = Math.max(maxSurfaceExcess, surfaceExcess);
    minSurfaceMargin = Math.min(minSurfaceMargin, surfaceMargin);
    if (surfaceMargin < 0) outsideSamples += 1;
  }

  return {
    maxNearestSourceRoadDistanceMetres: round(maxDistance),
    maxRoadSurfaceExcessMetres: round(maxSurfaceExcess),
    minimumRoadSurfaceMarginMetres: round(minSurfaceMargin),
    outsideRoadSurfaceSamples: outsideSamples,
    worst: worst && {
      t: round(worst.t, 4),
      point: roundPoint(worst.point),
      way: worst.way,
      distanceMetres: round(worst.distance)
    },
    status: maxDistance <= MAX_SOURCE_CENTERLINE_CLEARANCE_METRES && outsideSamples === 0 ? 'passed' : 'failed'
  };
}

function summarizeFootwayClearance(samples, routes, carY) {
  let nearestPlan = null;
  let nearestSameSurface = null;
  for (const sample of samples) {
    const plan = nearestRoute(sample.point, routes);
    if (plan && (!nearestPlan || plan.distance < nearestPlan.distance)) {
      nearestPlan = { ...plan, sample };
    }

    const sameSurfaceRoutes = routes.filter((route) => Math.abs(route.elevation - carY) <= 1);
    const sameSurface = nearestRoute(sample.point, sameSurfaceRoutes);
    if (sameSurface && (!nearestSameSurface || sameSurface.distance < nearestSameSurface.distance)) {
      nearestSameSurface = { ...sameSurface, sample };
    }
  }

  const format = (entry) => entry && {
    distanceMetres: round(entry.distance),
    t: round(entry.sample.t, 4),
    point: roundPoint(entry.sample.point),
    route: entry.route.id,
    sourceWayIds: entry.route.sourceWayIds,
    footwayElevationY: entry.route.elevation,
    verticalSeparationMetres: round(Math.abs(entry.route.elevation - carY))
  };

  return {
    minimumPlanDistance: format(nearestPlan),
    minimumSameSurfaceDistance: format(nearestSameSurface),
    planConflictIsElevated: Boolean(nearestPlan && Math.abs(nearestPlan.route.elevation - carY) > 1),
    status: nearestSameSurface ? 'reported' : 'no-same-surface-footway-in-snapshot'
  };
}

function unitFromFeature(feature) {
  if (!feature?.geometry || feature.geometry.length < 2) return [0, 0];
  const start = feature.geometry[0];
  const end = feature.geometry.at(-1);
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]) || 1;
  return [(end[0] - start[0]) / length, (end[1] - start[1]) / length];
}

function dot(left, right) {
  return left[0] * right[0] + left[1] * right[1];
}

function checkSourceNodeRefs(feature, label) {
  if (!Array.isArray(feature?.geometry) || !Array.isArray(feature?.nodeRefs) || feature.nodeRefs.length !== feature.geometry.length) {
    fail(`${label} must have nodeRefs aligned one-to-one with geometry`);
    return false;
  }
  return feature.nodeRefs.every((nodeRef) => typeof nodeRef === 'string' && nodeRef.length > 0);
}

const [dataset, laneNetworkSource, navigationSource, cameraControllerSource] = await Promise.all([
  readFile(datasetPath, 'utf8').then((value) => JSON.parse(value)),
  readFile(laneNetworkPath, 'utf8'),
  readFile(navigationPath, 'utf8'),
  readFile(cameraControllerPath, 'utf8')
]);

const connectors = parseConnectors(laneNetworkSource);
const replayPoints = parseReplayPoints(laneNetworkSource);
const northPoints = replayPoints;
const southPoints = [...replayPoints].reverse();

if (northPoints.length < 4) fail(`expected at least four replay control points, found ${northPoints.length}`);
if (!Number.isFinite(connectors.north.stopT) || connectors.north.stopT <= 0 || connectors.north.stopT >= 1) {
  fail('north.stopT must be a normalized value between 0 and 1');
}
if (!Number.isFinite(connectors.south.stopT) || connectors.south.stopT <= 0 || connectors.south.stopT >= 1) {
  fail('south.stopT must be a normalized value between 0 and 1');
}

const roadsById = new Map((dataset.roads || []).map((feature) => [feature.id, feature]));
const footwaysById = new Map((dataset.footways || []).map((feature) => [feature.id, feature]));
const relation = (dataset.turnRestrictions || []).find((restriction) => restriction.id === RELATION_ID);
const relationRoleMembers = new Map((relation?.members || []).map((member) => [member.role, member]));

if (!relation) {
  fail(`${RELATION_ID} is missing from the snapshot`);
} else if (relation.restriction !== 'no_u_turn') {
  fail(`${RELATION_ID} must remain restriction=no_u_turn`);
}

const relationJoinChecks = RELATION_WAY_SEQUENCE.slice(0, -1).map((leftId, index) => {
  const rightId = RELATION_WAY_SEQUENCE[index + 1];
  const left = roadsById.get(leftId);
  const right = roadsById.get(rightId);
  if (!left || !right) {
    fail(`${RELATION_ID} join references missing source road ${leftId} or ${rightId}`);
    return { from: leftId, to: rightId, status: 'missing' };
  }
  const leftEnd = left.geometry.at(-1);
  const rightStart = right.geometry[0];
  const sharedNode = left.nodeRefs?.at(-1) && left.nodeRefs?.at(-1) === right.nodeRefs?.[0]
    ? left.nodeRefs.at(-1)
    : null;
  const distanceMetres = distanceBetween(leftEnd, rightStart);
  if (distanceMetres > SOURCE_JOIN_TOLERANCE_METRES || !sharedNode) {
    fail(`${RELATION_ID} ${leftId} → ${rightId} is not an exact node join`);
  }
  return {
    from: leftId,
    to: rightId,
    distanceMetres: round(distanceMetres),
    sharedNode,
    status: distanceMetres <= SOURCE_JOIN_TOLERANCE_METRES && Boolean(sharedNode) ? 'passed' : 'failed'
  };
});

for (const role of ['from', 'via', 'to']) {
  const member = relationRoleMembers.get(role);
  if (!member || member.type !== 'way' || member.ref !== RELATION_WAY_SEQUENCE[['from', 'via', 'to'].indexOf(role)]) {
    fail(`${RELATION_ID} does not preserve the expected ${role} member sequence`);
  }
}

const northSourceRoads = connectors.north.sourceWayIds.map((id) => roadsById.get(id)).filter(Boolean);
const missingNorthSourceWays = connectors.north.sourceWayIds.filter((id) => !roadsById.has(id));
const missingSouthSourceWays = connectors.south.sourceWayIds.filter((id) => !roadsById.has(id));
if (missingNorthSourceWays.length) fail(`north connector references missing roads: ${missingNorthSourceWays.join(', ')}`);
if (missingSouthSourceWays.length) fail(`south connector references missing roads: ${missingSouthSourceWays.join(', ')}`);
for (const sourceWayId of [...new Set([...connectors.north.sourceWayIds, ...connectors.south.sourceWayIds])]) {
  const sourceWay = roadsById.get(sourceWayId);
  if (sourceWay) checkSourceNodeRefs(sourceWay, sourceWayId);
}

const relationIndexInNorth = RELATION_WAY_SEQUENCE.map((id) => connectors.north.sourceWayIds.indexOf(id));
const relationIndexInSouth = [...RELATION_WAY_SEQUENCE].reverse().map((id) => connectors.south.sourceWayIds.indexOf(id));
if (relationIndexInNorth.some((value, index) => value < 0 || (index > 0 && value <= relationIndexInNorth[index - 1]))) {
  fail('north connector does not contain the relation way sequence in order');
}
if (relationIndexInSouth.some((value, index) => value < 0 || (index > 0 && value <= relationIndexInSouth[index - 1]))) {
  fail('south connector does not contain the reversed relation way sequence in order');
}

const controlPointRoadMatches = northPoints.map((point) => {
  const nearest = nearestFeature([point[0], point[2]], northSourceRoads);
  return {
    point: roundPoint([point[0], point[2]]),
    nearestRoad: nearest?.feature.id || null,
    distanceMetres: nearest ? round(nearest.distance) : null
  };
});
const maxControlPointDistance = Math.max(...controlPointRoadMatches.map((match) => match.distanceMetres ?? Number.POSITIVE_INFINITY));
if (maxControlPointDistance > 0.05) fail(`replay control points drift ${maxControlPointDistance.toFixed(3)}m from source roads`);

const northCurve = makeCurve(northPoints);
const southCurve = makeCurve(southPoints);
const northSamples = sampleCurve(northCurve);
const northRoadAlignment = summarizeRoadAlignment(northSamples, northSourceRoads);
if (northRoadAlignment.status !== 'passed') fail('north replay curve leaves the rendered source road ribbon');

const laneAlignment = VEHICLE_LANE_OFFSETS.map((offset) => {
  const summary = summarizeRoadAlignment(sampleCurve(northCurve, offset), northSourceRoads);
  if (summary.status !== 'passed') fail(`hero vehicle lane offset ${offset} leaves the rendered source road ribbon`);
  return { offsetMetres: offset, ...summary };
});

const entryRoad = roadsById.get(connectors.north.sourceWayIds[0]);
const exitRoad = roadsById.get(connectors.north.sourceWayIds.at(-1));
const entrySourceHeading = unitFromFeature(entryRoad);
const exitSourceHeading = unitFromFeature(exitRoad);
const replayStartHeading = northSamples[1].tangent;
const replayEndHeading = northSamples.at(-2).tangent;
const headingReport = {
  entryAlignmentDot: round(dot(replayStartHeading, entrySourceHeading), 4),
  exitAlignmentDot: round(dot(replayEndHeading, exitSourceHeading), 4),
  entryExitOppositionDot: round(dot(replayStartHeading, replayEndHeading), 4),
  status: dot(replayStartHeading, entrySourceHeading) >= 0.7 &&
    dot(replayEndHeading, exitSourceHeading) >= 0.7 &&
    dot(replayStartHeading, replayEndHeading) <= -0.7
    ? 'passed'
    : 'failed'
};
if (headingReport.status !== 'passed') fail('replay entry/exit headings do not form a source-aligned U-turn');

const walkStartSectionStart = navigationSource.indexOf('const WALK_STARTS');
const walkStartSectionEnd = navigationSource.indexOf('\n};', walkStartSectionStart);
const birdSectionStart = navigationSource.indexOf('const BIRD_VIEWS');
const birdSectionEnd = navigationSource.indexOf('\n\nconst WALK_STARTS', birdSectionStart);
const birdCamera = parseCrossoverCamera(navigationSource.slice(birdSectionStart, birdSectionEnd), 'BIRD_VIEWS');
const walkCamera = parseCrossoverCamera(navigationSource.slice(walkStartSectionStart, walkStartSectionEnd), 'WALK_STARTS');

const walkRoutes = makeSnapshotWalkRoutes(dataset.footways || []);
const walkGraph = buildRouteGraph(walkRoutes);
const walkStartNearest = nearestRoute(walkCamera.position, walkRoutes);
const walkRequestedTarget = walkCamera.target;
const walkTargetNearest = nearestRoute(walkRequestedTarget, walkRoutes);
const walkStartIndex = walkStartNearest ? walkRoutes.indexOf(walkStartNearest.route) : -1;
const walkTargetIndex = walkTargetNearest ? walkRoutes.indexOf(walkTargetNearest.route) : -1;
const routePathIndices = findRoutePath(walkStartIndex, walkTargetIndex, walkGraph);

if (!walkStartNearest || walkStartNearest.distance > walkStartNearest.route.width / 2 + 0.35) {
  fail('crossover person start is not on a source footway route');
}
if (!walkTargetNearest || walkTargetNearest.distance > walkTargetNearest.route.width / 2 + 0.35) {
  fail('crossover person target is not on a source footway route');
}
if (!routePathIndices.length) fail('crossover person start and target are disconnected in the source footway registry');

const walkLookDirection = [
  walkRequestedTarget[0] - walkCamera.position[0],
  walkRequestedTarget[1] - walkCamera.position[1]
];
const walkLookLength = Math.hypot(...walkLookDirection) || 1;
const walkLookAhead = [
  walkCamera.position[0] + walkLookDirection[0] / walkLookLength * WALK_LOOK_DISTANCE,
  walkCamera.position[1] + walkLookDirection[1] / walkLookLength * WALK_LOOK_DISTANCE
];
const walkLookAheadNearest = nearestRoute(walkLookAhead, walkRoutes);
if (!walkLookAheadNearest || walkLookAheadNearest.distance > walkLookAheadNearest.route.width / 2 + 0.35) {
  fail('crossover person look-ahead leaves the mapped footway');
}

const walkPathProbe = [];
let maxWalkPathDistance = 0;
for (let index = 0; index <= 128; index += 1) {
  const progress = index / 128;
  const point = [
    walkCamera.position[0] + (walkRequestedTarget[0] - walkCamera.position[0]) * progress,
    walkCamera.position[1] + (walkRequestedTarget[1] - walkCamera.position[1]) * progress
  ];
  const nearest = nearestRoute(point, walkRoutes);
  if (nearest) maxWalkPathDistance = Math.max(maxWalkPathDistance, nearest.distance);
  if (index % 32 === 0 || index === 128) {
    walkPathProbe.push({
      progress: round(progress, 3),
      point: roundPoint(point),
      route: nearest?.route.id || null,
      distanceMetres: nearest ? round(nearest.distance) : null,
      elevationY: nearest?.route.elevation ?? null
    });
  }
}
if (maxWalkPathDistance > 0.35) fail(`crossover person probe leaves its source footway by ${maxWalkPathDistance.toFixed(3)}m`);

const crossoverSourceFootway = footwaysById.get('way/1284676222');
if (crossoverSourceFootway) {
  checkSourceNodeRefs(crossoverSourceFootway, 'way/1284676222');
} else {
  fail('source signal crossing way/1284676222 is missing');
}

const cameraTargetRoad = nearestFeature(birdCamera.target, dataset.roads || []);
const footwayPlanClearance = summarizeFootwayClearance(northSamples, walkRoutes, 0.3);
const relationSourceWayReport = RELATION_WAY_SEQUENCE.map((id) => {
  const feature = roadsById.get(id);
  return {
    id,
    name: feature?.name || feature?.tags?.name || null,
    nodeRefs: feature?.nodeRefs || [],
    geometryPoints: feature?.geometry?.length || 0
  };
});

const specialRouteCount = walkRoutes.length - (dataset.footways || []).filter((feature) => !skywalkStairIds.has(feature.id) && !skywalkDeckIds.has(feature.id)).length;
const walkRoutePath = routePathIndices.map((index) => walkRoutes[index].id);
const walkStartFeature = walkStartNearest?.route.sourceWayIds.length === 1
  ? footwaysById.get(walkStartNearest.route.sourceWayIds[0])
  : null;
const walkTargetFeature = walkTargetNearest?.route.sourceWayIds.length === 1
  ? footwaysById.get(walkTargetNearest.route.sourceWayIds[0])
  : null;
const crossoverFootwayChain = CROSSOVER_FOOTWAY_CHAIN.slice(0, -1).map((leftId, index) => {
  const rightId = CROSSOVER_FOOTWAY_CHAIN[index + 1];
  const left = walkRoutes.find((route) => route.id === leftId);
  const right = walkRoutes.find((route) => route.id === rightId);
  const sharedNodes = sharedNodeIds(left, right);
  const leftIndex = left ? walkRoutes.indexOf(left) : -1;
  const rightIndex = right ? walkRoutes.indexOf(right) : -1;
  const connected = leftIndex >= 0 && rightIndex >= 0 && walkGraph[leftIndex]?.has(rightIndex) === true;
  if (!connected) fail(`crossover footway chain is disconnected at ${leftId} → ${rightId}`);
  return {
    from: leftId,
    to: rightId,
    sharedSourceNodes: sharedNodes,
    endpointDistanceMetres: left && right ? round(routeEndpointDistance(left, right)) : null,
    joinMethod: sharedNodes.length ? 'shared-source-node' : 'endpoint-tolerance',
    connected,
    status: connected ? 'passed' : 'failed'
  };
});

const integrationReport = {
  snapshotRoutesRegistered: cameraControllerSource.includes('registerSnapshotWalkRoutes(snapshot.footways)'),
  movementUsesResolver: cameraControllerSource.includes('resolveWalkPosition('),
  sourceNodeRefsRegistered: navigationSource.includes('sourceNodeRefs: feature.nodeRefs'),
  status: cameraControllerSource.includes('registerSnapshotWalkRoutes(snapshot.footways)') &&
    cameraControllerSource.includes('resolveWalkPosition(') &&
    navigationSource.includes('sourceNodeRefs: feature.nodeRefs')
    ? 'passed'
    : 'failed'
};
if (integrationReport.status !== 'passed') fail('person-mode source footway registration/resolution wiring is incomplete');

console.log(errors.length ? 'Crossover geometry validation failed' : 'Crossover geometry validation passed');
for (const error of errors) console.error(`- ${error}`);

console.log(JSON.stringify({
  relation: {
    id: RELATION_ID,
    restriction: relation?.restriction || null,
    sourceWaySequence: relationSourceWayReport,
    joins: relationJoinChecks,
    status: relationJoinChecks.length === 2 && relationJoinChecks.every((join) => join.status === 'passed') ? 'passed' : 'failed'
  },
  replay: {
    pointCount: northPoints.length,
    curveLengthMetres: round(northCurve.getLength()),
    north: {
      sourceWayIds: connectors.north.sourceWayIds,
      stopT: connectors.north.stopT,
      start: roundPoint([northPoints[0]?.[0] || 0, northPoints[0]?.[2] || 0]),
      end: roundPoint([northPoints.at(-1)?.[0] || 0, northPoints.at(-1)?.[2] || 0]),
      controlPointRoadMatches,
      maxControlPointDistanceMetres: round(maxControlPointDistance),
      roadAlignment: northRoadAlignment,
      laneAlignment,
      heading: headingReport,
      footwayClearance: footwayPlanClearance
    },
    south: {
      sourceWayIds: connectors.south.sourceWayIds,
      stopT: connectors.south.stopT,
      reversePointOrder: southPoints[0]?.[0] === northPoints.at(-1)?.[0] && southPoints.at(-1)?.[0] === northPoints[0]?.[0],
      curveLengthMetres: round(southCurve.getLength())
    },
    legality: 'OSM relation marks this movement no_u_turn; rendered connector is a modelled visual replay, not a legal-turn assertion'
  },
  pedestrian: {
    registry: {
      snapshotFootways: (dataset.footways || []).filter((feature) => !skywalkStairIds.has(feature.id) && !skywalkDeckIds.has(feature.id)).length,
      specialSkywalkRoutes: specialRouteCount,
      totalRoutes: walkRoutes.length,
      routeJoinToleranceMetres: WALK_ROUTE_JOIN_TOLERANCE_METRES,
      crossoverComponentSize: connectedComponentSize(walkStartIndex, walkGraph),
      crossoverFootwayChain,
      routePath: walkRoutePath
    },
    cameraAnchor: {
      requestedStart: roundPoint(walkCamera.position),
      requestedTarget: roundPoint(walkRequestedTarget),
      renderedEyeHeightY: WALK_EYE_HEIGHT,
      lookAhead: roundPoint(walkLookAhead),
      startRoute: walkStartNearest && {
        id: walkStartNearest.route.id,
        distanceMetres: round(walkStartNearest.distance),
        sourceWayIds: walkStartNearest.route.sourceWayIds,
        nodeAtStart: walkStartFeature?.nodeRefs?.[0] || null
      },
      targetRoute: walkTargetNearest && {
        id: walkTargetNearest.route.id,
        distanceMetres: round(walkTargetNearest.distance),
        sourceWayIds: walkTargetNearest.route.sourceWayIds,
        nodeAtTarget: walkTargetFeature?.nodeRefs?.at(-1) || null
      },
      lookAheadRoute: walkLookAheadNearest && {
        id: walkLookAheadNearest.route.id,
        distanceMetres: round(walkLookAheadNearest.distance)
      },
      pathProbe: walkPathProbe,
      status: walkStartNearest && walkTargetNearest && routePathIndices.length && maxWalkPathDistance <= 0.35 ? 'passed' : 'failed'
    },
    integration: integrationReport
  },
  birdCamera: {
    position: roundPoint(birdCamera.position),
    target: roundPoint(birdCamera.target),
    targetNearestRoad: cameraTargetRoad && {
      id: cameraTargetRoad.feature.id,
      distanceMetres: round(cameraTargetRoad.distance),
      point: roundPoint(cameraTargetRoad.point)
    }
  },
  warnings
}, null, 2));

if (errors.length) process.exitCode = 1;

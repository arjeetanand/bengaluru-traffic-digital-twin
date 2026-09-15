#!/usr/bin/env node

/**
 * Read-only placement audit for the two source-backed Namma Metro ways.
 *
 * This deliberately separates measured OSM facts from the renderer's
 * modelled elevation and pier assumptions. It uses the raw XML to verify that
 * the compiled clipped geometry still belongs to the committed source, then
 * reports horizontal track pairing, crossover context, and support evidence.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const snapshotPath = path.join(projectDirectory, 'public/data/marathahalli-demo.json');
const sourceXmlPath = path.join(projectDirectory, 'marathahalli_osm.xml');
const rendererPath = path.join(projectDirectory, 'src/components/canvas/Environment/MetroViaduct.tsx');
const metroWayIds = ['way/1551136768', 'way/1551136770'];

// This is the renderer's local inspection zone around the Marathahalli
// crossover. It is a reporting window, not a claim that OSM defines a
// surveyed construction exclusion zone of this size.
const crossoverBox = { halfWidth: 14, halfLength: 42 };
const sourceProjectionTolerance = 0.25;
const supportProximityWindow = 14;

const failures = [];
const warnings = [];

function pass(label, detail) {
  console.log(`PASS ${label}: ${detail}`);
}

function warn(label, detail) {
  warnings.push(`${label}: ${detail}`);
  console.log(`WARN ${label}: ${detail}`);
}

function fail(label, detail) {
  failures.push(`${label}: ${detail}`);
  console.log(`FAIL ${label}: ${detail}`);
}

function readFile(filePath, label) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(label, error.message);
    return null;
  }
}

const snapshotText = readFile(snapshotPath, 'snapshot could not be loaded');
const sourceXml = readFile(sourceXmlPath, 'source XML could not be loaded');
const rendererSource = readFile(rendererPath, 'renderer source could not be loaded');

let snapshot = null;
if (snapshotText) {
  try {
    snapshot = JSON.parse(snapshotText);
  } catch (error) {
    fail('snapshot JSON', error.message);
  }
}

if (!snapshot || !sourceXml) {
  console.log(`Summary: ${failures.length} failure(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

function parseAttributes(source) {
  const attributes = {};
  for (const match of source.matchAll(/([A-Za-z_][\w:.-]*)="([^"]*)"/g)) {
    attributes[match[1]] = match[2];
  }
  return attributes;
}

function parseXmlNodes(xml) {
  const nodes = new Map();
  for (const match of xml.matchAll(/<node\s+([^>]*)\/>/g)) {
    const attributes = parseAttributes(match[1]);
    const lat = Number(attributes.lat);
    const lon = Number(attributes.lon);
    if (attributes.id && Number.isFinite(lat) && Number.isFinite(lon)) {
      nodes.set(attributes.id, { lat, lon });
    }
  }
  return nodes;
}

function parseXmlWay(xml, id) {
  const body = xml.match(new RegExp(`<way\\s+id="${id}"[\\s\\S]*?<\\/way>`))?.[0];
  if (!body) return null;
  return {
    nodeRefs: [...body.matchAll(/<nd\s+([^>]*)\/>/g)].map((match) => (
      parseAttributes(match[1]).ref
    )),
    tags: Object.fromEntries([...body.matchAll(/<tag\s+([^>]*)\/>/g)].map((match) => {
      const attributes = parseAttributes(match[1]);
      return [attributes.k, attributes.v];
    }))
  };
}

const sourceNodes = parseXmlNodes(sourceXml);
const sourceWays = Object.fromEntries(metroWayIds.map((id) => [
  id,
  parseXmlWay(sourceXml, id.slice(4))
]));
const snapshotWays = Object.fromEntries(metroWayIds.map((id) => [
  id,
  snapshot.railways?.find((way) => way.id === id) ?? null
]));

console.log('Metro placement audit (source XML + compiled OSM snapshot)');
console.log(`Snapshot: ${path.relative(projectDirectory, snapshotPath)}`);
console.log(`Source XML: ${path.relative(projectDirectory, sourceXmlPath)}`);
console.log(`Mainline ways: ${metroWayIds.join(', ')}`);

if (rendererSource) {
  const hasBothMainlineIds = metroWayIds.every((id) => rendererSource.includes(id));
  const selectsCommittedMainline = rendererSource.includes('NAMMA_METRO_MAINLINE_WAY_IDS') &&
    rendererSource.includes('map((id) => snapshot.railways.find');
  if (hasBothMainlineIds && selectsCommittedMainline) {
    pass('renderer source-way contract', 'renderer selects the two committed through ways explicitly; the siding is not part of the running deck');
  } else {
    fail('renderer source-way contract', 'renderer source selection is not explicitly bound to both committed mainline way IDs');
  }

  if (rendererSource.includes('isNammaMetroPierSupport') &&
      rendererSource.includes('generic ORR bridge piers excluded')) {
    pass('renderer support isolation', 'only explicitly tagged Namma Metro supports can enter the source-support path; nearby generic ORR piers remain excluded');
  } else {
    fail('renderer support isolation', 'renderer support path does not expose the explicit-metro evidence guard');
  }

  const metadataMarkers = [
    'modelStatus:',
    'sourceWayIds:',
    'sourceElevationEvidence:',
    'supportEvidence:',
    'roadClearance:'
  ];
  const missingMetadata = metadataMarkers.filter((marker) => !rendererSource.includes(marker));
  if (missingMetadata.length) {
    fail('renderer provenance metadata', `missing ${missingMetadata.join(', ')}`);
  } else {
    pass('renderer provenance metadata', 'source plan, vertical evidence gap, support evidence, and clearance status are exposed on the scene group');
  }
}

const sourceHash = `sha256:${crypto.createHash('sha256').update(sourceXml).digest('hex')}`;
if (sourceHash === snapshot.source?.inputSha256) {
  pass('source identity', `${sourceHash} matches snapshot.source.inputSha256`);
} else {
  fail('source identity', `${sourceHash} does not match ${snapshot.source?.inputSha256 ?? 'missing snapshot hash'}`);
}

const isFinitePoint = (point) => (
  Array.isArray(point) && point.length >= 2 &&
  Number.isFinite(point[0]) && Number.isFinite(point[1])
);

const isFiniteGeometry = (geometry) => (
  Array.isArray(geometry) && geometry.length >= 2 && geometry.every(isFinitePoint)
);

const distanceBetween = (left, right) => Math.hypot(
  left[0] - right[0],
  left[1] - right[1]
);

const lineLength = (points) => points.slice(1).reduce((total, point, index) => (
  total + distanceBetween(points[index], point)
), 0);

function pointAt(points, progress) {
  const segmentLengths = points.slice(1).map((point, index) => (
    distanceBetween(points[index], point)
  ));
  const totalLength = segmentLengths.reduce((total, length) => total + length, 0);
  let remaining = Math.max(0, Math.min(1, progress)) * totalLength;
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];
    if (remaining <= segmentLength || index === segmentLengths.length - 1) {
      const localProgress = segmentLength > 0 ? remaining / segmentLength : 0;
      const start = points[index];
      const end = points[index + 1];
      return [
        start[0] + (end[0] - start[0]) * localProgress,
        start[1] + (end[1] - start[1]) * localProgress
      ];
    }
    remaining -= segmentLength;
  }
  return points.at(-1);
}

function percentile(values, progress) {
  const sorted = values.slice().sort((left, right) => left - right);
  if (!sorted.length) return Number.NaN;
  const index = (sorted.length - 1) * progress;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function pointToSegmentDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return distanceBetween(point, start);
  const progress = Math.max(0, Math.min(1, (
    (point[0] - start[0]) * dx + (point[1] - start[1]) * dz
  ) / lengthSquared));
  return distanceBetween(point, [
    start[0] + progress * dx,
    start[1] + progress * dz
  ]);
}

function orientation(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function segmentsIntersect(a, b, c, d) {
  const epsilon = 1e-8;
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  const onSegment = (start, point, end) => (
    point[0] >= Math.min(start[0], end[0]) - epsilon &&
    point[0] <= Math.max(start[0], end[0]) + epsilon &&
    point[1] >= Math.min(start[1], end[1]) - epsilon &&
    point[1] <= Math.max(start[1], end[1]) + epsilon
  );
  return (
    (abC * abD < 0 && cdA * cdB < 0) ||
    (Math.abs(abC) <= epsilon && onSegment(a, c, b)) ||
    (Math.abs(abD) <= epsilon && onSegment(a, d, b)) ||
    (Math.abs(cdA) <= epsilon && onSegment(c, a, d)) ||
    (Math.abs(cdB) <= epsilon && onSegment(c, b, d))
  );
}

function geometryDistance(leftGeometry, rightGeometry) {
  let nearest = Number.POSITIVE_INFINITY;
  if (!isFiniteGeometry(leftGeometry) || !isFiniteGeometry(rightGeometry)) return nearest;
  for (let leftIndex = 1; leftIndex < leftGeometry.length; leftIndex += 1) {
    for (let rightIndex = 1; rightIndex < rightGeometry.length; rightIndex += 1) {
      const leftStart = leftGeometry[leftIndex - 1];
      const leftEnd = leftGeometry[leftIndex];
      const rightStart = rightGeometry[rightIndex - 1];
      const rightEnd = rightGeometry[rightIndex];
      if (segmentsIntersect(leftStart, leftEnd, rightStart, rightEnd)) return 0;
      nearest = Math.min(
        nearest,
        pointToSegmentDistance(leftStart, rightStart, rightEnd),
        pointToSegmentDistance(rightStart, leftStart, leftEnd)
      );
    }
  }
  return nearest;
}

function pointToGeometryDistance(point, geometry) {
  if (!isFinitePoint(point) || !isFiniteGeometry(geometry)) return Number.POSITIVE_INFINITY;
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < geometry.length; index += 1) {
    nearest = Math.min(nearest, pointToSegmentDistance(point, geometry[index - 1], geometry[index]));
  }
  return nearest;
}

function isPointInsidePolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index++) {
    const [currentX, currentZ] = polygon[index];
    const [previousX, previousZ] = polygon[previousIndex];
    const crossesRay = (currentZ > point[1]) !== (previousZ > point[1]);
    if (!crossesRay) continue;
    const intersectionX = (previousX - currentX) * (point[1] - currentZ) /
      (previousZ - currentZ) + currentX;
    if (point[0] < intersectionX) inside = !inside;
  }
  return inside;
}

function pointToPolygonDistance(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 2) return Number.POSITIVE_INFINITY;
  if (polygon.length >= 3 && isPointInsidePolygon(point, polygon)) return 0;
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < polygon.length; index += 1) {
    nearest = Math.min(
      nearest,
      pointToSegmentDistance(point, polygon[index], polygon[(index + 1) % polygon.length])
    );
  }
  return nearest;
}

function geometryIntersectsBox(geometry, halfWidth, halfLength) {
  if (!isFiniteGeometry(geometry)) return false;
  const box = [
    [-halfWidth, -halfLength],
    [halfWidth, -halfLength],
    [halfWidth, halfLength],
    [-halfWidth, halfLength]
  ];
  return geometry.some((point) => (
    Math.abs(point[0]) <= halfWidth && Math.abs(point[1]) <= halfLength
  )) || geometry.slice(1).some((point, index) => (
    box.some((corner, cornerIndex) => segmentsIntersect(
      geometry[index],
      point,
      corner,
      box[(cornerIndex + 1) % box.length]
    ))
  ));
}

function formatDistance(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)}m` : 'n/a';
}

function featureLabel(feature) {
  return `${feature.id} ${JSON.stringify(feature.name ?? feature.tags?.name ?? 'unnamed')}`;
}

function projectSourceNode(node) {
  return [
    (node.lon - snapshot.origin.lon) * snapshot.origin.metersPerDegree.lon,
    (node.lat - snapshot.origin.lat) * snapshot.origin.metersPerDegree.lat
  ];
}

function isContiguousSubsequence(sourceRefs, clippedRefs) {
  if (!sourceRefs.length || !clippedRefs.length) return false;
  const startIndex = sourceRefs.indexOf(clippedRefs[0]);
  return startIndex >= 0 && clippedRefs.every((ref, index) => (
    sourceRefs[startIndex + index] === ref
  ));
}

for (const id of metroWayIds) {
  const sourceWay = sourceWays[id];
  const snapshotWay = snapshotWays[id];
  if (!sourceWay) {
    fail(`${id} source way`, 'missing from committed OSM XML');
    continue;
  }
  if (!snapshotWay) {
    fail(`${id} snapshot way`, 'missing from compiled railways');
    continue;
  }

  const requiredTags = ['network', 'railway', 'bridge', 'layer', 'gauge'];
  const sourceTagsPresent = requiredTags.every((key) => Boolean(sourceWay.tags[key]));
  const snapshotTagsMatch = Object.entries(sourceWay.tags).every(([key, value]) => (
    snapshotWay.tags?.[key] === value
  ));
  const sourceTagContract = sourceWay.tags.network === 'Namma Metro' &&
    sourceWay.tags.railway === 'subway' &&
    sourceWay.tags.bridge === 'viaduct' &&
    sourceWay.tags.layer === '2' &&
    sourceWay.tags.gauge === '1435';
  if (sourceTagsPresent && snapshotTagsMatch && sourceTagContract) {
    pass(`${id} source tags`, `Namma Metro subway viaduct, layer=${sourceWay.tags.layer}, gauge=${sourceWay.tags.gauge}`);
  } else {
    fail(`${id} source tags`, 'source tags are incomplete, unexpected, or snapshot tags drifted');
  }

  const sourceRefs = sourceWay.nodeRefs;
  const clippedRefs = snapshotWay.nodeRefs ?? [];
  if (isContiguousSubsequence(sourceRefs, clippedRefs)) {
    pass(`${id} node lineage`, `compiled ${clippedRefs.length} nodes are a contiguous clip of XML way (${sourceRefs.length} nodes)`);
  } else {
    fail(`${id} node lineage`, 'compiled nodeRefs are not an ordered contiguous clip of the XML way');
  }

  if (!isFiniteGeometry(snapshotWay.geometry) || snapshotWay.geometry.length !== clippedRefs.length) {
    fail(`${id} geometry`, 'snapshot geometry is invalid or is not aligned with nodeRefs');
    continue;
  }

  const missingNodes = clippedRefs.filter((ref) => !sourceNodes.has(ref));
  if (missingNodes.length) {
    fail(`${id} XML nodes`, `missing ${missingNodes.length} referenced node(s), first=${missingNodes[0]}`);
  } else {
    const projectedPoints = clippedRefs.map((ref) => projectSourceNode(sourceNodes.get(ref)));
    const projectionErrors = projectedPoints.map((point, index) => (
      distanceBetween(point, snapshotWay.geometry[index])
    ));
    const maxProjectionError = Math.max(...projectionErrors);
    if (maxProjectionError <= sourceProjectionTolerance) {
      pass(`${id} source projection`, `max XML→snapshot error ${formatDistance(maxProjectionError)} (tolerance ${sourceProjectionTolerance.toFixed(2)}m)`);
    } else {
      fail(`${id} source projection`, `max XML→snapshot error ${formatDistance(maxProjectionError)} exceeds ${sourceProjectionTolerance.toFixed(2)}m`);
    }
  }

  console.log(`  ${id} length=${lineLength(snapshotWay.geometry).toFixed(1)}m, points=${snapshotWay.geometry.length}`);
}

const firstWay = snapshotWays[metroWayIds[0]];
const secondWayOriginal = snapshotWays[metroWayIds[1]];

if (firstWay && secondWayOriginal && isFiniteGeometry(firstWay.geometry) && isFiniteGeometry(secondWayOriginal.geometry)) {
  const firstTrack = firstWay.geometry;
  const secondTrackOriginal = secondWayOriginal.geometry;
  const secondTrack = secondTrackOriginal.slice().reverse();
  const sameDirectionEndpointDistance = distanceBetween(firstTrack[0], secondTrackOriginal[0]) +
    distanceBetween(firstTrack.at(-1), secondTrackOriginal.at(-1));
  const reverseDirectionEndpointDistance = distanceBetween(firstTrack[0], secondTrackOriginal.at(-1)) +
    distanceBetween(firstTrack.at(-1), secondTrackOriginal[0]);
  const reversedEndpointGaps = [
    distanceBetween(firstTrack[0], secondTrackOriginal.at(-1)),
    distanceBetween(firstTrack.at(-1), secondTrackOriginal[0])
  ];

  if (reverseDirectionEndpointDistance < sameDirectionEndpointDistance && Math.max(...reversedEndpointGaps) <= 8) {
    pass('track orientation', `reverse pairing is ${formatDistance(reverseDirectionEndpointDistance)} vs same-direction ${formatDistance(sameDirectionEndpointDistance)}`);
  } else {
    fail('track orientation', `ways do not form a clean reverse-oriented pair: reverse=${formatDistance(reverseDirectionEndpointDistance)}, same=${formatDistance(sameDirectionEndpointDistance)}`);
  }

  const samples = Array.from({ length: 1001 }, (_, index) => {
    const progress = index / 1000;
    const firstPoint = pointAt(firstTrack, progress);
    const secondPoint = pointAt(secondTrack, progress);
    return {
      progress,
      firstPoint,
      secondPoint,
      center: [
        (firstPoint[0] + secondPoint[0]) / 2,
        (firstPoint[1] + secondPoint[1]) / 2
      ],
      separation: distanceBetween(firstPoint, secondPoint)
    };
  });
  const separationValues = samples.map((sample) => sample.separation);
  const separationMin = Math.min(...separationValues);
  const separationMax = Math.max(...separationValues);
  const separationMedian = percentile(separationValues, 0.5);

  if (separationMin > 0.5 && separationMax < 20) {
    pass('track separation', `min=${formatDistance(separationMin)}, median=${formatDistance(separationMedian)}, max=${formatDistance(separationMax)}; non-degenerate source pair`);
  } else {
    fail('track separation', `unexpected source pair spacing: min=${formatDistance(separationMin)}, max=${formatDistance(separationMax)}`);
  }

  const crossoverSample = samples.reduce((nearest, sample) => (
    distanceBetween(sample.center, [0, 0]) < distanceBetween(nearest.center, [0, 0])
      ? sample
      : nearest
  ), samples[0]);
  console.log(`Crossover source position: local=(${crossoverSample.center[0].toFixed(2)}, ${crossoverSample.center[1].toFixed(2)})m, normalized progress=${crossoverSample.progress.toFixed(4)}, track separation=${formatDistance(crossoverSample.separation)}`);

  const centerline = samples.map((sample) => sample.center);
  const roads = (snapshot.roads ?? [])
    .filter((road) => isFiniteGeometry(road.geometry))
    .map((road) => ({ ...road, distance: geometryDistance(centerline, road.geometry) }))
    .sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id));
  const localRoads = roads.filter((road) => geometryIntersectsBox(
    road.geometry,
    crossoverBox.halfWidth,
    crossoverBox.halfLength
  ));
  const localRoadIntersections = localRoads.filter((road) => road.distance <= 0.05);
  const underpassRoads = localRoads.filter((road) => (
    road.tags?.layer === '-1' ||
    road.tags?.tunnel === 'yes' ||
    (road.tags?.name ?? '').toLowerCase().includes('underpass')
  ));

  console.log(`Crossover audit window: x=±${crossoverBox.halfWidth}m, z=±${crossoverBox.halfLength}m around the local origin`);
  if (localRoadIntersections.length) {
    pass('crossover plan intersections', `${localRoadIntersections.length} mapped road centerline(s) intersect the metro projection in the audit window`);
    for (const road of localRoadIntersections.slice(0, 12)) {
      console.log(`  ${featureLabel(road)} highway=${road.tags?.highway ?? 'n/a'} layer=${road.tags?.layer ?? 'unset'} tunnel=${road.tags?.tunnel ?? 'unset'}`);
    }
  } else {
    fail('crossover plan intersections', 'no mapped road centerline intersects the source metro projection in the audit window');
  }

  if (underpassRoads.length) {
    pass('crossover underpass evidence', `${underpassRoads.length} local road feature(s) carry underpass/layer=-1 evidence`);
    for (const road of underpassRoads.slice(0, 8)) {
      console.log(`  ${featureLabel(road)} distance=${formatDistance(road.distance)} layer=${road.tags?.layer ?? 'unset'} tunnel=${road.tags?.tunnel ?? 'unset'}`);
    }
  } else {
    warn('crossover underpass evidence', 'no local layer=-1/tunnel road was found in the source snapshot');
  }

  const footways = (snapshot.footways ?? [])
    .filter((footway) => isFiniteGeometry(footway.geometry))
    .map((footway) => ({ ...footway, distance: geometryDistance(centerline, footway.geometry) }))
    .sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id));
  const localFootways = footways.filter((footway) => geometryIntersectsBox(
    footway.geometry,
    crossoverBox.halfWidth,
    crossoverBox.halfLength
  ));
  if (localFootways.length) {
    pass('crossover footpath evidence', `${localFootways.length} mapped footway feature(s) enter the audit window; nearest plan distance ${formatDistance(localFootways[0].distance)}`);
    for (const footway of localFootways.slice(0, 8)) {
      console.log(`  ${featureLabel(footway)} distance=${formatDistance(footway.distance)} layer=${footway.tags?.layer ?? 'unset'}`);
    }
  } else {
    warn('crossover footpath evidence', 'no mapped footway enters the audit window');
  }

  const buildings = (snapshot.buildings ?? [])
    .filter((building) => isFiniteGeometry(building.geometry))
    .map((building) => ({ ...building, distance: geometryDistance(centerline, building.geometry) }))
    .sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id));
  const localBuildings = buildings.filter((building) => geometryIntersectsBox(
    building.geometry,
    crossoverBox.halfWidth,
    crossoverBox.halfLength
  ));
  const globalNearestBuilding = buildings[0];
  console.log(`Nearest source building on the full clipped metro alignment: ${globalNearestBuilding ? `${featureLabel(globalNearestBuilding)} at ${formatDistance(globalNearestBuilding.distance)}` : 'none'}`);
  console.log(`Nearest source building in the crossover window: ${localBuildings[0] ? `${featureLabel(localBuildings[0])} at ${formatDistance(localBuildings[0].distance)}` : 'none'}`);
  if (localBuildings.some((building) => building.distance <= 0.05)) {
    warn('crossover building clearance', 'a source building footprint touches the metro plan projection in the audit window; vertical clearance is not encoded by OSM here');
  } else {
    pass('crossover building clearance', `nearest local building plan distance ${formatDistance(localBuildings[0]?.distance ?? Number.POSITIVE_INFINITY)}`);
  }

  const verticalKeys = new Set(['ele', 'height', 'bridge:clearance', 'maxheight', 'min_height']);
  const metroVerticalEvidence = metroWayIds.flatMap((id) => {
    const tags = snapshotWays[id]?.tags ?? {};
    return Object.entries(tags)
      .filter(([key]) => verticalKeys.has(key))
      .map(([key, value]) => `${id}:${key}=${value}`);
  });
  if (metroVerticalEvidence.length) {
    pass('metro vertical source evidence', metroVerticalEvidence.join(', '));
  } else {
    warn('metro vertical source evidence', 'none; layer=2 is relative OSM topology, not a metre elevation or clearance measurement');
  }

  const supports = (snapshot.bridgeSupports ?? [])
    .filter((support) => isFinitePoint(support.position))
    .map((support) => ({
      ...support,
      distance: Math.min(
        pointToGeometryDistance(support.position, firstTrack),
        pointToGeometryDistance(support.position, secondTrack)
      )
    }))
    .sort((left, right) => left.distance - right.distance || left.id.localeCompare(right.id));
  const explicitMetroSupports = supports.filter((support) => (
    support.tags?.['bridge:support'] === 'pier' &&
    [support.name, ...Object.values(support.tags ?? {})].some((value) => /namma\s*metro/i.test(value ?? ''))
  ));
  const nearbySupports = supports.filter((support) => support.distance <= supportProximityWindow);
  if (explicitMetroSupports.length) {
    pass('metro support evidence', `${explicitMetroSupports.length} explicit Namma Metro support(s)`);
  } else {
    warn('metro support evidence', `0 explicit Namma Metro supports; ${supports.length} generic bridge pier point(s), ${nearbySupports.length} within ${supportProximityWindow}m of the metro alignment`);
  }
  for (const support of supports.slice(0, 8)) {
    console.log(`  nearest support ${support.id} ref=${support.tags?.ref ?? 'unset'} distance=${formatDistance(support.distance)}`);
  }

  if (rendererSource) {
    const readRendererConstant = (name) => {
      const value = rendererSource.match(new RegExp(`const\\s+${name}\\s*=\\s*(-?[0-9]+(?:\\.[0-9]+)?)\\s*;`))?.[1];
      return value === undefined ? null : Number(value);
    };
    const rendererContract = {
      deckCenterY: readRendererConstant('METRO_DECK_CENTER_Y'),
      deckWidth: readRendererConstant('METRO_DECK_WIDTH'),
      trackWidth: readRendererConstant('METRO_TRACK_WIDTH'),
      pierSpacing: readRendererConstant('METRO_PIER_SPACING'),
      minSoffitY: readRendererConstant('METRO_MIN_SOFFIT_Y'),
      underdeckCenterDrop: readRendererConstant('METRO_UNDERDECK_CENTER_DROP'),
      underdeckHeight: readRendererConstant('METRO_UNDERDECK_HEIGHT'),
      pierCapHeight: readRendererConstant('METRO_PIER_CAP_HEIGHT'),
      pierCapDepth: readRendererConstant('METRO_PIER_CAP_DEPTH'),
      pierShaftRadius: readRendererConstant('METRO_PIER_SHAFT_RADIUS'),
      pierBaseRadius: readRendererConstant('METRO_PIER_BASE_RADIUS'),
      pierBaseTopY: readRendererConstant('METRO_PIER_BASE_TOP_Y'),
      pierBuildingBuffer: readRendererConstant('METRO_PIER_BUILDING_BUFFER'),
      minSourcePierSpacing: readRendererConstant('METRO_MIN_SOURCE_PIER_SPACING'),
      bearingBaseHeight: readRendererConstant('METRO_BEARING_BASE_HEIGHT'),
      bearingPadHeight: readRendererConstant('METRO_BEARING_PAD_HEIGHT'),
      bearingToDeckClearance: readRendererConstant('METRO_BEARING_TO_DECK_CLEARANCE'),
      referenceRoadDeckTopY: readRendererConstant('METRO_REFERENCE_ROAD_DECK_TOP_Y'),
      referenceRoadClearanceBuffer: readRendererConstant('METRO_REFERENCE_ROAD_CLEARANCE_BUFFER'),
      clearHalfLength: readRendererConstant('METRO_JUNCTION_CLEAR_HALF_LENGTH'),
      clearHalfWidth: readRendererConstant('METRO_JUNCTION_CLEAR_HALF_WIDTH')
    };
    const missingRendererConstants = Object.entries(rendererContract)
      .filter(([, value]) => value === null)
      .map(([name]) => name);
    if (!missingRendererConstants.length) {
      const modelledUnderdeckBottom = rendererContract.deckCenterY -
        rendererContract.underdeckCenterDrop - rendererContract.underdeckHeight / 2;
      const modelledBearingStackHeight = rendererContract.bearingBaseHeight +
        rendererContract.bearingPadHeight;
      const modelledPierCapTop = modelledUnderdeckBottom - modelledBearingStackHeight -
        rendererContract.bearingToDeckClearance;
      const modelledPierCapBottom = modelledPierCapTop - rendererContract.pierCapHeight;
      const modelledPierColumnTop = modelledPierCapBottom + 0.08;
      const modelledRoadDeckClearance = modelledUnderdeckBottom - rendererContract.referenceRoadDeckTopY;
      const sourceSeparation = separationMedian;
      const deckEnvelope = sourceSeparation + rendererContract.trackWidth;

      console.log(`Renderer model contract (not survey evidence): deck center Y=${rendererContract.deckCenterY.toFixed(2)}m, pier spacing=${rendererContract.pierSpacing.toFixed(1)}m, crossover clear box=±${rendererContract.clearHalfWidth.toFixed(1)}m x ±${rendererContract.clearHalfLength.toFixed(1)}m`);
      console.log(`Renderer model clearance (not survey evidence): underdeck bottom ≈${modelledUnderdeckBottom.toFixed(2)}m, ${modelledRoadDeckClearance.toFixed(2)}m above modeled road-viaduct datum, bearing stack=${modelledBearingStackHeight.toFixed(2)}m`);

      if (modelledUnderdeckBottom >= rendererContract.minSoffitY &&
          modelledRoadDeckClearance >= rendererContract.referenceRoadClearanceBuffer) {
        pass('renderer road-clearance contract', `underdeck ≈${modelledUnderdeckBottom.toFixed(2)}m clears the ${rendererContract.minSoffitY.toFixed(2)}m grade baseline and the ${rendererContract.referenceRoadClearanceBuffer.toFixed(2)}m modeled crossing buffer`);
      } else {
        fail('renderer road-clearance contract', `underdeck ≈${modelledUnderdeckBottom.toFixed(2)}m does not satisfy the modeled grade/road clearance contract`);
      }
      warn('renderer/source elevation gap', `vertical values remain renderer assumptions: source supplies layer=2 only, with no metre elevation or clearance evidence; ${formatDistance(modelledRoadDeckClearance)} is a modeled comparison, not a survey`);

      if (rendererContract.deckWidth >= deckEnvelope &&
          rendererContract.pierCapDepth >= 1.2 &&
          rendererContract.pierShaftRadius < rendererContract.pierBaseRadius &&
          rendererContract.pierCapHeight > 0 &&
          rendererContract.pierSpacing > 0 &&
          rendererContract.minSourcePierSpacing > 0) {
        pass('renderer structural proportions', `paired source tracks fit within ${rendererContract.deckWidth.toFixed(2)}m deck (source separation median ${sourceSeparation.toFixed(2)}m); tapered shaft/base, ${rendererContract.pierCapDepth.toFixed(2)}m crosshead depth, and positive stationing are coherent model dimensions`);
      } else {
        fail('renderer structural proportions', 'deck envelope, pier taper, crosshead depth, or stationing constants are incoherent');
      }

      const bearingTop = modelledPierCapTop + modelledBearingStackHeight;
      if (modelledPierColumnTop > rendererContract.pierBaseTopY &&
          bearingTop <= modelledUnderdeckBottom - rendererContract.bearingToDeckClearance + 0.001) {
        pass('renderer bearing ordering', `modeled shaft reaches cap, and bearing stack ends ${formatDistance(modelledUnderdeckBottom - bearingTop)} below the underdeck`);
      } else {
        fail('renderer bearing ordering', 'modeled shaft/crosshead/bearing/underdeck vertical order is invalid');
      }

      const centerlineLength = lineLength(centerline);
      const buildingFootprints = buildings
        .filter((building) => isFiniteGeometry(building.geometry) && building.geometry.length >= 3)
        .map((building) => {
          const xs = building.geometry.map(([x]) => x);
          const zs = building.geometry.map(([, z]) => z);
          return {
            id: building.id,
            geometry: building.geometry,
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minZ: Math.min(...zs),
            maxZ: Math.max(...zs)
          };
        });
      const buildingCollisionRadius = rendererContract.pierBaseRadius + rendererContract.pierBuildingBuffer;
      const collidesWithSourceBuilding = (point) => buildingFootprints.some((building) => {
        if (
          point[0] < building.minX - buildingCollisionRadius ||
          point[0] > building.maxX + buildingCollisionRadius ||
          point[1] < building.minZ - buildingCollisionRadius ||
          point[1] > building.maxZ + buildingCollisionRadius
        ) return false;
        return pointToPolygonDistance(point, building.geometry) <= buildingCollisionRadius;
      });
      const fallbackStations = [];
      let skippedJunctionStations = 0;
      for (let distance = 14; distance < centerlineLength - 14; distance += rendererContract.pierSpacing) {
        const point = pointAt(centerline, distance / centerlineLength);
        if (Math.abs(point[1]) < rendererContract.clearHalfLength &&
            Math.abs(point[0]) < rendererContract.clearHalfWidth) {
          skippedJunctionStations += 1;
          continue;
        }
        fallbackStations.push(point);
      }
      const fallbackBuildingCollisions = fallbackStations.filter(collidesWithSourceBuilding);
      const safeFallbackStations = fallbackStations.filter((point) => !collidesWithSourceBuilding(point));

      if (explicitMetroSupports.length === 0) {
        if (safeFallbackStations.length > 2 && !rendererSource.includes('!isInsideSourceBuilding')) {
          fail('modelled pier placement', 'renderer does not visibly reject modelled stations against source building footprints');
        } else if (safeFallbackStations.length > 2) {
          pass('modelled pier placement', `${safeFallbackStations.length} rendered stations remain clear of the ${buildingCollisionRadius.toFixed(2)}m source-footprint buffer; ${fallbackBuildingCollisions.length} candidate(s) are intentionally rejected and ${skippedJunctionStations} station(s) are removed from the crossover clear box`);
        } else {
          fail('modelled pier placement', `${safeFallbackStations.length} safe stations remain after source-building and junction clearance filtering`);
        }
      } else {
        const projectedSupportPoints = explicitMetroSupports.map((support) => {
          let nearestPoint = centerline[0];
          let nearestDistance = Number.POSITIVE_INFINITY;
          for (let index = 1; index < centerline.length; index += 1) {
            const start = centerline[index - 1];
            const end = centerline[index];
            const dx = end[0] - start[0];
            const dz = end[1] - start[1];
            const lengthSquared = dx * dx + dz * dz;
            const progress = lengthSquared > 0
              ? Math.max(0, Math.min(1, ((support.position[0] - start[0]) * dx + (support.position[1] - start[1]) * dz) / lengthSquared))
              : 0;
            const candidate = [start[0] + progress * dx, start[1] + progress * dz];
            const distance = distanceBetween(support.position, candidate);
            if (distance < nearestDistance) {
              nearestPoint = candidate;
              nearestDistance = distance;
            }
          }
          return { id: support.id, point: nearestPoint, offset: nearestDistance };
        });
        const invalidProjectedSupports = projectedSupportPoints.filter(({ point, offset }) => (
          offset > supportProximityWindow ||
          (Math.abs(point[1]) < rendererContract.clearHalfLength && Math.abs(point[0]) < rendererContract.clearHalfWidth) ||
          collidesWithSourceBuilding(point)
        ));
        if (invalidProjectedSupports.length === 0) {
          pass('source pier placement', `${projectedSupportPoints.length} explicit metro support(s) are centerline-projected and avoid the junction/building clearance contracts`);
        } else {
          fail('source pier placement', `${invalidProjectedSupports.length} explicit metro support projection(s) violate offset, junction, or source-building clearance`);
        }
      }
    } else {
      fail('renderer contract', `could not read constants: ${missingRendererConstants.join(', ')}`);
    }
  }
}

console.log(`Summary: ${failures.length} failure(s), ${warnings.length} warning(s)`);
if (failures.length) process.exitCode = 1;

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, '..');
const snapshotPath = path.join(projectDirectory, 'public/data/marathahalli-demo.json');
const metroWayIds = ['way/1551136768', 'way/1551136770'];
const proximityThresholds = {
  roads: 10,
  buildings: 8,
  footways: 6
};

const fail = (message) => {
  console.error(`ERROR ${message}`);
  process.exitCode = 1;
};

const isFinitePoint = (point) => (
  Array.isArray(point) && point.length >= 2 &&
  Number.isFinite(point[0]) && Number.isFinite(point[1])
);

const isFiniteGeometry = (geometry) => (
  Array.isArray(geometry) && geometry.length >= 2 && geometry.every(isFinitePoint)
);

const distanceBetween = (left, right) => Math.hypot(left[0] - right[0], left[1] - right[1]);

const pointToSegmentDistance = (point, start, end) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return distanceBetween(point, start);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) / lengthSquared));
  return distanceBetween(point, [start[0] + t * dx, start[1] + t * dz]);
};

const orientation = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

const segmentsIntersect = (a, b, c, d) => {
  const epsilon = 1e-9;
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);
  const onSegment = (start, point, end) => (
    Math.min(start[0], end[0]) - epsilon <= point[0] && point[0] <= Math.max(start[0], end[0]) + epsilon &&
    Math.min(start[1], end[1]) - epsilon <= point[1] && point[1] <= Math.max(start[1], end[1]) + epsilon
  );
  return (abC * abD < 0 && cdA * cdB < 0) ||
    (Math.abs(abC) <= epsilon && onSegment(a, c, b)) ||
    (Math.abs(abD) <= epsilon && onSegment(a, d, b)) ||
    (Math.abs(cdA) <= epsilon && onSegment(c, a, d)) ||
    (Math.abs(cdB) <= epsilon && onSegment(c, b, d));
};

const geometryDistance = (leftGeometry, rightGeometry) => {
  let nearest = Number.POSITIVE_INFINITY;
  for (let leftIndex = 0; leftIndex < leftGeometry.length - 1; leftIndex += 1) {
    const leftStart = leftGeometry[leftIndex];
    const leftEnd = leftGeometry[leftIndex + 1];
    for (let rightIndex = 0; rightIndex < rightGeometry.length - 1; rightIndex += 1) {
      const rightStart = rightGeometry[rightIndex];
      const rightEnd = rightGeometry[rightIndex + 1];
      if (segmentsIntersect(leftStart, leftEnd, rightStart, rightEnd)) return 0;
      nearest = Math.min(
        nearest,
        pointToSegmentDistance(leftStart, rightStart, rightEnd),
        pointToSegmentDistance(rightStart, leftStart, leftEnd)
      );
    }
  }
  return nearest;
};

const nearestFeatureWarnings = (metroGeometry, features, threshold) => features
  .filter((feature) => isFiniteGeometry(feature.geometry))
  .map((feature) => ({
    id: feature.id,
    name: feature.tags?.name ?? 'unnamed',
    distance: geometryDistance(metroGeometry, feature.geometry)
  }))
  .filter((feature) => feature.distance <= threshold)
  .sort((left, right) => left.distance - right.distance);

let snapshot;
try {
  snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
} catch (error) {
  fail(`could not load ${path.relative(projectDirectory, snapshotPath)}: ${error.message}`);
  process.exit();
}

const railways = Array.isArray(snapshot.railways) ? snapshot.railways : [];
const roads = Array.isArray(snapshot.roads) ? snapshot.roads : [];
const buildings = Array.isArray(snapshot.buildings) ? snapshot.buildings : [];
const footways = Array.isArray(snapshot.footways) ? snapshot.footways : [];
const metroWays = metroWayIds.map((id) => railways.find((way) => way.id === id));

console.log('Metro geometry audit (read-only; local OSM snapshot)');
console.log(`Snapshot: ${path.relative(projectDirectory, snapshotPath)}`);
console.log(`Source ways: ${metroWayIds.join(', ')}`);

for (const [index, way] of metroWays.entries()) {
  const id = metroWayIds[index];
  if (!way) {
    fail(`${id} is missing from railways`);
    continue;
  }
  const finite = isFiniteGeometry(way.geometry);
  const sourceTagged = way.tags?.network === 'Namma Metro' && way.tags?.railway === 'subway';
  const length = finite
    ? way.geometry.slice(1).reduce((total, point, pointIndex) => total + distanceBetween(point, way.geometry[pointIndex]), 0)
    : 0;
  console.log(`${id}: ${finite && sourceTagged ? 'PASS' : 'FAIL'} (${way.geometry?.length ?? 0} points, ${length.toFixed(1)}m)${way.tags?.network ? `, network=${way.tags.network}` : ''}`);
  if (!finite) fail(`${id} has missing, too-short, or non-finite geometry`);
  if (!sourceTagged) fail(`${id} is not tagged as Namma Metro subway geometry`);
}

const explicitSupports = (Array.isArray(snapshot.bridgeSupports) ? snapshot.bridgeSupports : []).filter((support) => {
  const tags = support.tags ?? {};
  const searchableTags = `${tags.network ?? ''} ${tags.operator ?? ''} ${tags.name ?? ''} ${tags.ref ?? ''}`;
  return tags['bridge:support'] && /namma\s*metro/i.test(searchableTags);
});

console.log(`Explicit Namma Metro supports: ${explicitSupports.length > 0 ? `YES (${explicitSupports.length})` : 'NO'}`);
console.log('Fallback support geometry: not audited as surveyed; any modelled 28m pier grid remains approximate.');

if (metroWays.every((way) => way && isFiniteGeometry(way.geometry) && way.tags?.network === 'Namma Metro' && way.tags?.railway === 'subway')) {
  const metroGeometry = metroWays.flatMap((way) => way.geometry);
  const warningGroups = [
    ['roads', roads, proximityThresholds.roads],
    ['buildings', buildings, proximityThresholds.buildings],
    ['footways', footways, proximityThresholds.footways]
  ];

  for (const [label, features, threshold] of warningGroups) {
    const warnings = nearestFeatureWarnings(metroGeometry, features, threshold);
    console.log(`Proximity warnings (${label} <= ${threshold}m): ${warnings.length}`);
    for (const warning of warnings.slice(0, 10)) {
      console.log(`  WARN ${warning.id} ${JSON.stringify(warning.name)} at ${warning.distance.toFixed(1)}m`);
    }
    if (warnings.length > 10) console.log(`  ... ${warnings.length - 10} more`);
  }
}

if (process.exitCode) process.exit(process.exitCode);

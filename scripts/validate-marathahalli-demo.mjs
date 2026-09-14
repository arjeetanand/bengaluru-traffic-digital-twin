import { readFile } from 'node:fs/promises';
import path from 'node:path';

const datasetPath = path.join(process.cwd(), 'public', 'data', 'marathahalli-demo.json');
const dataset = JSON.parse(await readFile(datasetPath, 'utf8'));
const errors = [];
const warnings = [];

const requiredCollections = [
  'buildings', 'roads', 'footways', 'shops', 'places', 'signals', 'crossings', 'busStops', 'trees', 'bridgeSupports', 'railways'
];

function finite(value, label) {
  if (!Number.isFinite(value)) errors.push(`${label} must be finite`);
}

function checkPosition(position, label) {
  if (!Array.isArray(position) || position.length !== 2) {
    errors.push(`${label} must be [x,z]`);
    return;
  }
  finite(position[0], `${label}[0]`);
  finite(position[1], `${label}[1]`);
}

function checkGeometry(geometry, label) {
  if (!Array.isArray(geometry) || geometry.length < 2) {
    errors.push(`${label} must contain at least two points`);
    return;
  }
  geometry.forEach((position, index) => checkPosition(position, `${label}[${index}]`));
}

if (![1, 2].includes(dataset.schemaVersion)) errors.push('unsupported schemaVersion');
if (dataset.source?.provider !== 'OpenStreetMap') errors.push('source.provider must be OpenStreetMap');
if (!dataset.source?.attribution?.includes('OpenStreetMap contributors')) errors.push('OSM attribution is missing');
if (dataset.source?.license !== 'ODbL-1.0') errors.push('OSM license must be ODbL-1.0');

for (const key of ['lat', 'lon']) finite(dataset.origin?.[key], `origin.${key}`);
for (const key of ['minLat', 'minLon', 'maxLat', 'maxLon']) finite(dataset.bounds?.[key], `bounds.${key}`);
if (dataset.bounds?.minLat >= dataset.bounds?.maxLat) errors.push('latitude bounds are inverted');
if (dataset.bounds?.minLon >= dataset.bounds?.maxLon) errors.push('longitude bounds are inverted');

for (const collection of requiredCollections) {
  if (!Array.isArray(dataset[collection])) {
    errors.push(`${collection} collection is missing`);
    continue;
  }
  const ids = new Set();
  for (const feature of dataset[collection]) {
    if (!feature.id) errors.push(`${collection} feature is missing id`);
    if (ids.has(feature.id)) errors.push(`${collection} contains duplicate id ${feature.id}`);
    ids.add(feature.id);
    if (collection === 'shops' || collection === 'signals' || collection === 'crossings' || collection === 'busStops' || collection === 'trees' || collection === 'bridgeSupports') {
      checkPosition(feature.position, `${collection}.${feature.id}.position`);
    } else {
      checkGeometry(feature.geometry, `${collection}.${feature.id}.geometry`);
    }
  }
}

// These are the geometry anchors that make this demo a Marathahalli
// reconstruction rather than a generic junction. Keep the checks close to the
// serialized source data so a refreshed extract cannot silently restore the
// old east-west skywalk or mirrored ORR traffic directions.
const skywalkDeck = dataset.footways.find((feature) => feature.id === 'way/323729567');
if (!skywalkDeck) {
  errors.push('Marathahalli Skywalk source way/323729567 is missing');
} else {
  const [start, end] = [skywalkDeck.geometry[0], skywalkDeck.geometry.at(-1)];
  const deltaX = end[0] - start[0];
  const deltaZ = end[1] - start[1];
  if (Math.abs(deltaZ) <= Math.abs(deltaX)) {
    errors.push('Marathahalli Skywalk must run predominantly north-south in local coordinates');
  }
  if (skywalkDeck.tags?.bridge !== 'viaduct') {
    warnings.push('Marathahalli Skywalk source way is missing bridge=viaduct');
  }
}

for (const stairAnchor of [
  { id: 'way/323729569', expectedSteps: 27 },
  { id: 'way/323729566', expectedSteps: 42 }
]) {
  const stair = dataset.footways.find((feature) => feature.id === stairAnchor.id);
  if (!stair) {
    errors.push(`Marathahalli Skywalk stair ${stairAnchor.id} is missing`);
  } else if (Number(stair.tags?.step_count) !== stairAnchor.expectedSteps) {
    errors.push(`${stairAnchor.id} must preserve step_count=${stairAnchor.expectedSteps}`);
  }
}

const directionAnchors = [
  { id: 'way/376784366', label: 'ORR northbound source way', expectsIncreasingZ: true },
  { id: 'way/380787519', label: 'ORR southbound source way', expectsIncreasingZ: false }
];
for (const anchor of directionAnchors) {
  const road = dataset.roads.find((feature) => feature.id === anchor.id);
  if (!road) {
    errors.push(`${anchor.label} ${anchor.id} is missing`);
    continue;
  }
  const firstZ = road.geometry[0][1];
  const lastZ = road.geometry.at(-1)[1];
  const isIncreasingZ = lastZ > firstZ;
  if (isIncreasingZ !== anchor.expectsIncreasingZ) {
    errors.push(`${anchor.label} direction no longer matches the source way order`);
  }
}

// These are the current source-backed Namma Metro Phase 2A through tracks.
// They are long ways that cross the clip boundary, so this check catches a
// compiler regression that would silently replace the physical alignment with
// a hand-authored shortcut in the 3D scene.
for (const metroWayId of ['way/1551136768', 'way/1551136770']) {
  const metroWay = dataset.railways.find((feature) => feature.id === metroWayId);
  if (!metroWay) {
    errors.push(`Namma Metro source way ${metroWayId} is missing`);
  } else {
    if (metroWay.geometry.length < 10) errors.push(`${metroWayId} has too few clipped source points`);
    if (metroWay.tags?.name !== 'Namma Metro - Phase 2A') errors.push(`${metroWayId} lost its source name`);
    if (metroWay.tags?.bridge !== 'viaduct') warnings.push(`${metroWayId} is missing bridge=viaduct`);
  }
}

if (dataset.schemaVersion >= 2) {
  if (!Array.isArray(dataset.turnRestrictions)) {
    errors.push('turnRestrictions collection is missing');
  } else {
    const restrictionIds = new Set();
    const sourceWayIds = new Set(dataset.roads.map((feature) => feature.id));
    for (const restriction of dataset.turnRestrictions) {
      if (!restriction.id || !restriction.restriction || !Array.isArray(restriction.members)) {
        errors.push('turn restriction is missing id, restriction, or members');
        continue;
      }
      if (restrictionIds.has(restriction.id)) errors.push(`turnRestrictions contains duplicate id ${restriction.id}`);
      restrictionIds.add(restriction.id);
      if (!restriction.members.some((member) => member.role === 'from')) {
        errors.push(`${restriction.id} is missing a from member`);
      }
      if (!restriction.members.some((member) => member.role === 'to')) {
        errors.push(`${restriction.id} is missing a to member`);
      }
      for (const member of restriction.members) {
        if (member.type === 'way' && !sourceWayIds.has(member.ref)) {
          errors.push(`${restriction.id} references missing source road ${member.ref}`);
        }
      }
    }
    if (dataset.stats?.turnRestrictions !== dataset.turnRestrictions.length) {
      errors.push('stats.turnRestrictions does not match the serialized collection');
    }
    if (!dataset.turnRestrictions.some((restriction) => restriction.restriction === 'no_u_turn')) {
      warnings.push('no no_u_turn relation is present in the clipped snapshot');
    }
  }
}

const snapshotStats = dataset.stats || {};
for (const collection of requiredCollections) {
  if (snapshotStats[collection] !== dataset[collection]?.length) {
    errors.push(`stats.${collection} does not match the serialized collection`);
  }
}

if (dataset.roads.length < 100) warnings.push(`only ${dataset.roads.length} road ways are in the clipped snapshot`);
if (dataset.footways.length < 50) warnings.push(`only ${dataset.footways.length} footway ways are in the clipped snapshot`);
if (dataset.shops.length < 20) warnings.push(`only ${dataset.shops.length} POIs are in the clipped snapshot`);
if (dataset.bridgeSupports.length < 50) warnings.push(`only ${dataset.bridgeSupports.length} source bridge supports are in the clipped snapshot`);
for (const landmark of dataset.coverage?.landmarks || []) {
  if (!landmark.sourceBacked) warnings.push(`${landmark.name} is not source-backed in this snapshot`);
}

if (errors.length) {
  console.error('Marathahalli demo validation failed');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Marathahalli demo validation passed');
}

console.log(JSON.stringify({
  stats: dataset.stats,
  warnings
}, null, 2));

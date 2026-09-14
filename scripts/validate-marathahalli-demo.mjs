import { readFile } from 'node:fs/promises';
import path from 'node:path';

const datasetPath = path.join(process.cwd(), 'public', 'data', 'marathahalli-demo.json');
const dataset = JSON.parse(await readFile(datasetPath, 'utf8'));
const errors = [];
const warnings = [];

const requiredCollections = [
  'buildings', 'roads', 'footways', 'shops', 'places', 'signals', 'crossings', 'busStops', 'trees', 'railways'
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
    if (collection === 'shops' || collection === 'signals' || collection === 'crossings' || collection === 'busStops' || collection === 'trees') {
      checkPosition(feature.position, `${collection}.${feature.id}.position`);
    } else {
      checkGeometry(feature.geometry, `${collection}.${feature.id}.geometry`);
    }
  }
}

if (dataset.schemaVersion >= 2) {
  if (!Array.isArray(dataset.turnRestrictions)) {
    errors.push('turnRestrictions collection is missing');
  } else {
    const restrictionIds = new Set();
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

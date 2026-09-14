import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const registryPath = resolve('src/data/bellandur-marathahalli-corridor.json');
const registry = JSON.parse(await readFile(registryPath, 'utf8'));
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function leafPaths(value, prefix = '') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) => (
    leafPaths(child, prefix ? `${prefix}.${key}` : key)
  ));
}

function validateProvenance(record, label) {
  const data = Object.fromEntries(Object.entries(record).filter(([key]) => (
    key !== 'provenance' && key !== 'sourceRefs'
  )));
  const actualPaths = new Set(leafPaths(data));
  const provenancePaths = new Set(Object.keys(record.provenance || {}));

  for (const path of actualPaths) {
    assert(provenancePaths.has(path), `${label}: missing provenance for ${path}`);
    if (provenancePaths.has(path)) {
      assert(
        ['MEASURED', 'DERIVED', 'ASSUMED'].includes(record.provenance[path]),
        `${label}: invalid provenance tag for ${path}`
      );
    }
  }

  for (const path of provenancePaths) {
    assert(actualPaths.has(path), `${label}: provenance path has no field ${path}`);
  }

  assert(Array.isArray(record.sourceRefs) && record.sourceRefs.length > 0, `${label}: sourceRefs missing`);
  for (const sourceRef of record.sourceRefs || []) {
    assert(Boolean(registry.sources?.[sourceRef]), `${label}: unknown source ${sourceRef}`);
  }
}

function validateCoordinate(record, label) {
  const coordinate = record.coordinate;
  assert(coordinate && Number.isFinite(coordinate.lat), `${label}: latitude missing`);
  assert(coordinate && Number.isFinite(coordinate.lon), `${label}: longitude missing`);
  assert(record.approximate === true, `${label}: coordinate must be explicitly approximate`);
  if (coordinate) {
    assert(coordinate.lat >= 12.8 && coordinate.lat <= 13.1, `${label}: latitude outside Bengaluru guardrail`);
    assert(coordinate.lon >= 77.4 && coordinate.lon <= 77.9, `${label}: longitude outside Bengaluru guardrail`);
  }
}

function findForbiddenKeys(value, path = '') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(geometry|footprint|polygon|vertices|buildingParts|centerline)$/i.test(key)) {
      errors.push(`forbidden geometry field: ${path ? `${path}.` : ''}${key}`);
    }
    findForbiddenKeys(child, path ? `${path}.${key}` : key);
  }
}

assert(registry.schemaVersion === 1, 'schemaVersion must be 1');
assert(registry.registryId === 'bengaluru.bellandur-marathahalli', 'unexpected registryId');
assert(Array.isArray(registry.stops) && registry.stops.length >= 5, 'expected at least five named stops');
assert(Array.isArray(registry.attractors) && registry.attractors.length >= 8, 'expected required attractors');

for (const [index, stop] of (registry.stops || []).entries()) {
  const label = `stops[${index}] (${stop.id || 'unknown'})`;
  validateProvenance(stop, label);
  validateCoordinate(stop, label);
  assert(typeof stop.name === 'string' && stop.name.length > 0, `${label}: name missing`);
  assert(stop.osmObject?.url?.startsWith('https://www.openstreetmap.org/'), `${label}: OSM object URL missing`);
}

for (const [index, attractor] of (registry.attractors || []).entries()) {
  const label = `attractors[${index}] (${attractor.id || 'unknown'})`;
  validateProvenance(attractor, label);
  validateCoordinate(attractor, label);
  assert(typeof attractor.name === 'string' && attractor.name.length > 0, `${label}: name missing`);
  assert(['corridor', 'adjacent_context'].includes(attractor.scope), `${label}: invalid scope`);
  assert(attractor.osmObject?.url?.startsWith('https://www.openstreetmap.org/'), `${label}: OSM object URL missing`);
}

const requiredAttractors = [
  'RMZ Ecoworld',
  'Embassy TechVillage',
  'Ecospace',
  'Cessna Business Park',
  'Prestige Tech Park',
  'Salarpuria Softzone',
  'Bagmane Tech Park'
];
for (const requiredName of requiredAttractors) {
  assert(registry.attractors.some((attractor) => attractor.name === requiredName), `missing required attractor: ${requiredName}`);
}
assert(
  registry.attractors.some((attractor) => /Mahadevapura/.test(attractor.name)) &&
    registry.attractors.some((attractor) => /Hoodi/.test(attractor.name)),
  'missing Mahadevapura/Hoodi cluster anchors'
);

const latitudes = registry.stops.map((stop) => stop.coordinate.lat);
const southernmost = registry.stops[latitudes.indexOf(Math.min(...latitudes))];
const northernmost = registry.stops[latitudes.indexOf(Math.max(...latitudes))];
assert(southernmost.id === registry.coverage.southStopId, 'coverage southStopId is not southernmost anchor');
assert(northernmost.id === registry.coverage.northStopId, 'coverage northStopId is not northernmost anchor');

for (const [sourceId, source] of Object.entries(registry.sources || {})) {
  assert(typeof source.sourceUrl === 'string' && source.sourceUrl.startsWith('https://'), `${sourceId}: sourceUrl missing`);
  assert(typeof source.license === 'string' && source.license.length > 0, `${sourceId}: license note missing`);
  assert(typeof source.retrievedOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(source.retrievedOn), `${sourceId}: retrieval date missing`);
  assert(typeof source.processing === 'string' && source.processing.length > 0, `${sourceId}: processing note missing`);
  assert(typeof source.transformation === 'string' && source.transformation.length > 0, `${sourceId}: transformation note missing`);
}

findForbiddenKeys(registry);

if (errors.length > 0) {
  console.error(`Bellandur–Marathahalli registry validation failed (${errors.length} error(s))`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Bellandur–Marathahalli registry valid: ${registry.stops.length} stops, ${registry.attractors.length} attractors, ${Object.keys(registry.sources).length} sources`);
}

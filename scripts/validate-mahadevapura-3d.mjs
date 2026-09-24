import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('mahadevapura_osm.xml', root));
const north = JSON.parse(await readFile(new URL('public/data/mahadevapura-3d.json', root), 'utf8'));
const south = JSON.parse(await readFile(new URL('public/data/marathahalli-demo.json', root), 'utf8'));

assert.equal(north.source.inputSha256, `sha256:${createHash('sha256').update(source).digest('hex')}`);
assert.equal(north.source.license, 'ODbL-1.0');
assert.equal(north.source.licenseUrl, 'https://opendatacommons.org/licenses/odbl/1-0/');
assert.deepEqual(north.origin, south.origin);
assert.ok(north.bounds.minLat < south.bounds.maxLat && north.bounds.maxLat > 12.988);

const roads = north.roads.flatMap((road) => road.geometry);
for (const lat of [south.bounds.maxLat, 12.968, 12.974, 12.980]) {
  const connectorZ = (lat - north.origin.lat) * north.origin.metersPerDegree.lat;
  assert.ok(roads.some(([, z]) => Math.abs(z - connectorZ) < 60), `northern road geometry must cover latitude ${lat}`);
}

for (const [name, id, lat, lon] of [
  ['Bagmane World Technology Center', 'way/91237236', 12.9843034, 77.6946207],
  ['Google Ananta', 'way/1087930060', 12.982827, 77.6917293]
]) {
  const feature = [...north.campuses, ...north.buildings].find((item) => item.id === id);
  assert.equal(feature?.name, name, `${name} source geometry must be present`);
  const [x, z] = feature.centroid;
  const expectedX = (lon - north.origin.lon) * north.origin.metersPerDegree.lon;
  const expectedZ = (lat - north.origin.lat) * north.origin.metersPerDegree.lat;
  assert.ok(Math.hypot(x - expectedX, z - expectedZ) < 150, `${name} map anchor must match its source geometry`);
  assert.ok(north.roads.some((road) => road.geometry.some(([rx, rz]) => Math.hypot(rx - x, rz - z) < 300)), `${name} needs mapped approach roads`);
  const detailRadius = id === 'way/91237236' ? 650 : 450;
  const nearbyFootprints = north.buildings.filter((building) =>
    Math.hypot(building.centroid[0] - x, building.centroid[1] - z) < detailRadius
  );
  assert.ok(nearbyFootprints.length >= 50, `${name} needs enough mapped footprints for a legible 3D campus view`);
}

console.log(`Northern 3D validation passed: ${north.buildings.length} footprints, ${north.roads.length} roads, both campuses and connector`);

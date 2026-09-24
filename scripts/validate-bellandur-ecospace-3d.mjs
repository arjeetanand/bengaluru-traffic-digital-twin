import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const slice = JSON.parse(await readFile(new URL('public/data/bellandur-ecospace-3d.json', root), 'utf8'));
const existing = JSON.parse(await readFile(new URL('public/data/marathahalli-demo.json', root), 'utf8'));

assert.equal(slice.source.url, 'https://api.openstreetmap.org/api/0.6/map?bbox=77.675,12.919,77.696,12.941');
assert.match(slice.source.inputSha256, /^sha256:[a-f0-9]{64}$/);
if (process.argv[2]) {
  const source = await readFile(process.argv[2]);
  assert.equal(slice.source.inputSha256, `sha256:${createHash('sha256').update(source).digest('hex')}`);
}
assert.equal(slice.source.license, 'ODbL-1.0');
assert.equal(slice.source.attribution, '© OpenStreetMap contributors');
assert.equal(slice.source.attributionUrl, 'https://www.openstreetmap.org/copyright');
assert.deepEqual(slice.origin, existing.origin);
assert.ok(slice.buildings.length > 100 && slice.buildings.length <= 550, 'Ecospace massing must remain bounded');
assert.ok(slice.bounds.minLat < existing.bounds.minLat && slice.bounds.maxLat > existing.bounds.minLat);
assert.ok(slice.bounds.minLon < existing.bounds.minLon && slice.bounds.maxLon > existing.bounds.minLon);
const overlapMinLat = existing.bounds.minLat - existing.clipMarginDegrees;
const overlapMinLon = existing.bounds.minLon - existing.clipMarginDegrees;
for (const building of slice.buildings) {
  const lon = slice.origin.lon + building.centroid[0] / slice.origin.metersPerDegree.lon;
  const lat = slice.origin.lat + building.centroid[1] / slice.origin.metersPerDegree.lat;
  assert.ok(lat < overlapMinLat || lon < overlapMinLon, `duplicate building in existing source envelope: ${building.id}`);
  assert.ok(building.geometry.length >= 3 && building.height > 0, `invalid source massing: ${building.id}`);
}

const campus = slice.campuses.find((item) => item.id === 'way/361528993');
assert.equal(campus?.name, 'RMZ Ecospace');
assert.ok(campus.geometry.length >= 40, 'Ecospace needs its complete source boundary');
const expected = [
  (77.6805212 - slice.origin.lon) * slice.origin.metersPerDegree.lon,
  (12.9241373 - slice.origin.lat) * slice.origin.metersPerDegree.lat
];
assert.ok(Math.hypot(campus.centroid[0] - expected[0], campus.centroid[1] - expected[1]) < 150);

const roadPoints = slice.roads.flatMap((road) => road.geometry);
for (const lat of [12.924, 12.930, 12.936, existing.bounds.minLat]) {
  const z = (lat - slice.origin.lat) * slice.origin.metersPerDegree.lat;
  assert.ok(roadPoints.some(([, roadZ]) => Math.abs(roadZ - z) < 60), `mapped roads must cover latitude ${lat}`);
}
const overlapX = (existing.bounds.minLon - slice.origin.lon) * slice.origin.metersPerDegree.lon;
const overlapZ = (existing.bounds.minLat - slice.origin.lat) * slice.origin.metersPerDegree.lat;
assert.ok(roadPoints.some(([x, z]) => x > overlapX - 350 && z > overlapZ - 180 && z < overlapZ + 180), 'mapped roads must enter the existing 3D envelope');
assert.ok(slice.roads.some((road) => road.geometry.some(([x, z]) => Math.hypot(x - campus.centroid[0], z - campus.centroid[1]) < 250)), 'Ecospace needs mapped approach roads');
assert.ok(slice.buildings.filter((building) => Math.hypot(building.centroid[0] - campus.centroid[0], building.centroid[1] - campus.centroid[1]) < 500).length >= 40, 'Ecospace needs nearby source footprints');

console.log(`Bellandur/Ecospace 3D validation passed: ${slice.buildings.length} footprints, ${slice.roads.length} roads, campus and connector`);

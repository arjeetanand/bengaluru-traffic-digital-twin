import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const sourceUrl = 'https://api.openstreetmap.org/api/0.6/map?bbox=77.675,12.919,77.696,12.941';
const inputPath = process.argv[2];
if (!inputPath) throw new Error(`Download ${sourceUrl} and pass the XML file path to this compiler`);
const xml = await readFile(inputPath, 'utf8');
const existing = JSON.parse(await readFile(new URL('public/data/marathahalli-demo.json', root), 'utf8'));
const existingRoadIds = new Set(existing.roads.map((road) => road.id));
const attr = (text, key) => text.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1];
const boundsTag = xml.match(/<bounds\b([^>]*)\/>/)?.[1];
if (!boundsTag) throw new Error('Bellandur OSM extract has no bounds');
const bounds = Object.fromEntries(['minLat', 'minLon', 'maxLat', 'maxLon'].map((key) => [
  key, Number(attr(boundsTag, key.toLowerCase()))
]));
if (bounds.minLat !== 12.919 || bounds.minLon !== 77.675 || bounds.maxLat !== 12.941 || bounds.maxLon !== 77.696) {
  throw new Error('Bellandur OSM extract does not match the recorded source bbox');
}
const { origin } = existing;
const local = (lat, lon) => [
  Math.round((lon - origin.lon) * origin.metersPerDegree.lon * 10) / 10,
  Math.round((lat - origin.lat) * origin.metersPerDegree.lat * 10) / 10
];
const nodes = new Map();
let latestTimestamp = '';
for (const match of xml.matchAll(/<(?:node|way|relation)\b([^>]*)/g)) {
  const timestamp = attr(match[1], 'timestamp') || '';
  if (timestamp > latestTimestamp) latestTimestamp = timestamp;
}
for (const match of xml.matchAll(/<node\b([^>]*?)(?:\/>|>[\s\S]*?<\/node>)/g)) {
  const attrs = match[1];
  nodes.set(attr(attrs, 'id'), [Number(attr(attrs, 'lat')), Number(attr(attrs, 'lon'))]);
}
const tagsOf = (body) => Object.fromEntries([...body.matchAll(/<tag\b([^>]*)\/>/g)].map((match) => [
  attr(match[1], 'k'), (attr(match[1], 'v') || '').replaceAll('&amp;', '&')
]));
const buildings = [];
const roads = [];
const campuses = [];
for (const match of xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)) {
  const [attrs, body] = [match[1], match[2]];
  const id = `way/${attr(attrs, 'id')}`;
  const tags = tagsOf(body);
  if (!tags.building && !tags.highway && id !== 'way/361528993') continue;
  const points = [...body.matchAll(/<nd\b([^>]*)\/>/g)]
    .map((node) => nodes.get(attr(node[1], 'ref')))
    .filter(Boolean);
  if (points.length < 2) continue;
  // This ground mesh excludes structures and ways owned by the existing layer.
  const nonGround = (tags.bridge && tags.bridge !== 'no') || (tags.tunnel && tags.tunnel !== 'no') ||
    (tags.layer && Number(tags.layer) !== 0);
  if (tags.highway && !existingRoadIds.has(id) && !nonGround && tags.highway !== 'construction' && tags.highway !== 'proposed') {
    const runs = [];
    let run = [];
    for (const [lat, lon] of points) {
      if (lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon) {
        run.push(local(lat, lon));
      } else if (run.length) {
        runs.push(run);
        run = [];
      }
    }
    if (run.length) runs.push(run);
    const geometry = runs.sort((a, b) => b.length - a.length)[0];
    if (geometry?.length >= 2) roads.push({ id, kind: tags.highway, geometry });
  }
  if (!tags.building && id !== 'way/361528993') continue;
  // A complete source polygon is safer than a clipped, invented facade.
  if (points.length < 4 || points.some(([lat, lon]) => lat < bounds.minLat || lat > bounds.maxLat || lon < bounds.minLon || lon > bounds.maxLon)) continue;
  if (points[0][0] !== points.at(-1)[0] || points[0][1] !== points.at(-1)[1]) continue;
  const lat = points.reduce((total, point) => total + point[0], 0) / points.length;
  const lon = points.reduce((total, point) => total + point[1], 0) / points.length;
  // Existing source layer already owns the northeast overlap.
  if (tags.building && lat >= existing.bounds.minLat - existing.clipMarginDegrees && lon >= existing.bounds.minLon - existing.clipMarginDegrees) continue;
  const geometry = points.slice(0, -1).map(([vertexLat, vertexLon]) => local(vertexLat, vertexLon));
  if (geometry.length < 3) continue;
  const feature = { id, ...(tags.name ? { name: tags.name } : {}), centroid: local(lat, lon), geometry };
  if (id === 'way/361528993') campuses.push(feature);
  if (tags.building) {
    const height = Number.parseFloat(tags.height);
    const levels = Number.parseFloat(tags['building:levels']);
    const validHeight = Number.isFinite(height) && height > 0 && height < 300;
    const validLevels = Number.isFinite(levels) && levels > 0 && levels < 80;
    buildings.push({
      ...feature,
      height: validHeight ? height : validLevels ? levels * 3.2 : tags.building === 'office' ? 18 : 5,
      heightSource: validHeight ? 'osm:height' : validLevels ? 'osm:building:levels' : 'modelled:fallback'
    });
  }
}

const campus = campuses[0];
if (!campus) throw new Error('OSM extract is missing the RMZ Ecospace boundary');
const nearCampus = buildings.filter((building) => Math.hypot(
  building.centroid[0] - campus.centroid[0], building.centroid[1] - campus.centroid[1]
) < 620);
const grid = new Map();
for (const building of buildings) {
  const [x, z] = building.centroid;
  const key = `${Math.floor(x / 150)}:${Math.floor(z / 150)}`;
  const current = grid.get(key);
  if (!current || (building.name && !current.name) || (Boolean(building.name) === Boolean(current.name) && building.geometry.length > current.geometry.length)) {
    grid.set(key, building);
  }
}
const nearIds = new Set(nearCampus.map((building) => building.id));
const sampledBuildings = [...nearCampus, ...[...grid.values()].filter((building) => !nearIds.has(building.id))].slice(0, 550);

const dataset = {
  schemaVersion: 1,
  source: {
    provider: 'OpenStreetMap',
    url: sourceUrl,
    retrievedOn: new Date().toISOString().slice(0, 10),
    snapshotTimestamp: latestTimestamp,
    inputSha256: `sha256:${createHash('sha256').update(xml).digest('hex')}`,
    attribution: '© OpenStreetMap contributors',
    attributionUrl: 'https://www.openstreetmap.org/copyright',
    license: 'ODbL-1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/'
  },
  origin,
  bounds,
  buildings: sampledBuildings,
  roads,
  campuses
};
await writeFile(new URL('public/data/bellandur-ecospace-3d.json', root), JSON.stringify(dataset));
console.log(`Compiled Bellandur/Ecospace 3D: ${sampledBuildings.length} of ${buildings.length} footprints, ${roads.length} roads, ${campuses.length} campus outline`);

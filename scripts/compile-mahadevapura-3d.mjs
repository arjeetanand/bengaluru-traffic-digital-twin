import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const xml = await readFile(new URL('mahadevapura_osm.xml', root), 'utf8');
const south = JSON.parse(await readFile(new URL('public/data/marathahalli-demo.json', root), 'utf8'));
const attr = (text, key) => text.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1];
const boundsTag = xml.match(/<bounds\b([^>]*)\/>/)?.[1];
if (!boundsTag) throw new Error('Northern OSM extract has no bounds');
const bounds = Object.fromEntries(['minLat', 'minLon', 'maxLat', 'maxLon'].map((key) => [
  key, Number(attr(boundsTag, key.toLowerCase()))
]));
const { origin } = south;
const [metresLat, metresLon] = [origin.metersPerDegree.lat, origin.metersPerDegree.lon];
const local = (lat, lon) => [
  Math.round((lon - origin.lon) * metresLon * 10) / 10,
  Math.round((lat - origin.lat) * metresLat * 10) / 10
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
const renderRoadFromLat = south.bounds.maxLat - 0.001;
const renderBuildingFromLat = south.bounds.maxLat + south.clipMarginDegrees;
for (const match of xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)) {
  const [attrs, body] = [match[1], match[2]];
  const id = `way/${attr(attrs, 'id')}`;
  const tags = tagsOf(body);
  if (!tags.building && !tags.highway && id !== 'way/91237236') continue;
  const points = [...body.matchAll(/<nd\b([^>]*)\/>/g)]
    .map((node) => nodes.get(attr(node[1], 'ref')))
    .filter(Boolean);
  if (points.length < 2) continue;
  if (tags.highway && tags.highway !== 'construction' && tags.highway !== 'proposed') {
    const runs = [];
    let run = [];
    for (const point of points) {
      const [lat, lon] = point;
      if (lat >= renderRoadFromLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon) {
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
  if (!tags.building && id !== 'way/91237236') continue;
  // Keep whole source polygons. Clipping a building would invent a facade.
  if (points.length < 4 || points.some(([lat, lon]) => lat < bounds.minLat || lat > bounds.maxLat || lon < bounds.minLon || lon > bounds.maxLon)) continue;
  if (points[0][0] !== points.at(-1)[0] || points[0][1] !== points.at(-1)[1]) continue;
  const lat = points.reduce((total, point) => total + point[0], 0) / points.length;
  const lon = points.reduce((total, point) => total + point[1], 0) / points.length;
  if (lat < renderBuildingFromLat && id !== 'way/91237236') continue;
  const geometry = points.slice(0, -1).map(([vertexLat, vertexLon]) => local(vertexLat, vertexLon));
  if (geometry.length < 3) continue;
  const name = tags.name;
  const feature = { id, ...(name ? { name } : {}), centroid: local(lat, lon), geometry };
  if (id === 'way/91237236') campuses.push(feature);
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

const dataset = {
  schemaVersion: 1,
  source: {
    provider: 'OpenStreetMap',
    url: 'https://api.openstreetmap.org/api/0.6/map?bbox=77.687,12.960,77.707,12.990',
    retrievedOn: '2026-09-25',
    snapshotTimestamp: latestTimestamp,
    inputSha256: `sha256:${createHash('sha256').update(xml).digest('hex')}`,
    attribution: '© OpenStreetMap contributors',
    license: 'ODbL-1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    attributionUrl: 'https://www.openstreetmap.org/copyright'
  },
  origin,
  bounds,
  buildings,
  roads,
  campuses
};
await writeFile(new URL('public/data/mahadevapura-3d.json', root), JSON.stringify(dataset));
console.log(`Compiled northern 3D: ${buildings.length} footprints, ${roads.length} roads, ${campuses.length} campus outlines`);

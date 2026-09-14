import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const inputPath = path.join(projectRoot, 'marathahalli_osm.xml');
const outputPath = path.join(projectRoot, 'public', 'data', 'marathahalli-demo.json');

const xml = await readFile(inputPath, 'utf8');

function attr(attrs, key) {
  const match = attrs.match(new RegExp(`\\b${key}="([^"]*)"`));
  return match ? decodeEntities(match[1]) : undefined;
}

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function parseTags(body = '') {
  const tags = {};
  for (const match of body.matchAll(/<tag\b([^>]*)\/?>/g)) {
    const key = attr(match[1], 'k');
    const value = attr(match[1], 'v');
    if (key && value !== undefined) tags[key] = value;
  }
  return tags;
}

const boundsMatch = xml.match(/<bounds\b([^>]*)\/>/);
if (!boundsMatch) throw new Error('OSM snapshot is missing its bounds element');

const sourceBounds = {
  minLat: Number(attr(boundsMatch[1], 'minlat')),
  minLon: Number(attr(boundsMatch[1], 'minlon')),
  maxLat: Number(attr(boundsMatch[1], 'maxlat')),
  maxLon: Number(attr(boundsMatch[1], 'maxlon'))
};

const origin = { lat: 12.956840, lon: 77.701176 };
const metersPerDegreeLat = 110590;
const metersPerDegreeLon = 108485;
const clipMarginDegrees = 0.0015;

function toLocal(lat, lon) {
  return [
    Math.round((lon - origin.lon) * metersPerDegreeLon * 10) / 10,
    Math.round((lat - origin.lat) * metersPerDegreeLat * 10) / 10
  ];
}

function inClip(lat, lon) {
  return lat >= sourceBounds.minLat - clipMarginDegrees &&
    lat <= sourceBounds.maxLat + clipMarginDegrees &&
    lon >= sourceBounds.minLon - clipMarginDegrees &&
    lon <= sourceBounds.maxLon + clipMarginDegrees;
}

function compactTags(tags) {
  const allowed = [
    'highway', 'name', 'ref', 'surface', 'lanes', 'maxspeed', 'oneway', 'sidewalk',
    'foot', 'bicycle', 'building', 'building:levels', 'height', 'shop', 'amenity',
    'public_transport', 'railway', 'bridge', 'tunnel', 'crossing', 'crossing:markings',
    'natural', 'barrier', 'lit', 'operator', 'addr:street', 'addr:housenumber', 'landuse',
    'traffic_signals'
  ];
  return Object.fromEntries(allowed.filter((key) => tags[key] !== undefined).map((key) => [key, tags[key]]));
}

const nodes = new Map();
let latestTimestamp = '';

for (const match of xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)) {
  const attrs = match[1];
  const lat = Number(attr(attrs, 'lat'));
  const lon = Number(attr(attrs, 'lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  const timestamp = attr(attrs, 'timestamp') || '';
  if (timestamp > latestTimestamp) latestTimestamp = timestamp;
  nodes.set(attr(attrs, 'id'), {
    lat,
    lon,
    tags: compactTags(parseTags(match[2] || ''))
  });
}

function parseWay(match) {
  const attrs = match[1];
  const body = match[2] || '';
  const refs = [...body.matchAll(/<nd\b([^>]*)\/>/g)]
    .map((nodeMatch) => attr(nodeMatch[1], 'ref'))
    .filter(Boolean);
  const points = refs.map((ref) => nodes.get(ref)).filter(Boolean);
  if (points.length < 2 || !points.every((point) => inClip(point.lat, point.lon))) return null;
  const geometry = points.map((point) => toLocal(point.lat, point.lon));
  const sum = points.reduce((acc, point) => [acc[0] + point.lat, acc[1] + point.lon], [0, 0]);
  const centroid = toLocal(sum[0] / points.length, sum[1] / points.length);
  const tags = compactTags(parseTags(body));
  const id = attr(attrs, 'id');
  if (!id) return null;
  return { id: `way/${id}`, tags, geometry, centroid };
}

const ways = [];
for (const match of xml.matchAll(/<way\b([^>]*)>([\s\S]*?)<\/way>/g)) {
  const way = parseWay(match);
  if (way) ways.push(way);
}

const pointFeatures = [];
for (const [id, node] of nodes) {
  if (!inClip(node.lat, node.lon)) continue;
  const [x, z] = toLocal(node.lat, node.lon);
  const feature = {
    id: `node/${id}`,
    name: node.tags.name,
    tags: node.tags,
    position: [x, z]
  };
  pointFeatures.push({ ...feature, lat: node.lat, lon: node.lon });
}

const buildings = ways
  .filter((way) => way.tags.building)
  .filter((way) => way.geometry.length >= 3)
  .map((way) => ({
    ...way,
    name: way.tags.name,
    height: Number(way.tags.height) || Math.max(4, (Number(way.tags['building:levels']) || 1) * 3.2)
  }));

const roadValues = new Set([
  'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link',
  'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'residential',
  'unclassified', 'service', 'living_street', 'road'
]);
const roads = ways.filter((way) => roadValues.has(way.tags.highway));
const footways = ways.filter((way) =>
  ['footway', 'path', 'pedestrian', 'cycleway', 'steps'].includes(way.tags.highway) || way.tags.sidewalk
);
const railways = ways.filter((way) => way.tags.railway);
const shops = [
  ...pointFeatures.filter((feature) => feature.tags.shop || feature.tags.amenity === 'restaurant'),
  ...ways.filter((way) => way.tags.shop).map((way) => ({
    id: way.id,
    name: way.tags.name,
    tags: way.tags,
    position: way.centroid
  }))
];
const places = ways
  .filter((way) => way.tags.name)
  .filter((way) => !way.tags.highway)
  .filter((way) => way.tags.landuse || way.tags.amenity || way.tags.building || way.tags.leisure || way.tags.natural || way.tags.shop)
  .map((way) => ({
    ...way,
    name: way.tags.name,
    height: Number(way.tags.height) || Math.max(1.5, (Number(way.tags['building:levels']) || 1) * 3.2)
  }));
const signals = pointFeatures.filter((feature) =>
  feature.tags.highway === 'traffic_signals' || feature.tags.traffic_signals === 'signal'
);
const crossings = pointFeatures.filter((feature) =>
  feature.tags.highway === 'crossing' || feature.tags.crossing || feature.tags.railway === 'level_crossing'
);
const busStops = pointFeatures.filter((feature) =>
  feature.tags.highway === 'bus_stop' || feature.tags.public_transport === 'platform'
);
const trees = pointFeatures.filter((feature) => feature.tags.natural === 'tree');

const namedFeatures = [...buildings, ...places, ...pointFeatures];
const hasNamedFeature = (needle) => namedFeatures.some((feature) =>
  (feature.name || feature.tags?.name)?.toLowerCase().includes(needle.toLowerCase())
);
const landmarkCoverage = [
  { name: 'Oracle Tech Hub', sourceBacked: hasNamedFeature('Oracle Tech Hub') },
  { name: 'Innovative Multiplex', sourceBacked: hasNamedFeature('Innovative Multiplex') },
  { name: 'Kalamandir', sourceBacked: hasNamedFeature('Kalamandir') },
  { name: 'Spice Garden', sourceBacked: hasNamedFeature('Spice Garden') }
];
const missingLandmarks = landmarkCoverage.filter((landmark) => !landmark.sourceBacked).map((landmark) => landmark.name);

const dataset = {
  schemaVersion: 1,
  source: {
    provider: 'OpenStreetMap',
    file: 'marathahalli_osm.xml',
    snapshotTimestamp: latestTimestamp || null,
    attribution: '© OpenStreetMap contributors',
    license: 'ODbL-1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/'
  },
  origin: {
    lat: origin.lat,
    lon: origin.lon,
    axis: 'x=east, z=north',
    projection: 'local equirectangular approximation in metres',
    metersPerDegree: { lat: metersPerDegreeLat, lon: metersPerDegreeLon }
  },
  bounds: sourceBounds,
  clipMarginDegrees,
  coverage: {
    name: 'Oracle Tech Hub → Marathahalli → Kalamandir / Spice Garden OSM snapshot',
    note: missingLandmarks.length
      ? `This snapshot covers the supplied OSM bounds. Source-backed landmark gaps remain: ${missingLandmarks.join(', ')}.`
      : 'This wider snapshot covers the Oracle Tech Hub, Innovative Multiplex, Marathahalli signal junction, Kalamandir and Spice Garden corridor. OSM geometry is source-backed; landmark facade detail remains a modeled layer.',
    landmarks: landmarkCoverage
  },
  stats: {
    nodes: nodes.size,
    ways: ways.length,
    buildings: buildings.length,
    roads: roads.length,
    footways: footways.length,
    shops: shops.length,
    places: places.length,
    signals: signals.length,
    crossings: crossings.length,
    busStops: busStops.length,
    trees: trees.length,
    railways: railways.length
  },
  buildings,
  roads,
  footways,
  shops,
  places,
  signals,
  crossings,
  busStops,
  trees,
  railways
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);

console.log(`Compiled ${path.relative(projectRoot, outputPath)}`);
console.log(JSON.stringify(dataset.stats));

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
    'highway', 'name', 'ref', 'surface', 'lanes', 'maxspeed', 'oneway', 'sidewalk', 'junction', 'place',
    'foot', 'bicycle', 'building', 'building:levels', 'height', 'shop', 'amenity',
    'public_transport', 'railway', 'bridge', 'tunnel', 'crossing', 'crossing:markings',
    'natural', 'leisure', 'tourism', 'area', 'barrier', 'lit', 'operator', 'addr:street', 'addr:housenumber', 'landuse',
    'traffic_signals', 'layer', 'step_count', 'width', 'incline', 'ramp', 'covered',
    'handrail', 'smoothness', 'footway', 'embankment', 'service', 'network', 'colour',
    'gauge', 'voltage', 'frequency', 'bridge:support', 'material', 'bridge:structure', 'man_made', 'full_name',
    'alt_name', 'official_name', 'short_name', 'name:en', 'name:hi', 'name:kn', 'name:ml', 'name:or', 'name:ta', 'name:ur'
  ];
  return Object.fromEntries(allowed.filter((key) => tags[key] !== undefined).map((key) => [key, tags[key]]));
}

const nodes = new Map();
let latestTimestamp = '';

// The extract contains independently versioned nodes, ways and relations.
// Track all primitive timestamps so a newer relation cannot leave the
// published snapshot looking older than its source data.
for (const match of xml.matchAll(/<(?:node|way|relation)\b([^>]*)/g)) {
  const timestamp = attr(match[1], 'timestamp') || '';
  if (timestamp > latestTimestamp) latestTimestamp = timestamp;
}

for (const match of xml.matchAll(/<node\b([^>]*?)(?:\/>|>([\s\S]*?)<\/node>)/g)) {
  const attrs = match[1];
  const lat = Number(attr(attrs, 'lat'));
  const lon = Number(attr(attrs, 'lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
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
  const points = refs.map((ref) => nodes.get(ref) || null);
  // Ways returned by the OSM API often continue well beyond the requested
  // map window. Dropping those ways wholesale silently removed the current
  // Namma Metro Phase 2A alignment because its source ways run from the
  // wider corridor into this clip. Keep the longest contiguous in-window run
  // so long roads, railways and footways retain their real local geometry
  // without connecting two separate in-window runs across an omitted area.
  const clippedRuns = [];
  let currentRun = [];
  for (const point of points) {
    if (point && inClip(point.lat, point.lon)) {
      currentRun.push(point);
    } else if (currentRun.length) {
      clippedRuns.push(currentRun);
      currentRun = [];
    }
  }
  if (currentRun.length) clippedRuns.push(currentRun);
  const clippedPoints = clippedRuns
    .sort((a, b) => b.length - a.length)[0] || [];
  if (clippedPoints.length < 2) return null;
  const geometry = clippedPoints.map((point) => toLocal(point.lat, point.lon));
  const sum = clippedPoints.reduce((acc, point) => [acc[0] + point.lat, acc[1] + point.lon], [0, 0]);
  const centroid = toLocal(sum[0] / clippedPoints.length, sum[1] / clippedPoints.length);
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

// Keep turn restrictions as first-class source data. The renderer can use
// these to avoid presenting a mapped-prohibited movement as a legal loop.
const turnRestrictions = [];
for (const match of xml.matchAll(/<relation\b([^>]*)>([\s\S]*?)<\/relation>/g)) {
  const attrs = match[1];
  const body = match[2] || '';
  const tags = parseTags(body);
  if (tags.type !== 'restriction' || !tags.restriction) continue;

  const id = attr(attrs, 'id');
  const members = [...body.matchAll(/<member\b([^>]*)\/>/g)]
    .map((memberMatch) => ({
      type: attr(memberMatch[1], 'type'),
      ref: attr(memberMatch[1], 'ref'),
      role: attr(memberMatch[1], 'role')
    }))
    .filter((member) => member.type && member.ref && member.role);
  if (!id || !members.some((member) => member.role === 'from') || !members.some((member) => member.role === 'to')) continue;

  turnRestrictions.push({
    id: `relation/${id}`,
    restriction: tags.restriction,
    members: members.map((member) => ({
      type: member.type,
      ref: `${member.type}/${member.ref}`,
      role: member.role
    }))
  });
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
const pedestrianHighwayValues = new Set(['footway', 'path', 'pedestrian', 'cycleway', 'steps', 'bridleway']);
const footways = ways.filter((way) => pedestrianHighwayValues.has(way.tags.highway));
const railways = ways.filter((way) => way.tags.railway);
const treeRows = ways.filter((way) => way.tags.natural === 'tree_row');
// Keep named transport structures separate from roads and railways. Their
// plan geometry is source-backed, while the renderer supplies only a clearly
// modelled display elevation because OSM layer values are relative, not a
// surveyed height datum.
const infrastructure = ways
  .filter((way) => way.tags.man_made === 'tunnel' || way.tags.man_made === 'bridge' || way.tags.bridge === 'viaduct')
  .filter((way) => /kadubeesanahalli underpass|marathahalli bridge|marathahalli rail over bridge/i.test(
    `${way.tags.name || ''} ${way.tags.full_name || ''}`
  ));
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
  .filter((way) => way.tags.landuse || way.tags.amenity || way.tags.building || way.tags.leisure || way.tags.natural || way.tags.shop || way.tags.tourism || way.tags.area || way.tags.place)
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
const namedPlaces = pointFeatures
  .filter((feature) => feature.tags.place && feature.tags.name)
  .map(({ id, name, tags, position }) => ({ id, name, tags, position }));
const busStops = pointFeatures.filter((feature) =>
  feature.tags.highway === 'bus_stop' || feature.tags.public_transport === 'platform'
);
const trees = pointFeatures.filter((feature) => feature.tags.natural === 'tree');
const sourceAnchors = pointFeatures
  .filter((feature) => (
    feature.tags.junction === 'yes' && /kadubeesanahalli underpass/i.test(feature.tags.name || '')
  ) || (
    feature.tags.place === 'quarter' && /kaadubeesanahalli|kadubeesanahalli/i.test(feature.tags.name || '')
  ))
  .map((feature) => ({
    id: feature.id,
    name: feature.name,
    tags: feature.tags,
    position: feature.position
  }));
const bridgeSupports = pointFeatures
  .filter((feature) => feature.tags['bridge:support'] === 'pier')
  .map((feature) => ({
    id: feature.id,
    name: feature.name,
    tags: feature.tags,
    position: feature.position
  }));

const namedFeatures = [...buildings, ...places, ...pointFeatures];
const hasNamedFeature = (needle) => namedFeatures.some((feature) =>
  (feature.name || feature.tags?.name)?.toLowerCase().includes(needle.toLowerCase())
);
const landmarkCoverage = [
  { name: 'Oracle Tech Hub', sourceBacked: hasNamedFeature('Oracle Tech Hub') },
  { name: 'Innovative Multiplex', sourceBacked: hasNamedFeature('Innovative Multiplex') },
  { name: 'Kalamandir', sourceBacked: hasNamedFeature('Kalamandir') },
  { name: 'Spice Garden', sourceBacked: hasNamedFeature('Spice Garden') },
  { name: 'Kadubeesanahalli Underpass', sourceBacked: sourceAnchors.some((feature) => /underpass/i.test(feature.name || '')) },
  { name: 'Kaadubeesanahalli', sourceBacked: sourceAnchors.some((feature) => /kaadubeesanahalli/i.test(feature.name || '')) },
  { name: 'Marathahalli Rail Over Bridge', sourceBacked: infrastructure.some((feature) => /rail over bridge/i.test(`${feature.name || ''} ${feature.tags.full_name || ''}`)) }
];
const missingLandmarks = landmarkCoverage.filter((landmark) => !landmark.sourceBacked).map((landmark) => landmark.name);

const dataset = {
  schemaVersion: 3,
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
    name: 'Kadubeesanahalli → Oracle Tech Hub → Marathahalli → Kalamandir / Spice Garden OSM snapshot',
    note: missingLandmarks.length
      ? `This snapshot covers the supplied OSM bounds. Source-backed landmark gaps remain: ${missingLandmarks.join(', ')}.`
      : 'This wider snapshot covers the Kadubeesanahalli underpass, Oracle Tech Hub, Innovative Multiplex, Marathahalli signal junction, Kalamandir and Spice Garden corridor. OSM geometry is source-backed; landmark facade detail remains a modeled layer. Turn restrictions are preserved separately from drawable ways.',
    landmarks: landmarkCoverage
  },
  stats: {
    nodes: nodes.size,
    ways: ways.length,
    buildings: buildings.length,
    roads: roads.length,
    footways: footways.length,
    treeRows: treeRows.length,
    shops: shops.length,
    places: places.length,
    namedPlaces: namedPlaces.length,
    signals: signals.length,
    crossings: crossings.length,
    busStops: busStops.length,
    trees: trees.length,
    sourceAnchors: sourceAnchors.length,
    bridgeSupports: bridgeSupports.length,
    railways: railways.length,
    infrastructure: infrastructure.length,
    turnRestrictions: turnRestrictions.length
  },
  buildings,
  roads,
  footways,
  treeRows,
  shops,
  places,
  namedPlaces,
  signals,
  crossings,
  busStops,
  trees,
  sourceAnchors,
  bridgeSupports,
  railways,
  infrastructure,
  turnRestrictions
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`);

console.log(`Compiled ${path.relative(projectRoot, outputPath)}`);
console.log(JSON.stringify(dataset.stats));

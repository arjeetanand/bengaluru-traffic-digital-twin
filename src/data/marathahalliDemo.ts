export interface OSMPolylineFeature {
  id: string;
  name?: string;
  tags: Record<string, string>;
  geometry: [number, number][];
  centroid: [number, number];
  height?: number;
}

// These are the two one-way Varthur Road viaduct ways that cross above the
// source-mapped ORR carriageways at the Marathahalli junction. Keeping the
// IDs in one place prevents the detailed bridge, source layer, footpaths and
// corridor traffic from quietly drifting onto different vertical levels.
export const VARTHUR_VIADUCT_WAY_IDS = [
  'way/1157170083',
  'way/1157170085'
] as const;

export const VARTHUR_VIADUCT_FOOTWAY_WAY_IDS = [
  'way/1225572736',
  'way/1225572743'
] as const;

export const VARTHUR_VIADUCT_DECK_TOP_Y = 8.0;

// Current OSM source geometry for the two Namma Metro Phase 2A mainline
// tracks. The extract also contains way/1551136769, a short siding fragment;
// keep it available in the snapshot but exclude it from the running viaduct
// and train path so the rendered deck follows the two through tracks.
export const NAMMA_METRO_MAINLINE_WAY_IDS = [
  'way/1551136768',
  'way/1551136770'
] as const;
export const NAMMA_METRO_SIDING_WAY_ID = 'way/1551136769';

// The pedestrian overbridge is a separate mapped footway, not the east-west
// vehicle flyover. Keeping its source IDs here gives the renderer, the
// pedestrian animation and the OSM layer one unambiguous geometry contract.
export const MARATHAHALLI_SKYWALK_DECK_WAY_IDS = [
  'way/323729567',
  'way/1221361667',
  'way/1221361669'
] as const;

export const MARATHAHALLI_SKYWALK_STAIR_WAY_IDS = [
  'way/323729566',
  'way/323729569'
] as const;

// Source tags: the south flight is way/323729569 (27 steps) and the north
// flight is way/323729566 (42 steps). These counts are used for the 3D treads;
// the source way IDs above keep their geometry and metadata authoritative.
export const MARATHAHALLI_SKYWALK_DECK_WIDTH = 3.0;
export const MARATHAHALLI_SKYWALK_STAIR_STEP_COUNTS = [27, 42] as const;
export const MARATHAHALLI_SKYWALK_DECK_TOP_Y = 7.55;
export const MARATHAHALLI_SKYWALK_GROUND_TOP_Y = 0.16;

export const MARATHAHALLI_SKYWALK_DECK_POINTS: readonly [number, number][] = [
  [63.9, -4.6],
  [66.2, 24.5]
];

export const MARATHAHALLI_SKYWALK_STAIR_POINTS: readonly {
  deck: [number, number];
  ground: [number, number];
}[] = [
  { deck: [63.9, -4.6], ground: [45.2, -4.7] },
  { deck: [66.2, 24.5], ground: [84.5, 22.7] }
];

export function isVarthurViaductWay(feature: OSMPolylineFeature) {
  return VARTHUR_VIADUCT_WAY_IDS.includes(feature.id as (typeof VARTHUR_VIADUCT_WAY_IDS)[number]);
}

export function isVarthurViaductFootway(feature: OSMPolylineFeature) {
  return VARTHUR_VIADUCT_FOOTWAY_WAY_IDS.includes(feature.id as (typeof VARTHUR_VIADUCT_FOOTWAY_WAY_IDS)[number]);
}

export function isNammaMetroMainlineWay(feature: OSMPolylineFeature) {
  return NAMMA_METRO_MAINLINE_WAY_IDS.includes(feature.id as (typeof NAMMA_METRO_MAINLINE_WAY_IDS)[number]);
}

export function isNammaMetroSourceWay(feature: OSMPolylineFeature) {
  return isNammaMetroMainlineWay(feature) || feature.id === NAMMA_METRO_SIDING_WAY_ID;
}

export function isMarathahalliSkywalkDeck(feature: OSMPolylineFeature) {
  return MARATHAHALLI_SKYWALK_DECK_WAY_IDS.includes(feature.id as (typeof MARATHAHALLI_SKYWALK_DECK_WAY_IDS)[number]);
}

export function isMarathahalliSkywalkStair(feature: OSMPolylineFeature) {
  return MARATHAHALLI_SKYWALK_STAIR_WAY_IDS.includes(feature.id as (typeof MARATHAHALLI_SKYWALK_STAIR_WAY_IDS)[number]);
}

export function isMarathahalliUnderpassWay(feature: OSMPolylineFeature) {
  return (feature.name || feature.tags.name || '').toLowerCase() === 'marathahalli underpass';
}

export function isSourceElevatedRoad(feature: OSMPolylineFeature) {
  return feature.tags.bridge === 'yes' || feature.tags.bridge === 'viaduct';
}

export interface OSMPointFeature {
  id: string;
  name?: string;
  tags: Record<string, string>;
  position: [number, number];
}

function pointToSegmentDistance(
  point: [number, number],
  start: [number, number],
  end: [number, number]
) {
  const vx = end[0] - start[0];
  const vz = end[1] - start[1];
  const wx = point[0] - start[0];
  const wz = point[1] - start[1];
  const lengthSquared = vx * vx + vz * vz;
  const progress = lengthSquared > 0
    ? Math.max(0, Math.min(1, (wx * vx + wz * vz) / lengthSquared))
    : 0;
  return Math.hypot(
    point[0] - (start[0] + progress * vx),
    point[1] - (start[1] + progress * vz)
  );
}

/**
 * Return only bridge supports with explicit metro evidence. The August 2026
 * extract contains 144 concrete pier nodes near the metro alignment, but
 * their refs identify ORR / Marathahalli / Kodibeesanahalli road structures;
 * none is tagged as a Namma Metro support. Proximity alone is not enough to
 * reclassify a road pier as metro infrastructure. A future extract can opt a
 * support into the source metro layer by adding an explicit Namma Metro tag;
 * the distance guard then prevents an unrelated nearby support from leaking
 * into the track model.
 */
export function isNammaMetroPierSupport(
  support: OSMPointFeature,
  metroWays: OSMPolylineFeature[],
  maxDistance = 14
) {
  if (support.tags['bridge:support'] !== 'pier') return false;
  const hasExplicitMetroTag = [
    support.name,
    ...Object.values(support.tags)
  ].some((value) => /namma\s+metro/i.test(value || ''));
  if (!hasExplicitMetroTag) return false;
  return metroWays.some((way) => way.geometry.slice(1).some((point, index) => (
    pointToSegmentDistance(support.position, way.geometry[index], point) <= maxDistance
  )));
}

export interface OSMTurnRestriction {
  id: string;
  restriction: string;
  members: { type: string; ref: string; role: string }[];
}

export interface MarathahalliDemoSnapshot {
  schemaVersion: number;
  source: {
    provider: string;
    file: string;
    snapshotTimestamp: string | null;
    attribution: string;
    license: string;
    licenseUrl: string;
  };
  origin: {
    lat: number;
    lon: number;
    axis: string;
    projection: string;
    metersPerDegree: { lat: number; lon: number };
  };
  bounds: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  };
  clipMarginDegrees: number;
  coverage: {
    name: string;
    note: string;
    landmarks?: { name: string; sourceBacked: boolean }[];
  };
  stats: Record<string, number>;
  buildings: OSMPolylineFeature[];
  roads: OSMPolylineFeature[];
  footways: OSMPolylineFeature[];
  shops: OSMPointFeature[];
  places: OSMPolylineFeature[];
  signals: OSMPointFeature[];
  crossings: OSMPointFeature[];
  busStops: OSMPointFeature[];
  trees: OSMPointFeature[];
  bridgeSupports: OSMPointFeature[];
  railways: OSMPolylineFeature[];
  turnRestrictions: OSMTurnRestriction[];
}

export const MARATHAHALLI_SNAPSHOT_URL = '/data/marathahalli-demo.json';

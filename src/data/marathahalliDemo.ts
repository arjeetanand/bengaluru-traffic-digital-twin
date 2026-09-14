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
  railways: OSMPolylineFeature[];
  turnRestrictions: OSMTurnRestriction[];
}

export const MARATHAHALLI_SNAPSHOT_URL = '/data/marathahalli-demo.json';

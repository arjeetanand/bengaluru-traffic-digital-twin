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

export function isVarthurViaductWay(feature: OSMPolylineFeature) {
  return VARTHUR_VIADUCT_WAY_IDS.includes(feature.id as (typeof VARTHUR_VIADUCT_WAY_IDS)[number]);
}

export function isVarthurViaductFootway(feature: OSMPolylineFeature) {
  return VARTHUR_VIADUCT_FOOTWAY_WAY_IDS.includes(feature.id as (typeof VARTHUR_VIADUCT_FOOTWAY_WAY_IDS)[number]);
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
}

export const MARATHAHALLI_SNAPSHOT_URL = '/data/marathahalli-demo.json';

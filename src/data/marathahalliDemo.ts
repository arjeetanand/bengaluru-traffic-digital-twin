export interface OSMPolylineFeature {
  id: string;
  name?: string;
  tags: Record<string, string>;
  geometry: [number, number][];
  centroid: [number, number];
  height?: number;
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

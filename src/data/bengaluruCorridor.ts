import corridorRegistry from './bellandur-marathahalli-corridor.json';
import { gpsTo3D } from './GoogleMapsStoreRegistry';
import { ProvenanceTag } from '../types';

export interface CorridorCoordinate {
  lat: number;
  lon: number;
}
export interface CorridorStopAnchor {
  id: string;
  name: string;
  kind: string;
  coordinate: CorridorCoordinate;
  approximate: boolean;
  note: string;
  provenance: Readonly<Record<string, ProvenanceTag>>;
  sourceRefs: readonly string[];
}

export interface CorridorAttractorAnchor {
  id: string;
  name: string;
  kind: string;
  scope: 'corridor' | 'adjacent_context';
  coordinate: CorridorCoordinate;
  approximate: boolean;
  anchorBasis: string;
  note: string;
  provenance: Readonly<Record<string, ProvenanceTag>>;
  sourceRefs: readonly string[];
}

export interface BengaluruCorridorRegistry {
  schemaVersion: number;
  registryId: string;
  title: string;
  retrievedOn: string;
  geometryPolicy: string;
  coverage: {
    southStopId: string;
    northStopId: string;
    corridorDescription: string;
    contextNote: string;
  };
  stops: readonly CorridorStopAnchor[];
  attractors: readonly CorridorAttractorAnchor[];
}

export const BELLANDUR_MARATHAHALLI_CORRIDOR = corridorRegistry as BengaluruCorridorRegistry;

export function corridorAnchorToWorld(
  coordinate: CorridorCoordinate,
  y = 0
): [number, number, number] {
  return gpsTo3D(coordinate.lat, coordinate.lon, y);
}

export function getCorridorAttractorWorldPosition(
  attractor: CorridorAttractorAnchor,
  y = 0
): [number, number, number] {
  return corridorAnchorToWorld(attractor.coordinate, y);
}

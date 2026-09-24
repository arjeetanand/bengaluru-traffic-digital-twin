import React, { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface Footprint {
  id: string;
  name?: string;
  centroid: [number, number];
  geometry: [number, number][];
  height: number;
  heightSource: 'osm:height' | 'osm:building:levels' | 'modelled:fallback';
}
interface Road {
  id: string;
  kind: string;
  geometry: [number, number][];
}
interface NorthernSnapshot {
  source: { attribution: string; attributionUrl: string };
  buildings: Footprint[];
  roads: Road[];
  campuses: { id: string; name: string; centroid: [number, number]; geometry: [number, number][] }[];
}

function roadWidth(kind: string) {
  if (['motorway', 'trunk', 'primary'].includes(kind)) return 11;
  if (['secondary', 'tertiary'].includes(kind)) return 7;
  if (['footway', 'path', 'pedestrian', 'steps'].includes(kind)) return 1.6;
  return 3.5;
}

function roadGeometry(roads: Road[]) {
  const vertices: number[] = [];
  for (const road of roads) {
    const width = roadWidth(road.kind) / 2;
    for (let index = 1; index < road.geometry.length; index += 1) {
      const [ax, az] = road.geometry[index - 1];
      const [bx, bz] = road.geometry[index];
      const length = Math.hypot(bx - ax, bz - az);
      if (length < 0.01) continue;
      const dx = (bz - az) / length * width;
      const dz = (ax - bx) / length * width;
      vertices.push(
        ax - dx, 0.13, az - dz, bx - dx, 0.13, bz - dz, bx + dx, 0.13, bz + dz,
        ax - dx, 0.13, az - dz, bx + dx, 0.13, bz + dz, ax + dx, 0.13, az + dz
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function outlineGeometry(features: { geometry: [number, number][] }[], y: number) {
  const vertices: number[] = [];
  for (const feature of features) {
    for (let index = 0; index < feature.geometry.length; index += 1) {
      const [ax, az] = feature.geometry[index];
      const [bx, bz] = feature.geometry[(index + 1) % feature.geometry.length];
      vertices.push(ax, y, az, bx, y, bz);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

function selectedBuildings(buildings: Footprint[]) {
  const named = buildings.filter((building) => building.name);
  const cells = new Map<string, Footprint>();
  for (const building of buildings) {
    const [x, z] = building.centroid;
    const key = `${Math.floor(x / 95)}:${Math.floor(z / 95)}`;
    const current = cells.get(key);
    if (!current || building.geometry.length > current.geometry.length) cells.set(key, building);
  }
  const ids = new Set(named.map((building) => building.id));
  return [...named, ...[...cells.values()].filter((building) => !ids.has(building.id))].slice(0, 650);
}

function massingGeometry(buildings: Footprint[]) {
  const geometries: THREE.ExtrudeGeometry[] = [];
  for (const building of selectedBuildings(buildings)) {
    if (building.geometry.length < 3) continue;
    try {
      const shape = new THREE.Shape();
      shape.moveTo(building.geometry[0][0], -building.geometry[0][1]);
      for (const [x, z] of building.geometry.slice(1)) shape.lineTo(x, -z);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: building.height, bevelEnabled: false, curveSegments: 1 });
      geometry.rotateX(-Math.PI / 2);
      geometries.push(geometry);
    } catch {
      // A malformed OSM footprint must not hide the rest of the city.
    }
  }
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  return merged;
}

export const MahadevapuraSourceLayer: React.FC = () => {
  const [snapshot, setSnapshot] = useState<NorthernSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/data/mahadevapura-3d.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Northern 3D source failed (${response.status})`);
        return response.json() as Promise<NorthernSnapshot>;
      })
      .then((data) => { if (active) setSnapshot(data); })
      .catch((error: unknown) => {
        if (active) {
          setFailed(true);
          console.warn('Northern OSM source unavailable', error);
        }
      });
    return () => { active = false; };
  }, []);

  const roads = useMemo(() => snapshot ? roadGeometry(snapshot.roads) : null, [snapshot]);
  const outlines = useMemo(() => snapshot ? outlineGeometry(snapshot.buildings, 0.22) : null, [snapshot]);
  const campuses = useMemo(() => snapshot ? outlineGeometry(snapshot.campuses, 0.28) : null, [snapshot]);
  const massings = useMemo(() => snapshot ? massingGeometry(snapshot.buildings) : null, [snapshot]);
  useEffect(() => () => {
    roads?.dispose();
    outlines?.dispose();
    campuses?.dispose();
    massings?.dispose();
  }, [roads, outlines, campuses, massings]);

  if (failed) return <Html fullscreen style={{ pointerEvents: 'none' }}><div style={{ position: 'absolute', bottom: 14, right: 12, color: '#fff', background: '#523a30', padding: '5px 8px', fontSize: 11 }}>Northern 3D map unavailable</div></Html>;
  if (!snapshot) return null;

  const ananta = snapshot.buildings.find((building) => building.id === 'way/1087930060');
  const labels = [snapshot.campuses[0], ananta].filter((item): item is NonNullable<typeof item> => Boolean(item));
  return (
    <group name="MahadevapuraOSMSourceLayer" userData={{ source: 'OpenStreetMap', elevation: 'building heights use OSM tags or marked modelled fallback; roads are plan traces, not surveyed elevations' }}>
      {roads && <mesh geometry={roads} userData={{ source: 'OSM highway plan geometry', count: snapshot.roads.length }}><meshStandardMaterial color="#cdb992" roughness={1} side={THREE.DoubleSide} /></mesh>}
      {massings && <mesh geometry={massings} userData={{ source: 'OSM building footprints', sampled: true, height: 'tagged or modelled fallback' }}><meshStandardMaterial color="#f0f2e9" roughness={0.86} metalness={0.04} side={THREE.DoubleSide} /></mesh>}
      {outlines && <lineSegments geometry={outlines} userData={{ source: 'all OSM building plan outlines', count: snapshot.buildings.length }}><lineBasicMaterial color="#d0ded4" transparent opacity={0.4} /></lineSegments>}
      {campuses && <lineSegments geometry={campuses} userData={{ source: 'OSM campus boundary', ids: snapshot.campuses.map((campus) => campus.id) }}><lineBasicMaterial color="#d9f678" /></lineSegments>}
      {labels.map((item) => <Html key={item.id} position={[item.centroid[0], item.id === 'way/1087930060' ? 49 : 32, item.centroid[1]]} center distanceFactor={680} style={{ pointerEvents: 'none' }}><span style={{ display: 'block', whiteSpace: 'nowrap', border: '2px solid #d9f678', borderRadius: 4, background: '#172932ed', padding: '7px 10px', color: '#f7f9e8', font: '700 12px sans-serif' }}>{item.name}</span></Html>)}
      <Html fullscreen style={{ pointerEvents: 'none' }}><a href={snapshot.source.attributionUrl} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', bottom: 10, right: 10, pointerEvents: 'auto', borderRadius: 4, background: '#172932d9', padding: '4px 7px', color: '#e7f0e8', font: '10px sans-serif' }}>Map data {snapshot.source.attribution} · ODbL</a></Html>
    </group>
  );
};

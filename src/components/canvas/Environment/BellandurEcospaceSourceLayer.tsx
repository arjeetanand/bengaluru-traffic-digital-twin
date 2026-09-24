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
interface Road { id: string; kind: string; geometry: [number, number][] }
interface EcospaceSnapshot {
  buildings: Footprint[];
  roads: Road[];
  campuses: { id: string; name: string; centroid: [number, number]; geometry: [number, number][] }[];
}

function lineGeometry(features: { geometry: [number, number][] }[], y: number) {
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

function roadGeometry(roads: Road[]) {
  const vertices: number[] = [];
  for (const road of roads) {
    const width = ['motorway', 'trunk', 'primary'].includes(road.kind) ? 5.5
      : ['secondary', 'tertiary'].includes(road.kind) ? 3.5
        : ['footway', 'path', 'pedestrian', 'steps'].includes(road.kind) ? 0.8 : 1.75;
    for (let index = 1; index < road.geometry.length; index += 1) {
      const [ax, az] = road.geometry[index - 1];
      const [bx, bz] = road.geometry[index];
      const length = Math.hypot(bx - ax, bz - az);
      if (length < 0.01) continue;
      const dx = (bz - az) / length * width;
      const dz = (ax - bx) / length * width;
      vertices.push(
        ax - dx, 0.11, az - dz, bx - dx, 0.11, bz - dz, bx + dx, 0.11, bz + dz,
        ax - dx, 0.11, az - dz, bx + dx, 0.11, bz + dz, ax + dx, 0.11, az + dz
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function massingGeometry(buildings: Footprint[]) {
  const roofColor = new THREE.Color('#f6f7e8');
  const wallColor = new THREE.Color('#adc5bd');
  const geometries: THREE.ExtrudeGeometry[] = [];
  for (const building of buildings) {
    try {
      const shape = new THREE.Shape();
      shape.moveTo(building.geometry[0][0], -building.geometry[0][1]);
      for (const [x, z] of building.geometry.slice(1)) shape.lineTo(x, -z);
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: building.height, bevelEnabled: false, curveSegments: 1 });
      geometry.rotateX(-Math.PI / 2);
      const normals = geometry.getAttribute('normal');
      const colors = new Float32Array(normals.count * 3);
      for (let index = 0; index < normals.count; index += 1) {
        const color = normals.getY(index) > 0.5 ? roofColor : wallColor;
        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometries.push(geometry);
    } catch {
      // A malformed source polygon must not hide the rest of the map.
    }
  }
  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  return merged;
}

export const BellandurEcospaceSourceLayer: React.FC = () => {
  const [snapshot, setSnapshot] = useState<EcospaceSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/data/bellandur-ecospace-3d.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Ecospace 3D source failed (${response.status})`);
        return response.json() as Promise<EcospaceSnapshot>;
      })
      .then((data) => { if (active) setSnapshot(data); })
      .catch((error: unknown) => {
        if (active) { setFailed(true); console.warn('Bellandur OSM source unavailable', error); }
      });
    return () => { active = false; };
  }, []);

  const roads = useMemo(() => snapshot ? roadGeometry(snapshot.roads) : null, [snapshot]);
  const buildings = useMemo(() => snapshot ? massingGeometry(snapshot.buildings) : null, [snapshot]);
  const outlines = useMemo(() => snapshot ? lineGeometry(snapshot.buildings, 0.21) : null, [snapshot]);
  const campus = useMemo(() => snapshot ? lineGeometry(snapshot.campuses, 0.28) : null, [snapshot]);
  useEffect(() => () => {
    roads?.dispose();
    buildings?.dispose();
    outlines?.dispose();
    campus?.dispose();
  }, [roads, buildings, outlines, campus]);

  if (failed) return <Html fullscreen style={{ pointerEvents: 'none' }}><div style={{ position: 'absolute', bottom: 34, right: 10, color: '#fff', background: '#523a30', padding: '5px 8px', fontSize: 11 }}>Ecospace 3D map unavailable</div></Html>;
  if (!snapshot) return null;
  const anchor = snapshot.campuses[0];
  return (
    <group name="BellandurEcospaceOSMSourceLayer" userData={{ source: 'OpenStreetMap', elevation: 'OSM tagged heights or modelled fallback; road plan traces are not surveyed elevations' }}>
      {roads && <mesh geometry={roads} userData={{ source: 'OSM highway plan geometry', count: snapshot.roads.length }}><meshStandardMaterial color="#cdb992" roughness={1} side={THREE.DoubleSide} /></mesh>}
      {buildings && <mesh geometry={buildings} userData={{ source: 'OSM building footprints', sampled: true, count: snapshot.buildings.length }}><meshStandardMaterial vertexColors roughness={0.86} metalness={0.04} side={THREE.DoubleSide} /></mesh>}
      {outlines && <lineSegments geometry={outlines}><lineBasicMaterial color="#d0ded4" transparent opacity={0.4} /></lineSegments>}
      {campus && <lineSegments geometry={campus} userData={{ source: 'OSM way/361528993' }}><lineBasicMaterial color="#d9f678" /></lineSegments>}
      {anchor && <Html position={[anchor.centroid[0], 38, anchor.centroid[1]]} center distanceFactor={680} style={{ pointerEvents: 'none' }}><span style={{ display: 'block', whiteSpace: 'nowrap', border: '2px solid #d9f678', borderRadius: 4, background: '#172932ed', padding: '7px 10px', color: '#f7f9e8', font: '700 12px sans-serif' }}>{anchor.name}</span></Html>}
    </group>
  );
};

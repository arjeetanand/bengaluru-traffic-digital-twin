import React, { useMemo, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { getOrrOffsetPointAtZ } from '../../../data/RealRoadData';

interface GreeneryProps {
  isRaining: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLANNED TREE PLACEMENT SYSTEM – Marathahalli Junction, Bengaluru
//
// Based on IRC:SP:21-2009 (Urban Road Furniture) and BBMP Tree Plantation
// guidelines, trees along arterial roads are planted at 8–10 m intervals on
// the outer edge of the footpath, inset ~0.6–0.8 m from the kerb.
//
// This replaces the old random loop with explicit, zone-aware corridors:
//   • Each TreeCorridor defines one side of one road (axis, side offset, range)
//   • Skip zones cut out junctions, bus bays, metro barricades, driveways
//   • Spacing is fixed per corridor (realistic, not random)
//   • Scale and rotation are deterministic (seeded per tree index, not random)
// ─────────────────────────────────────────────────────────────────────────────

interface SkipZone {
  start: number;  // along the corridor axis
  end: number;
  reason: string; // documentation only
}

interface TreeCorridor {
  id: string;
  axis: 'X' | 'Z';      // axis along which the corridor runs
  sideOffset: number;    // signed road-frame offset (x/z sign at the sidewalk)
  start: number;         // corridor start along the axis
  end: number;           // corridor end along the axis
  spacing: number;       // metres between trees (8–12 m typical per BBMP/IRC)
  xzJitter: number;      // small deterministic offset (± m) from the kerb line
  skipZones: SkipZone[];
  trunkRadius: number;
  trunkHeight: number;
  canopyRadius: number;
  canopyColor: string[]; // species-specific palette
}

// ── CORRIDOR DEFINITIONS ────────────────────────────────────────────────────
//
// Coordinate reference (from JunctionRoads / Footpaths.tsx):
//   ORR (Outer Ring Road)  → Z-axis, service-road edge ≈ lateral ±20.25,
//                            modeled footpath center x ±23.5
//   HAL / Varthur Road     → X-axis, modeled footpath center z ±13
//
// Trees are placed on the outside of the modeled footpath, rather than on its
// curb edge. The source OSM tree nodes remain rendered by OsmSnapshotLayer;
// this layer is the deterministic MODELLED planting fill and must not clone
// those source markers.
//
const TREE_CORRIDORS: TreeCorridor[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // A: ORR WEST SIDE – Rain Trees (Samanea saman)
  //    Total length ~385 m, spacing 9 m → ~43 trees minus skip zones
  //    Skip: junction box, BMRCL metro zone, multiplex bus-bay
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'orr-west',
    axis: 'Z',
    sideOffset: -26.2,
    start: -215,
    end: 170,
    spacing: 9,
    xzJitter: 0.4,
    skipZones: [
      { start: -25,  end: 25,   reason: 'Junction box – signal visibility clearance' },
      { start: 52,   end: 118,  reason: 'BMRCL Metro construction barricade zone' },
      { start: -175, end: -155, reason: 'Multiplex driveway & bus-bay clearance' },
    ],
    trunkRadius: 0.28, trunkHeight: 3.2, canopyRadius: 2.4,
    canopyColor: ['#166534', '#15803d', '#14532d', '#16a34a', '#1a5e30'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // B: ORR EAST SIDE – Neem Trees (Azadirachta indica)
  //    Skip: junction box, Brand Factory driveway, metro structure area
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'orr-east',
    axis: 'Z',
    sideOffset: 26.2,
    start: -215,
    end: 170,
    spacing: 9,
    xzJitter: 0.4,
    skipZones: [
      { start: -25,  end: 25,  reason: 'Junction box – signal clearance' },
      { start: 62,   end: 72,  reason: 'Brand Factory main entrance driveway' },
      { start: 118,  end: 175, reason: 'Metro structure and access clearance' },
      { start: -155, end: -140, reason: 'Auto-rickshaw stand encroachment' },
    ],
    trunkRadius: 0.22, trunkHeight: 2.8, canopyRadius: 2.0,
    canopyColor: ['#1a5c28', '#1d6b2e', '#145225', '#1f7a35', '#134d22'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // C: HAL OLD AIRPORT ROAD NORTH SIDE – Tabebuia argentea (Trumpet tree)
  //    Skip: junction clearance, jewellery showroom driveways, petrol station
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hal-north',
    axis: 'X',
    sideOffset: 16.2,
    start: -235,
    end: -20,
    spacing: 10,
    xzJitter: 0.3,
    skipZones: [
      { start: -20,  end: 20,   reason: 'Junction clearance – HAL Rd / ORR' },
      { start: -60,  end: -48,  reason: 'Showroom driveway – Tanishq / Kalyan' },
      { start: -130, end: -118, reason: 'Petrol station entry clearance' },
    ],
    trunkRadius: 0.20, trunkHeight: 2.6, canopyRadius: 1.9,
    canopyColor: ['#1b6b34', '#155d2a', '#197830', '#136025', '#1e7a39'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // D: HAL OLD AIRPORT ROAD SOUTH SIDE – Indian Coral Tree (Erythrina indica)
  //    Skip: junction, street market encroachment zone, driveways
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hal-south',
    axis: 'X',
    sideOffset: -16.2,
    start: -235,
    end: -20,
    spacing: 10,
    xzJitter: 0.3,
    skipZones: [
      { start: -20,  end: 20,   reason: 'Junction clearance' },
      { start: -125, end: -108, reason: 'Street market encroachment – no planting zone' },
      { start: -80,  end: -68,  reason: 'Driveway access – shops' },
    ],
    trunkRadius: 0.18, trunkHeight: 2.4, canopyRadius: 1.7,
    canopyColor: ['#166029', '#1a7033', '#13532a', '#1b6830', '#14582d'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // E: VARTHUR ROAD (EAST) NORTH SIDE – Gliricidia sepium
  //    Skip: junction, Skywalk/bus-bay, Railway Overbridge approach
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'varthur-north',
    axis: 'X',
    sideOffset: 16.2,
    start: 20,
    end: 265,
    spacing: 10,
    xzJitter: 0.35,
    skipZones: [
      { start: 20,  end: 40,  reason: 'Junction clearance – Varthur / ORR' },
      { start: 42,  end: 68,  reason: 'Skywalk & BMTC bus bay – Marathahalli Bridge' },
      { start: 118, end: 135, reason: 'Railway Overbridge (ROB) approach – clearance' },
      { start: 248, end: 270, reason: 'Bus stop platform – Spice Garden terminus' },
    ],
    trunkRadius: 0.18, trunkHeight: 2.6, canopyRadius: 1.8,
    canopyColor: ['#177332', '#1d8039', '#14692e', '#1e8a3d', '#137228'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // F: VARTHUR ROAD (EAST) SOUTH SIDE – Gliricidia sepium (matching North)
  //    Skip: junction, ROB approach, Spice Garden missing footpath stretch
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'varthur-south',
    axis: 'X',
    sideOffset: -16.2,
    start: 20,
    end: 265,
    spacing: 10,
    xzJitter: 0.35,
    skipZones: [
      { start: 20,  end: 40,  reason: 'Junction clearance' },
      { start: 118, end: 135, reason: 'Railway Overbridge approach – structure clearance' },
      { start: 195, end: 222, reason: 'Bridge descent – no footpath, no planting' },
      { start: 248, end: 270, reason: 'Spice Garden East – missing footpath' },
    ],
    trunkRadius: 0.18, trunkHeight: 2.6, canopyRadius: 1.8,
    canopyColor: ['#177332', '#1d8039', '#14692e', '#1e8a3d', '#137228'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // G: ORR CENTRAL MEDIAN NORTH of junction (x ≈ 0)
  //    Compact Ficus-style divider planting, spacing 12 m
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'orr-median-north',
    axis: 'Z',
    sideOffset: 0.0,
    start: 35,
    end: 170,
    spacing: 12,
    xzJitter: 0.1,
    skipZones: [
      { start: 55, end: 75, reason: 'Median break / underpass ventilation shaft' },
    ],
    trunkRadius: 0.14, trunkHeight: 1.8, canopyRadius: 1.4,
    canopyColor: ['#14532d', '#15803d', '#166534', '#1a5e30', '#12502a'],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // H: ORR CENTRAL MEDIAN SOUTH of junction (x ≈ 0)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'orr-median-south',
    axis: 'Z',
    sideOffset: 0.0,
    start: -215,
    end: -35,
    spacing: 12,
    xzJitter: 0.1,
    skipZones: [
      { start: -175, end: -155, reason: 'Multiplex median gap / driveway' },
    ],
    trunkRadius: 0.14, trunkHeight: 1.8, canopyRadius: 1.4,
    canopyColor: ['#14532d', '#15803d', '#166534', '#1a5e30', '#12502a'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Generate tree data from corridor definitions
// [x, y, z, scale, corridorIndex, treeSeed]
// ─────────────────────────────────────────────────────────────────────────────
type TreeEntry = [number, number, number, number, number, number];

function buildTreePositions(corridors: TreeCorridor[]): TreeEntry[] {
  const entries: TreeEntry[] = [];

  corridors.forEach((corridor, cIdx) => {
    const { axis, sideOffset, start, end, spacing, xzJitter, skipZones } = corridor;
    let seed = 0;

    for (let pos = start; pos <= end; pos += spacing) {
      const skipped = skipZones.some(sz => pos >= sz.start && pos <= sz.end);
      if (skipped) { seed++; continue; }

      // Deterministic micro-jitter via sine – no Math.random(), fully reproducible
      const jitter = Math.sin(pos * 0.37 + cIdx * 2.1) * xzJitter;

      let x = axis === 'Z' ? sideOffset + jitter : pos;
      let z = axis === 'Z' ? pos : sideOffset + jitter;

      // ORR tree corridors follow the source-backed road curve. The corridor
      // definitions retain their semantic east/west sign, while the road
      // frame uses positive lateral distance on the west side.
      if (axis === 'Z' && corridor.id.startsWith('orr-')) {
        const lateralOffset = sideOffset >= 0 ? -Math.abs(sideOffset) : Math.abs(sideOffset);
        [x, z] = getOrrOffsetPointAtZ(pos, lateralOffset + jitter);
      }

      // Deterministic scale ±15% per tree
      const scale = 0.88 + Math.abs(Math.sin(seed * 0.77 + cIdx)) * 0.24;

      entries.push([x, 0, z, scale, cIdx, seed]);
      seed++;
    }
  });

  return entries;
}

// ─────────────────────────────────────────────────────────────────────────────
export const Greenery: React.FC<GreeneryProps> = ({ isRaining }) => {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);

  const trees = useMemo(() => buildTreePositions(TREE_CORRIDORS), []);

  useLayoutEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    trees.forEach(([x, y, z, scale, cIdx, seed], idx) => {
      const { trunkHeight, trunkRadius, canopyRadius, canopyColor } = TREE_CORRIDORS[cIdx];

      // Derive species type from corridor: 0=tropical_round, 1=palm, 2=rain_tree
      const corridorId = TREE_CORRIDORS[cIdx].id;
      const species = corridorId.includes('varthur') ? 1     // palm – tall slim
                    : corridorId.includes('orr-west') ? 2    // rain_tree – wide spreading
                    : corridorId.includes('hal') ? 2          // rain_tree – wide spreading
                    : 0;                                       // tropical_round (median, orr-east)

      // ── Trunk ──
      const tH = species === 1 ? 6.5 : trunkHeight;           // Palms: 6.5 m trunk
      const tScale = species === 1 ? scale * 0.55 : scale;    // Palms: slimmer trunk
      dummy.position.set(x, y + (tH * tScale) / 2, z);
      dummy.scale.set(
        (trunkRadius / 0.25) * tScale,
        tScale,
        (trunkRadius / 0.25) * tScale
      );
      // Slight deterministic lean so trees aren't robotically upright
      dummy.rotation.set(
        Math.sin(seed * 1.3) * 0.035,
        seed * 0.52,
        Math.cos(seed * 0.9) * 0.03
      );
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(idx, dummy.matrix);

      // ── Canopy ──
      const trunkH = species === 1 ? 6.5 * scale * 0.55 : trunkHeight * scale;
      const canopyW = species === 1 ? scale * 0.8
                    : species === 2 ? scale * 2.4
                    : (canopyRadius / 1.8) * scale;
      const canopyHt = species === 1 ? scale * 0.7
                     : species === 2 ? scale * 0.65
                     : (canopyRadius / 1.8) * scale * (0.9 + Math.sin(seed * 0.6) * 0.12);
      dummy.position.set(x, y + trunkH, z);
      dummy.scale.set(canopyW, canopyHt, canopyW);
      dummy.rotation.set(0, idx * 0.75 + 0.3, 0);
      dummy.updateMatrix();
      canopyRef.current?.setMatrixAt(idx, dummy.matrix);

      // ── Species color – rain makes foliage darker / wetter ──
      color.set(canopyColor[seed % canopyColor.length]);
      if (isRaining) color.multiplyScalar(0.72);
      canopyRef.current?.setColorAt(idx, color);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
    if (canopyRef.current.instanceColor) canopyRef.current.instanceColor.needsUpdate = true;
  }, [trees, isRaining]);

  return (
    <group name="PlannedRoadsideGreenery">
      {/* Trunks */}
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, trees.length]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.25, 0.38, 3.0, 8]} />
        <meshStandardMaterial color="#3d2b1a" roughness={0.92} />
      </instancedMesh>

      {/* Canopies */}
      <instancedMesh
        ref={canopyRef}
        args={[undefined, undefined, trees.length]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1.9, 7, 5]} />
        <meshStandardMaterial roughness={0.88} metalness={0.04} />
      </instancedMesh>
    </group>
  );
};

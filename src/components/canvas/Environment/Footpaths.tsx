import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FootpathsProps {
  auditMode: boolean;
  isNight?: boolean;
}

export type FootpathStatus = 'paved' | 'missing' | 'encroached' | 'metro_blocked';

interface FootpathSegment {
  id: string;
  name: string;
  axis: 'X' | 'Z'; // X = East-West (HAL <-> Spice Garden), Z = North-South (Multiplex <-> Kalamandir)
  start: number;
  end: number;
  offset: number; // perpendicular coordinate (x or z)
  width: number;
  height: number;
  status: FootpathStatus;
  elevation?: number; // base Y elevation (e.g. for elevated ROB bridge)
  description: string;
}

export const Footpaths: React.FC<FootpathsProps> = ({ auditMode, isNight = false }) => {
  // ── Procedural Real-World Footpath Segments along the Two Corridors ──
  const segments: FootpathSegment[] = useMemo(() => [
    // ══════════════════════════════════════════════════════════════════════════
    // CORRIDOR 1: OUTER RING ROAD (Multiplex to Kalamandir, Z-axis)
    // ══════════════════════════════════════════════════════════════════════════
    // ── West Footpath (Southbound ORR Service Road edge, x ≈ -23.5) ──
    {
      id: 'orr-w-multiplex',
      name: 'Innovative Multiplex Entrance Frontage',
      axis: 'Z',
      start: -220,
      end: -160,
      offset: -23.5,
      width: 2.8,
      height: 0.25,
      status: 'paved',
      description: 'Paved interlocking pavers with curb stones near cinema entrance gates'
    },
    {
      id: 'orr-w-multiplex-busbay',
      name: 'Multiplex Bus Bay & Auto Stand',
      axis: 'Z',
      start: -160,
      end: -110,
      offset: -23.5,
      width: 2.4,
      height: 0.25,
      status: 'encroached',
      description: 'Encroached by waiting auto-rickshaws, bike parking, and street vendors'
    },
    {
      id: 'orr-w-south-ramp',
      name: 'ORR South Underpass Approach Shoulder',
      axis: 'Z',
      start: -110,
      end: -50,
      offset: -23.0,
      width: 2.0,
      height: 0.05,
      status: 'missing',
      description: 'Missing/unpaved dirt shoulder beside retaining wall, raw gravel edge'
    },
    {
      id: 'orr-w-junction-sw',
      name: 'South-West Junction Corner (Tanishq/Reebok)',
      axis: 'Z',
      start: -50,
      end: -21,
      offset: -23.5,
      width: 3.2,
      height: 0.25,
      status: 'paved',
      description: 'Wide concrete sidewalk linking to pedestrian zebra crossing'
    },
    {
      id: 'orr-w-junction-nw',
      name: 'North-West Junction Corner (Krishna Summit)',
      axis: 'Z',
      start: 21,
      end: 55,
      offset: -23.5,
      width: 3.2,
      height: 0.25,
      status: 'paved',
      description: 'Paved sidewalk in front of Krishna Summit Tech Center'
    },
    {
      id: 'orr-w-metro-barrier',
      name: 'Northbound Service Road Metro Construction Zone',
      axis: 'Z',
      start: 55,
      end: 115,
      offset: -22.5,
      width: 2.2,
      height: 0.15,
      status: 'metro_blocked',
      description: 'Narrowed and severed by BMRCL barricades and foundation material'
    },
    {
      id: 'orr-w-kalamandir-opp',
      name: 'Kalamandir Opposite Tech Complex',
      axis: 'Z',
      start: 115,
      end: 175,
      offset: -23.5,
      width: 2.6,
      height: 0.25,
      status: 'paved',
      description: 'Intact paver blocks in front of commercial IT offices'
    },

    // ── East Footpath (Northbound ORR Service Road edge, x ≈ +23.5) ──
    {
      id: 'orr-e-multiplex-opp',
      name: 'Multiplex East Service Road Margin',
      axis: 'Z',
      start: -220,
      end: -145,
      offset: 23.5,
      width: 2.4,
      height: 0.05,
      status: 'missing',
      description: 'Missing footpath; raw soil, mud and open drainage culverts'
    },
    {
      id: 'orr-e-south-approach',
      name: 'Marathahalli Village South Approach',
      axis: 'Z',
      start: -145,
      end: -50,
      offset: 23.5,
      width: 2.4,
      height: 0.22,
      status: 'encroached',
      description: 'Occupied by informal repair shops, tea stalls, and parked two-wheelers'
    },
    {
      id: 'orr-e-junction-se',
      name: 'South-East Junction Corner (Factory Outlets)',
      axis: 'Z',
      start: -50,
      end: -21,
      offset: 23.5,
      width: 3.4,
      height: 0.25,
      status: 'paved',
      description: 'Paved corner sidewalk near Marathahalli signal'
    },
    {
      id: 'orr-e-brandfactory',
      name: 'Brand Factory Frontage',
      axis: 'Z',
      start: 21,
      end: 65,
      offset: 23.5,
      width: 3.6,
      height: 0.25,
      status: 'paved',
      description: 'Wide commercial paved sidewalk in front of Brand Factory outlet'
    },
    {
      id: 'orr-e-kalamandir',
      name: 'Kalamandir Wedding Palatial Store Frontage',
      axis: 'Z',
      start: 65,
      end: 120,
      offset: 24.0,
      width: 3.8,
      height: 0.25,
      status: 'paved',
      description: 'Polished stone paver slabs and decorative bollards in front of Kalamandir'
    },
    {
      id: 'orr-e-nalli-silks',
      name: 'Nalli Silks / Metro Station Access Footpath',
      axis: 'Z',
      start: 120,
      end: 175,
      offset: 23.5,
      width: 2.4,
      height: 0.18,
      status: 'metro_blocked',
      description: 'Squeezed footpath under elevated Marathahalli Metro Station stairs'
    },

    // ══════════════════════════════════════════════════════════════════════════
    // CORRIDOR 2: HAL ROAD ◄► SPICE GARDEN (X-axis)
    // ══════════════════════════════════════════════════════════════════════════
    // ── HAL Old Airport Road North Footpath (z ≈ +13) ──
    {
      id: 'hal-n-far',
      name: 'HAL Road Far West Commercial Corridor',
      axis: 'X',
      start: -240,
      end: -140,
      offset: 13.0,
      width: 2.6,
      height: 0.25,
      status: 'paved',
      description: 'Standard BBMP tiled footpath with yellow-black curbs and street trees'
    },
    {
      id: 'hal-n-jewellers',
      name: 'Kalyan & Tanishq Showroom Strip',
      axis: 'X',
      start: -140,
      end: -28,
      offset: 13.0,
      width: 3.2,
      height: 0.25,
      status: 'paved',
      description: 'Showroom entrance walkway with illuminated storefronts and tactile paving'
    },

    // ── HAL Old Airport Road South Footpath (z ≈ -13) ──
    {
      id: 'hal-s-far',
      name: 'HAL Road South Apparel Row',
      axis: 'X',
      start: -240,
      end: -120,
      offset: -13.0,
      width: 2.6,
      height: 0.25,
      status: 'paved',
      description: 'Paved pedestrian path with retail showroom display frontage'
    },
    {
      id: 'hal-s-encroached',
      name: 'HAL Road Street Market & Snacks Row',
      axis: 'X',
      start: -120,
      end: -28,
      offset: -13.0,
      width: 2.6,
      height: 0.22,
      status: 'encroached',
      description: 'Encroached by mobile chai stalls, fruit vendors, and customer bike parking'
    },

    // ── Varthur Road West Approach Link (X: 28 to 120) ──
    {
      id: 'varthur-n-approach',
      name: 'Varthur Road North Footpath to Bridge',
      axis: 'X',
      start: 28,
      end: 120,
      offset: 13.0,
      width: 2.8,
      height: 0.25,
      status: 'paved',
      description: 'Direct pedestrian link from junction crosswalk to Marathahalli Bridge'
    },
    {
      id: 'varthur-s-approach',
      name: 'Varthur Road South Footpath to Bridge',
      axis: 'X',
      start: 28,
      end: 120,
      offset: -13.0,
      width: 2.6,
      height: 0.22,
      status: 'encroached',
      description: 'Footpath with auto parking and small shops leading to Munnekolala portal'
    },

    // ── Marathahalli Railway Overbridge (ROB) Elevated Sidewalks (X: 120 to 195) ──
    {
      id: 'rob-sidewalk-north',
      name: 'Marathahalli Bridge North Pedestrian Walkway',
      axis: 'X',
      start: 120,
      end: 195,
      offset: 7.2,
      width: 1.6,
      height: 0.3,
      elevation: 7.5,
      status: 'paved',
      description: 'Elevated cantilevered concrete footway on bridge deck with steel crash barriers'
    },
    {
      id: 'rob-sidewalk-south',
      name: 'Marathahalli Bridge South Pedestrian Walkway',
      axis: 'X',
      start: 120,
      end: 195,
      offset: -7.2,
      width: 1.6,
      height: 0.3,
      elevation: 7.5,
      status: 'paved',
      description: 'Elevated footway overlooking Indian Railways mainline tracks below'
    },

    // ── Spice Garden / Munnekolala Corridor East of Bridge (X: 195 to 270) ──
    // North edge (z ≈ +13.5)
    {
      id: 'spice-n-descent',
      name: 'Bridge Exit North Slope to Munnekolala',
      axis: 'X',
      start: 195,
      end: 225,
      offset: 13.5,
      width: 2.2,
      height: 0.08,
      status: 'missing',
      description: 'Abrupt end of bridge footpath; drops into unpaved dirt and muddy road edge'
    },
    {
      id: 'spice-n-bazaar',
      name: 'Spice Garden Roadside Market & Bakery Front',
      axis: 'X',
      start: 225,
      end: 248,
      offset: 13.5,
      width: 2.4,
      height: 0.20,
      status: 'encroached',
      description: 'Narrow paved curb heavily encroached by bakery display, chai stall, fruit crates'
    },
    {
      id: 'spice-n-busstop',
      name: 'Spice Garden Bus Stop Platform & Waiting Area',
      axis: 'X',
      start: 248,
      end: 270,
      offset: 13.5,
      width: 3.2,
      height: 0.25,
      status: 'paved',
      description: 'BMTC passenger boarding platform with shelter canopy and timetable post'
    },

    // South edge (z ≈ -13.5)
    {
      id: 'spice-s-descent',
      name: 'Bridge Exit South Service Link',
      axis: 'X',
      start: 195,
      end: 220,
      offset: -13.5,
      width: 2.2,
      height: 0.06,
      status: 'missing',
      description: 'Completely unpaved dirt shoulder; pedestrians forced onto roadway'
    },
    {
      id: 'spice-s-shops',
      name: 'Munnekolala Electronics & Pharmacy Row',
      axis: 'X',
      start: 220,
      end: 250,
      offset: -13.5,
      width: 2.4,
      height: 0.20,
      status: 'encroached',
      description: 'Encroached by pharmacy parking, repair shop signs, and roadside vendor stalls'
    },
    {
      id: 'spice-s-terminus',
      name: 'Spice Garden East Junction Approach',
      axis: 'X',
      start: 250,
      end: 270,
      offset: -13.5,
      width: 2.2,
      height: 0.06,
      status: 'missing',
      description: 'Missing sidewalk; open gutter culverts and dirt road boundary'
    }
  ], []);

  return (
    <group name="MarathahalliFootpathNetwork">
      {segments.map((seg) => (
        <FootpathSegmentMesh key={seg.id} segment={seg} auditMode={auditMode} isNight={isNight} />
      ))}
      <AnimatedPedestrians isNight={isNight} />
    </group>
  );
};

// ── Subcomponent: Animated Pedestrians walking along footpaths and crossings ──
const AnimatedPedestrians: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const pedestriansRef = useRef<THREE.Group>(null);
  
  // Define pedestrian routes along major footpaths and crossings
  const routes = useMemo(() => [
    // 1. Southbound ORR footpath (Multiplex to signal)
    { start: [-23.5, 0.35, -150], end: [-23.5, 0.35, -25], speed: 3.2, dir: 1, color: '#1e3a8a' },
    { start: [-23.5, 0.35, -30], end: [-23.5, 0.35, -140], speed: 2.8, dir: -1, color: '#b91c1c' },
    // 2. Northbound ORR footpath (Kalamandir/Brand Factory to signal)
    { start: [23.5, 0.35, 120], end: [23.5, 0.35, 25], speed: 3.0, dir: -1, color: '#047857' },
    { start: [23.5, 0.35, 30], end: [23.5, 0.35, 140], speed: 3.4, dir: 1, color: '#d97706' },
    // 3. HAL Road North footpath
    { start: [-140, 0.35, 13.0], end: [-30, 0.35, 13.0], speed: 3.1, dir: 1, color: '#4338ca' },
    { start: [-35, 0.35, 13.0], end: [-135, 0.35, 13.0], speed: 2.9, dir: -1, color: '#c026d3' },
    // 4. Varthur Road North footpath (Spice Garden to bridge)
    { start: [35, 0.35, 13.0], end: [115, 0.35, 13.0], speed: 3.3, dir: 1, color: '#0284c7' },
    { start: [110, 0.35, 13.0], end: [35, 0.35, 13.0], speed: 2.7, dir: -1, color: '#e11d48' },
    // 5. Skywalk pedestrian flow (elevated at y = 7.5)
    { start: [-18, 7.55, 32], end: [18, 7.55, 32], speed: 2.5, dir: 1, color: '#15803d' },
    { start: [16, 7.55, 32], end: [-16, 7.55, 32], speed: 2.6, dir: -1, color: '#9333ea' },
    // 6. ROB bridge sidewalk
    { start: [125, 7.8, 7.2], end: [190, 7.8, 7.2], speed: 3.0, dir: 1, color: '#f59e0b' },
    { start: [185, 7.8, -7.2], end: [125, 7.8, -7.2], speed: 2.9, dir: -1, color: '#64748b' }
  ], []);

  // Track progress of each pedestrian
  const progress = useRef(routes.map((_, i) => (i * 0.15) % 1.0));

  useFrame((_, delta) => {
    if (!pedestriansRef.current) return;
    const safeDelta = Math.min(delta, 0.1);
    
    pedestriansRef.current.children.forEach((child, idx) => {
      const route = routes[idx];
      const dist = Math.hypot(route.end[0] - route.start[0], route.end[2] - route.start[2]);
      const advance = (route.speed * safeDelta) / dist;
      
      progress.current[idx] = (progress.current[idx] + advance) % 1.0;
      const t = progress.current[idx];
      
      const px = route.start[0] + (route.end[0] - route.start[0]) * t;
      const py = route.start[1];
      const pz = route.start[2] + (route.end[2] - route.start[2]) * t;
      
      child.position.set(px, py, pz);
    });
  });

  return (
    <group ref={pedestriansRef} name="PedestrianWalkers">
      {routes.map((r, i) => (
        <group key={i} position={r.start as [number, number, number]}>
          {/* Person Torso */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.85, 8]} />
            <meshStandardMaterial color={r.color} roughness={0.7} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 1.25, 0]}>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color="#fed7aa" />
          </mesh>
          {/* Night subtle silhouette / visibility glow */}
          {isNight && (
            <mesh position={[0, 0.65, 0]}>
              <sphereGeometry args={[0.22, 6, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

// ── Segment Mesh Renderer ──
const FootpathSegmentMesh: React.FC<{
  segment: FootpathSegment;
  auditMode: boolean;
  isNight: boolean;
}> = ({ segment, auditMode, isNight }) => {
  const { axis, start, end, offset, width, height, status, elevation = 0 } = segment;

  const length = Math.abs(end - start);
  const centerCoord = (start + end) / 2;

  // Audit Mode Colors:
  // 🟢 Green = Paved & Walkable
  // 🔴 Red = Missing / Hazardous Shoulder
  // 🟡 Amber = Encroached / Metro Blocked
  const auditColor = useMemo(() => {
    switch (status) {
      case 'paved':
        return '#22c55e'; // Bright emerald green
      case 'missing':
        return '#ef4444'; // Bright crimson red
      case 'encroached':
        return '#f59e0b'; // Amber yellow
      case 'metro_blocked':
        return '#eab308'; // Safety gold yellow
      default:
        return '#38bdf8';
    }
  }, [status]);

  // Realistic Physical Materials:
  const surfaceMat = useMemo(() => {
    if (status === 'missing') {
      // Raw dirt/gravel road shoulder
      return new THREE.MeshStandardMaterial({
        color: '#6b5847',
        roughness: 0.98,
        metalness: 0.02
      });
    }
    if (status === 'metro_blocked') {
      // Pitted broken asphalt / construction crushed gravel
      return new THREE.MeshStandardMaterial({
        color: '#5c544d',
        roughness: 0.95,
        metalness: 0.05
      });
    }
    // 'paved' and 'encroached' use concrete sidewalk pavers
    return new THREE.MeshStandardMaterial({
      color: '#8b929a',
      roughness: 0.88,
      metalness: 0.08
    });
  }, [status]);

  // Compute position and dimensions based on orientation axis
  const isXAxis = axis === 'X';
  const posX = isXAxis ? centerCoord : offset;
  const posZ = isXAxis ? offset : centerCoord;
  const sizeX = isXAxis ? length : width;
  const sizeZ = isXAxis ? width : length;
  const posY = elevation + height / 2;

  return (
    <group position={[posX, posY, posZ]}>
      {/* ── Main Footpath Surface Slab ── */}
      <mesh receiveShadow castShadow={status === 'paved' || status === 'encroached'} material={surfaceMat}>
        <boxGeometry args={[sizeX, height, sizeZ]} />
      </mesh>

      {/* ── Raised Curb Stone along Road Edge (Only if Paved or Encroached) ── */}
      {(status === 'paved' || status === 'encroached') && (
        <CurbStoneLine
          axis={axis}
          length={length}
          width={width}
          curbHeight={height}
          roadSide={offset > 0 ? -1 : 1}
        />
      )}

      {/* ── Tactile Yellow Braille Tiles for Visually Impaired (on Paved sections) ── */}
      {status === 'paved' && (
        <TactileStrip
          axis={axis}
          length={length}
          width={width}
          curbHeight={height}
          roadSide={offset > 0 ? -1 : 1}
        />
      )}

      {/* ── Encroachment Obstacles (Vendor thelas, crates, parked scooter) ── */}
      {status === 'encroached' && (
        <EncroachmentObstacles axis={axis} length={length} isNight={isNight} />
      )}

      {/* ── Metro Construction Safety Barricade along Blocked Footpath ── */}
      {status === 'metro_blocked' && (
        <MetroConstructionBarricadeLine axis={axis} length={length} isNight={isNight} />
      )}

      {/* ── Missing Footpath Mud Ruts & Broken Culvert Slabs ── */}
      {status === 'missing' && (
        <BrokenDrainCulverts axis={axis} length={length} />
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* AUDIT MODE OVERLAY: Floating glowing ribbon + status beacon          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {auditMode && (
        <group position={[0, height / 2 + 0.15, 0]}>
          {/* Glowing Status Ribbon */}
          <mesh>
            <boxGeometry args={[sizeX, 0.08, sizeZ]} />
            <meshStandardMaterial
              color={auditColor}
              emissive={auditColor}
              emissiveIntensity={2.4}
              transparent
              opacity={0.88}
              roughness={0.2}
            />
          </mesh>

          {/* Pulsing Status Core Dot at center */}
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial
              color={auditColor}
              emissive={auditColor}
              emissiveIntensity={3.5}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

// ── Subcomponent: Yellow & Black Alternating BBMP Curb Stones ──
const CurbStoneLine: React.FC<{
  axis: 'X' | 'Z';
  length: number;
  width: number;
  curbHeight: number;
  roadSide: 1 | -1;
}> = ({ axis, length, width, curbHeight, roadSide }) => {
  const blockLength = 1.6;
  const count = Math.max(1, Math.floor(length / blockLength));
  const isX = axis === 'X';

  const curbOffset = (width / 2) * roadSide;

  return (
    <group position={isX ? [0, 0, curbOffset] : [curbOffset, 0, 0]}>
      {Array.from({ length: count }).map((_, idx) => {
        const isYellow = idx % 2 === 0;
        const pos = -length / 2 + (idx + 0.5) * blockLength;
        return (
          <mesh
            key={idx}
            position={isX ? [pos, 0.02, 0] : [0, 0.02, pos]}
            castShadow
          >
            <boxGeometry args={isX ? [blockLength * 0.96, curbHeight + 0.04, 0.35] : [0.35, curbHeight + 0.04, blockLength * 0.96]} />
            <meshStandardMaterial color={isYellow ? '#facc15' : '#1e293b'} roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
};

// ── Subcomponent: Yellow Tactile Paving Strip ──
const TactileStrip: React.FC<{
  axis: 'X' | 'Z';
  length: number;
  width: number;
  curbHeight: number;
  roadSide: 1 | -1;
}> = ({ axis, length, width, curbHeight, roadSide }) => {
  const isX = axis === 'X';
  const tactileOffset = (width / 2 - 0.55) * roadSide;

  return (
    <mesh
      position={isX ? [0, curbHeight / 2 + 0.01, tactileOffset] : [tactileOffset, curbHeight / 2 + 0.01, 0]}
    >
      <boxGeometry args={isX ? [length * 0.98, 0.02, 0.4] : [0.4, 0.02, length * 0.98]} />
      <meshStandardMaterial color="#eab308" roughness={0.6} />
    </mesh>
  );
};

// ── Subcomponent: Encroachment Obstacles (Vendor stalls, fruit carts, scooter) ──
const EncroachmentObstacles: React.FC<{
  axis: 'X' | 'Z';
  length: number;
  isNight: boolean;
}> = ({ axis, length, isNight }) => {
  const isX = axis === 'X';
  const positions = useMemo(() => {
    const list: number[] = [];
    for (let p = -length / 2 + 6; p < length / 2 - 6; p += 18) {
      list.push(p);
    }
    return list;
  }, [length]);

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={isX ? [pos, 0.3, 0] : [0, 0.3, pos]}>
          {/* Wooden Fruit Pushcart (Thela) */}
          {i % 2 === 0 ? (
            <group>
              {/* Cart wooden bed */}
              <mesh position={[0, 0.45, 0]} castShadow>
                <boxGeometry args={[1.6, 0.15, 1.1]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>
              {/* Spoke wheels */}
              <mesh position={[-0.6, 0.3, 0.55]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 10]} />
                <meshStandardMaterial color="#1f2937" metalness={0.8} />
              </mesh>
              <mesh position={[0.6, 0.3, 0.55]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 10]} />
                <meshStandardMaterial color="#1f2937" metalness={0.8} />
              </mesh>
              {/* Colorful umbrella / tarpaulin awning */}
              <mesh position={[0, 1.8, 0]} rotation={[0, 0, 0.1]}>
                <cylinderGeometry args={[0.9, 1.4, 0.3, 10]} />
                <meshStandardMaterial color="#dc2626" roughness={0.7} />
              </mesh>
              <mesh position={[0, 1.0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
                <meshStandardMaterial color="#9ca3af" metalness={0.7} />
              </mesh>
              {isNight && (
                <mesh position={[0, 1.4, 0]}>
                  <sphereGeometry args={[0.08, 6, 6]} />
                  <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={3} />
                </mesh>
              )}
            </group>
          ) : (
            /* Parked Scooter Blocking Footpath */
            <group position={[0, 0.35, 0]} rotation={[0, Math.PI / 3, 0]}>
              <mesh position={[0, 0.25, 0]} castShadow>
                <boxGeometry args={[1.2, 0.5, 0.4]} />
                <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.6} />
              </mesh>
              <mesh position={[0.5, 0.6, 0]}>
                <boxGeometry args={[0.1, 0.5, 0.6]} />
                <meshStandardMaterial color="#1f2937" />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

// ── Subcomponent: Metro Construction Barricades Blocking Footpath ──
const MetroConstructionBarricadeLine: React.FC<{
  axis: 'X' | 'Z';
  length: number;
  isNight: boolean;
}> = ({ axis, length, isNight }) => {
  const panelLength = 3.6;
  const count = Math.max(1, Math.floor(length / panelLength));
  const isX = axis === 'X';

  return (
    <group position={[0, 0.8, 0]}>
      {Array.from({ length: count }).map((_, idx) => {
        const isYellow = idx % 2 === 0;
        const pos = -length / 2 + (idx + 0.5) * panelLength;
        return (
          <group key={idx} position={isX ? [pos, 0, 0] : [0, 0, pos]}>
            {/* Corrugated safety barricade sheet (BMRCL Yellow & Blue) */}
            <mesh castShadow>
              <boxGeometry args={isX ? [panelLength * 0.95, 1.6, 0.12] : [0.12, 1.6, panelLength * 0.95]} />
              <meshStandardMaterial
                color={isYellow ? '#eab308' : '#0284c7'}
                roughness={0.6}
                metalness={0.3}
              />
            </mesh>

            {/* BMRCL Logo Emblem Stripe */}
            <mesh position={isX ? [0, 0.1, 0.07] : [0.07, 0.1, 0]}>
              <boxGeometry args={isX ? [panelLength * 0.8, 0.3, 0.02] : [0.02, 0.3, panelLength * 0.8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>

            {/* Red Warning Hazard Cone beside barricade */}
            <mesh position={isX ? [0, -0.5, 0.7] : [0.7, -0.5, 0]}>
              <cylinderGeometry args={[0.08, 0.25, 0.65, 8]} />
              <meshStandardMaterial
                color="#ea580c"
                emissive="#ea580c"
                emissiveIntensity={isNight ? 1.2 : 0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ── Subcomponent: Broken Gutter / Drain Slabs on Missing Footpath ──
const BrokenDrainCulverts: React.FC<{ axis: 'X' | 'Z'; length: number }> = ({ axis, length }) => {
  const isX = axis === 'X';
  const positions = useMemo(() => {
    const list: number[] = [];
    for (let p = -length / 2 + 5; p < length / 2 - 5; p += 14) {
      list.push(p);
    }
    return list;
  }, [length]);

  return (
    <group position={[0, 0.06, 0]}>
      {positions.map((p, idx) => (
        <group key={idx} position={isX ? [p, 0, 0] : [0, 0, p]} rotation={[0, (idx % 3) * 0.2 - 0.2, 0]}>
          {/* Cracked concrete drain slab */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={isX ? [1.8, 0.12, 1.2] : [1.2, 0.12, 1.8]} />
            <meshStandardMaterial color="#52525b" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

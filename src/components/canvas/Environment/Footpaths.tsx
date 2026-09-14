import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createOrrOffsetRibbonGeometry,
  getOrrOffsetPointAtZ,
  getOrrRoadFrameAtZ
} from '../../../data/RealRoadData';
import { MARATHAHALLI_SKYWALK_DECK_POINTS } from '../../../data/marathahalliDemo';

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
  elevation?: number; // base Y elevation for explicitly elevated paths
  sourcePath?: [number, number][]; // source-mapped [x,z] path used by the audit overlay
  sourceWayIds?: string[];
  description: string;
}

function createPathRibbonGeometry(points: [number, number][], width: number, y: number) {
  const positions: number[] = [];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const dx = current[0] - previous[0];
    const dz = current[1] - previous[1];
    const length = Math.hypot(dx, dz);
    if (length < 0.05) continue;
    const nx = (-dz / length) * (width / 2);
    const nz = (dx / length) * (width / 2);
    positions.push(
      previous[0] + nx, y, previous[1] + nz,
      current[0] + nx, y, current[1] + nz,
      previous[0] - nx, y, previous[1] - nz,
      current[0] + nx, y, current[1] + nz,
      current[0] - nx, y, current[1] - nz,
      previous[0] - nx, y, previous[1] - nz
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
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

    // ── Spice Garden / Munnekolala source-mapped footway audit ──
    // These paths follow the compiled OSM footway traces instead of the old
    // x=225–270 placeholder frontage. The OSM layer renders the underlying
    // geometry continuously; these modelled status colors appear only when
    // AUDIT PATHS is enabled and remain explicitly field-verification data.
    {
      id: 'spice-source-north-frontage',
      name: 'OSM Varthur Road North Footway to Spice Garden',
      axis: 'X',
      start: 414,
      end: 841,
      offset: -35,
      width: 2.0,
      height: 0.08,
      status: 'paved',
      sourcePath: [[414.9, -6.8], [583.2, -19.4], [661.9, -25.7], [749.3, -32.4], [811.4, -35.8], [840.6, -35.3]],
      sourceWayIds: ['way/1225572738'],
      description: 'Source-mapped footway trace; surface condition still needs field verification'
    },
    {
      id: 'spice-source-south-frontage',
      name: 'OSM Varthur Road South Footway to Spice Garden',
      axis: 'X',
      start: 413,
      end: 835,
      offset: -61,
      width: 2.0,
      height: 0.08,
      status: 'encroached',
      sourcePath: [[413.3, -29.1], [442.3, -31.6], [530, -39.2], [787.9, -58.2], [834.9, -61.6]],
      sourceWayIds: ['way/1231738940'],
      description: 'Source-mapped footway trace; encroachment status is a modelled inspection scenario'
    },
    {
      id: 'spice-source-service-footway',
      name: 'Spice Garden Service Road Footway & Bus Stop Link',
      axis: 'X',
      start: 835,
      end: 910,
      offset: -70,
      width: 2.2,
      height: 0.08,
      status: 'encroached',
      sourcePath: [[834.9, -70.6], [849.2, -67.6], [863.1, -68.2], [877.1, -70.4], [887.8, -69.9], [909.3, -77.1]],
      sourceWayIds: ['way/1225572747', 'way/1225572746'],
      description: 'Source-mapped service-road footway near Spice Garden bus stop; field condition needs verification'
    },
    {
      id: 'spice-source-east-approach-north',
      name: 'Spice Garden Inner Road North Footway Approach',
      axis: 'X',
      start: 837,
      end: 905,
      offset: 0,
      width: 1.8,
      height: 0.08,
      status: 'missing',
      sourcePath: [[857.7, -20.8], [857.2, -18.2], [835.9, 78.8], [832.9, 97.0], [882.7, 115.3]],
      sourceWayIds: ['way/1311089011'],
      description: 'Source-mapped inner-road trace; missing/unsafe status is a modelled field-audit scenario'
    },
    {
      id: 'spice-source-east-approach-south',
      name: 'Spice Garden Inner Road South Footway Approach',
      axis: 'X',
      start: 857,
      end: 904,
      offset: -28,
      width: 1.8,
      height: 0.08,
      status: 'missing',
      sourcePath: [[857.7, -20.8], [857.2, -18.2], [895.2, -27.8], [899.2, -39.4], [904.0, -47.5]],
      sourceWayIds: ['way/1311089014'],
      description: 'Source-mapped inner-road trace; missing/unsafe status is a modelled field-audit scenario'
    }
  ], []);

  return (
    <group name="MarathahalliFootpathNetwork">
      {segments.map((seg) => seg.sourcePath ? (
        <SourceMappedFootpathAuditSegment key={seg.id} segment={seg} auditMode={auditMode} />
      ) : (
        <FootpathSegmentMesh key={seg.id} segment={seg} auditMode={auditMode} isNight={isNight} />
      ))}
      <AnimatedPedestrians isNight={isNight} />
    </group>
  );
};

// ── Subcomponent: Animated Pedestrians walking along footpaths and crossings ──
interface PedestrianRoute {
  curve: THREE.CatmullRomCurve3;
  length: number;
  start: [number, number, number];
  speed: number;
  color: string;
}

function createPedestrianRoute(
  points: [number, number, number][],
  speed: number,
  color: string
): PedestrianRoute {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'centripetal',
    0.18
  );

  return {
    curve,
    length: Math.max(1, curve.getLength()),
    start: points[0],
    speed,
    color
  };
}

const AnimatedPedestrians: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const pedestriansRef = useRef<THREE.Group>(null);
  const position = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);

  // These routes use the same curved ORR frame as the footpath slabs. The
  // intermediate points are deliberate: a walker should stay on the sidewalk
  // through the junction bend instead of taking a straight chord across it.
  const routes = useMemo(() => {
    const orrFootpathPoint = (z: number, semanticOffset: number): [number, number, number] => {
      const lateralOffset = semanticOffset >= 0 ? -Math.abs(semanticOffset) : Math.abs(semanticOffset);
      const [x, projectedZ] = getOrrOffsetPointAtZ(z, lateralOffset);
      return [x, 0.35, projectedZ];
    };
    const skywalkDeckRoute: [number, number, number][] = MARATHAHALLI_SKYWALK_DECK_POINTS.map(
      ([x, z]) => [x, 7.55, z]
    );

    return [
      // ORR southbound footpath: Innovative Multiplex to the signal.
      createPedestrianRoute([
        orrFootpathPoint(-150, -23.5),
        orrFootpathPoint(-92, -23.5),
        orrFootpathPoint(-25, -23.5)
      ], 3.2, '#1e3a8a'),
      createPedestrianRoute([
        orrFootpathPoint(-30, -23.5),
        orrFootpathPoint(-82, -23.5),
        orrFootpathPoint(-140, -23.5)
      ], 2.8, '#b91c1c'),

      // ORR northbound footpath: Kalamandir / Brand Factory to the signal.
      createPedestrianRoute([
        orrFootpathPoint(120, 23.5),
        orrFootpathPoint(72, 23.5),
        orrFootpathPoint(25, 23.5)
      ], 3.0, '#047857'),
      createPedestrianRoute([
        orrFootpathPoint(30, 23.5),
        orrFootpathPoint(78, 23.5),
        orrFootpathPoint(140, 23.5)
      ], 3.4, '#d97706'),

      // HAL Road north footpath.
      createPedestrianRoute([[-140, 0.35, 13.0], [-88, 0.35, 13.0], [-30, 0.35, 13.0]], 3.1, '#4338ca'),
      createPedestrianRoute([[-35, 0.35, 13.0], [-82, 0.35, 13.0], [-135, 0.35, 13.0]], 2.9, '#c026d3'),

      // Varthur Road north footpath: Spice Garden approach to the bridge.
      createPedestrianRoute([[35, 0.35, 13.0], [74, 0.35, 13.0], [115, 0.35, 13.0]], 3.3, '#0284c7'),
      createPedestrianRoute([[110, 0.35, 13.0], [72, 0.35, 13.0], [35, 0.35, 13.0]], 2.7, '#e11d48'),

      // Source-mapped Marathahalli Skywalk flow: x≈65, z≈−5→25.
      createPedestrianRoute(skywalkDeckRoute, 2.5, '#15803d'),
      createPedestrianRoute([...skywalkDeckRoute].reverse(), 2.6, '#9333ea'),

      // Varthur viaduct footway movement is supplied by the source-mapped
      // bridge footways; the old invented ROB corridor is intentionally not
      // animated here.
    ];
  }, []);

  const progress = useRef(routes.map((_, index) => (index * 0.15) % 1));

  useFrame((_, delta) => {
    if (!pedestriansRef.current) return;
    const safeDelta = Math.min(delta, 0.1);

    pedestriansRef.current.children.forEach((child, index) => {
      const route = routes[index];
      progress.current[index] = (progress.current[index] + (route.speed * safeDelta) / route.length) % 1;
      const t = progress.current[index];

      route.curve.getPointAt(t, position);
      route.curve.getTangentAt(t, tangent).normalize();
      child.position.copy(position);
      child.rotation.y = Math.atan2(tangent.x, tangent.z);
    });
  });

  return (
    <group ref={pedestriansRef} name="PedestrianWalkers">
      {routes.map((route, index) => (
        <group key={index} position={route.start}>
          {/* Person torso */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.85, 8]} />
            <meshStandardMaterial color={route.color} roughness={0.7} />
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
  const isOrrCurve = axis === 'Z' && segment.id.startsWith('orr-');
  const lateralOffset = isOrrCurve
    ? (offset >= 0 ? -Math.abs(offset) : Math.abs(offset))
    : 0;
  const roadFrame = isOrrCurve ? getOrrRoadFrameAtZ(centerCoord) : null;
  const projectedCenter = isOrrCurve
    ? getOrrOffsetPointAtZ(centerCoord, lateralOffset)
    : null;
  const renderPosX = projectedCenter?.[0] ?? posX;
  const renderPosZ = projectedCenter?.[1] ?? posZ;
  const renderRotation = roadFrame ? Math.atan2(roadFrame.tangentX, roadFrame.tangentZ) : 0;

  const curvedSurfaceGeometry = useMemo(() => {
    if (!isOrrCurve) return null;
    const geometry = createOrrOffsetRibbonGeometry(
      start,
      end,
      lateralOffset,
      width,
      height / 2 + 0.01,
      36
    );
    geometry.translate(-renderPosX, 0, -renderPosZ);
    // The parent rotates local +Z to the road tangent for the curb,
    // tactile strip, and obstruction details. Counter-rotate the already
    // curved world-space ribbon so it is not rotated a second time.
    geometry.rotateY(-renderRotation);
    return geometry;
  }, [end, height, isOrrCurve, lateralOffset, renderPosX, renderPosZ, renderRotation, start, width]);

  const curvedAuditGeometry = useMemo(() => {
    if (!isOrrCurve) return null;
    const geometry = createOrrOffsetRibbonGeometry(
      start,
      end,
      lateralOffset,
      width,
      height / 2 + 0.16,
      36
    );
    geometry.translate(-renderPosX, 0, -renderPosZ);
    geometry.rotateY(-renderRotation);
    return geometry;
  }, [end, height, isOrrCurve, lateralOffset, renderPosX, renderPosZ, renderRotation, start, width]);

  return (
    <group position={[renderPosX, posY, renderPosZ]} rotation={[0, renderRotation, 0]}>
      {/* ── Main Footpath Surface Slab ── */}
      {curvedSurfaceGeometry ? (
        <mesh
          geometry={curvedSurfaceGeometry}
          receiveShadow
          castShadow={status === 'paved' || status === 'encroached'}
          material={surfaceMat}
        />
      ) : (
        <mesh receiveShadow castShadow={status === 'paved' || status === 'encroached'} material={surfaceMat}>
          <boxGeometry args={[sizeX, height, sizeZ]} />
        </mesh>
      )}

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
          {curvedAuditGeometry ? (
            <mesh geometry={curvedAuditGeometry} position={[0, -(height / 2 + 0.15), 0]} renderOrder={4}>
              <meshStandardMaterial
                color={auditColor}
                emissive={auditColor}
                emissiveIntensity={2.4}
                transparent
                opacity={0.88}
                roughness={0.2}
              />
            </mesh>
          ) : (
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
          )}

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

const SourceMappedFootpathAuditSegment: React.FC<{
  segment: FootpathSegment;
  auditMode: boolean;
}> = ({ segment, auditMode }) => {
  const auditColor = useMemo(() => {
    switch (segment.status) {
      case 'paved':
        return '#22c55e';
      case 'missing':
        return '#ef4444';
      case 'encroached':
        return '#f59e0b';
      case 'metro_blocked':
        return '#eab308';
      default:
        return '#38bdf8';
    }
  }, [segment.status]);
  const geometry = useMemo(
    () => createPathRibbonGeometry(segment.sourcePath || [], segment.width, 0.38),
    [segment.sourcePath, segment.width]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!auditMode) return null;
  return (
    <group name={`SourceFootpathAudit-${segment.id}`}>
      <mesh geometry={geometry} renderOrder={5}>
        <meshBasicMaterial color={auditColor} transparent opacity={0.86} depthWrite={false} />
      </mesh>
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

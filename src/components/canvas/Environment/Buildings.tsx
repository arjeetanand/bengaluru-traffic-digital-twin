import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  REAL_LANDMARKS,
  SURROUNDING_OSM_BUILDINGS,
  LandmarkBuilding,
  SurroundingBuilding
} from '../../../data/marathahalliBuildingsData';
import {
  createLandmarkBannerTexture,
  createGlassCurtainTexture,
  createCommercialGridTexture,
  createResidentialApartmentTexture
} from './BuildingMaterials';

interface BuildingsProps {
  isNight: boolean;
  includeSurroundingBuildings?: boolean;
}

export const Buildings: React.FC<BuildingsProps> = ({ isNight, includeSurroundingBuildings = false }) => {
  // ── 1. Batch-merge surrounding OSM buildings by category for render performance ──
  const { commercialBatch, retailBatch, apartmentsBatch } = useMemo(() => {
    if (!includeSurroundingBuildings) {
      return { commercialBatch: null, retailBatch: null, apartmentsBatch: null };
    }

    const commercialGeoms: THREE.BufferGeometry[] = [];
    const retailGeoms: THREE.BufferGeometry[] = [];
    const residentialGeoms: THREE.BufferGeometry[] = [];

    // Helper to generate an extruded building geometry from 2D relative points
    const makeExtrudedGeom = (b: SurroundingBuilding): THREE.BufferGeometry | null => {
      if (!b.pts || b.pts.length < 3) return null;
      try {
        const shape = new THREE.Shape();
        // Use the same world convention as the GPS projection: positive
        // source northing becomes positive world Z while extrusion remains
        // above the ground plane.
        shape.moveTo(b.pts[0][0], -b.pts[0][1]);
        for (let i = 1; i < b.pts.length; i++) {
          shape.lineTo(b.pts[i][0], -b.pts[i][1]);
        }
        shape.closePath();

        const geom = new THREE.ExtrudeGeometry(shape, {
          depth: b.height,
          bevelEnabled: false
        });

        // Rotate from XY extrusion to XZ ground and Y vertical height.
        geom.rotateX(-Math.PI / 2);
        // Translate to building's world centroid
        geom.translate(b.cx, 0, b.cz);
        return geom;
      } catch (err) {
        return null;
      }
    };

    const isInsideHandcraftedCorridor = (cx: number, cz: number) => {
      // Brand Factory Mall zone (East side, x: 25 to 75, z: 35 to 85)
      if (cx >= 25 && cx <= 75 && cz >= 35 && cz <= 85) return true;
      // Kalamandir & Nalli Silks zone (East side north, x: 25 to 75, z: 300 to 375)
      if (cx >= 25 && cx <= 75 && cz >= 300 && cz <= 375) return true;
      // Innovative Multiplex zone (source-aligned west corridor footprint)
      if (cx >= -314 && cx <= -258 && cz >= -565 && cz <= -505) return true;
      // Outlet Row (Nike, Adidas, Puma, Reebok) (East side south, x: 25 to 75, z: -170 to -55)
      if (cx >= 25 && cx <= 75 && cz >= -170 && cz <= -55) return true;
      return false;
    };

    for (const b of SURROUNDING_OSM_BUILDINGS) {
      if (isInsideHandcraftedCorridor(b.cx, b.cz)) continue;

      const g = makeExtrudedGeom(b);
      if (!g) continue;

      if (b.type === 'commercial') {
        commercialGeoms.push(g);
      } else if (b.type === 'retail') {
        retailGeoms.push(g);
      } else {
        residentialGeoms.push(g);
      }
    }

    const safeMerge = (arr: THREE.BufferGeometry[]): THREE.BufferGeometry | null => {
      if (arr.length === 0) return null;
      try {
        return mergeGeometries(arr, false);
      } catch (e) {
        console.warn('Failed to merge building batch:', e);
        return null;
      }
    };

    return {
      commercialBatch: safeMerge(commercialGeoms),
      retailBatch: safeMerge(retailGeoms),
      apartmentsBatch: safeMerge(residentialGeoms)
    };
  }, [includeSurroundingBuildings]);

  // Textures for surrounding buildings
  const curtainTexture = useMemo(() => createGlassCurtainTexture(isNight), [isNight]);
  const commercialTexture = useMemo(() => createCommercialGridTexture(isNight), [isNight]);
  const apartmentTexture = useMemo(() => createResidentialApartmentTexture(isNight), [isNight]);

  // Filter out landmarks custom-built in West and East corridor models
  const remainingLandmarks = useMemo(
    () => REAL_LANDMARKS.filter((lm) => !HANDCRAFTED_CORRIDOR_LANDMARKS.has(lm.id)),
    []
  );

  return (
    <group name="MarathahalliRealOsmBuildings">
      {/* ── Optional legacy merged surroundings; the OSM snapshot is the default source layer. ── */}
      {includeSurroundingBuildings && commercialBatch && (
        <mesh geometry={commercialBatch} castShadow receiveShadow>
          <meshStandardMaterial
            map={curtainTexture}
            roughness={0.35}
            metalness={0.65}
            emissive={isNight ? '#38bdf8' : '#000000'}
            emissiveIntensity={isNight ? 0.35 : 0}
          />
        </mesh>
      )}

      {includeSurroundingBuildings && retailBatch && (
        <mesh geometry={retailBatch} castShadow receiveShadow>
          <meshStandardMaterial
            map={commercialTexture}
            roughness={0.65}
            metalness={0.25}
            emissive={isNight ? '#fde047' : '#000000'}
            emissiveIntensity={isNight ? 0.4 : 0}
          />
        </mesh>
      )}

      {includeSurroundingBuildings && apartmentsBatch && (
        <mesh geometry={apartmentsBatch} castShadow receiveShadow>
          <meshStandardMaterial
            map={apartmentTexture}
            roughness={0.75}
            metalness={0.15}
            emissive={isNight ? '#fef3c7' : '#000000'}
            emissiveIntensity={isNight ? 0.3 : 0}
          />
        </mesh>
      )}

      {/* ── Real Landmark Buildings with High-Res Storefront Signage (Excluding Handcrafted Corridor Twins) ── */}
      {remainingLandmarks.map((lm) => (
        <LandmarkBuildingBlock key={lm.id} landmark={lm} isNight={isNight} />
      ))}
    </group>
  );
};

// Handcrafted landmarks already built with 100% realism in WestCorridorBuildings & EastCorridorBuildings
const HANDCRAFTED_CORRIDOR_LANDMARKS = new Set([
  'lm_brand_factory',
  'lm_tanishq',
  'lm_krisna_senate',
  'lm_krishna_summit',
  'lm_krishna_grand',
  'lm_kalamandir',
  'lm_nalli'
]);

// ── Landmark Building Component with Extruded Footprint, Storefront Banner & Rooftops ──
const LandmarkBuildingBlock: React.FC<{
  landmark: LandmarkBuilding;
  isNight: boolean;
}> = ({ landmark, isNight }) => {
  const { cx, cz, height, pts, brandColor, bannerTitle, bannerSubtitle, facadeStyle } = landmark;

  // Compute footprint bounding box to scale facades and signage banners
  const { spanX, spanZ, minX, maxX, minZ, maxZ } = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of pts) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minZ) minZ = p[1];
      if (p[1] > maxZ) maxZ = p[1];
    }
    return {
      spanX: Math.max(12, maxX - minX),
      spanZ: Math.max(12, maxZ - minZ),
      minX,
      maxX,
      minZ,
      maxZ
    };
  }, [pts]);

  // Extruded structural shape
  const buildingGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i][0], pts[i][1]);
    }
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false
    });
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, [pts, height]);

  // Signboard banner texture
  const bannerTexture = useMemo(() => {
    return createLandmarkBannerTexture(bannerTitle, bannerSubtitle, brandColor, isNight);
  }, [bannerTitle, bannerSubtitle, brandColor, isNight]);

  // Facade texture
  const facadeTexture = useMemo(() => {
    if (facadeStyle === 'glass_curtain') return createGlassCurtainTexture(isNight);
    if (facadeStyle === 'residential_balcony') return createResidentialApartmentTexture(isNight);
    return createCommercialGridTexture(isNight);
  }, [facadeStyle, isNight]);

  // Determine billboard banner placement facing the nearest major road
  const bannerOrientation = useMemo(() => {
    // If closer to ORR (Z axis), face East or West
    // If closer to Crossroad (X axis), face North or South
    if (Math.abs(cx) < Math.abs(cz)) {
      // Facing ORR road center (X = 0)
      const facingWest = cx > 0;
      return {
        pos: [facingWest ? minX - 0.2 : maxX + 0.2, Math.min(height - 3, 16), 0] as [number, number, number],
        rot: [0, facingWest ? -Math.PI / 2 : Math.PI / 2, 0] as [number, number, number],
        width: spanZ * 0.85
      };
    } else {
      // Facing Crossroad center (Z = 0)
      const facingSouth = cz > 0;
      return {
        pos: [0, Math.min(height - 3, 16), facingSouth ? minZ - 0.2 : maxZ + 0.2] as [number, number, number],
        rot: [0, facingSouth ? Math.PI : 0, 0] as [number, number, number],
        width: spanX * 0.85
      };
    }
  }, [cx, cz, minX, maxX, minZ, maxZ, spanX, spanZ, height]);

  return (
    <group position={[cx, 0, cz]}>
      {/* ── Extruded Building Geometry ── */}
      <mesh geometry={buildingGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={brandColor}
          map={facadeTexture}
          roughness={facadeStyle === 'glass_curtain' ? 0.25 : 0.65}
          metalness={facadeStyle === 'glass_curtain' ? 0.75 : 0.2}
          emissive={isNight ? (facadeStyle === 'glass_curtain' ? '#38bdf8' : '#fde047') : '#000000'}
          emissiveIntensity={isNight ? 0.35 : 0}
        />
      </mesh>

      {/* ── High-Resolution Commercial Storefront Signboard Banner ── */}
      <group position={bannerOrientation.pos} rotation={bannerOrientation.rot}>
        {/* Signboard Backing */}
        <mesh castShadow>
          <boxGeometry args={[bannerOrientation.width, 4.2, 0.35]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* High-Resolution Front Signboard Canvas */}
        <mesh position={[0, 0, 0.2]}>
          <planeGeometry args={[bannerOrientation.width * 0.98, 3.9]} />
          <meshStandardMaterial
            map={bannerTexture}
            emissive={isNight ? brandColor : '#ffffff'}
            emissiveIntensity={isNight ? 1.8 : 0.4}
            roughness={0.2}
          />
        </mesh>

        {/* Night Neon Underglow Spotlight Strip */}
        {isNight && (
          <mesh position={[0, -2.2, 0.25]}>
            <boxGeometry args={[bannerOrientation.width * 0.9, 0.15, 0.1]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={2.5}
            />
          </mesh>
        )}
      </group>

      {/* ── Rooftop Parapet, HVAC Chillers & Water Tanks ── */}
      <group position={[0, height, 0]}>
        {/* Commercial HVAC Mechanical Chiller */}
        <mesh position={[spanX * 0.15, 1.4, spanZ * 0.1]} castShadow>
          <boxGeometry args={[Math.min(spanX * 0.35, 8), 2.2, Math.min(spanZ * 0.35, 8)]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Overhead Water Tank (Sintex Tank Array) */}
        <mesh position={[-spanX * 0.2, 1.2, -spanZ * 0.15]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 2.4, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        <mesh position={[-spanX * 0.2 + 3.2, 1.2, -spanZ * 0.15]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 2.4, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>

        {/* Lift machine room / rooftop penthouse */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[Math.min(spanX * 0.28, 6), 3.2, Math.min(spanZ * 0.28, 6)]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>

        {/* Communication Antenna Mast & Red Aviation Beacon */}
        <mesh position={[spanX * 0.25, 4.5, -spanZ * 0.2]}>
          <cylinderGeometry args={[0.08, 0.15, 9.0, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Flashing Red Aviation Obstruction Beacon */}
        <mesh position={[spanX * 0.25, 9.2, -spanZ * 0.2]}>
          <sphereGeometry args={[0.35, 8, 8]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={isNight ? 3.5 : 1.2}
          />
        </mesh>
      </group>
    </group>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import {
  GoogleCloudAuthPlugin,
  ReorientationPlugin,
  LoadRegionPlugin,
  SphereRegion
} from '3d-tiles-renderer/plugins';
import { ACTIVE_COORDINATES } from '../../../config/location';

interface Google3DTilesProps {
  apiKey?: string;
  onError?: (err: string) => void;
}

// ── Persistent Browser CacheStorage for Google 3D Tiles ──
// Intercepts tile downloads and caches them permanently in local browser storage.
// Subsequent loads serve 100% from local disk with 0 network calls and 0 API quota cost.
const CACHE_NAME = 'google-3d-tiles-cache-v1';
let isFetchIntercepted = false;

function setupTilesCache() {
  if (isFetchIntercepted || typeof window === 'undefined' || !window.caches) return;
  isFetchIntercepted = true;

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url);

    if (url.includes('tile.googleapis.com') || url.includes('googleapis.com/v1/3dtiles')) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(url);
        if (cached) {
          return cached;
        }
        const networkResp = await originalFetch(input, init);
        if (networkResp.ok) {
          cache.put(url, networkResp.clone());
        }
        return networkResp;
      } catch (e) {
        return originalFetch(input, init);
      }
    }
    return originalFetch(input, init);
  };
}

export const Google3DTiles: React.FC<Google3DTilesProps> = ({ apiKey, onError }) => {
  const { scene, camera, gl } = useThree();
  const tilesRef = useRef<TilesRenderer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const effectiveKey = apiKey || (import.meta.env.VITE_GOOGLE_MAPS_KEY as string) || '';

  useEffect(() => {
    if (!effectiveKey) {
      const msg = 'Google Maps API key missing. Add VITE_GOOGLE_MAPS_KEY to .env or enter your key to stream Photorealistic 3D Tiles.';
      setLoadError(msg);
      onError?.(msg);
      return;
    }

    setLoadError(null);
    setupTilesCache();

    try {
      // Initialize 3D Tiles Renderer for Google Photorealistic 3D Tiles
      const tiles = new TilesRenderer();

      // Register official Google Cloud 3D Tiles authentication
      const googleAuth = new GoogleCloudAuthPlugin({
        apiToken: effectiveKey,
        autoRefreshToken: true,
        useRecommendedSettings: true
      });
      tiles.registerPlugin(googleAuth);

      // Reorient & georeference tiles centered onto Bengaluru Marathahalli junction
      const reorient = new ReorientationPlugin({
        lat: ACTIVE_COORDINATES.lat,
        lon: ACTIVE_COORDINATES.lng,
        height: 0,
        recenter: true
      });
      tiles.registerPlugin(reorient);

      // ── Spatial Bounding: Restrict tile loading strictly to the 450m Marathahalli corridor ──
      // Prevents streaming outside junction bounds, drastically saving download bandwidth & API cost
      const loadRegion = new LoadRegionPlugin();
      loadRegion.addRegion(
        new SphereRegion({
          sphere: new THREE.Sphere(new THREE.Vector3(0, 0, 0), 450),
          mask: true
        })
      );
      tiles.registerPlugin(loadRegion);

      tiles.setCamera(camera);
      tiles.setResolutionFromRenderer(camera, gl);

      tilesRef.current = tiles;
      scene.add(tiles.group);

      return () => {
        scene.remove(tiles.group);
        tiles.dispose();
        tilesRef.current = null;
      };
    } catch (e: any) {
      console.error('Failed to initialize Google 3D Tiles:', e);
      setLoadError(e?.message || 'Failed to initialize Google 3D Tiles');
      onError?.(e?.message || 'Failed to load Google 3D Tiles');
    }
  }, [effectiveKey, camera, gl, scene, onError]);

  // Frame update loop for dynamic LoD tile streaming
  useFrame(() => {
    if (tilesRef.current) {
      tilesRef.current.setCamera(camera);
      tilesRef.current.setResolutionFromRenderer(camera, gl);
      tilesRef.current.update();
    }
  });

  if (loadError) {
    return (
      <group position={[0, 20, 0]}>
        {/* Visual indicator floating billboard */}
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[40, 10, 1]} />
          <meshBasicMaterial color="#1e293b" transparent opacity={0.85} />
        </mesh>
      </group>
    );
  }

  return null;
};

import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
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

// The source snapshot spans roughly 2.1 km from Oracle Tech Hub to Spice
// Garden. This wider mask keeps the optional provider layer useful for the
// same route instead of silently dropping both corridor ends.
const GOOGLE_TILES_REGION_CENTER: [number, number, number] = [0, 0, -700];
const GOOGLE_TILES_REGION_RADIUS = 1550;

function attributionText(value: unknown) {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const Google3DTiles: React.FC<Google3DTilesProps> = ({ apiKey, onError }) => {
  const { scene, camera, gl } = useThree();
  const tilesRef = useRef<TilesRenderer | null>(null);
  const hasReportedError = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attribution, setAttribution] = useState<string | null>(null);

  const effectiveKey = apiKey || (import.meta.env.VITE_GOOGLE_MAPS_KEY as string) || '';

  useEffect(() => {
    hasReportedError.current = false;

    const reportLoadError = (error: unknown) => {
      if (hasReportedError.current) return;
      hasReportedError.current = true;
      const providerMessage = error instanceof Error ? error.message : String(error || '');
      const message = /403/.test(providerMessage)
        ? 'Google Photorealistic 3D Tiles unavailable (provider returned 403).'
        : 'Google Photorealistic 3D Tiles unavailable.';
      setLoadError(message);
      setAttribution(null);
      onError?.(message);
    };

    if (!effectiveKey) {
      const msg = 'Google Maps API key missing. Add VITE_GOOGLE_MAPS_KEY to .env or enter your key to stream Photorealistic 3D Tiles.';
      setLoadError(msg);
      setAttribution(null);
      hasReportedError.current = true;
      onError?.(msg);
      return;
    }

    setLoadError(null);
    setAttribution(null);

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
        // ReorientationPlugin expects radians. The app's source snapshot is
        // stored in metres with +X east / +Z north; the plugin's ENU frame is
        // +X west / +Z north, so the app-frame reflection is applied below.
        lat: THREE.MathUtils.degToRad(ACTIVE_COORDINATES.lat),
        lon: THREE.MathUtils.degToRad(ACTIVE_COORDINATES.lng),
        height: 0,
        recenter: true
      });
      tiles.registerPlugin(reorient);

      const applyAppCoordinateFrame = () => {
        // Google tiles are right-handed ENU (+X west, +Z north), while the
        // OSM/local scene contract is +X east, +Z north. Reflect only X so
        // the optional Google layer lands on the same roads and landmarks.
        tiles.group.scale.x *= -1;
        tiles.group.updateMatrixWorld(true);
      };
      tiles.addEventListener('load-root-tileset', applyAppCoordinateFrame);

      const updateAttribution = () => {
        if (tiles.visibleTiles.size === 0) {
          setAttribution(null);
          return;
        }
        const sourceLines = tiles.getAttributions()
          .filter((entry) => entry.type !== 'image')
          .map((entry) => attributionText(entry.value))
          .filter(Boolean);
        const uniqueSources = [...new Set(sourceLines)];
        setAttribution(['Google Maps', ...uniqueSources].join(' · '));
      };
      const handleLoadError = (event: { error?: unknown }) => {
        reportLoadError(event.error);
        if (tilesRef.current === tiles) {
          tilesRef.current = null;
          scene.remove(tiles.group);
          tiles.dispose();
        }
      };
      tiles.addEventListener('tile-visibility-change', updateAttribution);
      tiles.addEventListener('load-tileset', updateAttribution);
      tiles.addEventListener('load-error', handleLoadError);

      // ── Spatial Bounding: keep loading inside the full Oracle → Spice Garden corridor ──
      const loadRegion = new LoadRegionPlugin();
      loadRegion.addRegion(
        new SphereRegion({
          sphere: new THREE.Sphere(
            new THREE.Vector3(...GOOGLE_TILES_REGION_CENTER),
            GOOGLE_TILES_REGION_RADIUS
          ),
          mask: true
        })
      );
      tiles.registerPlugin(loadRegion);

      tiles.setCamera(camera);
      tiles.setResolutionFromRenderer(camera, gl);

      tilesRef.current = tiles;
      scene.add(tiles.group);

      return () => {
        tiles.removeEventListener('load-root-tileset', applyAppCoordinateFrame);
        tiles.removeEventListener('tile-visibility-change', updateAttribution);
        tiles.removeEventListener('load-tileset', updateAttribution);
        tiles.removeEventListener('load-error', handleLoadError);
        scene.remove(tiles.group);
        tiles.dispose();
        tilesRef.current = null;
        setAttribution(null);
      };
    } catch (e: any) {
      reportLoadError(e);
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
      <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[50, 0]}>
        <div
          aria-label="Google 3D Tiles fallback status"
          style={{
            position: 'absolute',
            right: 20,
            bottom: 112,
            maxWidth: 'min(440px, calc(100vw - 40px))',
            padding: '5px 8px',
            borderRadius: 3,
            border: '1px solid rgba(251, 191, 36, 0.6)',
            background: 'rgba(69, 26, 3, 0.86)',
            color: '#fef3c7',
            fontFamily: 'monospace',
            fontSize: 8,
            lineHeight: 1.35,
            textAlign: 'right',
            textShadow: '0 1px 3px rgba(2, 6, 23, 0.9)'
          }}
        >
          GOOGLE 3D TILES UNAVAILABLE · OSM SOURCE TWIN ACTIVE
        </div>
      </Html>
    );
  }

  return attribution ? (
    <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[50, 0]}>
      <div
        aria-label="Google Maps data attribution"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 112,
          maxWidth: 'min(520px, calc(100vw - 40px))',
          padding: '4px 7px',
          borderRadius: 3,
          background: 'rgba(3, 7, 18, 0.78)',
          color: 'rgba(248, 250, 252, 0.9)',
          fontFamily: 'monospace',
          fontSize: 8,
          lineHeight: 1.35,
          textAlign: 'right',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)'
        }}
      >
        {attribution}
      </div>
    </Html>
  ) : null;
};

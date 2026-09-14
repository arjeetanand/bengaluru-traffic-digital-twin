import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { TilesRenderer } from '3d-tiles-renderer';
import { GoogleCloudAuthPlugin, ReorientationPlugin } from '3d-tiles-renderer/plugins';
import { ACTIVE_COORDINATES } from '../../../config/location';

interface Google3DTilesProps {
  apiKey?: string;
  onError?: (err: string) => void;
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

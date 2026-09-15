import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { GoogleCloudAuthPlugin } from '3d-tiles-renderer/core/plugins';
import { WGS84_ELLIPSOID } from '3d-tiles-renderer/three';
import {
  ReorientationPlugin,
  LoadRegionPlugin,
  SphereRegion
} from '3d-tiles-renderer/plugins';
import { ACTIVE_COORDINATES } from '../../../config/location';

interface Google3DTilesProps {
  apiKey?: string;
  // Scene uses this callback as a one-way gate to reveal the local OSM source
  // layer. It is intentionally called while Google is still unconfirmed so
  // the optional network provider can never blank the source twin.
  onError?: (err: string) => void;
}

type GoogleTilesStatus = 'loading' | 'ready' | 'fallback' | 'unavailable';

const GOOGLE_TILES_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined)?.trim() || '';

// The source snapshot spans roughly 2.1 km from Oracle Tech Hub to Spice
// Garden. LoadRegionPlugin evaluates tile bounds before ReorientationPlugin's
// scene-group transform, so this centre must stay in WGS84/ECEF coordinates,
// not the app's local metre frame.
const GOOGLE_TILES_REGION_CENTER_ECEF = WGS84_ELLIPSOID.getCartographicToPosition(
  THREE.MathUtils.degToRad(ACTIVE_COORDINATES.lat),
  THREE.MathUtils.degToRad(ACTIVE_COORDINATES.lng),
  0,
  new THREE.Vector3()
);
const GOOGLE_TILES_REGION_RADIUS = 1550;
const GOOGLE_TILES_STARTUP_TIMEOUT_MS = 5000;
const MISSING_KEY_MESSAGE = 'Google Maps API key missing. Add a key through the Google 3D Tiles control or VITE_GOOGLE_MAPS_KEY to opt in.';
const LOCAL_FALLBACK_MESSAGE = 'Google Photorealistic 3D Tiles are not yet confirmed; the local OSM source twin remains visible.';
const STARTUP_FALLBACK_MESSAGE = 'Google Photorealistic 3D Tiles did not become visible; the local OSM source twin remains active.';

function attributionText(value: unknown) {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function providerErrorMessage(error: unknown) {
  const providerMessage = error instanceof Error ? error.message : String(error || '');
  if (/\b(?:401|403)\b/.test(providerMessage)) {
    return 'Google Photorealistic 3D Tiles request rejected (check the key, API restriction, and Map Tiles API access).';
  }
  if (/\b429\b/.test(providerMessage)) {
    return 'Google Photorealistic 3D Tiles unavailable (provider quota or rate limit reached).';
  }
  return 'Google Photorealistic 3D Tiles unavailable.';
}

export const Google3DTiles: React.FC<Google3DTilesProps> = ({ apiKey, onError }) => {
  const { scene, camera, gl } = useThree();
  const tilesRef = useRef<TilesRenderer | null>(null);
  const effectiveKey = apiKey?.trim() || GOOGLE_TILES_API_KEY;
  const [providerStatus, setProviderStatus] = useState<GoogleTilesStatus>(effectiveKey ? 'loading' : 'unavailable');
  const [loadError, setLoadError] = useState<string | null>(effectiveKey ? null : MISSING_KEY_MESSAGE);
  const [attribution, setAttribution] = useState<string | null>(null);
  const providerStatusRef = useRef<GoogleTilesStatus>(effectiveKey ? 'loading' : 'unavailable');
  const attributionRef = useRef<string | null>(null);
  const providerHasVisibleTiles = useRef(false);
  const fallbackNotified = useRef(false);
  const failureReported = useRef(false);

  useEffect(() => {
    let disposed = false;
    let rendererDisposed = false;
    let startupTimer: ReturnType<typeof setTimeout> | null = null;

    providerStatusRef.current = effectiveKey ? 'loading' : 'unavailable';
    attributionRef.current = null;
    providerHasVisibleTiles.current = false;
    fallbackNotified.current = false;
    failureReported.current = false;
    setProviderStatus(providerStatusRef.current);
    setLoadError(effectiveKey ? null : MISSING_KEY_MESSAGE);
    setAttribution(null);

    const updateStatus = (status: GoogleTilesStatus) => {
      if (disposed || providerStatusRef.current === status) return;
      providerStatusRef.current = status;
      setProviderStatus(status);
    };

    const setAttributionValue = (value: string | null) => {
      if (disposed || attributionRef.current === value) return;
      attributionRef.current = value;
      setAttribution(value);
    };

    const notifyLocalFallback = (reason: string) => {
      if (disposed || fallbackNotified.current) return;
      fallbackNotified.current = true;
      onError?.(reason);
    };

    const reportUnavailable = (message: string) => {
      if (disposed || failureReported.current) return;
      failureReported.current = true;
      updateStatus('unavailable');
      setLoadError(message);
      setAttributionValue(null);
      notifyLocalFallback(message);
    };

    if (!effectiveKey) {
      notifyLocalFallback(MISSING_KEY_MESSAGE);
      return;
    }

    // Keep the local source buildings visible during startup and after a
    // provider failure. Google is an additive detail layer; it is never the
    // sole proof that the scene has loaded.
    notifyLocalFallback(LOCAL_FALLBACK_MESSAGE);

    let tiles: TilesRenderer | null = null;

    try {
      // Initialize the open-source 3D Tiles renderer only after an explicit
      // key has been supplied through the user-controlled Google mode.
      tiles = new TilesRenderer();

      // Register Google Cloud 3D Tiles authentication. Importing the core
      // plugin avoids the package's deprecated three/plugins compatibility
      // wrapper and its warning on every opt-in attempt.
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
        if (!tiles || disposed) return;
        tiles.group.scale.x = -Math.abs(tiles.group.scale.x);
        tiles.group.updateMatrixWorld(true);
      };
      tiles.addEventListener('load-root-tileset', applyAppCoordinateFrame);

      const updateAttribution = () => {
        if (!tiles || disposed) return;
        if (tiles.visibleTiles.size === 0) {
          providerHasVisibleTiles.current = false;
          setAttributionValue(null);
          if (providerStatusRef.current === 'ready') updateStatus('loading');
          return;
        }

        providerHasVisibleTiles.current = true;
        updateStatus('ready');
        setLoadError(null);
        const sourceLines = tiles.getAttributions()
          .filter((entry) => entry.type !== 'image')
          .map((entry) => attributionText(entry.value))
          .flatMap((value) => value.split(';').map((source) => source.trim()))
          .filter(Boolean);
        const uniqueSources = [...new Set(sourceLines)];
        const displaySources = [
          'Google Maps',
          ...uniqueSources.filter((source) => source.toLowerCase() !== 'google maps')
        ];
        setAttributionValue(displaySources.join(' · '));
      };

      const disposeRenderer = () => {
        if (!tiles || rendererDisposed) return;
        rendererDisposed = true;
        if (tilesRef.current === tiles) tilesRef.current = null;
        scene.remove(tiles.group);
        tiles.dispose();
      };

      const handleLoadError = (event: { tile?: unknown; error?: unknown }) => {
        if (!tiles || disposed) return;

        // A single child tile can fail while already-visible siblings remain
        // useful. Only a root failure tears down the provider renderer; the
        // startup guard handles a provider that never produces visible tiles.
        if (event.tile != null) return;

        reportUnavailable(providerErrorMessage(event.error));
        disposeRenderer();
      };
      tiles.addEventListener('tile-visibility-change', updateAttribution);
      tiles.addEventListener('load-tileset', updateAttribution);
      tiles.addEventListener('load-error', handleLoadError);

      startupTimer = setTimeout(() => {
        if (
          disposed ||
          !tiles ||
          tilesRef.current !== tiles ||
          providerHasVisibleTiles.current ||
          tiles.visibleTiles.size > 0
        ) {
          return;
        }

        updateStatus('fallback');
        setLoadError(STARTUP_FALLBACK_MESSAGE);
        notifyLocalFallback(STARTUP_FALLBACK_MESSAGE);
      }, GOOGLE_TILES_STARTUP_TIMEOUT_MS);

      // Keep the optional provider bounded to the full Oracle → Spice Garden
      // corridor without applying an app-frame sphere to ECEF tile bounds.
      const loadRegion = new LoadRegionPlugin();
      loadRegion.addRegion(
        new SphereRegion({
          sphere: new THREE.Sphere(
            GOOGLE_TILES_REGION_CENTER_ECEF,
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
        disposed = true;
        if (startupTimer !== null) clearTimeout(startupTimer);
        tiles.removeEventListener('load-root-tileset', applyAppCoordinateFrame);
        tiles.removeEventListener('tile-visibility-change', updateAttribution);
        tiles.removeEventListener('load-tileset', updateAttribution);
        tiles.removeEventListener('load-error', handleLoadError);
        disposeRenderer();
      };
    } catch (error) {
      if (tiles) {
        if (tilesRef.current === tiles) tilesRef.current = null;
        scene.remove(tiles.group);
        tiles.dispose();
      }
      reportUnavailable(providerErrorMessage(error));
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

  if (providerStatus !== 'ready') {
    const statusLabel = providerStatus === 'unavailable'
      ? 'UNAVAILABLE'
      : providerStatus === 'fallback'
        ? 'NOT VISIBLE'
        : 'CONNECTING';

    return (
      <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[50, 0]}>
        <div
          aria-live="polite"
          aria-label={`Google 3D Tiles ${statusLabel.toLowerCase()}; OSM source twin active`}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 112,
            maxWidth: 'min(470px, calc(100vw - 40px))',
            padding: '6px 9px',
            borderRadius: 3,
            border: '1px solid rgba(251, 191, 36, 0.6)',
            background: 'rgba(69, 26, 3, 0.86)',
            color: '#fef3c7',
            fontFamily: 'monospace',
            fontSize: 9,
            lineHeight: 1.35,
            textAlign: 'right',
            textShadow: '0 1px 3px rgba(2, 6, 23, 0.9)'
          }}
        >
          <div>GOOGLE 3D TILES {statusLabel} · OSM SOURCE TWIN ACTIVE</div>
          {loadError && <div style={{ marginTop: 2, opacity: 0.9 }}>{loadError}</div>}
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

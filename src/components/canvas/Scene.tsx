import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SUN_POSITION_DAY,
  SUN_POSITION_OVERCAST,
  FOG_DENSITY_DAY,
  FOG_DENSITY_RAIN,
  FOG_DENSITY_NIGHT,
  CAMERA_DEFAULT_POSITION
} from '../../config/location';
import { SignalStatus, CameraPreset } from '../../types';
import { CameraController } from './CameraController';
import { PostProcessingPipeline } from './PostProcessing';
import { JunctionRoads } from './Environment/JunctionRoads';
import { Footpaths } from './Environment/Footpaths';
import { RoadsideShops } from './Environment/RoadsideShops';
import { FlyoverBridge } from './Environment/FlyoverBridge';
import { MetroViaduct } from './Environment/MetroViaduct';
import { Skywalk } from './Environment/Skywalk';
import { WestCorridorBuildings } from './Environment/WestCorridorBuildings';
import { EastCorridorBuildings } from './Environment/EastCorridorBuildings';
import { Buildings } from './Environment/Buildings';
import { Google3DTiles } from './Environment/Google3DTiles';
import { GoogleMaps3DMarkers } from './Environment/GoogleMaps3DMarkers';
import { GoogleMapsStore } from '../../data/GoogleMapsStoreRegistry';
import { StreetFurniture } from './Environment/StreetFurniture';
import { Greenery } from './Environment/Greenery';
import { RainParticles } from './Environment/RainParticles';
import { TrafficSystem } from './traffic/TrafficSystem';
import { SourceCorridorTraffic } from './traffic/SourceCorridorTraffic';
import { OsmSnapshotLayer } from './Environment/OsmSnapshotLayer';
import { CrossoverFocusOverlay } from './Environment/CrossoverFocusOverlay';

interface SceneProps {
  isNight: boolean;
  isRaining: boolean;
  simSpeed: 1 | 10 | 60;
  isCinematic: boolean;
  cameraPreset: CameraPreset;
  cameraMode: 'walk' | 'overview';
  footpathAuditMode: boolean;
  buildingMode?: 'osm' | 'google-tiles';
  googleMapsApiKey?: string;
  signalStatus: SignalStatus;
  congestionRatio: number;
  vehicleCount: number;
  selectedStoreId?: string;
  onSelectStore?: (store: GoogleMapsStore) => void;
  onInspectJunction: () => void;
}

export const Scene: React.FC<SceneProps> = ({
  isNight,
  isRaining,
  simSpeed,
  isCinematic,
  cameraPreset,
  cameraMode,
  footpathAuditMode,
  buildingMode = 'osm',
  googleMapsApiKey,
  signalStatus,
  congestionRatio,
  vehicleCount,
  selectedStoreId,
  onSelectStore,
  onInspectJunction
}) => {
  // Lighting & Atmospheric parameters
  const sunPosition: [number, number, number] = isRaining ? SUN_POSITION_OVERCAST : SUN_POSITION_DAY;
  const sunIntensity = isNight ? 0.05 : (isRaining ? 1.2 : 3.2);
  const sunColor = isNight ? '#1e293b' : (isRaining ? '#cbd5e1' : '#fff1d6');

  const hemiSkyColor = isNight ? '#0b1329' : (isRaining ? '#475569' : '#e0f2fe');
  const hemiGroundColor = isNight ? '#020617' : (isRaining ? '#1e293b' : '#334155');
  const hemiIntensity = isNight ? 0.2 : (isRaining ? 0.6 : 0.85);

  const isLongCorridorView = cameraPreset === 'corridor';
  const isCrossoverFocusView = cameraPreset === 'crossover';
  const isSourceGeometryFocusView = [
    'corridor',
    'crossover',
    'flyover',
    'underpass',
    'spicegarden',
    'oraclehub',
    'brandfactory',
    'kalamandir',
    'multiplex'
  ].includes(cameraPreset);
  // The compiled source snapshot is the canonical road graph. Keep the full
  // fleet on source ways so no vehicle falls back to the old mirrored,
  // schematic junction lanes.
  const corridorVehicleCount = vehicleCount;
  const junctionVehicleCount = 0;
  const fogDensity = isLongCorridorView
    ? (isNight ? 0.00018 : (isRaining ? 0.00034 : 0.00012))
    : (isNight ? FOG_DENSITY_NIGHT : (isRaining ? FOG_DENSITY_RAIN : FOG_DENSITY_DAY));
  const fogColor = isNight ? '#030712' : (isRaining ? '#334155' : '#a9b8c8');

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}>
      <Canvas
        dpr={[1, 1.5]}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ position: CAMERA_DEFAULT_POSITION, fov: 50, near: 0.5, far: 6000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isNight ? 1.25 : (isRaining ? 0.95 : 1.08),
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        {/* Background & Subtle Fog */}
        <color attach="background" args={[fogColor]} />
        <fogExp2 attach="fog" args={[fogColor, fogDensity]} />

        {/* Camera Rig & OrbitControls */}
        <CameraController
          key={`${cameraPreset}-${cameraMode}`}
          isCinematic={isCinematic}
          cameraPreset={cameraPreset}
          cameraMode={cameraMode}
          simSpeedMultiplier={simSpeed}
        />

        {/* Ambient & Directional Golden Hour Lighting */}
        <hemisphereLight
          args={[hemiSkyColor, hemiGroundColor, hemiIntensity]}
        />

        <directionalLight
          position={sunPosition}
          intensity={sunIntensity}
          color={sunColor}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={350}
          shadow-camera-left={-160}
          shadow-camera-right={160}
          shadow-camera-top={160}
          shadow-camera-bottom={-160}
          shadow-bias={-0.0003}
        />

        {/* Night Junction Accent Moonlight / Sky Ambient */}
        {isNight && (
          <directionalLight
            position={[-80, 70, -40]}
            intensity={0.4}
            color="#38bdf8"
          />
        )}

        <Suspense fallback={
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.5, 6, 4]} />
            <meshBasicMaterial color="#1e40af" transparent opacity={0.3} />
          </mesh>
        }>
          {/* Source-backed roads, footways, crossings, signals and shop POIs. */}
          <OsmSnapshotLayer
            isNight={isNight}
            showBuildings
            buildingLimit={isCrossoverFocusView ? 520 : 1000}
            buildingOpacity={isCrossoverFocusView ? 0.28 : 0.5}
            buildingOutlineOpacity={isCrossoverFocusView ? 0.2 : 0.32}
            labelDistanceFactor={cameraPreset === 'corridor' ? 2400 : (cameraPreset === 'oraclehub' ? 260 : (cameraPreset === 'spicegarden' ? 120 : 65))}
          />

          {/* ── 3D Stylized Realistic Ground & Underpass Network ── */}
          <JunctionRoads
            isRaining={isRaining}
            isNight={isNight}
            congestionRatio={congestionRatio}
            sourceBacked
          />

          {isCrossoverFocusView && (
            <CrossoverFocusOverlay isNight={isNight} />
          )}

          {/* ── Realistic Pedestrian Footpaths (Paved, Missing, Encroached, Metro-Blocked) ── */}
          <Footpaths
            auditMode={footpathAuditMode}
            isNight={isNight}
          />

          {/* ── Indian Roadside Commercial Showrooms, Bakeries, Chai Stalls & Bus Stops ── */}
          {!isSourceGeometryFocusView && (
            <RoadsideShops
              isNight={isNight}
            />
          )}

          {/* ── Source-positioned Varthur Road viaduct above the ORR ── */}
          <FlyoverBridge
            isRaining={isRaining}
            isNight={isNight}
          />

          {/* ── Elevated Namma Metro Blue Line Viaduct with BMRCL Construction Barricades ── */}
          <MetroViaduct
            isNight={isNight}
          />

          {/* ── Pedestrian Skywalk Crossing Over ORR ── */}
          <Skywalk
            isNight={isNight}
          />

          {/* ── Realistic West Corridor Landmarks (Innovative Multiplex, Krishna Summit, Krishna Grand, Novel MSR) ── */}
          {!isSourceGeometryFocusView && (
            <WestCorridorBuildings
              isNight={isNight}
            />
          )}

          {/* ── Realistic East Corridor Landmarks (Brand Factory, Kalamandir Palace, Factory Outlets Row, Nalli Silks) ── */}
          {!isSourceGeometryFocusView && (
            <EastCorridorBuildings
              isNight={isNight}
            />
          )}

          {/* ── 3D Google Maps Prominent Store Pins & Billboard Badges (Real Lat/Long) ── */}
          <GoogleMaps3DMarkers
            selectedStoreId={selectedStoreId}
            onSelectStore={onSelectStore || (() => {})}
            isNight={isNight}
          />

          {/* ── Surrounding Commercial Landmarks / Google 3D Tiles ── */}
          {buildingMode === 'google-tiles' ? (
            <Google3DTiles apiKey={googleMapsApiKey} />
          ) : !isSourceGeometryFocusView ? (
          <Buildings isNight={isNight} includeSurroundingBuildings={false} />
          ) : null}

          <StreetFurniture
            isNight={isNight}
            signalStatus={signalStatus}
          />

          <Greenery
            isRaining={isRaining}
          />

          <RainParticles
            isRaining={isRaining}
          />

          {/* ── High-Performance Instanced Traffic Fleet ── */}
          <TrafficSystem
            signalStatus={signalStatus}
            congestionRatio={congestionRatio}
            simSpeedMultiplier={simSpeed}
            isNight={isNight}
            vehicleTotalCount={junctionVehicleCount}
          />

          {/* Source-road vehicles extend the configured modelled fleet across
              the widened Oracle → junction → Spice Garden OSM envelope. */}
          <SourceCorridorTraffic
            simSpeedMultiplier={simSpeed}
            isNight={isNight}
            vehicleTotalCount={corridorVehicleCount}
          />

          {/* ── Interactive Junction Beacon / Clickable Trigger ── */}
          <group position={[0, 0.4, 0]} onClick={onInspectJunction}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[4.5, 4.5, 0.1, 32]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.25}
              />
            </mesh>
            {/* Pulsing visual halo marker */}
            <mesh position={[0, 0.2, 0]}>
              <ringGeometry args={[4.8, 5.2, 32]} />
              <meshBasicMaterial
                color="#0ea5e9"
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </Suspense>

        {/* ── Post-Processing Pipeline (Bloom, Vignette, ToneMapping, AO) ── */}
        <PostProcessingPipeline
          isNight={isNight}
          isRaining={isRaining}
        />
      </Canvas>
    </div>
  );
};

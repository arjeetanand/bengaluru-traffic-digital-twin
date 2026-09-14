import React from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  GOOGLE_MAPS_PROMINENT_STORES,
  GoogleMapsStore,
  gpsTo3D,
  getStoreCameraFraming
} from '../../../data/GoogleMapsStoreRegistry';
import { cameraControlBus } from '../../../services/cameraControlBus';

interface GoogleMaps3DMarkersProps {
  selectedStoreId?: string;
  onSelectStore: (store: GoogleMapsStore) => void;
  isNight: boolean;
}

export const GoogleMaps3DMarkers: React.FC<GoogleMaps3DMarkersProps> = ({
  selectedStoreId,
  onSelectStore,
  isNight
}) => {
  return (
    <group name="GoogleMaps3DCorridorMarkers">
      {GOOGLE_MAPS_PROMINENT_STORES.map((store) => {
        const [x, , z] = gpsTo3D(store.lat, store.lng);
        const roofY = store.dimensions.height;
        const pinY = roofY + 6;
        const isSelected = selectedStoreId === store.id;

        const handleClick = (e?: React.MouseEvent) => {
          if (e) e.stopPropagation();
          const framing = getStoreCameraFraming(store);
          cameraControlBus.flyTo(framing.position, framing.target);
          onSelectStore(store);
        };

        return (
          <group key={store.id} position={[x, 0, z]}>
            {/* ── Vertical Laser Light Guide to Rooftop ── */}
            <mesh position={[0, (roofY + pinY) / 2, 0]}>
              <cylinderGeometry args={[0.08, 0.08, pinY - roofY, 8]} />
              <meshBasicMaterial
                color={isSelected ? '#38bdf8' : store.accentColor || '#facc15'}
                transparent
                opacity={isSelected ? 0.9 : 0.45}
              />
            </mesh>

            {/* ── Ground Anchor Halo Beacon ── */}
            <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 2.2, 24]} />
              <meshBasicMaterial
                color={isSelected ? '#38bdf8' : '#ea4335'}
                transparent
                opacity={isSelected ? 0.8 : 0.35}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* ── 3D Geometric Pin Head ── */}
            <group position={[0, pinY, 0]} onClick={() => handleClick()}>
              {/* Pin Upper Sphere */}
              <mesh position={[0, 1.2, 0]}>
                <sphereGeometry args={[0.9, 16, 16]} />
                <meshStandardMaterial
                  color={isSelected ? '#0284c7' : '#ea4335'}
                  emissive={isSelected ? '#0284c7' : '#dc2626'}
                  emissiveIntensity={isNight ? 1.5 : 0.6}
                  roughness={0.2}
                  metalness={0.5}
                />
              </mesh>

              {/* Pin Inverted Taper Cone */}
              <mesh position={[0, 0.4, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.85, 1.2, 16]} />
                <meshStandardMaterial
                  color={isSelected ? '#0284c7' : '#ea4335'}
                  emissive={isSelected ? '#0284c7' : '#dc2626'}
                  emissiveIntensity={isNight ? 1.5 : 0.6}
                  roughness={0.2}
                  metalness={0.5}
                />
              </mesh>

              {/* Inner White Google Maps Core */}
              <mesh position={[0, 1.2, 0]}>
                <sphereGeometry args={[0.45, 12, 12]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#ffffff"
                  emissiveIntensity={isNight ? 1.2 : 0.5}
                />
              </mesh>

              {/* ── Interactive Floating Billboard Card ── */}
              <Html
                position={[0, 2.4, 0]}
                center
                distanceFactor={42}
                zIndexRange={[100, 0]}
              >
                <button
                  type="button"
                  aria-label={`Inspect mapped point of interest ${store.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pointerEvents: 'auto',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.2s ease',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    font: 'inherit',
                    color: 'inherit'
                  }}
                >
                  <div
                    style={{
                      background: isSelected
                        ? 'rgba(14, 116, 144, 0.95)'
                        : 'rgba(15, 23, 42, 0.88)',
                      backdropFilter: 'blur(8px)',
                      border: isSelected
                        ? '1.5px solid #38bdf8'
                        : '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '8px',
                      padding: '5px 9px',
                      boxShadow: isSelected
                        ? '0 6px 24px rgba(56, 189, 248, 0.45)'
                        : '0 4px 18px rgba(0, 0, 0, 0.55)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      whiteSpace: 'nowrap',
                      minWidth: '130px'
                    }}
                  >
                    {/* Top Row: Store Name & Google Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#f8fafc',
                          letterSpacing: '0.2px'
                        }}
                      >
                        {store.name}
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          background: 'rgba(234, 179, 8, 0.22)',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          border: '1px solid rgba(234, 179, 8, 0.4)'
                        }}
                      >
                        <span style={{ fontSize: '10px', color: '#facc15' }}>★</span>
                        <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#fef08a' }}>
                          {store.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Kannada Script & Review Count */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic' }}>
                        {store.kannadaName}
                      </span>
                      <span style={{ fontSize: '8.5px', color: '#cbd5e1' }}>
                        ({store.reviewCount.toLocaleString()} reviews)
                      </span>
                    </div>

                    {/* Bottom Row: Mapped GPS Coordinates Badge */}
                    <div
                      style={{
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        background: 'rgba(0, 0, 0, 0.35)',
                        padding: '2px 5px',
                        borderRadius: '3px',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <span style={{ fontSize: '8px', color: '#38bdf8', fontFamily: 'monospace' }}>
                        {store.lat.toFixed(6)}, {store.lng.toFixed(6)}
                      </span>
                      <span
                        style={{
                          fontSize: '7.5px',
                          textTransform: 'uppercase',
                          color: '#a5f3fc',
                          fontWeight: 600,
                          letterSpacing: '0.4px'
                        }}
                      >
                        {store.category}
                      </span>
                    </div>
                  </div>

                  {/* Little downward pointer caret */}
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: isSelected
                        ? '6px solid rgba(14, 116, 144, 0.95)'
                        : '6px solid rgba(15, 23, 42, 0.88)'
                    }}
                  />
                </button>
              </Html>
            </group>
          </group>
        );
      })}
    </group>
  );
};

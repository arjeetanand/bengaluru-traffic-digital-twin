import React from 'react';
import { Html } from '@react-three/drei';
import { CameraPreset } from '../../../types';
import { MARATHAHALLI_SOURCE_ANCHORS } from '../../../data/marathahalliNavigation';

interface SourceLandmarkMassingsProps {
  cameraPreset: CameraPreset;
  isNight: boolean;
}

const SourceLabel: React.FC<{
  title: string;
  detail: string;
  position: [number, number, number];
}> = ({ title, detail, position }) => (
  <Html position={position} center distanceFactor={24} style={{ pointerEvents: 'none' }}>
    <div
      style={{
        background: 'rgba(8, 18, 34, 0.9)',
        border: '1px solid rgba(56, 189, 248, 0.7)',
        borderRadius: '5px',
        color: '#e0f2fe',
        fontFamily: 'monospace',
        fontSize: '8px',
        letterSpacing: '0.2px',
        padding: '4px 6px',
        whiteSpace: 'nowrap',
        boxShadow: '0 3px 12px rgba(2, 6, 23, 0.5)'
      }}
    >
      <strong style={{ display: 'block', color: '#f8fafc', fontSize: '9px' }}>{title}</strong>
      <span style={{ color: '#7dd3fc' }}>{detail}</span>
    </div>
  </Html>
);

const SpiceGardenMassing: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const [x, z] = MARATHAHALLI_SOURCE_ANCHORS.spiceGarden.restaurant;
  const signColor = isNight ? '#fbbf24' : '#f97316';

  return (
    <group
      name="SourceSpiceGardenModelledFrontage"
      position={[x, 0, z]}
      userData={{
        source: 'OSM node/1047248383',
        status: 'modelled frontage',
        exactFacade: false
      }}
    >
      <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[24, 7.6, 15]} />
        <meshStandardMaterial color={isNight ? '#713f12' : '#9a3412'} roughness={0.78} />
      </mesh>
      <mesh position={[0, 3.6, -7.62]}>
        <boxGeometry args={[21.5, 5.8, 0.18]} />
        <meshStandardMaterial
          color={isNight ? '#fef3c7' : '#ffedd5'}
          emissive={isNight ? '#f59e0b' : '#000000'}
          emissiveIntensity={isNight ? 1.35 : 0}
          roughness={0.18}
          metalness={0.42}
        />
      </mesh>
      <mesh position={[0, 7.5, -7.9]} castShadow>
        <boxGeometry args={[23.6, 1.9, 0.42]} />
        <meshStandardMaterial
          color={signColor}
          emissive={isNight ? '#ea580c' : '#000000'}
          emissiveIntensity={isNight ? 1.8 : 0.15}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, 6.45, -8.35]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[23.8, 0.16, 2.3]} />
        <meshStandardMaterial color={isNight ? '#1e3a8a' : '#0369a1'} roughness={0.6} />
      </mesh>
      {[-7, 0, 7].map((windowX) => (
        <mesh key={windowX} position={[windowX, 3.25, -7.78]}>
          <boxGeometry args={[4.2, 3.3, 0.12]} />
          <meshStandardMaterial
            color={isNight ? '#fde68a' : '#bae6fd'}
            emissive={isNight ? '#f59e0b' : '#000000'}
            emissiveIntensity={isNight ? 1.2 : 0}
            roughness={0.12}
            metalness={0.72}
          />
        </mesh>
      ))}
      {[-8, 8].map((tableX) => (
        <group key={tableX} position={[tableX, 0.45, -10.5]}>
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.9, 0.9, 0.14, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.72} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.65, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.42} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <SourceLabel
        position={[0, 11.5, -7.8]}
        title="SPICE GARDEN"
        detail="OSM POI · MODELLED FRONTAGE · FIELD VERIFY"
      />
    </group>
  );
};

const OracleHubMassing: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const [x, z] = MARATHAHALLI_SOURCE_ANCHORS.oracleHub.campusCentroid;
  const [entranceX, entranceZ] = MARATHAHALLI_SOURCE_ANCHORS.oracleHub.entranceFountain;
  const glassColor = isNight ? '#1e40af' : '#0e7490';

  return (
    <group name="SourceOracleHubModelledCampus" userData={{
      source: 'OSM way/688600223 landuse=commercial',
      status: 'modelled campus massing',
      exactFacade: false
    }}>
      <group position={[x, 0, z]}>
        <mesh position={[0, 0.15, 0]} receiveShadow>
          <boxGeometry args={[190, 0.3, 150]} />
          <meshStandardMaterial color={isNight ? '#0f2a3a' : '#164e63'} roughness={0.94} />
        </mesh>
        {[
          [-48, -24, 58, 36, 34],
          [28, -18, 72, 48, 38],
          [-12, 34, 82, 28, 30]
        ].map(([blockX, blockZ, width, height, depth], index) => (
          <group key={index} position={[blockX, 0, blockZ]}>
            <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, height, depth]} />
              <meshStandardMaterial
                color={isNight ? '#102a43' : '#1e3a5f'}
                roughness={0.34}
                metalness={0.62}
                emissive={isNight ? glassColor : '#000000'}
                emissiveIntensity={isNight ? 0.32 : 0}
              />
            </mesh>
            {[-0.34, 0, 0.34].map((offset) => (
              <mesh key={offset} position={[offset * width, height * 0.52, depth / 2 + 0.18]}>
                <boxGeometry args={[0.18, height * 0.84, 0.12]} />
                <meshBasicMaterial color={isNight ? '#93c5fd' : '#67e8f9'} transparent opacity={0.7} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 0.9, -72]} receiveShadow>
          <boxGeometry args={[112, 1.8, 2.2]} />
          <meshStandardMaterial color={isNight ? '#0c4a6e' : '#0e7490'} roughness={0.82} />
        </mesh>
        <SourceLabel
          position={[0, 58, -18]}
          title="ORACLE TECH HUB"
          detail="OSM LANDUSE · MODELLED CAMPUS MASSING · FIELD VERIFY"
        />
      </group>

      <group position={[entranceX, 0, entranceZ]}>
        <mesh position={[0, 2.8, 0]} castShadow>
          <boxGeometry args={[16, 5.6, 2.4]} />
          <meshStandardMaterial color={isNight ? '#1d4ed8' : '#0f766e'} roughness={0.34} metalness={0.52} />
        </mesh>
        <mesh position={[0, 5.8, 0]}>
          <boxGeometry args={[12, 0.24, 2.8]} />
          <meshBasicMaterial color={isNight ? '#67e8f9' : '#5eead4'} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

export const SourceLandmarkMassings: React.FC<SourceLandmarkMassingsProps> = ({ cameraPreset, isNight }) => {
  return (
    <group name="SourceLandmarkMassings">
      {cameraPreset === 'spicegarden' && <SpiceGardenMassing isNight={isNight} />}
      {cameraPreset === 'oraclehub' && <OracleHubMassing isNight={isNight} />}
    </group>
  );
};

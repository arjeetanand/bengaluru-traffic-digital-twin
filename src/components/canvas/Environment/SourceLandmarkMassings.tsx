import React from 'react';
import { Html } from '@react-three/drei';
import { CameraPreset } from '../../../types';
import { MARATHAHALLI_SOURCE_ANCHORS } from '../../../data/marathahalliNavigation';

interface SourceLandmarkMassingsProps {
  cameraPreset: CameraPreset;
  isNight: boolean;
}

type FacadeAxis = 'x' | 'z';
type LocalPosition = [number, number, number];
type FacadeNormal = 1 | -1;

const facadePosition = (
  axis: FacadeAxis,
  face: number,
  along: number,
  y: number,
  normalOffset = 0
): LocalPosition => (
  axis === 'x'
    ? [face + normalOffset, y, along]
    : [along, y, face + normalOffset]
);

const facadeSize = (
  axis: FacadeAxis,
  normalDepth: number,
  height: number,
  alongLength: number
): LocalPosition => (
  axis === 'x'
    ? [normalDepth, height, alongLength]
    : [alongLength, height, normalDepth]
);

const SourceLabel: React.FC<{
  title: string;
  detail: string;
  position: LocalPosition;
  distanceFactor?: number;
}> = ({ title, detail, position, distanceFactor = 24 }) => (
  <Html position={position} center distanceFactor={distanceFactor} style={{ pointerEvents: 'none' }}>
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

const FacadeBand: React.FC<{
  axis: FacadeAxis;
  face: number;
  normalSign: FacadeNormal;
  y: number;
  length: number;
  thickness: number;
  color: string;
  alongCenter?: number;
  depth?: number;
  isNight?: boolean;
  emissive?: string;
  name?: string;
}> = ({
  axis,
  face,
  normalSign,
  y,
  length,
  thickness,
  color,
  alongCenter = 0,
  depth = 0.26,
  isNight = false,
  emissive = color,
  name = 'ModelledFrontageBand'
}) => (
  <mesh
    name={name}
    position={facadePosition(axis, face, alongCenter, y, normalSign * 0.14)}
    castShadow
    userData={{ status: 'modelled facade detail', exactFacade: false, fieldVerify: true }}
  >
    <boxGeometry args={facadeSize(axis, depth, thickness, length)} />
    <meshStandardMaterial
      color={color}
      emissive={isNight ? emissive : '#000000'}
      emissiveIntensity={isNight ? 1.15 : 0}
      roughness={0.42}
      metalness={0.36}
    />
  </mesh>
);

const FacadeWindowGrid: React.FC<{
  axis: FacadeAxis;
  face: number;
  normalSign: FacadeNormal;
  columns: number;
  rows: number;
  spacing: number;
  yStart: number;
  rowStep: number;
  alongCenter?: number;
  paneWidth?: number;
  paneHeight?: number;
  color: string;
  isNight: boolean;
  nightColor?: string;
  opacity?: number;
  name?: string;
}> = ({
  axis,
  face,
  normalSign,
  columns,
  rows,
  spacing,
  yStart,
  rowStep,
  alongCenter = 0,
  paneWidth = Math.min(spacing * 0.68, 4.6),
  paneHeight = Math.min(rowStep * 0.58, 4.4),
  color,
  isNight,
  nightColor = '#fef08a',
  opacity = 0.82,
  name = 'ModelledFacadeWindowGrid'
}) => (
  <group
    name={name}
    userData={{ status: 'modelled facade windows', exactFacade: false, fieldVerify: true }}
  >
    {Array.from({ length: Math.max(0, rows) }, (_, row) => (
      Array.from({ length: Math.max(0, columns) }, (_, column) => {
        const along = alongCenter + (column - (columns - 1) / 2) * spacing;
        const y = yStart + row * rowStep;
        return (
          <mesh
            key={`${row}-${column}`}
            position={facadePosition(axis, face, along, y, normalSign * 0.22)}
            castShadow
          >
            <boxGeometry args={facadeSize(axis, 0.16, paneHeight, paneWidth)} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity}
              emissive={isNight ? nightColor : '#000000'}
              emissiveIntensity={isNight ? 1.25 : 0}
              roughness={0.16}
              metalness={0.72}
            />
          </mesh>
        );
      })
    ))}
  </group>
);

const FacadeSignPlate: React.FC<{
  axis: FacadeAxis;
  face: number;
  normalSign: FacadeNormal;
  y: number;
  width: number;
  height: number;
  color: string;
  accent: string;
  isNight: boolean;
  alongCenter?: number;
  name?: string;
}> = ({
  axis,
  face,
  normalSign,
  y,
  width,
  height,
  color,
  accent,
  isNight,
  alongCenter = 0,
  name = 'ModelledFacadeSignage'
}) => (
  <group
    name={name}
    userData={{ status: 'modelled signage', exactText: false, fieldVerify: true }}
  >
    <mesh
      position={facadePosition(axis, face, alongCenter, y, normalSign * 0.2)}
      castShadow
    >
      <boxGeometry args={facadeSize(axis, 0.38, height, width)} />
      <meshStandardMaterial
        color={color}
        roughness={0.36}
        metalness={0.4}
        emissive={isNight ? color : '#000000'}
        emissiveIntensity={isNight ? 1.45 : 0}
      />
    </mesh>
    <mesh
      position={facadePosition(axis, face, alongCenter, y - height * 0.27, normalSign * 0.42)}
    >
      <boxGeometry args={facadeSize(axis, 0.1, Math.max(0.12, height * 0.1), width * 0.82)} />
      <meshStandardMaterial
        color={accent}
        emissive={isNight ? accent : '#000000'}
        emissiveIntensity={isNight ? 2.4 : 0.55}
        roughness={0.28}
        metalness={0.58}
      />
    </mesh>
  </group>
);

const FacadeEntrance: React.FC<{
  axis: FacadeAxis;
  face: number;
  normalSign: FacadeNormal;
  width: number;
  height: number;
  isNight: boolean;
  alongCenter?: number;
  glassColor?: string;
  frameColor?: string;
  name?: string;
}> = ({
  axis,
  face,
  normalSign,
  width,
  height,
  isNight,
  alongCenter = 0,
  glassColor = '#bae6fd',
  frameColor = '#cbd5e1',
  name = 'ModelledGlazedEntrance'
}) => {
  const postSize = facadeSize(axis, 0.28, height, 0.2);
  const doorSize = facadeSize(axis, 0.16, height * 0.9, width * 0.86);
  const canopySize = facadeSize(axis, 2.3, 0.18, width + 1.4);
  const stepSize = facadeSize(axis, 2.8, 0.18, width + 2.2);
  const postY = height / 2 + 0.15;

  return (
    <group
      name={name}
      userData={{ status: 'modelled entrance detail', exactEntrance: false, fieldVerify: true }}
    >
      <mesh
        position={facadePosition(axis, face, alongCenter, height * 0.46, normalSign * 0.22)}
        castShadow
      >
        <boxGeometry args={doorSize} />
        <meshStandardMaterial
          color={glassColor}
          transparent
          opacity={0.72}
          roughness={0.12}
          metalness={0.76}
          emissive={isNight ? '#fef08a' : '#000000'}
          emissiveIntensity={isNight ? 1.4 : 0}
        />
      </mesh>
      {[-width / 2, width / 2].map((offset) => (
        <mesh
          key={offset}
          position={facadePosition(axis, face, alongCenter + offset, postY, normalSign * 0.3)}
          castShadow
        >
          <boxGeometry args={postSize} />
          <meshStandardMaterial color={frameColor} roughness={0.45} metalness={0.55} />
        </mesh>
      ))}
      <mesh
        position={facadePosition(axis, face, alongCenter, height + 0.15, normalSign * 0.3)}
        castShadow
      >
        <boxGeometry args={facadeSize(axis, 0.28, 0.2, width + 0.4)} />
        <meshStandardMaterial color={frameColor} roughness={0.45} metalness={0.55} />
      </mesh>
      <mesh
        position={facadePosition(axis, face, alongCenter, height + 0.5, normalSign * 1.05)}
        castShadow
      >
        <boxGeometry args={canopySize} />
        <meshStandardMaterial
          color={isNight ? '#172554' : '#e2e8f0'}
          roughness={0.62}
          metalness={0.42}
        />
      </mesh>
      <mesh
        position={facadePosition(axis, face, alongCenter, 0.18, normalSign * 1.28)}
        receiveShadow
      >
        <boxGeometry args={stepSize} />
        <meshStandardMaterial color={isNight ? '#334155' : '#e2e8f0'} roughness={0.78} />
      </mesh>
    </group>
  );
};

const Planter: React.FC<{ position: LocalPosition; isNight: boolean }> = ({ position, isNight }) => (
  <group
    position={position}
    userData={{ status: 'modelled frontage planter', inventory: false, fieldVerify: true }}
  >
    <mesh position={[0, 0.28, 0]} castShadow>
      <cylinderGeometry args={[0.52, 0.62, 0.56, 8]} />
      <meshStandardMaterial color={isNight ? '#334155' : '#a8a29e'} roughness={0.82} />
    </mesh>
    <mesh position={[0, 1.02, 0]} castShadow>
      <coneGeometry args={[0.72, 1.25, 8]} />
      <meshStandardMaterial
        color={isNight ? '#166534' : '#15803d'}
        emissive={isNight ? '#14532d' : '#000000'}
        emissiveIntensity={isNight ? 0.5 : 0}
        roughness={0.9}
      />
    </mesh>
  </group>
);

const GroundApron: React.FC<{
  axis: FacadeAxis;
  face: number;
  normalSign: FacadeNormal;
  width: number;
  depth: number;
  isNight: boolean;
  alongCenter?: number;
  accent?: string;
  name?: string;
}> = ({
  axis,
  face,
  normalSign,
  width,
  depth,
  isNight,
  alongCenter = 0,
  accent = '#f59e0b',
  name = 'ModelledGroundApron'
}) => {
  const apronPosition = facadePosition(axis, face, alongCenter, 0.08, normalSign * depth * 0.5);
  const apronSize = facadeSize(axis, depth, 0.16, width);
  const curbPosition = facadePosition(axis, face, alongCenter, 0.21, normalSign * (depth + 0.04));
  const curbSize = facadeSize(axis, 0.14, 0.12, width + 0.3);
  const bollardPositions = [-0.34, 0, 0.34].map((fraction) => (
    facadePosition(axis, face, alongCenter + width * fraction, 0.53, normalSign * (depth * 0.56))
  ));
  const planterPositions = [-0.39, 0.39].map((fraction) => (
    facadePosition(axis, face, alongCenter + width * fraction, 0, normalSign * (depth * 0.7))
  ));

  return (
    <group
      name={name}
      userData={{ status: 'modelled ground apron', exactPaving: false, fieldVerify: true }}
    >
      <mesh position={apronPosition} receiveShadow>
        <boxGeometry args={apronSize} />
        <meshStandardMaterial color={isNight ? '#1e293b' : '#64748b'} roughness={0.94} />
      </mesh>
      <mesh position={curbPosition} receiveShadow>
        <boxGeometry args={curbSize} />
        <meshStandardMaterial
          color={accent}
          emissive={isNight ? accent : '#000000'}
          emissiveIntensity={isNight ? 1.2 : 0.12}
          roughness={0.5}
          metalness={0.28}
        />
      </mesh>
      {bollardPositions.map((position, index) => (
        <mesh key={index} position={position} castShadow>
          <cylinderGeometry args={[0.1, 0.13, 0.82, 8]} />
          <meshStandardMaterial color={index === 1 ? accent : '#cbd5e1'} metalness={0.62} roughness={0.34} />
        </mesh>
      ))}
      {planterPositions.map((position, index) => (
        <Planter key={index} position={[position[0], 0, position[2]]} isNight={isNight} />
      ))}
    </group>
  );
};

const SpiceGardenMassing: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const [x, z] = MARATHAHALLI_SOURCE_ANCHORS.spiceGarden.restaurant;
  const signColor = isNight ? '#fbbf24' : '#f97316';

  return (
    <group
      name="SourceSpiceGardenModelledFrontage"
      position={[x, 0, z]}
      userData={{
        source: 'OSM node/1047248383',
        sourceAnchor: 'spiceGarden.restaurant',
        status: 'modelled frontage detail',
        exactFacade: false,
        fieldVerify: true
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

      {/* Supplemental low-cost street frontage detail; the current facade is not survey imagery. */}
      <FacadeBand axis="z" face={-7.86} normalSign={-1} y={1.15} length={21.5} thickness={0.28} color="#fed7aa" isNight={isNight} />
      <FacadeBand axis="z" face={-7.86} normalSign={-1} y={5.9} length={21.5} thickness={0.24} color="#0ea5e9" isNight={isNight} />
      <FacadeWindowGrid
        axis="z"
        face={-7.9}
        normalSign={-1}
        columns={3}
        rows={1}
        spacing={7}
        yStart={3.2}
        rowStep={3.5}
        paneWidth={4.45}
        paneHeight={3.1}
        color={isNight ? '#fef3c7' : '#bae6fd'}
        nightColor="#f59e0b"
        isNight={isNight}
        name="SpiceGardenModelledWindowBays"
      />
      <FacadeEntrance
        axis="z"
        face={-7.92}
        normalSign={-1}
        width={3.7}
        height={3.2}
        isNight={isNight}
        glassColor="#bfdbfe"
        frameColor="#f8fafc"
        name="SpiceGardenModelledEntrance"
      />
      <GroundApron
        axis="z"
        face={-7.92}
        normalSign={-1}
        width={21}
        depth={3.8}
        isNight={isNight}
        accent={signColor}
        name="SpiceGardenModelledGroundApron"
      />
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
    <group
      name="SourceOracleHubModelledCampus"
      userData={{
        source: 'OSM way/688600223 landuse=commercial',
        sourceAnchor: 'oracleHub.campusCentroid',
        status: 'modelled campus massing and frontage detail',
        exactFacade: false,
        fieldVerify: true
      }}
    >
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
            <FacadeBand axis="z" face={depth / 2 + 0.24} normalSign={1} y={2.3} length={width - 4} thickness={0.22} color="#0e7490" isNight={isNight} />
            <FacadeBand axis="z" face={depth / 2 + 0.24} normalSign={1} y={height * 0.48} length={width - 4} thickness={0.18} color="#38bdf8" isNight={isNight} />
            <FacadeBand axis="z" face={depth / 2 + 0.24} normalSign={1} y={height - 1.4} length={width - 4} thickness={0.22} color="#0e7490" isNight={isNight} />
            <FacadeWindowGrid
              axis="z"
              face={depth / 2 + 0.26}
              normalSign={1}
              columns={Math.max(3, Math.min(5, Math.floor(width / 14)))}
              rows={Math.max(2, Math.min(4, Math.floor(height / 11)))}
              spacing={Math.min(15, width / 4.2)}
              yStart={4.3}
              rowStep={Math.max(8, height / 4.1)}
              paneWidth={Math.min(8, width / 5.1)}
              paneHeight={Math.min(5.2, height / 5.2)}
              color="#67e8f9"
              nightColor="#93c5fd"
              isNight={isNight}
              name={`OracleModelledWindowGrid-${index}`}
            />
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
          distanceFactor={30}
        />
      </group>

      <group
        position={[entranceX, 0, entranceZ]}
        name="OracleModelledEntranceFountain"
        userData={{ sourceAnchor: 'oracleHub.entranceFountain', status: 'modelled entry detail', fieldVerify: true }}
      >
        <mesh position={[0, 2.8, 0]} castShadow>
          <boxGeometry args={[16, 5.6, 2.4]} />
          <meshStandardMaterial color={isNight ? '#1d4ed8' : '#0f766e'} roughness={0.34} metalness={0.52} />
        </mesh>
        <mesh position={[0, 5.8, 0]}>
          <boxGeometry args={[12, 0.24, 2.8]} />
          <meshBasicMaterial color={isNight ? '#67e8f9' : '#5eead4'} toneMapped={false} />
        </mesh>
        <FacadeSignPlate
          axis="z"
          face={-1.45}
          normalSign={-1}
          y={5.3}
          width={11.5}
          height={1.65}
          color={isNight ? '#172554' : '#134e4a'}
          accent="#5eead4"
          isNight={isNight}
          name="OracleModelledEntrySignage"
        />
        <FacadeEntrance
          axis="z"
          face={-1.5}
          normalSign={-1}
          width={7.8}
          height={3.35}
          isNight={isNight}
          glassColor="#a5f3fc"
          frameColor="#99f6e4"
          name="OracleModelledEntryDoors"
        />
        <GroundApron
          axis="z"
          face={-1.5}
          normalSign={-1}
          width={20}
          depth={11}
          isNight={isNight}
          accent="#5eead4"
          name="OracleModelledEntryApron"
        />
      </group>
    </group>
  );
};

const InnovativeMultiplexMassing: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const [x, z] = MARATHAHALLI_SOURCE_ANCHORS.innovativeMultiplex.buildingCentroid;
  const [edgeX, edgeZ] = MARATHAHALLI_SOURCE_ANCHORS.innovativeMultiplex.exteriorEdge;
  const edgeOffset: LocalPosition = [edgeX - x, 0, edgeZ - z];

  return (
    <group
      name="SourceInnovativeMultiplexFrontageDetail"
      position={[x, 0, z]}
      userData={{
        source: 'OSM way/343600093',
        sourceAnchor: 'innovativeMultiplex.buildingCentroid',
        exteriorEdgeAnchor: 'innovativeMultiplex.exteriorEdge',
        status: 'modelled frontage overlay',
        exactFacade: false,
        fieldVerify: true
      }}
    >
      {/* The heavier theatre mass is supplied by the corridor landmark model; this is its source-edge detail layer. */}
      <FacadeBand axis="x" face={28.42} normalSign={1} y={1.2} length={34} thickness={0.3} color="#fef3c7" isNight={isNight} />
      <FacadeBand axis="x" face={28.42} normalSign={1} y={7.2} length={34} thickness={0.22} color="#facc15" isNight={isNight} />
      <FacadeBand axis="x" face={28.42} normalSign={1} y={11.6} length={32} thickness={0.32} color="#450a0a" isNight={isNight} />
      <FacadeWindowGrid
        axis="x"
        face={28.46}
        normalSign={1}
        columns={5}
        rows={1}
        spacing={6.1}
        yStart={3.9}
        rowStep={4.2}
        paneWidth={4.55}
        paneHeight={3.45}
        color="#93c5fd"
        nightColor="#fde68a"
        isNight={isNight}
        name="InnovativeMultiplexModelledPosterWindows"
      />
      <FacadeEntrance
        axis="x"
        face={28.5}
        normalSign={1}
        width={13.8}
        height={5.4}
        isNight={isNight}
        glassColor="#bfdbfe"
        frameColor="#fef3c7"
        name="InnovativeMultiplexModelledLobby"
      />
      <FacadeSignPlate
        axis="x"
        face={28.58}
        normalSign={1}
        y={12.35}
        width={30}
        height={2.65}
        color="#450a0a"
        accent="#facc15"
        isNight={isNight}
        name="InnovativeMultiplexModelledMarquee"
      />
      <GroundApron
        axis="x"
        face={28.52}
        normalSign={1}
        width={36}
        depth={9.5}
        isNight={isNight}
        accent="#facc15"
        name="InnovativeMultiplexModelledForecourt"
      />

      {/* This small paving bridge terminates exactly at the source exterior-edge anchor. */}
      <group
        position={edgeOffset}
        name="InnovativeMultiplexSourceExteriorEdge"
        userData={{ sourceAnchor: 'innovativeMultiplex.exteriorEdge', status: 'modelled edge apron', fieldVerify: true }}
      >
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[12, 0.16, 22]} />
          <meshStandardMaterial color={isNight ? '#1e293b' : '#64748b'} roughness={0.92} />
        </mesh>
        <mesh position={[-6, 0.16, 0]} receiveShadow>
          <boxGeometry args={[40, 0.12, 3.2]} />
          <meshStandardMaterial color={isNight ? '#334155' : '#94a3b8'} roughness={0.88} />
        </mesh>
        {[-7, 7].map((along) => (
          <mesh key={along} position={[0, 0.52, along]} castShadow>
            <cylinderGeometry args={[0.1, 0.13, 0.78, 8]} />
            <meshStandardMaterial color="#facc15" metalness={0.56} roughness={0.38} />
          </mesh>
        ))}
      </group>
      <SourceLabel
        position={[29, 17.2, 0]}
        title="INNOVATIVE MULTIPLEX"
        detail="OSM FOOTPRINT · MODELLED FRONTAGE · FIELD VERIFY"
        distanceFactor={24}
      />
    </group>
  );
};

const KalamandirFrontageDetail: React.FC<{ isNight: boolean }> = ({ isNight }) => {
  const [x, z] = MARATHAHALLI_SOURCE_ANCHORS.kalamandir.buildingCentroid;
  const [edgeX, edgeZ] = MARATHAHALLI_SOURCE_ANCHORS.kalamandir.westExteriorEdge;
  const rotationY = -Math.PI / 2 - 0.2;

  return (
    <group
      name="SourceKalamandirFrontageDetail"
      position={[x, 0, z]}
      rotation={[0, rotationY, 0]}
      userData={{
        source: 'OSM way/223045596',
        sourceAnchor: 'kalamandir.buildingCentroid',
        exteriorEdgeAnchor: 'kalamandir.westExteriorEdge',
        status: 'modelled frontage overlay',
        exactFacade: false,
        fieldVerify: true
      }}
    >
      {/* Thin source-aligned articulation complements the heavier palace model at this stop. */}
      <FacadeBand axis="z" face={16.45} normalSign={1} y={5.15} length={31.5} thickness={0.26} color="#fbbf24" isNight={isNight} />
      <FacadeBand axis="z" face={16.45} normalSign={1} y={10.9} length={31.5} thickness={0.2} color="#f59e0b" isNight={isNight} />
      <FacadeBand axis="z" face={16.45} normalSign={1} y={16.65} length={31.5} thickness={0.2} color="#fbbf24" isNight={isNight} />
      <FacadeBand axis="z" face={16.45} normalSign={1} y={22.4} length={31.5} thickness={0.2} color="#f59e0b" isNight={isNight} />
      <FacadeWindowGrid
        axis="z"
        face={16.5}
        normalSign={1}
        columns={5}
        rows={3}
        spacing={5.65}
        yStart={6.8}
        rowStep={5.55}
        paneWidth={4.15}
        paneHeight={3.85}
        color="#fef3c7"
        nightColor="#fde68a"
        opacity={0.66}
        isNight={isNight}
        name="KalamandirModelledShowcaseWindowBays"
      />
      <FacadeEntrance
        axis="z"
        face={16.58}
        normalSign={1}
        width={9}
        height={5.6}
        isNight={isNight}
        glassColor="#fef3c7"
        frameColor="#d97706"
        name="KalamandirModelledFrontEntrance"
      />
      <FacadeSignPlate
        axis="z"
        face={16.62}
        normalSign={1}
        y={33.1}
        width={31}
        height={4.5}
        color="#4c0519"
        accent="#fbbf24"
        isNight={isNight}
        name="KalamandirModelledRoyalSignage"
      />

      {/* A low source-edge apron sits at the mapped western exterior point, without asserting paving survey detail. */}
      <group
        position={[edgeX - x, 0, edgeZ - z]}
        rotation={[0, -rotationY, 0]}
        name="KalamandirSourceExteriorEdge"
        userData={{ sourceAnchor: 'kalamandir.westExteriorEdge', status: 'modelled edge apron', fieldVerify: true }}
      >
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[8, 0.16, 18]} />
          <meshStandardMaterial color={isNight ? '#1e293b' : '#94a3b8'} roughness={0.9} />
        </mesh>
        {[-5, 5].map((along) => (
          <Planter key={along} position={[along, 0, 3.5]} isNight={isNight} />
        ))}
      </group>
      <SourceLabel
        position={[0, 40.5, 17.2]}
        title="KALAMANDIR"
        detail="OSM FOOTPRINT · MODELLED FRONTAGE · FIELD VERIFY"
        distanceFactor={24}
      />
    </group>
  );
};

export const SourceLandmarkMassings: React.FC<SourceLandmarkMassingsProps> = ({ cameraPreset, isNight }) => {
  return (
    <group name="SourceLandmarkMassings">
      {cameraPreset === 'spicegarden' && <SpiceGardenMassing isNight={isNight} />}
      {cameraPreset === 'oraclehub' && <OracleHubMassing isNight={isNight} />}
      {cameraPreset === 'multiplex' && <InnovativeMultiplexMassing isNight={isNight} />}
      {cameraPreset === 'kalamandir' && <KalamandirFrontageDetail isNight={isNight} />}
    </group>
  );
};

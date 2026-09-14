import React from 'react';
import { SignalStatus } from '../../../types';

interface StreetFurnitureProps {
  isNight: boolean;
  signalStatus: SignalStatus;
}

export const StreetFurniture: React.FC<StreetFurnitureProps> = ({ isNight, signalStatus }) => {
  const orrX = 15.5;
  const oarZ = 14.5;

  return (
    <group name="MarathahalliStreetFurniture">
      {/* ── Surface Streetlight Poles along Outer Ring Road Service Roads ── */}
      {[-120, -80, -40, 40, 80, 120].map((zPos, idx) => (
        <React.Fragment key={`orr-light-${idx}`}>
          <SurfaceLightPole position={[orrX + 1.2, 0, zPos]} rotationY={-Math.PI / 2} isNight={isNight} />
          <SurfaceLightPole position={[-orrX - 1.2, 0, zPos]} rotationY={Math.PI / 2} isNight={isNight} />
        </React.Fragment>
      ))}

      {/* ── Streetlights along HAL Old Airport Road & Varthur Road ── */}
      {[-120, -70, 30, 90].map((xPos, idx) => (
        <React.Fragment key={`road-light-${idx}`}>
          <SurfaceLightPole position={[xPos, 0, oarZ + 0.8]} rotationY={0} isNight={isNight} />
          <SurfaceLightPole position={[xPos, 0, -oarZ - 0.8]} rotationY={Math.PI} isNight={isNight} />
        </React.Fragment>
      ))}

      {/* ── 4 Traffic Signal Posts at Crossroads ── */}
      <TrafficSignalPost
        position={[orrX - 1.5, 0, oarZ + 3]}
        rotationY={Math.PI}
        activeColor={signalStatus.nsColor}
      />
      <TrafficSignalPost
        position={[-orrX + 1.5, 0, -oarZ - 3]}
        rotationY={0}
        activeColor={signalStatus.nsColor}
      />
      <TrafficSignalPost
        position={[orrX + 3, 0, -oarZ + 1.5]}
        rotationY={-Math.PI / 2}
        activeColor={signalStatus.ewColor}
      />
      <TrafficSignalPost
        position={[-orrX - 3, 0, oarZ - 1.5]}
        rotationY={Math.PI / 2}
        activeColor={signalStatus.ewColor}
      />

      {/* ── Authentic Bengaluru BBMP Highway Gantries (Kannada & English) ── */}
      <HighwayGantry
        position={[0, 0, 85]}
        rotationY={0}
        title="MARATHAHALLI UNDERPASS // ಮಾರತ್ತಹಳ್ಳಿ ಅಂಡರ್‌ಪಾಸ್"
        lanes="↓ BELLANDUR / SILK BOARD (UNDERPASS)   |   ← HAL AIRPORT ROAD"
      />
      <HighwayGantry
        position={[0, 0, -85]}
        rotationY={Math.PI}
        title="MARATHAHALLI JUNCTION // ಮಾರತ್ತಹಳ್ಳಿ ಜಂಕ್ಷನ್"
        lanes="↑ KR PURAM / HEBBAL (UNDERPASS)   |   → WHITEFIELD / ITPL"
      />
      <HighwayGantry
        position={[95, 0, 0]}
        rotationY={-Math.PI / 2}
        title="VARTHUR ROAD // ವರ್ತೂರು ರಸ್ತೆ"
        lanes="↑ WHITEFIELD / VARTHUR / ITPL"
      />

      {/* ── The Famous Marathahalli Bridge Bus Bay (Bottleneck Transit Stop) ── */}
      {/* Located along Varthur Road North curb adjacent to Skywalk */}
      <group position={[52, 0, 12.8]}>
        <BusShelter position={[0, 0, 0]} rotationY={0} />
        {/* Waiting Commuters (Instanced passenger representations) */}
        {[-3, -1.5, 0, 1.5, 3].map((xOffset, i) => (
          <group key={i} position={[xOffset, 0, 0.6]}>
            {/* Person body */}
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.2, 0.22, 1.1, 8]} />
              <meshStandardMaterial color={['#1e3a8a', '#b91c1c', '#047857', '#d97706', '#475569'][i]} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.5, 0]}>
              <sphereGeometry args={[0.15, 8, 8]} />
              <meshStandardMaterial color="#fed7aa" />
            </mesh>
          </group>
        ))}

        {/* BMTC City Bus Stopped at Bay */}
        <ParkedBMTCBus position={[4, 0, -2.5]} />
      </group>

      {/* ── Bengaluru Auto-Rickshaw Stand (Queue waiting by the curb) ── */}
      <group position={[-18, 0, 22]}>
        <ParkedAutoRickshaw position={[0, 0, -4]} />
        <ParkedAutoRickshaw position={[0, 0, 0]} />
        <ParkedAutoRickshaw position={[0, 0, 4]} />
        {/* Auto Stand Board */}
        <mesh position={[1.0, 1.8, -6]}>
          <boxGeometry args={[0.1, 0.8, 1.6]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
        <mesh position={[1.0, 0.9, -6]}>
          <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </group>
    </group>
  );
};

// Subcomponent: Curved Surface Streetlight
const SurfaceLightPole: React.FC<{
  position: [number, number, number];
  rotationY: number;
  isNight: boolean;
}> = ({ position, rotationY, isNight }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 4.0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 8.0, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[1.4, 7.8, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.08, 0.08, 3.2, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[2.7, 8.4, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.35]} />
        <meshStandardMaterial
          color={isNight ? '#fff8e7' : '#334155'}
          emissive={isNight ? '#ffe49e' : '#000000'}
          emissiveIntensity={isNight ? 2.5 : 0}
        />
      </mesh>
      {isNight && (
        <pointLight position={[2.7, 8.0, 0]} intensity={18} distance={28} color="#ffe8b3" />
      )}
    </group>
  );
};

// Subcomponent: Traffic Signal Post with 3-aspect colored lenses
const TrafficSignalPost: React.FC<{
  position: [number, number, number];
  rotationY: number;
  activeColor: 'green' | 'amber' | 'red';
}> = ({ position, rotationY, activeColor }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 6.4, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.8, 6.0, 0]}>
        <boxGeometry args={[3.6, 0.1, 0.1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      <mesh position={[3.2, 5.8, 0]}>
        <boxGeometry args={[0.45, 1.4, 0.4]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Red Light */}
      <mesh position={[3.2, 6.2, 0.22]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial
          color={activeColor === 'red' ? '#ff3b30' : '#450a0a'}
          emissive={activeColor === 'red' ? '#ff3b30' : '#000000'}
          emissiveIntensity={activeColor === 'red' ? 3.5 : 0}
        />
      </mesh>
      {/* Amber Light */}
      <mesh position={[3.2, 5.8, 0.22]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial
          color={activeColor === 'amber' ? '#ffcc00' : '#451a03'}
          emissive={activeColor === 'amber' ? '#ffcc00' : '#000000'}
          emissiveIntensity={activeColor === 'amber' ? 3.5 : 0}
        />
      </mesh>
      {/* Green Light */}
      <mesh position={[3.2, 5.4, 0.22]}>
        <circleGeometry args={[0.15, 16]} />
        <meshStandardMaterial
          color={activeColor === 'green' ? '#34c759' : '#052e16'}
          emissive={activeColor === 'green' ? '#34c759' : '#000000'}
          emissiveIntensity={activeColor === 'green' ? 3.5 : 0}
        />
      </mesh>
    </group>
  );
};

// Subcomponent: Highway Overhead Gantry with bilingual details
const HighwayGantry: React.FC<{
  position: [number, number, number];
  rotationY: number;
  title: string;
  lanes: string;
}> = ({ position, rotationY }) => {
  const gantryWidth = 26;
  const gantryHeight = 8.8;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[-gantryWidth / 2, gantryHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, gantryHeight, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      <mesh position={[gantryWidth / 2, gantryHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, gantryHeight, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>
      <mesh position={[0, gantryHeight - 0.2, 0]}>
        <boxGeometry args={[gantryWidth + 1, 0.5, 0.5]} />
        <meshStandardMaterial color="#475569" metalness={0.7} />
      </mesh>

      {/* Green signboard */}
      <mesh position={[0, gantryHeight - 1.2, 0.35]}>
        <boxGeometry args={[gantryWidth * 0.78, 1.8, 0.12]} />
        <meshStandardMaterial color="#047857" roughness={0.3} />
      </mesh>
      <mesh position={[0, gantryHeight - 1.2, 0.42]}>
        <boxGeometry args={[gantryWidth * 0.76, 1.68, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, gantryHeight - 1.2, 0.44]}>
        <boxGeometry args={[gantryWidth * 0.74, 1.5, 0.02]} />
        <meshStandardMaterial color="#047857" />
      </mesh>
    </group>
  );
};

// Subcomponent: BMTC Bus Shelter
const BusShelter: React.FC<{ position: [number, number, number]; rotationY: number }> = ({
  position,
  rotationY
}) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[9.0, 0.2, 2.4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.4, -1.1]}>
        <boxGeometry args={[8.8, 2.4, 0.08]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 2.6, 0.1]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[9.4, 0.15, 2.8]} />
        <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
};

// Subcomponent: Parked BMTC City Bus at Stop
const ParkedBMTCBus: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Blue / Teal BMTC Body */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[2.4, 2.6, 9.8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.4} />
      </mesh>
      {/* White lower livery stripe */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.42, 0.5, 9.82]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Front Destination LED (MARATHAHALLI -> MAJESTIC) */}
      <mesh position={[0, 2.5, 4.92]}>
        <boxGeometry args={[1.8, 0.35, 0.05]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
};

// Subcomponent: Parked Bengaluru Auto-Rickshaw
const ParkedAutoRickshaw: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Green bottom */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.3, 0.5, 2.4]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      {/* Yellow top */}
      <mesh position={[0, 1.05, -0.2]} castShadow>
        <boxGeometry args={[1.25, 0.6, 1.7]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
    </group>
  );
};

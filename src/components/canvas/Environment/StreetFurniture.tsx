import React from 'react';
import * as THREE from 'three';
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

      {/* ── 4 Traffic Signal Posts at Crossroads (Repositioned to curb line of expanded 56x42m junction) ── */}
      <TrafficSignalPost
        position={[28.5, 0, 21.5]}
        rotationY={Math.PI}
        activeColor={signalStatus.nsColor}
      />
      <TrafficSignalPost
        position={[-28.5, 0, -21.5]}
        rotationY={0}
        activeColor={signalStatus.nsColor}
      />
      <TrafficSignalPost
        position={[28.5, 0, -21.5]}
        rotationY={-Math.PI / 2}
        activeColor={signalStatus.ewColor}
      />
      <TrafficSignalPost
        position={[-28.5, 0, 21.5]}
        rotationY={Math.PI / 2}
        activeColor={signalStatus.ewColor}
      />

      {/* ── Authentic Bengaluru BBMP Highway Gantries (Kannada & English) ── */}
      <HighwayGantry
        position={[0, 0, 85]}
        rotationY={0}
        title="MARATHAHALLI UNDERPASS // ಮಾರತ್ತಹಳ್ಳಿ ಅಂಡರ್‌ಪಾಸ್"
        lanes="↓ BELLANDUR (UNDERPASS - FREEWAY)   |   ↰ U-TURN (SIGNAL)   |   ← HAL AIRPORT RD"
      />
      <HighwayGantry
        position={[0, 0, -85]}
        rotationY={Math.PI}
        title="MARATHAHALLI JUNCTION // ಮಾರತ್ತಹಳ್ಳಿ ಜಂಕ್ಷನ್"
        lanes="↑ KR PURAM (UNDERPASS - FREEWAY)   |   ↰ U-TURN (SIGNAL)   |   → WHITEFIELD"
      />
      <HighwayGantry
        position={[95, 0, 0]}
        rotationY={-Math.PI / 2}
        title="VARTHUR ROAD // ವರ್ತೂರು ರಸ್ತೆ"
        lanes="← AIRPORT RD / CITY   |   ↰ U-TURN   |   ↑ WHITEFIELD / ITPL"
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

      {/* ── Traffic Police Control Booth at Junction Center ── */}
      <group position={[0, 0.44, 0]} name="PoliceControlBooth">
        {/* Main booth enclosure */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 2.4, 1.8]} />
          <meshStandardMaterial color="#1e40af" roughness={0.6} metalness={0.2} />
        </mesh>
        {/* Khaki/white roof canopy */}
        <mesh position={[0, 2.55, 0]} castShadow>
          <boxGeometry args={[2.2, 0.2, 2.2]} />
          <meshStandardMaterial color="#fef9c3" roughness={0.7} />
        </mesh>
        {/* Glass observation windows */}
        {([[0, 1.2, 0.92], [0, 1.2, -0.92], [0.92, 1.2, 0], [-0.92, 1.2, 0]] as [number, number, number][]).map(([wx, wy, wz], i) => (
          <mesh key={i} position={[wx, wy, wz]}>
            <boxGeometry args={[i < 2 ? 1.2 : 0.12, 1.0, i < 2 ? 0.08 : 1.2]} />
            <meshStandardMaterial
              color={isNight ? '#bfdbfe' : '#e0f2fe'}
              transparent
              opacity={0.5}
              roughness={0.1}
              metalness={0.8}
              emissive={isNight ? '#3b82f6' : '#000000'}
              emissiveIntensity={isNight ? 0.6 : 0}
            />
          </mesh>
        ))}
        {/* BBMP white-blue color band stripe */}
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.82, 0.35, 1.82]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
        {/* TRAFFIC POLICE text panel */}
        <mesh position={[0, 2.3, 0.93]}>
          <boxGeometry args={[1.6, 0.28, 0.06]} />
          <meshStandardMaterial
            color="#1e40af"
            emissive={isNight ? '#1d4ed8' : '#000000'}
            emissiveIntensity={isNight ? 0.8 : 0}
          />
        </mesh>
      </group>

      {/* ── BBMP Green/Blue Dustbins at Junction Footpath Corners ── */}
      {[
        [32, 0, 24], [-32, 0, 24], [32, 0, -24], [-32, 0, -24]
      ].map(([bx, by, bz], i) => (
        <group key={`bin-${i}`} position={[bx, by, bz]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.18, 0.75, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#15803d' : '#1d4ed8'} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.97, 0]}>
            <cylinderGeometry args={[0.23, 0.23, 0.12, 8]} />
            <meshStandardMaterial color="#374151" roughness={0.6} />
          </mesh>
        </group>
      ))}
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

      {/* LED Countdown Timer display below signal head */}
      <group position={[3.2, 6.0 - 2.5, 0.2]}>
        <mesh>
          <boxGeometry args={[0.65, 0.45, 0.12]} />
          <meshStandardMaterial
            color={activeColor === 'green' ? '#00ff44' : activeColor === 'amber' ? '#ff8c00' : '#ff2222'}
            emissive={activeColor === 'green' ? '#00ff44' : activeColor === 'amber' ? '#ff8c00' : '#ff2222'}
            emissiveIntensity={2.2}
            roughness={0.2}
          />
        </mesh>
        {/* Black outer bezel */}
        <mesh position={[0, 0, -0.07]}>
          <boxGeometry args={[0.72, 0.52, 0.06]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
};

// Subcomponent: Highway Overhead Gantry with bilingual details
const HighwayGantry: React.FC<{
  position: [number, number, number];
  rotationY: number;
  title: string;
  lanes: string;
}> = ({ position, rotationY, title, lanes }) => {
  const gantryWidth = 26;
  const gantryHeight = 8.8;

  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Green highway signboard background
    ctx.fillStyle = '#065f46';
    ctx.fillRect(0, 0, 1024, 256);

    // White outer border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 1004, 236);

    // Inner yellow accent line
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 984, 216);

    // Title (Top line)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 512, 75);

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 128);
    ctx.lineTo(984, 128);
    ctx.stroke();

    // Lanes / Instructions (Bottom line)
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 32px -apple-system, sans-serif';
    ctx.fillText(lanes, 512, 185);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  }, [title, lanes]);

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

      {/* Board backing */}
      <mesh position={[0, gantryHeight - 1.2, 0.28]}>
        <boxGeometry args={[gantryWidth * 0.78, 2.2, 0.12]} />
        <meshStandardMaterial color="#064e3b" roughness={0.3} />
      </mesh>
      {/* Front Face with high-res text texture */}
      <mesh position={[0, gantryHeight - 1.2, 0.36]}>
        <planeGeometry args={[gantryWidth * 0.76, 2.1]} />
        <meshBasicMaterial map={texture} />
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

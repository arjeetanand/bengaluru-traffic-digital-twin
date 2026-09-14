import React from 'react';

interface RoadsideShopsProps {
  isNight: boolean;
}

export const RoadsideShops: React.FC<RoadsideShopsProps> = ({ isNight }) => {
  return (
    <group name="MarathahalliRoadsideShopsAndMarkets">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. HAL OLD AIRPORT ROAD COMMERCIAL ROW (West corridor, X = -230 to -40) */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group name="HALRoadShowrooms">
        {/* Kalyan Jewellers Grand Showroom (x = -135, z = 19) */}
        <ShowroomStore
          position={[-135, 0, 19]}
          width={28}
          depth={14}
          height={14}
          facadeColor="#78350f"
          signBg="#451a03"
          signText="KALYAN JEWELLERS"
          signTextColor="#fbbf24"
          isNight={isNight}
          accentLightColor="#fef08a"
        />

        {/* Tanishq Jewellery (x = -95, z = 19) */}
        <ShowroomStore
          position={[-95, 0, 19]}
          width={24}
          depth={14}
          height={12}
          facadeColor="#1e293b"
          signBg="#0f172a"
          signText="TANISHQ"
          signTextColor="#f59e0b"
          isNight={isNight}
          accentLightColor="#fff1cc"
        />

        {/* Titan Eyeplus & Watches (x = -65, z = 19) */}
        <ShowroomStore
          position={[-65, 0, 19]}
          width={18}
          depth={14}
          height={11}
          facadeColor="#334155"
          signBg="#1e3a8a"
          signText="TITAN WORLD"
          signTextColor="#ffffff"
          isNight={isNight}
          accentLightColor="#93c5fd"
        />

        {/* Raymond & Footwear Apparel (x = -185, z = 19) */}
        <ShowroomStore
          position={[-185, 0, 19]}
          width={26}
          depth={14}
          height={12}
          facadeColor="#1f2937"
          signBg="#991b1b"
          signText="RAYMOND APPAREL"
          signTextColor="#ffffff"
          isNight={isNight}
          accentLightColor="#fca5a5"
        />

        {/* South Side HAL Road: Bata & Woodland Showrooms (z = -19) */}
        <ShowroomStore
          position={[-120, 0, -19]}
          width={28}
          depth={14}
          height={12}
          facadeColor="#1e293b"
          signBg="#dc2626"
          signText="BATA FOOTWEAR"
          signTextColor="#ffffff"
          isNight={isNight}
          accentLightColor="#fecaca"
          rotationY={Math.PI}
        />
        <ShowroomStore
          position={[-75, 0, -19]}
          width={24}
          depth={14}
          height={12}
          facadeColor="#27272a"
          signBg="#15803d"
          signText="WOODLAND"
          signTextColor="#fef08a"
          isNight={isNight}
          accentLightColor="#bbf7d0"
          rotationY={Math.PI}
        />
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. INNOVATIVE MULTIPLEX LANDMARK COMPLEX (South ORR, z = -175, x = -40) */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[-42, 0, -180]} name="InnovativeMultiplexHub">
        {/* Main Multiplex Cinema Complex Building */}
        <mesh position={[0, 10, 0]} castShadow receiveShadow>
          <boxGeometry args={[34, 20, 42]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.6} metalness={0.4} />
        </mesh>

        {/* Front Art-Deco Entrance Canopy & Glass Lobby */}
        <mesh position={[17.2, 5, 0]} castShadow>
          <boxGeometry args={[2.5, 10, 32]} />
          <meshStandardMaterial
            color={isNight ? '#3b82f6' : '#93c5fd'}
            roughness={0.1}
            metalness={0.8}
            emissive={isNight ? '#1d4ed8' : '#000000'}
            emissiveIntensity={isNight ? 0.8 : 0}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Marquee Glowing Signboard: INNOVATIVE MULTIPLEX */}
        <group position={[18.6, 14, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 3.8, 30]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.4} />
          </mesh>
          <mesh position={[0.18, 0, 0]}>
            <boxGeometry args={[0.1, 2.6, 28]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#eab308"
              emissiveIntensity={isNight ? 3.5 : 1.2}
            />
          </mesh>
          {isNight && (
            <pointLight position={[2, 0, 0]} intensity={18} distance={25} color="#fde047" />
          )}
        </group>

        {/* Ticket Booking Counter Booths */}
        <group position={[19.5, 1.2, -8]}>
          <mesh castShadow>
            <boxGeometry args={[2.0, 2.4, 6.0]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[1.05, 0.2, 0]}>
            <boxGeometry args={[0.1, 1.0, 5.0]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={isNight ? 2.0 : 0.5}
            />
          </mesh>
        </group>

        {/* Multiplex Bus Bay & Auto Stand Waiting Shelter */}
        <group position={[23.0, 0, 8]}>
          {/* Canopy */}
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[4.5, 0.2, 14]} />
            <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Support posts */}
          {[-5, 0, 5].map((zPos, idx) => (
            <mesh key={idx} position={[1.8, 1.6, zPos]}>
              <cylinderGeometry args={[0.08, 0.08, 3.2, 8]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
          ))}
          {/* Multiplex Bus Stop Signboard */}
          <mesh position={[2.4, 3.4, 0]}>
            <boxGeometry args={[0.1, 0.8, 10]} />
            <meshStandardMaterial
              color="#0369a1"
              emissive="#0284c7"
              emissiveIntensity={isNight ? 2.5 : 0.6}
            />
          </mesh>
        </group>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. KALAMANDIR PALATIAL SILK STORE (North ORR, z = 105, x = 44)       */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[44, 0, 105]} name="KalamandirEthnicPalace">
        {/* 4-Story Palatial Building */}
        <mesh position={[0, 14, 0]} castShadow receiveShadow>
          <boxGeometry args={[36, 28, 36]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* Ornate Gold Entrance Portico */}
        <mesh position={[-18.2, 6, 0]} castShadow>
          <boxGeometry args={[2.5, 12, 24]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Large Illuminated Signboard: KALAMANDIR */}
        <group position={[-19.6, 20, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 4.5, 26]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh position={[-0.18, 0, 0]}>
            <boxGeometry args={[0.1, 3.2, 24]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#facc15"
              emissiveIntensity={isNight ? 4.0 : 1.4}
            />
          </mesh>
          {isNight && (
            <pointLight position={[-3, 0, 0]} intensity={25} distance={30} color="#fde047" />
          )}
        </group>

        {/* Ground Floor Showroom Display Vitrines */}
        {[-8, 0, 8].map((zOffset, idx) => (
          <mesh key={idx} position={[-19.4, 3, zOffset]}>
            <boxGeometry args={[0.1, 4.2, 5.5]} />
            <meshStandardMaterial
              color={isNight ? '#fde047' : '#ffffff'}
              emissive={isNight ? '#eab308' : '#000000'}
              emissiveIntensity={isNight ? 1.8 : 0}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 4. SPICE GARDEN BAZAAR & BUS STOP (East Varthur Road, X = 205 to 265) */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group name="SpiceGardenMarketCorridor">
        {/* ── North Side Shops (z = +19.5, facing South toward the road) ── */}
        {/* Bengaluru Iyengar Bakery (x = 228, z = 19.5) */}
        <group position={[228, 0, 19.5]}>
          {/* Shop structure */}
          <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[11, 7, 10]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.7} />
          </mesh>
          {/* Red & White striped canvas awning */}
          <mesh position={[0, 4.2, -5.2]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[11.2, 0.15, 2.6]} />
            <meshStandardMaterial color="#dc2626" roughness={0.8} />
          </mesh>
          {/* Glowing Signboard: IYENGAR BAKERY */}
          <mesh position={[0, 5.8, -5.1]}>
            <boxGeometry args={[9.5, 1.4, 0.15]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive={isNight ? '#b91c1c' : '#7f1d1d'}
              emissiveIntensity={isNight ? 2.5 : 0.8}
            />
          </mesh>
          {/* Glass display counter showing bakery treats */}
          <mesh position={[0, 1.4, -4.6]}>
            <boxGeometry args={[8.5, 1.8, 1.2]} />
            <meshStandardMaterial
              color={isNight ? '#fffbeb' : '#fef3c7'}
              emissive={isNight ? '#fde68a' : '#000000'}
              emissiveIntensity={isNight ? 2.2 : 0}
            />
          </mesh>
          {isNight && (
            <pointLight position={[0, 3, -4.5]} intensity={12} distance={15} color="#fed7aa" />
          )}
        </group>

        {/* Namma Chai / Tea Stall (x = 241, z = 19.5) */}
        <group position={[241, 0, 18.5]}>
          {/* Small brick kiosk */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <boxGeometry args={[6, 5, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          {/* Blue Plastic Tarpaulin Canopy (Iconic Indian Street Stall) */}
          <mesh position={[0, 3.2, -2.5]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[6.8, 0.1, 3.5]} />
            <meshStandardMaterial color="#0284c7" roughness={0.6} />
          </mesh>
          {/* Stainless steel tea counter table */}
          <mesh position={[0, 1.1, -2.2]} castShadow>
            <boxGeometry args={[5.2, 1.2, 1.2]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Brass/Aluminium Chai Samovar / Kettle */}
          <mesh position={[-1.2, 2.1, -2.2]}>
            <cylinderGeometry args={[0.3, 0.35, 0.7, 12]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Glass jars with Indian snacks (rusk, biscuits) */}
          {[0.2, 0.9, 1.6].map((xOffset, i) => (
            <mesh key={i} position={[xOffset, 1.95, -2.2]}>
              <cylinderGeometry args={[0.15, 0.15, 0.45, 8]} />
              <meshStandardMaterial color="#fef08a" transparent opacity={0.8} />
            </mesh>
          ))}
          {/* Wooden Bench for customers */}
          <mesh position={[0, 0.35, -4.0]}>
            <boxGeometry args={[4.2, 0.12, 0.6]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Warm Chai Stall hanging light */}
          {isNight && (
            <pointLight position={[0, 2.8, -2]} intensity={14} distance={12} color="#ffedd5" />
          )}
        </group>

        {/* ── SPICE GARDEN BMTC BUS STOP (x = 256, z = 18.5) ── */}
        <group position={[256, 0, 18.0]} name="SpiceGardenBusStopShelter">
          {/* Passenger Boarding Platform Slab */}
          <mesh position={[0, 0.2, 0]} receiveShadow>
            <boxGeometry args={[14, 0.3, 3.5]} />
            <meshStandardMaterial color="#64748b" roughness={0.85} />
          </mesh>

          {/* Curved Steel BMTC Shelter Roof */}
          <mesh position={[0, 3.2, 0]} castShadow>
            <boxGeometry args={[13.2, 0.2, 3.2]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Support Columns */}
          {[-5.5, 0, 5.5].map((xP, idx) => (
            <mesh key={idx} position={[xP, 1.6, 1.2]}>
              <cylinderGeometry args={[0.08, 0.08, 3.2, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          ))}

          {/* Stainless steel waiting bench */}
          <mesh position={[0, 0.65, 0.6]}>
            <boxGeometry args={[10, 0.1, 0.8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Spice Garden Bus Stop Backing Board */}
          <mesh position={[0, 2.0, 1.3]}>
            <boxGeometry args={[12.8, 1.6, 0.1]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>

          {/* Glowing Header Sign: SPICE GARDEN BUS STOP */}
          <mesh position={[0, 3.4, -1.55]}>
            <boxGeometry args={[11, 0.6, 0.1]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#0369a1"
              emissiveIntensity={isNight ? 3.0 : 0.8}
            />
          </mesh>

          {/* Commuter Waiting Silhouettes */}
          {[-3.5, -1.2, 1.8, 4.0].map((xP, i) => (
            <group key={i} position={[xP, 0.35, 0]}>
              {/* Torso */}
              <mesh position={[0, 0.9, 0]}>
                <cylinderGeometry args={[0.22, 0.25, 1.1, 8]} />
                <meshStandardMaterial color={['#1e40af', '#b91c1c', '#047857', '#6b7280'][i]} />
              </mesh>
              {/* Head */}
              <mesh position={[0, 1.65, 0]}>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshStandardMaterial color="#d97706" />
              </mesh>
            </group>
          ))}
        </group>

        {/* ── South Side Shops (z = -19.5, facing North toward road) ── */}
        {/* 24x7 MedPlus / Apollo Pharmacy (x = 230, z = -19.5) */}
        <group position={[230, 0, -19.5]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 7, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          {/* Green Illuminated Medical Cross */}
          <group position={[0, 5.8, -5.1]}>
            <mesh>
              <boxGeometry args={[10, 1.4, 0.15]} />
              <meshStandardMaterial color="#15803d" />
            </mesh>
            {/* Cross vertical & horizontal */}
            <mesh position={[-4, 0, 0.1]}>
              <boxGeometry args={[0.3, 1.0, 0.05]} />
              <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={isNight ? 4 : 1.5} />
            </mesh>
            <mesh position={[-4, 0, 0.1]}>
              <boxGeometry args={[1.0, 0.3, 0.05]} />
              <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={isNight ? 4 : 1.5} />
            </mesh>
          </group>
          {/* Glass pharmacy window */}
          <mesh position={[0, 2.2, -4.8]}>
            <boxGeometry args={[10, 2.8, 0.2]} />
            <meshStandardMaterial
              color={isNight ? '#dcfce7' : '#ffffff'}
              emissive={isNight ? '#86efac' : '#000000'}
              emissiveIntensity={isNight ? 1.5 : 0}
            />
          </mesh>
        </group>

        {/* Mobile Repair & Accessories Kiosk (x = 246, z = -19.5) */}
        <group position={[246, 0, -19.5]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[8, 6.4, 10]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 5.4, -5.1]}>
            <boxGeometry args={[7.2, 1.2, 0.15]} />
            <meshStandardMaterial
              color="#0284c7"
              emissive="#0ea5e9"
              emissiveIntensity={isNight ? 3 : 1}
            />
          </mesh>
          <mesh position={[0, 2.2, -4.8]}>
            <boxGeometry args={[6.8, 2.6, 0.2]} />
            <meshStandardMaterial
              color={isNight ? '#93c5fd' : '#bfdbfe'}
              emissive={isNight ? '#3b82f6' : '#000000'}
              emissiveIntensity={isNight ? 1.8 : 0}
            />
          </mesh>
        </group>

        {/* Fresh Tender Coconut & Fruit Stall (x = 258, z = -18.0) */}
        <group position={[258, 0, -18.0]}>
          {/* Heap of green tender coconuts (elaneer) */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.9, 1.3, 0.7, 8]} />
            <meshStandardMaterial color="#65a30d" roughness={0.7} />
          </mesh>
          {/* Multicolored striped umbrella */}
          <mesh position={[0, 2.1, 0]}>
            <cylinderGeometry args={[1.2, 1.6, 0.35, 10]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ── Subcomponent: High-End Retail Showroom (Kalyan, Tanishq, etc.) ──
const ShowroomStore: React.FC<{
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  facadeColor: string;
  signBg: string;
  signText: string;
  signTextColor: string;
  isNight: boolean;
  accentLightColor: string;
  rotationY?: number;
}> = ({
  position,
  width,
  depth,
  height,
  facadeColor,
  signBg,
  signText,
  signTextColor,
  isNight,
  accentLightColor,
  rotationY = 0
}) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]} name={signText}>
      {/* Structural building body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={facadeColor} roughness={0.7} metalness={0.25} />
      </mesh>

      {/* Grand Storefront Display Windows */}
      <mesh position={[0, 3.2, -depth / 2 - 0.08]}>
        <boxGeometry args={[width * 0.88, 5.4, 0.1]} />
        <meshStandardMaterial
          color={isNight ? '#fffbeb' : '#ffffff'}
          emissive={isNight ? '#fde68a' : '#000000'}
          emissiveIntensity={isNight ? 1.6 : 0}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* High-Impact Brand Signboard */}
      <group position={[0, height - 2.2, -depth / 2 - 0.2]}>
        {/* Signboard background backing */}
        <mesh>
          <boxGeometry args={[width * 0.92, 2.6, 0.2]} />
          <meshStandardMaterial color={signBg} roughness={0.4} />
        </mesh>
        {/* Glowing fascia core */}
        <mesh position={[0, 0, -0.12]}>
          <boxGeometry args={[width * 0.86, 1.8, 0.05]} />
          <meshStandardMaterial
            color={signTextColor}
            emissive={signTextColor}
            emissiveIntensity={isNight ? 3.2 : 1.0}
          />
        </mesh>
        {isNight && (
          <pointLight position={[0, 0, -2]} intensity={18} distance={22} color={accentLightColor} />
        )}
      </group>
    </group>
  );
};

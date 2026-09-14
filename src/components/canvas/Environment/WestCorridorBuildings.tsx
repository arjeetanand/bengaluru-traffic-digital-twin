import React from 'react';

interface WestCorridorBuildingsProps {
  isNight: boolean;
}

export const WestCorridorBuildings: React.FC<WestCorridorBuildingsProps> = ({ isNight }) => {
  return (
    <group name="WestSideCorridor_MultiplexToNorth">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. INNOVATIVE MULTIPLEX (South End, Z = -175 to -215, X = -45)       */}
      {/* Real Architecture: 2003 pioneer 9-screen multiplex, red brick,       */}
      {/* slanted glass pyramid roof, curved marquee, parking forecourt         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[-52, 0, -185]} name="InnovativeMultiplex_Real">
        {/* Main 9-Screen Theater Auditorium Block */}
        <mesh position={[0, 11, 0]} castShadow receiveShadow>
          <boxGeometry args={[44, 22, 52]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.7} metalness={0.2} />
        </mesh>

        {/* Lower Cream Stucco Base / Concourse Plinth */}
        <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[45.5, 7, 53.5]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.8} />
        </mesh>

        {/* Iconic Slanted Glass Pyramidal Atrium Roof on Theater Crest */}
        <group position={[0, 22, 0]}>
          <mesh position={[0, 3.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[14, 7, 4]} />
            <meshStandardMaterial
              color={isNight ? '#60a5fa' : '#38bdf8'}
              emissive={isNight ? '#1d4ed8' : '#000000'}
              emissiveIntensity={isNight ? 1.5 : 0}
              roughness={0.15}
              metalness={0.85}
              transparent
              opacity={0.75}
            />
          </mesh>
          {/* Steel Pyramid Frame Ribs */}
          <mesh position={[0, 3.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[14.1, 7.1, 4]} />
            <meshStandardMaterial color="#1e293b" wireframe />
          </mesh>
        </group>

        {/* Art-Deco Stepped Entrance Portico facing Service Road (+X direction) */}
        <group position={[22.5, 0, 0]}>
          {/* Portico Base */}
          <mesh position={[3, 5, 0]} castShadow receiveShadow>
            <boxGeometry args={[6, 10, 36]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.7} />
          </mesh>

          {/* Glazed Grand Entrance Lobby Doors */}
          <mesh position={[5.8, 3.2, 0]}>
            <boxGeometry args={[0.2, 6.2, 28]} />
            <meshStandardMaterial
              color={isNight ? '#fde047' : '#93c5fd'}
              emissive={isNight ? '#eab308' : '#000000'}
              emissiveIntensity={isNight ? 2.0 : 0}
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>

          {/* Stepped Decorative Columns */}
          {[-12, -4, 4, 12].map((zPos, idx) => (
            <mesh key={idx} position={[6.1, 5, zPos]} castShadow>
              <boxGeometry args={[0.8, 10, 0.8]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.5} />
            </mesh>
          ))}

          {/* ── Real Bold Curved Marquee: "INNOVATIVE MULTIPLEX" ── */}
          <group position={[6.5, 12.5, 0]}>
            {/* Curved Marquee Backing Plate */}
            <mesh castShadow>
              <boxGeometry args={[0.5, 4.2, 32]} />
              <meshStandardMaterial color="#450a0a" roughness={0.4} />
            </mesh>
            {/* Glowing Retro Marquee Letters Plate */}
            <mesh position={[0.3, 0, 0]}>
              <boxGeometry args={[0.15, 3.0, 30]} />
              <meshStandardMaterial
                color="#facc15"
                emissive="#eab308"
                emissiveIntensity={isNight ? 4.5 : 1.5}
              />
            </mesh>
            {/* Film Reel Decorative Circular Emblem on Marquee Center */}
            <mesh position={[0.42, 2.4, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[1.5, 1.5, 0.2, 16]} />
              <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={isNight ? 3 : 1} />
            </mesh>
            {isNight && (
              <pointLight position={[3, 0, 0]} intensity={28} distance={35} color="#fde047" />
            )}
          </group>

          {/* Movie Poster Lightboxes along the Facade */}
          {[-10, 0, 10].map((zOffset, i) => (
            <mesh key={i} position={[6.15, 4.0, zOffset]}>
              <boxGeometry args={[0.1, 3.5, 2.4]} />
              <meshStandardMaterial
                color={['#38bdf8', '#f43f5e', '#a855f7'][i]}
                emissive={['#0284c7', '#e11d48', '#9333ea'][i]}
                emissiveIntensity={isNight ? 2.5 : 0.8}
              />
            </mesh>
          ))}
        </group>

        {/* ── Front Paved Parking Forecourt with Ticket Booths & Bus Shelter ── */}
        <group position={[28, 0, 0]}>
          {/* Interlocking Paved Forecourt Slab */}
          <mesh position={[5, 0.1, 0]} receiveShadow>
            <boxGeometry args={[12, 0.2, 54]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>

          {/* Ticket Booking Box Office Windows */}
          <group position={[0, 1.6, -18]}>
            <mesh castShadow>
              <boxGeometry args={[3.2, 3.2, 7.5]} />
              <meshStandardMaterial color="#fef3c7" />
            </mesh>
            {/* Ticket counter windows with blue glow */}
            <mesh position={[1.65, 0, 0]}>
              <boxGeometry args={[0.1, 1.4, 6.0]} />
              <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={isNight ? 3 : 0.5} />
            </mesh>
            {/* Sign: BOX OFFICE */}
            <mesh position={[1.65, 1.8, 0]}>
              <boxGeometry args={[0.1, 0.6, 5.0]} />
              <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={isNight ? 3 : 1} />
            </mesh>
          </group>

          {/* Parking Security Boom Barrier Booth */}
          <group position={[10, 1.2, -6]}>
            <mesh castShadow>
              <boxGeometry args={[1.8, 2.4, 1.8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Red & White striped barrier arm */}
            <mesh position={[0, 0.9, 3]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.12, 5]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
          </group>

          {/* BMTC Multiplex Bus Stop Shelter on Roadside Frontage */}
          <group position={[10.5, 0, 15]}>
            <mesh position={[0, 3.2, 0]} castShadow>
              <boxGeometry args={[3.8, 0.2, 12]} />
              <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Columns */}
            {[-4, 4].map((zP, idx) => (
              <mesh key={idx} position={[1.6, 1.6, zP]}>
                <cylinderGeometry args={[0.08, 0.08, 3.2, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} />
              </mesh>
            ))}
            {/* Sign: MULTIPLEX BUS STOP */}
            <mesh position={[1.8, 3.4, 0]}>
              <boxGeometry args={[0.1, 0.6, 10]} />
              <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={isNight ? 2.5 : 0.8} />
            </mesh>
          </group>

          {/* Auto-Rickshaw Stand Waiting Bay with Yellow/Green Rickshaws */}
          <group position={[9.5, 0, 0]}>
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[2.5, 0.02, 10]} />
              <meshStandardMaterial color="#facc15" />
            </mesh>
          </group>
        </group>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. SOFA & MORE / HOME FURNITURE OUTLET (Z = -135, X = -46)            */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[-46, 0, -135]} name="SofaAndMoreRetail">
        <mesh position={[0, 6, 0]} castShadow receiveShadow>
          <boxGeometry args={[26, 12, 28]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        {/* Large Showroom Window Glazing */}
        <mesh position={[13.1, 4.5, 0]}>
          <boxGeometry args={[0.1, 7.5, 24]} />
          <meshStandardMaterial
            color={isNight ? '#fef08a' : '#bfdbfe'}
            emissive={isNight ? '#eab308' : '#000000'}
            emissiveIntensity={isNight ? 1.5 : 0}
            roughness={0.15}
            metalness={0.8}
          />
        </mesh>
        {/* Signboard */}
        <mesh position={[13.2, 10.5, 0]}>
          <boxGeometry args={[0.15, 1.6, 20]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={isNight ? 2.8 : 0.8} />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. NOVEL MSR PARK & TECH ZONE (Z = -75, X = -48)                      */}
      {/* Real Architecture: Modern corporate IT park, reflective curtain glass,*/}
      {/* Huber & Holly cafe on ground floor                                    */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[-50, 0, -75]} name="NovelMSRParkTechZone">
        {/* 6-Story Corporate Glass Block */}
        <mesh position={[0, 16, 0]} castShadow receiveShadow>
          <boxGeometry args={[32, 32, 44]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Blue Reflective Glass Curtain Facade (+X facing ORR) */}
        <mesh position={[16.1, 16, 0]}>
          <boxGeometry args={[0.1, 30, 40]} />
          <meshStandardMaterial
            color={isNight ? '#60a5fa' : '#0284c7'}
            emissive={isNight ? '#1e40af' : '#000000'}
            emissiveIntensity={isNight ? 1.6 : 0}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        {/* Corporate Signboard: NOVEL MSR PARK */}
        <mesh position={[16.2, 30, 0]}>
          <boxGeometry args={[0.15, 2.2, 26]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={isNight ? 3.0 : 1.0} />
        </mesh>
        {/* Ground Floor Huber & Holly / Cafe Entrance */}
        <mesh position={[16.2, 2.5, -12]}>
          <boxGeometry args={[0.2, 4.0, 12]} />
          <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={isNight ? 2.5 : 0.8} />
        </mesh>
        {/* Rooftop HVAC Plant */}
        <mesh position={[0, 33, 0]}>
          <boxGeometry args={[16, 2.5, 20]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 4. SOUTH-WEST CROSSROADS JEWELLERY HUB (Z = -28, X = -46)             */}
      {/* Real Brands: Tanishq, PMJ Jewels, Max, Forever 21, Reebok             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[-46, 0, -28]} name="SouthWestCorner_TanishqAndJewels">
        <mesh position={[0, 9, 0]} castShadow receiveShadow>
          <boxGeometry args={[26, 18, 30]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Tanishq Gold Facade Glass Frontage */}
        <mesh position={[13.1, 5, 0]}>
          <boxGeometry args={[0.1, 8.5, 26]} />
          <meshStandardMaterial
            color={isNight ? '#fef08a' : '#fffbeb'}
            emissive={isNight ? '#facc15' : '#000000'}
            emissiveIntensity={isNight ? 2.2 : 0}
            roughness={0.1}
            metalness={0.7}
          />
        </mesh>
        {/* Tanishq Sign */}
        <mesh position={[13.2, 14, 0]}>
          <boxGeometry args={[0.15, 2.4, 22]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        <mesh position={[13.3, 14, 0]}>
          <boxGeometry args={[0.05, 1.6, 20]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={isNight ? 4 : 1.5} />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 5. KRISHNA SUMMIT TECH CENTER & BANQUET HALL (Z = +55, X = -46)       */}
      {/* Real Architecture: Sleek blue-gray reflective curtain glass wall,     */}
      {/* angled steel entrance canopy, manicured date palms, valet portico     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[-46, 0, 55]} name="KrishnaSummit_Real">
        {/* Main 7-Story Modern Corporate Tech Block */}
        <mesh position={[0, 18, 0]} castShadow receiveShadow>
          <boxGeometry args={[30, 36, 38]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Reflective Structural Blue-Gray Glass Curtain Wall */}
        <mesh position={[15.1, 18, 0]}>
          <boxGeometry args={[0.1, 33, 34]} />
          <meshStandardMaterial
            color={isNight ? '#38bdf8' : '#0284c7'}
            emissive={isNight ? '#0369a1' : '#000000'}
            emissiveIntensity={isNight ? 1.8 : 0}
            roughness={0.08}
            metalness={0.92}
          />
        </mesh>

        {/* Dark Gray Architectural Horizontal Mullions */}
        {[-12, -6, 0, 6, 12].map((yOffset, idx) => (
          <mesh key={idx} position={[15.2, 18 + yOffset, 0]}>
            <boxGeometry args={[0.1, 0.35, 34.2]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
        ))}

        {/* Angled Glass & Steel Entrance Canopy over Valet Portico */}
        <group position={[18, 4.5, 0]}>
          <mesh rotation={[0, 0, -0.1]} castShadow>
            <boxGeometry args={[6.5, 0.25, 18]} />
            <meshStandardMaterial color="#0284c7" transparent opacity={0.65} metalness={0.8} />
          </mesh>
          {/* Steel support tie rods */}
          {[-7, 7].map((zP, i) => (
            <mesh key={i} position={[-1, 2, zP]} rotation={[0, 0, 0.4]}>
              <cylinderGeometry args={[0.04, 0.04, 4.5, 6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
            </mesh>
          ))}
        </group>

        {/* Illuminated Billboard Sign: "KRISHNA SUMMIT" */}
        <group position={[15.3, 33, 0]}>
          <mesh>
            <boxGeometry args={[0.15, 3.2, 28]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
          <mesh position={[0.1, 0, 0]}>
            <boxGeometry args={[0.05, 2.0, 26]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#38bdf8"
              emissiveIntensity={isNight ? 4.2 : 1.2}
            />
          </mesh>
          {isNight && (
            <pointLight position={[2, 0, 0]} intensity={16} distance={25} color="#38bdf8" />
          )}
        </group>

        {/* Landscaped Front Setback with Ornamental Date Palms */}
        <group position={[19, 0, 0]}>
          {[-12, 12].map((zP, i) => (
            <group key={i} position={[0, 0, zP]}>
              {/* Palm trunk */}
              <mesh position={[0, 3, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.35, 6, 8]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>
              {/* Palm fronds */}
              <mesh position={[0, 6, 0]}>
                <sphereGeometry args={[1.8, 8, 8]} />
                <meshStandardMaterial color="#15803d" roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 6. THE KRISHNA GRAND HOTEL & PURE VEG RESTAURANT (Z = +95, X = -46)   */}
      {/* Real Architecture: 4-story cream/brown hotel, ground floor restaurant */}
      {/* with bright orange/green illuminated sign, balconies                 */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[-46, 0, 98]} name="KrishnaGrandHotel_Real">
        {/* 4-Story Hotel Block */}
        <mesh position={[0, 11, 0]} castShadow receiveShadow>
          <boxGeometry args={[28, 22, 34]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.7} />
        </mesh>
        {/* Espresso Brown Accent Bands */}
        <mesh position={[0, 21.5, 0]}>
          <boxGeometry args={[28.5, 1.2, 34.5]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
        <mesh position={[0, 11.5, 0]}>
          <boxGeometry args={[28.5, 0.8, 34.5]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>

        {/* Ground Floor Pure Veg Glass Restaurant Frontage */}
        <mesh position={[14.1, 2.8, 0]}>
          <boxGeometry args={[0.1, 5.2, 30]} />
          <meshStandardMaterial
            color={isNight ? '#fed7aa' : '#ffffff'}
            emissive={isNight ? '#f97316' : '#000000'}
            emissiveIntensity={isNight ? 1.8 : 0}
            roughness={0.1}
          />
        </mesh>

        {/* Iconic Sign: "THE KRISHNA GRAND - PURE VEG" */}
        <group position={[14.2, 6.2, 0]}>
          <mesh>
            <boxGeometry args={[0.15, 1.8, 28]} />
            <meshStandardMaterial color="#15803d" />
          </mesh>
          <mesh position={[0.1, 0, 0]}>
            <boxGeometry args={[0.05, 1.2, 26]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#eab308"
              emissiveIntensity={isNight ? 3.8 : 1.2}
            />
          </mesh>
        </group>

        {/* Upper Hotel Floor Windows & Balcony Ledgings */}
        {[-8, 0, 8].map((zOff, i) => (
          <mesh key={i} position={[14.15, 15, zOff]}>
            <boxGeometry args={[0.1, 5.0, 4.8]} />
            <meshStandardMaterial
              color={isNight ? '#fef08a' : '#1e293b'}
              emissive={isNight ? '#eab308' : '#000000'}
              emissiveIntensity={isNight ? 1.4 : 0}
            />
          </mesh>
        ))}
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 7. NORTH-WEST TECH TOWER (Z = +150, X = -55)                          */}
      {/* Modern High-Rise Commercial IT Park Tower                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[-55, 0, 150]} name="NorthWestTechTower">
        <mesh position={[0, 26, 0]} castShadow receiveShadow>
          <boxGeometry args={[36, 52, 42]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[18.1, 26, 0]}>
          <boxGeometry args={[0.1, 48, 38]} />
          <meshStandardMaterial
            color={isNight ? '#93c5fd' : '#38bdf8'}
            emissive={isNight ? '#2563eb' : '#000000'}
            emissiveIntensity={isNight ? 1.5 : 0}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
        {/* Red Aviation Warning Obstruction Beacon on Roof Mast */}
        <group position={[0, 56, 0]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.15, 8, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
          <mesh position={[0, 4.2, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={isNight ? 4 : 1.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

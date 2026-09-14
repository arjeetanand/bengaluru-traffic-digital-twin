import React from 'react';

interface EastCorridorBuildingsProps {
  isNight: boolean;
}

export const EastCorridorBuildings: React.FC<EastCorridorBuildingsProps> = ({ isNight }) => {
  return (
    <group name="EastSideCorridor_KalamandirToSouth">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. FACTORY OUTLETS ROW (South-East ORR, Z = -165 to -60, X = +48)     */}
      {/* Famous Marathahalli sportswear factory discount stores: Nike, Adidas, */}
      {/* Puma, Reebok factory outlets with bold commercial fascias             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[48, 0, -115]} name="FactoryOutletsRow">
        {/* Continuous 3-Story Commercial Outlet Complex */}
        <mesh position={[0, 7.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[28, 15, 88]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>

        {/* Display Glazing along Service Road (-X facing ORR) */}
        <mesh position={[-14.1, 4.0, 0]}>
          <boxGeometry args={[0.1, 7.0, 82]} />
          <meshStandardMaterial
            color={isNight ? '#fef08a' : '#ffffff'}
            emissive={isNight ? '#fde047' : '#000000'}
            emissiveIntensity={isNight ? 1.6 : 0}
            roughness={0.1}
            metalness={0.7}
          />
        </mesh>

        {/* Nike Factory Store Section (z = -28) */}
        <group position={[-14.2, 11, -28]}>
          <mesh>
            <boxGeometry args={[0.2, 3.2, 18]} />
            <meshStandardMaterial color="#18181b" />
          </mesh>
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.05, 1.8, 16]} />
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={isNight ? 3.5 : 1.2} />
          </mesh>
        </group>

        {/* Adidas Factory Outlet Section (z = -6) */}
        <group position={[-14.2, 11, -6]}>
          <mesh>
            <boxGeometry args={[0.2, 3.2, 18]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.05, 1.8, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={isNight ? 3.5 : 1.2} />
          </mesh>
        </group>

        {/* Puma Outlet Section (z = +16) */}
        <group position={[-14.2, 11, 16]}>
          <mesh>
            <boxGeometry args={[0.2, 3.2, 18]} />
            <meshStandardMaterial color="#b91c1c" />
          </mesh>
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.05, 1.8, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={isNight ? 3.5 : 1.2} />
          </mesh>
        </group>

        {/* Reebok & FirstCry Outlet Section (z = +36) */}
        <group position={[-14.2, 11, 36]}>
          <mesh>
            <boxGeometry args={[0.2, 3.2, 16]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.05, 1.8, 14]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={isNight ? 3.5 : 1.2} />
          </mesh>
        </group>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. BRAND FACTORY / FASHION FACTORY (Vanshee Towers, Z = 58, X = 48)  */}
      {/* Real Architecture: 4-story retail department warehouse, navy blue    */}
      {/* facade with red & yellow branding, giant discount billboard posters  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[48, 0, 58]} name="BrandFactory_VansheeTowers">
        {/* Main 4-Story Warehouse Retail Block */}
        <mesh position={[0, 14, 0]} castShadow receiveShadow>
          <boxGeometry args={[32, 28, 42]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.5} metalness={0.4} />
        </mesh>

        {/* Vibrant Red Brand Accent Panels */}
        <mesh position={[-16.1, 14, 0]}>
          <boxGeometry args={[0.1, 26, 38]} />
          <meshStandardMaterial color="#991b1b" roughness={0.4} />
        </mesh>

        {/* Large Storefront Glazing on Ground & 1st Floors */}
        <mesh position={[-16.2, 5, 0]}>
          <boxGeometry args={[0.1, 9.5, 34]} />
          <meshStandardMaterial
            color={isNight ? '#fef08a' : '#ffffff'}
            emissive={isNight ? '#fde047' : '#000000'}
            emissiveIntensity={isNight ? 2.2 : 0}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>

        {/* ── Giant Signature Signboard: "BRAND FACTORY" ── */}
        <group position={[-16.3, 23, 0]}>
          <mesh>
            <boxGeometry args={[0.2, 4.8, 36]} />
            <meshStandardMaterial color="#7f1d1d" />
          </mesh>
          <mesh position={[-0.15, 0, 0]}>
            <boxGeometry args={[0.08, 3.4, 34]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#eab308"
              emissiveIntensity={isNight ? 4.5 : 1.5}
            />
          </mesh>
          {isNight && (
            <pointLight position={[-3, 0, 0]} intensity={22} distance={28} color="#fde047" />
          )}
        </group>

        {/* Giant Promotional Discount Billboard Banner ("20% - 70% OFF") */}
        <mesh position={[-16.25, 14, 0]}>
          <boxGeometry args={[0.1, 6.5, 24]} />
          <meshStandardMaterial
            color="#dc2626"
            emissive="#991b1b"
            emissiveIntensity={isNight ? 2.5 : 0.8}
          />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. KALAMANDIR PALATIAL WEDDING SILK PALACE (Z = 112, X = 48)         */}
      {/* Real Architecture: Imposing 4-story South Indian temple-motif facade  */}
      {/* Mustard-gold & terracotta, ornate arched window bays, roof chhatris,  */}
      {/* grand entrance portico, glowing "KALAMANDIR" peacock brand sign       */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[48, 0, 115]} name="KalamandirPalace_Real">
        {/* Main 4-Story Palatial Body */}
        <mesh position={[0, 16, 0]} castShadow receiveShadow>
          <boxGeometry args={[34, 32, 46]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Mustard-Gold Plaster Decorative Facade Layer */}
        <mesh position={[-17.1, 16, 0]}>
          <boxGeometry args={[0.2, 31, 44]} />
          <meshStandardMaterial color="#d97706" roughness={0.5} />
        </mesh>

        {/* Classical Terracotta Red Accent Pilasters */}
        {[-20, -10, 0, 10, 20].map((zPos, idx) => (
          <mesh key={idx} position={[-17.3, 16, zPos]} castShadow>
            <boxGeometry args={[0.3, 31.5, 1.2]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
          </mesh>
        ))}

        {/* Classical Arched Display Window Bays */}
        {[-15, -5, 5, 15].map((zPos, idx) => (
          <group key={idx} position={[-17.35, 14, zPos]}>
            <mesh>
              <boxGeometry args={[0.1, 14, 6.5]} />
              <meshStandardMaterial
                color={isNight ? '#fef08a' : '#ffffff'}
                emissive={isNight ? '#ca8a04' : '#000000'}
                emissiveIntensity={isNight ? 2.5 : 0}
                roughness={0.1}
                metalness={0.8}
              />
            </mesh>
            {/* Arched Gold Header Molding */}
            <mesh position={[0, 7.5, 0]}>
              <boxGeometry args={[0.25, 1.0, 7.2]} />
              <meshStandardMaterial color="#fde047" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Roof Terrace Parapet with Traditional Temple Chhatri / Jharokha Balustrades */}
        <group position={[-17.3, 32.5, 0]}>
          {/* Balustrade ledge */}
          <mesh>
            <boxGeometry args={[0.6, 1.2, 45]} />
            <meshStandardMaterial color="#7f1d1d" />
          </mesh>
          {/* Ornamental decorative finials / mini chhatris */}
          {[-20, -10, 0, 10, 20].map((zPos, idx) => (
            <mesh key={idx} position={[0, 1.2, zPos]}>
              <coneGeometry args={[0.6, 1.4, 8]} />
              <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* Grand Golden Entrance Portico with Classical Pillars */}
        <group position={[-20.5, 0, 0]}>
          {/* Portico Roof Canopy */}
          <mesh position={[0, 7.2, 0]} castShadow>
            <boxGeometry args={[6.5, 0.8, 22]} />
            <meshStandardMaterial color="#b45309" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Portico Classical Gold Pillars */}
          {[-9, -3, 3, 9].map((zPos, idx) => (
            <mesh key={idx} position={[-2.8, 3.4, zPos]} castShadow>
              <cylinderGeometry args={[0.35, 0.45, 6.8, 12]} />
              <meshStandardMaterial color="#facc15" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* ── GIANT ILLUMINATED NEON SIGNBOARD: "KALAMANDIR" ── */}
        <group position={[-17.6, 26, 0]}>
          {/* Signboard Backing Plate in Royal Maroon */}
          <mesh>
            <boxGeometry args={[0.2, 5.2, 34]} />
            <meshStandardMaterial color="#450a0a" roughness={0.4} />
          </mesh>
          {/* Glowing Golden "KALAMANDIR" Letters */}
          <mesh position={[-0.15, 0, 0]}>
            <boxGeometry args={[0.08, 3.6, 32]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#facc15"
              emissiveIntensity={isNight ? 5.0 : 1.8}
            />
          </mesh>
          {/* Peacock Emblem Disc */}
          <mesh position={[-0.25, 3.2, 0]}>
            <cylinderGeometry args={[1.6, 1.6, 0.1, 16]} />
            <meshStandardMaterial color="#ca8a04" emissive="#eab308" emissiveIntensity={isNight ? 3 : 1} />
          </mesh>
          {isNight && (
            <pointLight position={[-3.5, 0, 0]} intensity={32} distance={40} color="#fde047" />
          )}
        </group>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 4. NALLI SILKS & AMBARA COMMERCIAL SHOWROOM (Z = 158, X = 48)         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[48, 0, 160]} name="NalliSilksShowroom">
        <mesh position={[0, 10, 0]} castShadow receiveShadow>
          <boxGeometry args={[28, 20, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[-14.1, 6, 0]}>
          <boxGeometry args={[0.1, 10, 26]} />
          <meshStandardMaterial
            color={isNight ? '#fef08a' : '#ffffff'}
            emissive={isNight ? '#eab308' : '#000000'}
            emissiveIntensity={isNight ? 1.8 : 0}
            roughness={0.1}
          />
        </mesh>
        {/* Nalli Saree Signboard in Deep Crimson Red */}
        <mesh position={[-14.2, 16, 0]}>
          <boxGeometry args={[0.15, 2.2, 22]} />
          <meshStandardMaterial color="#881337" emissive="#be123c" emissiveIntensity={isNight ? 3.2 : 1.0} />
        </mesh>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 5. COMMERCIAL IT TECH PARK TOWERS (Setback East, X = 95)              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[95, 0, 110]} name="EastCommercialTechTowers">
        <mesh position={[0, 30, 0]} castShadow receiveShadow>
          <boxGeometry args={[42, 60, 48]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[-21.1, 30, 0]}>
          <boxGeometry args={[0.1, 56, 44]} />
          <meshStandardMaterial
            color={isNight ? '#93c5fd' : '#38bdf8'}
            emissive={isNight ? '#1d4ed8' : '#000000'}
            emissiveIntensity={isNight ? 1.6 : 0}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      </group>
    </group>
  );
};

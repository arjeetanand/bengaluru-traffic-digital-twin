import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BrandFactoryMall } from './BrandFactoryMall';
import { KalamandirPalace } from './KalamandirPalace';

interface EastCorridorBuildingsProps {
  isNight: boolean;
}

export const EastCorridorBuildings: React.FC<EastCorridorBuildingsProps> = ({ isNight }) => {
  // The source 4th Cross Road ribbon runs immediately east of this authored
  // row. Keep a narrow frontage setback instead of letting the showcase box
  // consume the source carriageway.
  const outletRowWidth = 22;
  const outletFrontX = -outletRowWidth / 2 - 0.2;

  // ── High-Resolution Canvas Brand Textures for Outlet Row & Nalli Silks ──
  const outletTextures = useMemo(() => {
    const makeTexture = (brand: string, subtitle: string, bg: string, textCol: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(canvas);

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 128);

      ctx.strokeStyle = textCol;
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 504, 120);

      ctx.fillStyle = textCol;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Impact", sans-serif';
      ctx.fillText(brand, 256, 48);

      if (subtitle) {
        ctx.font = '600 18px sans-serif';
        ctx.fillText(subtitle, 256, 92);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    return {
      nike: makeTexture('NIKE FACTORY STORE', 'FLAT 40% - 60% OFF', '#ea580c', '#ffffff'),
      adidas: makeTexture('ADIDAS OUTLET', 'ORIGINALS & PERFORMANCE', '#0f172a', '#ffffff'),
      puma: makeTexture('PUMA FACTORY OUTLET', 'FOREVER FASTER', '#b91c1c', '#ffffff'),
      reebok: makeTexture('REEBOK OUTLET', 'FITNESS & FOOTWEAR', '#1e3a8a', '#38bdf8'),
      nalli: makeTexture('ನಳ್ಳಿ ಸಿಲ್ಕ್ಸ್ NALLI SILK SAREE', 'ESTABLISHED 1928 • PURE HERITAGE SILKS', '#701a75', '#fde047')
    };
  }, []);

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
          <boxGeometry args={[outletRowWidth, 15, 88]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>

        {/* Display Glazing along Service Road (-X facing ORR) */}
        <mesh position={[outletFrontX, 4.0, 0]}>
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
        <group position={[outletFrontX, 11, -28]}>
          <mesh>
            <boxGeometry args={[0.2, 3.4, 18]} />
            <meshStandardMaterial color="#18181b" />
          </mesh>
          <mesh position={[-0.12, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[17.5, 3.1]} />
            <meshStandardMaterial
              map={outletTextures.nike}
              emissive="#ea580c"
              emissiveIntensity={isNight ? 2.5 : 0.6}
            />
          </mesh>
        </group>

        {/* Adidas Factory Outlet Section (z = -6) */}
        <group position={[outletFrontX, 11, -6]}>
          <mesh>
            <boxGeometry args={[0.2, 3.4, 18]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[-0.12, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[17.5, 3.1]} />
            <meshStandardMaterial
              map={outletTextures.adidas}
              emissive="#ffffff"
              emissiveIntensity={isNight ? 2.5 : 0.6}
            />
          </mesh>
        </group>

        {/* Puma Outlet Section (z = +16) */}
        <group position={[outletFrontX, 11, 16]}>
          <mesh>
            <boxGeometry args={[0.2, 3.4, 18]} />
            <meshStandardMaterial color="#b91c1c" />
          </mesh>
          <mesh position={[-0.12, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[17.5, 3.1]} />
            <meshStandardMaterial
              map={outletTextures.puma}
              emissive="#b91c1c"
              emissiveIntensity={isNight ? 2.5 : 0.6}
            />
          </mesh>
        </group>

        {/* Reebok & FirstCry Outlet Section (z = +36) */}
        <group position={[outletFrontX, 11, 36]}>
          <mesh>
            <boxGeometry args={[0.2, 3.4, 16]} />
            <meshStandardMaterial color="#1e3a8a" />
          </mesh>
          <mesh position={[-0.12, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[15.5, 3.1]} />
            <meshStandardMaterial
              map={outletTextures.reebok}
              emissive="#38bdf8"
              emissiveIntensity={isNight ? 2.5 : 0.6}
            />
          </mesh>
        </group>
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. BRAND FACTORY / KLM FASHION MALL (Vanshee Towers, Z = 58, X = 48)  */}
      {/* Hyper-Realistic 4-Storey Retail Mall with Fashion Displays & Signage  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* The source 1st Main Road ribbon runs along the west edge of this
          inspection parcel. Keep the camera/source target at [48, 58], while
          placing the authored display mass east of that road envelope. */}
      <group position={[52.5, 0, 58]} scale={[0.4, 1, 0.4]} name="BrandFactoryMallSourceFit">
        <BrandFactoryMall
          isNight={isNight}
          position={[0, 0, 0]}
          rotationY={-Math.PI / 2}
        />
      </group>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. KALAMANDIR PALATIAL WEDDING SILK PALACE (Real OSM: Z = 332.5, X = 46)*/}
      {/* Palatial South Indian Temple Facade with Ruby Silk Showrooms & Gold  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <KalamandirPalace
        isNight={isNight}
        position={[46, 0, 330.4]}
        rotationY={-Math.PI / 2 + 0.14}
      />

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 4. NALLI SILKS & HERITAGE SHOWROOM (source anchor X = 48.9, Z = 347.8) */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[48.9, 0, 347.8]} rotation={[0, 0.12, 0]} name="NalliSilksShowroom">
        {/* The compiled source footprint is offset from its named POI anchor;
            retain that anchor while keeping the modeled mass on the parcel. */}
        <group position={[1.2, 0, -1.4]}>
          <mesh position={[0, 10, 0]} castShadow receiveShadow>
            <boxGeometry args={[15, 20, 14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          <mesh position={[-7.6, 6, 0]}>
            <boxGeometry args={[0.1, 10, 12]} />
            <meshStandardMaterial
              color={isNight ? '#fef08a' : '#ffffff'}
              emissive={isNight ? '#ca8a04' : '#000000'}
              emissiveIntensity={isNight ? 1.8 : 0}
              roughness={0.1}
              metalness={0.7}
            />
          </mesh>
          {/* Nalli Saree Front Signboard */}
          <group position={[-7.7, 16, 0]}>
            <mesh>
              <boxGeometry args={[0.2, 4.0, 11.5]} />
              <meshStandardMaterial color="#4a044e" />
            </mesh>
            <mesh position={[-0.12, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[11.2, 3.7]} />
              <meshStandardMaterial
                map={outletTextures.nalli}
                emissive="#fde047"
                emissiveIntensity={isNight ? 3.0 : 0.8}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};

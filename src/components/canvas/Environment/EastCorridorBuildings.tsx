import React, { useMemo } from 'react';
import * as THREE from 'three';
import { BrandFactoryMall } from './BrandFactoryMall';
import { KalamandirPalace } from './KalamandirPalace';

interface EastCorridorBuildingsProps {
  isNight: boolean;
}

export const EastCorridorBuildings: React.FC<EastCorridorBuildingsProps> = ({ isNight }) => {
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
        <group position={[-14.2, 11, -6]}>
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
        <group position={[-14.2, 11, 16]}>
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
        <group position={[-14.2, 11, 36]}>
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
      <BrandFactoryMall
        isNight={isNight}
        position={[48, 0, 58]}
        rotationY={-Math.PI / 2}
      />

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 3. KALAMANDIR PALATIAL WEDDING SILK PALACE (Real OSM: Z = 332.5, X = 46)*/}
      {/* Palatial South Indian Temple Facade with Ruby Silk Showrooms & Gold  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <KalamandirPalace
        isNight={isNight}
        position={[46, 0, 332.5]}
        rotationY={-Math.PI / 2 - 0.2}
      />

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 4. NALLI SILKS & HERITAGE SHOWROOM (Real OSM: Z = 354, X = 49)        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <group position={[49, 0, 354]} name="NalliSilksShowroom">
        <mesh position={[0, 10, 0]} castShadow receiveShadow>
          <boxGeometry args={[28, 20, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[-14.1, 6, 0]}>
          <boxGeometry args={[0.1, 10, 26]} />
          <meshStandardMaterial
            color={isNight ? '#fef08a' : '#ffffff'}
            emissive={isNight ? '#ca8a04' : '#000000'}
            emissiveIntensity={isNight ? 1.8 : 0}
            roughness={0.1}
            metalness={0.7}
          />
        </mesh>
        {/* Nalli Saree Front Signboard */}
        <group position={[-14.2, 16, 0]}>
          <mesh>
            <boxGeometry args={[0.2, 4.0, 24]} />
            <meshStandardMaterial color="#4a044e" />
          </mesh>
          <mesh position={[-0.12, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[23.5, 3.7]} />
            <meshStandardMaterial
              map={outletTextures.nalli}
              emissive="#fde047"
              emissiveIntensity={isNight ? 3.0 : 0.8}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};

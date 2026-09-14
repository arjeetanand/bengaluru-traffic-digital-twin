import React, { useMemo } from 'react';
import * as THREE from 'three';

interface KalamandirPalaceProps {
  isNight: boolean;
  position?: [number, number, number];
  rotationY?: number;
}

/**
 * High-Fidelity 3D Digital Twin Model of Kalamandir Wedding Silks (Marathahalli)
 * Features:
 * - 5-Storey grand Indian wedding palace architecture with ruby maroon and golden filigree
 * - Grand double-height entrance portico with carved ornamental brass pillars and marble steps
 * - Multi-tier showcase windows with illuminated Kanjeevaram silk saree mannequins
 * - High-impact 3D illuminated signboard with Kannada & English: "ಕಲಾಮಂದಿರ KALAMANDIR"
 * - Traditional Indian architectural brackets, decorative cornices, and rooftop balustrade
 * - Golden architectural facade uplighting & chandelier illumination in night mode
 */
export const KalamandirPalace: React.FC<KalamandirPalaceProps> = ({
  isNight,
  position = [48, 0, 115],
  rotationY = -Math.PI / 2
}) => {
  const width = 38;
  const depth = 32;
  const height = 32;

  // ── High-Resolution Canvas Textures ──
  // 1. Kalamandir Grand Royal Facia Signboard Texture
  const royalSignTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Rich Imperial Maroon & Ruby background with subtle silk damask sheen
    const grad = ctx.createLinearGradient(0, 0, 0, 280);
    grad.addColorStop(0, '#500724');
    grad.addColorStop(0.5, '#881337');
    grad.addColorStop(1, '#4c0519');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 280);

    // Ornate Golden Triple-Line Border Trim
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 1004, 260);

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, 980, 236);

    // Traditional Indian temple ornamental motifs in corners
    drawOrnamentalCorner(ctx, 45, 45);
    drawOrnamentalCorner(ctx, 979, 45);
    drawOrnamentalCorner(ctx, 45, 235);
    drawOrnamentalCorner(ctx, 979, 235);

    // Central Brand Emblem / Kalash Crown Motif
    drawRoyalKalash(ctx, 512, 42);

    // Kannada Calligraphy: ಕಲಾಮಂದಿರ
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText('ಕಲಾಮಂದಿರ', 512, 105);

    // English Royal Typography: KALAMANDIR
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 68px "Times New Roman", Georgia, serif';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 18;
    ctx.fillText('KALAMANDIR', 512, 172);

    // Subtitle Category Ribbon
    ctx.fillStyle = '#fde047';
    ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.shadowBlur = 4;
    ctx.letterSpacing = '4px';
    ctx.fillText('WEDDING SILKS • KANCHEEPURAM • BRIDAL DESIGNER', 512, 230);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // 2. Silk Saree Showroom Display Texture (Glowing mannequins draped in colorful Kanjeevaram sarees)
  const sareeShowroomTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Showroom interior warm wall
    ctx.fillStyle = isNight ? '#1e1b18' : '#fdf4ff';
    ctx.fillRect(0, 0, 1024, 512);

    // 4 floors of silk showroom bays
    const floorH = 512 / 4;
    const sareeColors = [
      ['#b91c1c', '#d97706', '#15803d'], // Crimson Red, Pure Gold, Emerald Green
      ['#6b21a8', '#0284c7', '#c2410c'], // Royal Purple, Peacock Blue, Rust Orange
      ['#be185d', '#eab308', '#047857'], // Deep Rani Pink, Turmeric Yellow, Forest Green
      ['#991b1b', '#f59e0b', '#1e40af']  // Kanjeevaram Maroon, Antique Gold, Royal Sapphire
    ];

    for (let f = 0; f < 4; f++) {
      const y = f * floorH;

      // Wooden molding beam
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, y, 1024, 12);

      // Warm chandelier / showcase spotlights
      for (let x = 60; x < 1024; x += 110) {
        ctx.fillStyle = isNight ? '#fef08a' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y + 20, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Saree showcase niches with draped silk saree mannequins
      for (let s = 0; s < 3; s++) {
        const sx = s * (1024 / 3) + 35;
        const sw = (1024 / 3) - 70;
        const color = sareeColors[f][s];

        // Arch-shaped showcase niche
        ctx.fillStyle = isNight ? '#2e1065' : '#fbcfe8';
        ctx.beginPath();
        ctx.roundRect(sx, y + 28, sw, floorH - 40, [30, 30, 0, 0]);
        ctx.fill();

        // Golden ornamental arch border
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Mannequin wearing silk saree with gold zari border
        const mx = sx + sw / 2;
        // Head
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(mx, y + 55, 10, 0, Math.PI * 2);
        ctx.fill();

        // Draped Saree body (Pleats & Pallu)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(mx - 16, y + 68);
        ctx.lineTo(mx + 16, y + 68);
        ctx.lineTo(mx + 22, y + floorH - 16);
        ctx.lineTo(mx - 22, y + floorH - 16);
        ctx.closePath();
        ctx.fill();

        // Gold Zari Border across Pallu
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(mx - 18, y + 74);
        ctx.lineTo(mx + 18, y + 105);
        ctx.stroke();

        // Bottom Zari Border
        ctx.fillStyle = '#facc15';
        ctx.fillRect(mx - 21, y + floorH - 24, 42, 8);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [isNight]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} name="KalamandirWeddingSilksLandmark">
      {/* ── 1. PALATIAL STRUCTURAL BODY ── */}
      {/* Main Structural Mass in Royal Maroon */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#881337" roughness={0.65} metalness={0.25} />
      </mesh>

      {/* ── 2. ORNATE GOLDEN CORNICES & STONE PILASTERS ── */}
      {/* Corner Classical Indian Stone Columns (Cream & Gold) */}
      {[-width / 2 + 1.2, width / 2 - 1.2].map((cX, idx) => (
        <group key={`corner-col-${idx}`} position={[cX, height / 2, depth / 2 + 0.3]}>
          <mesh castShadow>
            <boxGeometry args={[2.4, height + 1.5, 2.4]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.7} />
          </mesh>
          {/* Gold Capital & Base Rings */}
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[3.0, 1.2, 3.0]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -height / 2 + 0.6, 0]}>
            <boxGeometry args={[3.0, 1.2, 3.0]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Floor-to-Floor Decorative Gold Cornice Bands */}
      {[1, 2, 3, 4].map((fIdx) => (
        <mesh
          key={`cornice-band-${fIdx}`}
          position={[0, fIdx * (height / 5) + 0.5, depth / 2 + 0.4]}
          castShadow
        >
          <boxGeometry args={[width - 3, 0.65, 0.6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}

      {/* ── 3. SILK SAREE SHOWROOM GRAND GLASS WINDOWS ── */}
      {/* Backlit Silk Saree Showroom Canvas */}
      <mesh position={[0, height / 2 + 0.5, depth / 2 + 0.15]}>
        <planeGeometry args={[width - 6, height - 9]} />
        <meshStandardMaterial
          map={sareeShowroomTexture}
          emissive={isNight ? '#fef08a' : '#ffffff'}
          emissiveIntensity={isNight ? 1.6 : 0.3}
          roughness={0.15}
        />
      </mesh>

      {/* Outer Clear Protective Glass with Reflection Sheen */}
      <mesh position={[0, height / 2 + 0.5, depth / 2 + 0.35]}>
        <planeGeometry args={[width - 6, height - 9]} />
        <meshStandardMaterial
          color="#fef9c3"
          transparent
          opacity={0.3}
          roughness={0.08}
          metalness={0.85}
        />
      </mesh>

      {/* Ornamental Indian Window Arches (Jharokha Motifs) */}
      {[-10, 0, 10].map((archX, idx) => (
        <group key={`arch-${idx}`} position={[archX, height / 2 + 0.5, depth / 2 + 0.45]}>
          <mesh>
            <boxGeometry args={[0.35, height - 9, 0.2]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── 4. GRAND ILLUMINATED 3D ROYAL SIGNBOARD: "KALAMANDIR" ── */}
      <group position={[0, height + 1.2, depth / 2 - 0.2]}>
        {/* Structural Roof Backing Box with Gold Trim */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[width * 0.9, 5.2, 0.8]} />
          <meshStandardMaterial color="#4c0519" roughness={0.4} />
        </mesh>
        {/* Gold Filigree Sign Frame */}
        <mesh position={[0, 1.8, 0.42]}>
          <boxGeometry args={[width * 0.88, 5.0, 0.1]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Illuminated High-Res Signboard Canvas */}
        <mesh position={[0, 1.8, 0.5]}>
          <planeGeometry args={[width * 0.86, 4.8]} />
          <meshStandardMaterial
            map={royalSignTexture}
            emissive="#fde047"
            emissiveIntensity={isNight ? 2.5 : 0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Golden Neon Underglow Spotlight Strip */}
        <mesh position={[0, -0.8, 0.55]}>
          <boxGeometry args={[width * 0.85, 0.18, 0.15]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={isNight ? 4.5 : 1.2}
          />
        </mesh>
      </group>

      {/* ── 5. GRAND DOUBLE-HEIGHT ENTRANCE PORTICO & MARBLE STEPS ── */}
      <group position={[0, 0, depth / 2]}>
        {/* Multi-Tiered Polished White Marble Steps */}
        <mesh position={[0, 0.15, 3.5]} receiveShadow>
          <boxGeometry args={[width * 0.7, 0.3, 7.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.45, 2.5]} receiveShadow>
          <boxGeometry args={[width * 0.6, 0.3, 5.0]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.75, 1.5]} receiveShadow>
          <boxGeometry args={[width * 0.5, 0.3, 3.0]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
        </mesh>

        {/* Grand Cantilevered Portico Roof Slab */}
        <mesh position={[0, 6.2, 2.8]} castShadow>
          <boxGeometry args={[20, 0.8, 6.5]} />
          <meshStandardMaterial color="#881337" roughness={0.5} />
        </mesh>
        {/* Gold Fascia Edge on Portico Roof */}
        <mesh position={[0, 6.2, 6.1]}>
          <boxGeometry args={[20.2, 0.6, 0.15]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Grand Carved Brass/Gold Columns Supporting Portico */}
        {[-8, -3, 3, 8].map((colX, idx) => (
          <group key={`portico-col-${idx}`} position={[colX, 3.1, 5.4]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.35, 0.45, 6.2, 16]} />
              <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Ornamental Rings */}
            <mesh position={[0, 2.6, 0]}>
              <cylinderGeometry args={[0.55, 0.45, 0.4, 16]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
            </mesh>
            <mesh position={[0, -2.6, 0]}>
              <cylinderGeometry args={[0.55, 0.55, 0.4, 16]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
            </mesh>
          </group>
        ))}

        {/* Traditional Hanging Brass Lamps (Deepams) with Warm Glow */}
        {[-5.5, 0, 5.5].map((lampX, idx) => (
          <group key={`deepam-${idx}`} position={[lampX, 5.6, 2.8]}>
            <mesh>
              <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[0, -0.5, 0]}>
              <sphereGeometry args={[0.22, 10, 10]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={isNight ? 4.0 : 0.8}
              />
            </mesh>
            {isNight && (
              <pointLight position={[0, -0.6, 0]} intensity={16} distance={10} color="#fef08a" />
            )}
          </group>
        ))}

        {/* Grand Glass Main Entrance Double Doors with Gold Pull Handles */}
        <mesh position={[0, 2.6, 0.1]}>
          <boxGeometry args={[14, 5.2, 0.15]} />
          <meshStandardMaterial
            color="#fef3c7"
            transparent
            opacity={0.45}
            roughness={0.1}
            metalness={0.85}
          />
        </mesh>
        {/* Brass door frames */}
        {[-7, -3.5, 0, 3.5, 7].map((dX, idx) => (
          <mesh key={`door-frame-${idx}`} position={[dX, 2.6, 0.15]}>
            <boxGeometry args={[0.15, 5.2, 0.2]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ── 6. PALACE ROOFTOP ARCHITECTURE & CORNICE PARAPET ── */}
      <group position={[0, height, 0]}>
        {/* Traditional Ornamental Balustrade with Mini Arches */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[width + 0.6, 1.5, depth + 0.6]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.7} />
        </mesh>
        {/* Corner Decorative Finial Urns */}
        {[
          [-width / 2 + 1, depth / 2 - 1],
          [width / 2 - 1, depth / 2 - 1],
          [-width / 2 + 1, -depth / 2 + 1],
          [width / 2 - 1, -depth / 2 + 1]
        ].map(([ux, uz], idx) => (
          <mesh key={`urn-${idx}`} position={[ux, 2.0, uz]} castShadow>
            <cylinderGeometry args={[0.6, 0.3, 1.2, 12]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}

        {/* Central Palace Crown Pediment */}
        <mesh position={[0, 2.5, depth / 2]} castShadow>
          <boxGeometry args={[16, 2.4, 1.2]} />
          <meshStandardMaterial color="#881337" roughness={0.6} />
        </mesh>
        <mesh position={[0, 3.8, depth / 2]}>
          <cylinderGeometry args={[0.1, 8.2, 1.8, 3]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.85} />
        </mesh>

        {/* HVAC units & water storage */}
        <mesh position={[width * 0.22, 1.5, -depth * 0.18]} castShadow>
          <boxGeometry args={[8, 2.4, 6]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
        <mesh position={[-width * 0.22, 1.8, -depth * 0.2]} castShadow>
          <cylinderGeometry args={[1.6, 1.6, 2.6, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>

        {/* Night Facade Uplights */}
        {isNight && (
          <>
            <pointLight position={[0, 7.5, depth / 2 + 3]} intensity={25} distance={28} color="#fbbf24" />
            <pointLight position={[-12, 4.0, depth / 2 + 2]} intensity={18} distance={20} color="#f59e0b" />
            <pointLight position={[12, 4.0, depth / 2 + 2]} intensity={18} distance={20} color="#f59e0b" />
          </>
        )}
      </group>
    </group>
  );
};

// Helper: draw ornamental corner motif
function drawOrnamentalCorner(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Helper: draw royal Indian Kalash emblem
function drawRoyalKalash(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = '#fbbf24';
  // Kalash pot
  ctx.beginPath();
  ctx.arc(cx, cy + 4, 12, 0, Math.PI);
  ctx.fill();
  // Coconut top
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 8, 0, Math.PI * 2);
  ctx.fill();
  // Mango leaves
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy - 2, 8, 4, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 10, cy - 2, 8, 4, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

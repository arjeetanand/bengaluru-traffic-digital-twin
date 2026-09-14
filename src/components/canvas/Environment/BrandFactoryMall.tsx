import React, { useMemo } from 'react';
import * as THREE from 'three';

interface BrandFactoryMallProps {
  isNight: boolean;
  position?: [number, number, number];
  rotationY?: number;
}

/**
 * High-Fidelity 3D Digital Twin Model of Brand Factory (Marathahalli Mall)
 * Features:
 * - 4-Storey modern retail architecture with signature red composite-aluminum cladding
 * - Multi-tier floor-to-floor glass curtain wall with interior showroom depth
 * - Backlit fashion brand display lightboxes (Nike, Adidas, Levi's, Puma)
 * - 3D Channel Letter Signboard: "BRAND FACTORY" + "FLAT 20% - 70% OFF"
 * - Entrance canopy with recessed warm downlights, sliding glass doors, and paved shopping plaza
 * - Industrial rooftop HVAC chillers, water tanks, elevator tower, and rooftop advertising billboard
 */
export const BrandFactoryMall: React.FC<BrandFactoryMallProps> = ({
  isNight,
  position = [48, 0, 58],
  rotationY = -Math.PI / 2
}) => {
  const width = 42;
  const depth = 30;
  const height = 28;

  // ── High-Resolution Canvas Textures ──
  // 1. Brand Factory Main Facia Signboard Texture
  const mainSignTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep Brand Factory Red background with acrylic gloss gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(0.5, '#b91c1c');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 256);

    // White border outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 1004, 236);

    // Inner yellow accent strip
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(22, 22, 980, 212);

    // Main BRAND FACTORY text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 82px -apple-system, BlinkMacSystemFont, "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.fillText('BRAND FACTORY', 512, 90);

    // Subtitle discount banner tag
    ctx.fillStyle = '#facc15';
    ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.shadowBlur = 6;
    ctx.fillText('FLAT 20% TO 70% OFF ON 200+ BRANDS', 512, 175);

    // Corner star burst badges
    drawStar(ctx, 60, 60, 5, 20, 10, '#facc15');
    drawStar(ctx, 964, 60, 5, 20, 10, '#facc15');

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // 2. Interior Showroom Fashion Display Texture (Fashion mannequins, store racks, brand logos)
  const showroomDisplayTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Multi-floor retail interior view
    ctx.fillStyle = isNight ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, 1024, 512);

    // Floor separators (3 floors of glass display)
    const floorH = 512 / 3;
    const brands = ['LEVI\'S', 'NIKE', 'PUMA', 'ADIDAS', 'US POLO', 'ALLEN SOLLY', 'FLYING MACHINE', 'VAN HEUSEN', 'WRANGLER'];

    for (let f = 0; f < 3; f++) {
      const y = f * floorH;
      // Floor ceiling slab
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, y, 1024, 16);

      // Warm interior retail track lighting spots
      for (let x = 40; x < 1024; x += 80) {
        ctx.fillStyle = isNight ? '#fef08a' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y + 26, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Brand display bays
      for (let b = 0; b < 3; b++) {
        const bx = b * (1024 / 3) + 20;
        const bw = (1024 / 3) - 40;
        const brandIndex = f * 3 + b;

        // Lightbox poster background
        ctx.fillStyle = isNight ? '#1e293b' : '#e2e8f0';
        ctx.fillRect(bx, y + 40, bw, floorH - 60);

        // Brand logo banner
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(bx, y + 45, bw, 36);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(brands[brandIndex % brands.length], bx + bw / 2, y + 68);

        // Mannequin silhouettes
        ctx.fillStyle = isNight ? '#fbbf24' : '#475569';
        // Head & torso
        ctx.beginPath();
        ctx.arc(bx + bw / 2, y + 105, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(bx + bw / 2 - 14, y + 120, 28, 40);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [isNight]);

  return (
    <group position={position} rotation={[0, rotationY, 0]} name="BrandFactoryMallLandmark">
      {/* ── 1. MAIN STRUCTURAL BUILDING BODY ── */}
      {/* Concrete & dark composite body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#1f2937" roughness={0.75} metalness={0.2} />
      </mesh>

      {/* ── 2. SIGNATURE RED COMPOSITE-ALUMINUM CLADDING BANDS ── */}
      {/* Left Cladding Tower */}
      <mesh position={[-width / 2 + 3, height / 2, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[6, height + 1.2, depth + 0.8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Right Cladding Tower */}
      <mesh position={[width / 2 - 3, height / 2, 0.4]} castShadow receiveShadow>
        <boxGeometry args={[6, height + 1.2, depth + 0.8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Top Fascia Horizontal Red Girder */}
      <mesh position={[0, height - 1.5, depth / 2 + 0.4]} castShadow>
        <boxGeometry args={[width - 12, 3.2, 0.8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} metalness={0.4} />
      </mesh>

      {/* ── 3. MULTI-STOREY FRONT GLASS CURTAIN WALL & SHOWROOM DISPLAY ── */}
      {/* Interior backlit showroom image plane */}
      <mesh position={[0, height / 2 - 1.5, depth / 2 + 0.15]}>
        <planeGeometry args={[width - 14, height - 8]} />
        <meshStandardMaterial
          map={showroomDisplayTexture}
          emissive={isNight ? '#ffffff' : '#f8fafc'}
          emissiveIntensity={isNight ? 1.4 : 0.25}
          roughness={0.2}
        />
      </mesh>

      {/* Exterior Tinted Architectural Glass with Reflection Sheen */}
      <mesh position={[0, height / 2 - 1.5, depth / 2 + 0.35]}>
        <planeGeometry args={[width - 14, height - 8]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent
          opacity={0.35}
          roughness={0.08}
          metalness={0.9}
        />
      </mesh>

      {/* Glass Mullions (Floor Dividers & Vertical Spandrel Bars) */}
      {[1, 2, 3].map((floorIdx) => (
        <mesh
          key={`floor-beam-${floorIdx}`}
          position={[0, floorIdx * (height / 4) + 1.5, depth / 2 + 0.45]}
        >
          <boxGeometry args={[width - 13.6, 0.45, 0.3]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {[-10, -5, 0, 5, 10].map((vX, vIdx) => (
        <mesh
          key={`vert-mullion-${vIdx}`}
          position={[vX, height / 2 - 1.5, depth / 2 + 0.45]}
        >
          <boxGeometry args={[0.3, height - 8, 0.25]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* ── 4. GLOWING 3D ARCHITECTURAL SIGNBOARD: "BRAND FACTORY" ── */}
      <group position={[0, height + 0.8, depth / 2 - 0.2]}>
        {/* Metal Sub-Frame Truss Supports */}
        {[-14, -7, 0, 7, 14].map((tX, idx) => (
          <mesh key={`truss-${idx}`} position={[tX, 1.2, -1.2]}>
            <boxGeometry args={[0.2, 4.2, 2.4]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}

        {/* Heavy Backing Box */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[width * 0.85, 4.6, 0.6]} />
          <meshStandardMaterial color="#991b1b" roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Illuminated High-Res Signboard Canvas */}
        <mesh position={[0, 1.5, 0.35]}>
          <planeGeometry args={[width * 0.83, 4.3]} />
          <meshStandardMaterial
            map={mainSignTexture}
            emissive="#ffffff"
            emissiveIntensity={isNight ? 2.8 : 0.7}
            roughness={0.15}
          />
        </mesh>

        {/* Neon Perimeter Halo Light Strip */}
        <mesh position={[0, -0.85, 0.4]}>
          <boxGeometry args={[width * 0.84, 0.15, 0.15]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={isNight ? 4.0 : 1.0}
          />
        </mesh>
      </group>

      {/* ── 5. GROUND FLOOR ENTRANCE LOBBY & SHOPPING PLAZA ── */}
      <group position={[0, 0, depth / 2]}>
        {/* Paved Front Promenade Apron */}
        <mesh position={[0, 0.1, 4]} receiveShadow>
          <planeGeometry args={[width + 4, 8]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </mesh>

        {/* Cantilevered Entrance Canopy */}
        <mesh position={[0, 4.8, 2.5]} castShadow>
          <boxGeometry args={[18, 0.4, 5.5]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.3} metalness={0.4} />
        </mesh>

        {/* Canopy Hanging Brand Emblem: "ENTRANCE" */}
        <mesh position={[0, 4.4, 5.1]}>
          <boxGeometry args={[10, 0.6, 0.1]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#facc15"
            emissiveIntensity={isNight ? 3.0 : 0.8}
          />
        </mesh>

        {/* Canopy Downlight Fixtures */}
        {[-6, -2, 2, 6].map((cX, idx) => (
          <group key={`downlight-${idx}`} position={[cX, 4.6, 2.5]}>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 0.1, 12]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={isNight ? 3 : 0.5} />
            </mesh>
            {isNight && (
              <pointLight position={[0, -0.4, 0]} intensity={12} distance={8} color="#fef08a" />
            )}
          </group>
        ))}

        {/* Grand Automatic Sliding Glass Doors */}
        <mesh position={[0, 2.2, 0.1]}>
          <boxGeometry args={[12, 4.2, 0.15]} />
          <meshStandardMaterial
            color="#e0f2fe"
            transparent
            opacity={0.5}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
        <mesh position={[0, 2.2, 0.12]}>
          <boxGeometry args={[0.15, 4.2, 0.2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Entrance Stainless Steel Security Bollards */}
        {[-12, -9, -6, 6, 9, 12].map((bX, idx) => (
          <mesh key={`bollard-${idx}`} position={[bX, 0.5, 7.5]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 1.0, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* ── 6. ROOFTOP INDUSTRIAL INFRASTRUCTURE ── */}
      <group position={[0, height, 0]}>
        {/* Parapet safety wall */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[width + 0.4, 1.2, depth + 0.4]} />
          <meshStandardMaterial color="#374151" roughness={0.8} />
        </mesh>

        {/* HVAC Mechanical Cooling Chillers */}
        <mesh position={[-width * 0.22, 1.6, -depth * 0.2]} castShadow>
          <boxGeometry args={[10, 2.4, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-width * 0.22, 1.6, depth * 0.15]} castShadow>
          <boxGeometry args={[8, 2.2, 5]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Rooftop Central Lift Motor Room & Stair Penthouse */}
        <mesh position={[0, 2.4, -depth * 0.1]} castShadow>
          <boxGeometry args={[12, 4.2, 8]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>

        {/* Overhead Heavy Water Storage Tanks (Sintex Black Tanks) */}
        {[-3, 0, 3].map((tX, idx) => (
          <mesh key={`tank-${idx}`} position={[tX, 4.9, -depth * 0.1]} castShadow>
            <cylinderGeometry args={[1.2, 1.2, 2.2, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
        ))}

        {/* Telecommunication Cellular Tower Mast */}
        <mesh position={[width * 0.32, 5.5, depth * 0.25]}>
          <cylinderGeometry args={[0.12, 0.25, 11, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Red Flashing Aviation Obstruction Light */}
        <mesh position={[width * 0.32, 11.2, depth * 0.25]}>
          <sphereGeometry args={[0.35, 8, 8]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={isNight ? 4.0 : 1.5}
          />
        </mesh>
      </group>
    </group>
  );
};

// Helper: draw decorative star for signboards
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  color: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

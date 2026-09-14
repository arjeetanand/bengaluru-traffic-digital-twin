import * as THREE from 'three';

// Cache generated textures so we don't recreate canvases repeatedly
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a high-resolution photographic storefront banner texture for landmarks
 * (e.g., Kalamandir, Nalli Silks, Brand Factory, Tanishq, Kalyan Jewellers)
 */
export function createLandmarkBannerTexture(
  bannerTitle: string,
  bannerSubtitle: string,
  brandColor: string,
  isNight: boolean
): THREE.CanvasTexture {
  const cacheKey = `banner_${bannerTitle}_${isNight ? 'night' : 'day'}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    return fallback;
  }

  // Base Signboard Background with realistic metallic/acrylic finish
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, adjustColorBrightness(brandColor, 0.85));
  grad.addColorStop(0.5, brandColor);
  grad.addColorStop(1, adjustColorBrightness(brandColor, -0.25));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 256);

  // Outer Golden/Chrome Border Trim
  ctx.strokeStyle = isNight ? '#fbbf24' : '#e2e8f0';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 1012, 244);

  // Inner Accent Frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 988, 220);

  // Subtle commercial grid/paneling texture
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.lineWidth = 2;
  for (let x = 128; x < 1024; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, 236);
    ctx.stroke();
  }

  // Main Landmark Brand Name
  ctx.fillStyle = isNight ? '#ffffff' : '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
  ctx.shadowColor = isNight ? '#fbbf24' : 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = isNight ? 18 : 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillText(bannerTitle, 512, 95);

  // Reset shadow for subtitle
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Subtitle / Product categories
  if (bannerSubtitle) {
    ctx.fillStyle = isNight ? '#fde047' : '#e2e8f0';
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(bannerSubtitle, 512, 175);
  }

  // Corner decorative brand emblems
  drawCornerEmblem(ctx, 40, 40);
  drawCornerEmblem(ctx, 984, 40);
  drawCornerEmblem(ctx, 40, 216);
  drawCornerEmblem(ctx, 984, 216);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates high-detail procedural glass curtain wall facade texture
 * with day reflections and night illuminated office windows.
 */
export function createGlassCurtainTexture(isNight: boolean): THREE.CanvasTexture {
  const cacheKey = `curtain_wall_${isNight ? 'night' : 'day'}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Base background (dark structural spandrel)
  ctx.fillStyle = isNight ? '#0b1120' : '#1e293b';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 8;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      // Mullion margin
      const marginX = 4;
      const marginY = 5;

      // Window glass tint
      if (isNight) {
        // Pseudo-random office lighting at night
        const seed = (r * 17 + c * 31) % 100;
        if (seed > 45) {
          // Warm interior light
          ctx.fillStyle = seed > 75 ? '#fef08a' : '#93c5fd';
          ctx.fillRect(x + marginX, y + marginY, cellW - marginX * 2, cellH - marginY * 2);
          // Interior blinds/mullion detail
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.fillRect(x + marginX, y + marginY + 4, cellW - marginX * 2, 3);
        } else {
          // Dark unlit office window
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(x + marginX, y + marginY, cellW - marginX * 2, cellH - marginY * 2);
        }
      } else {
        // Day architectural tinted glass reflection gradient
        const glassGrad = ctx.createLinearGradient(x, y, x, y + cellH);
        glassGrad.addColorStop(0, '#38bdf8');
        glassGrad.addColorStop(0.3, '#0284c7');
        glassGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = glassGrad;
        ctx.fillRect(x + marginX, y + marginY, cellW - marginX * 2, cellH - marginY * 2);

        // Glass reflection sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.beginPath();
        ctx.moveTo(x + marginX, y + marginY);
        ctx.lineTo(x + marginX + 15, y + marginY);
        ctx.lineTo(x + cellW - marginX, y + cellH - marginY);
        ctx.lineTo(x + cellW - marginX - 15, y + cellH - marginY);
        ctx.closePath();
        ctx.fill();
      }

      // Aluminum mullion frame lines
      ctx.strokeStyle = isNight ? '#1e293b' : '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + marginX, y + marginY, cellW - marginX * 2, cellH - marginY * 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates retail / commercial grid facade texture with street-level display glass
 */
export function createCommercialGridTexture(isNight: boolean): THREE.CanvasTexture {
  const cacheKey = `commercial_grid_${isNight ? 'night' : 'day'}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Stucco / concrete wall base
  ctx.fillStyle = isNight ? '#18181b' : '#334155';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 6;
  const rows = 6;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      if (r === rows - 1) {
        // Ground floor commercial showroom glass
        ctx.fillStyle = isNight ? '#fbbf24' : '#67e8f9';
        ctx.fillRect(x + 3, y + 2, cellW - 6, cellH - 4);
      } else {
        // Commercial windows
        const isLit = (r * 13 + c * 23) % 10 > 3;
        ctx.fillStyle = isNight ? (isLit ? '#fef08a' : '#09090b') : '#38bdf8';
        ctx.fillRect(x + 6, y + 6, cellW - 12, cellH - 12);

        // Window frame
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 6, y + 6, cellW - 12, cellH - 12);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Creates residential apartment texture with balconies and warm interior lights
 */
export function createResidentialApartmentTexture(isNight: boolean): THREE.CanvasTexture {
  const cacheKey = `residential_balcony_${isNight ? 'night' : 'day'}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Modern apartment beige/slate wall
  ctx.fillStyle = isNight ? '#1c1917' : '#475569';
  ctx.fillRect(0, 0, 512, 512);

  const cols = 4;
  const rows = 8;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW;
      const y = r * cellH;

      // Balcony opening
      const isLit = (r * 11 + c * 29) % 10 > 4;
      ctx.fillStyle = isNight ? (isLit ? '#fef3c7' : '#0c0a09') : '#0284c7';
      ctx.fillRect(x + 10, y + 4, cellW - 20, cellH - 12);

      // Balcony railing bars
      ctx.fillStyle = '#78716c';
      ctx.fillRect(x + 8, y + cellH - 14, cellW - 16, 10);
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1.5;
      for (let bx = x + 12; bx < x + cellW - 12; bx += 8) {
        ctx.beginPath();
        ctx.moveTo(bx, y + cellH - 14);
        ctx.lineTo(bx, y + cellH - 4);
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  textureCache.set(cacheKey, texture);
  return texture;
}

// Helpers
function adjustColorBrightness(hex: string, factor: number): string {
  try {
    const c = new THREE.Color(hex);
    if (factor > 0) {
      c.lerp(new THREE.Color('#ffffff'), factor);
    } else {
      c.lerp(new THREE.Color('#000000'), -factor);
    }
    return `#${c.getHexString()}`;
  } catch {
    return hex;
  }
}

function drawCornerEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

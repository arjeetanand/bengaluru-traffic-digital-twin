export type SketchfabAssetCategory = 'signal' | 'vehicle' | 'transit';

export interface SketchfabAssetLicense {
  label: 'CC BY 4.0' | 'CC BY-SA 4.0';
  name: 'Creative Commons Attribution' | 'Creative Commons Attribution-ShareAlike';
  url: string;
}

export interface SketchfabAsset {
  id: string;
  uid: string;
  name: string;
  category: SketchfabAssetCategory;
  categoryLabel: string;
  description: string;
  usageNote: string;
  creator: string;
  license: SketchfabAssetLicense;
  sketchfabUrl: string;
  embedUrl: string;
}

/**
 * A deliberately small, attributed reference set for the 3D twin asset drawer.
 * These models are presentation references and are not survey-accurate corridor
 * geometry or proof of a landmark's exact Marathahalli location.
 */
export const SKETCHFAB_ASSETS: readonly SketchfabAsset[] = [
  {
    id: 'traffic-light-semaforo',
    uid: '3de9ce21f53945aaaab80e491e563ea3',
    name: 'Traffic light / Semaforo',
    category: 'signal',
    categoryLabel: 'SIGNAL HARDWARE',
    description: 'A compact street-furniture reference for signal storytelling at junction scale.',
    usageNote: 'Presentation reference · not survey geometry',
    creator: 'Adrian Flores',
    license: {
      label: 'CC BY 4.0',
      name: 'Creative Commons Attribution',
      url: 'https://creativecommons.org/licenses/by/4.0/'
    },
    sketchfabUrl: 'https://sketchfab.com/3d-models/traffic-light-semaforo-3de9ce21f53945aaaab80e491e563ea3',
    embedUrl: 'https://sketchfab.com/models/3de9ce21f53945aaaab80e491e563ea3/embed?autostart=1&camera=0&preload=1&ui_theme=dark&dnt=1&ui_hint=2'
  },
  {
    id: 'indian-auto-rickshaw',
    uid: '9075b08e08b149f099f601c3a239cfa1',
    name: 'Indian Auto Rickshaw',
    category: 'vehicle',
    categoryLabel: 'STREET FLEET',
    description: 'A recognizable three-wheeler reference for mixed-traffic scene composition.',
    usageNote: 'Fleet visual reference · placement remains modelled',
    creator: 'Doron Altaratz',
    license: {
      label: 'CC BY 4.0',
      name: 'Creative Commons Attribution',
      url: 'https://creativecommons.org/licenses/by/4.0/'
    },
    sketchfabUrl: 'https://sketchfab.com/3d-models/indian-auto-rickshaw-ahmedabad-gujarat-india-9075b08e08b149f099f601c3a239cfa1',
    embedUrl: 'https://sketchfab.com/models/9075b08e08b149f099f601c3a239cfa1/embed?autostart=1&camera=0&preload=1&ui_theme=dark&dnt=1&ui_hint=2'
  },
  {
    id: 'indian-bus',
    uid: '67b7998f0f3341a8a96655f96adc1a77',
    name: 'Indian Bus',
    category: 'vehicle',
    categoryLabel: 'STREET FLEET',
    description: 'A transit-fleet reference for corridor scale, lane occupancy, and route context.',
    usageNote: 'Fleet visual reference · placement remains modelled',
    creator: 'Parth',
    license: {
      label: 'CC BY 4.0',
      name: 'Creative Commons Attribution',
      url: 'https://creativecommons.org/licenses/by/4.0/'
    },
    sketchfabUrl: 'https://sketchfab.com/3d-models/indian-bus-67b7998f0f3341a8a96655f96adc1a77',
    embedUrl: 'https://sketchfab.com/models/67b7998f0f3341a8a96655f96adc1a77/embed?autostart=1&camera=0&preload=1&ui_theme=dark&dnt=1&ui_hint=2'
  },
  {
    id: 'elevated-mumbai-metro-station',
    uid: 'e1161f1d47d842e897624e13332ea63a',
    name: 'Elevated Mumbai Metro Station',
    category: 'transit',
    categoryLabel: 'TRANSIT REFERENCE',
    description: 'An elevated-station reference for India-specific transit form and visual hierarchy.',
    usageNote: 'INDIA REFERENCE · NOT MARATHAHALLI GROUND TRUTH',
    creator: 'NachiTheBlenderer',
    license: {
      label: 'CC BY-SA 4.0',
      name: 'Creative Commons Attribution-ShareAlike',
      url: 'https://creativecommons.org/licenses/by-sa/4.0/'
    },
    sketchfabUrl: 'https://sketchfab.com/3d-models/elevated-mumbai-metro-station-e1161f1d47d842e897624e13332ea63a',
    embedUrl: 'https://sketchfab.com/models/e1161f1d47d842e897624e13332ea63a/embed?autostart=1&camera=0&preload=1&ui_theme=dark&dnt=1&ui_hint=2'
  }
];

export const SKETCHFAB_ASSET_REGISTRY = SKETCHFAB_ASSETS;

export function getSketchfabAsset(assetId: string | undefined): SketchfabAsset | undefined {
  return SKETCHFAB_ASSETS.find((asset) => asset.id === assetId);
}

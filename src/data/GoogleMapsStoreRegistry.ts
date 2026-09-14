import { ACTIVE_COORDINATES } from '../config/location';

export interface GoogleMapsStore {
  id: string;
  name: string;
  kannadaName: string;
  category: 'cinema' | 'silks' | 'jewellery' | 'electronics' | 'apparel' | 'dining' | 'transit';
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  address: string;
  phone?: string;
  dimensions: {
    width: number;
    depth: number;
    height: number;
    levels: number;
  };
  brandColor: string;
  accentColor: string;
  bannerSubtitle: string;
}

/**
 * Converts real WGS84 GPS (latitude, longitude) into 3D world coordinates (X, Y, Z).
 * Centered on Marathahalli Signal Junction (12.956840, 77.701176).
 */
export function gpsTo3D(lat: number, lng: number, y = 0): [number, number, number] {
  const METERS_PER_DEGREE_LAT = 110590;
  const METERS_PER_DEGREE_LNG = 108485;
  const x = (lng - ACTIVE_COORDINATES.lng) * METERS_PER_DEGREE_LNG;
  const z = (lat - ACTIVE_COORDINATES.lat) * METERS_PER_DEGREE_LAT;
  return [Math.round(x * 10) / 10, y, Math.round(z * 10) / 10];
}

/**
 * Prominent commercial POIs in the Marathahalli corridor. Coordinates are a
 * reviewable catalogue layer and must be reconciled against the OSM snapshot
 * or a fresh provider export before being treated as survey-grade anchors.
 */
export const GOOGLE_MAPS_PROMINENT_STORES: GoogleMapsStore[] = [
  {
    id: 'kalamandir',
    name: 'Kalamandir Wedding Silks',
    kannadaName: 'ಕಲಾಮಂದಿರ',
    category: 'silks',
    lat: 12.9599557,
    lng: 77.7011929,
    rating: 4.0,
    reviewCount: 17556,
    address: 'Ward No. 85, 1/24, Outer Ring Rd, Anand Nagar, Marathahalli, Bengaluru 560037',
    phone: '091489 46060',
    dimensions: { width: 38, depth: 32, height: 32, levels: 5 },
    brandColor: '#881337',
    accentColor: '#facc15',
    bannerSubtitle: 'WEDDING SILKS & KANCHEEPURAM SAREES'
  },
  {
    id: 'nalli_silks',
    name: 'Nalli Silk Saree',
    kannadaName: 'ನಳ್ಳಿ ಸಿಲ್ಕ್ಸ್',
    category: 'silks',
    lat: 12.959980,
    lng: 77.701627,
    rating: 4.3,
    reviewCount: 4210,
    address: 'Outer Ring Rd, Next to Kalamandir, Anand Nagar, Marathahalli, Bengaluru 560037',
    dimensions: { width: 28, depth: 22, height: 20, levels: 4 },
    brandColor: '#701a75',
    accentColor: '#fde047',
    bannerSubtitle: 'ESTABLISHED 1928 • PURE HERITAGE SILKS'
  },
  {
    id: 'krishna_summit',
    name: 'Krishna Summit Tech Center',
    kannadaName: 'ಕೃಷ್ಣ ಸಮ್ಮಿಟ್',
    category: 'apparel',
    lat: 12.957828,
    lng: 77.700830,
    rating: 4.4,
    reviewCount: 2890,
    address: '73, Outer Ring Rd, Marathahalli Village, Bengaluru 560037',
    dimensions: { width: 32, depth: 36, height: 36, levels: 7 },
    brandColor: '#0284c7',
    accentColor: '#38bdf8',
    bannerSubtitle: 'COMMERCIAL TECH PARK & BANQUET HALL'
  },
  {
    id: 'krishna_grand',
    name: 'The Krishna Grand',
    kannadaName: 'ದಿ ಕೃಷ್ಣ ಗ್ರಾಂಡ್',
    category: 'dining',
    lat: 12.958076,
    lng: 77.700856,
    rating: 4.2,
    reviewCount: 8430,
    address: 'Outer Ring Rd, opp. KLM Fashion Mall, Marathahalli, Bengaluru 560037',
    phone: '080 4965 2424',
    dimensions: { width: 28, depth: 24, height: 22, levels: 4 },
    brandColor: '#15803d',
    accentColor: '#facc15',
    bannerSubtitle: 'PURE VEG RESTAURANT & RESIDENCY'
  },
  {
    id: 'tanishq_hal',
    name: 'Tanishq Jewellery',
    kannadaName: 'ತನಿಷ್ಕ್ ಜ್ಯುವೆಲ್ಲರಿ',
    category: 'jewellery',
    lat: 12.956776,
    lng: 77.700529,
    rating: 4.6,
    reviewCount: 5189,
    address: 'Old Airport Rd, Marathahalli Junction Corner, Bengaluru 560037',
    phone: '096066 17775',
    dimensions: { width: 26, depth: 20, height: 18, levels: 3 },
    brandColor: '#1e3a5f',
    accentColor: '#f59e0b',
    bannerSubtitle: 'A TATA PRODUCT • EXQUISITE GOLD & DIAMONDS'
  },
  {
    id: 'max_fashion',
    name: 'Max Fashion',
    kannadaName: 'ಮ್ಯಾಕ್ಸ್ ಫ್ಯಾಷನ್',
    category: 'apparel',
    lat: 12.956858,
    lng: 77.6997261,
    rating: 3.8,
    reviewCount: 7895,
    address: 'RPR Plaza, Varthur Main Rd, Marathahalli, Bengaluru 560037',
    phone: '082210 79543',
    dimensions: { width: 28, depth: 22, height: 20, levels: 3 },
    brandColor: '#0284c7',
    accentColor: '#dc2626',
    bannerSubtitle: 'CLOTHING & APPAREL FOR MEN, WOMEN & KIDS'
  },
  {
    id: 'bluestone_jewellery',
    name: 'BlueStone Jewellery',
    kannadaName: 'ಬ್ಲೂಸ್ಟೋನ್ ಜ್ಯುವೆಲ್ಲರಿ',
    category: 'jewellery',
    lat: 12.9566127,
    lng: 77.6996336,
    rating: 4.9,
    reviewCount: 1117,
    address: '93/9, Varthur Main Rd, near Marathahalli Bridge, Bengaluru 560037',
    phone: '086559 70855',
    dimensions: { width: 20, depth: 16, height: 14, levels: 2 },
    brandColor: '#0f172a',
    accentColor: '#38bdf8',
    bannerSubtitle: 'FINE JEWELLERY & CERTIFIED DIAMONDS'
  },
  {
    id: 'kohira_diamonds',
    name: 'Kohira Diamonds',
    kannadaName: 'ಕೋಹಿರಾ ಡೈಮಂಡ್ಸ್',
    category: 'jewellery',
    lat: 12.957178,
    lng: 77.700095,
    rating: 4.9,
    reviewCount: 374,
    address: 'No.505/1, Varthur Main Rd, Marathahalli, Bengaluru 560037',
    dimensions: { width: 20, depth: 16, height: 14, levels: 2 },
    brandColor: '#042f2e',
    accentColor: '#14b8a6',
    bannerSubtitle: 'LAB-GROWN DIAMOND JEWELLERY'
  },
  {
    id: 'vijay_sales',
    name: 'VIJAY SALES',
    kannadaName: 'ವಿಜಯ್ ಸೇಲ್ಸ್',
    category: 'electronics',
    lat: 12.9567206,
    lng: 77.6977353,
    rating: 4.8,
    reviewCount: 837,
    address: 'Rajatha Plaza, Next to HP Pump, Old Airport Rd, Marathahalli, Bengaluru 560037',
    phone: '098330 09237',
    dimensions: { width: 34, depth: 24, height: 18, levels: 3 },
    brandColor: '#dc2626',
    accentColor: '#ffffff',
    bannerSubtitle: 'INDIA’S LEADING ELECTRONICS MEGASTORE'
  },
  {
    id: 'kalyan_jewellers',
    name: 'Kalyan Jewellers',
    kannadaName: 'ಕಲ್ಯಾಣ್ ಜ್ಯುವೆಲ್ಲರ್ಸ್',
    category: 'jewellery',
    lat: 12.956570,
    lng: 77.696800,
    rating: 4.5,
    reviewCount: 3420,
    address: 'Old Airport Rd, Near Tulasi Theatre, Marathahalli, Bengaluru 560037',
    dimensions: { width: 28, depth: 20, height: 18, levels: 3 },
    brandColor: '#78350f',
    accentColor: '#fbbf24',
    bannerSubtitle: 'TRUST IS EVERYTHING • MUDHRA BRIDAL'
  },
  {
    id: 'brand_factory_mall',
    name: 'Brand Factory Outlet (KLM Fashion Mall)',
    kannadaName: 'ಬ್ರಾಂಡ್ ಫ್ಯಾಕ್ಟರಿ',
    category: 'apparel',
    lat: 12.957360,
    lng: 77.701620,
    rating: 4.1,
    reviewCount: 14890,
    address: 'Vanshee Towers, Outer Ring Rd, Marathahalli, Bengaluru 560037',
    dimensions: { width: 42, depth: 30, height: 28, levels: 4 },
    brandColor: '#b91c1c',
    accentColor: '#facc15',
    bannerSubtitle: 'FLAT 20% - 70% OFF ON 200+ BRANDS'
  },
  {
    id: 'innovative_multiplex',
    name: 'Innovative Multiplex',
    kannadaName: 'ಇನ್ನೊವೇಟಿವ್ ಮಲ್ಟಿಪ್ಲೆಕ್ಸ್',
    category: 'cinema',
    lat: 12.9519271,
    lng: 77.6990125,
    rating: 3.7,
    reviewCount: 6816,
    address: '90b, Innovative Multiplex, 135, Outer Ring Rd, Marathahalli Village, Bengaluru 560037',
    phone: '096322 80000',
    dimensions: { width: 44, depth: 52, height: 26, levels: 4 },
    brandColor: '#7f1d1d',
    accentColor: '#38bdf8',
    bannerSubtitle: '9-SCREEN PIONEER MULTIPLEX CINEMA'
  },
  {
    id: 'spice_garden_bus_stop',
    name: 'Spice Garden BMTC Bus Stop',
    kannadaName: 'ಸ್ಪೈಸ್ ಗಾರ್ಡನ್ ಬಸ್ ನಿಲ್ದಾಣ',
    category: 'transit',
    // Source-backed BMTC platform node/2477336839 from the widened OSM
    // extract; the previous coordinate was an old junction-local placeholder.
    lat: 12.9562995,
    lng: 77.7088804,
    rating: 4.2,
    reviewCount: 1950,
    address: 'Varthur Main Rd, Munnekolala, Marathahalli, Bengaluru 560037',
    dimensions: { width: 22, depth: 8, height: 6, levels: 1 },
    brandColor: '#0284c7',
    accentColor: '#fbbf24',
    bannerSubtitle: 'BMTC PASSENGER TRANSIT PLATFORM & TURNAROUND BAY'
  }
];

/**
 * Returns optimized 3D camera vantage position and look-at target for inspecting a store in 3D.
 */
export function getStoreCameraFraming(store: GoogleMapsStore): {
  position: [number, number, number];
  target: [number, number, number];
} {
  const [sx, sy, sz] = gpsTo3D(store.lat, store.lng);

  switch (store.id) {
    case 'kalamandir':
      return { position: [6, 22, 305], target: [46, 15, 332.5] };
    case 'nalli_silks':
      return { position: [10, 18, 335], target: [48.9, 12, 354] };
    case 'krishna_grand':
      return { position: [10, 18, 140], target: [-34.7, 12, 136.8] };
    case 'krishna_summit':
      return { position: [12, 24, 115], target: [-37.5, 18, 109.4] };
    case 'brand_factory_mall':
      return { position: [2, 18, 55], target: [48, 14, 57.5] };
    case 'innovative_multiplex':
      return { position: [-190, 26, -405], target: [-286, 12, -535] };
    case 'tanishq_hal':
      return { position: [-70.2, 15, 25], target: [-70.2, 9, -7.0] };
    case 'max_fashion':
      return { position: [-157.2, 16, 32], target: [-157.2, 10, 2.0] };
    case 'bluestone_jewellery':
      return { position: [-167.3, 15, 5], target: [-167.3, 7, -25.1] };
    case 'kohira_diamonds':
      return { position: [-117.2, 15, 65], target: [-117.2, 7, 37.4] };
    case 'vijay_sales':
      return { position: [-373.1, 16, 18], target: [-373.1, 9, -13.2] };
    case 'kalyan_jewellers':
      return { position: [-474.6, 16, 2], target: [-474.6, 9, -29.9] };
    case 'spice_garden_bus_stop':
      // OSM-backed Spice Garden BMTC platform (x≈836m, z≈-60m).
      return { position: [745, 30, 50], target: [835.8, 4, -59.8] };
    default: {
      const target: [number, number, number] = [sx, sy + store.dimensions.height * 0.4, sz];
      const dx = sx > 0 ? -35 : 35;
      const dz = Math.abs(sz) > 100 ? (sz > 0 ? -25 : 25) : 30;
      const position: [number, number, number] = [
        sx + dx,
        sy + store.dimensions.height * 0.5 + 8,
        sz + dz
      ];
      return { position, target };
    }
  }
}

/**
 * Generates an official Google Maps search query link for the catalogue coordinate.
 */
export function getStoreGoogleMapsUrl(store: GoogleMapsStore): string {
  return `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3D DIGITAL TWIN - LOCATION CONFIGURATION & VISUAL CONSTANTS
// Customize the 3 lines below to build a digital twin of a different junction.
// ═════════════════════════════════════════════════════════════════════════════

export const ACTIVE_CITY = 'Bengaluru';
export const ACTIVE_JUNCTION_NAME = 'Marathahalli signal junction';
export const ACTIVE_COORDINATES = {
  lat: 12.956840,
  lng: 77.701176
};

// ═════════════════════════════════════════════════════════════════════════════
// VISUAL TUNING CONSTANTS (Exposed at top for easy adjustment)
// ═════════════════════════════════════════════════════════════════════════════

// Post-processing Bloom strength (subtle daytime glow vs heightened night glow)
export const BLOOM_INTENSITY_DAY = 0.18;   // Reduced: realistic sun-lit scene, no broad glow
export const BLOOM_INTENSITY_NIGHT = 1.35;
export const BLOOM_LUMINANCE_THRESHOLD = 0.90;  // Higher threshold: only emissives bloom in day
export const BLOOM_LUMINANCE_SMOOTHING = 0.25;

// Sun direction & angle (Golden hour warm lighting)
export const SUN_POSITION_DAY: [number, number, number] = [90, 48, -75];
export const SUN_POSITION_OVERCAST: [number, number, number] = [30, 60, 20];

// Fog density across the junction
// Tuned for the wide inspection camera: the prior values hid the OSM massing
// behind roughly 75% exponential fog at a 500m view distance.
export const FOG_DENSITY_DAY = 0.00045;
export const FOG_DENSITY_RAIN = 0.0013;
export const FOG_DENSITY_NIGHT = 0.00065;

// Color grading and exposure
export const TONE_MAPPING_EXPOSURE = 1.08;

// Camera defaults (wide local-aerial angle that keeps the junction readable on first load).
// The earlier street-level default placed the camera inside the authored corridor
// landmarks, so a roof filled most of the viewport before the user could navigate.
export const CAMERA_DEFAULT_POSITION: [number, number, number] = [-300, 320, 420];
export const CAMERA_DEFAULT_TARGET: [number, number, number] = [0, 0, 40];

// Junction physical dimensions (in 3D world units)
export const JUNCTION_BOUNDS = {
  roadWidthORR: 28,          // Outer Ring Road (North-South, 6-lane + service)
  roadWidthOldAirport: 24,    // Old Airport / Varthur Rd (East-West, 4-lane)
  underpassDepth: 5.2,       // Marathahalli ORR Underpass sunken trench depth
  robBridgeHeight: 7.5,      // Marathahalli Railway Overbridge (ROB) elevated height
  railwayX: 175,             // SWR Railway Line X position East of junction
  flyoverHeight: 7.5,        // Backward compatibility alias
  flyoverWidth: 14,          // ROB / Overbridge width (4 lanes)
  junctionRadius: 220        // Modeling radius
};

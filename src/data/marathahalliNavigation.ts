import { CAMERA_DEFAULT_POSITION } from '../config/location';
import { CameraMode, CameraPreset } from '../types';
import {
  MARATHAHALLI_SKYWALK_DECK_WAY_IDS,
  MARATHAHALLI_SKYWALK_DECK_POINTS,
  MARATHAHALLI_SKYWALK_DECK_TOP_Y,
  MARATHAHALLI_SKYWALK_GROUND_TOP_Y,
  MARATHAHALLI_SKYWALK_STAIR_WAY_IDS,
  MARATHAHALLI_SKYWALK_STAIR_POINTS,
  VARTHUR_VIADUCT_FOOTWAY_WAY_IDS,
  VARTHUR_VIADUCT_WAY_IDS,
  VARTHUR_VIADUCT_DECK_TOP_Y,
  OSMPolylineFeature,
  isMarathahalliSkywalkDeck,
  isMarathahalliSkywalkStair
} from './marathahalliDemo';
import {
  SOURCE_ELEVATED_WALK_ROUTES,
  SOURCE_GROUND_WALK_ROUTES,
  SOURCE_BRIDGE_PIER_POINTS,
  MODELLED_MISSING_WALK_LINKS,
  SourceWalkRoute
} from './marathahalliPedestrianData';

export interface CameraView {
  position: [number, number, number];
  target: [number, number, number];
}

export interface WalkObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const WALK_EYE_HEIGHT = 1.7;
export const WALK_LOOK_DISTANCE = 8;

type LocalXZ = [number, number];

export type SourceStructureKind =
  | 'ground'
  | 'skywalk-deck'
  | 'skywalk-stairs'
  | 'varthur-viaduct'
  | 'varthur-footway'
  | 'unverified-bridge'
  | 'unverified-steps';

export interface SourceStructureElevation {
  kind: SourceStructureKind;
  /** Display height for a source ribbon or filled surface. */
  renderY: number;
  /** Display height for a source line/outline. */
  lineY: number;
  /** Height used by person-mode navigation when the feature is walkable. */
  walkY: number;
  walkable: boolean;
  /** True only when the vertical interpretation is tied to a known local contract. */
  elevationVerified: boolean;
  /** True when the feature needs a variable profile (for example, stairs). */
  variableElevation?: boolean;
  label: string;
}

interface SourceStructureElevationRegistryEntry extends SourceStructureElevation {
  sourceWayIds: readonly string[];
}

/**
 * A single vertical contract shared by person navigation and the source OSM
 * renderer. OSM `layer`/`bridge` tags describe ordering, not metres, so only
 * the two known Skywalk flights/deck and the two known Varthur footways get
 * explicit heights. Unknown bridges and steps are intentionally not guessed.
 */
export const SOURCE_STRUCTURE_ELEVATION_REGISTRY: readonly SourceStructureElevationRegistryEntry[] = [
  {
    sourceWayIds: MARATHAHALLI_SKYWALK_DECK_WAY_IDS,
    kind: 'skywalk-deck',
    renderY: MARATHAHALLI_SKYWALK_DECK_TOP_Y,
    lineY: MARATHAHALLI_SKYWALK_DECK_TOP_Y,
    walkY: MARATHAHALLI_SKYWALK_DECK_TOP_Y,
    walkable: true,
    elevationVerified: true,
    label: 'SOURCE · MARATHAHALLI SKYWALK DECK · VERIFIED DATUM'
  },
  {
    sourceWayIds: MARATHAHALLI_SKYWALK_STAIR_WAY_IDS,
    kind: 'skywalk-stairs',
    // The renderer uses the authored tread model for these ways. These values
    // are only a safe route datum; resolveWalkSurfaceY interpolates the actual
    // ground→deck profile from MARATHAHALLI_SKYWALK_STAIR_POINTS.
    renderY: MARATHAHALLI_SKYWALK_GROUND_TOP_Y,
    lineY: MARATHAHALLI_SKYWALK_GROUND_TOP_Y + 0.08,
    walkY: MARATHAHALLI_SKYWALK_GROUND_TOP_Y,
    walkable: true,
    elevationVerified: true,
    variableElevation: true,
    label: 'SOURCE · MARATHAHALLI SKYWALK STAIRS · VERIFIED PROFILE'
  },
  {
    sourceWayIds: VARTHUR_VIADUCT_WAY_IDS,
    kind: 'varthur-viaduct',
    renderY: VARTHUR_VIADUCT_DECK_TOP_Y + 0.02,
    lineY: VARTHUR_VIADUCT_DECK_TOP_Y + 0.12,
    walkY: VARTHUR_VIADUCT_DECK_TOP_Y,
    walkable: false,
    elevationVerified: true,
    label: 'SOURCE · VARTHUR ROAD VIADUCT · VERIFIED DATUM'
  },
  {
    sourceWayIds: VARTHUR_VIADUCT_FOOTWAY_WAY_IDS,
    kind: 'varthur-footway',
    renderY: VARTHUR_VIADUCT_DECK_TOP_Y + 0.16,
    lineY: VARTHUR_VIADUCT_DECK_TOP_Y + 0.16,
    walkY: VARTHUR_VIADUCT_DECK_TOP_Y + 0.16,
    walkable: true,
    elevationVerified: true,
    label: 'SOURCE · VARTHUR VIADUCT FOOTWAY · VERIFIED DATUM'
  }
] as const;

/**
 * Explicit fallback for source structures whose tags provide no metre-level
 * elevation. It is rendered at the local ground datum only as a provenance
 * marker, never as a walkable surface; the label is surfaced by the OSM layer.
 */
export const SOURCE_UNVERIFIED_STRUCTURE_ELEVATION: SourceStructureElevation = {
  kind: 'unverified-bridge',
  renderY: 0.14,
  lineY: 0.24,
  walkY: 0,
  walkable: false,
  elevationVerified: false,
  label: 'UNVERIFIED ELEVATION · SHOWN AT GRADE · NOT WALKABLE'
};

const SOURCE_GROUND_STRUCTURE_ELEVATION: SourceStructureElevation = {
  kind: 'ground',
  renderY: 0.14,
  lineY: 0.12,
  walkY: 0,
  walkable: true,
  elevationVerified: true,
  label: 'SOURCE · GROUND DATUM'
};

function isBridgeTagged(feature: OSMPolylineFeature) {
  const bridgeTag = feature.tags.bridge;
  return (Boolean(bridgeTag) && bridgeTag !== 'no') || feature.tags.man_made === 'bridge';
}

/** Resolve one source feature without borrowing another structure's height. */
export function resolveSourceStructureElevation(feature: OSMPolylineFeature): SourceStructureElevation {
  const registered = SOURCE_STRUCTURE_ELEVATION_REGISTRY.find((entry) => entry.sourceWayIds.includes(feature.id));
  if (registered) return registered;

  if (feature.tags.highway === 'steps' || feature.tags.footway === 'steps') {
    return {
      ...SOURCE_UNVERIFIED_STRUCTURE_ELEVATION,
      kind: 'unverified-steps',
      label: 'UNVERIFIED STEPS · ELEVATION UNKNOWN · NOT WALKABLE'
    };
  }

  if (isBridgeTagged(feature)) {
    return SOURCE_UNVERIFIED_STRUCTURE_ELEVATION;
  }

  return SOURCE_GROUND_STRUCTURE_ELEVATION;
}

/**
 * Generic source steps and unknown bridge footways are retained as source
 * evidence only. This predicate is shared with rendering so person mode never
 * receives a route that the scene presents as a walkable flat surface.
 */
export function isSourceNavigableFootway(feature: OSMPolylineFeature) {
  const elevation = resolveSourceStructureElevation(feature);
  return elevation.walkable && !elevation.variableElevation;
}

export function isSourceUnverifiedStructure(feature: OSMPolylineFeature) {
  return !resolveSourceStructureElevation(feature).elevationVerified;
}

/**
 * Source-backed local anchors from public/data/marathahalli-demo.json.
 *
 * A building centroid, an entrance/edge, a bus stop, and a road point are
 * deliberately separate concepts. Presets use the appropriate one instead
 * of pretending that every named place has one universally correct point.
 */
export const MARATHAHALLI_SOURCE_ANCHORS = {
  junction: {
    roadCenter: [-10.7, 12.7] as LocalXZ,
    signalCluster: [-29.6, 2.7] as LocalXZ
  },
  oracleHub: {
    campusCentroid: [-746.6, -1779.2] as LocalXZ,
    entranceFountain: [-544.7, -1692.9] as LocalXZ,
    approachRoad: [-553.2, -1752.6] as LocalXZ
  },
  innovativeMultiplex: {
    buildingCentroid: [-286.0, -535.1] as LocalXZ,
    exteriorEdge: [-226.3, -537.8] as LocalXZ,
    busStop: [-136.7, -576.4] as LocalXZ
  },
  kalamandir: {
    buildingCentroid: [46.0, 330.4] as LocalXZ,
    westExteriorEdge: [40.0, 332.5] as LocalXZ,
    busStop: [7.6, 354.2] as LocalXZ
  },
  spiceGarden: {
    restaurant: [860.1, 24.0] as LocalXZ,
    busStopPrimary: [835.8, -59.8] as LocalXZ,
    busStopAlternate: [827.8, -39.1] as LocalXZ,
    roadSouth: [850.6, -25.7] as LocalXZ,
    roadNorth: [839.8, 24.9] as LocalXZ
  },
  underpass: {
    southPortal: [-7.3, -8.0] as LocalXZ,
    center: [-4.0, 12.0] as LocalXZ,
    northPortal: [-0.6, 32.1] as LocalXZ
  },
  varthurViaduct: {
    westDeck: [338.3, -6.9] as LocalXZ,
    center: [376.0, -15.0] as LocalXZ,
    eastDeck: [414.5, -12.2] as LocalXZ,
    groundApproach: [300.0, -6.0] as LocalXZ
  },
  kadubeesanahalli: {
    // Exact source anchors from the widened OSM snapshot. The locality node
    // and the named junction are distinct from the nearby Oracle approach
    // footway used for person-mode entry.
    locality: [-475.4, -1914.0] as LocalXZ,
    underpass: [-649.4, -1926.3] as LocalXZ,
    approachFootway: [-361.4, -1347.2] as LocalXZ
  }
} as const;

// Source-backed anchors from the widened OSM extract. These are kept in the
// same local metre projection as the junction scene so the corridor view and
// person mode share one coordinate contract.
const ORACLE_HUB_LOCAL: [number, number, number] = [
  MARATHAHALLI_SOURCE_ANCHORS.oracleHub.campusCentroid[0],
  WALK_EYE_HEIGHT,
  MARATHAHALLI_SOURCE_ANCHORS.oracleHub.campusCentroid[1]
];

const BIRD_VIEWS: Record<CameraPreset, CameraView> = {
  overview: {
    position: CAMERA_DEFAULT_POSITION,
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[0],
      0,
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[1]
    ]
  },
  underpass: {
    // Source tunnel ways run from approximately z=-8 to z=32. Aim at their
    // shared center while keeping the bird camera outside the trench.
    position: [-82, 34, -108],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.underpass.center[0],
      -4.5,
      MARATHAHALLI_SOURCE_ANCHORS.underpass.center[1]
    ]
  },
  surface: {
    position: [-34, 8, 24],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[0],
      1,
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[1]
    ]
  },
  aerial: {
    position: [0, 160, 0.1],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[0],
      0,
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[1]
    ]
  },
  cinematic: {
    position: CAMERA_DEFAULT_POSITION,
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[0],
      0,
      MARATHAHALLI_SOURCE_ANCHORS.junction.roadCenter[1]
    ]
  },
  flyover: {
    // Source Varthur Road viaduct (OSM ways 1157170083/1157170085).
    position: [292, 54, 92],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.center[0],
      8,
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.center[1]
    ]
  },
  ground: {
    position: [-34, 8, 24],
    target: [0, 1, 0]
  },
  multiplex: {
    position: [-190, 26, -405],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.innovativeMultiplex.buildingCentroid[0],
      12,
      MARATHAHALLI_SOURCE_ANCHORS.innovativeMultiplex.buildingCentroid[1]
    ]
  },
  kalamandir: {
    // Keep the full palatial frontage, Nalli neighbour, and source road in
    // frame; the previous 90m stand-off cropped the upper facade at bird
    // scale and made the landmark harder to inspect.
    position: [-55, 44, 455],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.kalamandir.buildingCentroid[0],
      14,
      MARATHAHALLI_SOURCE_ANCHORS.kalamandir.buildingCentroid[1]
    ]
  },
  brandfactory: {
    position: [-20, 28, 112],
    target: [48, 12, 58]
  },
  skywalk: {
    position: [112, 46, 74],
    target: [MARATHAHALLI_SKYWALK_DECK_POINTS[0][0], 6.5, MARATHAHALLI_SKYWALK_DECK_POINTS[0][1]]
  },
  spicegarden: {
    // OSM-backed Spice Garden restaurant point (12.9570571, 77.7091042),
    // east of the Marathahalli junction on the actual HAL Airport Road.
    position: [930, 52, 82],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.spiceGarden.restaurant[0],
      6,
      MARATHAHALLI_SOURCE_ANCHORS.spiceGarden.restaurant[1]
    ]
  },
  crossover: {
    // Center on the source underpass/arterial crossover rather than the
    // authored origin. The tighter inspection frame keeps the mapped road,
    // source footways, signal cluster and short turn replay legible together.
    position: [64, 58, 72],
    target: [
      -2,
      1.8,
      10
    ]
  },
  corridor: {
    // Full source corridor: Oracle Tech Hub → Marathahalli junction →
    // Kalamandir/Spice Garden. Framing is tightened so source building
    // massing and the named road spine remain legible without losing the
    // 2.1 km route from the bird view.
    position: [1320, 1980, 1580],
    target: [56.8, 0, -877.6]
  },
  bellandur: {
    // Bellandur ↔ Marathahalli Phase 2 slice. The registry contains point
    // anchors only, so this camera intentionally frames the approximate
    // employment corridor without implying a full imported road network.
    position: [-260, 2500, -760],
    target: [-1300, 0, -2350]
  },
  oraclehub: {
    position: [-470, 150, -1498],
    target: ORACLE_HUB_LOCAL
  },
  kadubeesanahalli: {
    // Frame the exact named source underpass, rather than the nearby
    // approach-footway entry used by person mode.
    position: [-820, 165, -1960],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.kadubeesanahalli.underpass[0],
      0,
      MARATHAHALLI_SOURCE_ANCHORS.kadubeesanahalli.underpass[1]
    ]
  }
};

const WALK_STARTS: Record<CameraPreset, CameraView> = {
  // These starts are vertices from source footways, not a lateral offset from
  // the vehicle carriageway. The eye still sees the road, but begins on a
  // surface that the snapshot actually maps as pedestrian-accessible.
  overview: { position: [-30.6, WALK_EYE_HEIGHT, -5.4], target: [-17.5, WALK_EYE_HEIGHT, -6.1] },
  underpass: {
    // Start on the mapped frontage footway, just outside the tunnel portal,
    // and look into the source underpass rather than along the full route.
    position: [-30.6, WALK_EYE_HEIGHT, -5.4],
    target: [-10.6, WALK_EYE_HEIGHT, 13.2]
  },
  surface: { position: [-30.6, WALK_EYE_HEIGHT, -5.4], target: [-17.5, WALK_EYE_HEIGHT, -6.1] },
  aerial: { position: [-30.6, WALK_EYE_HEIGHT, -5.4], target: [-17.5, WALK_EYE_HEIGHT, -6.1] },
  cinematic: { position: [-30.6, WALK_EYE_HEIGHT, -5.4], target: [-17.5, WALK_EYE_HEIGHT, -6.1] },
  flyover: {
    // Source-mapped elevated pedestrian ways run on both sides of Varthur
    // Road. They have no mapped ramp, so this preset intentionally starts on
    // the north elevated footway rather than inventing a ground connection.
    position: [
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.center[0],
      WALK_EYE_HEIGHT,
      -4
    ],
    target: [
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.eastDeck[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.varthurViaduct.eastDeck[1]
    ]
  },
  ground: { position: [-30.6, WALK_EYE_HEIGHT, -5.4], target: [-17.5, WALK_EYE_HEIGHT, -6.1] },
  multiplex: {
    position: [-169, WALK_EYE_HEIGHT, -547.9],
    target: [
      -171.4,
      WALK_EYE_HEIGHT,
      -556.5
    ]
  },
  kalamandir: {
    // The source footway continues along the east side of the mapped
    // Kalamandir/Nalli frontage. Start on its clear segment beyond the
    // Kalamandir footprint, then look along the same mapped way.
    position: [47.2, WALK_EYE_HEIGHT, 377.5],
    target: [
      55.3,
      WALK_EYE_HEIGHT,
      442.8
    ]
  },
  brandfactory: { position: [15, 1.7, 58], target: [48, 1.7, 58] },
  skywalk: {
    position: [45.2, WALK_EYE_HEIGHT, -4.7],
    target: [63.9, WALK_EYE_HEIGHT, -4.6]
  },
  // Start on the mapped Spice Garden inner-road footway instead of on the
  // nearby Varthur Road carriageway. The southern bend gives the person view
  // enough stand-off to read the shop, frontage road and continuing footway.
  spicegarden: {
    position: [
      837.2,
      WALK_EYE_HEIGHT,
      -21.5
    ],
    // Aim through the source road bend rather than directly at the POI
    // marker. The mapped restaurant remains in the right-hand frontage while
    // the road, footway and modelled planting edge share the frame.
    target: [850.5, WALK_EYE_HEIGHT, 34]
  },
  // The crossover walk view starts on the source-marked signal crossing and
  // looks along its mapped northbound footway link, keeping the road, traffic
  // and crossing marker in the first-person frame.
  crossover: { position: [-32.7, WALK_EYE_HEIGHT, 2.6], target: [-29.7, WALK_EYE_HEIGHT, 23.9] },
  corridor: { position: [-95.8, WALK_EYE_HEIGHT, -247.4], target: [-106.7, WALK_EYE_HEIGHT, -288.8] },
  bellandur: { position: [-2965, WALK_EYE_HEIGHT, -3585], target: [-2945, WALK_EYE_HEIGHT, -3585] },
  oraclehub: {
    position: [
      -559.4,
      WALK_EYE_HEIGHT,
      -1752
    ],
    target: [
      -532.2,
      WALK_EYE_HEIGHT,
      -1708.9
    ]
  },
  kadubeesanahalli: {
    position: [
      MARATHAHALLI_SOURCE_ANCHORS.kadubeesanahalli.approachFootway[0],
      WALK_EYE_HEIGHT,
      MARATHAHALLI_SOURCE_ANCHORS.kadubeesanahalli.approachFootway[1]
    ],
    target: [-408.2, WALK_EYE_HEIGHT, -1480.9]
  }
};

// A bounded inspection envelope keeps WASD navigation inside the modeled
// corridor while leaving the authored HAL/ORR/Spice Garden extents reachable.
export const MARATHAHALLI_WALK_BOUNDS = {
  minX: -3800,
  maxX: 1020,
  minZ: -3950,
  maxZ: 520
};

// Overview cameras need more room than a person camera to frame the full
// Oracle-to-Spice-Garden corridor. These bounds still prevent pan/keyboard
// drift into an unbounded empty scene.
export const MARATHAHALLI_OVERVIEW_BOUNDS = {
  minX: -4200,
  maxX: 1600,
  minY: 0.75,
  maxY: 3000,
  minZ: -4200,
  maxZ: 1000
};

// Coarse, named landmark footprints prevent the person camera from walking
// through the largest authored showrooms. OSM massing remains a visual layer;
// these are navigation guardrails, not a survey-grade collision map.
export const MARATHAHALLI_WALK_OBSTACLES: WalkObstacle[] = [
  // Source footprint way/343600093: use its full bounding envelope so the
  // eastern frontage cannot be entered through the old truncated guardrail.
  { minX: -328, maxX: -226, minZ: -565, maxZ: -516 }, // Innovative Multiplex
  { minX: 33, maxX: 64, minZ: 32, maxZ: 85 },       // Brand Factory / outlet row
  { minX: 29, maxX: 67, minZ: 310, maxZ: 371 },     // Kalamandir / Nalli frontage
  { minX: -58, maxX: -17, minZ: 87, maxZ: 130 },    // Krishna Summit block
  // Keep the eastern entrance apron open so the source approach road and
  // entrance fountain remain reachable in person mode. The campus itself is
  // still guarded by the coarse western massing envelope.
  { minX: -980, maxX: -568, minZ: -1900, maxZ: -1580 } // Oracle Tech Hub campus
];

// Keep the mapped bridge pier obstacles solid in person mode. A small safety
// radius represents the concrete footprint plus a walking clearance; these
// source positions are not inferred from a regular metro grid.
export const MARATHAHALLI_SOURCE_BRIDGE_PIER_OBSTACLES: WalkObstacle[] =
  SOURCE_BRIDGE_PIER_POINTS.map(([x, z]) => ({
    minX: x - 1.8,
    maxX: x + 1.8,
    minZ: z - 1.8,
    maxZ: z + 1.8
  }));

const ALL_WALK_OBSTACLES = [
  ...MARATHAHALLI_WALK_OBSTACLES,
  ...MARATHAHALLI_SOURCE_BRIDGE_PIER_OBSTACLES
];

const SOURCE_SKYWALK_ROUTES: readonly SourceWalkRoute[] = [
  {
    sourceWayIds: ['way/323729569'],
    points: [MARATHAHALLI_SKYWALK_STAIR_POINTS[0].ground, MARATHAHALLI_SKYWALK_STAIR_POINTS[0].deck],
    width: 3,
    elevation: 0,
    connectedToGrade: true
  },
  {
    sourceWayIds: ['way/323729567', 'way/1221361667', 'way/1221361669'],
    points: MARATHAHALLI_SKYWALK_DECK_POINTS,
    width: 3,
    elevation: MARATHAHALLI_SKYWALK_DECK_TOP_Y,
    connectedToGrade: true
  },
  {
    sourceWayIds: ['way/323729566'],
    points: [MARATHAHALLI_SKYWALK_STAIR_POINTS[1].ground, MARATHAHALLI_SKYWALK_STAIR_POINTS[1].deck],
    width: 3,
    elevation: 0,
    connectedToGrade: true
  }
];

const SOURCE_WALK_ROUTES_FALLBACK: readonly SourceWalkRoute[] = [
  ...SOURCE_GROUND_WALK_ROUTES,
  ...SOURCE_ELEVATED_WALK_ROUTES,
  ...SOURCE_SKYWALK_ROUTES,
  ...MODELLED_MISSING_WALK_LINKS
];

let registeredSourceWalkRoutes: readonly SourceWalkRoute[] = SOURCE_WALK_ROUTES_FALLBACK;
const SOURCE_WALK_CONNECTIVITY_TOLERANCE = 4.5;
let sourceWalkRouteConnections = buildSourceWalkRouteConnections(SOURCE_WALK_ROUTES_FALLBACK);

function sourceWalkRouteKey(route: SourceWalkRoute) {
  return route.sourceWayIds.join('|');
}

function buildSourceWalkRouteConnections(routes: readonly SourceWalkRoute[]) {
  const connections = new Map<string, Set<string>>();
  routes.forEach((route) => connections.set(sourceWalkRouteKey(route), new Set()));

  for (let leftIndex = 0; leftIndex < routes.length; leftIndex += 1) {
    const left = routes[leftIndex];
    const leftStart = left.points[0];
    const leftEnd = left.points[left.points.length - 1];
    for (let rightIndex = leftIndex + 1; rightIndex < routes.length; rightIndex += 1) {
      const right = routes[rightIndex];
      const shareSourceNode = Boolean(left.sourceNodeRefs?.some((nodeRef) => right.sourceNodeRefs?.includes(nodeRef)));
      // A shared OSM node is a stronger topology signal than a small visual
      // endpoint tolerance. Only use it for routes on the same modeled
      // surface; an overpass and a ground footway can share plan coordinates
      // without being physically walkable from one another.
      if (shareSourceNode) {
        if (Math.abs(left.elevation - right.elevation) < 0.75) {
          connections.get(sourceWalkRouteKey(left))?.add(sourceWalkRouteKey(right));
          connections.get(sourceWalkRouteKey(right))?.add(sourceWalkRouteKey(left));
        }
        continue;
      }
      const rightStart = right.points[0];
      const rightEnd = right.points[right.points.length - 1];
      const joins = [
        Math.hypot(leftStart[0] - rightStart[0], leftStart[1] - rightStart[1]),
        Math.hypot(leftStart[0] - rightEnd[0], leftStart[1] - rightEnd[1]),
        Math.hypot(leftEnd[0] - rightStart[0], leftEnd[1] - rightStart[1]),
        Math.hypot(leftEnd[0] - rightEnd[0], leftEnd[1] - rightEnd[1])
      ];
      if (Math.min(...joins) > SOURCE_WALK_CONNECTIVITY_TOLERANCE) continue;
      connections.get(sourceWalkRouteKey(left))?.add(sourceWalkRouteKey(right));
      connections.get(sourceWalkRouteKey(right))?.add(sourceWalkRouteKey(left));
    }
  }

  return connections;
}

function areSourceWalkRoutesConnected(left: SourceWalkRoute, right: SourceWalkRoute) {
  const leftKey = sourceWalkRouteKey(left);
  const rightKey = sourceWalkRouteKey(right);
  return leftKey === rightKey || sourceWalkRouteConnections.get(leftKey)?.has(rightKey) === true;
}

function parseSourceWidth(feature: OSMPolylineFeature) {
  const taggedWidth = Number.parseFloat(feature.tags.width || '');
  if (Number.isFinite(taggedWidth) && taggedWidth >= 1) return Math.min(8, taggedWidth);
  return feature.tags.footway === 'crossing' || feature.tags.highway === 'crossing' ? 2.5 : 2.0;
}

function getSourceWalkElevation(feature: OSMPolylineFeature) {
  return resolveSourceStructureElevation(feature).walkY;
}

/**
 * Replace the fallback pedestrian catalog with source footways whose vertical
 * contract is navigable. The explicitly mapped Skywalk flights stay in the
 * registry as a special elevation case because their stair geometry is
 * intentionally kept out of the flat source ribbon layer; unknown bridge and
 * steps ways remain source evidence only until their elevation is verified.
 */
export function registerSnapshotWalkRoutes(footways: readonly OSMPolylineFeature[]) {
  const snapshotRoutes = footways
    .filter((feature) => feature.geometry.length >= 2)
    .filter((feature) => !isMarathahalliSkywalkStair(feature) && !isMarathahalliSkywalkDeck(feature))
    .filter(isSourceNavigableFootway)
    .map<SourceWalkRoute>((feature) => {
      const elevation = getSourceWalkElevation(feature);
      return {
        sourceWayIds: [feature.id],
        sourceNodeRefs: feature.nodeRefs,
        points: feature.geometry,
        width: parseSourceWidth(feature),
        elevation,
        connectedToGrade: elevation === 0
      };
    });

  if (snapshotRoutes.length > 0) {
    registeredSourceWalkRoutes = [
      ...snapshotRoutes,
      ...SOURCE_SKYWALK_ROUTES,
      ...MODELLED_MISSING_WALK_LINKS
    ];
    sourceWalkRouteConnections = buildSourceWalkRouteConnections(registeredSourceWalkRoutes);
  }
}

// Route guidance stays inside a bounded source-way corridor. Endpoint joins
// prevent a nearby but unrelated footway from becoming an invisible teleport;
// the remaining free-movement fallback keeps authored landmark aprons and
// source gaps inspectable when the catalog has no connected way there.
const SOURCE_WALK_ROUTE_CLEARANCE = 2.5;
const SOURCE_WALK_ROUTE_CONTINUITY_WEIGHT = 0.35;

const distanceToSegment = (x: number, z: number, start: LocalXZ, end: LocalXZ) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSq = dx * dx + dz * dz;
  const progress = lengthSq === 0
    ? 0
    : Math.max(0, Math.min(1, ((x - start[0]) * dx + (z - start[1]) * dz) / lengthSq));
  const closestX = start[0] + dx * progress;
  const closestZ = start[1] + dz * progress;
  return { distance: Math.hypot(x - closestX, z - closestZ), progress };
};

interface WalkRouteProjection {
  route: SourceWalkRoute;
  point: LocalXZ;
  distance: number;
  progress: number;
}

function projectToWalkRoute(x: number, z: number, route: SourceWalkRoute): WalkRouteProjection {
  let nearest: WalkRouteProjection = {
    route,
    point: route.points[0],
    distance: Number.POSITIVE_INFINITY,
    progress: 0
  };

  for (let index = 1; index < route.points.length; index += 1) {
    const start = route.points[index - 1];
    const end = route.points[index];
    const projection = distanceToSegment(x, z, start, end);
    if (projection.distance >= nearest.distance) continue;
    nearest = {
      route,
      point: [
        start[0] + (end[0] - start[0]) * projection.progress,
        start[1] + (end[1] - start[1]) * projection.progress
      ],
      distance: projection.distance,
      progress: projection.progress
    };
  }

  return nearest;
}

/**
 * Return the closest source-mapped pedestrian surface. Consumers can use
 * the returned source IDs in an inspector without treating a nearby road as
 * a footway. The match radius is deliberately conservative because OSM does
 * not guarantee a pedestrian route exists everywhere in the extract.
 */
export function getNearestSourceWalkPoint(x: number, z: number, maxDistance = 18) {
  const nearest = registeredSourceWalkRoutes
    .map((route) => projectToWalkRoute(x, z, route))
    .reduce<WalkRouteProjection | null>((current, candidate) => (
      !current || candidate.distance < current.distance ? candidate : current
    ), null);

  return nearest && nearest.distance <= maxDistance ? nearest : null;
}

function isNearSourceRoute(x: number, z: number, route: SourceWalkRoute, extraClearance = 0) {
  return projectToWalkRoute(x, z, route).distance <= route.width / 2 + extraClearance;
}

/**
 * Resolve the source-mapped pedestrian surface under a local X/Z point. The
 * skywalk deck and its two recorded stair flights are the elevated pedestrian
 * geometry; all other walking stays at grade. The camera adds eye height on
 * top of this surface value.
 */
export function resolveWalkSurfaceY(x: number, z: number): number {
  for (const { deck, ground } of MARATHAHALLI_SKYWALK_STAIR_POINTS) {
    const projection = distanceToSegment(x, z, deck, ground);
    if (projection.distance <= 2.0) {
      return MARATHAHALLI_SKYWALK_DECK_TOP_Y +
        (MARATHAHALLI_SKYWALK_GROUND_TOP_Y - MARATHAHALLI_SKYWALK_DECK_TOP_Y) * projection.progress;
    }
  }

  const deckProjection = distanceToSegment(
    x,
    z,
    MARATHAHALLI_SKYWALK_DECK_POINTS[0],
    MARATHAHALLI_SKYWALK_DECK_POINTS[1]
  );
  if (deckProjection.distance <= 2.0) return MARATHAHALLI_SKYWALK_DECK_TOP_Y;

  // The Varthur elevated ways share their endpoints with mapped ground
  // approaches. Prefer grade at those junction points: the source has no
  // ramp, so a person walking on the approach must not pop onto the deck.
  const onVarthurGroundApproach = registeredSourceWalkRoutes.some((route) =>
    route.sourceWayIds.some((wayId) => wayId === 'way/1225572737' || wayId === 'way/1225572744') &&
    route.elevation === 0 &&
    isNearSourceRoute(x, z, route, 0.35)
  );
  if (onVarthurGroundApproach) return 0;

  // Varthur's elevated pedestrian ways are source-mapped, but the snapshot
  // contains no pedestrian ramp connecting them to grade. Only assign their
  // deck height when the point is already on the elevated way.
  for (const route of registeredSourceWalkRoutes) {
    if (route.elevation <= 0) continue;
    if (isNearSourceRoute(x, z, route, 0.35)) return route.elevation;
  }

  return 0;
}

export function resolveWalkEyeHeight(x: number, z: number): number {
  return WALK_EYE_HEIGHT + resolveWalkSurfaceY(x, z);
}

const isInsideObstacle = (x: number, z: number, padding = 0.65) =>
  ALL_WALK_OBSTACLES.some(
    (obstacle) =>
      x >= obstacle.minX - padding &&
      x <= obstacle.maxX + padding &&
      z >= obstacle.minZ - padding &&
      z <= obstacle.maxZ + padding
  );

const isOnSkywalkStair = (x: number, z: number) =>
  SOURCE_SKYWALK_ROUTES.some((route) => route.sourceWayIds.length === 1 && isNearSourceRoute(x, z, route, 0.15));

const canChangeWalkSurface = (
  currentX: number,
  currentZ: number,
  nextX: number,
  nextZ: number
) => {
  const currentSurface = resolveWalkSurfaceY(currentX, currentZ);
  const nextSurface = resolveWalkSurfaceY(nextX, nextZ);
  if (Math.abs(nextSurface - currentSurface) < 0.75) return true;

  // The only proven grade/elevated connection in this snapshot is the two
  // mapped skywalk stair flights. Varthur's elevated footways stay separate.
  return isOnSkywalkStair(currentX, currentZ) && isOnSkywalkStair(nextX, nextZ);
};

const isWalkPathClear = (startX: number, startZ: number, endX: number, endZ: number) => {
  const distance = Math.hypot(endX - startX, endZ - startZ);
  const samples = Math.max(1, Math.ceil(distance / 0.75));
  for (let index = 1; index <= samples; index += 1) {
    const progress = index / samples;
    const x = startX + (endX - startX) * progress;
    const z = startZ + (endZ - startZ) * progress;
    if (isInsideObstacle(x, z)) return false;
  }
  return true;
};

const getSourceRouteCorridorRadius = (route: SourceWalkRoute) =>
  route.width / 2 + SOURCE_WALK_ROUTE_CLEARANCE;

const moveTowardWalkPoint = (
  currentX: number,
  currentZ: number,
  targetX: number,
  targetZ: number,
  maxDistance: number
): LocalXZ => {
  const distance = Math.hypot(targetX - currentX, targetZ - currentZ);
  if (distance === 0 || distance <= maxDistance) return [targetX, targetZ];
  const progress = maxDistance / distance;
  return [
    currentX + (targetX - currentX) * progress,
    currentZ + (targetZ - currentZ) * progress
  ];
};

/**
 * Prefer a nearby source footway for one movement candidate. The route
 * catalog is sparse and contains no inferred crossings or ramps, so this
 * helper only guides a move when the current or requested point is already
 * inside a bounded route corridor. It never increases the requested travel
 * distance and returns null for a surface/path transition the source does
 * not establish.
 */
function resolveSourceGuidedWalkPosition(
  currentX: number,
  currentZ: number,
  nextX: number,
  nextZ: number
): LocalXZ | null {
  const requestedDistance = Math.hypot(nextX - currentX, nextZ - currentZ);
  if (requestedDistance === 0) return null;

  const nearestCurrentRoute = registeredSourceWalkRoutes
    .map((route) => projectToWalkRoute(currentX, currentZ, route))
    .reduce<WalkRouteProjection | null>((current, candidate) => (
      !current || candidate.distance < current.distance ? candidate : current
    ), null);
  const currentRoute = nearestCurrentRoute && nearestCurrentRoute.distance <=
    getSourceRouteCorridorRadius(nearestCurrentRoute.route)
    ? nearestCurrentRoute.route
    : null;

  const routeCandidates = registeredSourceWalkRoutes
    .map((route) => ({
      route,
      current: projectToWalkRoute(currentX, currentZ, route),
      next: projectToWalkRoute(nextX, nextZ, route)
    }))
    .filter(({ route, current, next }) => (
      (current.distance <= getSourceRouteCorridorRadius(route) ||
        next.distance <= getSourceRouteCorridorRadius(route)) &&
      (!currentRoute || areSourceWalkRoutesConnected(currentRoute, route)) &&
      canChangeWalkSurface(currentX, currentZ, next.point[0], next.point[1])
    ));

  if (!routeCandidates.length) return null;

  const selected = routeCandidates.reduce((nearest, candidate) => {
    const candidateScore = candidate.next.distance +
      candidate.current.distance * SOURCE_WALK_ROUTE_CONTINUITY_WEIGHT;
    const nearestScore = nearest.next.distance +
      nearest.current.distance * SOURCE_WALK_ROUTE_CONTINUITY_WEIGHT;
    return candidateScore < nearestScore ? candidate : nearest;
  });

  const routePoint = selected.next.point;
  const corridorRadius = getSourceRouteCorridorRadius(selected.route);
  const guidedPoint = selected.next.distance <= corridorRadius
    ? routePoint
    : [
        routePoint[0] + (nextX - routePoint[0]) * corridorRadius / selected.next.distance,
        routePoint[1] + (nextZ - routePoint[1]) * corridorRadius / selected.next.distance
      ] as LocalXZ;
  const boundedGuidedPoint = moveTowardWalkPoint(
    currentX,
    currentZ,
    guidedPoint[0],
    guidedPoint[1],
    requestedDistance
  );

  if (!canChangeWalkSurface(currentX, currentZ, boundedGuidedPoint[0], boundedGuidedPoint[1]) ||
      !isWalkPathClear(currentX, currentZ, boundedGuidedPoint[0], boundedGuidedPoint[1])) {
    return null;
  }

  return boundedGuidedPoint;
}

export function resolveWalkPosition(
  currentX: number,
  currentZ: number,
  nextX: number,
  nextZ: number
): [number, number] {
  const boundedX = Math.max(MARATHAHALLI_WALK_BOUNDS.minX, Math.min(MARATHAHALLI_WALK_BOUNDS.maxX, nextX));
  const boundedZ = Math.max(MARATHAHALLI_WALK_BOUNDS.minZ, Math.min(MARATHAHALLI_WALK_BOUNDS.maxZ, nextZ));
  const movementCandidates: LocalXZ[] = [
    [boundedX, boundedZ],
    [boundedX, currentZ],
    [currentX, boundedZ]
  ];

  for (const [candidateX, candidateZ] of movementCandidates) {
    const sourceGuidedPosition = resolveSourceGuidedWalkPosition(
      currentX,
      currentZ,
      candidateX,
      candidateZ
    );
    if (sourceGuidedPosition) return sourceGuidedPosition;

    if (canChangeWalkSurface(currentX, currentZ, candidateX, candidateZ) &&
        isWalkPathClear(currentX, currentZ, candidateX, candidateZ)) {
      return [candidateX, candidateZ];
    }
  }

  return [currentX, currentZ];
}

/**
 * Put an externally supplied person-mode start just outside a coarse obstacle.
 * This is used for fly-to/preset entry points; regular movement continues to
 * use resolveWalkPosition so it never jumps through a landmark.
 */
export function resolveWalkStart(x: number, z: number): [number, number] {
  let resolvedX = Math.max(MARATHAHALLI_WALK_BOUNDS.minX, Math.min(MARATHAHALLI_WALK_BOUNDS.maxX, x));
  let resolvedZ = Math.max(MARATHAHALLI_WALK_BOUNDS.minZ, Math.min(MARATHAHALLI_WALK_BOUNDS.maxZ, z));

  const sourceMatch = getNearestSourceWalkPoint(resolvedX, resolvedZ);
  if (sourceMatch && !isInsideObstacle(sourceMatch.point[0], sourceMatch.point[1])) {
    [resolvedX, resolvedZ] = sourceMatch.point;
  }

  for (let iteration = 0; iteration < ALL_WALK_OBSTACLES.length + 1; iteration += 1) {
    const obstacle = ALL_WALK_OBSTACLES.find((candidate) =>
      resolvedX >= candidate.minX - 1.2 &&
      resolvedX <= candidate.maxX + 1.2 &&
      resolvedZ >= candidate.minZ - 1.2 &&
      resolvedZ <= candidate.maxZ + 1.2
    );

    if (!obstacle) return [resolvedX, resolvedZ];

    const candidates: LocalXZ[] = [
      [obstacle.minX - 1.3, resolvedZ],
      [obstacle.maxX + 1.3, resolvedZ],
      [resolvedX, obstacle.minZ - 1.3],
      [resolvedX, obstacle.maxZ + 1.3]
    ].map(([candidateX, candidateZ]) => [
      Math.max(MARATHAHALLI_WALK_BOUNDS.minX, Math.min(MARATHAHALLI_WALK_BOUNDS.maxX, candidateX)),
      Math.max(MARATHAHALLI_WALK_BOUNDS.minZ, Math.min(MARATHAHALLI_WALK_BOUNDS.maxZ, candidateZ))
    ]);

    [resolvedX, resolvedZ] = candidates.reduce((nearest, candidate) =>
      Math.hypot(candidate[0] - resolvedX, candidate[1] - resolvedZ) <
        Math.hypot(nearest[0] - resolvedX, nearest[1] - resolvedZ)
        ? candidate
        : nearest
    );
  }

  return [resolvedX, resolvedZ];
}

export function createWalkView(position: [number, number, number], target: [number, number, number]): CameraView {
  const [safeX, safeZ] = resolveWalkStart(position[0], position[2]);
  const eyeHeight = resolveWalkEyeHeight(safeX, safeZ);
  const dx = target[0] - safeX;
  const dy = target[1] - position[1];
  const dz = target[2] - safeZ;
  const distance = Math.hypot(dx, dy, dz) || 1;

  return {
    position: [safeX, eyeHeight, safeZ],
    target: [
      safeX + (dx / distance) * WALK_LOOK_DISTANCE,
      eyeHeight + (dy / distance) * WALK_LOOK_DISTANCE,
      safeZ + (dz / distance) * WALK_LOOK_DISTANCE
    ]
  };
}

export function getCameraView(preset: CameraPreset, mode: CameraMode): CameraView {
  return mode === 'walk' ? createWalkView(WALK_STARTS[preset].position, WALK_STARTS[preset].target) : BIRD_VIEWS[preset];
}

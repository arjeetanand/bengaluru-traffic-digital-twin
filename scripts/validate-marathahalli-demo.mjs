import { readFile } from 'node:fs/promises';
import path from 'node:path';

const datasetPath = path.join(process.cwd(), 'public', 'data', 'marathahalli-demo.json');
const dataset = JSON.parse(await readFile(datasetPath, 'utf8'));
const errors = [];
const warnings = [];
const SUPPORTED_SCHEMA_VERSIONS = [1, 2, 3, 4];
const NODE_REFS_SCHEMA_VERSION = 4;
const CURRENT_NO_U_TURN_RELATION_ID = 'relation/18922642';
const SOURCE_JOIN_TOLERANCE_METRES = 1.5;
const uTurnValidation = {
  relationId: CURRENT_NO_U_TURN_RELATION_ID,
  status: 'not-run',
  movementSemantics: {
    sourceRelation: 'OSM_MAPPED_NO_U_TURN',
    modelledScenario: 'MODELLED_ONLY',
    legalPermission: 'NOT_ASSERTED'
  }
};

const requiredCollections = [
  'buildings', 'roads', 'footways', 'shops', 'places', 'signals', 'crossings', 'busStops', 'trees', 'sourceAnchors', 'bridgeSupports', 'railways', 'infrastructure'
];
// These collections are additive schema extensions. Older snapshots remain
// valid without them; refreshed compiler output validates them when present.
const additiveCollections = ['namedPlaces', 'treeRows'];
const collectionsToValidate = [
  ...requiredCollections,
  ...additiveCollections.filter((collection) => dataset[collection] !== undefined)
];
const pointCollections = new Set([
  'shops', 'signals', 'crossings', 'busStops', 'trees', 'sourceAnchors', 'bridgeSupports', 'namedPlaces'
]);
const validHeightSources = new Set(['osm:height', 'osm:building:levels', 'modelled:fallback']);

function finite(value, label) {
  if (!Number.isFinite(value)) errors.push(`${label} must be finite`);
}

function checkPosition(position, label) {
  if (!Array.isArray(position) || position.length !== 2) {
    errors.push(`${label} must be [x,z]`);
    return;
  }
  finite(position[0], `${label}[0]`);
  finite(position[1], `${label}[1]`);
}

function checkGeometry(geometry, label) {
  if (!Array.isArray(geometry) || geometry.length < 2) {
    errors.push(`${label} must contain at least two points`);
    return;
  }
  geometry.forEach((position, index) => checkPosition(position, `${label}[${index}]`));
}

function checkPolylineFeature(feature, label) {
  checkGeometry(feature.geometry, `${label}.geometry`);
  checkPosition(feature.centroid, `${label}.centroid`);

  if (!Array.isArray(feature.nodeRefs)) {
    if (dataset.schemaVersion >= NODE_REFS_SCHEMA_VERSION) {
      errors.push(`${label}.nodeRefs must be an array`);
    }
    return;
  }

  feature.nodeRefs.forEach((nodeRef, index) => {
    if (typeof nodeRef !== 'string' || nodeRef.length === 0) {
      errors.push(`${label}.nodeRefs[${index}] must be a non-empty source node ID`);
    }
  });

  if (Array.isArray(feature.geometry) && feature.nodeRefs.length !== feature.geometry.length) {
    errors.push(`${label}.nodeRefs length (${feature.nodeRefs.length}) must match geometry length (${feature.geometry.length})`);
  }
}

function distanceBetween(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) ||
    ![left[0], left[1], right[0], right[1]].every((value) => Number.isFinite(value))) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
}

if (!SUPPORTED_SCHEMA_VERSIONS.includes(dataset.schemaVersion)) errors.push('unsupported schemaVersion');
if (dataset.source?.provider !== 'OpenStreetMap') errors.push('source.provider must be OpenStreetMap');
if (!dataset.source?.attribution?.includes('OpenStreetMap contributors')) errors.push('OSM attribution is missing');
if (dataset.source?.license !== 'ODbL-1.0') errors.push('OSM license must be ODbL-1.0');

for (const key of ['lat', 'lon']) finite(dataset.origin?.[key], `origin.${key}`);
for (const key of ['minLat', 'minLon', 'maxLat', 'maxLon']) finite(dataset.bounds?.[key], `bounds.${key}`);
if (dataset.bounds?.minLat >= dataset.bounds?.maxLat) errors.push('latitude bounds are inverted');
if (dataset.bounds?.minLon >= dataset.bounds?.maxLon) errors.push('longitude bounds are inverted');

for (const collection of collectionsToValidate) {
  if (!Array.isArray(dataset[collection])) {
    errors.push(`${collection} collection is missing`);
    continue;
  }
  const ids = new Set();
  for (const feature of dataset[collection]) {
    if (!feature.id) errors.push(`${collection} feature is missing id`);
    if (ids.has(feature.id)) errors.push(`${collection} contains duplicate id ${feature.id}`);
    ids.add(feature.id);
    if (pointCollections.has(collection)) {
      checkPosition(feature.position, `${collection}.${feature.id}.position`);
    } else {
      checkPolylineFeature(feature, `${collection}.${feature.id}`);
    }
    if (feature.heightSource !== undefined && !validHeightSources.has(feature.heightSource)) {
      errors.push(`${collection}.${feature.id}.heightSource is unsupported`);
    }
  }
}

if (Array.isArray(dataset.namedPlaces)) {
  for (const feature of dataset.namedPlaces) {
    if (!feature.name || feature.tags?.name !== feature.name) {
      errors.push(`namedPlaces.${feature.id} must preserve its source name`);
    }
    if (!feature.tags?.place) errors.push(`namedPlaces.${feature.id} must preserve place=*`);
  }
}

if (Array.isArray(dataset.treeRows)) {
  for (const feature of dataset.treeRows) {
    if (feature.tags?.natural !== 'tree_row') {
      errors.push(`treeRows.${feature.id} must preserve natural=tree_row`);
    }
  }
}

const kadubeesanahalliAnchor = dataset.sourceAnchors.find((feature) =>
  /kadubeesanahalli underpass/i.test(feature.name || feature.tags?.name || '')
);
if (!kadubeesanahalliAnchor) {
  errors.push('sourceAnchors must preserve the Kadubeesanahalli Underpass junction node');
} else if (kadubeesanahalliAnchor.tags?.junction !== 'yes') {
  errors.push('Kadubeesanahalli Underpass source anchor must preserve junction=yes');
}

const kaadubeesanahalliAnchor = dataset.sourceAnchors.find((feature) =>
  /kaadubeesanahalli/i.test(feature.name || feature.tags?.name || '')
);
if (!kaadubeesanahalliAnchor) {
  errors.push('sourceAnchors must preserve the Kaadubeesanahalli locality node');
} else if (kaadubeesanahalliAnchor.tags?.place !== 'quarter') {
  errors.push('Kaadubeesanahalli source anchor must preserve place=quarter');
}

for (const infrastructureId of ['way/1302220812', 'way/1302220813', 'way/1225572735']) {
  const feature = dataset.infrastructure.find((candidate) => candidate.id === infrastructureId);
  if (!feature) {
    errors.push(`named source infrastructure ${infrastructureId} is missing`);
  } else if (feature.geometry.length < 3) {
    errors.push(`${infrastructureId} must preserve its source footprint geometry`);
  }
}

// These are the geometry anchors that make this demo a Marathahalli
// reconstruction rather than a generic junction. Keep the checks close to the
// serialized source data so a refreshed extract cannot silently restore the
// old east-west skywalk or mirrored ORR traffic directions.
const skywalkDeck = dataset.footways.find((feature) => feature.id === 'way/323729567');
if (!skywalkDeck) {
  errors.push('Marathahalli Skywalk source way/323729567 is missing');
} else {
  const [start, end] = [skywalkDeck.geometry[0], skywalkDeck.geometry.at(-1)];
  const deltaX = end[0] - start[0];
  const deltaZ = end[1] - start[1];
  if (Math.abs(deltaZ) <= Math.abs(deltaX)) {
    errors.push('Marathahalli Skywalk must run predominantly north-south in local coordinates');
  }
  if (skywalkDeck.tags?.bridge !== 'viaduct') {
    warnings.push('Marathahalli Skywalk source way is missing bridge=viaduct');
  }
}

for (const stairAnchor of [
  { id: 'way/323729569', expectedSteps: 27 },
  { id: 'way/323729566', expectedSteps: 42 }
]) {
  const stair = dataset.footways.find((feature) => feature.id === stairAnchor.id);
  if (!stair) {
    errors.push(`Marathahalli Skywalk stair ${stairAnchor.id} is missing`);
  } else if (Number(stair.tags?.step_count) !== stairAnchor.expectedSteps) {
    errors.push(`${stairAnchor.id} must preserve step_count=${stairAnchor.expectedSteps}`);
  }
}

const directionAnchors = [
  { id: 'way/376784366', label: 'ORR northbound source way', expectsIncreasingZ: true },
  { id: 'way/380787519', label: 'ORR southbound source way', expectsIncreasingZ: false }
];
for (const anchor of directionAnchors) {
  const road = dataset.roads.find((feature) => feature.id === anchor.id);
  if (!road) {
    errors.push(`${anchor.label} ${anchor.id} is missing`);
    continue;
  }
  const firstZ = road.geometry[0][1];
  const lastZ = road.geometry.at(-1)[1];
  const isIncreasingZ = lastZ > firstZ;
  if (isIncreasingZ !== anchor.expectsIncreasingZ) {
    errors.push(`${anchor.label} direction no longer matches the source way order`);
  }
}

// These are the current source-backed Namma Metro Phase 2A through tracks.
// They are long ways that cross the clip boundary, so this check catches a
// compiler regression that would silently replace the physical alignment with
// a hand-authored shortcut in the 3D scene.
for (const metroWayId of ['way/1551136768', 'way/1551136770']) {
  const metroWay = dataset.railways.find((feature) => feature.id === metroWayId);
  if (!metroWay) {
    errors.push(`Namma Metro source way ${metroWayId} is missing`);
  } else {
    if (metroWay.geometry.length < 10) errors.push(`${metroWayId} has too few clipped source points`);
    if (metroWay.tags?.name !== 'Namma Metro - Phase 2A') errors.push(`${metroWayId} lost its source name`);
    if (metroWay.tags?.bridge !== 'viaduct') warnings.push(`${metroWayId} is missing bridge=viaduct`);
  }
}

if (dataset.schemaVersion >= 2) {
  if (!Array.isArray(dataset.turnRestrictions)) {
    errors.push('turnRestrictions collection is missing');
    uTurnValidation.status = 'failed';
  } else {
    const restrictionIds = new Set();
    const sourceWayIds = new Set(dataset.roads.map((feature) => feature.id));
    const sourceWaysById = new Map(dataset.roads.map((feature) => [feature.id, feature]));
    for (const restriction of dataset.turnRestrictions) {
      if (!restriction.id || !restriction.restriction || !Array.isArray(restriction.members)) {
        errors.push('turn restriction is missing id, restriction, or members');
        continue;
      }
      if (restrictionIds.has(restriction.id)) errors.push(`turnRestrictions contains duplicate id ${restriction.id}`);
      restrictionIds.add(restriction.id);
      if (!restriction.members.some((member) => member.role === 'from')) {
        errors.push(`${restriction.id} is missing a from member`);
      }
      if (!restriction.members.some((member) => member.role === 'to')) {
        errors.push(`${restriction.id} is missing a to member`);
      }
      for (const member of restriction.members) {
        if (member.type === 'way' && !sourceWayIds.has(member.ref)) {
          errors.push(`${restriction.id} references missing source road ${member.ref}`);
        }
      }
    }
    if (dataset.stats?.turnRestrictions !== dataset.turnRestrictions.length) {
      errors.push('stats.turnRestrictions does not match the serialized collection');
    }

    const currentNoUTurn = dataset.turnRestrictions.find((restriction) => restriction.id === CURRENT_NO_U_TURN_RELATION_ID);
    if (!currentNoUTurn) {
      errors.push(`current source no_u_turn relation ${CURRENT_NO_U_TURN_RELATION_ID} is missing`);
      uTurnValidation.status = 'failed';
    } else if (currentNoUTurn.restriction !== 'no_u_turn') {
      errors.push(`${CURRENT_NO_U_TURN_RELATION_ID} must remain restriction=no_u_turn`);
      uTurnValidation.status = 'failed';
    } else {
      const roleMembers = new Map();
      for (const role of ['from', 'via', 'to']) {
        const matches = currentNoUTurn.members.filter((member) => member.role === role);
        if (matches.length !== 1) {
          errors.push(`${CURRENT_NO_U_TURN_RELATION_ID} must have exactly one ${role} way member`);
          continue;
        }
        const [member] = matches;
        if (member.type !== 'way') {
          errors.push(`${CURRENT_NO_U_TURN_RELATION_ID} ${role} member must be a way`);
          continue;
        }
        const sourceWay = sourceWaysById.get(member.ref);
        if (!sourceWay) {
          errors.push(`${CURRENT_NO_U_TURN_RELATION_ID} ${role} member ${member.ref} is missing from serialized roads`);
          continue;
        }
        if (!Array.isArray(sourceWay.geometry) || sourceWay.geometry.length < 2) {
          errors.push(`${CURRENT_NO_U_TURN_RELATION_ID} ${role} member ${member.ref} has no usable source geometry`);
          continue;
        }
        roleMembers.set(role, { member, sourceWay });
      }

      if (roleMembers.size === 3) {
        const fromWay = roleMembers.get('from').sourceWay;
        const viaWay = roleMembers.get('via').sourceWay;
        const toWay = roleMembers.get('to').sourceWay;
        const joins = [
          {
            label: 'from.end → via.start',
            left: fromWay.geometry.at(-1),
            right: viaWay.geometry[0]
          },
          {
            label: 'via.end → to.start',
            left: viaWay.geometry.at(-1),
            right: toWay.geometry[0]
          }
        ].map((join) => ({
          label: join.label,
          distanceMetres: distanceBetween(join.left, join.right),
          toleranceMetres: SOURCE_JOIN_TOLERANCE_METRES
        }));

        uTurnValidation.sourceWaySequence = ['from', 'via', 'to'].map((role) => ({
          role,
          id: roleMembers.get(role).member.ref,
          name: roleMembers.get(role).sourceWay.name || roleMembers.get(role).sourceWay.tags?.name || null
        }));
        uTurnValidation.joins = joins;

        for (const join of joins) {
          if (join.distanceMetres > SOURCE_JOIN_TOLERANCE_METRES) {
            errors.push(`${CURRENT_NO_U_TURN_RELATION_ID} ${join.label} source geometry gap is ${join.distanceMetres.toFixed(2)}m (max ${SOURCE_JOIN_TOLERANCE_METRES}m)`);
          }
        }

        uTurnValidation.status = joins.every((join) => join.distanceMetres <= SOURCE_JOIN_TOLERANCE_METRES)
          ? 'passed'
          : 'failed';
      } else {
        uTurnValidation.status = 'failed';
      }
    }
  }
} else {
  uTurnValidation.status = 'not-applicable';
}

const snapshotStats = dataset.stats || {};
for (const collection of requiredCollections) {
  if (snapshotStats[collection] !== dataset[collection]?.length) {
    errors.push(`stats.${collection} does not match the serialized collection`);
  }
}
for (const collection of additiveCollections) {
  const hasCollection = dataset[collection] !== undefined;
  const hasStat = snapshotStats[collection] !== undefined;
  if (hasCollection !== hasStat) {
    errors.push(`${collection} and stats.${collection} must be added together`);
  } else if (hasCollection && snapshotStats[collection] !== dataset[collection].length) {
    errors.push(`stats.${collection} does not match the serialized collection`);
  }
}

if (dataset.roads.length < 100) warnings.push(`only ${dataset.roads.length} road ways are in the clipped snapshot`);
if (dataset.footways.length < 50) warnings.push(`only ${dataset.footways.length} footway ways are in the clipped snapshot`);
if (dataset.shops.length < 20) warnings.push(`only ${dataset.shops.length} POIs are in the clipped snapshot`);
if (dataset.bridgeSupports.length < 50) warnings.push(`only ${dataset.bridgeSupports.length} source bridge supports are in the clipped snapshot`);
for (const landmark of dataset.coverage?.landmarks || []) {
  if (!landmark.sourceBacked) warnings.push(`${landmark.name} is not source-backed in this snapshot`);
}

if (errors.length) {
  console.error('Marathahalli demo validation failed');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log('Marathahalli demo validation passed');
}

console.log(JSON.stringify({
  stats: dataset.stats,
  warnings,
  uTurnValidation
}, null, 2));

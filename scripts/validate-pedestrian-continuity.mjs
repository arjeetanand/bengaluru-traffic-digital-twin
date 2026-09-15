import fs from 'node:fs';

const snapshotPath = new URL('../public/data/marathahalli-demo.json', import.meta.url);
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const footways = snapshot.footways.filter((feature) => feature.geometry?.length >= 2);
const roads = snapshot.roads.filter((feature) => feature.geometry?.length >= 2);

const MODELLED_LINK_CHECKS = [
  {
    id: 'modelled/walk-link/kadubeesanahalli-oracle',
    from: { wayId: 'way/1385520133', point: [-655.3, -1897.3] },
    to: { wayId: 'way/1092536518', point: [-361.4, -1347.2] },
    evidenceRoadIds: ['way/203057627']
  },
  {
    id: 'modelled/walk-link/oracle-main-corridor',
    from: { wayId: 'way/1092536518', point: [-361.4, -1347.2] },
    to: { wayId: 'way/1072948599', point: [-255.3, -988.8] },
    evidenceRoadIds: ['way/203057627', 'way/985390127', 'way/1055883831']
  }
];

const distanceToSegment = (point, start, end) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const lengthSquared = dx * dx + dz * dz;
  const progress = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dz) / lengthSquared));
  const closest = [start[0] + dx * progress, start[1] + dz * progress];
  return Math.hypot(point[0] - closest[0], point[1] - closest[1]);
};

const distanceToPolyline = (point, geometry) => {
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 1; index < geometry.length; index += 1) {
    nearest = Math.min(nearest, distanceToSegment(point, geometry[index - 1], geometry[index]));
  }
  return nearest;
};

const requireFeature = (features, id, kind) => {
  const feature = features.find((candidate) => candidate.id === id);
  if (!feature) throw new Error(`Missing ${kind} ${id} in ${snapshot.source?.input || 'snapshot'}`);
  return feature;
};

const parent = footways.map((_, index) => index);
const find = (index) => {
  let cursor = index;
  while (parent[cursor] !== cursor) {
    parent[cursor] = parent[parent[cursor]];
    cursor = parent[cursor];
  }
  return cursor;
};
const union = (left, right) => {
  const leftRoot = find(left);
  const rightRoot = find(right);
  if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
};
const nodeOwners = new Map();
footways.forEach((feature, index) => {
  for (const nodeRef of feature.nodeRefs || []) {
    const owner = nodeOwners.get(nodeRef);
    if (owner === undefined) nodeOwners.set(nodeRef, index);
    else union(index, owner);
  }
});

const componentFor = (wayId) => {
  const index = footways.findIndex((feature) => feature.id === wayId);
  if (index < 0) throw new Error(`Missing footway ${wayId} while building connectivity audit`);
  return find(index);
};

const report = MODELLED_LINK_CHECKS.map((link) => {
  const fromFeature = requireFeature(footways, link.from.wayId, 'footway');
  const toFeature = requireFeature(footways, link.to.wayId, 'footway');
  const fromDistance = distanceToPolyline(link.from.point, fromFeature.geometry);
  const toDistance = distanceToPolyline(link.to.point, toFeature.geometry);
  if (fromDistance > 1.5 || toDistance > 1.5) {
    throw new Error(`${link.id} endpoint drift exceeds 1.5m (${fromDistance.toFixed(2)}m, ${toDistance.toFixed(2)}m)`);
  }

  const evidence = link.evidenceRoadIds.map((roadId) => {
    const road = requireFeature(roads, roadId, 'road');
    return { id: road.id, name: road.tags?.name || road.tags?.ref || 'unnamed' };
  });
  const fromComponent = componentFor(link.from.wayId);
  const toComponent = componentFor(link.to.wayId);
  if (fromComponent === toComponent) {
    throw new Error(`${link.id} does not bridge distinct source footway components`);
  }

  return {
    id: link.id,
    endpointAttachmentMetres: {
      from: Number(fromDistance.toFixed(2)),
      to: Number(toDistance.toFixed(2))
    },
    sourceFootwayComponents: { from: fromComponent, to: toComponent },
    sourceRoadEvidence: evidence
  };
});

console.log('Pedestrian continuity audit passed');
console.log(JSON.stringify({
  snapshot: snapshot.source?.input || 'public/data/marathahalli-demo.json',
  truthLevel: 'MODELLED_LINKS_ONLY',
  links: report
}, null, 2));

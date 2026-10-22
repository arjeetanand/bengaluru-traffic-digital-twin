import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = await readFile(new URL('../src/data/growthAtlas.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }
}).outputText;
const { GROWTH_PARKS, nearestParkForTarget, quoteAtlasCsvCell, truncateAtWord } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`);

assert.equal(quoteAtlasCsvCell('ordinary'), '"ordinary"');
assert.equal(quoteAtlasCsvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"', 'CSV cells must not execute as formulas');
assert.equal(truncateAtWord('Short title', 20), 'Short title');
assert.equal(truncateAtWord('alpha beta gamma', 10), 'alpha…', 'SEO text must stop at a word boundary within its limit');
const testAnchors = [{ id: 'bagmane', x: 0, z: 0 }, { id: 'ananta', x: 354, z: 0 }];
assert.equal(nearestParkForTarget(testAnchors, { x: 10, z: 0, distance: 770 }), 'bagmane');
assert.equal(nearestParkForTarget(testAnchors, { x: 177, z: 0, distance: 770 }), undefined, 'overlapping campus views must not flicker');
assert.equal(nearestParkForTarget(testAnchors, { x: 10, z: 0, distance: 1300 }), undefined, 'wide views must not change the dossier');

const roadSource = await readFile(new URL('../src/services/roadSampleGeometry.ts', import.meta.url), 'utf8');
const roadCode = ts.transpileModule(roadSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }
}).outputText;
const { nearestRoadVertexMeters } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(roadCode)}`);
assert.equal(nearestRoadVertexMeters({ lat: 12.94, lng: 77.69 }, [{ latitude: 12.94, longitude: 77.69 }]), 0);
assert.ok(nearestRoadVertexMeters({ lat: 12.94, lng: 77.69 }, [{ latitude: 12.96, longitude: 77.69 }]) > 1000);
assert.equal(nearestRoadVertexMeters({ lat: 12.94, lng: 77.69 }, [{ latitude: 'bad', longitude: 77.69 }]), undefined);

assert.deepEqual(
  new Set(GROWTH_PARKS.map((park) => park.id)).size,
  GROWTH_PARKS.length,
  'park IDs must be unique'
);
assert.deepEqual(
  ['prestige_tech_park', 'rmz_ecospace', 'bagmane_world_technology_centre', 'google_ananta'].every(
    (id) => GROWTH_PARKS.some((park) => park.id === id)
  ),
  true,
  'requested parks must be present'
);
assert.ok(['prestige_tech_park', 'rmz_ecospace', 'bagmane_world_technology_centre', 'google_ananta']
  .every((id) => GROWTH_PARKS.find((park) => park.id === id)?.mapCoverage === 'corridor'),
  'requested parks need the 3D corridor view');
assert.ok(
  GROWTH_PARKS.find((park) => park.id === 'bagmane_world_technology_centre')?.featuredCompanies.every((company) => company.logoUrl),
  'Bagmane company examples need the park logo wall'
);
assert.ok(
  ['rmz_ecospace', 'google_ananta'].every((id) => GROWTH_PARKS.find((park) => park.id === id)?.featuredCompanies.every((company) => company.logoUrl)),
  'Ecospace and Ananta company examples need marks'
);

for (const park of GROWTH_PARKS) {
  assert.ok(park.name && park.area && park.description && park.painHypothesis && park.seoQuery && park.leadAngle);
  assert.match(park.googlePlaceId, /^ChIJ[A-Za-z0-9_-]+$/, `${park.name} needs a Google Place ID`);
  assert.equal(new URL(park.sourceUrl).protocol, 'https:');
  assert.ok(park.featuredCompanies.length > 0, `${park.name} needs a company research example`);
  assert.equal(new Set(park.featuredCompanies.map((company) => company.name)).size, park.featuredCompanies.length);
  assert.ok(Number.isFinite(park.lat) && Number.isFinite(park.lng), `${park.name} needs a map anchor`);
  for (const company of park.featuredCompanies) {
    assert.ok(company.name, `${park.name} has an unnamed company`);
    assert.ok(company.website || company.linkedin, `${company.name} needs a public company link`);
    for (const url of [company.website, company.sourceUrl, company.linkedin, company.logoUrl].filter(Boolean)) {
      assert.equal(new URL(url).protocol, 'https:', `${company.name} needs a safe public link`);
    }
  }
}

const titles = [];
for (const park of GROWTH_PARKS) {
  const slug = park.id.replaceAll('_', '-');
  const html = await readFile(new URL(`../parks/${slug}/index.html`, import.meta.url), 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  titles.push(title);
  assert.ok(title?.includes(park.name), `${slug} needs its own title`);
  assert.match(html, new RegExp(`<meta name="description" content="[^"]*${park.name}[^"]*"`));
  assert.ok(html.includes(`<h1>${park.name}</h1>`), `${slug} needs a visible park heading`);
  for (const text of [park.area, park.description, park.painHypothesis, park.seoQuery, park.leadAngle, park.sourceUrl]) {
    assert.ok(html.includes(text), `${slug} is missing source-backed content: ${text}`);
  }
  assert.ok(html.includes(`href="/?park=${park.id}"`), `${slug} needs an atlas CTA`);
  assert.ok(html.includes(`query_place_id=${park.googlePlaceId}`), `${slug} needs the correct Maps listing`);
  for (const other of GROWTH_PARKS.filter((item) => item.id !== park.id)) {
    const otherSlug = other.id.replaceAll('_', '-');
    assert.ok(html.includes(`href="/parks/${otherSlug}/"`), `${slug} needs a working link to ${otherSlug}`);
  }
}
assert.equal(new Set(titles).size, GROWTH_PARKS.length, 'park page titles must be unique');

const busSource = await readFile(new URL('../src/services/cameraControlBus.ts', import.meta.url), 'utf8');
const busCode = ts.transpileModule(busSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }
}).outputText;
const { cameraControlBus } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(busCode)}`);
let delivered = null;
cameraControlBus.flyTo([1, 2, 3], [4, 5, 6]);
cameraControlBus.onFlyTo((position, target) => { delivered = [position, target]; });
assert.deepEqual(delivered, [[1, 2, 3], [4, 5, 6]], 'early camera focus must reach the mounted scene');

let userPan = null;
const stopUserPan = cameraControlBus.onUserPan((target) => { userPan = target; });
cameraControlBus.emitUserPan({ x: 12, z: 34, distance: 500 });
assert.deepEqual(userPan, { x: 12, z: 34, distance: 500 }, 'user pan must reach the atlas');
stopUserPan();
userPan = null;
cameraControlBus.emitUserPan({ x: 50, z: 60, distance: 700 });
assert.equal(userPan, null, 'unmounted atlas must not receive user pans');

console.log(`Growth atlas validation passed: ${GROWTH_PARKS.length} places, ${GROWTH_PARKS.reduce((count, park) => count + park.featuredCompanies.length, 0)} company research examples`);

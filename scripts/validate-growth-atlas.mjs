import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = await readFile(new URL('../src/data/growthAtlas.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }
}).outputText;
const { GROWTH_PARKS } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`);

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

for (const park of GROWTH_PARKS) {
  assert.ok(park.name && park.area && park.description && park.painHypothesis && park.seoQuery && park.leadAngle);
  assert.equal(new URL(park.sourceUrl).protocol, 'https:');
  assert.ok(park.featuredCompanies.length > 0, `${park.name} needs a sourced occupier`);
  assert.equal(new Set(park.featuredCompanies.map((company) => company.name)).size, park.featuredCompanies.length);
  assert.ok(Number.isFinite(park.lat) && Number.isFinite(park.lng), `${park.name} needs a map anchor`);
  for (const company of park.featuredCompanies) {
    assert.ok(company.name, `${park.name} has an unnamed company`);
    for (const url of [company.website, company.sourceUrl, company.linkedin].filter(Boolean)) {
      assert.equal(new URL(url).protocol, 'https:', `${company.name} needs a safe public link`);
    }
  }
}

const busSource = await readFile(new URL('../src/services/cameraControlBus.ts', import.meta.url), 'utf8');
const busCode = ts.transpileModule(busSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext }
}).outputText;
const { cameraControlBus } = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(busCode)}`);
let delivered = null;
cameraControlBus.flyTo([1, 2, 3], [4, 5, 6]);
cameraControlBus.onFlyTo((position, target) => { delivered = [position, target]; });
assert.deepEqual(delivered, [[1, 2, 3], [4, 5, 6]], 'early camera focus must reach the mounted scene');

console.log(`Growth atlas validation passed: ${GROWTH_PARKS.length} places, ${GROWTH_PARKS.reduce((count, park) => count + park.featuredCompanies.length, 0)} sourced company entries`);

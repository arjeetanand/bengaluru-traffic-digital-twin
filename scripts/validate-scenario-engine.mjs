// Boundary: this validates the modelled browser scenario engine only. SUMO,
// TraCI, and libsumo integration are not present in the current milestone.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const sourceFiles = {
  'types/index.ts': path.join(repositoryRoot, 'src', 'types', 'index.ts'),
  'data/scenarioDefinitions.ts': path.join(repositoryRoot, 'src', 'data', 'scenarioDefinitions.ts'),
  'simulation/scenarioEngine.ts': path.join(repositoryRoot, 'src', 'simulation', 'scenarioEngine.ts')
};

const require = createRequire(import.meta.url);
const typescript = require('typescript');

const sourceText = new Map();
const sourceRelativePaths = new Set(Object.keys(sourceFiles));

function rewriteRelativeImports(code, currentRelativePath) {
  return code.replace(/(\bfrom\s*['"]|\bimport\s*\(\s*['"])(\.\.?\/[^'"]+)(['"])/g, (match, prefix, specifier, suffix) => {
    const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(currentRelativePath), specifier));
    if (sourceRelativePaths.has(`${candidate}.ts`)) return `${prefix}${specifier}.js${suffix}`;
    if (sourceRelativePaths.has(`${candidate}/index.ts`)) return `${prefix}${specifier}/index.js${suffix}`;
    return match;
  });
}

async function prepareRuntimeModules() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'bengaluru-scenario-validation-'));

  for (const [relativePath, sourcePath] of Object.entries(sourceFiles)) {
    const source = await readFile(sourcePath, 'utf8');
    sourceText.set(relativePath, source);
    const transpiled = typescript.transpileModule(source, {
      compilerOptions: {
        target: typescript.ScriptTarget.ES2020,
        module: typescript.ModuleKind.ESNext,
        importsNotUsedAsValues: typescript.ImportsNotUsedAsValues.Remove,
        sourceMap: false
      },
      fileName: sourcePath
    }).outputText;
    const outputPath = path.join(tempRoot, relativePath.replace(/\.ts$/, '.js'));
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, rewriteRelativeImports(transpiled, relativePath));
  }

  return {
    tempRoot,
    engineUrl: pathToFileURL(path.join(tempRoot, 'simulation', 'scenarioEngine.js')).href,
    definitionsUrl: pathToFileURL(path.join(tempRoot, 'data', 'scenarioDefinitions.js')).href
  };
}

function readScenarioTypesFromSource() {
  const typesSource = sourceText.get('types/index.ts');
  const match = typesSource?.match(/export type ScenarioType\s*=([\s\S]*?);/);
  assert.ok(match, 'ScenarioType union must remain declared in src/types/index.ts');
  return [...match[1].matchAll(/'([^']+)'/g)].map(([, value]) => value);
}

function assertFiniteNonNegativeMetrics(metrics, label) {
  for (const [key, value] of Object.entries(metrics)) {
    assert.equal(typeof value, 'number', `${label}.${key} must be numeric`);
    assert.ok(Number.isFinite(value), `${label}.${key} must be finite`);
    assert.ok(value >= 0, `${label}.${key} must be non-negative`);
  }
}

function stableRunProjection(run) {
  return {
    scenarioId: run.scenario.id,
    scenarioType: run.scenario.type,
    baseline: run.baseline,
    counterfactual: run.counterfactual,
    delta: run.delta,
    seed: run.seed
  };
}

function makeBaseline(deriveScenarioBaseline) {
  return deriveScenarioBaseline(
    {
      currentSpeed: 32,
      freeFlowSpeed: 48,
      currentTravelTime: 360,
      freeFlowTravelTime: 270,
      confidence: 0.9,
      roadClosure: false,
      timestamp: 0,
      isDemo: true,
      congestionRatio: 32 / 48,
      networkHealth: 72
    },
    {
      networkHealth: 72,
      avgFlowPerHour: 1800,
      avgDelaySeconds: 90,
      idlingCO2KgHr: 120,
      fuelWastedLitersHr: 40,
      activeVehicleCount: 1400,
      congestionIndex: 'Heavy'
    },
    1400
  );
}

async function runValidation() {
  const runtime = await prepareRuntimeModules();

  try {
    const engine = await import(runtime.engineUrl);
    const definitionsModule = await import(runtime.definitionsUrl);
    const {
      DEFAULT_SCENARIO_SEED,
      deriveScenarioBaseline,
      getScenarioVisualState,
      runScenario
    } = engine;
    const { SCENARIO_DEFINITIONS } = definitionsModule;

    const supportedTypes = readScenarioTypesFromSource();
    assert.ok(supportedTypes.length > 0, 'ScenarioType union must contain at least one supported type');
    assert.equal(new Set(supportedTypes).size, supportedTypes.length, 'ScenarioType union must not contain duplicates');
    assert.ok(Array.isArray(SCENARIO_DEFINITIONS) && SCENARIO_DEFINITIONS.length > 0, 'declarative scenario definitions must be present');

    const definitionIds = new Set();
    for (const scenario of SCENARIO_DEFINITIONS) {
      assert.ok(scenario.id, 'each scenario definition needs an id');
      assert.equal(definitionIds.has(scenario.id), false, `duplicate scenario id: ${scenario.id}`);
      definitionIds.add(scenario.id);
      assert.ok(supportedTypes.includes(scenario.type), `${scenario.id} uses an unsupported scenario type`);
      assert.ok(Number.isFinite(scenario.window.startSeconds), `${scenario.id} start time must be finite`);
      assert.ok(Number.isFinite(scenario.window.endSeconds), `${scenario.id} end time must be finite`);
      assert.ok(scenario.window.startSeconds < scenario.window.endSeconds, `${scenario.id} window must have positive duration`);
      assert.ok(scenario.targetEdgeId, `${scenario.id} needs a target edge`);
      assert.ok(Array.isArray(scenario.spillover), `${scenario.id} needs a spillover list`);
    }

    const baseline = makeBaseline(deriveScenarioBaseline);
    assertFiniteNonNegativeMetrics(baseline, 'baseline');
    assert.equal(baseline.throughputVehiclesPerHour, 1800, 'baseline throughput must preserve avgFlowPerHour');
    assert.ok(baseline.averageTravelTimeMinutes > 0, 'baseline travel time must be positive');
    assert.ok(baseline.averageTravelTimeMinutes >= baseline.averageDelayMinutes, 'baseline travel time must cover delay');
    assert.ok(baseline.vehicleMinutes > 0, 'baseline vehicle-minutes must be positive');
    assert.ok(baseline.congestionRatio >= 0.18 && baseline.congestionRatio <= 1, 'baseline congestion ratio must be clamped to a sane range');

    for (const scenario of SCENARIO_DEFINITIONS) {
      const firstRun = runScenario(scenario, baseline, DEFAULT_SCENARIO_SEED);
      const secondRun = runScenario(scenario, baseline, DEFAULT_SCENARIO_SEED);
      assert.deepEqual(stableRunProjection(firstRun), stableRunProjection(secondRun), `${scenario.id} must be deterministic for the same seed`);
      assert.ok(Object.values(firstRun.delta).some((value) => value !== 0), `${scenario.id} must produce a non-zero scenario delta`);
    }

    const defaultScenario = SCENARIO_DEFINITIONS[0];
    const defaultRun = runScenario(defaultScenario, baseline, DEFAULT_SCENARIO_SEED);
    const beforeWindow = getScenarioVisualState(defaultRun, defaultScenario.window.startSeconds - 1, 'simulate');
    const atWindowStart = getScenarioVisualState(defaultRun, defaultScenario.window.startSeconds, 'simulate');
    const insideWindow = getScenarioVisualState(
      defaultRun,
      (defaultScenario.window.startSeconds + defaultScenario.window.endSeconds) / 2,
      'simulate'
    );
    const atWindowEnd = getScenarioVisualState(defaultRun, defaultScenario.window.endSeconds, 'simulate');
    const afterWindow = getScenarioVisualState(defaultRun, defaultScenario.window.endSeconds + 1, 'simulate');

    assert.equal(beforeWindow.isActive, false, 'scenario must be inactive before its timing window');
    assert.equal(atWindowStart.isActive, true, 'scenario must activate at window start');
    assert.equal(insideWindow.isActive, true, 'scenario must remain active inside its timing window');
    assert.equal(atWindowEnd.isActive, true, 'scenario must remain active at window end');
    assert.equal(afterWindow.isActive, false, 'scenario must deactivate after its timing window');
    assert.ok(insideWindow.progress > 0 && insideWindow.progress < 1, 'in-window visual progress must be normalized');

    const compareState = getScenarioVisualState(defaultRun, defaultScenario.window.startSeconds - 1, 'compare');
    assert.equal(compareState.isActive, true, 'compare mode must expose the scenario outside its active time window');
    assert.equal(compareState.progress, 1, 'compare mode must use completed visual progress');
    assert.equal(compareState.closedEdgeId, defaultScenario.targetEdgeId, 'compare state must identify the affected edge');
    assert.equal(compareState.affectedLane, defaultScenario.affectedLane, 'compare state must identify the affected lane');
    assert.equal(compareState.spilloverEdges.length, defaultScenario.spillover.length, 'compare state must expose spillover edges');

    const probeScenario = defaultScenario;
    for (const type of supportedTypes) {
      const typedScenario = { ...probeScenario, id: `${probeScenario.id}_type_${type}`, type };
      const typedRun = runScenario(typedScenario, baseline, DEFAULT_SCENARIO_SEED);
      assert.equal(typedRun.scenario.type, type, `${type} must be accepted by the scenario engine`);
      assert.ok(Object.values(typedRun.delta).some((value) => value !== 0), `${type} must produce a non-zero delta`);
    }

    console.log('Scenario engine validation passed');
    console.log(JSON.stringify({
      declarativeDefinitions: SCENARIO_DEFINITIONS.length,
      supportedScenarioTypes: supportedTypes,
      baseline,
      checks: {
        deterministicSameSeed: true,
        nonZeroScenarioDelta: true,
        compareVisualState: true,
        timingWindowActivation: true,
        supportedScenarioTypes: true,
        baselineMetricSanity: true
      }
    }, null, 2));
  } finally {
    await rm(runtime.tempRoot, { recursive: true, force: true });
  }
}

try {
  await runValidation();
} catch (error) {
  console.error('Scenario engine validation failed');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

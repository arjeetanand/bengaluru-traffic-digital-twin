# Scenario validation boundary

Run the source-level scenario checks with:

```bash
node scripts/validate-scenario-engine.mjs
```

The validator exercises the current declarative definitions and the
TypeScript scenario engine without requiring a browser or SUMO. It checks:

- deterministic output for repeated runs with the same seed;
- non-zero baseline-to-counterfactual deltas;
- compare-mode visual state, including the affected edge and spillover;
- activation at, and deactivation around, each scenario timing window;
- every `ScenarioType` currently declared in `src/types/index.ts`;
- finite, non-negative baseline metrics from a modelled demo flow.

The repository is currently a browser demo with a modelled traffic fallback.
No SUMO, TraCI, or libsumo adapter is present in this milestone. The
validation therefore proves declarative scenario and engine invariants only;
it does not prove microscopic traffic behaviour, route legality in SUMO,
network conversion, or a live simulation state stream. A real SUMO/TraCI
adapter remains future work unless it is added as a separate integration.

The script uses the TypeScript package already installed for the project to
transpile only the three relevant modules into a temporary directory. It does
not add dependencies or write generated files into the repository.

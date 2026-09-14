# Simulation architecture

The digital twin keeps simulation state separate from the Three.js scene. The
browser consumes a state stream; it is not the authority for microscopic
traffic physics.

## Current browser milestone

The reproducible path currently shipped in this repository is:

```text
OSM XML → local snapshot compiler → source-backed scene
TomTom/demo flow → baseline metrics
declarative scenario → seeded counterfactual metrics
simulation-local clock → visual scenario overlay + instanced traffic
```

The scenario engine is intentionally a modelled fallback. It makes the
baseline/counterfactual workflow testable offline, but it does not claim to be
SUMO output.

## SUMO integration boundary

The intended microscopic path is:

```text
OSM network
  ↓ netconvert / network preparation
SUMO .net.xml + demand/routes + signal program
  ↓ TraCI or libsumo adapter
simulation state snapshots
  ↓ HTTP/WebSocket transport
React application
  ↓
Three.js vehicles, signals, queues and labels
```

The adapter should own SUMO lifecycle, stepping, route legality, signal state,
vehicle/person state, and scenario mutations. The renderer should receive
normalized positions, headings, lane IDs, speeds, signal phases, and
simulation time, then update instanced meshes without putting every vehicle in
React state.

This repository does not currently include SUMO binaries, a `.net.xml` network,
or a TraCI/libsumo service. That is a deliberate milestone boundary: the
offline engine and validators make the UI contract reproducible while the
network conversion and calibration work remains explicit future integration,
not an implied live simulation.

## Reproduction

```bash
npm run data:compile
npm run data:validate
npm run corridor:validate
npm run scenario:validate
npm run build
```

See [`docs/scenario-validation.md`](scenario-validation.md) for the checks
covered by the current offline scenario engine and
[`docs/data-provenance/bellandur-marathahalli-corridor.md`](data-provenance/bellandur-marathahalli-corridor.md)
for the corridor source and licensing boundary.

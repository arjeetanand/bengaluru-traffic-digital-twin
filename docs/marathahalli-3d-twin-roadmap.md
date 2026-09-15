# Marathahalli 3D digital-twin roadmap

This roadmap is the working plan for the source-backed corridor demo. The
target flow is Oracle Tech Hub → Kadubeesanahalli → Marathahalli signal /
crossover → Innovative Multiplex → Kalamandir → Spice Garden, with the HAL
Old Airport Road connection retained in the same local coordinate system.

## Build contract

The scene has three explicit truth levels:

| Level | Meaning | Examples |
| --- | --- | --- |
| `SOURCE` | Geometry or metadata retained from the dated OSM extract | road vertices, footways, shops, crossings, signals, named infrastructure, metro track ways |
| `DERIVED` | Deterministic transformation of source data | local metre projection, ribbon widths from lane tags, ordered relation members, source-aligned train path |
| `MODELLED` | A visual or simulation assumption that the source does not publish | building height, facade detail, tree planting fill, traffic count, metro pier spacing, signal timing |

No modelled layer may be presented as a survey, live vehicle count, legal turn,
or current facade measurement. When an API or photorealistic provider is
enabled it augments the demo; it does not silently replace the local source
contract.

## Ten specialist workstreams

Each workstream owns a disjoint seam and returns a small evidence bundle: files
changed, source IDs used, validation command, and one browser capture or metric.

1. **Geospatial source steward** — refresh and validate OSM/Overpass extracts,
   source bounds, object IDs, timestamps, attribution, and corridor coverage.
2. **Road-network engineer** — derive one stationed road graph from source
   vertices, widths, elevations, underpass/flyover levels, and surface joins.
3. **Lane-and-turn engineer** — order relation members, model stop lines and
   signal permissions, implement U-turn connectors, and keep restricted turns
   visibly distinct until field-confirmed.
4. **Metro/structures engineer** — align the Phase 2A track ways, decks,
   hammerhead piers, clearances, ROB, underpass, and skywalk to source paths.
5. **Building/POI modeller** — attach named shops and landmarks to source
   points/footprints, add only clearly marked derived massing, and validate
   correct road side and camera framing.
6. **Footpath/accessibility engineer** — connect source footways and crossings,
   model ramps/steps/obstructions, compute walkability metrics, and test person
   routes at eye height.
7. **Greenery/street-scene artist** — render mapped trees first, fill planned
   planting deterministically, and check sight lines around signals and turns.
8. **Traffic/simulation engineer** — keep modelled demand separate from live
   flow, animate cars/bikes/buses/pedestrians/trains, and prepare a future
   SUMO/TraCI adapter boundary.
9. **Navigation/performance engineer** — tune bird/person cameras, collision and
   bounds, LOD/fog/instancing, mobile layout, and frame-time safeguards.
10. **Verification/release engineer** — run source validators, build, browser
    target-flow tests, console checks, visual comparison of shops/roads/turns/
    footpaths/trees/structures, and commit only a coherent milestone.

## Delivery sequence

### Demo gate A — source truth

Compile the dated local extract and validate counts, bounds, named anchors,
roads, footways, shops, crossings, signals, trees, infrastructure, metro ways,
and turn restrictions. Render a source-debug view that can be inspected without
any external API key.

### Demo gate B — shared geometry

Use the same source-aligned stationing for road ribbons, lane paths, markings,
footways, crossings, traffic, camera anchors, and structure placement. Compare
the exact source vertices at the crossover, underpass, metro bend, ROB, and
Spice Garden approach before adding facade polish. When the source footway
graph is disconnected, show the gap as an amber modelled link and preserve the
source-road evidence used to draw it.

### Demo gate C — movement and inspection

Verify signal phases, queued traffic, two-way U-turn traces, pedestrian routes,
skywalk stairs, metro train motion, footpath audit status, bird orbit, and
person navigation. The live TomTom path remains opt-in and quota-capped.

### Demo gate D — optional photorealistic provider

Only after the local demo is stable, allow an authorized Google Photorealistic
3D Tiles or another licensed 3D provider to stream buildings/terrain. Keep the
provider key out of source control, show attribution, handle failure in place,
and never imply that an API response is bundled or permanently current.

### Release gate

Run:

```sh
npm run data:compile
npm run data:validate
npm run metro:placement:validate
npm run pedestrian:validate
npm run crossover:validate
npm run corridor:validate
npm run scenario:validate
npm run build
```

Then exercise this browser flow:

```text
load → CROSSOVER → source/modelled U-turn audit → metro/traffic/trees/shops
→ AUDIT PATHS → PERSON → BIRD VIEW → KADUBEESANAHALLI → SPICE GARDEN
```

The release note must include the OSM retrieval date, source counts, any
modelled assumptions still visible, and the browser evidence used to accept
the milestone.

## Current honest boundary

The repository now contains a source-backed local 3D twin and a reproducible
modelled traffic/scenario engine. It is not survey-grade photogrammetry and it
does not publish a verified live vehicle count or legal U-turn plan. Exact
facade, elevation, metro-foundation, and turn-legality claims require an
authorized current 3D/engineering source or field survey; those inputs can be
plugged into the seams above without discarding the offline demo.

# Third-party sources and attribution

## Data

- `marathahalli_osm.xml` and the derived `public/data/marathahalli-demo.json`
  use OpenStreetMap data. The project displays `© OpenStreetMap contributors`
  and follows the [ODbL attribution requirements](https://www.openstreetmap.org/copyright).
  `scripts/compile-marathahalli-osm.mjs` documents the transformation.
- `src/data/bellandur-marathahalli-corridor.json` stores point anchors derived
  from a dated Overpass query. Its source IDs, retrieval date, processing
  boundary, and public corroboration links are recorded in
  [`docs/data-provenance/bellandur-marathahalli-corridor.md`](docs/data-provenance/bellandur-marathahalli-corridor.md).
- Public operator pages listed in that provenance note are used only to
  corroborate names/locality and are not copied into the repository.

## Software and optional providers

The runtime uses the open-source packages declared in `package.json`,
including React, Three.js, React Three Fiber, Drei, postprocessing, Lucide, and
`3d-tiles-renderer`. Their licenses are governed by their respective package
metadata and upstream repositories.

Google Photorealistic 3D Tiles are an optional provider path. No Google tiles,
basemap screenshots, or proprietary map assets are bundled in this repository.

## Optional Sketchfab reference models

The in-app Asset Lab embeds public Sketchfab viewers as visual references only;
they do not replace the source-backed road, turn, signal, or building geometry.
Each model is credited in the UI and linked to its license page:

- [Traffic light / Semaforo](https://sketchfab.com/3d-models/traffic-light-semaforo-3de9ce21f53945aaaab80e491e563ea3)
  by Adrian Flores — CC BY 4.0.
- [Indian Auto Rickshaw, Ahmedabad, Gujarat, India](https://sketchfab.com/3d-models/indian-auto-rickshaw-ahmedabad-gujarat-india-9075b08e08b149f099f601c3a239cfa1)
  by Doron Altaratz — CC BY 4.0.
- [Indian Bus](https://sketchfab.com/3d-models/indian-bus-67b7998f0f3341a8a96655f96adc1a77)
  by Parth — CC BY 4.0.
- [Elevated Mumbai Metro Station](https://sketchfab.com/3d-models/elevated-mumbai-metro-station-e1161f1d47d842e897624e13332ea63a)
  by NachiTheBlenderer — CC BY-SA 4.0; included as an India metro reference,
  not as a Marathahalli survey.

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

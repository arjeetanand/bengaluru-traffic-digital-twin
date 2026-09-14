# Bellandur ↔ Marathahalli corridor registry

This note documents the bounded anchor registry in [`src/data/bellandur-marathahalli-corridor.json`](../../src/data/bellandur-marathahalli-corridor.json).

## Scope

The registry covers a named point sequence from Bellandur through Ecospace, Devarabeesanahalli, Kadubeesanahalli, and Marathahalli. It is deliberately an anchor catalog, not a road-network extract: it contains no lane geometry, parcel boundaries, building footprints, or exact 3D building dimensions.

Bagmane Tech Park and the Mahadevapura/Hoodi clusters are included as `adjacent_context` employment-demand attractors for future phases. Their inclusion does not expand the Bellandur–Marathahalli spatial boundary.

## Primary geographic source

- Source: [OpenStreetMap](https://www.openstreetmap.org/) queried through the [Overpass API](https://overpass.kumi.systems/api/interpreter).
- License: [OpenStreetMap ODbL attribution](https://www.openstreetmap.org/copyright).
- Retrieved: 2026-09-15. The Overpass response reported `timestamp_osm_base=2026-07-24T11:04:51Z`.
- Attribution: `© OpenStreetMap contributors`.
- Processing: only named nodes, ways, and relations in the query bounding box were inspected; the retained OSM object IDs are recorded on each registry entry.
- Transformation: node coordinates are retained as source points. For named ways/relations, the Overpass `center` coordinate is stored as a `DERIVED` approximate point anchor. No raw geometry, tiles, or proprietary map response is stored.

The reproducible query shape was:

```overpass
[out:json][timeout:45];
nwr["name"~"^(RMZ Ecoworld|RMZ EcoWorld|Embassy TechVillage|Ecospace|Cessna Business Park|Prestige Tech Park|Salarpuria Softzone|Bagmane Tech Park|Bellandur|Bellanduru|Devarabeesanahalli|Kadubeesanahalli|Marathahalli)"](12.90,77.64,13.00,77.75);
out center;
```

The Mahadevapura/Hoodi context lookup used the same endpoint with bbox `12.93,77.67,13.02,77.75`, matching `Mahadevapura|Hoodi|Garudachar Palya|Doddanekundi|KR Puram`.

## Attractor corroboration sources

These public pages corroborate the identity, locality, or employment-campus role of selected attractors. They are not open geospatial datasets, and no page assets or proprietary map data are copied.

| Attractor | Public source | License / handling | Retrieved |
| --- | --- | --- | --- |
| RMZ Ecoworld | [RMZ project page](https://www.rmz.com/real-estate/rmz-office/spaces/rmz-ecoworld) | Public webpage; no separate open-data license asserted. Name and locality facts only. | 2026-09-15 |
| Embassy TechVillage | [Embassy Office Parks portfolio](https://www.embassyofficeparks.com/ourportfolio/bangalore/embassy-techvillage/) | Public webpage; no separate open-data license asserted. Address and campus-role facts only. | 2026-09-15 |
| Ecospace | [Brookfield Properties Ecospace](https://www.brookfieldproperties.com/en/our-properties/ecospace-1910) | Public webpage; no separate open-data license asserted. Address and campus-role facts only. | 2026-09-15 |
| Cessna Business Park | [CSEZ public Cessna SEZ record](https://csez.com/rti/map/cessna.php) | Public authority webpage; no separate open-data license asserted. Project/location/IT-ITES facts only. | 2026-09-15 |
| Bagmane Tech Park | [Bagmane portfolio page](https://www.bagmanegroup.com/portfolio/bagmane-tech-park) | Public webpage; no separate open-data license asserted. Business-park facts only. | 2026-09-15 |

Prestige Tech Park and Salarpuria Softzone are retained from named OSM commercial features in this slice. Their `kind` field is `ASSUMED` because this milestone does not yet have an operator or public-estate source in the registry.

## Provenance convention

Each stop and attractor has a `provenance` map with paths for every registry field:

- `MEASURED`: directly recorded from a cited public source, such as an OSM node coordinate or a public name/address statement.
- `DERIVED`: computed or interpreted from a source, such as an Overpass way/relation center or a bounded-slice classification.
- `ASSUMED`: a modeling or registry decision, such as the stable ID, `approximate=true`, a coarse point-only representation, or an uncorroborated technology-campus role.

Coordinates are all marked `approximate=true`. A coordinate being `MEASURED` means that the source recorded that point; it does not mean the point is a survey-grade campus centroid. Derived way/relation centers are explicitly tagged `DERIVED`.

## Validation

Run from the repository root:

```sh
node src/data/validate-bellandur-marathahalli-corridor.mjs
```

The validator checks JSON shape, required attractors, south-to-north stop ordering, Bengaluru-range coordinates, source references, field-level provenance coverage, and the absence of polygon/footprint/vertex fields.

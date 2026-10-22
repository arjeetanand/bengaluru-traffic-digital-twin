# Local migration handoff

Date: 2026-10-22

## Destination and Git

- Retained project: `/Users/arjeetanand/projects/3dSimulator`.
- Existing GitHub `origin` is unchanged. The imported source history is based on `codex/building-road-clearance` at `c03a78bb1f268881873c500aea438721d34cf6ab`.
- Dedicated branch: `codex/migrate-3dsimulator-local`.
- Migration source/config commit: `d6b97913737ff012b2456dae717071f109ee15f5`. It was pushed without force; `git ls-remote` matched local `HEAD` at that SHA. A follow-up documentation commit contains this handoff and checklist status.
- The branch is not merged into `main`.

## Change and data inventory

- Preserved the 14 uncommitted tracked source changes and the source Git history. Updated project links from the OneDrive path, configured Vite on `127.0.0.1:4003`, and added an ownership-checked process-tree restart in `run.sh`.
- Checked 103 unchanged tracked files by Git blob ID; 13 other modified tracked files and the private `.env` matched by SHA-256. The source README changes were confirmed before adding local setup details. The 13,113,855-byte `marathahalli_osm.xml` source placeholder could not be hydrated, but the destination bytes matched its committed Git blob; the northern OSM XML was downloaded.
- The `.env` file remains ignored and untracked. Both configured API-key variables are non-empty; their values were not displayed and provider validity was not tested.
- No database, log, resume, Python requirements, or Python virtual environment was found. No `node_modules` was copied; `dist/` was rebuilt. `.runtime/`, `node_modules/`, and `dist/` are git-ignored.
- Before cleanup, the source contained 136 project files outside `.git`. No neighboring folder was targeted.

## Setup and ports

```bash
npm ci
./run.sh
```

Open `http://127.0.0.1:4003/`. Preview/test maps to `5003`; secondary test maps to `6003`. `npm run build` runs the data compilers, validators, TypeScript, and Vite production build. This is a Node/Vite project; no Python environment is applicable.

## Verification

- `npm ci` completed and installed 155 packages from `package-lock.json`. npm reported 3 advisories (1 moderate, 2 high), a Three.js/postprocessing peer-version mismatch, and a deprecated `three-mesh-bvh`; no automated dependency fix was applied.
- `npm run build` passed: compilers, data/geometry/scenario/atlas/asset validators, TypeScript, and Vite (2,253 modules). Existing metro proximity/elevation evidence warnings remain; the `Scene` bundle is about 1.61 MB and triggers Vite's chunk-size warning.
- `GET /` returned HTTP 200; `/data/marathahalli-demo.json` returned HTTP 200 (6,933,122 bytes). There is no dedicated `/health` route.
- Isolated headless Chrome rendered the desktop atlas and local 3D map. The mobile layout rendered, but its embedded OpenStreetMap frame was unavailable because external hosts were blocked for the offline check.
- The local “Can you beat the morning rush?” flow opened the scenario control room and calculated a modelled run: average travel time changed from 9.7 to 8.8 minutes and delay from 4.1 to 3.0 minutes; replay and compare tabs enabled. Runtime checks made no live submissions or production-data writes; the requested GitHub branch push was the only external repository write.
- `run.sh` was syntax-checked and run twice against its own server. The second run stopped the owned Vite/esbuild process tree and restarted on port 4003. Ports 4001 and 4002 belong to other projects and were left untouched.

## Cleanup status

- Finder's `delete` command returned success for `/Users/arjeetanand/Library/CloudStorage/OneDrive-OracleCorporation/projects/3dSimulator`, and the original path is absent. However, Finder's Trash query returned zero items named `3dSimulator`. Its recoverable location is unconfirmed, so cleanup stopped here as instructed.
- The migration backups remain untouched: `/private/tmp/3dSimulator-migration-backup-36plh775` (37 files, 20 MB) and `/private/tmp/3dSimulator-incremental.bundle` (about 1.4 MB). No neighboring folders were removed. Confirm the source item's Trash/OneDrive recycle-bin location before further cleanup.

## Codex project folder

The saved Codex project record still points at the OneDrive path. Codex exposes no project-path update tool, and computer use was denied for `com.openai.codex` by its safety restriction. To set the local folder as primary, open the project's menu, choose **Edit project** → **Add folder**, select `/Users/arjeetanand/projects/3dSimulator`, then choose **Make primary**. See [OpenAI's project-folder instructions](https://learn.chatgpt.com/docs/projects).

## Remaining limitations

- The configured API-key values were preserved but not validated; external map/provider services were intentionally blocked during runtime checks.
- The source's exact Finder Trash location and the Codex project's primary-folder setting still require user-side confirmation/action.

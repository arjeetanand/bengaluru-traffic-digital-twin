# Local migration checklist

- [x] Preserve the OneDrive source and back up conflicting destination files.
- [x] Import the source branch history into `codex/migrate-3dsimulator-local`.
- [x] Copy the 14 uncommitted tracked source changes; verify private `.env` matches.
- [x] Set the local development port to 4003 and add an ownership-checked `run.sh`.
- [x] Update absolute project links to the local path and document local setup.
- [x] Verify unchanged tracked files by Git blob ID, copied working changes and `.env` by SHA-256; rebuild `dist/` locally.
- [x] Install locked npm dependencies with `npm ci`; no Python environment or requirements file exists.
- [x] Run `npm run build`, TypeScript, and the included data, geometry, scenario, atlas, and asset validators.
- [x] Start on port 4003; verify `/` and local demo data return HTTP 200, render desktop and mobile views, and run the offline morning-rush scenario in headless Chrome.
- [x] Commit eligible changes and push `codex/migrate-3dsimulator-local`; verify the remote SHA matches local `HEAD`.
- [blocked] Finder removed the source path, but its Trash query did not find the item. Per the cleanup stop rule, leave migration backups untouched until its recoverable location is confirmed.
- [blocked] Set the local folder as the primary Codex project folder; the Codex app safety restriction blocks UI control and no project-path API is available. Follow the manual steps in `HANDOFF.md`.

See `HANDOFF.md` for checksum scope, runtime evidence, Git status, cleanup targets, warnings, and the exact Codex project-folder step.

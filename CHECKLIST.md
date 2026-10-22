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
- [ ] Commit eligible changes, push the migration branch, and verify the remote SHA.
- [ ] Move only the source folder and migration backups to Trash after push verification.
- [ ] Set the local folder as the primary Codex project folder; Codex desktop is locked, so the user must make this folder primary in the project editor.

See `HANDOFF.md` for checksum scope, runtime evidence, Git status, cleanup targets, warnings, and the exact Codex project-folder step.

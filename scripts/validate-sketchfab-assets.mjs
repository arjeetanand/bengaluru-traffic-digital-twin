#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = path.join(projectDirectory, 'src', 'data', 'sketchfabAssets.ts');

const source = await readFile(registryPath, 'utf8');
const assetBlocks = source.match(/\n  \{\n    id:[\s\S]*?\n  \}(?=,?\n)/g) ?? [];
const errors = [];

function capture(block, pattern, label) {
  const match = block.match(pattern);
  if (!match) {
    errors.push(`${label} is missing`);
    return '';
  }
  return match[1];
}

if (assetBlocks.length < 4) {
  errors.push(`expected at least 4 static asset records, found ${assetBlocks.length}`);
}

assetBlocks.forEach((block, index) => {
  const label = `asset #${index + 1}`;
  const uid = capture(block, /uid:\s*'([^']+)'/, `${label}.uid`);
  const modelUrl = capture(block, /sketchfabUrl:\s*'([^']+)'/, `${label}.sketchfabUrl`);
  const embedUrl = capture(block, /embedUrl:\s*'([^']+)'/, `${label}.embedUrl`);
  const creator = capture(block, /creator:\s*'([^']+)'/, `${label}.creator`);
  const licenseLabel = capture(block, /label:\s*'(CC[^']+)'/, `${label}.license.label`);
  const licenseUrl = capture(
    block,
    /license:\s*\{[\s\S]*?url:\s*'([^']+)'/,
    `${label}.license.url`
  );

  if (uid && !/^[0-9a-f]{32}$/.test(uid)) {
    errors.push(`${label}.uid must be exactly 32 lowercase hexadecimal characters`);
  }

  for (const [field, value] of [['sketchfabUrl', modelUrl], ['embedUrl', embedUrl]]) {
    if (!value) continue;
    if (!value.startsWith('https://sketchfab.com/')) {
      errors.push(`${label}.${field} must start with https://sketchfab.com/`);
    }
    if (/localhost|127\.0\.0\.1|\[::1\]/i.test(value)) {
      errors.push(`${label}.${field} must not point to localhost`);
    }
    if (uid && !value.includes(uid)) {
      errors.push(`${label}.${field} must contain UID ${uid}`);
    }
  }

  if (licenseLabel && !licenseLabel.includes('CC')) {
    errors.push(`${label}.license.label must contain CC`);
  }
  if (licenseUrl && !/^https:\/\//.test(licenseUrl)) {
    errors.push(`${label}.license.url must be an HTTPS URL`);
  }
  if (!creator.trim()) {
    errors.push(`${label}.creator must not be empty`);
  }
});

if (errors.length > 0) {
  console.error(`Sketchfab asset validation failed:\n${errors.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`PASS Sketchfab asset registry: ${assetBlocks.length} static assets validated (UIDs, model/embed URLs, creators, CC licenses, and license URLs).`);
}

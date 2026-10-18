import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { analyze } from '../backend/dist/backend/src/analysis.js';

const require = createRequire(
  new URL('../backend/package.json', import.meta.url),
);
const sharp = require('sharp');
const base = process.env.GEMINI_API_BASE_URL || 'http://127.0.0.1:4900/gemini';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+(\/|$)/.test(base))
  throw new Error('Run this verification only against a local stand-in.');
process.env.GEMINI_API_BASE_URL = base;
const bytes = await sharp(
  await readFile(
    new URL('../backend/data/demo-media/lighting.jpg', import.meta.url),
  ),
)
  .webp()
  .toBuffer();
const image = { data: bytes.toString('base64'), mimeType: 'image/webp' };
const result = await analyze({ description: '', image }, 'local-simulation');
assert.equal(result.analysisSource, 'gemini');
assert.equal(result.imageAnalyzed, true);
assert.ok(result.suggestedTitle && result.suggestedDescription);
const unavailable = await analyze(
  { description: 'SIMULATE_UNAVAILABLE', image },
  'local-simulation',
);
assert.equal(unavailable.analysisSource, 'heuristic');
assert.equal(unavailable.imageAnalyzed, false);
const keyless = await analyze({ description: '', image }, undefined);
assert.equal(keyless.imageAnalyzed, false);
console.log(
  'Photo analysis: real HTTP request to local GenerateContent fixture, 503 fallback and missing key verified.',
);

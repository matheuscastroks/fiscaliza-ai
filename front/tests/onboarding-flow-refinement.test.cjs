const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

test('onboarding flow: photographic assets are packaged', () => {
  const imagesDir = path.join(ROOT_DIR, 'assets', 'images');
  const expectedImages = [
    'onboarding-territory.webp',
    'onboarding-follow.webp',
  ];

  for (const img of expectedImages) {
    const fullPath = path.join(imagesDir, img);
    assert.ok(fs.existsSync(fullPath), `Expected photographic asset ${img} to exist`);
    const stats = fs.statSync(fullPath);
    assert.ok(
      stats.size > 0,
      `Image ${img} must not be empty, got ${stats.size} bytes`,
    );
  }
});


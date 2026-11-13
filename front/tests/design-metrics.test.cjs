const { test } = require('node:test');
const assert = require('node:assert/strict');
const { countDesignAdditions } = require('./helpers/design-metrics.cjs');

test('design guard detects corner radii and numeric or string font weights', () => {
  assert.deepEqual(countDesignAdditions(`
    borderRadius: 4, borderTopLeftRadius: 12, borderBottomRightRadius: 8,
    borderTopRightRadius: layout.radius.md, borderBottomLeftRadius: 0,
    color: 'rgba(1, 2, 3, 0.5)', fontWeight: '600', fontWeight: 400,
    fontWeight: typography.body.fontWeight,
  `), { radiusLiterals: 3, rgbaColors: 1, fontWeightLiterals: 2 });
});

const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const ROOT_DIR = path.resolve(__dirname, '..');
const BRAND_DIR = path.join(ROOT_DIR, 'assets', 'brand');
const IMAGES_DIR = path.join(ROOT_DIR, 'assets', 'images');

// Brand palette tokens
const COLORS = {
  primary: '#16576C',
  darkPrimary: '#79CBD5',
  brandYellow: '#F4B400',
  ink: '#192D35',
  muted: '#556B73',
  white: '#FFFFFF',
  canvas: '#F3F7F8',
  darkCanvas: '#0B1316',
};

const PIN_AND_SKYLINE_PATH = `
  M 137.5 44
  C 75.4 44 25 94.4 25 156.5
  C 25 198.2 52.8 235.6 89.2 269.2
  C 122.5 237.5 174.5 218.5 228.2 221.2
  C 242.4 201.8 250 179.8 250 156.5
  C 250 94.4 199.6 44 137.5 44 Z

  M 50.2 163.2
  C 50.1 161.0 50 158.8 50 156.5
  C 50 108.2 89.2 69 137.5 69
  C 185.8 69 225 108.2 225 156.5
  C 225 161.8 224.5 167.0 223.6 172.0
  L 193.5 155.0
  L 176.0 140.2
  L 175.0 136.5
  L 173.4 136.0
  L 174.0 110.2
  L 181.2 109.2
  L 183.2 106.5
  L 191.5 105.5
  C 193.2 105.2 193.5 103.0 191.5 103.0
  L 171.2 103.0
  L 170.2 96.2
  C 170.0 94.2 168.8 93.2 167.0 93.2
  C 165.2 93.2 164.0 94.2 163.8 96.2
  L 162.8 103.0
  L 142.5 103.0
  C 140.5 103.0 140.8 105.2 142.5 105.5
  L 150.8 106.5
  L 152.8 109.2
  L 160.0 110.2
  L 160.6 136.0
  L 159.0 136.5
  L 158.0 139.5
  L 155.5 140.2
  C 150.5 137.2 145.5 136.0 139.5 136.5
  C 127.5 137.5 114.5 151.0 100.0 165.0
  L 74.0 145.5
  L 50.2 163.2 Z

  M 58 173
  L 123 173
  L 123 224.5
  L 99 237.2
  C 81.5 226.5 67.2 213.5 58 199.5
  L 58 173 Z

  M 153 182
  L 172 196
  L 172 210.5
  C 158.5 212.8 145.8 216.0 134 220.5
  L 134 196
  L 153 182 Z

  M 194.5 167
  L 216.5 183
  L 213 183
  L 213 209
  L 201 209
  L 201 192
  L 188.5 192
  L 188.5 209
  L 180 209
  L 180 197.5
  L 182.5 195.5
  L 176 190.5
  L 176 183
  L 172.5 183
  L 194.5 167 Z
`.trim();

const INTERIOR_BACKING_PATH =
  'M 137.5 64 C 188.6 64 230 105.4 230 156.5 C 230 192 200 218 137.5 245 C 75 218 45 192 45 156.5 C 45 105.4 86.4 64 137.5 64 Z';

const YELLOW_WEDGE_PATH = `
  M 101.2 280.8
  C 134.5 248.0 181.5 228.0 223.8 227.2
  C 202.5 256.5 169.5 288.5 144.0 311.0
  C 140.2 314.4 134.8 314.4 131.0 311.0
  C 121.2 302.2 111.0 291.8 101.2 280.8 Z
`.trim();

function buildWindowsMarkup(color) {
  return [
    `<rect x="70" y="185" width="13.5" height="25.5" rx="1" fill="${color}" />`,
    `<rect x="99" y="184" width="13" height="9.5" rx="1" fill="${color}" />`,
    `<rect x="99" y="199" width="13" height="16" rx="1" fill="${color}" />`,
    `<rect x="144" y="201" width="15" height="9" rx="1" fill="${color}" />`,
  ].join('\n  ');
}

function buildRaysMarkup(color) {
  return [
    `<line x1="216.5" y1="41" x2="227.5" y2="14" stroke="${color}" stroke-width="14" stroke-linecap="round" />`,
    `<line x1="240" y1="55" x2="265" y2="31" stroke="${color}" stroke-width="14" stroke-linecap="round" />`,
    `<line x1="253" y1="77" x2="281" y2="71" stroke="${color}" stroke-width="14" stroke-linecap="round" />`,
  ].join('\n  ');
}

function buildGlyphSvg({
  pinColor = COLORS.primary,
  yellowColor = COLORS.brandYellow,
  interiorBg = COLORS.white,
  includeRays = true,
  size = 256,
}) {
  const backing = interiorBg
    ? `  <path fill="${interiorBg}" d="${INTERIOR_BACKING_PATH}" />\n`
    : '';
  const rays = includeRays ? `\n  ${buildRaysMarkup(yellowColor)}` : '';
  return `<svg width="${size}" height="${size}" viewBox="16 4 288 316" fill="none" xmlns="http://www.w3.org/2000/svg">
${backing}  <path fill-rule="evenodd" clip-rule="evenodd" fill="${pinColor}" d="${PIN_AND_SKYLINE_PATH}" />
  ${buildWindowsMarkup(pinColor)}
  <path fill="${yellowColor}" d="${YELLOW_WEDGE_PATH}" />${rays}
</svg>
`;
}

function buildSparkleSvg({ yellowColor = COLORS.brandYellow, size = 256 } = {}) {
  return `<svg width="${size}" height="${size}" viewBox="16 4 288 316" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${buildRaysMarkup(yellowColor)}
</svg>
`;
}

function buildHorizontalLockupSvg({ dark = false } = {}) {
  const pinColor = dark ? COLORS.darkPrimary : COLORS.primary;
  const wordColor = dark ? '#F0F6F8' : COLORS.ink;
  const accentWordColor = dark ? COLORS.brandYellow : COLORS.primary;
  const taglineColor = dark ? '#8FA5AE' : COLORS.muted;
  const interiorBg = dark ? null : COLORS.white;
  const backing = interiorBg
    ? `    <path fill="${interiorBg}" d="${INTERIOR_BACKING_PATH}" />\n`
    : '';

  return `<svg width="920" height="320" viewBox="0 0 920 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(-8, -2)">
${backing}    <path fill-rule="evenodd" clip-rule="evenodd" fill="${pinColor}" d="${PIN_AND_SKYLINE_PATH}" />
    ${buildWindowsMarkup(pinColor)}
    <path fill="${COLORS.brandYellow}" d="${YELLOW_WEDGE_PATH}" />
    ${buildRaysMarkup(COLORS.brandYellow)}
  </g>
  <text x="304" y="178" font-family="'Instrument Sans', system-ui, -apple-system, sans-serif" font-size="104" font-weight="700" letter-spacing="-2" fill="${wordColor}">Fiscaliza <tspan fill="${accentWordColor}">aí</tspan></text>
  <text x="308" y="232" font-family="'Instrument Sans', system-ui, -apple-system, sans-serif" font-size="33" font-weight="400" fill="${taglineColor}">Seu bairro, em acompanhamento.</text>
</svg>
`;
}

// --- High-precision 4x4 MSAA vector rasterizer for PNG generation ---
function hexToRgba(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
    255,
  ];
}

function sampleCubic(p0, p1, p2, p3, steps = 28) {
  const pts = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * p0[0] +
      3 * mt * mt * t * p1[0] +
      3 * mt * t * t * p2[0] +
      t * t * t * p3[0];
    const y =
      mt * mt * mt * p0[1] +
      3 * mt * mt * t * p1[1] +
      3 * mt * t * t * p2[1] +
      t * t * t * p3[1];
    pts.push([x, y]);
  }
  return pts;
}

function parseSvgPathToPolygons(d) {
  const tokens = d
    .replace(/,/g, ' ')
    .trim()
    .split(/\s+/);
  const contours = [];
  let current = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') {
      if (current.length > 0) contours.push(current);
      cx = parseFloat(tokens[i++]);
      cy = parseFloat(tokens[i++]);
      sx = cx;
      sy = cy;
      current = [[cx, cy]];
    } else if (cmd === 'L') {
      cx = parseFloat(tokens[i++]);
      cy = parseFloat(tokens[i++]);
      current.push([cx, cy]);
    } else if (cmd === 'C') {
      const x1 = parseFloat(tokens[i++]);
      const y1 = parseFloat(tokens[i++]);
      const x2 = parseFloat(tokens[i++]);
      const y2 = parseFloat(tokens[i++]);
      const x3 = parseFloat(tokens[i++]);
      const y3 = parseFloat(tokens[i++]);
      for (const pt of sampleCubic([cx, cy], [x1, y1], [x2, y2], [x3, y3], 32)) {
        current.push(pt);
      }
      cx = x3;
      cy = y3;
    } else if (cmd === 'Z') {
      if (current.length > 0) {
        current.push([sx, sy]);
        contours.push(current);
        current = [];
      }
    }
  }
  if (current.length > 0) contours.push(current);
  return contours;
}

function rectToPolygon(x, y, w, h) {
  return [
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
      [x, y],
    ],
  ];
}

function pointInContoursEvenOdd(px, py, contours) {
  let inside = false;
  for (const poly of contours) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0];
      const yi = poly[i][1];
      const xj = poly[j][0];
      const yj = poly[j][1];
      const intersect =
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

function pointInCapsule(px, py, x1, y1, x2, y2, r) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const c1 = wx * vx + wy * vy;
  if (c1 <= 0) return wx * wx + wy * wy <= r * r;
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) {
    const dx = px - x2;
    const dy = py - y2;
    return dx * dx + dy * dy <= r * r;
  }
  const b = c1 / c2;
  const pbx = x1 + b * vx;
  const pby = y1 + b * vy;
  const dx = px - pbx;
  const dy = py - pby;
  return dx * dx + dy * dy <= r * r;
}

function renderSymbolPng({
  width,
  height,
  backgroundHex = null,
  pinHex = COLORS.primary,
  yellowHex = COLORS.brandYellow,
  interiorHex = COLORS.white,
  scale = 0.72,
}) {
  const png = new PNG({ width, height });
  const bg = backgroundHex ? hexToRgba(backgroundHex) : [0, 0, 0, 0];
  const pinRgba = hexToRgba(pinHex);
  const yellowRgba = hexToRgba(yellowHex);
  const interiorRgba = interiorHex ? hexToRgba(interiorHex) : null;

  const backingContours = parseSvgPathToPolygons(INTERIOR_BACKING_PATH);
  const mainContours = parseSvgPathToPolygons(PIN_AND_SKYLINE_PATH);
  const wedgeContours = parseSvgPathToPolygons(YELLOW_WEDGE_PATH);
  const winContours = [
    ...rectToPolygon(70, 185, 13.5, 25.5),
    ...rectToPolygon(99, 184, 13, 9.5),
    ...rectToPolygon(99, 199, 13, 16),
    ...rectToPolygon(144, 201, 15, 9),
  ];
  const rays = [
    [216.5, 41, 227.5, 14, 7],
    [240, 55, 265, 31, 7],
    [253, 77, 281, 71, 7],
  ];

  // Symbol coordinate viewBox is x: [16..304] (288), y: [4..320] (316)
  // Center of symbol bounding box is (153, 161) with max span 316
  const targetSpan = Math.min(width, height) * scale;
  const s = targetSpan / 316;
  const cxOut = width / 2;
  const cyOut = height / 2;
  const symCx = 153;
  const symCy = 161;

  // Fill background first
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      png.data[idx] = bg[0];
      png.data[idx + 1] = bg[1];
      png.data[idx + 2] = bg[2];
      png.data[idx + 3] = bg[3];
    }
  }

  const minX = Math.max(0, Math.floor(cxOut + (20 - symCx) * s - 2));
  const maxX = Math.min(width - 1, Math.ceil(cxOut + (292 - symCx) * s + 2));
  const minY = Math.max(0, Math.floor(cyOut + (4 - symCy) * s - 2));
  const maxY = Math.min(height - 1, Math.ceil(cyOut + (318 - symCy) * s + 2));

  const offsets = [0.125, 0.375, 0.625, 0.875];

  function evalSample(sx, sy) {
    // Check yellow rays
    for (const [x1, y1, x2, y2, r] of rays) {
      if (pointInCapsule(sx, sy, x1, y1, x2, y2, r)) return yellowRgba;
    }
    // Check yellow wedge
    if (pointInContoursEvenOdd(sx, sy, wedgeContours)) return yellowRgba;
    // Check windows
    if (pointInContoursEvenOdd(sx, sy, winContours)) return pinRgba;
    // Check main pin & skyline
    if (pointInContoursEvenOdd(sx, sy, mainContours)) return pinRgba;
    // Check interior backing
    if (interiorRgba && pointInContoursEvenOdd(sx, sy, backingContours)) {
      return interiorRgba;
    }
    return bg;
  }

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;
      for (let oy of offsets) {
        const sy = (y + oy - cyOut) / s + symCy;
        for (let ox of offsets) {
          const sx = (x + ox - cxOut) / s + symCx;
          const c = evalSample(sx, sy);
          const alpha = c[3] / 255;
          rSum += c[0] * alpha;
          gSum += c[1] * alpha;
          bSum += c[2] * alpha;
          aSum += alpha;
        }
      }
      const idx = (y * width + x) * 4;
      if (aSum === 0) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      } else {
        png.data[idx] = Math.round(rSum / aSum);
        png.data[idx + 1] = Math.round(gSum / aSum);
        png.data[idx + 2] = Math.round(bSum / aSum);
        png.data[idx + 3] = Math.round((aSum / 16) * 255);
      }
    }
  }

  return PNG.sync.write(png);
}

function main() {
  fs.mkdirSync(BRAND_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // 1. Write Brand SVGs
  fs.writeFileSync(
    path.join(BRAND_DIR, 'brand-glyph.svg'),
    buildGlyphSvg({
      pinColor: COLORS.primary,
      yellowColor: COLORS.brandYellow,
      interiorBg: COLORS.white,
      includeRays: true,
    }),
  );
  fs.writeFileSync(
    path.join(BRAND_DIR, 'brand-glyph-dark.svg'),
    buildGlyphSvg({
      pinColor: COLORS.darkPrimary,
      yellowColor: COLORS.brandYellow,
      interiorBg: null,
      includeRays: true,
    }),
  );
  fs.writeFileSync(
    path.join(BRAND_DIR, 'brand-glyph-negative.svg'),
    buildGlyphSvg({
      pinColor: COLORS.white,
      yellowColor: COLORS.white,
      interiorBg: null,
      includeRays: true,
    }),
  );
  fs.writeFileSync(
    path.join(BRAND_DIR, 'brand-pin.svg'),
    buildGlyphSvg({
      pinColor: COLORS.primary,
      yellowColor: COLORS.brandYellow,
      interiorBg: COLORS.white,
      includeRays: false,
    }),
  );
  fs.writeFileSync(
    path.join(BRAND_DIR, 'brand-pin-dark.svg'),
    buildGlyphSvg({
      pinColor: COLORS.darkPrimary,
      yellowColor: COLORS.brandYellow,
      interiorBg: null,
      includeRays: false,
    }),
  );
  fs.writeFileSync(
    path.join(BRAND_DIR, 'brand-pin-on-dark.svg'),
    buildGlyphSvg({
      pinColor: COLORS.white,
      yellowColor: COLORS.brandYellow,
      interiorBg: null,
      includeRays: false,
    }),
  );
  fs.writeFileSync(path.join(BRAND_DIR, 'brand-sparkle.svg'), buildSparkleSvg());
  fs.writeFileSync(
    path.join(BRAND_DIR, 'brand-horizontal.svg'),
    buildHorizontalLockupSvg({ dark: false }),
  );
  fs.writeFileSync(
    path.join(BRAND_DIR, 'brand-horizontal-dark.svg'),
    buildHorizontalLockupSvg({ dark: true }),
  );

  // 2. Write Images Icon SVG
  fs.writeFileSync(
    path.join(IMAGES_DIR, 'icon.svg'),
    buildGlyphSvg({
      pinColor: COLORS.primary,
      yellowColor: COLORS.brandYellow,
      interiorBg: COLORS.white,
      includeRays: true,
      size: 512,
    }),
  );

  // 3. Generate App Installation PNGs
  // iOS / Store Icon (1024x1024 on white background)
  fs.writeFileSync(
    path.join(IMAGES_DIR, 'icon.png'),
    renderSymbolPng({
      width: 1024,
      height: 1024,
      backgroundHex: COLORS.white,
      pinHex: COLORS.primary,
      yellowHex: COLORS.brandYellow,
      interiorHex: COLORS.white,
      scale: 0.72,
    }),
  );

  // Android Adaptive Icon Foreground (1024x1024 transparent, safe zone <= 60%)
  fs.writeFileSync(
    path.join(IMAGES_DIR, 'adaptive-icon.png'),
    renderSymbolPng({
      width: 1024,
      height: 1024,
      backgroundHex: null,
      pinHex: COLORS.primary,
      yellowHex: COLORS.brandYellow,
      interiorHex: COLORS.white,
      scale: 0.56,
    }),
  );

  // Splash Icon Light (512x512 transparent)
  fs.writeFileSync(
    path.join(IMAGES_DIR, 'splash-icon.png'),
    renderSymbolPng({
      width: 512,
      height: 512,
      backgroundHex: null,
      pinHex: COLORS.primary,
      yellowHex: COLORS.brandYellow,
      interiorHex: COLORS.white,
      scale: 0.82,
    }),
  );

  // Splash Icon Dark (512x512 transparent)
  fs.writeFileSync(
    path.join(IMAGES_DIR, 'splash-icon-dark.png'),
    renderSymbolPng({
      width: 512,
      height: 512,
      backgroundHex: null,
      pinHex: COLORS.darkPrimary,
      yellowHex: COLORS.brandYellow,
      interiorHex: null,
      scale: 0.82,
    }),
  );

  // Web Favicon (48x48 transparent)
  fs.writeFileSync(
    path.join(IMAGES_DIR, 'favicon.png'),
    renderSymbolPng({
      width: 48,
      height: 48,
      backgroundHex: null,
      pinHex: COLORS.primary,
      yellowHex: COLORS.brandYellow,
      interiorHex: COLORS.white,
      scale: 0.9,
    }),
  );

  console.log('Brand SVGs and PNG icons generated successfully.');
}

if (require.main === module) {
  main();
}

module.exports = { main };

/**
 * Generates the PWA icons: app/public/icon-192.png and icon-512.png.
 *
 * Written by hand rather than with a graphics library. The mark is a filled
 * ridge echoing the elevation profile on the site, so it needs a polygon fill,
 * a stroked path and a dot — all cheap to rasterise. Adding a native canvas
 * dependency to draw three shapes would cost more than it saves.
 *
 * Rendered at 4x and box-downsampled, which is a simple way to get clean edges
 * without writing an anti-aliaser.
 *
 *   node scripts/make-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'public');
const SS = 4;                                  // supersampling factor

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PINE = hex('#22443B');
const ICE = hex('#EEF1EF');
const GLOW = hex('#C94F6D');
const WHITE = [255, 255, 255];

/** Ridge control points, in a 512-unit design space. */
const RIDGE = [[40, 340], [130, 320], [190, 250], [250, 285], [310, 150], [370, 240], [430, 205], [472, 300]];
const PEAK = [310, 150];

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Distance from a point to the polyline, for stroking. */
function distToPolyline(x, y, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((x - x1) * dx + (y - y1) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx, py = y1 + t * dy;
    best = Math.min(best, Math.hypot(x - px, y - py));
  }
  return best;
}

function render(size, { inset }) {
  const big = size * SS;
  const buf = Buffer.alloc(big * big * 4);
  const scale = big / 512;

  // Shift the ridge in for maskable icons so a circular crop cannot clip it.
  const ridge = RIDGE.map(([x, y]) => [
    inset + (x - 40) * ((512 - 2 * inset) / 432),
    y + 20
  ]);
  const peak = [
    inset + (PEAK[0] - 40) * ((512 - 2 * inset) / 432),
    PEAK[1] + 20
  ];
  const fillPoly = [...ridge, [ridge[ridge.length - 1][0], 440], [ridge[0][0], 440]];

  for (let py = 0; py < big; py++) {
    for (let px = 0; px < big; px++) {
      const x = px / scale, y = py / scale;
      let [r, g, b] = PINE;

      if (pointInPolygon(x, y, fillPoly)) {
        // vertical gradient from glow to nearly nothing
        const t = Math.min(1, Math.max(0, (y - 140) / 300));
        const a = 0.55 * (1 - t) + 0.12 * t;
        r = r * (1 - a) + GLOW[0] * a;
        g = g * (1 - a) + GLOW[1] * a;
        b = b * (1 - a) + GLOW[2] * a;
      }

      if (distToPolyline(x, y, ridge) < 9) [r, g, b] = ICE;

      const dPeak = Math.hypot(x - peak[0], y - peak[1]);
      if (dPeak < 30) [r, g, b] = WHITE;
      if (dPeak < 24) [r, g, b] = GLOW;

      const o = (py * big + px) * 4;
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255;
    }
  }

  // box downsample
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const o = ((y * SS + sy) * big + (x * SS + sx)) * 4;
          r += buf[o]; g += buf[o + 1]; b += buf[o + 2];
        }
      }
      const n = SS * SS, o = (y * size + x) * 4;
      out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n); out[o + 3] = 255;
    }
  }
  return out;
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   // 8-bit RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;                                        // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const [size, inset, name] of [[192, 40, 'icon-192.png'], [512, 96, 'icon-512.png']]) {
  const png = encodePng(render(size, { inset }), size);
  writeFileSync(join(OUT, name), png);
  console.log(`  wrote ${name}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`);
}

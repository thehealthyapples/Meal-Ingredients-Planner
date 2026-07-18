/**
 * NORTH4 — Orchard palette extraction.
 *
 * Reads the canonical orchard artwork's real pixels and reports the colours
 * actually present in it, so the concept palette is derived rather than invented.
 * Pure Node: decodes the PNG with zlib, no image library and no browser.
 *
 * Analysis only. Not wired into the app; not a runtime dependency.
 *   npx tsx scripts/extract-orchard-palette.ts
 */
import { readFileSync } from "fs";
import { inflateSync } from "zlib";
import { resolve } from "path";

const ASSET = resolve("attached_assets/design/north_star/v2/ORCHARD.png");

interface Bitmap {
  width: number;
  height: number;
  /** RGB triplets, 3 bytes per pixel. */
  data: Buffer;
}

/** Decode a non-interlaced, 8-bit truecolour PNG (colour type 2 or 6). */
function decodePng(buf: Buffer): Bitmap {
  if (buf.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error("not a PNG");
  }
  let off = 8;
  let width = 0, height = 0, channels = 3;
  const idat: Buffer[] = [];

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.subarray(off + 4, off + 8).toString("ascii");
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      const bitDepth = body[8];
      const colorType = body[9];
      const interlace = body[12];
      if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
      if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported colour type ${colorType}`);
      if (interlace !== 0) throw new Error("interlaced PNG unsupported");
      channels = colorType === 6 ? 4 : 3;
    } else if (type === "IDAT") {
      idat.push(Buffer.from(body));
    } else if (type === "IEND") {
      break;
    }
    off += 12 + len;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 3);
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);

  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    raw.copy(cur, 0, p, p + stride);
    p += stride;

    // Undo the per-scanline filter (PNG spec §9.2).
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0; // left
      const b = prev[i];                                // up
      const c = i >= channels ? prev[i - channels] : 0; // upper-left
      let v = cur[i];
      switch (filter) {
        case 0: break;
        case 1: v = (v + a) & 0xff; break;
        case 2: v = (v + b) & 0xff; break;
        case 3: v = (v + ((a + b) >> 1)) & 0xff; break;
        case 4: {
          const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          v = (v + pr) & 0xff;
          break;
        }
        default: throw new Error(`bad filter ${filter} on row ${y}`);
      }
      cur[i] = v;
    }
    // Drop alpha if present; keep RGB.
    for (let x = 0; x < width; x++) {
      const s = x * channels, d = (y * width + x) * 3;
      out[d] = cur[s]; out[d + 1] = cur[s + 1]; out[d + 2] = cur[s + 2];
    }
    cur.copy(prev);
  }
  return { width, height, data: out };
}

/** Named regions of the artwork, as fractions of width/height. */
const REGIONS: Array<{ name: string; x0: number; y0: number; x1: number; y1: number }> = [
  { name: "sky / morning light (upper centre)", x0: 0.42, y0: 0.05, x1: 0.62, y1: 0.22 },
  { name: "sun flare (right horizon)", x0: 0.9, y0: 0.2, x1: 1.0, y1: 0.36 },
  { name: "blossom (left canopy)", x0: 0.02, y0: 0.55, x1: 0.2, y1: 0.85 },
  { name: "blossom (top canopy)", x0: 0.15, y0: 0.0, x1: 0.38, y1: 0.14 },
  { name: "canopy leaves (top)", x0: 0.55, y0: 0.0, x1: 0.8, y1: 0.16 },
  { name: "distant hills", x0: 0.52, y0: 0.33, x1: 0.78, y1: 0.44 },
  { name: "orchard rows (mid)", x0: 0.3, y0: 0.5, x1: 0.55, y1: 0.62 },
  { name: "sunlit grass (foreground)", x0: 0.42, y0: 0.72, x1: 0.68, y1: 0.95 },
  { name: "grass in shadow", x0: 0.62, y0: 0.62, x1: 0.85, y1: 0.75 },
  { name: "oak gate (right)", x0: 0.88, y0: 0.5, x1: 0.97, y1: 0.68 },
  { name: "gate post (deep shadow)", x0: 0.82, y0: 0.4, x1: 0.86, y1: 0.6 },
  { name: "tree trunk / bark", x0: 0.03, y0: 0.15, x1: 0.1, y1: 0.42 },
];

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const hex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

function fmt(r: number, g: number, b: number) {
  const h = rgbToHsl(r, g, b);
  return `${hex(r, g, b)}  hsl(${String(h.h).padStart(3)} ${String(h.s).padStart(3)}% ${String(h.l).padStart(3)}%)`;
}

const lum = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * k-means over a subsample, in RGB.
 * A mean over a region mixes sunlit grass and shadow stripes into mud; clusters
 * keep the light and the shadow as the separate colours they actually are.
 */
function kmeans(points: number[][], k: number, iters = 24) {
  // Deterministic seeding: spread the initial centroids along the luminance order.
  const ordered = [...points].sort((a, z) => lum(a[0], a[1], a[2]) - lum(z[0], z[1], z[2]));
  let centroids = Array.from({ length: k }, (_, i) =>
    [...ordered[Math.floor(((i + 0.5) / k) * (ordered.length - 1))]],
  );
  let assign = new Array(points.length).fill(0);

  for (let it = 0; it < iters; it++) {
    let moved = false;
    for (let i = 0; i < points.length; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const dr = points[i][0] - centroids[c][0];
        const dg = points[i][1] - centroids[c][1];
        const db = points[i][2] - centroids[c][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assign[i] !== best) { assign[i] = best; moved = true; }
    }
    const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const a = assign[i];
      sums[a][0] += points[i][0]; sums[a][1] += points[i][1];
      sums[a][2] += points[i][2]; sums[a][3]++;
    }
    centroids = centroids.map((c, i) =>
      sums[i][3] === 0 ? c : [sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]],
    );
    if (!moved && it > 0) break;
  }
  const counts = new Array(k).fill(0);
  assign.forEach((a) => counts[a]++);
  return centroids
    .map((c, i) => ({ rgb: c, share: counts[i] / points.length }))
    .sort((a, z) => z.share - a.share);
}

function main() {
  const bmp = decodePng(readFileSync(ASSET));
  const px = (x: number, y: number) => {
    const i = (y * bmp.width + x) * 3;
    return [bmp.data[i], bmp.data[i + 1], bmp.data[i + 2]];
  };

  console.log(`\nORCHARD.png — ${bmp.width}×${bmp.height}, ${bmp.width * bmp.height} pixels\n`);
  console.log("=".repeat(72));
  console.log("MATERIAL TRIADS — shadow / body / light, by luminance percentile");
  console.log("=".repeat(72));
  console.log("(p15 = how this material sits in shadow, p50 = its body, p85 = its lit face)");

  for (const reg of REGIONS) {
    const x0 = Math.floor(reg.x0 * bmp.width), x1 = Math.ceil(reg.x1 * bmp.width);
    const y0 = Math.floor(reg.y0 * bmp.height), y1 = Math.ceil(reg.y1 * bmp.height);
    const pxs: number[][] = [];
    for (let y = y0; y < Math.min(y1, bmp.height); y++) {
      for (let x = x0; x < Math.min(x1, bmp.width); x++) pxs.push(px(x, y));
    }
    pxs.sort((a, z) => lum(a[0], a[1], a[2]) - lum(z[0], z[1], z[2]));
    const at = (q: number) => pxs[Math.floor(q * (pxs.length - 1))];
    const [s, b, l] = [at(0.15), at(0.5), at(0.85)];
    console.log(
      `\n${reg.name}   (${pxs.length} px)\n` +
        `  shadow p15  ${fmt(s[0], s[1], s[2])}\n` +
        `  body   p50  ${fmt(b[0], b[1], b[2])}\n` +
        `  light  p85  ${fmt(l[0], l[1], l[2])}`,
    );
  }

  // Global k-means over an even subsample.
  const pts: number[][] = [];
  for (let y = 0; y < bmp.height; y += 3) {
    for (let x = 0; x < bmp.width; x += 3) pts.push(px(x, y));
  }
  console.log("\n" + "=".repeat(72));
  console.log(`ORCHARD CLUSTERS — k-means, k=10 over ${pts.length} sampled pixels`);
  console.log("=".repeat(72));
  for (const c of kmeans(pts, 10)) {
    console.log(`  ${fmt(c.rgb[0], c.rgb[1], c.rgb[2])}   ${(c.share * 100).toFixed(1).padStart(5)}%`);
  }

  // The six materials the palette must be built from, probed where they live.
  // A luminance/chroma filter isolates the material from the leaves around it.
  const MATERIALS: Array<{
    name: string;
    box: [number, number, number, number];
    keep: (r: number, g: number, b: number) => boolean;
    k: number;
  }> = [
    {
      name: "MORNING LIGHT (sky + flare, the light itself)",
      box: [0.4, 0.05, 1.0, 0.32],
      keep: (r, g, b) => lum(r, g, b) > 190,
      k: 3,
    },
    {
      name: "BLOSSOM WHITES (petals only, the lit ones)",
      box: [0.0, 0.5, 0.28, 0.95],
      keep: (r, g, b) => lum(r, g, b) > 175 && Math.max(r, g, b) - Math.min(r, g, b) < 60,
      k: 3,
    },
    {
      name: "NATURAL OAK (the gate timber)",
      box: [0.82, 0.36, 1.0, 0.78],
      keep: (r, g, b) => r > g && g > b && lum(r, g, b) > 45 && lum(r, g, b) < 190,
      k: 3,
    },
    {
      name: "FRESH GREENS (foliage + grass in light)",
      box: [0.2, 0.42, 0.85, 0.95],
      keep: (r, g, b) => g > b + 25 && lum(r, g, b) > 80,
      k: 4,
    },
    {
      name: "WARM STONE (the pale ground of the picture)",
      box: [0.35, 0.1, 0.85, 0.45],
      keep: (r, g, b) => lum(r, g, b) > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 70,
      k: 3,
    },
    {
      name: "SOFT SHADOWS (the dark end — what shadow is made of)",
      box: [0.0, 0.0, 1.0, 1.0],
      keep: (r, g, b) => lum(r, g, b) < 42,
      k: 3,
    },
  ];

  console.log("\n" + "=".repeat(72));
  console.log("THE SIX MATERIALS — clustered where each actually lives");
  console.log("=".repeat(72));

  for (const m of MATERIALS) {
    const [fx0, fy0, fx1, fy1] = m.box;
    const pool: number[][] = [];
    for (let y = Math.floor(fy0 * bmp.height); y < Math.ceil(fy1 * bmp.height) && y < bmp.height; y++) {
      for (let x = Math.floor(fx0 * bmp.width); x < Math.ceil(fx1 * bmp.width) && x < bmp.width; x++) {
        const p = px(x, y);
        if (m.keep(p[0], p[1], p[2])) pool.push(p);
      }
    }
    console.log(`\n${m.name}\n  ${pool.length} px matched`);
    if (pool.length < 200) { console.log("  — too few pixels to cluster"); continue; }
    const sub = pool.length > 60000 ? pool.filter((_, i) => i % Math.ceil(pool.length / 60000) === 0) : pool;
    for (const c of kmeans(sub, m.k)) {
      console.log(`    ${fmt(c.rgb[0], c.rgb[1], c.rgb[2])}   ${(c.share * 100).toFixed(1).padStart(5)}% of material`);
    }
  }

  // Where is the light? Column and row luminance profile.
  console.log("\n" + "=".repeat(72));
  console.log("LIGHT PROFILE — mean luminance by ninth (where the sun is)");
  console.log("=".repeat(72));
  const grid: string[][] = [];
  for (let gy = 0; gy < 3; gy++) {
    const row: string[] = [];
    for (let gx = 0; gx < 3; gx++) {
      let lum = 0, n = 0;
      for (let y = Math.floor((gy * bmp.height) / 3); y < Math.floor(((gy + 1) * bmp.height) / 3); y++) {
        for (let x = Math.floor((gx * bmp.width) / 3); x < Math.floor(((gx + 1) * bmp.width) / 3); x++) {
          const [r, g, b] = px(x, y);
          lum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
          n++;
        }
      }
      row.push((lum / n).toFixed(0).padStart(3));
    }
    grid.push(row);
  }
  console.log("   left   mid  right");
  ["top   ", "middle", "bottom"].forEach((label, i) => console.log(`${label} ${grid[i].join("   ")}`));
}

main();

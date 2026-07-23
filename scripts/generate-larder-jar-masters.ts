// LARDER_PRODUCTION_ASSET_GENERATION — generator for the 27 Living Larder jar
// PNG masters (25 ingredient families + empty + fallback-green).
//
// ONE parametric jar — the shared geometry of LARDER_JAR_SHARED_SPEC
// (living-details-manifest.ts § J) drawn once and reused for every file, so
// pixel-perfect family consistency is mechanical, not aspirational — plus
// per-family procedural contents from a seeded PRNG (deterministic: the same
// family always yields the same drawing). Chromium rasterises each SVG at
// 512×768 with omitBackground, producing genuine 8-bit RGBA transparency.
//
// Spec bindings (LARDER_JAR_SHARED_SPEC):
//   • front-on 90° elevation, floating (no furniture), one jar per file
//   • traditional clamp-top jar: clear glass body + clear glass lid,
//     brushed silver clasp, natural off-white sealing ring
//   • soft neutral-warm frontal daylight from slightly above-left
//   • minimal contact shadow
//   • representative 70% fill ±3% settling — NEVER quantity
//   • label rectangle x106 y438 w300 h112: scalloped chalkboard, restrained
//     side curves, subtle matte grain, NO baked wording (runtime text only)
//
// Usage: npx tsx scripts/generate-larder-jar-masters.ts
// Writes: client/src/assets/living-home/larder/jars/*.png (27 masters)
//         docs/reference-assets/living-larder-review/ (contact sheet)
//         prints {id: sha256} JSON for candidate registration.

import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve("client/src/assets/living-home/larder/jars");
const REVIEW_DIR = path.resolve("docs/reference-assets/living-larder-review");
const W = 512;
const H = 768;

// ── Shared jar geometry (identical in every file) ─────────────────────────────
const CX = 256;
const BODY = { x1: 96, x2: 416, yTop: 216, yBottom: 700, rBottom: 30, rTop: 12 };
const INTERIOR = { x1: 106, x2: 406, yTop: 224, yBottom: 690, rBottom: 24 };
const SEAL = { x1: 104, x2: 408, y1: 202, y2: 217, r: 6 }; // off-white ring
const LID = { x1: 112, x2: 400, y1: 150, y2: 204, rTop: 26 }; // clear glass dome
const LABEL = { x: 106, y: 438, w: 300, h: 112 }; // governed rectangle — blank
// 70% representative fill: surface sits 70% up the interior height.
const FILL_SURFACE_Y = INTERIOR.yBottom - 0.7 * (INTERIOR.yBottom - INTERIOR.yTop); // ≈ 363.8

// ── Deterministic PRNG (mulberry32 seeded from the family name) ───────────────
function seedOf(s: string): number {
  let h = 2166136261 >>> 0;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rngFor(family: string): () => number {
  let a = seedOf(family) || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Small SVG helpers ─────────────────────────────────────────────────────────
const deg = (r: number) => (r * 180) / Math.PI;
function ell(cx: number, cy: number, rx: number, ry: number, fill: string, rot = 0, extra = ""): string {
  return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" ${rot ? `transform="rotate(${deg(rot).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"` : ""} ${extra}/>`;
}
function circ(cx: number, cy: number, r: number, fill: string, extra = ""): string {
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" ${extra}/>`;
}
function rrect(x: number, y: number, w: number, h: number, r: number, fill: string, rot = 0, extra = ""): string {
  const cx = x + w / 2, cy = y + h / 2;
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r.toFixed(1)}" fill="${fill}" ${rot ? `transform="rotate(${deg(rot).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"` : ""} ${extra}/>`;
}
function pick<T>(rng: () => number, arr: readonly T[]): T { return arr[Math.floor(rng() * arr.length)]; }
function between(rng: () => number, a: number, b: number): number { return a + rng() * (b - a); }

// ── Contents region ───────────────────────────────────────────────────────────
interface Region { x1: number; x2: number; top: number; bottom: number }

/** Slightly irregular settled surface (granular) or gentle mound (powder). */
function surfacePath(rng: () => number, r: Region, kind: "granular" | "powder"): string {
  const pts: string[] = [`M ${r.x1} ${r.bottom}`, `L ${r.x1} ${(r.top + 4).toFixed(1)}`];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const x = r.x1 + ((r.x2 - r.x1) * i) / n;
    const dome = kind === "powder" ? -6 * Math.sin((Math.PI * i) / n) : 0;
    const jitter = kind === "granular" ? between(rng, -3.5, 3.5) : between(rng, -1, 1);
    pts.push(`L ${x.toFixed(1)} ${(r.top + dome + jitter).toFixed(1)}`);
  }
  pts.push(`L ${r.x2} ${r.bottom} Z`);
  return pts.join(" ");
}

/** Fill the region with a base gradient + settled surface so particle gaps never show through. */
function baseFill(rng: () => number, r: Region, id: string, light: string, dark: string, kind: "granular" | "powder"): string {
  return `
  <linearGradient id="base-${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/>
  </linearGradient>
  <path d="${surfacePath(rng, r, kind)}" fill="url(#base-${id})"/>`;
}

/** Iterate near-packed particle positions bottom-up. */
function packed(rng: () => number, r: Region, spacing: number, draw: (x: number, y: number) => string, edgeInset = 4): string {
  const out: string[] = [];
  for (let y = r.bottom - spacing * 0.4; y > r.top + spacing * 0.3; y -= spacing * 0.82) {
    const rowOffset = between(rng, 0, spacing);
    for (let x = r.x1 + edgeInset + rowOffset; x < r.x2 - edgeInset; x += spacing * between(rng, 0.85, 1.15)) {
      out.push(draw(x + between(rng, -spacing * 0.25, spacing * 0.25), y + between(rng, -spacing * 0.3, spacing * 0.3)));
    }
  }
  return out.join("");
}

// ── Per-family contents renderers ─────────────────────────────────────────────
type Renderer = (rng: () => number, r: Region) => string;

const flake = (pal: string[]): Renderer => (rng, r) =>
  baseFill(rng, r, "flake", pal[1], pal[2], "granular") +
  packed(rng, r, 9, (x, y) => ell(x, y, between(rng, 3.6, 6.2), between(rng, 2.2, 3.6), pick(rng, pal), between(rng, 0, Math.PI)));

const grain = (pal: string[], rx = 2.1, ry = 5.2): Renderer => (rng, r) =>
  baseFill(rng, r, "grain", pal[1], pal[2], "granular") +
  packed(rng, r, 6.4, (x, y) => ell(x, y, between(rng, rx * 0.85, rx * 1.15), between(rng, ry * 0.85, ry * 1.15), pick(rng, pal), between(rng, -0.9, 0.9)));

const disc = (pal: string[], radius = 3.6): Renderer => (rng, r) =>
  baseFill(rng, r, "disc", pal[1], pal[2], "granular") +
  packed(rng, r, radius * 2.25, (x, y) => {
    const rad = between(rng, radius * 0.85, radius * 1.12);
    return circ(x, y, rad, pick(rng, pal)) + circ(x - rad * 0.3, y - rad * 0.3, rad * 0.32, "rgba(255,255,255,0.28)");
  });

const bean = (pal: string[], hl: string, rx = 6.6, ry = 4.6): Renderer => (rng, r) =>
  baseFill(rng, r, "bean", pal[1], pal[2], "granular") +
  packed(rng, r, rx * 1.75, (x, y) => {
    const rot = between(rng, 0, Math.PI);
    return ell(x, y, between(rng, rx * 0.9, rx * 1.1), between(rng, ry * 0.9, ry * 1.1), pick(rng, pal), rot) +
      ell(x - 1.6, y - 1.4, rx * 0.32, ry * 0.3, hl, rot);
  });

const powder = (pal: string[], speckle: string, sparkle = false): Renderer => (rng, r) => {
  let dots = "";
  for (let i = 0; i < 1500; i++) {
    const x = between(rng, r.x1 + 3, r.x2 - 3);
    const y = between(rng, r.top - 4, r.bottom);
    if (y < r.top - 6 * Math.sin((Math.PI * (x - r.x1)) / (r.x2 - r.x1))) continue;
    dots += circ(x, y, sparkle && rng() < 0.12 ? 0.9 : between(rng, 0.4, 0.8), i % 3 ? speckle : pal[2], `opacity="${between(rng, 0.25, sparkle ? 0.9 : 0.55).toFixed(2)}"`);
  }
  return baseFill(rng, r, "powder", pal[0], pal[1], "powder") + dots;
};

const penne = (pal: string[], bore: string, speckled = false): Renderer => (rng, r) =>
  baseFill(rng, r, "penne", pal[1], pal[2], "granular") +
  packed(rng, r, 16, (x, y) => {
    const rot = between(rng, -1.2, 1.2);
    const c = pick(rng, pal);
    let s = rrect(x - 13, y - 5.5, 26, 11, 5, c, rot) +
      ell(x + 10.5 * Math.cos(rot), y + 10.5 * Math.sin(rot), 4.6, 3.4, bore, rot) +
      rrect(x - 12, y - 4.6, 24, 2.2, 1.1, "rgba(255,255,255,0.22)", rot);
    if (speckled) for (let i = 0; i < 4; i++) s += circ(x + between(rng, -11, 11), y + between(rng, -4, 4), 0.7, "#6b4a2e", `opacity="0.5"`);
    return s;
  }, 8);

const fusilli = (pal: string[], speckled = false): Renderer => (rng, r) =>
  baseFill(rng, r, "fusilli", pal[1], pal[2], "granular") +
  packed(rng, r, 17, (x, y) => {
    const rot = between(rng, 0, Math.PI);
    const c = pick(rng, pal);
    // A spiral read as three rounded ridges inside the grain's bounding box.
    let s = "";
    for (let i = -1; i <= 1; i++) {
      s += rrect(x - 11 + i * 2.4, y + i * 6 - 3.4, 22 - Math.abs(i) * 4, 6.6, 3.3, c, rot + 0.5);
      s += rrect(x - 10 + i * 2.4, y + i * 6 - 2.8, 20 - Math.abs(i) * 4, 1.6, 0.8, "rgba(255,255,255,0.25)", rot + 0.5);
    }
    if (speckled) for (let i = 0; i < 4; i++) s += circ(x + between(rng, -9, 9), y + between(rng, -8, 8), 0.7, "#6b4a2e", `opacity="0.5"`);
    return s;
  }, 9);

const chickpea: Renderer = (rng, r) =>
  baseFill(rng, r, "chick", "#dfc188", "#c3a56d", "granular") +
  packed(rng, r, 11.4, (x, y) => {
    const rad = between(rng, 4.8, 5.9);
    return circ(x, y, rad, pick(rng, ["#ecd3a0", "#e4c68c", "#dcbd80"])) +
      circ(x - rad * 0.28, y - rad * 0.3, rad * 0.4, "rgba(255,255,255,0.35)") +
      ell(x + rad * 0.28, y + rad * 0.22, rad * 0.3, rad * 0.2, "rgba(140,110,70,0.35)", 0.5);
  });

const mixedNuts: Renderer = (rng, r) => {
  const pal = ["#c89a66", "#a9743f", "#e3cfa8", "#8a5a33", "#d9b27e"];
  return baseFill(rng, r, "nuts", "#b98a58", "#8a5f38", "granular") +
    packed(rng, r, 15.5, (x, y) => {
      const kind = Math.floor(rng() * 4);
      const c = pick(rng, pal);
      if (kind === 0) return ell(x, y, 7.4, 4.9, c, between(rng, 0, Math.PI)) + ell(x - 1.8, y - 1.4, 2.2, 1.3, "rgba(255,255,255,0.3)"); // almond
      if (kind === 1) return circ(x - 3, y, 4.6, c) + circ(x + 3, y, 4.6, c) + ell(x, y, 2.2, 4.2, "rgba(90,60,35,0.45)"); // walnut halves
      if (kind === 2) return circ(x, y, 5.2, c) + ell(x, y - 3.2, 4.2, 2.2, "#e8d9b8"); // hazelnut w/ pale cap
      return ell(x, y, 6.8, 3.4, c, between(rng, 0.4, 1.1)) + ell(x, y, 5.2, 2.1, "rgba(255,255,255,0.22)", between(rng, 0.4, 1.1)); // cashew-ish
    }, 8);
};

const teardrop = (pal: string[], rx: number, ry: number): Renderer => (rng, r) =>
  baseFill(rng, r, "seed", pal[1], pal[2], "granular") +
  packed(rng, r, rx * 2.4, (x, y) => {
    const rot = between(rng, 0, Math.PI);
    return ell(x, y, rx, ry, pick(rng, pal), rot) +
      ell(x - rx * 0.2, y - ry * 0.25, rx * 0.4, ry * 0.32, "rgba(255,255,255,0.25)", rot);
  });

const tinySeed = (pal: string[], radius = 1.3): Renderer => (rng, r) => {
  let dots = "";
  for (let i = 0; i < 3200; i++) {
    const x = between(rng, r.x1 + 3, r.x2 - 3);
    const y = between(rng, r.top + 1, r.bottom);
    dots += circ(x, y, between(rng, radius * 0.7, radius * 1.15), pick(rng, pal));
  }
  return baseFill(rng, r, "tiny", pal[1], pal[pal.length - 1], "granular") + dots;
};

const quinoa: Renderer = (rng, r) =>
  baseFill(rng, r, "quinoa", "#e2d5b0", "#c9bb94", "granular") +
  packed(rng, r, 4.4, (x, y) => {
    const rad = between(rng, 1.7, 2.1);
    return circ(x, y, rad, pick(rng, ["#efe5c8", "#e8dcba", "#e0d2ac"])) +
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rad * 0.62).toFixed(1)}" fill="none" stroke="rgba(150,130,90,0.5)" stroke-width="0.5"/>`;
  });

const granola: Renderer = (rng, r) =>
  baseFill(rng, r, "granola", "#b57c33", "#8a5a24", "granular") +
  packed(rng, r, 13.5, (x, y) => {
    const kind = rng();
    if (kind < 0.55) { // cluster
      const c = pick(rng, ["#c8913f", "#b57c33", "#d5a355"]);
      return circ(x, y, between(rng, 4.8, 6.8), c) + circ(x + 3, y - 2, between(rng, 2.5, 3.8), pick(rng, ["#e0bc7a", "#c8913f"])) + circ(x - 3, y + 2, between(rng, 2, 3.2), c);
    }
    if (kind < 0.85) return ell(x, y, between(rng, 3.6, 5.4), between(rng, 2.2, 3.2), pick(rng, ["#ecdfc4", "#dcc9a4"]), between(rng, 0, Math.PI)); // oat flake
    return ell(x, y, 5.6, 3.6, pick(rng, ["#a9743f", "#8a5a33"]), between(rng, 0, Math.PI)); // nut piece
  }, 7);

const fallbackPellets: Renderer = (rng, r) => {
  // Uniform, smooth, rounded NON-FOOD geometric pellets — deliberately unmistakable
  // for any real ingredient. Base colour exactly visual-gap-green #63A844.
  let out = baseFill(rng, r, "gap", "#5a9a3e", "#4c8834", "granular");
  const R = 7;
  let row = 0;
  for (let y = r.bottom - R; y > r.top + R * 0.8; y -= R * 1.74, row++) {
    for (let x = r.x1 + R + (row % 2 ? R : 0) + 2; x < r.x2 - R - 2; x += R * 2.02) {
      out += circ(x, y, R, "#63A844") +
        circ(x - R * 0.3, y - R * 0.32, R * 0.34, "rgba(255,255,255,0.38)") +
        `<path d="M ${(x - R * 0.7).toFixed(1)} ${(y + R * 0.55).toFixed(1)} A ${R.toFixed(1)} ${R.toFixed(1)} 0 0 0 ${(x + R * 0.7).toFixed(1)} ${(y + R * 0.55).toFixed(1)}" fill="none" stroke="rgba(30,70,20,0.30)" stroke-width="1.4"/>`;
    }
  }
  return out;
};

// ── The 27 families ───────────────────────────────────────────────────────────
interface Family { family: string; kind: "granular" | "powder" | "none"; render: Renderer | null }
const FAMILIES: Family[] = [
  { family: "rolled-oats", kind: "granular", render: flake(["#ecdfc4", "#dcc9a4", "#c4ad85"]) },
  { family: "white-rice", kind: "granular", render: grain(["#f7f4ec", "#ece7d8", "#d8d2bd"]) },
  { family: "brown-rice", kind: "granular", render: grain(["#c79a63", "#b3854f", "#96703f"]) },
  { family: "mixed-rice", kind: "granular", render: grain(["#f0ece0", "#b3854f", "#463a30", "#c79a63"]) },
  { family: "white-penne", kind: "granular", render: penne(["#eddfa8", "#e2cf8e", "#d8c47e"], "#b09a5e") },
  { family: "wholemeal-penne", kind: "granular", render: penne(["#c09265", "#a97c50", "#9a7048"], "#7a5535", true) },
  { family: "white-fusilli", kind: "granular", render: fusilli(["#eddfa8", "#e2cf8e", "#d8c47e"]) },
  { family: "wholemeal-fusilli", kind: "granular", render: fusilli(["#c09265", "#a97c50", "#9a7048"], true) },
  { family: "red-lentils", kind: "granular", render: disc(["#ef9350", "#e07f3c", "#d97434"], 3.4) },
  { family: "green-lentils", kind: "granular", render: disc(["#8a8a58", "#74744a", "#6a6c44"], 3.6) },
  { family: "dried-chickpeas", kind: "granular", render: chickpea },
  { family: "black-beans", kind: "granular", render: bean(["#26242a", "#1b191f", "#141317"], "rgba(160,158,175,0.5)", 6.2, 4.4) },
  { family: "mixed-nuts", kind: "granular", render: mixedNuts },
  { family: "pumpkin-seeds", kind: "granular", render: teardrop(["#6d8752", "#5a7442", "#526b3c"], 4.2, 6.6) },
  { family: "plain-flour", kind: "powder", render: powder(["#f4efe4", "#eae3d2", "#d9d1bc"], "#cfc6ae") },
  { family: "quinoa", kind: "granular", render: quinoa },
  { family: "couscous", kind: "granular", render: tinySeed(["#eeddab", "#e2cf92", "#d8c384", "#c9b478"], 1.5) },
  { family: "pearl-barley", kind: "granular", render: grain(["#f0e8d2", "#e2d7ba", "#d5c8a6"], 3.1, 4.2) },
  { family: "kidney-beans", kind: "granular", render: bean(["#8c3a30", "#742c25", "#6b2721"], "rgba(220,150,135,0.5)", 6.8, 4.6) },
  { family: "cannellini-beans", kind: "granular", render: bean(["#f2ecdc", "#e6dcc4", "#dcd0b2"], "rgba(255,255,255,0.5)", 6.4, 4.2) },
  { family: "sunflower-seeds", kind: "granular", render: teardrop(["#cdc5b2", "#b8ae98", "#a89f8a"], 3.4, 5.4) },
  { family: "chia-seeds", kind: "granular", render: tinySeed(["#45423f", "#6b6660", "#b9b3a8", "#2e2c2a"], 1.2) },
  { family: "ground-almonds", kind: "powder", render: powder(["#ecd9b4", "#dfc99c", "#c6ae80"], "#b89a6c") },
  { family: "granola", kind: "granular", render: granola },
  { family: "sugar", kind: "powder", render: powder(["#fbfaf6", "#f1efe8", "#e0ddd2"], "#ffffff", true) },
  { family: "empty", kind: "none", render: null },
  { family: "fallback-green", kind: "granular", render: fallbackPellets },
];

// ── The jar itself (shared across every file) ─────────────────────────────────
function bodyPath(): string {
  const { x1, x2, yTop, yBottom, rBottom, rTop } = BODY;
  return `M ${x1} ${yTop + rTop} Q ${x1} ${yTop} ${x1 + rTop} ${yTop} L ${x2 - rTop} ${yTop} Q ${x2} ${yTop} ${x2} ${yTop + rTop} L ${x2} ${yBottom - rBottom} Q ${x2} ${yBottom} ${x2 - rBottom} ${yBottom} L ${x1 + rBottom} ${yBottom} Q ${x1} ${yBottom} ${x1} ${yBottom - rBottom} Z`;
}
function interiorPath(): string {
  const { x1, x2, yTop, yBottom, rBottom } = INTERIOR;
  return `M ${x1} ${yTop} L ${x2} ${yTop} L ${x2} ${yBottom - rBottom} Q ${x2} ${yBottom} ${x2 - rBottom} ${yBottom} L ${x1 + rBottom} ${yBottom} Q ${x1} ${yBottom} ${x1} ${yBottom - rBottom} Z`;
}
function lidPath(): string {
  const { x1, x2, y1, y2, rTop } = LID;
  return `M ${x1} ${y2} L ${x1} ${y1 + rTop} Q ${x1} ${y1} ${x1 + rTop} ${y1} L ${x2 - rTop} ${y1} Q ${x2} ${y1} ${x2} ${y1 + rTop} L ${x2} ${y2} Z`;
}
/** Scalloped chalkboard silhouette: rounded corners + one restrained concave curve per side. */
function labelPath(): string {
  const { x, y, w, h } = LABEL;
  const r = 16, c = 5; // corner scallop radius; side curve depth (restrained)
  const mx = x + w / 2, my = y + h / 2;
  return [
    `M ${x + r} ${y}`,
    `Q ${mx} ${y + c} ${x + w - r} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `Q ${x + w - c} ${my} ${x + w} ${y + h - r}`,
    `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `Q ${mx} ${y + h - c} ${x + r} ${y + h}`,
    `Q ${x} ${y + h} ${x} ${y + h - r}`,
    `Q ${x + c} ${my} ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

function labelGrain(rng: () => number): string {
  // Very subtle matte grain — a few dozen near-invisible chalk-dust flecks. No wording, ever.
  let out = "";
  for (let i = 0; i < 90; i++) {
    out += circ(between(rng, LABEL.x + 10, LABEL.x + LABEL.w - 10), between(rng, LABEL.y + 8, LABEL.y + LABEL.h - 8), between(rng, 0.4, 1.0), "rgba(255,255,255,0.05)");
  }
  return out;
}

function clasp(): string {
  // Brushed silver clamp: side hinge plates, wire bail arcs over the lid, lever.
  const silver = `<linearGradient id="silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e3e7"/><stop offset="0.5" stop-color="#b9bbc2"/><stop offset="1" stop-color="#8f929c"/></linearGradient>`;
  const wire = (x1: number, x2: number) =>
    `<path d="M ${x1} 214 C ${x1 - 10} 175 ${CX - 120} 132 ${CX} 132 C ${CX + 120} 132 ${x2 + 10} 175 ${x2} 214" fill="none" stroke="url(#silver)" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M ${x1} 214 C ${x1 - 10} 175 ${CX - 120} 132 ${CX} 132" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2" stroke-linecap="round"/>`;
  return silver +
    wire(BODY.x1 + 12, BODY.x2 - 12) +
    rrect(BODY.x1 - 8, 196, 20, 34, 5, "url(#silver)") +
    rrect(BODY.x2 - 12, 196, 20, 34, 5, "url(#silver)") +
    rrect(BODY.x1 - 5, 200, 5, 26, 2.5, "rgba(255,255,255,0.4)") +
    rrect(BODY.x2 - 9, 200, 5, 26, 2.5, "rgba(255,255,255,0.4)");
}

function jarSvg(fam: Family): string {
  const rng = rngFor(fam.family);
  // Natural settling: deterministic per-family surface offset within ±3% (±14px); we use ±8px.
  const settle = fam.kind === "none" ? 0 : between(rng, -8, 8);
  const region: Region = { x1: INTERIOR.x1 + 2, x2: INTERIOR.x2 - 2, top: FILL_SURFACE_Y + settle, bottom: INTERIOR.yBottom - 2 };

  const contents = fam.render
    ? `<g clip-path="url(#interior)">${fam.render(rng, region)}
       <rect x="${INTERIOR.x1}" y="${region.top - 10}" width="${INTERIOR.x2 - INTERIOR.x1}" height="${INTERIOR.yBottom - region.top + 10}" fill="url(#contentShade)"/></g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="interior"><path d="${interiorPath()}"/></clipPath>
    <linearGradient id="glassBody" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(210,222,228,0.30)"/>
      <stop offset="0.18" stop-color="rgba(240,246,248,0.14)"/>
      <stop offset="0.5" stop-color="rgba(228,236,240,0.10)"/>
      <stop offset="0.85" stop-color="rgba(214,224,230,0.16)"/>
      <stop offset="1" stop-color="rgba(196,210,218,0.32)"/>
    </linearGradient>
    <linearGradient id="contentShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="rgba(40,35,25,0.22)"/>
      <stop offset="0.16" stop-color="rgba(40,35,25,0.0)"/>
      <stop offset="0.8" stop-color="rgba(40,35,25,0.0)"/>
      <stop offset="1" stop-color="rgba(40,35,25,0.25)"/>
    </linearGradient>
    <linearGradient id="daylight" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="rgba(255,250,240,0.20)"/>
      <stop offset="0.45" stop-color="rgba(255,250,240,0.0)"/>
    </linearGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="soft2" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>

  <!-- minimal contact shadow (floating presentation, no furniture) -->
  <ellipse cx="${CX}" cy="708" rx="152" ry="12" fill="rgba(45,38,30,0.30)" filter="url(#soft)"/>

  <!-- clear glass body (back) -->
  <path d="${bodyPath()}" fill="url(#glassBody)" stroke="rgba(110,130,140,0.55)" stroke-width="2.2"/>

  <!-- contents -->
  ${contents}

  <!-- glass front: restrained reflections + soft frontal daylight from above-left -->
  <g>
    <rect x="${BODY.x1 + 18}" y="${BODY.yTop + 18}" width="26" height="${BODY.yBottom - BODY.yTop - 52}" rx="13" fill="rgba(255,255,255,0.20)" filter="url(#soft2)"/>
    <rect x="${BODY.x2 - 34}" y="${BODY.yTop + 30}" width="10" height="${BODY.yBottom - BODY.yTop - 80}" rx="5" fill="rgba(255,255,255,0.12)" filter="url(#soft2)"/>
    <path d="${bodyPath()}" fill="url(#daylight)"/>
    <path d="${bodyPath()}" fill="none" stroke="rgba(255,255,255,0.30)" stroke-width="1"/>
  </g>

  <!-- natural off-white sealing ring -->
  ${rrect(SEAL.x1, SEAL.y1, SEAL.x2 - SEAL.x1, SEAL.y2 - SEAL.y1, SEAL.r, "#efe8d9")}
  ${rrect(SEAL.x1 + 3, SEAL.y1 + 2, SEAL.x2 - SEAL.x1 - 6, 4, 2, "rgba(255,255,255,0.55)")}
  ${rrect(SEAL.x1, SEAL.y2 - 4, SEAL.x2 - SEAL.x1, 4, 2, "rgba(150,138,115,0.35)")}

  <!-- clear glass lid -->
  <path d="${lidPath()}" fill="url(#glassBody)" stroke="rgba(110,130,140,0.55)" stroke-width="2.2"/>
  <rect x="${LID.x1 + 16}" y="${LID.y1 + 8}" width="20" height="${LID.y2 - LID.y1 - 18}" rx="9" fill="rgba(255,255,255,0.22)" filter="url(#soft2)"/>
  <line x1="${LID.x1 + 3}" y1="${LID.y2 - 1.5}" x2="${LID.x2 - 3}" y2="${LID.y2 - 1.5}" stroke="rgba(110,130,140,0.40)" stroke-width="1.6"/>

  <!-- brushed silver clasp -->
  ${clasp()}

  <!-- governed chalkboard label — BLANK: runtime text only, never baked wording -->
  <path d="${labelPath()}" fill="#2c3134" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
  <path d="${labelPath()}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="1.5" transform="translate(0.5 0.5)"/>
  ${labelGrain(rng)}
</svg>`;
}

// ── Contact sheet (Home Owner review — equal scale, all 27) ───────────────────
function contactSheetHtml(ids: string[]): string {
  const cells = ids
    .map((id) => {
      const b64 = readFileSync(path.join(OUT_DIR, `${id}.png`)).toString("base64");
      return `<figure><img src="data:image/png;base64,${b64}" width="256" height="384" alt="${id}"/><figcaption>${id}</figcaption></figure>`;
    })
    .join("\n");
  return `<!doctype html><html><head><style>
    body { margin:0; background:#edeae3; font:14px "Nunito Sans",system-ui,sans-serif; color:#3a3a34; }
    header { padding:22px 28px 6px; }
    h1 { font-size:20px; font-weight:600; margin:0 0 4px; }
    p { margin:0; font-size:13px; color:#6b6a62; }
    main { display:grid; grid-template-columns:repeat(7,256px); gap:10px 8px; padding:16px 28px 28px; }
    figure { margin:0; text-align:center; background:#f4f2ec; border-radius:8px; padding:6px 2px; }
    figcaption { font-size:11px; color:#55544c; margin-top:2px; }
  </style></head><body>
  <header><h1>Living Larder jar masters — candidate review sheet</h1>
  <p>2026-07-23 · 27 candidates at equal scale (50%) · CANDIDATE ONLY — nothing on this sheet is approved; Home Owner review decides. Checkered/absent background = genuine transparency.</p></header>
  <main>${cells}</main></body></html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(REVIEW_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

  const checksums: Record<string, string> = {};
  const ids: string[] = [];
  for (const fam of FAMILIES) {
    const id = `tha-larder-jar-${fam.family}`;
    const svg = jarSvg(fam);
    await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
    const file = path.join(OUT_DIR, `${id}.png`);
    await page.screenshot({ path: file, omitBackground: true });
    checksums[id] = createHash("sha256").update(readFileSync(file)).digest("hex");
    ids.push(id);
    console.log(`✓ ${id}`);
  }

  // Contact sheet: all 27 together, equal scale, opaque review background.
  const sheetPage = await browser.newPage({ viewport: { width: 7 * 256 + 2 * 28 + 6 * 8, height: 600 }, deviceScaleFactor: 1 });
  await sheetPage.setContent(contactSheetHtml(ids), { waitUntil: "networkidle" });
  await sheetPage.screenshot({ path: path.join(REVIEW_DIR, "larder-jar-candidate-contact-sheet-20260723.png"), fullPage: true });
  await browser.close();

  writeFileSync(path.join(REVIEW_DIR, "checksums-20260723.json"), JSON.stringify(checksums, null, 2));
  console.log("\nCandidate checksums:\n" + JSON.stringify(checksums, null, 2));
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
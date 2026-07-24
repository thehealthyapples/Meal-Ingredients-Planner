/**
 * Living Larder presentation metrics (LIVING_LARDER_PRODUCTION_IMPLEMENTATION,
 * 2026-07-24). Pure numbers — no asset import lives here (J7: only
 * `larder-room.tsx` may reference the larder asset subtree).
 *
 * Two kinds of fact, both presentation-only and neither a claim about the
 * household's data:
 *
 *   • MEASURED artwork facts — each master's canvas and the alpha-channel
 *     content bounding box, measured from the exact approved bytes (alpha > 8).
 *     These let the room seat objects on real surfaces: a jar's feet are the
 *     bottom of its content box, a shelf's top surface is the top of its board's
 *     content box — so baselines come from measurement, never eyeballing.
 *
 *   • DECLARED real-world sizes (cm) — the front-elevation size each piece of
 *     furniture/artwork depicts, chosen once here so every object shares ONE
 *     scale (a 26 cm store jar can never render taller than a 75 cm drawer
 *     unit). Size is the ARTWORK's, and never varies with household data: fill,
 *     quantity and freshness are not represented (LARDER1 § 16).
 *
 * The room converts cm → px through one CSS custom property (--lvcm, px per
 * cm), so the whole elevation rescales together and relative scale is
 * structurally constant at every breakpoint.
 */

export interface LarderAssetMetrics {
  /** Master canvas [w, h] in artwork px. */
  readonly canvas: readonly [number, number];
  /** Alpha content bounding box [x0, y0, x1, y1] in artwork px (alpha > 8). */
  readonly content: readonly [number, number, number, number];
  /** Depicted real-world CONTENT height, cm (front elevation). Width follows the artwork ratio. */
  readonly cmHeight: number;
}

function m(
  canvas: readonly [number, number],
  content: readonly [number, number, number, number],
  cmHeight: number,
): LarderAssetMetrics {
  return { canvas, content, cmHeight };
}

/** Content-box helpers (fractions of the canvas, for CSS positioning). */
export function contentBox(a: LarderAssetMetrics) {
  const [w, h] = a.canvas;
  const [x0, y0, x1, y1] = a.content;
  return {
    left: x0 / w,
    top: y0 / h,
    width: (x1 - x0) / w,
    height: (y1 - y0) / h,
    bottom: (h - y1) / h,
  };
}

/** Rendered CANVAS height (cm) so that the content height equals cmHeight. */
export function canvasCmHeight(a: LarderAssetMetrics): number {
  const [, h] = a.canvas;
  const [, y0, , y1] = a.content;
  return (a.cmHeight * h) / (y1 - y0);
}

/** Rendered CANVAS width (cm), following the artwork's own aspect ratio. */
export function canvasCmWidth(a: LarderAssetMetrics): number {
  const [w, h] = a.canvas;
  return (canvasCmHeight(a) * w) / h;
}

// ── Joinery (House Register rows; byte-locked) ────────────────────────────────
export const JOINERY_METRICS = {
  "shelf-wide": m([1536, 512], [39, 211, 1497, 301], 7),
  "shelf-medium": m([1536, 512], [68, 179, 1468, 333], 8.5),
  "shelf-short": m([1536, 512], [178, 181, 1357, 331], 8.5),
  "spice-rack": m([1200, 768], [121, 197, 1078, 571], 22),
  "cupboard-double": m([1536, 1024], [325, 133, 1210, 890], 80),
  "cupboard-single": m([1024, 1536], [331, 302, 692, 1234], 118),
  "drawer-deep": m([1024, 1024], [136, 83, 888, 940], 74),
  "drawer-shallow": m([1024, 1024], [62, 171, 962, 852], 62),
  "prep-table": m([1536, 1024], [187, 212, 1349, 812], 78),
  "side-worktable": m([1536, 1024], [345, 208, 1190, 816], 76),
} as const;

export type JoineryId = keyof typeof JOINERY_METRICS;

// ── Jars (Life Register § J; only APPROVED families are ever rendered) ────────
// The large clamp-top store jar depicts ~26 cm; the small seed/spice jar ~11.5 cm.
export const JAR_METRICS: Readonly<Record<string, LarderAssetMetrics>> = {
  "tha-larder-jar-rolled-oats": m([512, 768], [75, 144, 411, 646], 26),
  "tha-larder-jar-white-rice": m([512, 768], [75, 144, 411, 646], 26),
  "tha-larder-jar-brown-rice": m([512, 768], [75, 144, 411, 646], 26),
  "tha-larder-jar-white-penne": m([512, 768], [104, 189, 385, 604], 26),
  "tha-larder-jar-plain-flour": m([512, 768], [75, 144, 411, 646], 26),
  "tha-larder-jar-sugar": m([512, 768], [75, 144, 411, 646], 26),
  "tha-larder-jar-chia-seeds": m([512, 768], [110, 240, 407, 555], 11.5),
};

// ── Produce (Life Register § P) ───────────────────────────────────────────────
export const PRODUCE_METRICS: Readonly<Record<string, LarderAssetMetrics>> = {
  "tha-larder-produce-apple-red": m([768, 768], [150, 145, 614, 605], 8),
  "tha-larder-produce-broccoli": m([768, 768], [53, 88, 715, 700], 13),
};

/**
 * The runtime chalk-label plate, as a fraction of the jar CANVAS — measured
 * from the production masters (the artwork's blank chalkboard plate; wording is
 * runtime text only, never baked — shared spec label law). One rectangle per
 * size class: the large jars share one composition; the small jar has its own.
 */
export const JAR_LABEL_FRACTION = {
  large: { left: 0.325, top: 0.535, width: 0.35, height: 0.115 },
  small: { left: 0.36, top: 0.535, width: 0.28, height: 0.1 },
} as const;

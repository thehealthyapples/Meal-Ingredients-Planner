// WS9 — Food Alternatives Engine.
//
// Given a food, suggest other foods that can fulfil a SIMILAR ROLE — across five
// curated types (dietary, meal-role, lower-UPF, cuisine, household adaptation).
//
// ── The single public entry point is `alternatives(request)` ──────────────────
// The WS9 investigation weighed three API shapes — alternatives(food),
// alternatives(food, goal), alternatives(food, context) — and recommends ONE:
//
//     alternatives(food, context?)
//
// Rationale (see the investigation doc for the full argument):
//   • alternatives(food) alone can't express the exclusion gate (vegan, GF) or
//     household adaptation, which the brief makes central — too thin.
//   • alternatives(food, goal) treats goal as a single scalar, but a real request
//     carries several things at once: a diet, a lower-UPF preference, a cuisine,
//     AND a household of eaters. A scalar goal can't hold all four.
//   • alternatives(food, context) is the WS8 `discover(request)` shape: one
//     endpoint, an optional bag of context, sections filtered by what's asked.
//     Absent context → all possibilities (alternatives are possibilities).
//     Present context → the exclusion gate narrows to what fits.
// One engine, two callers (the investigation's "one engine, two callers"): the
// same dietary pool answers an individual's request AND each member of a
// household adaptation.
//
// WS9 deliberately does NOT rank. Discovery ranks by familiarity; Alternatives
// must not, because reordering by "what you already eat" would imply the others
// are lesser. Editorial order is preserved as authored.

import { CANONICAL_SEED } from "../canonical/foods";
import {
  ALTERNATIVES_SEED,
  resolveAnchorKey,
  type AnchorSeed,
  type SeedOption,
} from "./alternatives-map";
import { isReasonTrustworthy } from "./trust";
import {
  SECTION_TITLES,
  type AlternativeContext,
  type AlternativeOption,
  type AlternativeRequest,
  type AlternativeSection,
  type AlternativeType,
  type AlternativesResult,
  type Diet,
  type Eater,
  type HouseholdAdaptation,
  type HouseholdAdaptationMember,
} from "./types";

const DEFAULT_LIMIT = 6;
const ALL_TYPES: AlternativeType[] = [
  "dietary",
  "meal_role",
  "lower_upf",
  "cuisine",
  "household",
];

// ── slug → name index (canonical + varieties), for enriching anchor names ──────

let _nameIndex: Map<string, string> | null = null;

function nameIndex(): Map<string, string> {
  if (_nameIndex) return _nameIndex;
  const idx = new Map<string, string>();
  for (const entry of CANONICAL_SEED) {
    idx.set(entry.food.slug, entry.food.name);
    for (const v of entry.varieties ?? []) idx.set(v.slug, v.name);
  }
  _nameIndex = idx;
  return idx;
}

function nameOf(slug: string, fallback: string): string {
  return nameIndex().get(slug) ?? fallback;
}

// ── gate helpers ───────────────────────────────────────────────────────────────

/** True when `option` satisfies EVERY requested diet (the exclusion gate). */
function satisfiesDiets(suitableFor: Diet[], diets: Diet[]): boolean {
  return diets.every((d) => suitableFor.includes(d));
}

/** Turn a seed option into a public option, applying the trust gate. */
function toOption(
  seed: SeedOption,
  type: AlternativeType,
): AlternativeOption | null {
  // Fail CLOSED: drop anything whose reason or note carries banned language.
  if (!isReasonTrustworthy(seed.reason)) return null;
  if (seed.note && !isReasonTrustworthy(seed.note)) return null;
  return {
    slug: seed.slug,
    name: seed.name,
    type,
    reason: seed.reason,
    note: seed.note,
    suitableFor: seed.suitableFor ?? [],
    cuisine: seed.cuisine,
    source: "editorial",
  };
}

// ── household adaptation (type 5) ──────────────────────────────────────────────

/**
 * One meal, different eaters. For each eater we find the SAME-ROLE food that fits
 * their hard dietary constraints, drawn from the anchor's dietary pool:
 *   • no constraints, or anchor already fits → they keep the shared anchor
 *   • a dietary option fits all their constraints → they take that option
 *   • nothing fits → honest fallback (a separate option may suit better)
 * This is the brief's cooked-breakfast / lasagne / pizza-night case, and it reuses
 * the exact same dietary pool an individual request uses — one engine, two callers.
 */
function adaptForHousehold(
  anchorSlug: string,
  anchorName: string,
  seed: AnchorSeed,
  eaters: Eater[],
): HouseholdAdaptation {
  const dietaryPool = (seed.options.dietary ?? [])
    .map((s) => toOption(s, "dietary"))
    .filter((o): o is AlternativeOption => o !== null);
  const anchorFits = seed.anchorSuitableFor ?? [];

  const members: HouseholdAdaptationMember[] = eaters.map((eater) => {
    const diets = eater.diets ?? [];

    // No constraints, or the shared dish already suits them → keep the anchor.
    if (diets.length === 0) {
      return {
        eater: eater.name, slug: anchorSlug, name: anchorName, shared: true,
        reason: `Enjoys the shared ${anchorName.toLowerCase()}.`,
      };
    }
    if (satisfiesDiets(anchorFits, diets)) {
      return {
        eater: eater.name, slug: anchorSlug, name: anchorName, shared: true,
        reason: `The shared ${anchorName.toLowerCase()} already suits ${eater.name}'s choices.`,
      };
    }

    // Otherwise find a same-role dietary option that fits all their constraints.
    const fit = dietaryPool.find((o) => satisfiesDiets(o.suitableFor, diets));
    if (fit) {
      return {
        eater: eater.name, slug: fit.slug, name: fit.name, shared: false,
        reason: `${fit.name} fills the same role for ${eater.name}.`,
      };
    }

    // Honest silence: no catalogued alternative — don't force a wrong one.
    return {
      eater: eater.name, slug: anchorSlug, name: anchorName, shared: false,
      reason: `No catalogued alternative yet for ${eater.name} — a separate option may suit better.`,
    };
  });

  return { anchor: { slug: anchorSlug, name: anchorName }, members };
}

// ── orchestrator ───────────────────────────────────────────────────────────────

/**
 * The SINGLE public entry point. Resolves the anchor, builds the requested
 * sections from the curated seed, applies the exclusion gate (context.diets) and
 * any cuisine/lower-UPF narrowing, runs the trust gate, caps per type, and — when
 * a household is supplied — attaches a per-eater adaptation. Empty sections are
 * omitted (empty is silent).
 */
export function alternatives(request: AlternativeRequest): AlternativesResult {
  const {
    food,
    context = {},
    types = ALL_TYPES,
    limitPerType = DEFAULT_LIMIT,
  } = request;

  const anchorKey = resolveAnchorKey(food);
  if (!anchorKey) {
    // Unknown food → silent, never a guess.
    return { anchor: null, sections: [] };
  }
  const seed = ALTERNATIVES_SEED[anchorKey];
  const anchorName = nameOf(anchorKey, seed.name);
  const anchor = { slug: anchorKey, name: anchorName };

  const wanted = resolveWantedTypes(types, context);
  const diets = context.diets ?? [];
  const sections: AlternativeSection[] = [];

  for (const type of ALL_TYPES) {
    if (type === "household") continue; // handled separately below
    if (!wanted.has(type)) continue;

    const built = (seed.options[type] ?? [])
      .map((s) => toOption(s, type))
      .filter((o): o is AlternativeOption => o !== null)
      // Exclusion gate: when diets are stated, keep only options that satisfy
      // ALL of them. This is a GATE, not a ranking — order is never changed.
      .filter((o) => diets.length === 0 || satisfiesDiets(o.suitableFor, diets))
      // Cuisine narrowing: only applies to the cuisine section.
      .filter(
        (o) =>
          type !== "cuisine" ||
          !context.cuisine ||
          (o.cuisine ?? "").toLowerCase().includes(context.cuisine.toLowerCase()),
      )
      .slice(0, limitPerType);

    if (built.length > 0) {
      sections.push({ type, title: SECTION_TITLES[type], options: built });
    }
  }

  const result: AlternativesResult = { anchor, sections };

  // Household adaptation (type 5) — only when eaters are supplied and wanted.
  const eaters = context.household?.eaters ?? [];
  if (eaters.length > 0 && wanted.has("household")) {
    result.adaptation = adaptForHousehold(anchorKey, anchorName, seed, eaters);
  }

  return result;
}

/**
 * Resolve which types to build. Starts from the caller's `types`, then honours the
 * `preferLowerUpf` philosophy flag: when set, only the lower-UPF section (and the
 * household adaptation, which is orthogonal) survive — a household that asked for
 * "less processed" shouldn't be shown dietary or cuisine swaps it didn't ask for.
 */
function resolveWantedTypes(
  types: AlternativeType[],
  context: AlternativeContext,
): Set<AlternativeType> {
  let wanted = new Set(types);
  if (context.preferLowerUpf) {
    wanted = new Set(
      Array.from(wanted).filter((t) => t === "lower_upf" || t === "household"),
    );
  }
  return wanted;
}

// ── demo formatter (not for production rendering) ─────────────────────────────

export function formatAlternatives(result: AlternativesResult): string {
  const lines: string[] = [];
  lines.push(`\n══ ${result.anchor ? result.anchor.name : "Unknown food"} ══`);
  if (result.sections.length === 0 && !result.adaptation) {
    lines.push("  (nothing trustworthy to suggest — staying silent)");
    return lines.join("\n");
  }
  for (const section of result.sections) {
    lines.push(`\n${section.title}:`);
    for (const o of section.options) {
      lines.push(`  • ${o.name}`);
      lines.push(`    ${o.reason}`);
      if (o.note) lines.push(`    (note: ${o.note})`);
    }
  }
  if (result.adaptation) {
    lines.push(`\nAdapting for the household (shared ${result.adaptation.anchor.name.toLowerCase()}):`);
    for (const m of result.adaptation.members) {
      const tag = m.shared ? " ✓ shared" : "";
      lines.push(`  • ${m.eater}: ${m.name}${tag}`);
      lines.push(`    ${m.reason}`);
    }
  }
  return lines.join("\n");
}

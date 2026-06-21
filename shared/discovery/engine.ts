// WS8 — Food Discovery Engine.
//
// Given a food (and optionally a household's tastes), surface a small set of
// other foods the household might genuinely enjoy — with a one-sentence "why".
//
// Built ON TOP of the WS7 relationship graph (shared/relationships). WS8 adds:
//   • the SIX discovery types (mapping WS7 edges + two new curated seeds)
//   • household context (familiarity ranking + broaden_horizons)
//   • the ranking philosophy (familiarity → editorial → cuisine → variety)
//   • the trust guard (no rankings, no judgement, no commerce)
//
// The graph is neutral. Discovery is the art of CHOOSING which links to show —
// and which to withhold. That choosing lives here.

import { CANONICAL_SEED } from "../canonical/foods";
import { getFoodRelationships } from "../relationships/food-graph";
import type { FoodRelationship } from "../relationships/food-graph";
import {
  CUISINE_SEED,
  getCuisinesForFood,
  type CuisineSeed,
} from "./cuisine-map";
import { SEASON_SEED, seasonForDate } from "./seasonal-map";
import { isReasonTrustworthy } from "./trust";
import {
  SECTION_TITLES,
  type DiscoverRequest,
  type DiscoveryResult,
  type DiscoverySection,
  type DiscoverySuggestion,
  type DiscoveryType,
  type UKSeason,
} from "./types";

const DEFAULT_LIMIT = 3;
const ALL_TYPES: DiscoveryType[] = [
  "similar",
  "cook_with",
  "explore_varieties",
  "broaden_horizons",
  "cuisine",
  "seasonal",
];

// ── slug → name index (canonical + varieties) ─────────────────────────────────

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

function nameOf(slug: string, fallback?: string): string {
  return nameIndex().get(slug) ?? fallback ?? slug;
}

// ── neighbour helper — "foods one comfortable step from X" ─────────────────────

/**
 * The lateral neighbours of a food: editorial similar_to + derived same_family.
 * Used both for the `similar` section and for broaden_horizons.
 *
 * NOTE: shares_benefits is deliberately EXCLUDED. The WS8 foundations
 * investigation found benefit-overlap WITHOUT a matching cooking role is the weak
 * "bacon→sardines" shape (pumpkin seeds→garlic, chicken→broad beans) — true on
 * paper, but a bad discovery. Similar-Food requires role agreement, which
 * similar_to (editorial) and same_family (same subcategory/role) both carry.
 */
function lateralNeighbours(slug: string): FoodRelationship[] {
  const graph = getFoodRelationships(slug);
  if (!graph) return [];
  return graph.relationships.filter(
    (r) => r.type === "similar_to" || r.type === "same_family",
  );
}

// ── familiarity ────────────────────────────────────────────────────────────────

/**
 * Builds the set of slugs the household is "familiar with" — the foods they
 * enjoy plus every lateral/cooking neighbour of those foods. A suggestion whose
 * slug is in this set is surfaced first (ranking signal only — never judgement).
 */
function buildFamiliaritySet(enjoys: string[]): Set<string> {
  const familiar = new Set<string>(enjoys);
  for (const slug of enjoys) {
    const graph = getFoodRelationships(slug);
    if (!graph) continue;
    for (const r of graph.relationships) {
      if (
        r.type === "similar_to" ||
        r.type === "same_family" ||
        r.type === "shares_benefits" ||
        r.type === "often_cooked_with"
      ) {
        familiar.add(r.slug);
      }
    }
  }
  return familiar;
}

// ── ranking ────────────────────────────────────────────────────────────────────

/**
 * The WS8 ranking philosophy, expressed as a stable comparator. NO numeric score
 * is exposed; ordering lives only in array position. Order of preference:
 *   1. Household familiarity   (adjacent to what they already enjoy)
 *   2. Editorial relationships (over derived/inferred)
 *   3. Same cuisine as anchor  (over cross-cuisine)
 *   4. Variety over obscurity  (proxy: appears in some curated cuisine seed)
 *   …then alphabetical, for determinism.
 */
function rankSuggestions(
  suggestions: DiscoverySuggestion[],
  anchorCuisines: Set<string>,
): DiscoverySuggestion[] {
  const sameCuisine = (slug: string) =>
    getCuisinesForFood(slug).some((c) => anchorCuisines.has(c.slug));
  const isKnownVariety = (slug: string) => getCuisinesForFood(slug).length > 0;

  return [...suggestions].sort((a, b) => {
    if (a.familiar !== b.familiar) return a.familiar ? -1 : 1;
    if (a.source !== b.source) return a.source === "editorial" ? -1 : 1;
    const ac = sameCuisine(a.slug);
    const bc = sameCuisine(b.slug);
    if (ac !== bc) return ac ? -1 : 1;
    const av = isKnownVariety(a.slug);
    const bv = isKnownVariety(b.slug);
    if (av !== bv) return av ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// ── section builders ─────────────────────────────────────────────────────────

function fromGraph(
  anchor: string,
  wsTypes: FoodRelationship["type"][],
  discoveryType: DiscoveryType,
  familiar: Set<string>,
): DiscoverySuggestion[] {
  const graph = getFoodRelationships(anchor);
  if (!graph) return [];
  const editorialTypes = new Set<FoodRelationship["type"]>([
    "similar_to",
    "often_cooked_with",
    "seasonal_with",
    "alternative_for_goal",
  ]);
  return graph.relationships
    .filter((r) => wsTypes.includes(r.type))
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      type: discoveryType,
      reason: r.explanation,
      familiar: familiar.has(r.slug),
      source: editorialTypes.has(r.type)
        ? ("editorial" as const)
        : ("derived" as const),
    }));
}

/** 4. Broaden horizons — household-aware. One step beyond the foods they enjoy. */
function broadenHorizons(
  enjoys: string[],
  exclude: Set<string>,
  familiar: Set<string>,
): DiscoverySuggestion[] {
  // candidate slug → { name, source, seededFrom: enjoyed names } so we can both
  // rank by how many enjoyed foods point to it and phrase a warm, true reason.
  const candidates = new Map<
    string,
    { name: string; source: "editorial" | "derived"; from: Set<string> }
  >();

  for (const enjoyedSlug of enjoys) {
    const enjoyedName = nameOf(enjoyedSlug);
    for (const n of lateralNeighbours(enjoyedSlug)) {
      if (exclude.has(n.slug) || enjoys.includes(n.slug)) continue;
      const existing = candidates.get(n.slug);
      const source: "editorial" | "derived" =
        n.type === "similar_to" ? "editorial" : "derived";
      if (existing) {
        existing.from.add(enjoyedName);
        // editorial provenance wins if any path was editorial
        if (source === "editorial") existing.source = "editorial";
      } else {
        candidates.set(n.slug, {
          name: n.name,
          source,
          from: new Set([enjoyedName]),
        });
      }
    }
  }

  const out: DiscoverySuggestion[] = [];
  for (const [slug, c] of Array.from(candidates)) {
    const fromList = Array.from(c.from);
    const lead = fromList.slice(0, 2).join(" and ");
    const reason =
      fromList.length === 1
        ? `You enjoy ${lead} — ${c.name.toLowerCase()} is a similar food you might not have tried yet.`
        : `You enjoy ${lead} — ${c.name.toLowerCase()} sits comfortably alongside them.`;
    out.push({
      slug,
      name: c.name,
      type: "broaden_horizons",
      reason,
      familiar: familiar.has(slug),
      source: c.source,
    });
  }
  return out;
}

/** 5. Cuisine exploration — emblematic foods of cuisines the household leans into. */
function cuisineExploration(
  anchorSlug: string | undefined,
  enjoys: string[],
  exclude: Set<string>,
  familiar: Set<string>,
): DiscoverySuggestion[] {
  // Which cuisines does this household / anchor already lean into? Require a
  // cuisine to be "earned" — at least one enjoyed/anchor food is emblematic of
  // it — so we never recommend a cuisine out of nowhere.
  const earned = new Map<string, CuisineSeed>();
  const seedFoods = [...(anchorSlug ? [anchorSlug] : []), ...enjoys];
  for (const slug of seedFoods) {
    for (const c of getCuisinesForFood(slug)) earned.set(c.slug, c);
  }

  const out: DiscoverySuggestion[] = [];
  const seen = new Set<string>(exclude);
  for (const cuisine of Array.from(earned.values())) {
    for (const f of cuisine.foods) {
      if (seen.has(f.slug) || enjoys.includes(f.slug) || f.slug === anchorSlug)
        continue;
      seen.add(f.slug);
      out.push({
        slug: f.slug,
        name: f.name,
        type: "cuisine",
        reason: `A common ${cuisine.name} ingredient — a natural next step if you enjoy that style of cooking.`,
        familiar: familiar.has(f.slug),
        source: "editorial",
      });
    }
  }
  return out;
}

/** 6. Seasonal exploration — foods at their UK peak right now. */
function seasonalExploration(
  season: UKSeason,
  exclude: Set<string>,
  enjoys: string[],
  familiar: Set<string>,
): DiscoverySuggestion[] {
  return SEASON_SEED[season]
    .filter((f) => !exclude.has(f.slug) && !enjoys.includes(f.slug))
    .map((f) => ({
      slug: f.slug,
      name: f.name,
      type: "seasonal" as DiscoveryType,
      reason: `At its best in the UK ${season} — a lovely time to enjoy ${f.name.toLowerCase()}.`,
      familiar: familiar.has(f.slug),
      source: "editorial" as const,
    }));
}

// ── orchestrator ───────────────────────────────────────────────────────────────

/**
 * The SINGLE public entry point. One endpoint, every discovery type — the caller
 * chooses which sections it wants via `types`. Returns only non-empty sections
 * (empty is silent). Suggestions are trust-checked (offending reasons dropped),
 * ranked by the WS8 philosophy, and capped at `limitPerType`.
 */
export function discover(request: DiscoverRequest): DiscoveryResult {
  const {
    food,
    household,
    types = ALL_TYPES,
    season,
    now = new Date(),
    limitPerType = DEFAULT_LIMIT,
  } = request;

  const enjoys = household?.enjoys ?? [];
  const familiar = buildFamiliaritySet(enjoys);

  const anchorGraph = food ? getFoodRelationships(food) : null;
  const anchor = anchorGraph
    ? { slug: anchorGraph.slug, name: anchorGraph.name }
    : food
      ? { slug: food, name: nameOf(food) }
      : null;

  // Don't re-suggest the anchor itself or things already enjoyed.
  const exclude = new Set<string>([
    ...(food ? [food] : []),
    ...(anchor ? [anchor.slug] : []),
    ...enjoys,
  ]);

  const anchorCuisines = new Set<string>(
    food ? getCuisinesForFood(food).map((c) => c.slug) : [],
  );

  const wanted = new Set(types);
  const sections: DiscoverySection[] = [];

  const push = (type: DiscoveryType, raw: DiscoverySuggestion[]) => {
    if (!wanted.has(type)) return;
    // trust gate: drop any suggestion whose reason carries ranking/judgement
    // language (fail closed), de-dupe by slug, rank, then cap.
    const clean = raw.filter((s) => isReasonTrustworthy(s.reason));
    const deduped = new Map<string, DiscoverySuggestion>();
    for (const s of clean) if (!deduped.has(s.slug)) deduped.set(s.slug, s);
    const ranked = rankSuggestions(Array.from(deduped.values()), anchorCuisines).slice(
      0,
      limitPerType,
    );
    if (ranked.length > 0) {
      sections.push({ type, title: SECTION_TITLES[type], suggestions: ranked });
    }
  };

  if (food) {
    push("explore_varieties", fromGraph(food, ["same_variety"], "explore_varieties", familiar));
    push("similar", fromGraph(food, ["similar_to", "same_family"], "similar", familiar));
    push("cook_with", fromGraph(food, ["often_cooked_with"], "cook_with", familiar));
  }

  if (enjoys.length > 0) {
    push("broaden_horizons", broadenHorizons(enjoys, exclude, familiar));
  }

  push("cuisine", cuisineExploration(food, enjoys, exclude, familiar));

  const resolvedSeason = season ?? seasonForDate(now);
  push("seasonal", seasonalExploration(resolvedSeason, exclude, enjoys, familiar));

  return { anchor, sections };
}

// ── demo formatter (not for production rendering) ─────────────────────────────

export function formatDiscovery(result: DiscoveryResult): string {
  const lines: string[] = [];
  lines.push(`\n══ ${result.anchor ? result.anchor.name : "Your household"} ══`);
  if (result.sections.length === 0) {
    lines.push("  (nothing trustworthy to suggest — staying silent)");
    return lines.join("\n");
  }
  for (const section of result.sections) {
    lines.push(`\n${section.title}:`);
    for (const s of section.suggestions) {
      const tag = s.familiar ? " ★familiar" : "";
      lines.push(`  • ${s.name}${tag}`);
      lines.push(`    ${s.reason}`);
    }
  }
  return lines.join("\n");
}

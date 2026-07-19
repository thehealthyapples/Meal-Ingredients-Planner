// WX5 — Connected Food Intelligence Assembler.
//
// Turns a single Food Page into a connected food ecosystem: every food naturally
// leads to other relevant foods, meals and knowledge. The assembler owns NOTHING
// — it reads existing canonical owners and returns an ephemeral runtime object.
// Nothing is persisted, cached, calculated-as-fact, or synchronised here. There
// is no graph database: relationships are assembled per-request from the existing
// in-memory relationship graph plus read-only DB queries.
//
// Canonical ownership map (Architecture Principle 2 — read-only):
//   Food identity                → shared/canonical (buildFoodReport / isCanonicalFood)
//   Food↔food relationships      → shared/relationships/food-graph (getFoodRelationships)
//   Discovery                    → shared/discovery/engine (discover)
//   Seasonality                  → shared/discovery/seasonal-map
//   Cookbook meals               → DB `meals` (system Cookbook)
//   Household evidence           → DB `planner_entries` / `planner_days` / `planner_weeks`
//   Nutrition enhancement        → uplift-engine + uplift-rules
//
// Progressive enrichment (Architecture Principle 3):
//   Every section is independently optional. Absent data returns null. No section
//   ever fabricates content. An unknown / non-canonical slug ⇒ `food === null`.
//
// Trust: a food reference is `linkable` only when it is itself a canonical food
//   (so a /foods/:slug page exists). Variety / cuisine slugs with no page are
//   surfaced as inspiration but never linked — the ecosystem has no dead ends.

import { db } from "../db";
import { meals, plannerEntries, plannerDays, plannerWeeks } from "@shared/schema";
import { eq } from "drizzle-orm";
import { resolveCanonicalFood } from "@shared/canonical/resolver";
import { buildFoodReport, isCanonicalFood } from "@shared/canonical/food-report-adapter";
import { getFoodRelationships } from "@shared/relationships/food-graph";
import type { FoodRelationship } from "@shared/relationships/food-graph";
import { discover } from "@shared/discovery/engine";
import { seasonForDate, SEASON_SEED } from "@shared/discovery/seasonal-map";
import { buildRuleIndex, matchUpliftRules } from "./uplift-engine";
import { UPLIFT_RULES } from "./uplift-rules";
import { upliftSuggestionText } from "@shared/nutrition/uplift-phrasing";

// ── Caps — quality over quantity (Experience Rule: never spammy / endless). ────
const MAX_FOODS_PER_SECTION = 6;
const MAX_MEALS = 8;

// ── Lazy uplift rule index (built once per process). ──────────────────────────
let _ruleIndex: ReturnType<typeof buildRuleIndex> | null = null;
function getRuleIndex(): ReturnType<typeof buildRuleIndex> {
  if (!_ruleIndex) _ruleIndex = buildRuleIndex(UPLIFT_RULES);
  return _ruleIndex;
}

// ── Public types ──────────────────────────────────────────────────────────────

/** A related food, pre-resolved for safe linking. */
export interface ConnectedFoodLink {
  slug: string;
  name: string;
  /** One-sentence "why", straight from the canonical owner. Empty when none. */
  reason: string;
  /** True ⇒ a /foods/:slug page exists. False ⇒ render a calm, non-clickable chip. */
  linkable: boolean;
}

/** A related Cookbook meal. */
export interface ConnectedMealLink {
  mealId: number;
  name: string;
  imageUrl: string | null;
}

/** A nutrition-enhancement pairing ("Simply Better Choice"). */
export interface ConnectedBetterChoice {
  suggestion: string;
  why: string;
}

export interface ConnectedFoodSection<T> {
  type: string;
  title: string;
  items: T[];
}

/**
 * The canonical runtime model for connected food intelligence.
 *
 * Contract:
 *   • Every section is independently optional (progressive enrichment).
 *   • Null means absent — never fabricated.
 *   • The assembler owns nothing — all facts trace back to canonical owners.
 *   • `food === null` ⇒ the slug is not a canonical food (safe 404).
 */
export interface ConnectedFoodIntelligence {
  slug: string;
  food: { name: string } | null;
  oftenEnjoyedWith: ConnectedFoodSection<ConnectedFoodLink> | null;
  similarFoods: ConnectedFoodSection<ConnectedFoodLink> | null;
  oftenAppearsIn: ConnectedFoodSection<ConnectedMealLink> | null;
  discoverNext: ConnectedFoodSection<ConnectedFoodLink> | null;
  seasonalConnections: ConnectedFoodSection<ConnectedFoodLink> | null;
  householdConnections: ConnectedFoodSection<ConnectedFoodLink> | null;
  simplyBetterChoices: ConnectedFoodSection<ConnectedBetterChoice> | null;
  trust: { isCanonical: boolean; populatedSections: number };
  metadata: { assembledAt: string; sources: string[] };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Map a relationship-graph edge to a linkable connected-food reference. */
function edgeToLink(edge: FoodRelationship): ConnectedFoodLink {
  return {
    slug: edge.slug,
    name: edge.name,
    reason: edge.explanation,
    linkable: isCanonicalFood(edge.slug),
  };
}

/** Pull the edges of one relationship type from a food's graph, capped. */
function relationshipLinks(
  graph: ReturnType<typeof getFoodRelationships>,
  types: FoodRelationship["type"][],
): ConnectedFoodLink[] {
  if (!graph) return [];
  const wanted = new Set(types);
  const out: ConnectedFoodLink[] = [];
  const seen = new Set<string>();
  for (const edge of graph.relationships) {
    if (!wanted.has(edge.type) || seen.has(edge.slug)) continue;
    seen.add(edge.slug);
    out.push(edgeToLink(edge));
    if (out.length >= MAX_FOODS_PER_SECTION) break;
  }
  return out;
}

/** Cookbook (system) meals whose ingredients resolve to this food. */
async function assembleMeals(slug: string): Promise<ConnectedMealLink[]> {
  const rows = await db
    .select({
      id: meals.id,
      name: meals.name,
      ingredients: meals.ingredients,
      imageUrl: meals.imageUrl,
    })
    .from(meals)
    .where(eq(meals.isSystemMeal, true));

  const out: ConnectedMealLink[] = [];
  for (const row of rows) {
    if (out.length >= MAX_MEALS) break;
    const hit = (row.ingredients ?? []).some(
      (ing) => resolveCanonicalFood(ing).canonicalSlug === slug,
    );
    if (hit) out.push({ mealId: row.id, name: row.name, imageUrl: row.imageUrl ?? null });
  }
  return out;
}

/**
 * Household co-occurrence: the foods this household most often plans ALONGSIDE
 * the anchor food, derived only from their own planner rows (real evidence). For
 * every planner meal that contains the anchor, every OTHER canonical food in that
 * meal earns one co-occurrence. Returns both the enjoys-set (for Discovery
 * household context) and the ranked co-occurring foods.
 */
async function fetchHouseholdContext(
  householdId: number,
  anchorSlug: string,
): Promise<{ enjoys: string[]; connections: ConnectedFoodLink[] }> {
  const rows = await db
    .select({
      ingredients: meals.ingredients,
    })
    .from(plannerEntries)
    .innerJoin(plannerDays, eq(plannerEntries.dayId, plannerDays.id))
    .innerJoin(plannerWeeks, eq(plannerDays.weekId, plannerWeeks.id))
    .innerJoin(meals, eq(plannerEntries.mealId, meals.id))
    .where(eq(plannerWeeks.householdId, householdId));

  const enjoys = new Set<string>();
  // co-occurring canonical slug → { times, name }
  const cooccur = new Map<string, { times: number; name: string }>();

  for (const row of rows) {
    const slugsInMeal = new Set<string>();
    for (const ing of row.ingredients ?? []) {
      const slug = resolveCanonicalFood(ing).canonicalSlug;
      if (slug) slugsInMeal.add(slug);
    }
    for (const s of Array.from(slugsInMeal)) enjoys.add(s);

    // Only meals that actually contain the anchor contribute co-occurrence.
    if (!slugsInMeal.has(anchorSlug)) continue;
    for (const partner of Array.from(slugsInMeal)) {
      if (partner === anchorSlug) continue;
      const report = buildFoodReport(partner);
      const name = report?.overview.name ?? partner;
      const acc = cooccur.get(partner);
      if (acc) acc.times += 1;
      else cooccur.set(partner, { times: 1, name });
    }
  }

  const connections: ConnectedFoodLink[] = Array.from(cooccur.entries())
    .sort((a, b) => b[1].times - a[1].times || a[1].name.localeCompare(b[1].name))
    .slice(0, MAX_FOODS_PER_SECTION)
    .map(([slug, c]) => ({
      slug,
      name: c.name,
      reason:
        c.times === 1
          ? `You've planned this alongside ${c.name.toLowerCase()} before.`
          : `You've planned this alongside ${c.name.toLowerCase()} ${c.times} times.`,
      linkable: isCanonicalFood(slug),
    }));

  return { enjoys: Array.from(enjoys), connections };
}

/**
 * "Discover Next" — forward exploration from the Discovery Engine. We deliberately
 * request only the forward-looking discovery types (varieties / broaden_horizons /
 * cuisine), because the lateral `similar` and `cook_with` relationships are already
 * presented as their own first-class sections (Similar Foods / Often Enjoyed With)
 * — avoiding duplicate chips on one page (Experience Rule: never spammy).
 */
function assembleDiscoverNext(
  slug: string,
  enjoys: string[],
  now: Date,
): ConnectedFoodLink[] {
  const result = discover({
    food: slug,
    household: enjoys.length > 0 ? { enjoys } : undefined,
    types: ["explore_varieties", "broaden_horizons", "cuisine"],
    now,
  });
  const out: ConnectedFoodLink[] = [];
  const seen = new Set<string>();
  for (const section of result.sections) {
    for (const s of section.suggestions) {
      if (seen.has(s.slug)) continue;
      seen.add(s.slug);
      out.push({
        slug: s.slug,
        name: s.name,
        reason: s.reason,
        linkable: isCanonicalFood(s.slug),
      });
      if (out.length >= MAX_FOODS_PER_SECTION) return out;
    }
  }
  return out;
}

/** Simply Better Choices — existing uplift rules that name this food. */
function assembleBetterChoices(foodName: string): ConnectedBetterChoice[] {
  const matches = matchUpliftRules(
    { mealName: foodName, ingredients: [foodName], dietTypes: [] },
    getRuleIndex(),
  );
  const out: ConnectedBetterChoice[] = [];
  const seen = new Set<string>();
  for (const match of matches) {
    for (const s of match.suggestions) {
      const label = upliftSuggestionText(s);
      if (seen.has(label)) continue;
      seen.add(label);
      out.push({ suggestion: label, why: s.why });
      if (out.length >= MAX_FOODS_PER_SECTION) return out;
    }
  }
  return out;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Assemble connected food intelligence for a single canonical food slug.
 *
 * Always returns a complete object — never throws. When the slug is not a
 * canonical food, `food` is null and every section is null: callers render a calm
 * not-found / empty state.
 *
 * @param canonicalFoodSlug  Canonical food slug (e.g. "tomato").
 * @param householdId        Optional — enables household co-occurrence + Discovery
 *                           household context. Without it those sections stay hidden.
 */
export async function getConnectedFoodIntelligence(
  canonicalFoodSlug: string,
  householdId?: number,
): Promise<ConnectedFoodIntelligence> {
  const now = new Date();
  const sources: string[] = [];

  const report = buildFoodReport(canonicalFoodSlug);

  // Unknown / non-canonical slug → safe empty model.
  if (!report) {
    return {
      slug: canonicalFoodSlug,
      food: null,
      oftenEnjoyedWith: null,
      similarFoods: null,
      oftenAppearsIn: null,
      discoverNext: null,
      seasonalConnections: null,
      householdConnections: null,
      simplyBetterChoices: null,
      trust: { isCanonical: false, populatedSections: 0 },
      metadata: { assembledAt: now.toISOString(), sources },
    };
  }

  sources.push("canonical_food");
  const foodName = report.overview.name;
  const graph = getFoodRelationships(canonicalFoodSlug);

  // Household (drives co-occurrence connections + discovery household context).
  let enjoys: string[] = [];
  let householdConnLinks: ConnectedFoodLink[] = [];
  if (householdId != null) {
    const ctx = await fetchHouseholdContext(householdId, canonicalFoodSlug);
    enjoys = ctx.enjoys;
    householdConnLinks = ctx.connections;
  }

  // ── Lateral relationships (food-graph). ──
  const enjoyedWithLinks = relationshipLinks(graph, ["often_cooked_with"]);
  const similarLinks = relationshipLinks(graph, ["similar_to", "same_family"]);

  // ── Seasonal connections — only when this food is in its UK season NOW. ──
  const season = seasonForDate(now);
  const inSeasonNow = SEASON_SEED[season].some((f) => f.slug === canonicalFoodSlug);
  const seasonalLinks = inSeasonNow
    ? relationshipLinks(graph, ["seasonal_with"])
    : [];

  // ── Cookbook meals. ──
  const mealLinks = await assembleMeals(canonicalFoodSlug);

  // ── Discovery + nutrition enhancement. ──
  const discoverLinks = assembleDiscoverNext(canonicalFoodSlug, enjoys, now);
  const betterChoices = assembleBetterChoices(foodName);

  // ── Wrap sections (null when empty — progressive enrichment). ──
  const section = <T>(
    type: string,
    title: string,
    items: T[],
  ): ConnectedFoodSection<T> | null =>
    items.length > 0 ? { type, title, items } : null;

  const oftenEnjoyedWith = section("often_enjoyed_with", "Often enjoyed with", enjoyedWithLinks);
  const similarFoods = section("similar_foods", "Similar foods", similarLinks);
  const oftenAppearsIn = section("often_appears_in", "Often appears in", mealLinks);
  const discoverNext = section("discover_next", "Discover next", discoverLinks);
  const seasonalConnections = section("seasonal_connections", "In season together", seasonalLinks);
  const householdConnections = section("household_connections", "Your household often pairs", householdConnLinks);
  const simplyBetterChoices = section("simply_better_choices", "Simply better choices", betterChoices);

  if (oftenEnjoyedWith) sources.push("food_relationships");
  if (similarFoods) sources.push("food_relationships");
  if (oftenAppearsIn) sources.push("meals");
  if (discoverNext) sources.push("discovery");
  if (seasonalConnections) sources.push("seasonality");
  if (householdConnections) sources.push("household");
  if (simplyBetterChoices) sources.push("nutrition_enhancement");

  const populatedSections = [
    oftenEnjoyedWith,
    similarFoods,
    oftenAppearsIn,
    discoverNext,
    seasonalConnections,
    householdConnections,
    simplyBetterChoices,
  ].filter(Boolean).length;

  return {
    slug: canonicalFoodSlug,
    food: { name: foodName },
    oftenEnjoyedWith,
    similarFoods,
    oftenAppearsIn,
    discoverNext,
    seasonalConnections,
    householdConnections,
    simplyBetterChoices,
    trust: { isCanonical: true, populatedSections },
    metadata: { assembledAt: now.toISOString(), sources: Array.from(new Set(sources)) },
  };
}

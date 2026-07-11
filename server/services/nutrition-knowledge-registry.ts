// WS0 — Nutrition Knowledge Registry: retrieval helpers.
//
// READ-ONLY, ADDITIVE access layer over the knowledge_* tables. This is the
// single point through which other systems (Plant Diversity Tier B, Pantry
// Explore / Nutrition Knowledge Hub, Weekly Nutrition Report, Health Benefits,
// Simply Better Choices, Recommendation Stage 1) read editorial nutrition
// knowledge.
//
// IMPORTANT — intentional boundaries:
//   • This module is NOT wired into planner ranking, the restriction engine,
//     meal scoring or recommendation ranking. It only stores and retrieves.
//   • evidenceStrength on food↔benefit and nutrient↔benefit links is returned
//     for storage/internal use but MUST NOT be surfaced to users yet. Prefer
//     getFoodBenefitsForDisplay() / getNutrientBenefitsForDisplay(), which strip
//     the evidence signal before it can reach the UI.
//   • PKC Phase 0 (Rule KC8) — the Layer-2 claim-trust gate: a benefit claim
//     reaches a user ONLY if it is evidence-backed (≥1 valid SourceRef + human
//     reviewedAt sign-off, shared/knowledge/evidence.ts). Unsourced claims are
//     honest gaps — absent, never rendered.
//   • KNOW5 — the gate now spans the FULL CHAIN. A food-level benefit chip
//     requires BOTH edges of the nutrient bridge to be evidence-backed:
//       food → nutrient      (the food-specific premise — the composition edge)
//       nutrient → benefit   (the physiological claim)
//     Before KNOW5 only the second was gated, so a chip inherited a genuine
//     NHS/EFSA citation that attested "fibre supports gut health" while its
//     premise — "this food is a notable fibre source" — was an unreviewed AI
//     draft. `plain-wheat-flour → gut-health [NHS]` rendered on that hole.
//     The chip now carries the citations for BOTH edges, and its Evidence
//     Confidence is derived from the chain, never from an authored `confidence`
//     column (which an AI draft may set to "established" about itself).
import {
  deriveClaimConfidence,
  deriveEvidenceConfidence,
  isEvidenceBackedClaim,
  isRenderableConfidence,
  strongerConfidence,
  type EvidenceConfidence,
  type KnowledgeSourceRef,
} from "@shared/knowledge/evidence";
import { normalizeIngredientKey } from "@shared/normalize";
import { resolveIngredientAlias } from "@shared/ingredient-aliases";
import { db } from "../db";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  knowledgeFoods,
  knowledgeNutrients,
  knowledgeHealthBenefits,
  knowledgeFoodNutrients,
  knowledgeFoodBenefits,
  knowledgeNutrientBenefits,
  type KnowledgeFood,
  type KnowledgeNutrient,
  type KnowledgeHealthBenefit,
} from "@shared/schema";

// ── Entities ─────────────────────────────────────────────────────────────────

export async function listFoods(opts?: { category?: string; includeInactive?: boolean }): Promise<KnowledgeFood[]> {
  const where = [];
  if (!opts?.includeInactive) where.push(eq(knowledgeFoods.isActive, true));
  if (opts?.category) where.push(eq(knowledgeFoods.category, opts.category));
  return db
    .select()
    .from(knowledgeFoods)
    .where(where.length ? and(...where) : undefined)
    .orderBy(asc(knowledgeFoods.displayOrder), asc(knowledgeFoods.name));
}

export async function getFoodBySlug(slug: string): Promise<KnowledgeFood | undefined> {
  const [row] = await db.select().from(knowledgeFoods).where(eq(knowledgeFoods.slug, slug)).limit(1);
  return row;
}

export async function listNutrients(opts?: { includeInactive?: boolean }): Promise<KnowledgeNutrient[]> {
  const where = opts?.includeInactive ? undefined : eq(knowledgeNutrients.isActive, true);
  return db.select().from(knowledgeNutrients).where(where).orderBy(asc(knowledgeNutrients.displayOrder), asc(knowledgeNutrients.name));
}

export async function getNutrientBySlug(slug: string): Promise<KnowledgeNutrient | undefined> {
  const [row] = await db.select().from(knowledgeNutrients).where(eq(knowledgeNutrients.slug, slug)).limit(1);
  return row;
}

export async function listHealthBenefits(opts?: { includeInactive?: boolean }): Promise<KnowledgeHealthBenefit[]> {
  const where = opts?.includeInactive ? undefined : eq(knowledgeHealthBenefits.isActive, true);
  return db.select().from(knowledgeHealthBenefits).where(where).orderBy(asc(knowledgeHealthBenefits.displayOrder), asc(knowledgeHealthBenefits.name));
}

export async function getHealthBenefitBySlug(slug: string): Promise<KnowledgeHealthBenefit | undefined> {
  const [row] = await db.select().from(knowledgeHealthBenefits).where(eq(knowledgeHealthBenefits.slug, slug)).limit(1);
  return row;
}

// ── Relationships ────────────────────────────────────────────────────────────

export interface FoodNutrientLink {
  nutrient: KnowledgeNutrient;
  amount: string | null;
  /** Authored editorial signal. STORAGE ONLY — the gate never reads it. */
  confidence: string;
  ranking: number;
  source: string;
  /** KNOW5 — Layer-2 claim-trust fields on the composition edge. */
  sourceRefs: KnowledgeSourceRef[];
  reviewedAt: Date | null;
  reviewedBy: string | null;
  /** Derived from the citations + sign-off above. Never authored. */
  evidenceConfidence: EvidenceConfidence;
}

/** Nutrients a food notably contributes, most prominent first.
 *
 *  Composition is NOT a health claim, so this list is not evidence-gated: a food
 *  showing its nutrients and no benefit chip is the honest state KNOW5 creates.
 *  Each link reports its own `evidenceConfidence` so a caller can see which
 *  premises are cited and which are still Under Review. */
export async function getNutrientsForFood(foodSlug: string): Promise<FoodNutrientLink[]> {
  const links = await db
    .select()
    .from(knowledgeFoodNutrients)
    .where(and(eq(knowledgeFoodNutrients.foodSlug, foodSlug), eq(knowledgeFoodNutrients.isActive, true)))
    .orderBy(asc(knowledgeFoodNutrients.ranking));
  if (links.length === 0) return [];
  const nutrients = await listNutrients();
  const bySlug = new Map(nutrients.map((n) => [n.slug, n]));
  return links
    .map((l) => {
      const nutrient = bySlug.get(l.nutrientSlug);
      if (!nutrient) return null;
      return {
        nutrient,
        amount: l.amount,
        confidence: l.confidence,
        ranking: l.ranking,
        source: l.source,
        sourceRefs: l.sourceRefs,
        reviewedAt: l.reviewedAt,
        reviewedBy: l.reviewedBy,
        evidenceConfidence: deriveClaimConfidence(l),
      };
    })
    .filter((x): x is FoodNutrientLink => x !== null);
}

export interface BenefitLink {
  benefit: KnowledgeHealthBenefit;
  ranking: number;
  source: string;
  /** Internal editorial signal — DO NOT show to users yet. */
  evidenceStrength: string;
  /** Layer-2 claim-trust fields (PKC Phase 0). */
  sourceRefs: KnowledgeSourceRef[];
  reviewedAt: Date | null;
}

/** Health benefits a food supports. Includes evidenceStrength (storage only). */
export async function getBenefitsForFood(foodSlug: string): Promise<BenefitLink[]> {
  const links = await db
    .select()
    .from(knowledgeFoodBenefits)
    .where(and(eq(knowledgeFoodBenefits.foodSlug, foodSlug), eq(knowledgeFoodBenefits.isActive, true)))
    .orderBy(asc(knowledgeFoodBenefits.ranking));
  return joinBenefits(links.map((l) => ({ benefitSlug: l.benefitSlug, ranking: l.ranking, source: l.source, evidenceStrength: l.evidenceStrength, sourceRefs: l.sourceRefs, reviewedAt: l.reviewedAt })));
}

/** Health benefits a nutrient supports. Includes evidenceStrength (storage only). */
export async function getBenefitsForNutrient(nutrientSlug: string): Promise<BenefitLink[]> {
  const links = await db
    .select()
    .from(knowledgeNutrientBenefits)
    .where(and(eq(knowledgeNutrientBenefits.nutrientSlug, nutrientSlug), eq(knowledgeNutrientBenefits.isActive, true)))
    .orderBy(asc(knowledgeNutrientBenefits.ranking));
  return joinBenefits(links.map((l) => ({ benefitSlug: l.benefitSlug, ranking: l.ranking, source: l.source, evidenceStrength: l.evidenceStrength, sourceRefs: l.sourceRefs, reviewedAt: l.reviewedAt })));
}

/** Reverse lookup: foods that notably contribute a nutrient, most prominent first. */
export async function getFoodsForNutrient(nutrientSlug: string): Promise<KnowledgeFood[]> {
  const links = await db
    .select()
    .from(knowledgeFoodNutrients)
    .where(and(eq(knowledgeFoodNutrients.nutrientSlug, nutrientSlug), eq(knowledgeFoodNutrients.isActive, true)))
    .orderBy(asc(knowledgeFoodNutrients.ranking));
  return foodsBySlugs(links.map((l) => l.foodSlug));
}

/** Reverse lookup: foods that support a health benefit.
 *
 *  KNOW5: this must apply exactly the same full-chain gate as
 *  getFoodBenefitsForDisplay(), or the benefit page lists a food whose own page
 *  refuses to show the chip. The food carries the benefit editorially AND
 *  contributes a nutrient via an evidence-backed COMPOSITION link whose link to
 *  this benefit is itself evidence-backed. */
export async function getFoodsForBenefit(benefitSlug: string): Promise<KnowledgeFood[]> {
  const links = await db
    .select()
    .from(knowledgeFoodBenefits)
    .where(and(eq(knowledgeFoodBenefits.benefitSlug, benefitSlug), eq(knowledgeFoodBenefits.isActive, true)))
    .orderBy(asc(knowledgeFoodBenefits.ranking));
  if (links.length === 0) return [];

  const nbLinks = await db
    .select()
    .from(knowledgeNutrientBenefits)
    .where(and(eq(knowledgeNutrientBenefits.benefitSlug, benefitSlug), eq(knowledgeNutrientBenefits.isActive, true)));
  const backedNutrients = nbLinks.filter((l) => isEvidenceBackedClaim(l)).map((l) => l.nutrientSlug);
  if (backedNutrients.length === 0) return [];

  const fnLinks = await db
    .select()
    .from(knowledgeFoodNutrients)
    .where(and(
      inArray(knowledgeFoodNutrients.foodSlug, links.map((l) => l.foodSlug)),
      inArray(knowledgeFoodNutrients.nutrientSlug, backedNutrients),
      eq(knowledgeFoodNutrients.isActive, true),
    ));
  // The composition premise must itself be cited and signed off. An uncited
  // premise corroborates nothing, however well-cited the nutrient claim is.
  const corroborated = new Set(fnLinks.filter((l) => isEvidenceBackedClaim(l)).map((l) => l.foodSlug));
  return foodsBySlugs(links.map((l) => l.foodSlug).filter((s) => corroborated.has(s)));
}

// ── Display-safe helpers (evidence-gated, evidence strength stripped) ─────────
//
// PKC Phase 0 (Rule KC8): these are the ONLY benefit readers a user-facing
// surface may call. They enforce the Layer-2 claim-trust gate: nothing renders
// without ≥1 valid SourceRef and a human reviewedAt sign-off. Unsourced rows
// are absent from the result — an honest gap, never a hidden fabrication.

export interface DisplayBenefit {
  benefit: KnowledgeHealthBenefit;
  ranking: number;
  source: string;
  /** The citations that earned this claim the right to render. For a food-level
   *  chip these span the WHOLE chain: the composition premise and the
   *  nutrient→benefit claim, deduplicated by URL. */
  sourceRefs: KnowledgeSourceRef[];
  /** Derived from the evidence chain and review status. Never `under-review` —
   *  such a claim is absent from this list entirely. */
  confidence: EvidenceConfidence;
}

/** Food → benefits, via the nutrient bridge. A chip renders only when the food
 *  editorially carries the benefit AND contributes a nutrient through a cited,
 *  signed-off COMPOSITION link whose link to that benefit is itself cited and
 *  signed off. The chip carries the citations for both edges.
 *
 *  The food→benefit row's own evidence, if it has any, raises the chip from
 *  Strong (derived through the bridge) to Established (directly cited). It can
 *  never license a chip on its own — that would be the uncited food-specific
 *  claim this workstream exists to eliminate. */
export async function getFoodBenefitsForDisplay(foodSlug: string): Promise<DisplayBenefit[]> {
  const direct = await getBenefitsForFood(foodSlug);
  if (direct.length === 0) return [];
  const backed = await backedBenefitsViaNutrientBridge(foodSlug);

  const out: DisplayBenefit[] = [];
  for (const link of direct) {
    const route = backed.get(link.benefit.slug);
    if (!route) continue; // chain incomplete → Under Review → honest gap.

    // Corroboration from the food→benefit row itself, if it is evidence-backed.
    const confidence = deriveEvidenceConfidence({
      composition: route.composition,
      nutrientBenefit: route.nutrientBenefit,
      foodBenefit: link,
    });
    if (!isRenderableConfidence(confidence)) continue;

    const sourceRefs = [...route.sourceRefs];
    if (isEvidenceBackedClaim(link)) {
      const seen = new Set(sourceRefs.map((r) => r.url));
      for (const ref of link.sourceRefs) if (!seen.has(ref.url)) sourceRefs.push(ref);
    }
    out.push({ benefit: link.benefit, ranking: link.ranking, source: route.source, sourceRefs, confidence });
  }
  return out;
}

/** Nutrient → benefits: only evidence-backed claims (valid SourceRef + sign-off). */
export async function getNutrientBenefitsForDisplay(nutrientSlug: string): Promise<DisplayBenefit[]> {
  const links = await getBenefitsForNutrient(nutrientSlug);
  return links
    .filter((l) => isEvidenceBackedClaim(l))
    .map(({ benefit, ranking, source, sourceRefs, reviewedAt }) => ({
      benefit,
      ranking,
      source,
      sourceRefs,
      confidence: deriveClaimConfidence({ sourceRefs, reviewedAt }),
    }));
}

/** One completed evidence chain from a food to a benefit, and the citations that
 *  earned it. `composition` and `nutrientBenefit` are the two gated edges. */
interface BackedRoute {
  source: string;
  sourceRefs: KnowledgeSourceRef[];
  composition: { sourceRefs: KnowledgeSourceRef[]; reviewedAt: Date | null };
  nutrientBenefit: { sourceRefs: KnowledgeSourceRef[]; reviewedAt: Date | null };
  confidence: EvidenceConfidence;
}

/**
 * Benefits reachable from a food's nutrients where BOTH edges of the bridge are
 * evidence-backed, with the citations from both (deduplicated by URL).
 *
 * Where several nutrients reach the same benefit, the best-evidenced route wins
 * and every qualifying route's citations are merged onto it — a user seeing one
 * chip should see every source that supports it.
 */
async function backedBenefitsViaNutrientBridge(foodSlug: string): Promise<Map<string, BackedRoute>> {
  const allFnLinks = await db
    .select()
    .from(knowledgeFoodNutrients)
    .where(and(eq(knowledgeFoodNutrients.foodSlug, foodSlug), eq(knowledgeFoodNutrients.isActive, true)));

  // KNOW5 — the composition edge is gated here, before it can corroborate
  // anything. An unreviewed premise is not a premise.
  const fnLinks = allFnLinks.filter((l) => isEvidenceBackedClaim(l));
  if (fnLinks.length === 0) return new Map();

  const nbLinks = await db
    .select()
    .from(knowledgeNutrientBenefits)
    .where(and(
      inArray(knowledgeNutrientBenefits.nutrientSlug, fnLinks.map((l) => l.nutrientSlug)),
      eq(knowledgeNutrientBenefits.isActive, true),
    ));

  const compositionByNutrient = new Map(fnLinks.map((l) => [l.nutrientSlug, l]));
  const backed = new Map<string, BackedRoute>();

  for (const nb of nbLinks) {
    if (!isEvidenceBackedClaim(nb)) continue;
    const composition = compositionByNutrient.get(nb.nutrientSlug);
    if (!composition) continue;

    // foodBenefit is unknown at this level; the caller folds it in. A route is
    // therefore at best `strong` here, and may be lifted to `established`.
    const confidence = deriveEvidenceConfidence({ composition, nutrientBenefit: nb });
    if (!isRenderableConfidence(confidence)) continue;

    const existing = backed.get(nb.benefitSlug);
    if (!existing) {
      backed.set(nb.benefitSlug, {
        source: nb.source,
        sourceRefs: dedupeByUrl([...composition.sourceRefs, ...nb.sourceRefs]),
        composition,
        nutrientBenefit: nb,
        confidence,
      });
      continue;
    }

    // Merge citations from this additional route; keep the strongest chain.
    existing.sourceRefs = dedupeByUrl([...existing.sourceRefs, ...composition.sourceRefs, ...nb.sourceRefs]);
    if (strongerConfidence(confidence, existing.confidence) === confidence && confidence !== existing.confidence) {
      existing.source = nb.source;
      existing.composition = composition;
      existing.nutrientBenefit = nb;
      existing.confidence = confidence;
    }
  }
  return backed;
}

function dedupeByUrl(refs: KnowledgeSourceRef[]): KnowledgeSourceRef[] {
  const seen = new Set<string>();
  const out: KnowledgeSourceRef[] = [];
  for (const ref of refs) {
    if (seen.has(ref.url)) continue;
    seen.add(ref.url);
    out.push(ref);
  }
  return out;
}

// ── Internal join helpers ──────────────────────────────────────────────────────

async function joinBenefits(
  rows: Array<{ benefitSlug: string; ranking: number; source: string; evidenceStrength: string; sourceRefs: KnowledgeSourceRef[]; reviewedAt: Date | null }>,
): Promise<BenefitLink[]> {
  if (rows.length === 0) return [];
  const benefits = await listHealthBenefits();
  const bySlug = new Map(benefits.map((b) => [b.slug, b]));
  return rows
    .map((r) => {
      const benefit = bySlug.get(r.benefitSlug);
      return benefit ? { benefit, ranking: r.ranking, source: r.source, evidenceStrength: r.evidenceStrength, sourceRefs: r.sourceRefs, reviewedAt: r.reviewedAt } : null;
    })
    .filter((x): x is BenefitLink => x !== null);
}

async function foodsBySlugs(slugs: string[]): Promise<KnowledgeFood[]> {
  if (slugs.length === 0) return [];
  const rows = await db
    .select()
    .from(knowledgeFoods)
    .where(and(inArray(knowledgeFoods.slug, slugs), eq(knowledgeFoods.isActive, true)));
  // Preserve the ranking order implied by the incoming slug list.
  const order = new Map(slugs.map((s, i) => [s, i]));
  return rows.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

// ── WS1 — Pantry Explore display layer ─────────────────────────────────────────
//
// Additive, READ-ONLY helpers that assemble exactly what the Pantry Nutrition
// Knowledge Hub UI needs and NOTHING the editorial layer wants kept internal.
// Every shape returned here deliberately omits `source`, `evidenceStrength` and
// `confidence` — those are storage/curation signals that must not reach users
// yet (see the "source hidden for now" rule). This is the only surface the
// Pantry Explore routes are allowed to call.

/** A food reduced to the fields safe to render in a list/chip. No `source`. */
export interface FoodCard {
  slug: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
}

/** A benefit reduced to display fields. `icon` is a lucide icon name. */
export interface BenefitChip {
  slug: string;
  name: string;
  icon: string | null;
}

/** A nutrient link reduced to display fields. `amount` is an editorial string. */
export interface NutrientChip {
  slug: string;
  name: string;
  amount: string | null;
}

const toFoodCard = (f: KnowledgeFood): FoodCard => ({
  slug: f.slug,
  name: f.name,
  category: f.category,
  subcategory: f.subcategory,
  description: f.description,
});

const toBenefitChip = (b: KnowledgeHealthBenefit): BenefitChip => ({ slug: b.slug, name: b.name, icon: b.icon });

/** A nutrient reduced to display fields. */
export interface NutrientLite {
  slug: string;
  name: string;
  category: string | null;
}

export interface KnowledgeSearchResult {
  query: string;
  foods: FoodCard[];
  nutrients: NutrientLite[];
  benefits: BenefitChip[];
}

/** Unified, partial, case-insensitive search used by the Pantry Explore search box. */
export async function searchKnowledgeRegistry(rawQuery: string): Promise<KnowledgeSearchResult> {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return { query: rawQuery, foods: [], nutrients: [], benefits: [] };

  const [foods, nutrients, benefits] = await Promise.all([listFoods(), listNutrients(), listHealthBenefits()]);

  const foodMatches = foods.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.slug.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      (f.subcategory?.toLowerCase().includes(q) ?? false) ||
      f.aliases.some((a) => a.toLowerCase().includes(q)),
  );
  const nutrientMatches = nutrients.filter((n) => n.name.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q));
  const benefitMatches = benefits.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q));

  return {
    query: rawQuery,
    foods: foodMatches.map(toFoodCard),
    nutrients: nutrientMatches.map((n) => ({ slug: n.slug, name: n.name, category: n.category })),
    benefits: benefitMatches.map(toBenefitChip),
  };
}

/** Distinct food categories with counts, in editorial display order. */
export async function listFoodCategories(): Promise<{ category: string; count: number }[]> {
  const foods = await listFoods(); // already ordered by displayOrder, name
  const counts = new Map<string, number>();
  for (const f of foods) counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
  // Map preserves first-insertion order → follows displayOrder of the first food in each category.
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

/** Active foods, optionally filtered to a single category, as display-safe cards. */
export async function listFoodCards(category?: string): Promise<FoodCard[]> {
  const foods = await listFoods(category ? { category } : undefined);
  return foods.map(toFoodCard);
}

/** Everything the food detail card renders. Omits all internal editorial signals. */
export interface FoodDetailView {
  food: {
    slug: string;
    name: string;
    category: string;
    subcategory: string | null;
    description: string | null;
    aliases: string[];
    commonForms: string[];
    storageGuidance: string | null;
    seasonality: string | null;
    imageUrl: string | null;
  };
  benefits: BenefitChip[];
  nutrients: NutrientChip[];
}

export async function getFoodDetailView(slug: string): Promise<FoodDetailView | undefined> {
  const food = await getFoodBySlug(slug);
  if (!food || !food.isActive) return undefined;
  const [benefits, nutrients] = await Promise.all([getFoodBenefitsForDisplay(slug), getNutrientsForFood(slug)]);
  return {
    food: {
      slug: food.slug,
      name: food.name,
      category: food.category,
      subcategory: food.subcategory,
      description: food.description,
      aliases: food.aliases,
      commonForms: food.commonForms,
      storageGuidance: food.storageGuidance,
      seasonality: food.seasonality,
      imageUrl: food.imageUrl,
    },
    benefits: benefits.map((b) => toBenefitChip(b.benefit)),
    nutrients: nutrients.map((n) => ({ slug: n.nutrient.slug, name: n.nutrient.name, amount: n.amount })),
  };
}

/** Nutrient detail: the nutrient, the foods that contribute it, the benefits it supports. */
export interface NutrientDetailView {
  nutrient: { slug: string; name: string; description: string | null; category: string | null };
  foods: FoodCard[];
  benefits: BenefitChip[];
}

export async function getNutrientDetailView(slug: string): Promise<NutrientDetailView | undefined> {
  const nutrient = await getNutrientBySlug(slug);
  if (!nutrient || !nutrient.isActive) return undefined;
  const [foods, benefits] = await Promise.all([getFoodsForNutrient(slug), getNutrientBenefitsForDisplay(slug)]);
  return {
    nutrient: { slug: nutrient.slug, name: nutrient.name, description: nutrient.description, category: nutrient.category },
    foods: foods.map(toFoodCard),
    benefits: benefits.map((b) => toBenefitChip(b.benefit)),
  };
}

/** Benefit detail: the benefit and the foods that support it. */
export interface BenefitDetailView {
  benefit: { slug: string; name: string; description: string | null; icon: string | null };
  foods: FoodCard[];
}

export async function getBenefitDetailView(slug: string): Promise<BenefitDetailView | undefined> {
  const benefit = await getHealthBenefitBySlug(slug);
  if (!benefit || !benefit.isActive) return undefined;
  const foods = await getFoodsForBenefit(slug);
  return {
    benefit: { slug: benefit.slug, name: benefit.name, description: benefit.description, icon: benefit.icon },
    foods: foods.map(toFoodCard),
  };
}

// ── M1: Batch ingredient → WS0 knowledge lookup ───────────────────────────────
//
// Resolves a list of pre-normalised ingredient strings (from client's
// normaliseForReuse pipeline) to their WS0 nutrients and benefits.
// Used by PlantDiversityReport and MealUpliftPanel to replace the retired
// nutrition-benefit-library.ts static lookup.
//
// Trust rules:
//   • Only returns data for foods found in WS0. Unmatched ingredients are
//     absent from the result — consumers show empty state, never guessed data.
//   • No source / confidence / evidenceStrength exposed — display-safe only.
//   • Alias resolution covers plural forms (e.g. "chicken breasts" → chicken).

// ── Ingredient resolution helpers ─────────────────────────────────────────────
//
// Real meal ingredient strings contain quantities and preparation words:
//   "4 Chicken Legs", "500g Passata", "A handful of Pumpkin Seeds",
//   "Finely Chopped Parsley", "2 tbsp Extra Virgin Olive Oil".
//
// The resolution strategy tries each candidate in order, stopping at first match:
//   1. Exact normalized key
//   2. Exact key via ingredient alias table
//   3. Trailing-s removal (regular plurals)
//   4. Quantity/unit prefix stripped → then (2) and (3)
//   5. Preparation-word prefix stripped → then (2) and (3)
//   6. Both stripped → then (2) and (3)
//
// If uncertain, leave unmatched. Honest silence over wrong intelligence.

// Leading quantity + optional measurement modifier + optional unit + optional "of".
// Handles: "4 chicken legs", "500g passata", "2 tbsp of olive oil", "1/2 cup oats",
//          "1 heaped tsp paprika", "3 rounded tablespoons yogurt".
const LEADING_QTY_RE =
  /^[\d./]+\s*(?:heaped|rounded|level|scant|generous)?\s*(?:g|kg|mg|oz|lb|lbs|gram|grams|kilogram|kilograms|ounce|ounces|pound|pounds|ml|cl|dl|l|litre|litres|liter|liters|fl\s*oz|cup|cups|tbsp|tbsps|tablespoon|tablespoons|tsp|tsps|teaspoon|teaspoons|tin|tins|can|cans|piece|pieces|slice|slices|clove|cloves|head|heads|sprig|sprigs|leaf|leaves|handful|handfuls|bunch|bunches|pinch|pinches|knob|knobs|dash|dashes|drop|drops|drizzle|drizzles|splash|splashes|strip|strips)?\s+(?:of\s+)?/i;

// Vague count phrases: "a handful of", "a bunch of", etc.
const VAGUE_QTY_RE =
  /^(?:a|an|one|some|half)\s+(?:(?:small|large|medium|generous|heaped|good|big|little)\s+)?(?:handful|bunch|pinch|dash|splash|drizzle|knob|bit|touch|strip|sprig|piece|slice|head)s?\s+(?:of\s+)?/i;

// Container prefix without a leading count: "can cherry tomatoes", "tin chickpeas", "jar olives".
// Applied after numeric quantity strip since "400g can X" becomes "can X" after the numeric strip.
// Also handles informal unit words: "pinch chilli flakes", "pack spinach", "sachet yeast".
const CONTAINER_PREFIX_RE =
  /^(?:tin|tins|can|cans|jar|jars|bag|bags|box|boxes|packet|packets|punnet|punnets|bunch|bunches|pack|packs|sachet|sachets|pinch|pinches|dash|dashes)\s+(?:of\s+)?/i;

// Single leading preparation/adjective word describing form, not the food.
// Applied repeatedly so "finely chopped" strips in two passes.
// Includes preservation forms (tinned, canned, smoked, pickled) so
// "tinned chopped tomatoes" → "chopped tomatoes" → "tomatoes".
// Also includes cooking methods used as qualifiers (roast, braised) so
// "roast potatoes" → "potatoes" and "braised red cabbage" → "red cabbage".
const PREP_WORD_RE =
  /^(?:(?:very|finely|roughly|coarsely|thinly|thickly|freshly|lightly|well|evenly)\s+)?(?:chopped|sliced|diced|minced|grated|shredded|toasted|roasted|roast|braised|crushed|blended|dried|cooked|raw|frozen|fresh|peeled|rinsed|drained|wilted|ground|whole|trimmed|deseeded|tinned|canned|smoked|pickled|jarred|preserved|salted)\s+/i;

// Trailing preparation phrase anchored to the end of the string.
// Strips "finely sliced", "cut into thin wedges", "roughly chopped", etc.
// Applied iteratively to catch stacked phrases like "peeled and roughly chopped".
const TRAILING_PREP_RE =
  /[\s,]+(?:and\s+)?(?:(?:(?:very|finely|roughly|coarsely|thinly|thickly|freshly|lightly|well|evenly)\s+)?(?:chopped|sliced|diced|minced|grated|shredded|toasted|roasted|crushed|blended|cooked|raw|frozen|fresh|peeled|rinsed|drained|wilted|ground|trimmed|deseeded|halved|quartered|torn|beaten|mashed|divided|crumbled|flaked)|cut\s+into\b.*|to\s+serve.*)$/i;

// Leading size/quality adjective after the quantity has been stripped.
// Covers: "large eggs", "small onion", "medium carrots", "big handful spinach".
const SIZE_ADJ_RE = /^(?:large|small|medium|big)\s+/i;

function stripQuantityPrefix(key: string): string {
  let s = key.replace(LEADING_QTY_RE, "").trim();
  if (s !== key) {
    // After a numeric quantity, also strip any orphaned container word ("can X", "tin X").
    s = s.replace(CONTAINER_PREFIX_RE, "").trim();
    return s;
  }
  s = key.replace(VAGUE_QTY_RE, "").trim();
  if (s !== key) return s;
  // No numeric prefix — try bare container prefix ("can chickpeas", "tin tomatoes").
  s = key.replace(CONTAINER_PREFIX_RE, "").trim();
  return s;
}

function stripPrepPrefix(key: string): string {
  let s = key;
  let prev: string;
  do {
    prev = s;
    s = s.replace(PREP_WORD_RE, "").trim();
  } while (s !== prev && s.length > 0);
  return s || key;
}

function stripTrailingPrep(key: string): string {
  let s = key;
  let prev: string;
  do {
    prev = s;
    s = s.replace(TRAILING_PREP_RE, "").trim();
  } while (s !== prev && s.length > 0);
  return s || key;
}

function stripSizeAdj(key: string): string {
  return key.replace(SIZE_ADJ_RE, "").trim();
}

// Try all resolution strategies for one normalized key candidate.
function tryKey(candidate: string, termToSlug: Map<string, string>): string | undefined {
  // Direct
  let slug = termToSlug.get(candidate);
  if (slug) return slug;
  // Alias
  const aliased = resolveIngredientAlias(candidate);
  if (aliased !== candidate) {
    slug = termToSlug.get(aliased);
    if (slug) return slug;
    // Alias + trailing-s removal
    if (aliased.endsWith("s")) {
      slug = termToSlug.get(aliased.slice(0, -1));
      if (slug) return slug;
    }
  }
  // Trailing-s removal
  if (candidate.endsWith("s")) {
    slug = termToSlug.get(candidate.slice(0, -1));
    if (slug) return slug;
  }
  return undefined;
}

// Full multi-strategy match: returns WS0 slug or undefined.
// Resolution order (first match wins):
//   1. Exact normalised key
//   2. Qty-stripped key
//      a. + trailing prep stripped
//      b. + leading size adj stripped
//      c. + leading prep stripped
//      d. + trailing then leading prep stripped
//      e. + size adj then trailing prep stripped
//   3. Trailing prep stripped from original key
//      a. + leading prep stripped
//   4. Leading prep stripped from original key
function matchIngredientToSlug(raw: string, termToSlug: Map<string, string>): string | undefined {
  const key = normalizeIngredientKey(raw);

  // 1. Try original normalized key
  let slug = tryKey(key, termToSlug);
  if (slug) return slug;

  // 2. Strip quantity/unit prefix and retry
  const noQty = stripQuantityPrefix(key);
  if (noQty !== key) {
    slug = tryKey(noQty, termToSlug);
    if (slug) return slug;

    // 2a. Strip trailing prep from de-quantified form
    const noQtyTrail = stripTrailingPrep(noQty);
    if (noQtyTrail !== noQty) {
      slug = tryKey(noQtyTrail, termToSlug);
      if (slug) return slug;
    }

    // 2b. Strip leading size adjective from de-quantified form
    const noQtySize = stripSizeAdj(noQty);
    if (noQtySize !== noQty) {
      slug = tryKey(noQtySize, termToSlug);
      if (slug) return slug;
      // 2b-i. Size adj stripped + trailing prep
      const noQtySizeTrail = stripTrailingPrep(noQtySize);
      if (noQtySizeTrail !== noQtySize) {
        slug = tryKey(noQtySizeTrail, termToSlug);
        if (slug) return slug;
      }
    }

    // 2c. Strip leading prep words from de-quantified form (existing)
    const noQtyNoPrep = stripPrepPrefix(noQty);
    if (noQtyNoPrep !== noQty) {
      slug = tryKey(noQtyNoPrep, termToSlug);
      if (slug) return slug;
      // 2c-i. Leading prep stripped + trailing prep
      const noQtyNoPrepTrail = stripTrailingPrep(noQtyNoPrep);
      if (noQtyNoPrepTrail !== noQtyNoPrep) {
        slug = tryKey(noQtyNoPrepTrail, termToSlug);
        if (slug) return slug;
      }
    }

    // 2d. Trailing prep stripped + leading prep stripped (combined)
    if (noQtyTrail !== noQty) {
      const noQtyTrailPrep = stripPrepPrefix(noQtyTrail);
      if (noQtyTrailPrep !== noQtyTrail) {
        slug = tryKey(noQtyTrailPrep, termToSlug);
        if (slug) return slug;
      }
    }
  }

  // 3. Strip trailing prep from original key (handles "garlic cloves crushed" without qty)
  const noTrail = stripTrailingPrep(key);
  if (noTrail !== key) {
    slug = tryKey(noTrail, termToSlug);
    if (slug) return slug;
    // 3a. Trailing stripped + leading prep stripped
    const noTrailPrep = stripPrepPrefix(noTrail);
    if (noTrailPrep !== noTrail) {
      slug = tryKey(noTrailPrep, termToSlug);
      if (slug) return slug;
    }
    // 3b. Trailing stripped + size adj stripped (handles "small bunch X roughly chopped")
    const noTrailSize = stripSizeAdj(noTrail);
    if (noTrailSize !== noTrail) {
      slug = tryKey(noTrailSize, termToSlug);
      if (slug) return slug;
      // 3b-i. Also strip container prefix (handles "small bunch X" → "X")
      const noTrailSizeCont = noTrailSize.replace(CONTAINER_PREFIX_RE, "").trim();
      if (noTrailSizeCont !== noTrailSize) {
        slug = tryKey(noTrailSizeCont, termToSlug);
        if (slug) return slug;
        // 3b-ii. Then leading prep
        const noTrailSizeContPrep = stripPrepPrefix(noTrailSizeCont);
        if (noTrailSizeContPrep !== noTrailSizeCont) {
          slug = tryKey(noTrailSizeContPrep, termToSlug);
          if (slug) return slug;
        }
      }
    }
  }

  // 4. Strip leading prep words from original key (existing — no quantity prefix case)
  const noPrep = stripPrepPrefix(key);
  if (noPrep !== key) {
    slug = tryKey(noPrep, termToSlug);
    if (slug) return slug;
    // 4a. Leading prep stripped + trailing prep stripped
    const noPrepTrail = stripTrailingPrep(noPrep);
    if (noPrepTrail !== noPrep) {
      slug = tryKey(noPrepTrail, termToSlug);
      if (slug) return slug;
    }
  }

  // 5. Strip size adjective from original key ("small bunch basil" → "bunch basil" → "basil")
  const noSize = stripSizeAdj(key);
  if (noSize !== key) {
    slug = tryKey(noSize, termToSlug);
    if (slug) return slug;
    // 5a. Strip container prefix ("bunch basil" → "basil")
    const noSizeCont = noSize.replace(CONTAINER_PREFIX_RE, "").trim();
    if (noSizeCont !== noSize) {
      slug = tryKey(noSizeCont, termToSlug);
      if (slug) return slug;
      // 5b. Leading prep on top
      const noSizeContPrep = stripPrepPrefix(noSizeCont);
      if (noSizeContPrep !== noSizeCont) {
        slug = tryKey(noSizeContPrep, termToSlug);
        if (slug) return slug;
      }
    }
  }

  return undefined;
}

export interface IngredientKnowledgeSummary {
  nutrients: string[];
  benefits: string[];
}

/** Resolves raw ingredient strings to WS0 knowledge_food slugs.
 *  Returns a Map<rawIngredient, slug> for matched ingredients only.
 *  Used by meal food intelligence to look up food context (availability, seasons, origin). */
export async function resolveIngredientSlugs(
  rawIngredients: string[],
): Promise<Map<string, string>> {
  if (rawIngredients.length === 0) return new Map();
  const foods = await listFoods();
  const termToSlug = new Map<string, string>();
  for (const food of foods) {
    const register = (term: string) => {
      const key = normalizeIngredientKey(term);
      if (key && !termToSlug.has(key)) termToSlug.set(key, food.slug);
    };
    register(food.name);
    register(food.slug.replace(/-/g, " "));
    for (const alias of food.aliases) register(alias);
  }
  const result = new Map<string, string>();
  for (const raw of rawIngredients) {
    const slug = matchIngredientToSlug(raw, termToSlug);
    if (slug) result.set(raw, slug);
  }
  return result;
}

export async function resolveIngredientsToKnowledgeSummary(
  rawIngredients: string[],
): Promise<Record<string, IngredientKnowledgeSummary>> {
  if (rawIngredients.length === 0) return {};

  const foods = await listFoods();

  // Build lookup: normalised term → food slug.
  const termToSlug = new Map<string, string>();
  for (const food of foods) {
    const register = (term: string) => {
      const key = normalizeIngredientKey(term);
      if (key && !termToSlug.has(key)) termToSlug.set(key, food.slug);
    };
    register(food.name);
    register(food.slug.replace(/-/g, " "));
    for (const alias of food.aliases) register(alias);
  }

  // Match each ingredient using multi-strategy resolution (quantity strip, alias, prep strip).
  const ingredientToSlug = new Map<string, string>();
  const slugsNeeded = new Set<string>();

  for (const raw of rawIngredients) {
    const slug = matchIngredientToSlug(raw, termToSlug);
    if (slug) {
      ingredientToSlug.set(raw, slug);
      slugsNeeded.add(slug);
    }
  }

  if (slugsNeeded.size === 0) return {};

  // Fetch nutrients + benefits for each matched food.
  const foodKnowledge = new Map<string, IngredientKnowledgeSummary>();
  await Promise.all(
    Array.from(slugsNeeded).map(async (slug) => {
      const [nutrients, benefits] = await Promise.all([
        getNutrientsForFood(slug),
        getFoodBenefitsForDisplay(slug),
      ]);
      foodKnowledge.set(slug, {
        nutrients: nutrients.map((n) => n.nutrient.name),
        benefits: benefits.map((b) => b.benefit.name),
      });
    }),
  );

  // Build output keyed by original ingredient string.
  const result: Record<string, IngredientKnowledgeSummary> = {};
  Array.from(ingredientToSlug.entries()).forEach(([raw, slug]) => {
    const k = foodKnowledge.get(slug);
    if (k) result[raw] = k;
  });
  return result;
}
